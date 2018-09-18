var object = require('./object');

exports.endsWith = function(val, suffix) {
    if(!object.isDefined(val) || !object.isDefined(suffix)) {
        return false;
    }
    return val.indexOf(suffix, val.length - suffix.length) !== -1;
};

exports.cutprefix = function(val, prefix) {
   return val.substring(prefix.length, val.length);
};

exports.cutsuffix = function(val, suffix) {
    return val.slice(0, suffix.length * -1);
};

exports.startsWith = function(val, prefix) {
    if(!object.isDefined(val) || !object.isDefined(prefix)) {
        return false;
    }
    return val.indexOf(prefix) === 0;
};