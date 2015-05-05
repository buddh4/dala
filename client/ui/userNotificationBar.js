var object = require('../util/object');
var event = require('../core/event');

var CONTAINER_SELECTOR = '#notifications';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);

var log = {};

var initListener = function() {
    event.listen('info', info);
    event.listen('warn', warn);
    event.listen('error', error);
    event.listen('command_add', clear);
    event.listen('command_execute', clear);
};

var info = function(evt) {
    infoNotification(evt, 'info');
};

var warn = function(evt) {
    infoNotification(evt, 'warn');
};

var error = function(evt) {
    infoNotification(evt, 'error');
};

var infoNotification = function(evt, type) {
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
    showInfo(msg, type);
};

var showInfo = function(msg,type) {
    clear();
    $CONTAINER_NODE.html('<b class="'+type+'">'+type.toUpperCase()+': '+msg+'</b>');
};

var clear = function() {
    $CONTAINER_NODE.html('');
};



module.exports.init = function() {
    clear();
    initListener();
};