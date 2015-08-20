var mongoose = require('mongoose');
var dbUtil = require('../util/db');

var projectModel = require('./projectModel');

var Diagram = projectModel.Diagram;

var findDiagramById = function(diagramId) {
    return new Promise(function(resolve, reject) {
        Diagram.find({'_id': dbUtil.getObjectId(diagramId)}, function (err, projects) {
            if (err) {
                reject(err);
            } else {
                resolve(projects);
            }
        });
    });
};

var findDiagramByClientId = function(clientId, project) {
    return new Promise(function(resolve, reject) {
        Diagram.findOne({'clientId': clientId, 'user.user_id': dbUtil.getObjectId(project)}, function (err, projects) {
            if (err) {
                reject(err);
            } else {
                resolve(projects);
            }
        });
    });
};

var createDiagram = function(user, clientId, project, title, description, rolesArr) {
    return new Diagram({
        project : dbUtil.getObjectId(project),
        title : title,
        description : description,
        user : [{user_id: dbUtil.getObjectId(user), roles: rolesArr}]
    }).save();
};

module.exports = {
    findDiagramById : findDiagramById,
    findDiagramByClientId : findDiagramByClientId,
    createDiagram : createDiagram
}