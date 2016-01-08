var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGRect = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'rect', svgRoot, cfg);
};

util.inherits(SVGRect, SVGShape);

SVGRect.prototype._getY = function() {
    return this.attrNumber('y') || 0;
};

SVGRect.prototype._getX = function() {
    return this.attrNumber('x') || 0;
};

SVGRect.prototype._getHeight = function(value) {
    return this.attrNumber('height');
};

SVGRect.prototype._setHeight = function(value) {
    this.attr('height',value);
};

SVGRect.prototype._getWidth = function(value) {
    return this.attrNumber('width');
};

SVGRect.prototype._setWidth = function(value) {
    this.attr('width',value);
};

SVGRect.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

module.exports = SVGRect;