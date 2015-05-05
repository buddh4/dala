// Init initial browser dependencies
// Global jQuery
$ = jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
var config = require('./core/config');
var Diagram = require('./diagram/diagram');
var CommandManager = require('./core/commandManager');

// Init core modulesF
var event = require('./core/event');
//var config = require('./core/config');

// Init UI modules
require('./ui/gui');


config.debug(true);

// Init Diagram
// TODO: try loading user data app state from local storage or remote
// TODO: use document / project model instead of diagram
var diagram = new Diagram();
new CommandManager();

mouse = {};

event.on(document, 'mousemove', function(e) {
    mouse.pageX = e.pageX;
    mouse.pageY = e.pageY;

});

event.on(document, 'keydown', function(e) {
    e.mouse = mouse;
    switch(e.keyCode) {
        case 13: //ENTER
            event.trigger('key_enter_press', {}, e);
            break;
        case 38: //UP
            event.trigger('key_up_press', {}, e);
            break;
        case 40: //DOWN
            event.trigger('key_down_press', {}, e);
            break;
        case 46: //DELETE
            event.trigger('key_del_press', {}, e);
            break;
        case 67: //c
            if(e.ctrlKey) {
                event.trigger('key_copy_press', {}, e);
            }
            break;
        case 86: //v
            if(e.ctrlKey) {
                event.trigger('key_paste_press', {}, e);
            }
            break;
        case 89: //y
            if(e.ctrlKey) {
                event.trigger('key_redo_press', {}, e);
            }
            break;
        case 90: //z
            if(e.ctrlKey) {
                event.trigger('key_unddo_press', {}, e);
            }
            break;
    }
});

//TODO: move this in gui with diagram handler...
var XMLDialog = require('./ui/xmlView');
new XMLDialog(diagram);

event.trigger('app_start');
event.trigger('info', 'Application started successfully! Either login or use the editor for a standalone session.');