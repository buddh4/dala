var Dialog = require('./dialog');
var client = require('../core/client');

var ClientSettingDialog = function() {
    resetBackendConnection();
    var that = this;
    this.dialog = new Dialog({
        dialogId : "#setting-dialog",
        triggerId : "#settingButton",
        buttons : {
            "Save": saveBackendConnection,
            "Test": runBackendConnectionTest,
            Cancel: function() {
                resetBackendConnection();
                that.close();
            }
        },
        close : resetBackendConnection,
        submit : function(evt) {
            evt.preventDefault();
            saveBackendConnection();
        }
    });
};

ClientSettingDialog.prototype.close = function() {
    this.dialog.close();
};

var saveBackendConnection = function() {
    client.set(getDialogBackendSettings());
};

var runBackendConnectionTest = function() {
    $('#backendConnectionTest').text('');
    var result = client.ping(getDialogBackendSettings());
    if(result) {
        $('#backendConnectionTest').css('color','green');
        $('#backendConnectionTest').text('Connection succeed !');
    } else {
        $('#backendConnectionTest').css('color','red');
        $('#backendConnectionTest').text('Could not connect !');
    }
};

var resetBackendConnection = function() {
    $('#backendhost').val(client.getSettings().host);
    $('#backendport').val(client.getSettings().port);
    $('#backendConnectionTest').text('');
};

var getDialogBackendSettings = function() {
    return {
        host : $('#backendhost').val(),
        port : $('#backendport').val()
    };
};

module.exports = ClientSettingDialog;