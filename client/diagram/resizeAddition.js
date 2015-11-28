var object = require('../util/object');
var Resize = require('./resize');

var ResizeAddition = function(node) {
    this.node = node;
    this.resize = new Resize(this.node, this.node.diagram);
};

ResizeAddition.prototype.resizeNode = function(dx, dy) {
    //This is the api way to resize a node we imitate the dragevent.
    this.resize.updateNodes(dx,dy);
    this.resize.dragKnob = 4; //We set the KNOB_SE knob as dragKnob for the redo command
    this.resize.dx = dx;
    this.resize.dy = dy;
    this.node.event.trigger('node_resized', this.node);
};

ResizeAddition.prototype.select = function() {
    this.resize.activateKnobs();
};

ResizeAddition.prototype.deselect = function() {
    this.resize.removeKnobs();
};

ResizeAddition.prototype.remove = function() {
    this.deselect();
};

ResizeAddition.prototype.dragMove = function() {
    this.resize.updateKnobs();
};

ResizeAddition.prototype.edit = function() {
    this.resize.update();
};

ResizeAddition.prototype.update = function() {
    //TODO: Through EVENTS !
    this.resize.updateKnobs();
};

ResizeAddition.prototype.activate = function() {
    this.resize.updateNodes();
};

ResizeAddition.prototype.get = function() {
    return this.resize;
};

ResizeAddition.requireConfig = true;

module.exports = ResizeAddition;