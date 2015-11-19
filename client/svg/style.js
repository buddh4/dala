var object = require('../util/object');
var string = require('../util/string');

var REGEXP_PROPERTY_SUFFIX = ':[a-zA-Z0-9#,\.]*(;|$)';

var Style = function(key, value) {
    if(object.isString(key) && !object.isDefined(value)) {
        this.value = key;
    } else {
        this.set(key,value);
    }
};

Style.prototype.set = function(key, value) {
    if(object.isObject(key)) {
        object.each(key, function(objKey, val) {
            if(key.hasOwnProperty(objKey)) {
                this.set(objKey,val);
            }
        });
    } else if(object.isString(key) && object.isDefined(value)) {
        if(!object.isDefined(this.value)) {
            this.value = "";
        }

        if(this.value.indexOf(key+':') >= 0) {
            var regExp = new RegExp(key+REGEXP_PROPERTY_SUFFIX, 'gi');
            this.value = this.value.replace(regExp, this.createValueString(key,value));
        } else {
            this.value += (!string.endsWith(this.value,';') && this.value.length > 0) ? ';' + this.createValueString(key,value) : this.createValueString(key,value);
        }
    } else if(object.isString(key)) {
        this.value = key;
    }
};

Style.prototype.get = function(key) {
    var regExp = new RegExp(key+REGEXP_PROPERTY_SUFFIX, 'gi');
    var result = this.value.match(regExp);
    if(object.isArray(result)) {
        var value = result[0];
        var splitted = value.split(':');
        if(splitted.length > 1) {
            var result = splitted[1];
            return (string.endsWith(result, ';'))? result.substring(0,result.length -1) : result;
        }
    }
};

Style.prototype.createValueString = function(key, value) {
    return key+':'+value+';';
};

Style.prototype.toString = function() {
    return this.value;
};

module.exports = Style;
