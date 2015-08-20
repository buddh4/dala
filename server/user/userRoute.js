/**
 * Created by buddha on 21.07.2015.
 */
var express = require('express');

var userModels = require('./userModel');

var userService = require('./userService');

var message = require('../core/message');

var error = require('../../common/error');

var router = express.Router();

/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.post('/register', function(req, res) {
    userService.createUserProfile(req.body.email, req.body.username, req.body.password)
        .then(function(result) {
            res.json(message.confirm());
        }, function(error) {
            console.error(error);
            res.json(message.error(error));
        });
});

/**
 * Log a user into their account.
 */
router.post('/login', function(req, res) {
    userService.loginUser(req.body.email, req.body.password)
        .then(function(result) {
            _createUserSession(req, res, result.user);

            //Use the clean session user without password for the result
            result.user = req.user;
            res.json(message.confirm(result));
        }, function(err) {
            console.error(err);
            res.json(message.error(err));
        });
});

/**
 * Given a user object:
 *
 *  - Store the user object as a req.user
 *  - Make the user object available to templates as #{user}
 *  - Set a session cookie with the user object
 *
 *  @param {Object} req - The http request object.
 *  @param {Object} res - The http response object.
 *  @param {Object} user - A user object.
 */
var _createUserSession = function(req, res, user) {
    var cleanUser = {
        id: user._id.toString(),
        username: user.username,
        email:      user.email
    };

    req.session.user = cleanUser;
    req.user = cleanUser;
    res.locals.user = cleanUser;
};

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
