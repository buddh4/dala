var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('application', {
      initial_templates : {panels:[ 'uml','simple','network', 'chart']}
  });
});

module.exports = router;
