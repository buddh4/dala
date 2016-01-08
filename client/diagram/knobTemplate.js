require('./template');
require('./node');
var object = require('../util/object');

var templateMgr = require('./templateManager');

var defaultConfig = {
    dockingType: "CENTER",
    fill: "silver",
    'fill-active': 'green',
    'fill-opacity': '0.5',
    radius: 5,
    stroke: '#7C7C7C',
    'stroke-width': '1',
    'cssClass': 'knob',
    preventSelection: true
};

var circleConfig = object.extend({}, defaultConfig,
    {
        svg :'<circle cx="0" cy="0" r="{radius}" id="{node_id}" class="{cssClass}" style="stroke-width:{stroke-width};stroke:{stroke};fill:{fill};fill-opacity:{fill-opacity};" transform="translate({x} {y})"></circle>'
    });

templateMgr.registerTemplate('knob_circle', circleConfig);

var rectConfig = object.extend({}, defaultConfig,
    {
        svg :'<rect x="0" y="0" id="{node_id}" height="{size}" width="{size}" class="{cssClass}" style="stroke-width:{stroke-width};stroke:{stroke};fill:{fill};fill-opacity:{fill-opacity};" transform="translate({x} {y})"></rect>'
    });

templateMgr.registerTemplate('knob_rect', rectConfig);