var Dialog = require('./dialog');
var client = require('../core/client');

var dialog;

var RegisterDialog = function() {
    reset();
    dialog = new Dialog({
        dialogId : "#register-dialog",
        triggerId : "#registerButton",
        buttons : {
            "Register":register,
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
};

var close = function() {
    dialog.close();
};

var register = function() {
    client.post('/user/register', getDialogValues(), {
        async : false,
        success : function(response) {
            close();
        },
        error : function(status, error) {
            close();
        },
        errorMessage : {
            'default':'Registration Failed, please try again later or check your backend connection settings!',
            '2':'Email already in use!'
        },
        successMessage : 'Registration was successful!'
    });
};

var reset = function() {
    $('#reg_userName').val('');
    $('#reg_email').val('');
    $('#reg_password').val('');
};

var getDialogValues = function() {
    return {
        username : $('#reg_userName').val(),
        email : $('#reg_email').val(),
        password : $('#reg_password').val()
    };
};

module.exports = RegisterDialog;