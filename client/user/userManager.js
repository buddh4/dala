var event = require('../core/event');
var object = require('../util/object');
var client = require('../core/client');
var Promise = require('bluebird');
var DalaError = require('../../common/error');

var PATH_LOGIN = '/user/login';
var SEL_LOGGED_OUT = '.loggedOut';
var SEL_LOGGED_IN = '.loggedIn';
var SEL_USER_LINK_TXT = '#user-link-text';

var user;

var init = function() {
    event.listen('user_loggedin', userLogin);
    event.listen('user_loggedout', userLogout);
    logoutHandler(true);
};

var login = function(email, password) {
    return new Promise(function(resolve, reject) {
        var values = {
            email : email,
            password : password
        };

        client.post(PATH_LOGIN, values, {
            success : function(response) {
                loggedInHandler(response.data.result);
                resolve(response.data.result);
            },
            error : function(error, errorCode) {
                switch(errorCode) {
                    case DalaError.CODES.USER_LOGIN_INCORRECT_PASSWORD:
                        event.trigger('error', 'Login failed: Invalid password!');
                        break;
                    case DalaError.CODES.USER_LOGIN_INVALID_EMAIL:
                        event.trigger('error', 'Login failed: Invalid email address.');
                        break;
                    default:
                        event.trigger('error', 'Login failed: Something went wrong, please try again later.');
                        break;

                }
                reject(error);
            },
            successMessage : 'Login was successful!'
        });
    });
};

var loggedInHandler = function(result) {
    $(SEL_LOGGED_OUT).hide();
    $(SEL_LOGGED_IN).show();
    $(SEL_USER_LINK_TXT).text(result.user.email);
    event.trigger('user_loggedin', result);
};

var logoutHandler = function(prevTrigger) {
    $(SEL_LOGGED_IN).hide();
    $(SEL_LOGGED_OUT).show();
    $(SEL_USER_LINK_TXT).text('');
    if(!prevTrigger) {
        event.trigger('user_loggedout');
    }
};

var userLogin = function(evt) {
    user = evt.data.user;
}

var isLoggedIn = function() {
    return object.isDefined(user);
}

var userLogout = function(evt) {
    delete user;
}

var getUserId = function() {
    if(user) {
        return user.id;
    }
    return '';
}

module.exports = {
    init: init,
    login : login,
    isLoggedIn : isLoggedIn,
    getUserId : getUserId
};