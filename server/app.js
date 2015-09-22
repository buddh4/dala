var mongoose = require('mongoose');
var express = require('express');
var session = require('client-sessions');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var userService = require('./user/userService');
var db = require('./core/db');
//var favicon = require('serve-favicon');

//Database Connection
db.connect().then(function() {
  console.log('DB connection established');
}, function(err) {
  console.error('ERROR: Could not connect to database.');
});

var app = express();

// view engine setup we do not use jade but we have to set a view engine here
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
    'json': function(context) {
      return JSON.stringify(context);
    }
  }
}));

app.set('view engine', 'handlebars');

//Session Setting
app.use(session({
  cookieName: 'session',
  secret: 'fjlka973bbj3k24kj5fk2h2h3ghj2qio2994ghj31ggj2kgfd2',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly : true
  //secure : true,
  //ephemeral : true
}));

//User authentication mechanism
app.use(userService.auth);



// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));


// routes
app.use('/', require('./core/indexRoute'));
app.use('/user', require('./user/userRoute'));
app.use('/service', require('./core/serviceRoute'));
app.use('/project', require('./project/projectRoute'));
app.use('/template', require('./template/templateRoute'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
