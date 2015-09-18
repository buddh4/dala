/**
 * Simple implementation of path manager
 * @type {PathData|exports|module.exports}
 */
var AbstractPathManager = require('./abstractPathManager');
var util = require('../util/util');

var LinePathManager = function(transition) {
    AbstractPathManager.call(this, transition);
    this.type = LinePathManager.type;
};

util.inherits(LinePathManager, AbstractPathManager);

LinePathManager.type = 'straight';

LinePathManager.prototype.create = function(position) {
    this.path.line(position);
};

LinePathManager.prototype.add = function(index, position) {
    this.path.insertLine(index, position);
};

LinePathManager.prototype.update = function(position) {/* Nothing to do here */};

module.exports = LinePathManager;
