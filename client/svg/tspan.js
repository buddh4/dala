var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');
var SVGText = require('./text');

var DEFAULT_DOMINANT_BASELINE = 'inherit'

var SVGTSpan = function(svgRoot, cfg) {
    cfg = cfg || {};
    cfg['dominant-baseline'] = cfg['dominant-baseline'] || DEFAULT_DOMINANT_BASELINE;
    SVGShape.call(this, 'tspan', svgRoot, cfg);
};

util.inherits(SVGTSpan, SVGText);

SVGTSpan.prototype.getContainerText = function() {
    var parent = this.parent();
    if(parent.tagName === 'text') {
        return parent;
    }
};

SVGTSpan.prototype.fontSize = function(value) {
    if(value) {
        return SVGTSpan.super_.prototype.fontSize.apply(this, [value]);
    } else {
        var result = SVGTSpan.super_.prototype.fontSize.apply(this);
        if(!result) {
            var containerText = this.getContainerText();
            return (containerText) ? containerText.fontSize() : 0;
        } else {
            return result;
        }
    }
};

SVGTSpan.prototype.content = function(value) {
    if(value) {
        this.$().text(value);
        return this;
    } else {
        return this.$().text();
    }
};

SVGTSpan.prototype.getBBox = function() {
    //some browser (e.g. firefox) does not implement the getBBox for tspan elements.
    return this.getBoundingClientRect();
};

module.exports = SVGTSpan;