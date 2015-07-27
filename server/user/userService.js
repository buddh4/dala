var mongoose = require('mongoose');
var object = require('../util/object');
var bcrypt = require('bcryptjs');
var userModel = require('./userModel');
var message = require('../core/message');
var error = require('../core/error');
var async = require('async');

var Promise = require('bluebird');

var projectService = require('../project/projectService');

/**
 * Creates a new user profile with default project as promise.
 * A new user is created if the given email was not already in use. In such cases
 * @param email
 * @param username
 * @param rawPassword
 * @returns {bluebird|exports|module.exports}
 */
var createUserProfile = function(email, username, rawPassword) {
    return new Promise(function(resolve, reject) {
        // encrypt password
        var hash = bcrypt.hashSync(rawPassword, 10);

        var result = {};

        //Create User and default project
        new userModel.User({
            username: username,
            email: email,
            password: hash
        }).save()
            .then(function(user) {
                result.user = user;
                return _createDefaultProject(user);
            }, reject)
            .then(function(project) {
                result.project = project;
                resolve(result);
            }, reject);
    });
};

var _createDefaultProject = function(user) {
    return projectService.createProject(user, 'default', 'This is your default project used for backups and diagrams with no other project relation');
};

/**
 * Creates a user group for the given roles.
 * This function returns a promise.
 *
 * @param roles an array of roles in with role.userId (String or ObjectId of User) and role.roles ([String])
 * @returns {bluebird|exports|module.exports} Bluebird Promise for the resulting Group
 */
var createGroup = function(roles) {
    return new Promise(function(resolve, reject) {
        var userRoles = [];

        _createRoles(roles, function(error, result) {
            if(error) {
                reject(error);
            } else {
                userRoles = result;
            }
        });

        var group = new userModel.Group({
            roles: userRoles
        }).save().then(function(group) {
            resolve(group);
        }, function(error){
            reject(error);
        });
    });
};

/**
 * Creates the userRoles for the individual user/role mappings.
 * @param roles the array of roles with role.uderId (String or ObjectId of User) role.roles ([String])
 * @param callback the callback with error and result parameters.
 * @private
 */
var _createRoles = function(roles, callback) {
    async.map(roles, _createUserRole, callback);
}

/**
 * Creates a single userRole mapping
 * @param role
 * @param callback
 * @returns {*}
 */
var _createUserRole = function(role, callback) {
    var userId = role.userId;

    if(object.isString(userId)) {
        userId = mongoose.Types.ObjectId(userId);
    }

    return new userModel.UserRole({
        user: userId,
        roles: role.roles
    }).save().then(function(userRole) {
            callback(null, userRole);
        }, function(err) {
            callback(err, userRole);
        });
};


var loginUser = function(email, password) {
    return new Promise(function(resolve, reject) {
        var result = {};
        getUserByEmail(email)
            .then(function(user){
                return new Promise(function (resolve, reject) {
                    if(bcrypt.compareSync(password, user.password)) {
                        resolve(user);
                    } else {
                        throw new error.APPError("Incorrect email and or password!");
                }});
            }).then(function(user) {
                result.user = user;
                return projectService.getProjectsByUserId(user._id);
            }).then(function(projects) {
                result.projects = projects;
                resolve(result);
            }).catch(function(e) {
                reject(e);
            });
    });
};

var getUserByEmail = function(email) {
    return new Promise(function (resolve, reject) {
        userModel.User.findOne({ email: email }, 'id username email password', function(err, user) {
            if(err) {
                throw new error.DBError("Error while loading user by email!", err);
            }else if(!user) {
                throw new error.APPError("Incorrect email and or password!");
            } else  {
                resolve(user);
            }
        });
    });
};

/**
 * Given a user object:
 *
 *  - Store the user object as a req.user
 *  - Make the user object available to templates as #{user}
 *  - Set a session cookie with the user object
 *
 *  @param {Object} req - The http request object.
 *  @param {Object} res - The http response object.
 *  @param {Object} user - A user object.
 */
var createUserSession = function(req, res, user) {
    var cleanUser = {
        id: user._id.toString(),
        username: user.username,
        email:      user.email
    };

    req.session.user = cleanUser;
    req.user = cleanUser;
    res.locals.user = cleanUser;
};

/**
 * A simple authentication middleware for Express.
 *
 * This middleware will load users from session data, and handle all user
 * proxying for convenience.
 */
var auth = function(req, res, next) {
    if(req.session && req.session.user) {
        req.user = req.session.user;
        next();
        /**models.User.findOne({ email: req.session.user.email }, function(err, user) {
            if (user) {
                createUserSession(req, res, user);
            }
        next();
        });*/
    } else {
        next();
    }
};

/**
 * Ensure a user is logged in before allowing them to continue their request.
 *
 * If a user isn't logged in, they'll be redirected back to the login page.
 */
var requireLogin = function(req, res, next) {
    if (!req.user) {
        res.json(message.error('User login required!', 401));
    } else {
        next();
    }
};

module.exports = {
    createUserProfile: createUserProfile,
    createUserSession: createUserSession,
    auth : auth,
    requireLogin : requireLogin,
    createGroup:createGroup,
    loginUser:loginUser
};
