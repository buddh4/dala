// Init initial browser dependencies
// Global jQuery
$ = jQuery = require('jquery');
require('jquery-ui');

require('./ui/jqueryPlugins');

//jquery-ui / bootstrap conflicts
$.widget.bridge('uibutton', $.ui.button);
$.widget.bridge('uitooltip', $.ui.tooltip);

require('jstree');

require('bootstrap');

if($.fn.button.noConflict) {
    $.fn.bootstrapBtn = $.fn.button.noConflict();
}

//INIT GLOBAL DALA
dala = {};

var globalModules =  {
    'templateManager': require('./diagram/templateManager')
};

dala.require = function(id) {
    return globalModules[id];
};

// Init core modules
var config = require('./core/config');
var Diagram = require('./diagram/diagram');
var event = require('./core/event');

require('./user/userManager').init();
require('./project/projectManager').init();

// Init UI modules
require('./ui/gui');


config.debug(true);


require('./diagram/diagramManager');

//TODO: move this to a controller !
$(window).bind('mousewheel DOMMouseScroll', function(evt){
    if(!evt.ctrlKey) {
        return;
    }

    evt.preventDefault();

    if (evt.originalEvent.wheelDelta > 0 || evt.originalEvent.detail < 0) {
        event.trigger('view_zoomIn');
    }
    else {
        event.trigger('view_zoomOut');
    }
});

var stageFocus = false;

$('html').on('mousedown', function() {
    stageFocus = false;
});

//TODO: check other key events for stageFocus
$(document).on('click', '.svgStage', function(evt) {
    stageFocus = true;
    evt.stopPropagation();
});

event.on(document, 'keydown', function(e) {
    e.mouse = event.mouse();
    //console.log('keypress: '+e.keyCode);
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
            if(e.ctrlKey && !isTextSelected()) {
                event.trigger('key_copy_press', {}, e);
            }
            break;
        case 83: //s
            if(e.ctrlKey) {
                e.preventDefault();
                event.trigger('key_save_press', {}, e);
            }
            break;
        case 86: //v
            if(e.ctrlKey && stageFocus) {
                e.preventDefault();
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
                event.trigger('key_undo_press', {}, e);
            }
            break;
        case 187:
            if(e.ctrlKey) {
                e.preventDefault();
                event.trigger('view_zoomIn');
            }
            break;
        case 189:
            if(e.ctrlKey) {
                e.preventDefault();
                event.trigger('view_zoomOut');
            }
            break;
    }
});

var isTextSelected = function() {
    var selection =  window.getSelection();
    return selection && selection.toString().length > 0;
}

//TODO: move this in gui with diagram handler...

event.trigger('tab_new');
event.trigger('app_start');
event.trigger('info', 'Application started successfully!');