var util = require('../util/util');
var object = require('../util/object');
var SVGEllipse = require('./ellipse');
var SVGShape = require('./genericShape');

var SVGCircle = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'circle', svgRoot, cfg);
};

util.inherits(SVGCircle, SVGEllipse);

SVGCircle.prototype.r = function(value) {
    if((object.isBoolean(value) && value) || !object.isDefined(value)) {
        return this.attrNumber('r') + this.strokeWidth() / 2;
    } else if(object.isBoolean(value)) {
        return this.attrNumber('r');
    } else {
        this.attrNumber('r', value);
        return this;
    }
};

SVGCircle.prototype.height = function(value) {
    if(!object.isDefined(value) || object.isBoolean(value)) { //Getter
        return SVGCircle.super_.prototype.height.apply(this, [value]);
    } else { //Setter
        var v = value / 2;
        this.cy(v).cx(v).r(v);
        return this;
    }
};

SVGCircle.prototype.width = function(value) {
    return this.height(value);
};

SVGCircle.prototype.rx = function(value) {
    return this.r(value);
};

SVGCircle.prototype.ry = function(value) {
    return this.r(value);
};

SVGCircle.prototype.overlayCheck = function(position) {
    return new util.math.Circle(this.getCenter(), this.r()).overlays(position);
};

module.exports = SVGCircle;