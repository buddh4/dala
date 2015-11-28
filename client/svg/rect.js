var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./genericShape');

var SVGRect = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'rect', svgRoot, cfg);
};

util.inherits(SVGRect, SVGShape);

SVGRect.prototype.y = function() {
    var y = this.attrNumber('y') || 0;
    return this.translatedY(y);
};

SVGRect.prototype.x = function() {
    var x = this.attrNumber('x') || 0;
    return this.translatedX(x);
};

SVGRect.prototype.height = function(value) {
    if((object.isBoolean(value) && !value)) {
        return this.attrNumber('height');
    } else if(!object.isDefined(value) || (object.isBoolean(value) && value)) {
        //TODO: note that the stroke is rendered on the center of the node border
        return this.attrNumber('height') + this.strokeWidth();
    } else {
        this.attr({height:value});
        return this;
    }
};

SVGRect.prototype.width = function(value) {
    if((object.isBoolean(value) && !value)) {
        return this.attrNumber('width');
    } else if(!object.isDefined(value) || (object.isBoolean(value) && value)) {
        return this.attrNumber('width') + this.strokeWidth();
    } else {
        this.attr({width:value});
        return this;
    }
};

//TODO: consider stroke-width ...
SVGRect.prototype.rightX = function() {
    return this.x() + this.width();
};

SVGRect.prototype.bottomY = function() {
    return this.y() + this.height();
};

SVGRect.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.rightX()
        && position.y >= this.y() && position.y <= this.bottomY();
};

module.exports = SVGRect;