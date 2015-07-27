var event = require('../core/event');
var object = require('../util/object');
var user;

var init = function() {
    event.listen('user_loggedin', userlogin);
    event.listen('user_loggedout', userlogout);
}

var userlogin = function(evt) {
    user = evt.data;
}

var isLoggedIn = function() {
    return object.isDefined(user);
}

var userlogout = function(evt) {
    delete user;
}

module.exports = {
    init: init,
    isLoggedIn : isLoggedIn
};