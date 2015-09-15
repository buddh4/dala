require('./template');
require('./node');
var templateMgr = require('./templateManager');

templateMgr.registerTemplate('docking_circle', {
    description : "Circle docking template.",
    dockingType : "CENTER",
    color_main : "green",
    radius : 3,
    preventSelection : true,
    rootName : 'circle',
    svg : '<circle cx="0" cy="0" r="{radius}" id="{node_id}" class="docking" style="stroke:none;fill:{color_main};fill-opacity:1.0;" transform="translate({x} {y})"></circle>'
});
