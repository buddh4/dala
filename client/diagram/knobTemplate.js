require('./template');
require('./node');
var templateMgr = require('./templateManager');

templateMgr.registerTemplate('knob_circle', {
    description : "Circle docking template.",
    dockingType : "CENTER",
    fill : "green",
    'fill-opacity':'0.5',
    radius : 3,
    stroke: '#7C7C7C',
    'stroke-width': '1',
    preventSelection : true,
    rootName : 'circle',
    svg : '<circle cx="0" cy="0" r="{radius}" id="{node_id}" class="docking" style="stroke-width:{stroke-width};stroke:{stroke};fill:{fill};fill-opacity:{fill-opacity};" transform="translate({x} {y})"></circle>'
});
