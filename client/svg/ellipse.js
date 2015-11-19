var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./genericShape');

var SVGEllipse = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'ellipse', svgRoot, cfg);
};

util.inherits(SVGEllipse, SVGShape);

SVGEllipse.prototype.x = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype.height = function(value) {
    if(!object.isDefined(value) || object.isBoolean(value)) {
        return this.ry(value) * 2;
    } else {
        //When setting the height of an ellipse we move the center to not change the x/y
        var v = value / 2;
        this.cy(v).ry(v);
        return this;
    }
};

SVGEllipse.prototype.width = function(value) {
    if(!object.isDefined(value) || object.isBoolean(value)) {
        return this.rx(value) * 2;
    } else {
        //When setting the height of an ellipse we move the center to not change the x/y
        var v = value / 2;
        this.cx(v).rx(v);
        return this;
    }
};

SVGEllipse.prototype.x = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype.y = function() {
    return this.cy() - this.ry();
};

SVGEllipse.prototype.rightX = function() {
    return this.cx() + this.rx();
};

SVGEllipse.prototype.getCenter = function() {
    return {
        x : this.cx(),
        y : this.cy()
    };
};

SVGEllipse.prototype.bottomY = function() {
    return this.cy() + this.ry();
};

SVGEllipse.prototype.cx = function(value) {
    if(!value) {
        return this.translatedX(this.attrNumber('cx'));
    } else {
        this.attr('cx', value)
        return this;
    }
};

SVGEllipse.prototype.cy = function(value) {
    if(!value) {
        return this.translatedY(this.attrNumber('cy'));
    } else {
        this.attr('cy', value);
        return this;
    }
};

SVGEllipse.prototype.rx = function(value) {
    if((!object.isDefined(value) || object.isBoolean(value) && value)) {
        return this.attrNumber('rx') + this.strokeWidth();
    } else if(object.isBoolean(value)) {
        return this.attrNumber('rx');
    } else {
        this.attrNumber('rx', value);
        return this;
    }
};

SVGEllipse.prototype.ry = function(value) {
    if((!object.isDefined(value) || object.isBoolean(value) && value)) {
        return this.attrNumber('ry') + this.strokeWidth();
    } else if(object.isBoolean(value)) {
        return this.attrNumber('ry');
    } else {
        this.attrNumber('ry', value);
        return this;
    }
};

SVGEllipse.prototype.overlayCheck = function(position) {
    return new util.math.Ellipse(this.getCenter(), this.rx(), this.ry()).overlays(position);
};

/*
SVGElement.prototype.overlayCheck = function(position) {

};*/

module.exports = SVGEllipse;