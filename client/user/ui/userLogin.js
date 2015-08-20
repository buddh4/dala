var event = require('../../core/event');
var Dialog = require('./../../ui/dialog');

var userManager = require('../userManager');

var loginDialog;

var init = function() {

    loginDialog = new Dialog({
        dialogId : "#login-dialog",
        triggerId : "#loginButton",
        cancelButton : true,
        resetOnClose : true,
        submitLabel : 'Login',
        submit : login
    });
}

var login = function() {
    userManager.login($('#login_email').val(), $('#login_pw').val())
        .then(function(result) {
            loginDialog.close();
        }, function(err) {
            loginDialog.shake();
        });
};

module.exports = {
    init: init
}