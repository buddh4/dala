var util = require('../util/util');
var object = util.object;
var DomElement = require('../dom/domElement');

var Transform = function(def) {
    if(typeof def !== 'undefined' ) {
        if(object.isString(def)) {
            this.setDefinitionFromString(def);
        } else {
            this.definition = def;
        }
    } else {
        this.definition = {};
    }
};

Transform.prototype.setDefinitionFromString = function(value) {
    if(!this.definition) {
        this.definition = {};
    }

    // extract 'translate(200 200) rotate(45 50 50)' to "translate" "200 200" " rotate" "45 50 50" ""
    var transformations = value.split(/[\(\)]+/);
    for(var i = 0;i < transformations.length; i += 2) {
        var transformation = transformations[i].trim();
        if(transformation.length > 0) {
            var values = DomElement.getAttributeValueFromStringList(transformations[i+1]);
            for(var j = 0; j < values.length; j++) {
                // We prefer float values for calculations
                if(!isNaN(values[j])) {
                    values[j] = parseFloat(values[j]);
                }
            }
            this.definition[transformation] = values;
        }
    }
};

Transform.prototype.toString = function() {
    var values = [];
    for(var key in this.definition) {
        if(this.definition.hasOwnProperty((key))) {
            // first we assamble all transformations in an array ['translate(30)','rotate(45 50 50)']
            var singleTransformation = key+'('+DomElement.getAttributeString(this.definition[key])+')';
            values.push(singleTransformation);
        }
    }
    // merge the transformations to one attributestring
    var valueStr = DomElement.getAttributeString(values);

    if(valueStr.length > 0) {
        return valueStr;
    } else {
        // if we don't have any transormations set we just return an empty string
        return '';
    }
};

Transform.prototype.hasTransformation = function(key) {
    return (typeof this.definition[key] !== 'undefined');
};


Transform.prototype.rotate = function(val) {
    if(object.isDefined(val)) {
        this.definition.rotate = val;
        return this;
    } else {
        return this.definition.rotate || 0;
    }
};

Transform.prototype.scale = function(sx, sy) {
    sy = sy || sx;
    if(object.isDefined(sx)) {
        if(!this.definition.scale) {
            this.definition.scale = [sx, sy];
        } else {
            this.definition.scale[0] = sx;
            this.definition.scale[1] = sy;
        }
        return this;
    } else {
        var result = this.definition.scale;
        if(result && result.length === 1) {
            return [result[0], result[0]];
        } else if(result && result.length === 2) {
            return [result[0], result[1]]
        } else {
            return [1,1];
        }
    }
};

Transform.prototype.setScale = function(index, value) {
    if(index < 2 && this.definition.scale) {
        this.definition.scale[index] = value;
    }
};

Transform.prototype.translate = function(x, y) {
    var p = util.math.getPoint(x,y);

    if(object.isDefined(p)) {
        if(!this.definition.translate) {
            this.definition.translate = [p.x, p.y];
        } else {
            this.definition.translate[0] = p.x;
            this.definition.translate[1] = p.y;
        }
        return this;
    } else {
        if(this.definition.translate) {
            return {
                x : this.definition.translate[0],
                y : this.definition.translate[1]
            };
        } else {
            return {
                x : 0,
                y : 0
            }
        }
    }
}

module.exports = Transform;