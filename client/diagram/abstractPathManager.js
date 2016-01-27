var PathData = require('../svg/pathData');
var object = require('../util/object');

var AbstractPathManager = function(transition) {
    this.transition = transition;
};

AbstractPathManager.prototype.activate = function() {
    this.path = this.transition.getLine().d();
    return this;
};

AbstractPathManager.prototype.fromString = function(pathDataStr) {
    this.path = new PathData().loadFromString(pathDataStr);
};

AbstractPathManager.prototype.dragLine = function(position) {
    // Init path if no path was created yet
    if(!this.path) {
        this.init(position)
    }

    // Create full path if the path only consist of the start path part yet or update the end position of the path
    if(this.path.length() === 1) {
        this.create(position);
    } else {
        this.path.end(position);
    }

    this.update();
};

AbstractPathManager.prototype.init = function(position) {
    this.path = new PathData().start(position);
};

AbstractPathManager.prototype.updatePart = function(index, position) {
    this.path.setTo(index, position);
    this.update();
};

AbstractPathManager.prototype.addPathPart = function(index, position) {
    if(!this.path) {
        this.init(position);
    } else {
        this.add(index,position);
        this.update();
    }
};

AbstractPathManager.prototype.removePathPart = function(index) {
    if(this.path) {
        this.path.removePath(index);
    }
};

AbstractPathManager.prototype.replace = function(old, positions) {
    this.buildPath(positions);

    //We set our created path data to the existing path, since the transition line and linearea are dependent on this path instance
    old.path.data = this.path.data;
    this.path = old.path;

    this.transition.pathManager = this;
    return this;
};

AbstractPathManager.prototype.buildPath = function(positions) {
    this.init(positions[0]);

    for(var i  = 1; i < positions.length; i++) {
        this.add(i, positions[i]);
    }

    this.update();
};

AbstractPathManager.prototype.getNearestPoint = function(position) {
    return this.path.getNearestPoint(position);
};

AbstractPathManager.prototype.getIndexForPosition = function(position) {
    return this.path.getPathIndexForPosition(position);
};

AbstractPathManager.prototype.create = function(position) {/*Abstract*/};
AbstractPathManager.prototype.update = function(position) {/*Abstract*/};
AbstractPathManager.prototype.add = function(index, position) {/*Abstract*/};

module.exports = AbstractPathManager;