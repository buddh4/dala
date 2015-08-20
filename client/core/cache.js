var object = require('../util/object');
var dom = require('../dom/dom');

var Cache = function() {
    this.queryCache = {};
    this.svgCache = {};
};

Cache.prototype.$ = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    var settings = this.getCacheSettings(obj);
    return this.cacheCheck(settings.key, settings.$node, this.queryCache, preventCache);
};

Cache.prototype.svg = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    var settings = this.getCacheSettings(obj);
    return this.cacheCheck(settings.key, $.svg(settings.$node), this.svgCache, preventCache);
};

Cache.prototype.getCacheSettings = function(obj) {
    var settings = {};

    if(object.isString(obj)){
        settings.$node = this.queryCache[obj] || $(obj);
        settings.key = obj;
    } else if(obj.jQuery) {
        settings.$node = obj;
        settings.key = dom.getIdSelector(obj.attr('id'));
    } else {
            settings.$node = $(obj);
            settings.key = dom.getIdSelector(settings.$node.attr('id'));
    }

    return settings;
}

Cache.prototype.cacheCheck = function(key, obj, cache, preventCache) {
    preventCache = preventCache || false;
    if(key && obj) {
        return (!preventCache) ? cache[key] = obj : obj;
    }
}

Cache.prototype.remove = function(obj) {
    if(object.isString(obj)) {
        delete this.queryCache[obj];
    }
};

Cache.prototype.exists = function(selector) {
    return object.isDefined(queryCach[selector]);
};

Cache.prototype.sub = function() {
    return new Cache();
};

module.exports = new Cache();