var Promise = require('bluebird');
var mongoose = require('mongoose');
var object = require('../util/object');
var bcrypt = require('bcryptjs');
var userModel = require('./userModel');
var DalaError = require('../../common/error');

var createUser = function(email, username, rawPassword) {
    var hash = bcrypt.hashSync(rawPassword, 10);
    var result = {};

    //Create User and default project
    return new userModel.User({
        username: username,
        email: email,
        password: hash
    }).save()
};

var getUserByEmail = function(email) {
    return new Promise(function (resolve, reject) {
        userModel.User.findOne({ email: email }, 'id username email password', function(err, user) {
            if(err) {
                reject(new DalaError('Unknown error while searching user by email!', DalaError.CODES.UNKNOWN_DB_ERROR, err));
            } else {
                resolve(user);
            }
        });
    });
};

module.exports = {
    createUser : createUser,
    getUserByEmail : getUserByEmail
};