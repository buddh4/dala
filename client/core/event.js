var events = {};

var object = require('../util/object');
var config = require('../core/config');
var SubEvent = require('./subEvent');

var Promise = require('bluebird');

var hasHandler = function(type) {
    return events[type];
};

module.exports = {
    listen:  function(type, handler, module) {
        if(!object.isFunction(handler)) {
            return;
        }

        var eventConfig = {
            handler : handler,
            module : module
        };

        if(!events[type]) {
            events[type] = [eventConfig];
        } else {
            events[type].push(eventConfig);
        }
    },

    unlisten: function(type, func) {
        if(events[type]) {
            var index = events[type].indexOf(func);
            if(index > -1) {
                events[type].splice(index, 1);
            }
        }
    },

    sub: function(context) {
        return new SubEvent(context, this);
    },

    command: function(command, execute) {
        if(execute) {
            this.trigger('command_execute', command);
        } else {
            this.trigger('command_add', command);
        }
    },

    trigger: function(type, data, rootEvt) {
        return new Promise(function(resolve, reject) {
            var event = rootEvt || {};

            event.data = data;
            event.type = type;

            if(hasHandler(event.type)) {
                var handlerArr = events[event.type];
                var that = this;
                object.each(handlerArr, function(index, eventConfig) {
                    var handler = eventConfig.handler;
                    var module;
                    try {
                        module = eventConfig.module;
                        if(eventConfig.module) {
                            handler.call(eventConfig.module, event);
                        } else {
                            handler(event);
                        }
                    } catch(err) {
                        var modText = (module && module.constructor && module.constructor.name)?module.constructor.name:'unknown';
                        if(modText === 'unknown' && config.debug()) {
                            console.error('Event handler error - module: '+modText+' event: '+event.type, handler, err);
                        } else {
                            console.error('Event handler error - module: '+modText+' event: '+event.type, err);
                        }
                        that.trigger('error', 'An error occured while executing the last action !');
                    }
                });
            }

            //We just resolve in all cases since the caller of trigger should remain independent of handler modules
            resolve();
        });
    },

    on: function(node, event, selector, data, handler) {
        $(node).on(event,selector,data, handler);
    },

    off: function(node, event, selector, handler) {
        $(node).off(event, selector, handler);
    },

    once: function(node, event, selector, data, handler) {
        $(node).one(event,selector,data, handler);
    },

    triggerDom: function(node, event) {
       $(node).trigger(event);
    }
};