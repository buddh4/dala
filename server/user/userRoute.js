/**
 * Created by buddha on 21.07.2015.
 */
var express = require('express');

var userModels = require('./userModel');

var userService = require('./userService');

var message = require('../core/message');

var error = require('../core/error');

var router = express.Router();

/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.post('/register', function(req, res) {
    userService
        .createUserProfile(req.body.email, req.body.username, req.body.password)
        .then(function(result) {
            res.json(message.confirm());
        }, function(error) {
            console.error(error);
            if(error.code === 11000) {
                res.json(message.error('Email already in use!', 2));
            } else {
                res.json(message.error('Unknown error while creating new user!'));
            }
        }).catch(function(error) {
            res.json(message.error('Unknown error while creating new user!'));
        });
});

/**
 * Log a user into their account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.post('/login', function(req, res) {
    userService.loginUser(req.body.email, req.body.password)
        .then(function(result) {
            userService.createUserSession(req, res, result.user);

            //Use the clean session user without password for the result
            result.user = req.user;
            res.json(message.confirm(result));
        }, function(err) {
            console.error(err);
            res.json(message.error(error.message));
        });

});

/**
 * Log a user out of their account, then redirect them to the home page.
 */
router.get('/logout', function(req, res) {
    if (req.session) {
        req.session.reset();
    }
    res.json(message.confirm());
    res.redirect('/');
});

module.exports = router;
