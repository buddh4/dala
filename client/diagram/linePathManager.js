/**
 * Simple implementation of path manager
 * @type {PathData|exports|module.exports}
 */
var PathData = require('../svg/pathData');
var util = require('../util/util');
var object = util.object;

var LinePathManager = function(transition) {
    this.transition = transition;
};

LinePathManager.prototype.dragLine = function(position) {
    if(this.path.length() === 1) {
        this.path.line(position);
    } else {
        this.updatePathPart(1, position);
    }
};

//TODO: pathType: simple, bent, curve...
LinePathManager.prototype.addPathPart = function(index, position) {
    if(!this.path) {
        this.path = new PathData().start(position);
    } else {
        this.path.insertLine(index, position);
    }
};

LinePathManager.prototype.removePathPart = function(index) {
    this.path.removePath(index);
};

LinePathManager.prototype.getTo = function(index) {
    return this.path.value(index);
};

LinePathManager.prototype.updatePathPart = function(index, position) {
    this.path.setTo(index, position);
};

LinePathManager.prototype.removePathPart = function(index) {
    this.path.removePath(index);
};

LinePathManager.prototype.update = function() {
    return path.clear().start(start).line(mouse);
};

LinePathManager.prototype.getTransitionParts = function() {
    var result = [];
    var dockingIndex = 1;
    while(dockingIndex <= this.path.length() - 1) {
        result.push({
            start: this.path.value(dockingIndex - 1).to(),
            end: this.path.value(dockingIndex).to()
        });
        dockingIndex++;
    }
    return result;
};

/**
 * TODO: MOVE THE FOLLOWING HELPER to pathData.js and calculate by part type (line/bezier) if possible
 * @returns {*}
 */
LinePathManager.prototype.getCenter = function() {
    var resultD = this.getDistance() / 2;
    var currentD = 0;
    var center;
    object.each(this.getTransitionParts(), function(index, part) {
        var lineD = util.math.Line.calcDistance(part.start, part.end);
        var nextD = currentD + lineD;
        if(nextD > resultD) {
            var diffD =  resultD - currentD;
            center = util.math.Line.moveAlong(part.start, part.end, diffD);
            return false;
        }
        currentD = nextD;
    });
    return center;
};

LinePathManager.prototype.getDistance = function() {
    var distance = 0;
    object.each(this.getTransitionParts(), function(index, part) {
        distance += util.math.Line.calcDistance(part.start, part.end);
    });
    return distance;
};

/*
LinePathManager.prototype.getGradien = function(x,y) {
    var position = util.app.getPoint(x,y);
    var index = this.transition.getKnobIndexForPoint(position);
    var p1 = this.data.getDockingByIndex(index).position();
    var p2 = this.data.getDockingByIndex(index + 1).position();
    return util.math.Line.calcGradient(p1, p2);
};

LinePathManager.prototype.getGradientByIndex = function(index) {
    var p1 = this.data.getDockingByIndex(index).position();
    var p2 = this.data.getDockingByIndex(index + 1).position();
    return util.math.Line.calcGradient(p1, p2);
};


LinePathManager.prototype.getVectorByIndex = function(index, fromEnd) {
    var p1, p2;
    if(fromEnd) {
        p1 = this.data.getDockingByEndIndex(index + 1).position();
        p2 = this.data.getDockingByEndIndex(index).position();
    } else {
        p1 = this.data.getDockingByIndex(index).position();
        p2 = this.data.getDockingByIndex(index + 1).position();
    }
    return util.math.Line.calcNormalizedLineVector(p1, p2);
};
 */

LinePathManager.prototype.getLineByIndex = function(index, fromEnd) {
    var p1, p2;
    if(fromEnd) {
        p1 = this.path.value((index + 1) * -1).to();
        p2 = this.path.value(index + -1).to();
    } else {
        p1 = this.path.value(index).to();
        p2 = this.path.value(index + 1).to();
    }
    return new util.math.Line(p1, p2);
};

LinePathManager.prototype.getPathIndexForPosition = function(point) {

    if(this.path.length() === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate;
    object.each(this.getTransitionParts(), function(index, part) {
        //We add 10 px tolerance
        var xMin = Math.min(part.start.x, part.end.x) - 10;
        var xMax = Math.max(part.start.x, part.end.x) + 10;

        var yMin = Math.min(part.start.y, part.end.y) - 10;
        var yMax = Math.max(part.start.y, part.end.y) + 10;


        // If the search point is within the transition part x boundary we calculate y and return the candidate with
        // the lowest y distance
        if (point.x <= xMax && point.x >= xMin && point.y <= yMax && point.y >= yMin) {
            var line = new util.math.Line(part.start, part.end);
            var yResult = line.calcFX(point.x).y;

            //if we have a vertical transitionPart and its within the y boundary we use this as candidate
            var d = (isNaN(yResult)) ? 0 :  Math.abs(yResult - point.y);
            if (candidate === undefined || candidate[1] > d) {
                //The dockingindex is the arrayindex + 1 since we return the end index
                candidate = [index+1, d];
            }
        }
    });

    if (candidate !== undefined) {
        return candidate[0];
    }
};


module.exports = LinePathManager;
