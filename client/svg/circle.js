var util = require('../util/util');
var object = require('../util/object');
var SVGEllipse = require('./ellipse');
var SVGShape = require('./svgShape');

var SVGCircle = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'circle', svgRoot, cfg);
};

util.inherits(SVGCircle, SVGEllipse);

SVGCircle.prototype.r = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[1];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('r') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('r') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('r', value);
        return this;
    }
};

SVGCircle.prototype._setHeight = function(value) {
    var v = value / 2;
    this.cy(v).cx(v).r(v);
};

SVGCircle.prototype._setWidth = function(value) {
    return this.height(value);
};

SVGCircle.prototype.rx = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.ry = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.overlayCheck = function(position) {
    return new util.math.Circle(this.getCenter(), this.r()).overlays(position);
};

module.exports = SVGCircle;