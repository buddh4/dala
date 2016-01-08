var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGGroup = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'g', svgRoot, cfg);
};

util.inherits(SVGGroup, SVGShape);

module.exports = SVGGroup;