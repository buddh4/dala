var object = require('../util/object');
var SVGElement = require('./svgElement');

var SVGText = function(text, svgRoot, cfg, attributeSetter) {
    cfg = cfg || {};
    cfg['text-anchor'] = cfg['text-anchor'] || 'start';
    SVGElement.call(this, 'text', svgRoot, cfg, attributeSetter);
    this.text = text;
    //TODO: Span / multi line text
};

SVGText.prototype = Object.create(SVGElement.prototype);

var _super = SVGElement.prototype;

SVGText.prototype.switchAnchor = function() {
    switch(this.anchor()) {
        case 'start':
            this.end();
        case 'end':
            this.start();
    }
};

SVGText.prototype.getExtentOfChar = function(charNum) {
    return this.instance().getExtentOfChar(charNum);
};

SVGText.prototype.getCharHeight = function(charNum) {
    return this.getExtentOfChar(charNum).height;
};

SVGText.prototype.getCharDiff = function(charNum) {
    return this.height() - this.getCharHeight(charNum)

    this.getCharHeight(charNum) + this.getExtentOfChar(charNum).y;
};

SVGText.prototype.start = function() {
    return this.anchor('start');
};

SVGText.prototype.end = function() {
    return this.anchor('end');
};

SVGText.prototype.middle = function() {
    return this.anchor('middle');
};

SVGText.prototype.anchor = function(value) {
    return this.attr('text-anchor', value);
};

SVGText.prototype.hanging = function() {
    return this.attr('alignment-baseline', 'hanging');
};

SVGText.prototype.baseline = function() {
    return this.attr('alignment-baseline', 'baseline ');
};

SVGText.prototype.alignBaseline = function(value) {
    return this.attr('alignment-baseline', value);
};

module.exports = SVGText;