var AbstractPathManager = require('./abstractPathManager');
var util = require('../util/util');

var CurvedPathManager = function(transition) {
    AbstractPathManager.call(this, transition);
    this.type = CurvedPathManager.type;
};

util.inherits(CurvedPathManager, AbstractPathManager);

CurvedPathManager.type = 'curved';

CurvedPathManager.prototype.create = function(position) {
    //Control points are calculated by calling update
    this.path.cBezier(undefined, undefined, position);
};

CurvedPathManager.prototype.add = function(index, position) {
    this.path.insertCBezier(index,undefined, undefined, position);
};

CurvedPathManager.prototype.update = function() {
    this.path.smoothen();
};

module.exports = CurvedPathManager;
