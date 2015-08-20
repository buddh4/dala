var object = require('../util/object');
var event = require('../core/event');

var log = {};

var initListener = function() {
    event.listen('info', info);
    event.listen('warn', warn);
    event.listen('error', error);
    event.listen('command_add', clear);
    event.listen('command_execute', clear);
};

var info = function(evt) {
    infoNotification(evt, 'info', 10000);
};

var warn = function(evt) {
    infoNotification(evt, 'warn');
};

var error = function(evt) {
    infoNotification(evt, 'error');
};

var infoNotification = function(evt, type, closeAfter) {
    var msg;
    if(!evt.data) {
        return;
    }

    if(object.isString(evt.data)) {
        msg = evt.data;
    } else {
        msg = evt.data.message;
    }

    //TODO: do something with this log and clear it after a defined size :)
    log[Date.now()] = msg;
    showInfo(msg, type, closeAfter);
};

var showInfo = function(msg,type, closeAfter) {
    clear();
    $('body').growl({ title: type, text: msg, growlClass: type, closeAfter: closeAfter });
};

var clear = function() {
    if($('body').data('ui-tooltip')) {
        $('body').uitooltip('close');
    }
};

module.exports.init = function() {
    initListener();
};