/**
 * Created by buddha on 21.07.2015.
 */
var bcrypt = require('bcryptjs');
var express = require('express');

var message = require('../core/message');

var fs = require('fs');

var path = require('path');

var router = express.Router();

/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.get('/panel/:panel_id', function(req, res) {
    var panelId = req.params.panel_id;
    var filePath = path.join(__dirname + '/../../templates', panelId+'.html');

    console.log(filePath);

    try{
        fs.statSync(filePath);
        res.sendFile(filePath);
    }catch(err){
        res.json(message.error('Panel definition not found for template panel id: '+panelId));
    }

});

module.exports = router;
