/**
 * Simple implementation of path manager
 * @type {PathData|exports|module.exports}
 */
var AbstractPathManager = require('./abstractPathManager');
var util = require('../util/util');

var CurvePathManager = function(transition) {
    AbstractPathManager.call(this, transition);
    this.type = CurvePathManager.type;
};

util.inherits(CurvePathManager, AbstractPathManager);

CurvePathManager.type = 'curved';

CurvePathManager.prototype.create = function(position) {
    this.path.cBezier(undefined, undefined, position);
};

CurvePathManager.prototype.add = function(index, position) {
    this.path.insertCBezier(index,undefined, undefined, position);
};

CurvePathManager.prototype.update = function() {
    this.path.smoothen();
};

module.exports = CurvePathManager;
