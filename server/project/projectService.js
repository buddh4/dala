var mongoose = require('mongoose');
var projectModel = require('./projectModel');
var Project = projectModel.Project;

var Promise = require('bluebird');
var fs = require("fs");
var path = require('path');

var object = require('../util/object');

var ROLE_CREATOR = 'creator';
var ROLE_ADMIN = 'admin';

var createProject = function(user, title, description) {
    return new Promise(function(resolve, reject) {
        new Project({
            title : title,
            description : description,
            user : [{user_id: user._id, roles: [ROLE_CREATOR, ROLE_ADMIN]}]
        }).save()
            .then(_createProjectFiles, reject)
            .then(resolve, reject);
    });
};

var _createProjectFiles = function(project) {
    return new Promise(function(resolve, reject) {
        var dirPath = path.join(__dirname, '../../projects/'+project._id.toString());
        fs.mkdir(dirPath, function (err) {
            if(err) {
                reject(err);
            } else {
                resolve(project);
            }
        });
    });
}

var getProjectsByUserId = function(userId) {
    userId = (object.isString(userId))? mongoose.Types.ObjectId(userId) : userId;
    return new Promise(function(resolve, reject) {
        Project.find({ 'user.user_id' : userId }, 'id title description', function(err, projects) {
            if(err) {
                reject(err);
            } else {
                resolve(projects);
            }
        });
    });
};

module.exports = {
    createProject : createProject,
    getProjectsByUserId : getProjectsByUserId
}