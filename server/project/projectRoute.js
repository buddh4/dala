/**
 * Created by buddha on 21.07.2015.
 */
var bcrypt = require('bcryptjs');
var express = require('express');

var userModels = require('../user/userModel');

var userService = require('../user/userService');

var message = require('../core/message');

var fs = require('fs');

var path = require('path');

var router = express.Router();
router.use(userService.requireLogin);


/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.post('/save', function(req, res) {
    if(req.body.diagram) {
        try {
            var data = req.body.diagram;
            var diagramId = req.body.diagramId;
            var fileName = diagramId+'_'+req.user.id+'_'+Date.now()+'.svg';
            var filePath = path.join(__dirname, '../../uploads', fileName);
            console.log(filePath);
            fs.writeFile(filePath, data, function(err) {
                if(err) {
                    return console.log(err);
                }

                res.json(message.confirm());
            });
       } catch(error) {
           console.error(error);
           res.json(message.error("File could not be saved!"));
       }
    }
});

module.exports = router;
