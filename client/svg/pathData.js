var object = require('../util/object');

var PathData = function(def) {
    if(object.isString(def)) {
        this.dataArr = def.split(/(?=[MmLlHhVvCcSsQqTtAaZz]+)/);

        var that = this;
        object.each(this.dataArr, function(index, value) {
            that.dataArr[index] = that.fromString(value.trim());
            value.trim();
        });
    } else {
        this.dataArr = [];
    }
};

PathData.prototype.getCorners = function() {
    var xMin, xMax, yMin, yMax;
    xMin = yMin = Number.POSITIVE_INFINITY;
    xMax = yMax = Number.NEGATIVE_INFINITY;

    object.each(this.dataArr, function(index, def) {
        if(object.isDefined(def.value)) {
            xMin = (object.isDefined(xMin) && xMin > def.value.x) ? def.value.x : xMin;
            yMin = (object.isDefined(yMin) && yMin > def.value.y) ? def.value.y : yMin;

            xMax = (object.isDefined(xMax) && xMax < def.value.x) ? def.value.x : xMax;
            yMax = (object.isDefined(yMax) && yMax < def.value.y) ? def.value.y : yMax;
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

PathData.prototype.getY = function(value) {
    return this.getCorners()[0].y;
};

PathData.prototype.getRightX = function(value) {
    return this.getCorners()[1].x;
};

PathData.prototype.getBottomY = function(value) {
    return this.getCorners()[2].y;
};

PathData.prototype.fromString = function(value) {
    //Note this is just possible for normal points (x/y) values !
    var type = value.charAt(0);
    var values = value.substring(1,value.length).split(',');
    return {type : type, value:this.toPoint(values[0], values[1]), absolute : (type === type.toUpperCase())};
};

PathData.prototype.setData = function(value) {
    if(object.isArray(value)) {
        this.dataArr = value;
    }
};

PathData.prototype.clear = function() {
    this.dataArr = [];
    return this;
};

PathData.prototype.start = function(x, y, absolute) {
    this.setPath(0, 'm', this.toPoint(x,y), absolute);
    return this;
};

PathData.prototype.end = function(x,y, absolute) {
    if(arguments.length <= 0) {
        return this.dataArr[this.dataArr.length - 1];
    }
    this.setPath((this.dataArr.length - 1), 'l', this.toPoint(x,y), absolute);
    return this;
};

PathData.prototype.setPath = function(index, type, value, absolute) {
    absolute = object.isDefined(absolute) ? absolute : true;
    this.dataArr[index] = {type : type, value : value, absolute : absolute};
    return this;
};

PathData.prototype.setPoint = function(index, value) {
    this.dataArr[index].value = value;
    return this;
};

PathData.prototype.addPath = function(index, type, value, absolute) {
    absolute = object.isDefined(absolute) ? absolute : true;
    this.dataArr.splice(index, 0, {type : type, value : value, absolute : absolute});
    return this;
};

PathData.prototype.removePath = function(index) {
    this.dataArr.splice(index, 1);
    return this;
};

PathData.prototype.addLine = function(index, value, absolute) {
    this.addPath(index, 'l', value, absolute);
    return this;
};

PathData.prototype.complete = function() {
    this.dataArr.push({type: 'z', absolute : true});
    return this;
};

PathData.prototype.get = function(index) {
    return this.dataArr[index];
};

PathData.prototype.line = function() {
    var value = [];

    if(arguments.length > 2) {
        for(var i = 0; i < arguments.length; i = i + 2) {
            value.push(this.toPoint(arguments[i],arguments[i +1]));
        }
    } else {
        value = this.toPoint(arguments[0], arguments[1]);
    }

    this.dataArr.push({type : 'l', value:value, absolute : true });
    return this;
};

PathData.prototype.toPoint = function(x,y) {
    x = (object.isString(x)) ? parseFloat(x) : x;
    y = (object.isString(y)) ? parseFloat(y) : y;

    return {x:x,y:y};
};

PathData.prototype.toString = function() {
    var result = '';
    var that = this;
    object.each(this.dataArr, function(index, pathPart) {
        var pathPartVal = that.getValue(pathPart.value);
        var partType = (pathPart.absolute) ? pathPart.type.toUpperCase() : pathPart.type.toLowerCase();
        result += partType + pathPartVal + ((index + 1 < that.dataArr.length)?' ':'');
    });
    return result;
};

PathData.prototype.getValue = function(value) {
    var that = this;
    var result = '';
    if(object.isArray(value)) {
        var resultVal = '';
        object.each(value, function(i, val) {
            result += that.getValue(val)+ ((i + 1 < value.length)?' ':'');
        });
    } else if(object.isObject(value)) {
        result = value.x+','+value.y;
    } else if(object.isDefined(value)){
        result = value;
    } else {
        result = '';
    }
    return result;
};

module.exports = PathData;