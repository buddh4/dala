require('./ui/jqueryPlugins');
require('./svg/draggable');

if(!window.dala) {
    dala = {};
}

dala_env = window.dala_env || {};
dala_env.initial_templates = {};

//TODO: better namespace handling... export to module
var globalModules =  {
    'templateManager': require('./diagram/templateManager')
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

