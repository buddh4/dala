var express = require('express');
var router = express.Router();

var message = require('../core/message');

router.get('/ping', function(req, res) {
    console.log('got ping request');
    res.json(message.confirm());
});

module.exports = router;