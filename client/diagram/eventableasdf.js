var object = require('../util/object');

var Eventable = function(eventBase) {
    this.eventBase = eventBase;
};

Eventable.prototype.exec = function(func, args, prevDomEvent) {
    args = args || this;
    this.executeAddition(func, args);
    if(this.executeTemplateHook) {
        this.executeTemplateHook(func, args);
    }
    if(this.eventBase && !prevDomEvent) {
        this.trigger(func, args);
    }
};

Eventable.prototype.executeAddition = function(func, args) {
    object.each(this.additions, function(key, addition) {
        if(object.isDefined(addition) && object.isFunction(addition[func])) {
            addition[func].apply(addition, args);
        }
    });
};

Eventable.prototype.one = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().one(evt, handler);
    return this;
};

Eventable.prototype.on = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().on(evt, handler);
    return this;
};

Eventable.prototype.trigger = function(evt, args) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().trigger(evt, args);
    return this;
};

Eventable.prototype.off = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().off(evt, handler);
};

module.exports = Eventable;