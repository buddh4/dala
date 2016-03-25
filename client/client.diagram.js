require('./ui/jqueryPlugins');
require('./svg/draggable');

if(!window.dala) {
    dala = {};
}

dala_env = window.dala_env || {};
dala_env.initial_templates = {};


var event = require('./core/event');

//TODO: better namespace handling... export to module
var globalModules =  {
    'templateManager': require('./diagram/templateManager'),
    'diagramManager': require('./diagram/diagramManager'),
    'additions': require('./diagram/additions'),
    'config': require('./core/config'),
    'fileManager': require('./core/fileManager'),
    'event' : require('./core/event')
};

dala.require = function(id) {
    return globalModules[id];
};



if(!window.dala.SVG) {
    window.dala.SVG = require('./svg/svg');
}

if(!window.dala.Diagram) {
    window.dala.Diagram = require('./diagram/diagram');
}


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

//TODO: Check redundancy with client.all...

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

