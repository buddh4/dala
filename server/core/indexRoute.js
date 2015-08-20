var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('application', {
      //TODO: check user settings
      initial_templates : {panels:[{id: 'uml', label:'UML'}, {id:'simple', label:'Simple'}, {id:'communication', label:'Communication'}]}
  });
});

module.exports = router;
