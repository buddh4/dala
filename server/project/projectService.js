var projectDao = require('./projectDao');
var diagramDao = require('./diagramDao');
var projectFileManager = require('./projectFileManager');

var Promise = require('bluebird');

var ROLE_CREATOR = 'creator';
var ROLE_ADMIN = 'admin';

var createProject = function(user, title, description) {
    return projectDao.createProject(user, title, description, [ROLE_CREATOR, ROLE_ADMIN])
            .then(projectFileManager.initProjectFiles, reject);
};

var getDiagramById = function(diagramId) {
    return diagramDao.findDiagramById(diagramId);
};

var saveDiagram = function(user, clientId, data, projectId, title, description) {
    return new Promise(function(resolve, reject) {
        diagramDao.findDiagramByClientId(clientId, projectId)
            .then(function (diagram) {
                if (!diagram) {
                    diagramDao.createDiagram(user, clientId, projectId, title, description, [ROLE_CREATOR])
                        .then(function(diagram) {
                            projectFileManager.saveDiagramData(diagram._id, data, user._id, diagram.title)
                                .then(resolve, reject);
                        }, reject);
                } else {
                    projectFileManager.saveDiagramData(diagram._id.toString(), user._id.toString(), diagram.title)
                        .then(resolve, reject);
                }
            }, function(err) {
                reject(err);
            });
    });
};

var _createProjectFiles = function(project) {
    return projectFileManager.initProjectFiles();
}

var getProjectsByUserId = function(userId) {
    return projectDao.findProjectsByUserId(userId);
};

module.exports = {
    createProject : createProject,
    saveDiagram : saveDiagram,
    getProjectsByUserId : getProjectsByUserId
}