var object = require('../util/object');
var appUtil = require('../util/app');
var Vector = require('../util/math').Vector;
var math = require('../util/math');
var util = require("util");

var AbstractPathDataType = function(type, absolute) {
    this.vector = new Vector();
    this.vector.add(type);
    this.absolute = absolute || true;
};

AbstractPathDataType.prototype.getType = function() {
    var type = this.value(0,0);
    return this.absolute ? type.toUpperCase() : type.toLowerCase();
};

AbstractPathDataType.prototype.value = function() {
    return this.vector.value(Array.prototype.slice.call(arguments));
};

AbstractPathDataType.prototype.setValue = function(pathArr, value) {
    return this.vector.setValue(pathArr, value);
};

AbstractPathDataType.prototype.insert = function(pathArr, values) {
    return this.vector.setValue(pathArr, values);
};

AbstractPathDataType.prototype.is = function(type) {
    return this.getType().toUpperCase() === type.toUpperCase();
};

AbstractPathDataType.prototype.to = function(pathArr, values) {
    //ABSTRACT
};

AbstractPathDataType.prototype.pointToString = function(p) {
    return p.x + ',' + p.y+' ';
};

AbstractPathDataType.prototype.getOrSet = function(index, value) {
    if(value) {
        this.setValue(index, value);
    } else {
        return this.value(index);
    }
}

/**
 * Vector = [['l'], {x:x, y:y}]
 */
var LineTo = function(p, absolute) {
    AbstractPathDataType.call(this, 'l', absolute);
    this.to(p);
};

util.inherits(LineTo, AbstractPathDataType);

LineTo.prototype.to = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(1,p);
};

LineTo.prototype.toString = function() {
    return this.getType()+this.pointToString(this.to());
};

LineTo.prototype.x = function(value) {
    if(value) {
        this.value(1).x = value
    }
    return this.value(1).x;
};

LineTo.prototype.y = function(value) {
    if(value) {
        this.value(1).y = value
    }
    return this.value(1).y;
};

LineTo.prototype.moveAlong = function(from, distance, direction) {
    return math.Line.moveAlong(from, this.to(), distance);
};

var QBezier = function(controlP, toP, absolute) {
    AbstractPathDataType.call(this, 'l', absolute);
    this.control(controlP);
    this.to(toP);
};

util.inherits(QBezier, AbstractPathDataType);

QBezier.prototype.to = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(2,p);
};

QBezier.prototype.control = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(1,p);
};

QBezier.prototype.toString = function() {
    return this.getType()+this.pointToString(this.control())+this.pointToString(this.to());
};

var CBezier = function(controlP1, controlP2, toP, absolute) {
    AbstractPathDataType.call(this, 'c', absolute);
    this.control1(controlP1);
    this.control2(controlP2);
    this.to(toP);
};

util.inherits(CBezier, AbstractPathDataType);

CBezier.prototype.control = function(x,y) {
    return this.control1(x,y);
}

CBezier.prototype.control1 = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(1,p);
};

CBezier.prototype.control2 = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(2,p);
};

CBezier.prototype.to = function(x,y) {
    var p = appUtil.getPoint(x,y);
    return this.getOrSet(3,p);
};

CBezier.prototype.toString = function() {
    return this.getType()+this.pointToString(this.control1())+this.pointToString(this.control2())+this.pointToString(this.to());
};

/**
 * calculates the nearest point of the bezier curve to the given position. since the CBezier does not know its start
 * point, we have to provide the from position as well as the search base position.
 * @param from
 * @param position
 * @returns {{point, location}|*}
 */
CBezier.prototype.getNearestPoint = function(from, position) {
    return math.bezier.nearestPointOnCurve(position, this.getCurve(from)).point;
};

CBezier.prototype.moveAlong = function(from, distance) {
    return math.bezier.moveAlong(this.getCurve(from), distance);
};

CBezier.prototype.getCurve = function(from) {
    return [from, this.control1(), this.control2(), this.to()];
}

var MoveTo = function(toP, absolute) {
    AbstractPathDataType.call(this, 'm', absolute);
    this.to(toP);
};

util.inherits(MoveTo, LineTo);

var Complete = function() {
    AbstractPathDataType.call(this, 'z');
};

util.inherits(Complete, AbstractPathDataType);

Complete.prototype.toString = function() {
    return this.getType();
}

var PathData = function(def) {
    if(object.isString(def)) {
        this.dataArr = def.split(/(?=[MmLlHhVvCcSsQqTtAaZz]+)/);

        var that = this;
        object.each(this.dataArr, function(index, value) {
            that.dataArr[index] = that.fromString(value.trim());
            value.trim();
        });
    } else {
        this.data = new Vector();
    }
};

PathData.prototype.getCorners = function() {
    var xMin, xMax, yMin, yMax;
    xMin = yMin = Number.POSITIVE_INFINITY;
    xMax = yMax = Number.NEGATIVE_INFINITY;

    this.data.each(function(index, pathPart) {
        if(pathPart.x && pathPart.y) {
            xMin = (xMin > pathPart.x()) ? pathPart.x() : xMin;
            yMin = (yMin > pathPart.y()) ? pathPart.y() : yMin;

            xMax = (xMax < pathPart.x()) ? pathPart.x() : xMax;
            yMax = (yMax < pathPart.y()) ? pathPart.y() : yMax;
        }
    });

    return [
        {x:xMin, y:yMin},
        {x:xMax, y:yMin},
        {x:xMax, y:yMax},
        {x:xMin, y:yMax}
    ];
};

PathData.prototype.getX = function(value) {
    return this.getCorners()[0].x;
};

PathData.prototype.polynoms = function() {
    var result = [];
    object.each(this.data.vectors, function(index, value) {
        if(value.to) {
            result.push(value.to());
        }
    });
    return result;
};

/**
 * Returns
 * @returns {Array}
 */
PathData.prototype.getPathParts = function() {
    var result = [];

    //We start at index 1 because the 0 index of the vector contains the pathpart type
    for(var i = 1; i <= this.length() - 1; i++) {
        result.push(this.getPathPart(i));
    }

    return result;
};

PathData.prototype.getPathPart = function(index) {
    var pathPart = this.value(index);
    return {
        start: this.value(index - 1).to(),
        end: pathPart.to(),
        value: pathPart
    };
};

PathData.prototype.moveAlong = function(index, distance, direction) {
    var pathPart = this.getPathPart(index);
    if(pathPart.value.moveAlong) {
        return pathPart.value.moveAlong(pathPart.start, distance, direction);
    } else {
        return math.Line.moveAlong(pathPart.start, pathPart.end, distance, direction);
    }
};

/**
 * Calculates the rough center of the path by calculating the total length of the pathparts (as direct lines) and moving
 * along those lines to the center (total length / 2). Note with this method we just get a exact result for simple
 * line paths. If the calculated center position is within a cubic bezier path part, we return the nearest point on the curve
 * to the calculated center.
 * @returns {*}
 */
PathData.prototype.getCenter = function() {
    var resultD = this.getDistance() / 2;
    var currentD = 0;
    var center;
    object.each(this.getPathParts(), function(index, part) {
        var lineD = math.Line.calcDistance(part.start, part.end);
        var nextD = currentD + lineD;
        if(nextD > resultD) {
            var diffD =  resultD - currentD;
            center = math.Line.moveAlong(part.start, part.end, diffD);

            //If we have a cubic bezier path part we calculate the nearest point on the curve
            if(part.value.is('c')) {
                center = part.value.getNearestPoint(part.start, center);
            }
            return false;
        }
        currentD = nextD;
    });
    return center;
};

PathData.prototype.getDistance = function() {
    var distance = 0;
    object.each(this.getPathParts(), function(index, part) {
        distance += math.Line.calcDistance(part.start, part.end);
    });
    return distance;
};

/**
 * Assuming there are only! cubic bezier curved path parts this function recalculates all control points of the curves
 * to smoothen the entire path.
 *
 * @param polynoms
 */
PathData.prototype.smoothen = function(polynoms) {
    if(!polynoms) {
        polynoms = this.polynoms();
    }

    var x = [];
    var y = [];

    object.each(polynoms, function(index, value) {
        x[index] = value.x;
        y[index] = value.y;
    });

    var px = math.bezier.calculateSmoothControlPoints(x);
    var py = math.bezier.calculateSmoothControlPoints(y);

    var that = this;
    object.each(px.p1, function(index, value) {
        that.value(index + 1).control1(px.p1[index], py.p1[index]);
        that.value(index + 1).control2(px.p2[index], py.p2[index]);
    });
    return this;
};

PathData.prototype.getLineByPathIndex = function(index, fromEnd) {
    var startIndex = (fromEnd)  ? (index + 1) * -1 : index;
    var endIndex =   (fromEnd)  ? (index + 2) * -1 : index + 1;
    var p1 = this.value(startIndex).to();
    var p2 = this.value(endIndex).to();
    return new math.Line(p1, p2);
};

PathData.prototype.getPathIndexForPosition = function(point) {

    if(this.length() === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate;

    object.each(this.getPathParts(), function(index, part) {
        var xMin = Math.min(part.start.x, part.end.x);
        var xMax = Math.max(part.start.x, part.end.x);

        // If the search point is within the transition part x boundary we calculate y and return the candidate with
        // the lowest y distance
        if (point.x <= xMax && point.x >= xMin) {
            var line = new math.Line(part.start, part.end);
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

PathData.prototype.getY = function(value) {
    return this.getCorners()[0].y;
};

PathData.prototype.getRightX = function(value) {
    return this.getCorners()[1].x;
};

PathData.prototype.getBottomY = function(value) {
    return this.getCorners()[2].y;
};

// TODO: NEW IMPLEMENTATION
PathData.prototype.fromString = function(value) {
    //Note this is just possible for normal points (x/y) values !
    var type = value.charAt(0);
    var values = value.substring(1,value.length).split(',');
    return {type : type, value:this.toPoint(values[0], values[1]), absolute : (type === type.toUpperCase())};
};

PathData.prototype.setData = function(value) {
    if(object.isArray(value)) {
        this.data = value;
    }
};

PathData.prototype.clear = function() {
    this.data.clear();
    return this;
};

PathData.prototype.length = function() {
    return this.data.length();
};

PathData.prototype.value = function(index) {
    return this.data.value(index);
};

PathData.prototype.valueByType = function(index, type) {
    var count = 0;
    var result;

    object.each(this.data.vectors, function(i, value) {
       if(value.is(type) && count++ === index) {
           result = value;
           return false;
       }
    });

    return result;
}

PathData.prototype.start = function(p, absolute) {
    if(arguments.length === 0) {
        return this.value(0).to();
    }
    this.data.setValue(0, new MoveTo(p, absolute));
    return this;
};

PathData.prototype.end = function(value) {
    if(value) {
        return this.data.last().to(value);
    } else {
        return this.data.last().to();
    }
};

/**
 * TODO: refactor to setTo
 * @param index
 * @param value
 * @returns {PathData}
 */
PathData.prototype.setTo = function(index, value) {
    this.data.value(index).to(value);
    return this;
};

PathData.prototype.removePath = function(index) {
    this.data.remove(index);
    return this;
};

PathData.prototype.complete = function() {
    this.data.add(new Complete());
    return this;
};

PathData.prototype.line = function(x,y) {
    var p = appUtil.getPoint(x,y);
    this.data.add(new LineTo(p, true));
    return this;
};

PathData.prototype.cBezier = function(c1, c2, to) {
    this.data.add(new CBezier(c1,c2, to, true));
    return this;
};

/**
 * TODO: Line to
 * @param index
 * @param value
 * @param absolute
 * @returns {PathData}
 */
PathData.prototype.insertLine = function(index, to, absolute) {
    this.data.insert(index, new LineTo(to,absolute));
    return this;
};

PathData.prototype.qBezier = function(controlP,toP) {
    this.data.add(new QBezier(controlP,toP, true));
    return this;
};

PathData.prototype.insertQBezier = function(index,c, to, absolute) {
    this.data.insert(index, new QBezier(to,absolute));
    return this;
};

PathData.prototype.insertCBezier = function(index, c1, c2, to, absolute) {
    this.data.insert(index, new CBezier(c1,c2, to,absolute));
    return this;
};

PathData.prototype.toString = function() {
    var result = '';
    var that = this;
    this.data.each(function(index, pathPart) {
       result += pathPart.toString();
    });
    return result.trim();
};

module.exports = PathData;