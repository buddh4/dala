$ = jQuery = require('jquery');
require('./ui/jqueryPlugins');
require('./svg/draggable');

if(!window.dala) {
    dala = {};
}

if(!window.dala.svg) {
    dala.SVG = require('./svg/svg');
}
