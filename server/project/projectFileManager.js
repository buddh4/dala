var fs = require("fs");
var path = require('path');

var Promise = require('bluebird');

var PATH_PROJECTS_ROOT =  path.join(__dirname, '../../projects/');

var getProjectPath = function(projectId) {
    return path.join(PATH_PROJECTS_ROOT, projectId);
}

var initProjectFiles = function(project) {
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
};

var saveDiagramData = function(diagramId, userId, title) {
    return new Promise(function(resolve, reject) {
        var filePath = _createDiagramPath(diagramId.toString, userId.toString(), title);
        fs.writeFile(filePath, data, function (err) {
            if (err) {
                reject(err);
            }

            resolve(filePath);
        });
    });
};

var _createDiagramPath = function(diagramId, userId, title) {
    var fileName = diagramId+'_'+title+'_'+userId+'_'+Date.now()+'.svg';
    return path.join(__dirname, '../../projects',projectId, fileName);
};

module.exports = {
    initProjectFiles : initProjectFiles,
    saveDiagramData : saveDiagramData
}