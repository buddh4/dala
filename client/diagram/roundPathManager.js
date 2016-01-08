var StraightPathManager = require('./straightPathManager');
var util = require('../util/util');

var RoundPathManager = function(transition) {
    StraightPathManager.call(this, transition);
    this.type = RoundPathManager.type;
};

util.inherits(RoundPathManager, StraightPathManager);

RoundPathManager.type = 'round';

RoundPathManager.prototype.buildPath = function(positions) {
    this.init(positions[0]);
    this.create(positions[positions.length -1]);

    for(var i  = 1; i < positions.length - 1; i++) {
        this.add(i, positions[i]);
    }
};

RoundPathManager.prototype.add = function(index, position) {
    var corners = this.path.valuesByType('Q');
    if(this.path.length() == 1) { // Initial Add
        this.path.insertLine(index, position);
    } else if(index - 1 <= corners.length) { //Add innser Knob
        //Get the endIndex/position of the line before the new corner
        var prevEndIndex = (index == 1) ? 1 : corners[index - 2].index + 1;
        this.path.insertQBezier(prevEndIndex + 1,position);
        this.path.insertLine(prevEndIndex + 2, this.path.value(prevEndIndex).to());
        this.updatePart(index);
    } else { // Append knob
        var end = this.path.end();
        this.path.qBezier(position, undefined);
        this.path.line(end);
        this.updateCorner(index);
    }
};

RoundPathManager.prototype.updatePart = function(index, position, prevUpdateNeighbors) {
    var corners = this.path.valuesByType('Q');
    if(index == 0) { // First Knob
        this.path.start(position);
        if(corners.length > 0) {
            this.updatePart(1, undefined, true);
        }
    } else if(index > corners.length) { // Last Knob

        this.path.end(position);
        if(corners.length > 0) {
            this.updatePart(corners.length, undefined, true);
        }
    } else { // Inner Knobs
        this.updateCorner(index, position, prevUpdateNeighbors);
    }
};

RoundPathManager.prototype.updateCorner = function(index, position, prevUpdateNeighbors) {
    var corners = this.path.valuesByType('Q');
    var cornerIndex = index - 1;
    this.updateCornerStart(cornerIndex, corners, position);
    this.updateCornerEnd(cornerIndex, corners, position);

    if(!prevUpdateNeighbors) {
        this.updatePart(index + 1, undefined, true);
        this.updatePart(index - 1, undefined, true);
    }
};

RoundPathManager.prototype.updateCornerStart = function(cornerIndex, corners, position) {
    var updateCorner = corners[cornerIndex];

    if(!updateCorner) {
        return;
    }

    position = position || updateCorner.value.control();
    var startOrientation = (cornerIndex > 0) ? corners[cornerIndex - 1].value.to() : this.path.start();
    var curveStart = util.math.Line.moveAlong(startOrientation, position, -20);
    this.path.setTo(updateCorner.index - 1, curveStart);
};

RoundPathManager.prototype.updateCornerEnd = function(cornerIndex, corners, position) {
    var updateCorner = corners[cornerIndex];

    if(!updateCorner) {
        return;
    }

    position = position || updateCorner.value.control();
    var endOrientation = (cornerIndex == corners.length - 1) ? this.path.end() : corners[cornerIndex + 1].value.to();
    var curveEnd = util.math.Line.moveAlong(position, endOrientation, 20);
    updateCorner.value.control(position).to(curveEnd);
};

RoundPathManager.prototype.getIndexForPosition = function(position) {
    //The round path is divided like the this: M L - Q L - Q L - Q L where the first M L can be seen as index 1...
    var pathIndex = this.path.getPathIndexForPosition(position);
    var evenPathIndex = (pathIndex % 2 == 0) ? pathIndex : pathIndex - 1;
    return (evenPathIndex / 2) + 1;
};

RoundPathManager.prototype.removePathPart = function(index) {
    if(this.path && index > 0) {
        var corner = this.path.valuesByType('Q')[index - 1];
        if(corner) {
            var curveEnd = this.path.value(corner.index + 1).to();
            this.path.value(corner.index - 1).to(curveEnd);
            this.path.removePath(corner.index + 1);
            this.path.removePath(corner.index);
        }
    }
};

RoundPathManager.prototype.update = function() {/** nothing **/};

module.exports = RoundPathManager;
