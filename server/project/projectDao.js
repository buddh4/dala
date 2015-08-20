var Promise = require('bluebird');
var mongoose = require('mongoose');
var projectModel = require('./projectModel');
var dbUtil = require('../util/db');
var DalaError = require('../../common/error');

var Project = projectModel.Project;
var Diagram = projectModel.Diagram;

var createProject = function(user, title, description, rolesArr) {
    return new Project({
        title : title,
        description : description,
        user : [{user_id: dbUtil.getObjectId(user), roles: rolesArr}]
    }).save();
}

var findProjectsByUserId = function(user) {
    return new Promise(function(resolve, reject) {
        Project.find({'user.user_id': dbUtil.getObjectId(user)}, 'id title description', function (err, projects) {
            if (err) {
                reject(new DalaError('Unknown error while searching projects by userid!', DalaError.CODES.UNKNOWN_DB_ERROR, err));
            } else {
                resolve(projects);
            }
        });
    });
};

module.exports = {
    findProjectsByUserId : findProjectsByUserId,
    createProject : createProject
}