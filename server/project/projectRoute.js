/**
 * Created by buddha on 21.07.2015.
 */
var bcrypt = require('bcryptjs');
var express = require('express');

var userModels = require('../user/userModel');

var userService = require('../user/userService');

var projectService = require('./projectService');

var message = require('../core/message');

var fs = require('fs');

var path = require('path');

var router = express.Router();

router.use(userService.requireLogin);

router.post('/saveDiagram', function(req, res) {
    //todo: security test user -> diagram rights
    if(req.body.diagram) {
        try {
            var data = req.body.diagram;
            var clientId = req.body.diagramId;
            var projectId = req.body.projectId;
            var title = req.body.title;
            var description = req.body.description;

            projectService.saveDiagram(req.session.user, clientId, data, projectId, title, description)
                .then(function() {
                    res.json(message.confirm());
                }, function(err) {
                    res.json(message.error(err));
                });

        } catch(error) {
            console.error(error);
            res.json(message.error("File could not be saved!"));
        }
    }
});

router.post('/createProject', function(req, res) {
    if(req.body.title) {
        try {
            var title = req.body.title;
            var description = req.body.description;
            var user = req.session.user;
            projectService.createProject(user, title, description)
                .then(function(project) {
                    res.json(message.confirm(project));
                }, function(err) {
                    res.json(message.error(err));
                });
        } catch(error) {
            res.json(message.error(error));
        }
    }
});

module.exports = router;
