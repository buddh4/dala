var object = require('./object');

var calcLineIntersection = function(pa1, pa2, pb1, pb2) {
    return new Line(pa1,pa2).calcLineIntercept(new Line(pb1,pb2));
};

var Line = function(p1, p2) {
    //y = mx + t
    if(p1.x) {
        this.op1 = p1;
        this.op2 = p2;
        this.p1 = (p1.x <= p2.x)? p1 : p2;
        this.p2 = (p1.x > p2.x)? p1 : p2;
        this.m = this.calcGradient();
        this.t = this.calcYIntercept();
    } else {
        this.m = p1;
        this.t = p2;
    }
};

Line.prototype.calcYIntercept = function() {
    // y = m * x + t => t = -mx + y
    return (-1 * this.m * this.p1.x) + this.p1.y;
};

Line.prototype.getOrthogonal = function(p) {
    //
    var newM = -1 / this.m;
    var t = p.y - (newM * p.x);
    return new Line(newM,t);
};

Line.prototype.calcGradient = function() {
    return Line.calcGradient(this.p1, this.p2);
};

Line.prototype.calcNormalizedLineVector = function() {
    return Line.calcNormalizedLineVector(this.p1, this.p2);
};

Line.prototype.isLtR = function() {
    return this.op1.x < this.op2.x;
};

Line.prototype.isTtB = function() {
    return this.op1.y < this.op2.y;
};


Line.calcNormalizedLineVector = function(p1, p2) {
    var vector = {
        x : p2.x - p1.x,
        y : p2.y - p1.y
    };

    var length = Math.sqrt(vector.x*vector.x + vector.y*vector.y);

    vector.x = vector.x / length;
    vector.y = vector.y / length;
    return vector;
};

Line.moveAlong = function(p1,p2, dist, direction) {
    var vector = Line.calcNormalizedLineVector(p1,p2);
    direction = direction || 1;
    return {
        x : p1.x + vector.x * dist * direction,
        y : p1.y + vector.y * dist * direction
    };
}

Line.calcGradient = function(p1, p2) {
    return (p2.y - p1.y) / (p2.x - p1.x);
};

Line.prototype.calcFX = function(x) {
    var y = (this.m) * x + this.t;
    return {
        x : x,
        y : y
    };
};

Line.prototype.calcMidPoint = function() {
    return Line.calcMidPoint(this.p1, this.p2);
}

Line.calcMidPoint = function(p1, p2) {
    return {
        x : (p1.x+p2.x) / 2,
        y : (p1.y+p2.y) / 2
    };
};

Line.prototype.isVertical = function(x) {
    return !isFinite(this.m) || this.m === 0;
};

/*
 Line.prototype.calcLineIntercept = function(other) {
 var x = (this.m * this.p1.x - other.m * other.p1.x - this.p1.y + other.p1.y) / (this.m - other.m);
 return this.calcFX(x);
 }; */

Line.prototype.calcLineIntercept = function(other) {
    //mx(1) + t(1) = mx(2) +t(2)
    var m = other.m + (-1 * this.m);
    var t = this.t + (-1 * other.t);
    var x = (m !== 0) ? t / m : t;
    return this.calcFX(x);
};

Line.calcDistance = function(p1, p2) {
    return Math.sqrt(Math.pow((p2.y - p1.y),2) + Math.pow((p2.x - p1.x),2));
}

var SimpleVector = function(x, y) {
    this.x = x;
    this.y = y;
};

SimpleVector.prototype.dot = function(that) {
    return this.x*that.x + this.y*that.y;
};

SimpleVector.fromPoints = function(p1, p2) {
    return new SimpleVector(
        p2.x - p1.x,
        p2.y - p1.y
    );
};

SimpleVector.prototype.subtract = function(that) {
    return new SimpleVector(this.x - that.x, this.y - that.y);
};

var Ellipse = function(cx, cy, rx, ry) {
    switch(arguments.length) {
        case 4:
            this.c = {x:cx,y:cy};
            this.rx = rx;
            this.ry = ry;
            break;
        case 3:
            this.c = cx;
            this.rx = cy;
            this.ry = rx;
            break;
    }
};

Ellipse.prototype.calcLineIntercept = function(p1,p2) {
    var result = [];

    if(arguments.length === 1) {
        p2 = p1.p2;
        p1 = p1.p1;
    }

    var origin = new SimpleVector(p1.x, p1.y);
    var dir = SimpleVector.fromPoints(p1, p2);
    var center = new SimpleVector(this.c.x, this.c.y);
    var diff = origin.subtract(center);
    var mDir = new SimpleVector(dir.x/(this.rx*this.rx),  dir.y/(this.ry*this.ry));
    var mDiff = new SimpleVector(diff.x/(this.rx*this.rx), diff.y/(this.ry*this.ry));

    var aDiff = dir.dot(mDir);
    var bDiff = dir.dot(mDiff);
    var cDiff = diff.dot(mDiff) - 1.0;
    var dDiff = bDiff*bDiff - aDiff*cDiff;

    if (dDiff > 0) {
        var root = Math.sqrt(dDiff);
        var tA  = (-bDiff - root) / aDiff;
        var tB  = (-bDiff + root) / aDiff;

        if (!((tA < 0 || 1 < tA) && (tB < 0 || 1 < tB))) {
            if (0 <= tA && tA <= 1) {
                result.push(lerp(p1, p2, tA));
            }
            if ( 0 <= tB && tB <= 1 ) {
                result.push(lerp(p1, p2, tB));
            }
        }
    } else {
        var t = -bDiff/aDiff;
        if (0 <= t && t <= 1) {
            result.push(lerp(p1. a2, t));
        }
    }

    return result;
};

var Circle = function(cx, cy, r) {
    if(arguments.length === 2) {
        this.c = cx;
        this.r = cy;
    } else {
        this.c = {x: cx, y : cy};
        this.r = r;
    }

};

Circle.prototype.calcLineIntercept = function(p1, p2) {
    var result = [];

    if(arguments.length === 1) {
        p2 = p1.p2;
        p1 = p1.p1;
    }

    var a = (p2.x - p1.x) * (p2.x - p1.x)
        + (p2.y - p1.y) * (p2.y - p1.y);
    var b  = 2 * ((p2.x - p1.x) * (p1.x - this.c.x)
        + (p2.y - p1.y) * (p1.y - this.c.y)   );
    var cc = this.c.x*this.c.x + this.c.y*this.c.y + p1.x*p1.x + p1.y*p1.y -
        2 * (this.c.x * p1.x + this.c.y * p1.y) - this.r*this.r;
    var deter = b*b - 4*a*cc;

    if(deter > 0) {
        var root  = Math.sqrt(deter);
        var tA = (-b + root) / (2*a);
        var tB = (-b - root) / (2*a);

        if (!((tA < 0 || tA > 1) && (tB < 0 || tB > 1))) {
            if (0 <= tA && tA <= 1) {
                result.push(lerp(p1, p2, tA));
            }

            if (0 <= tB && tB <= 1) {
                result.push(lerp(p1, p2, tB));
            }
        }
    }
    return result;
};

var lerp = function(a, b, t) {
    return {
        x : a.x + (b.x - a.x) * t,
        y : a.y + (b.y - a.y) * t
    };
};

var Vector = function() {
    this.vectors = [];
    var currentArr;
    for(var i = 0; i < arguments.length; i++) {
        if(object.isArray(arguments[i])) {
            if(currentArr) {
                this.add(currentArr);
                currentArr = undefined;
            }
            this.add(arguments[i]);
        } else {
            currentArr = currentArr || [];
            currentArr.push(arguments[i]);
        }
    };

    if(currentArr) {
        this.add(currentArr);
        delete currentArr;
    }
};

/**
 * Adds a vector value either by providing seperated arguments or an array of values
 */
Vector.prototype.add = function() {
    var value;
    if(arguments.length > 1) {
        value = [];
        for(var i = 0; i < arguments.length; i++) {
            value.push(arguments[i]);
        }
    } else if(arguments.length === 1) {
        value = arguments[0];
    }
    this.vectors.push(value);
};

Vector.prototype.value = function() {
    try {
        var path = object.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
        return getVectorValue(this.vectors, path);
    } catch(e) {
        console.error('get value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.clear = function() {
    this.vectors = [];
};

Vector.prototype.setValue = function(pathArr, value) {
    try {
        pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
        var parentPath = pathArr.splice(0, pathArr.length -1);
        this.value(parentPath)[pathArr[pathArr.length -1]] = value;
    } catch(e) {
        console.error('set value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.insert = function(pathArr, value) {
    try {
        pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
        var parentPath = pathArr.splice(0, pathArr.length -1);
        this.value(parentPath).splice(pathArr[pathArr.length -1], 0, value);
    } catch(e) {
        console.error('set value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.length = function() {
    return this.vectors.length;
}

Vector.prototype.remove = function(pathArr) {
    pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
    var parentPath = pathArr.splice(0, pathArr.length -1);
    this.value(parentPath).splice(pathArr[pathArr.length -1], 1);
};

Vector.prototype.last = function() {
    return this.vectors[this.vectors.length -1];
};

Vector.prototype.each = function(handler) {
    object.each(this.vectors, function(index, value) {
        handler(index,value);
    });
};

/**
 * Note the indexes can be negative to retrieve values from the end of the vector e.g. -1 is the last
 * @param vectorArr
 * @param args
 * @returns {*}
 */
var getVectorValue = function(vectorArr, args) {
    if(!args) {
        return vectorArr;
    }else if(object.isArray(args)) {
        switch(args.length) {
            case 0:
                return vectorArr;
            case 1:
                return object.valueByIndex(vectorArr, args[0]);
            default:
                var index = args[0];
                return getVectorValue(vectorArr[index], args.splice(1));
        }
    } else {
        return object.valueByIndex(vectorArr, args);
    }
};
module.exports = {
    calcLineIntersection : calcLineIntersection,
    Line : Line,
    Circle : Circle,
    Ellipse : Ellipse,
    Vector : Vector
};