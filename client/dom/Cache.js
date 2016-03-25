var queryCache = {};
var object = require('../util/object');

var Cache = function() {
  this.queryCache = {};
};

Cache.prototype.$ = function(obj, preventCache) {
    var $result;

    preventCache = preventCache || false;

    if(!obj) {
        return;
    }

    if(object.isString(obj)) {
        $result = queryCache[obj];
        if($result) {
            return $result;
        } else {
            return (!preventCache)? queryCache[obj] = $(obj) : $(obj);
        }
    }
};

Cache.prototype.remove = function(obj) {
    if(object.isString(obj)) {
        delete queryCache[obj];
    }
};

Cache.prototype.exists = function(selector) {
    return object.isDefined(queryCach[selector]);
};

Cache.prototype.sub = function() {
    return new Cache();
};

module.exports = new Cache();