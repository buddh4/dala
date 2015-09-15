/**
 * Simple implementation of path manager
 * @type {PathData|exports|module.exports}
 */
var PathData = require('../svg/pathData');
var util = require('../util/util');
var object = util.object;

var CurvePathManager = function(transition) {
    this.transition = transition;
};

CurvePathManager.prototype.dragLine = function(position) {
    if(this.path.length() === 1) {
        this.path.cBezier(undefined, undefined, position);
    }
    this.path.end(position);
    this.updateControls([this.path.start(), position]);
};

CurvePathManager.prototype.updatePathPart = function(index, position) {
    //first update the to position of the given index
    this.path.setTo(index, position);
    //recalculate the controlpoints
    this.updateControls();
};

CurvePathManager.prototype.updateControls = function(polynoms) {
    if(!polynoms) {
        polynoms = this.path.polynoms();
    }

    var x = [];
    var y = [];
    object.each(polynoms, function(index, value) {
        x[index] = value.x;
        y[index] = value.y;
    });

    var px = computeControlPoints(x);
    var py = computeControlPoints(y);

    var that = this;
    object.each(px.p1, function(index, value) {
        that.path.value(index + 1).control1(px.p1[index], py.p1[index]);
        that.path.value(index + 1).control2(px.p2[index], py.p2[index]);
    });
};

//TODO: pathType: simple, bent, curve...
CurvePathManager.prototype.addPathPart = function(index, position) {
    if(!this.path) {
        this.path = new PathData().start(position);
    } else {
        this.path.insertCBezier(index,undefined, undefined, position);
        this.updateControls();
    }
};

CurvePathManager.prototype.removePathPart = function(index) {
    this.path.removePath(index);
};

CurvePathManager.prototype.getTo = function(index) {
    return this.path.value(index);
};

CurvePathManager.prototype.removePathPart = function(index) {
    this.path.removePath(index);
};

CurvePathManager.prototype.update = function() {
    return path.clear().start(start).line(mouse);
};

CurvePathManager.prototype.getTransitionParts = function() {
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
CurvePathManager.prototype.getCenter = function() {
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

CurvePathManager.prototype.getDistance = function() {
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

CurvePathManager.prototype.getLineByIndex = function(index, fromEnd) {
    var p1, p2;
    if(fromEnd) {
        p1 = this.path.value((index + 1) * -1).to();
        p2 = this.path.value((index + 2)* -1).to();
    } else {
        p1 = this.path.value(index).to();
        p2 = this.path.value(index + 1).to();
    }

    return new util.math.Line(p1, p2);
};

CurvePathManager.prototype.getPathIndexForPosition = function(point) {

    if(this.path.length() === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate;

    object.each(this.getTransitionParts(), function(index, part) {
        //WE assume simple line points (X/Y) here and no arrays
        var xMin = Math.min(part.start.x, part.end.x);
        var xMax = Math.max(part.start.x, part.end.x);

        // If the search point is within the transition part x boundary we calculate y and return the candidate with
        // the lowest y distance
        if (point.x <= xMax && point.x >= xMin) {
            var line = new util.math.Line(part.start, part.end);
            var yResult = line.calcFX(point.x);

            var d = Math.abs(yResult - point.y);
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

function computeControlPoints(K)
{
    var p1 = [];
    var p2 = [];
    var n = K.length-1;

    /*rhs vector*/
    var a = [];
    var b = [];
    var c = [];
    var r = [];

    /*left most segment*/
    a[0] = 0;
    b[0] = 2;
    c[0] = 1;
    r[0] = K[0]+2*K[1];

    /*internal segments*/
    for (i = 1; i < n - 1; i++) {
        a[i] = 1;
        b[i] = 4;
        c[i] = 1;
        r[i] = 4 * K[i] + 2 * K[i+1];
    }

    /*right segment*/
    a[n-1] = 2;
    b[n-1] = 7;
    c[n-1] = 0;
    r[n-1] = 8*K[n-1]+K[n];

    /*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
    for (i = 1; i < n; i++) {
        m = a[i]/b[i-1];
        b[i] = b[i] - m * c[i - 1];
        r[i] = r[i] - m*r[i-1];
    }

    p1[n-1] = r[n-1]/b[n-1];
    for (i = n - 2; i >= 0; --i) {
        p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];
    }

    /*we have p1, now compute p2*/
    for (i = 0; i < n - 1; i++) {
        p2[i] = 2 * K[i + 1] - p1[i + 1];
    }

    p2[n-1] = 0.5 * (K[n] + p1[n-1]);

    return {p1:p1, p2:p2};
}


module.exports = CurvePathManager;
