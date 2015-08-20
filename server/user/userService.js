var Promise = require('bluebird');
var DalaError = require('../../common/error');
var message = require('../core/message');
var bcrypt = require('bcryptjs');

var userDao = require('./userDao');
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
        var result = {};

        //Create User and default project
        userDao.createUser(email, username, rawPassword)
            .then(function(user) {
                result.user = user;
                return _createDefaultProject(user);
            }, function(err) {
                if(error.code === DalaError.CODES.DB_DUPLICATE) {
                    reject(new DalaError('Email already registered!', DalaError.CODES.DB_DUPLICATE, err));
                } else {
                    reject(new DalaError('An unknown error occured while creating user!', DalaError.CODES.UNKNOWN_APP_ERROR, err));
                }
            })
            .then(function(project) {
                result.project = project;
                resolve(result);
            }, reject);
    });
};

var _createDefaultProject = function(user) {
    return projectService.createProject(user, 'default', 'This is your default project used for backups and diagrams with no other project relation.');
};

var loginUser = function(email, password) {
    return new Promise(function(resolve, reject) {
        var result = {};
        userDao.getUserByEmail(email)
            .then(function(user){
                return _checkUserLogin(user, password);
            }, reject)
            .then(function(user) {
                result.user = user;
                return projectService.getProjectsByUserId(user._id);
            }, reject)
            .then(function(projects) {
                result.projects = projects;
                resolve(result);
            }, reject);
    });
};

var _checkUserLogin = function(user, loginPassword) {
    return new Promise(function (resolve, reject) {
        if(!user) {
            reject(new DalaError("Incorrect email!", DalaError.CODES.USER_LOGIN_INVALID_EMAIL));
        } else if(!bcrypt.compareSync(loginPassword, user.password)) {
            reject(new DalaError("Incorrect password!", DalaError.CODES.USER_LOGIN_INCORRECT_PASSWORD));
        } else {
            resolve(user);
    }});
}

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
    auth : auth,
    requireLogin : requireLogin,
    loginUser:loginUser
};
