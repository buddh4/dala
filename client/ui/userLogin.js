var event = require('../core/event');
var client = require('../core/client');
var Dialog = require('./dialog');

var SEL_LOGGED_OUT = '.loggedOut';
var SEL_LOGGED_IN = '.loggedIn';
var SEL_USER_LINK_TXT = '#user-link-text';

var loginDialog;

var init = function() {
    logoutHandler();

    loginDialog = new Dialog({
        dialogId : "#login-dialog",
        triggerId : "#loginButton",
        buttons : {
            "Login": login,
            Cancel: function() {
                reset();
                close();
            }
        },
        close : reset,
        submit : function(evt) {
            evt.preventDefault();
        }
    });
}

var login = function() {
    var values = getDialogValues();
    client.post('/user/login', values, {
        async : false,
        success : function(response) {
            loggedInHandler(response.data.result);
            close();
        },
        error : function(status, error) {
            close();
        },
        errorMessage : 'Login Failed, please try again or check your backend connection settings !',
        successMessage : 'Login was successful !'
    });
}

var getDialogValues = function() {
    return {
        email : $('#login_email').val(),
        password : $('#login_pw').val()
    };
};

var close = function() {
    loginDialog.close();
};

var reset = function() {
    $('#login_email').val('');
    $('#login_pw').val('');
}

var loggedInHandler = function(values) {
    $(SEL_LOGGED_OUT).hide();
    $(SEL_LOGGED_IN).show();
    $(SEL_USER_LINK_TXT).text(values.email);
    event.trigger('user_loggedin', values);
};

var logoutHandler = function() {
    $(SEL_LOGGED_IN).hide();
    $(SEL_LOGGED_OUT).show();
    $(SEL_USER_LINK_TXT).text('');
    event.trigger('user_loggedout');
};

module.exports = {
    init: init
}