var object = require('../util/object');
var Resize = require('./resize');

var ResizeAddition = function(node) {
    this.node = node;
    this.node.additions.resize = this;
    this.resize = new Resize(this.node, this.node.diagram);
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

ResizeAddition.prototype.drag = function() {
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

ResizeAddition.prototype.contentChanged = function() {
    this.resize.update();
};

ResizeAddition.prototype.get = function() {
    return this.resize;
};

module.exports = ResizeAddition;