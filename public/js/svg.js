(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./ui/jqueryPlugins');
require('./svg/draggable');

if(!window.dala) {
    dala = {};
}

if(!window.dala.SVG) {
    window.dala.SVG = require('./svg/svg');
}


},{"./svg/draggable":11,"./svg/svg":20,"./ui/jqueryPlugins":27}],2:[function(require,module,exports){
var object = require('../util/object');
var dom = require('../dom/dom');
var string = require('../util/string');

var Cache = function() {
    this.queryCache = {};
    this.svgCache = {};
};

Cache.prototype.clearBySuffix = function(suffix) {
    for(key in this.queryCache) {
        if(this.queryCache.hasOwnProperty(key) && string.endsWith(key, suffix)) {
            delete this.queryCache[key];
        };
    }

    for(key in this.svgCache) {
        if(this.svgCache.hasOwnProperty(key) && string.endsWith(key, suffix)) {
            delete this.svgCache[key];
        };
    }
};

Cache.prototype.$ = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    if(this.queryCache[obj]) {
        return this.queryCache[obj];
    }

    var settings = this.getCacheSettings(obj, this.queryCache);
    return this.cacheCheck(settings.key, settings.$node, this.queryCache, preventCache);
};

Cache.prototype.svg = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    if(this.svgCache[obj]) {
        return this.svgCache[obj];
    }

    var settings = this.getCacheSettings(obj, this.svgCache);
    return this.cacheCheck(settings.key, $.svg(settings.$node), this.svgCache, preventCache);
};

Cache.prototype.getCacheSettings = function(obj, cache) {
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
    } else {
        return obj;
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
},{"../dom/dom":6,"../util/object":32,"../util/string":33}],3:[function(require,module,exports){
var object = require('../util/object');

var values = {};

module.exports = {
    val : function(key, defaultVal) {
        if(object.isDefined(key)) {
            var result = values[key];
            return (object.isDefined(result)) ? result : defaultVal;
        }
    },

    is : function(key, defaultVal) {
        return this.val(key,defaultVal) === true;
    },

    debug : function(val) {
        if(object.isBoolean(val)) {
            this.setVal('debug', val);
        }
        return this.val('debug', false);
    },

    setVal : function(key, value) {
        if(object.isDefined(key) && object.isDefined(value)) {
            values[key] = value;
            var val = this.val(key);
        }
    },

    replaceConfigValues : function(text, config) {
        var result = text;
        object.each(config, function(key, value) {
            var regExp = new RegExp("{" + key + "}", "g");
            result = result.replace(regExp, value);
        });
        return result;
    }
};
},{"../util/object":32}],4:[function(require,module,exports){
var events = {};

var object = require('../util/object');
var config = require('../core/config');
var SubEvent = require('./subEvent');

var Promise = require('bluebird');

var hasHandler = function(type) {
    return events[type];
};

mouse = {};

$(document).on( 'mousemove', function(e) {
    mouse = e;
});


module.exports = {
    mouse : function() {
        return mouse;
    },
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
        var that = this;
        return new Promise(function(resolve, reject) {
            var event = rootEvt || {};

            event.data = data;
            event.type = type;

            if(hasHandler(event.type)) {
                var handlerArr = events[event.type];
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
},{"../core/config":3,"../util/object":32,"./subEvent":5,"bluebird":36}],5:[function(require,module,exports){
var object = require('../util/object');

var SubEvent = function(context, event) {
    this.context = context;
    this.event = event;
};

SubEvent.prototype.mouse = function() {
    return this.event.mouse();
};

SubEvent.prototype.getSubType = function(type) {
    return this.context+':'+type;
};

SubEvent.prototype.listen = function(type, handler, module) {
    //TODO: implement bubble
    this.event.listen(this.getSubType(type), handler, module);
};

SubEvent.prototype.unlisten = function(type, func) {
    this.event.unlisten(this.getSubType(type), func);
};

SubEvent.prototype.trigger = function(type, data, rootEvt, preventBubble) {
    this.event.trigger(this.getSubType(type), data, rootEvt);
    if(!preventBubble) {
        this.event.trigger(type, data, rootEvt);
    }
};

SubEvent.prototype.command = function(command, execute) {
    this.event.command(command, execute);
};

SubEvent.prototype.on = function(node, event, selector, data, handler) {
    this.event.on(node, event, selector, data, handler);
};

SubEvent.prototype.off = function(node, event, selector, handler) {
    this.event.off(node, event, selector, handler);
};

SubEvent.prototype.once = function(node, event, selector, data, handler) {
    this.event.once(node, event, selector, data, handler);
};

SubEvent.prototype.triggerDom = function(node, event) {
    this.event.triggerDom(node,event);
}

SubEvent.prototype.sub = function(context) {
    return new SubEvent(context, this);
}

module.exports = SubEvent;
},{"../util/object":32}],6:[function(require,module,exports){
var xml = require('../util/xml');
var object = require('../util/object');
var string = require('../util/string');

var elementCache = {};

var create = function(element, attributes, text) {
    var $element = $(document.createElement(element));

    if(attributes) {
        $.each(attributes, function (key, value) {
            $element.attr(key, value);
        });
    }

    if(text) {
        $element.text(text);
    }
    return $element;
};

var query = function(selector, cache) {
    var result;
    if(cache) {
        result = $.qCache(selector);
    } else {
        result = $(selector);
    }
    return result;
};

var getJQueryNode = function(node) {
    if(!node) {
        return;
    }
    // The node is either a dom node or a selector
    if(object.isString(node)) {
        return query(node);
    } else if(node.getAttribute){
        var id = node.getAttribute('id');
        if(id) {
            return $.qCache('#'+node.getAttribute('id'), true);
        } else {
            return $(node);
        }
    } else if(node.jQuery) {
        return node;
    } else {
        // e.g. document, window...
        return $(node);
    }
};

var moveDown = function(node, selector) {
    var $node = getJQueryNode(node);
    $node.before($node.next(selector));
};

var moveUp = function(node, selector) {
    var $node = getJQueryNode(node);
    $node.after($node.prev(selector));
};

var insertAfterIndex = function(node, index) {
    var $node = getJQueryNode(node);
    $node.parent().children().eq(index).after($node);
};

var insertSVGAfter = function(container, element, text, insertAfter) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,text,insertAfter);
};

var prependSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,true,text);
};

var appendSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,false,text);
};

var prependToRoot = function(element) {
    if(!element.root.hasChildNodes()) {
        element.instance(element.root.appendChild(element.instance()));
    } else {
        element.instance(element.root.insertBefore(element.instance(), element.root.childNodes[0]));
    }
};

var addSVGElement = function(container, element, prepend, text, insertAfter) {
    prepend = (object.isDefined(prepend))? prepend : false;
    // If only the container is given we assume its an SVGElement object with contained root node
    if(object.isDefined(container) && !object.isDefined(element)) {
        element = container;
        container = container.getRootNode();
    } else if(object.isString(container)) {
        container = query(container)[0];
    } else if(container.instance) {
        container = container.instance();
    }

    var instance;

    if(!element.instance || !object.isDefined(element.instance())) {
        instance = document.createElementNS("http://www.w3.org/2000/svg", element.tagName);
        $.each(element.attributes, function(key, value) {
            if(string.startsWith(key, 'xlink:')) {
                instance.setAttributeNS('http://www.w3.org/1999/xlink',string.cutprefix(key, 'xlink:'), value);
            } else {
                instance.setAttribute(key, value.toString());
            }
        });
    } else {
        instance = element.instance();
    }

    if(object.isDefined(text)) {
        var txtNode = document.createTextNode(text);
        instance.appendChild(txtNode);
    }
    if(object.isDefined(insertAfter)) {
        //if the parents lastchild is the targetElement...
        if(container.lastchild == insertAfter) {
            //add the newElement after the target element.
            container.appendChild(instance);
        } else {
            // else the target has siblings, insert the new element between the target and it's next sibling.
            container.insertBefore(instance, insertAfter.nextSibling);
        }
    } else if(!prepend || !container.hasChildNodes() ) {
        instance = container.appendChild(instance);
    } else {
        instance = container.insertBefore(instance,container.childNodes[0]);
    }

    if(object.isFunction(element.instance)) {
        element.instance(instance);
    } else {
        element.instance = instance;
    }

    return element;
};

var importSVG = function(container, svgXML, prepend) {
    var $svgXML, name, attributes;

    if(svgXML.jquery) {
        $svgXML = svgXML;
    } else if(object.isString(svgXML)) {
        $svgXML = $(parseXML(svgXML.trim()));
        $svgXML = $($svgXML.get(0).documentElement);
    } else {
        $svgXML = $(svgXML);
    }

    if($svgXML.nodeName) {
        name = $svgXML.nodeName;
        attributes = getAttributes($svgXML);
    } else {
        name = $svgXML.get(0).tagName;
        attributes = getAttributes($svgXML.get(0));
    }

    //We create a dummy element object
    var element = {
        tagName : name,
        attributes : attributes,
        instance : function(inst) {
            if(object.isDefined(inst)) {
                this.instanceElement = inst;
            } else {
                return this.instanceElement;
            }
        }
    };

    if(!prepend) {
        appendSVGElement(container, element, _getChildText($svgXML));
    } else {
        prependSVGElement(container, element, _getChildText($svgXML));
    }

    $svgXML.children().each(function(index, child) {
        importSVG(element.instance(), child);
    });

    return element.instance();
};

var _getChildText = function(node) {
    if(!node.jquery) {
        node = $(node);
    }

    var childText = node.contents().filter(function(){
        return this.nodeType === 3;
    });

    if(object.isDefined(childText) && childText.length > 0) {
        return childText[0].nodeValue;
    }
};

var getAttributes = function(node) {
    var result = {};
    $(node.attributes).each(function() {
        result[this.nodeName] = this.value;
    });
    return result;
};

var findIncludeSelf = function(node, selector) {
    return $(node).find(selector).andSelf().filter(selector).get(0);
};

var parseNodeXML = function(node) {
    if(!node) {
        return;
    }
    return $.parseXML($(node).text());
};

var parseXML = function(str) {
    return xml.parseXML(str);
};

var parseNodeJSON = function(node) {
    return $.parseJSON($(node).text());
};

var getRawId = function(idSelector) {
    if(!object.isString(idSelector)) {
        return;
    }

    if(idSelector.charAt(0) === '#') {
        return idSelector.substring(1, idSelector.length);
    } else {
        return idSelector;
    }
};

var getIdSelector = function(rawId) {
    if(!object.isString(rawId)) {
        return;
    }

    if (rawId.charAt(0) !== '#') {
        return '#' + rawId;
    } else {
        return rawId;
    }
};

module.exports = {
    appendSVGElement : appendSVGElement,
    prependSVGElement : prependSVGElement,
    insertSVGAfter : insertSVGAfter,
    insertAfterIndex : insertAfterIndex,
    create : create,
    prependToRoot : prependToRoot,
    importSVG : importSVG,
    moveDown : moveDown,
    moveUp : moveUp,
    findIncludeSelf : findIncludeSelf,
    parseNodeXML : parseNodeXML,
    parseNodeJSON : parseNodeJSON,
    getAttributes : getAttributes,
    getRawId : getRawId,
    getIdSelector: getIdSelector
};
},{"../util/object":32,"../util/string":33,"../util/xml":35}],7:[function(require,module,exports){
var util = require('../util/util');
var object = util.object;
var dom = util.dom;

var Eventable = require('./eventableNode');

var Element = function(tagName, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributes = {};

    if(object.isObject(tagName)) {
        cfg = tagName;
        tagName = cfg.tagName;
        delete cfg.tagName;
    }

    this.tagName = tagName;

    if(object.isObject(cfg)) {
        if(cfg.children) {
            this.children = cfg.children;
            delete cfg.children;
        }

        this.single = cfg.single || false;
        delete cfg.single;

        //We assume all remaining cfg entries are attributes
        for(var attributeKey in cfg) {
            if(cfg.hasOwnProperty(attributeKey)) {
                this._setAttribute(attributeKey, cfg[attributeKey]);
            }
        }
    }

    //See eventable
    this.eventBase = this;
};

util.inherits(Element, Eventable);

Element.prototype.instance = function(instance) {
    if(object.isDefined(instance)) {
        this.domInstance = instance;
        this.tagName = instance.tagName;
        this.loadAttributes(instance);
        return this;
    } else {
        return this.domInstance;
    }
};

/**
 * Loads all attributes from the dom instance into our attribute array except already existing attributes.
 * @param instance
 */
Element.prototype.loadAttributes = function(instance) {
    this.attributes = this.attributes || {};
    var attributes = dom.getAttributes(instance);
    for(var key in attributes) {
        if(attributes.hasOwnProperty(key) && !this.attributes[key]) {
            this._setAttribute(key, attributes[key], true);
        }
    }
};

Element.prototype.id = function(newId) {
    if(object.isString(newId)) {
        this._setAttribute('id',newId);
        return this;
    } else {
        return this.attr('id');
    }
};

Element.prototype.update = function() {
    for(attributeKey in this.attributeSetter) {
        if(this.attributeSetter.hasOwnProperty(attributeKey)) {
            this.updateAttribute(attributeKey);
        }
    }
};

Element.prototype.updateAttribute = function(key) {
    this._setAttribute(key, this.attributes[key]);
};

Element.prototype._setAttribute = function(key, value, prevDomSet) {
    // If first arg is object handle its properties as attributes
    if(object.isObject(key)) {
        for(var attribute in key) {
            if(object.isDefined(attribute) && key.hasOwnProperty(attribute)) {
                this._setAttribute(attribute, key[attribute]);
            }
        }
    } else {

        // Some elementtypes can transform specific types of attributes to special objects
        // which are able to render and set the values in a special way.
        if(!this.hasClass('noParse') && object.isString(value) && object.isDefined(this.attributeSetter[key])) {
            value = this.attributeSetter[key](value);
        }

        if(!object.isDefined(value) || value.length === 0) {
            return;
        }

        // Just transform stringlits values to arrays in case its a string list
        this.attributes[key] = value;

        // Directly set it to the SVG instance if already rendered
        if(this.domInstance && !prevDomSet) {
            var val = Element.getAttributeString(value);
            this.domInstance.setAttribute(key,val);
        }
    }
};

Element.prototype.hasClass = function(searchClass) {
    if(this.domInstance) {
        //Jquery hasclass does not work with svg elements
        var elementClass = ' '+ this.attr('class')+' ';
        return elementClass.indexOf(' '+searchClass+' ') > -1;
    }
};

Element.prototype.$ = function(selector) {
    if(!this.$domInstance && this.domInstance) {
        this.$domInstance = $(this.domInstance);
    }

    return (selector) ? this.$domInstance.find(selector) : this.$domInstance;
};

Element.getAttributeString = function(value) {
    var result = '';

    if(!object.isDefined(value)) {
        return '';
    }

    if(object.isArray(value)) {
        object.each(value, function(index, part) {
            result += (++index === value.length) ? part : part+' ';
        });
    } else {
        result = value.toString();
    }
    return result;
};

Element.getAttributeValueFromStringList = function(value) {
    if(object.isString(value) && value.indexOf(' ') > -1) {
        return value.split(/[\s]+/);
    } else {
        return value;
    }
};

Element.prototype.attrNumber = function(key, value) {
    var val = util.app.parseNumberString(this.attr(key, value));
    return (object.isDefined(value)) ? this : val;
};

Element.prototype.pointerEvents = function(value) {
    return this.attr('pointer-events', value);
};
Element.prototype.attr = function(attribute) {
    if(arguments.length > 1 && object.isDefined(arguments[1])) {
        //TODO: implement for mor thant 2
        var obj = {};
        obj[arguments[0]] = arguments[1];
        return this.attr(obj);
    } else if(object.isString(attribute)) {
        var result = this.attributes[attribute];
        if(!result && this.instance()) {
            result = this.attributes[attribute] =  this.$().attr(attribute);
        }
        return result;
    } else {
        this._setAttribute(attribute);
    }
    return this;
};

module.exports =  Element;

},{"../util/util":34,"./eventableNode":8}],8:[function(require,module,exports){
var object = require('../util/object');
var config = require('../core/config');

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
    if(!this.additions) {
        return;
    }
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
    this.eventBase.$().one(evt, this.wrap(evt, handler));
    return this;
};

Eventable.prototype.on = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().on(evt, this.wrap(evt, handler));
    return this;
};

Eventable.prototype.wrap = function(eventType, handler) {
    var that = this;
    return function() {
        if(that.isExecutionAllowed(eventType)) {
            handler.apply(undefined, arguments);
        }
    }
};

Eventable.prototype.isExecutionAllowed = function(eventType) {
    if(this.freezed) {
        return false;
    } else if(config.is('events_restricted', false) && !this.excludeEventRestrictions) {
        return false;
    } else {
        return true;
    }
};

Eventable.prototype.freeze = function() {
    this.freezed = true;
    this.eventBase.freezed = true;
};


Eventable.prototype.unfreeze = function() {
    this.freezed = false;
    this.eventBase.freezed = true;
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
},{"../core/config":3,"../util/object":32}],9:[function(require,module,exports){
var DomElement = require('../dom/domElement');
var Style = require('./style');
var util = require('../util/util');
var dom = util.dom;
var object = util.object;

/*
 * Constructor for SVG Elements
 *
 * @param {type} name the element Name e.g. rect, circle, path...
 * @param {type} cfg attributes and additional configurations
 * @param {type} attributeSetter you can add additional attribute setter
 * for special attributes default attribute setter given by this impelementation
 * are transform and style setter
 */
var SVGElement = function(name, svg, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributeSetter.style = this.styleAttributeSetter;
    this.SVGElement = true;

    // If first attribute is not a string we assume a svg node constructor call.
    if(!object.isString(name)) {
        this.instance(name);
        cfg = dom.getAttributes(name);
        name = name.tagName;
    }

    this.svg = svg;
    this.root = svg.root || this;
    DomElement.call(this, name, cfg, this.attributeSetter);
};

util.inherits(SVGElement, DomElement);

SVGElement.prototype.styleAttributeSetter = function(trnasformationString) {
    return new Style(trnasformationString);
};

SVGElement.prototype.getRootNode = function() {
    return this.root.instance();
};

SVGElement.prototype.getSVGRoot = function() {
    return this.root;
};

SVGElement.prototype.append = function(element) {
    var result;
    if(arguments.length > 1) {
        result = [];
        var that = this;
        object.each(arguments, function(index, val) {
            result.push(that.append(val));
        })
    } else if(arguments.length === 1) {
        result =  util.dom.appendSVGElement(this.instance(), element);
    }
    return result;
};

SVGElement.prototype.prepend = function(element) {
    var result;
    if(arguments.length > 1) {
        result = [];
        var that = this;
        object.each(arguments, function(index, val) {
            result.push(that.prepend(val));
        })
    } else if(arguments.length === 1) {
        result =  util.dom.prependSVGElement(this.instance(), arguments[0]);
    }
    return result;
};

SVGElement.prototype.remove = function() {
    this.$().remove();
};

SVGElement.prototype.find = function(selector) {
    var result = this.svg.get(this.$().find(selector));
    return util.object.isArray(result) ? result : [result];
};

SVGElement.prototype.firstChild = function(selector) {
    return $.svg(this.$().children(selector).first());
};

SVGElement.prototype.children = function(selector) {
    return $.svg(this.$().children(selector));
};

SVGElement.prototype.parent = function() {
    return $.svg(this.$().parent());
};

SVGElement.prototype.moveDown = function(selector) {
    var $node = this.$();
    $node.prevAll(selector).first().before($node);
};

SVGElement.prototype.moveUp = function(selector) {
    var $node = this.$();
    $node.nextAll(selector).first().after($node);
};

SVGElement.prototype.back = function() {
    dom.prependToRoot(this);
    return this;
};

/**
 * SVG Styles
 */

SVGElement.prototype.style = function(key, value) {
    if(!object.isDefined(value) && object.isString(key) && key.indexOf(':') <= 0
        && object.isDefined(this.attributes.style)) {
        //GETTER CALL
        return this.attributes.style.get(key);
    } else if(!object.isDefined(this.attributes.style) && object.isDefined(value)) {
        this.attributes.style = new Style(key, value);
    } else if(object.isDefined(value)) {
        this.attributes.style.set(key, value);
    } else {
        return;
    }
    this.updateAttribute('style');
    return this;
};

SVGElement.prototype.dala = function(key, value) {
    return this.attr('dala:'+key, value);
};

SVGElement.prototype.getBBox = function() {
    return this.instance().getBBox();
};

SVGElement.prototype.getBoundingClientRect = function() {
    return this.instance().getBoundingClientRect();
};

SVGElement.prototype.toString = function() {
    return util.xml.serializeToString(this.instance());
};

SVGElement.prototype.clone = function() {
    return this.$().clone();
};

module.exports = SVGElement;

},{"../dom/domElement":7,"../util/util":34,"./style":19}],10:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGEllipse = require('./ellipse');
var SVGShape = require('./svgShape');

var SVGCircle = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'circle', svgRoot, cfg);
};

util.inherits(SVGCircle, SVGEllipse);

SVGCircle.prototype.r = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[1];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('r') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('r') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('r', value);
        return this;
    }
};

SVGCircle.prototype._setHeight = function(value) {
    var v = value / 2;
    this.cy(v).cx(v).r(v);
};

SVGCircle.prototype._setWidth = function(value) {
    return this.height(value);
};

SVGCircle.prototype.rx = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.ry = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.overlayCheck = function(position) {
    return new util.math.Circle(this.getCenter(), this.r()).overlays(position);
};

module.exports = SVGCircle;
},{"../util/object":32,"../util/util":34,"./ellipse":13,"./svgShape":23}],11:[function(require,module,exports){
var SVGShape = require('./svgShape');
var util = require('../util/util');
var event = require('../core/event');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var ShiftDrag = function(cfg) {
    this.cfg = cfg;
    if(!cfg.restrictionX && !cfg.restrictionY) {
        this.init();
    } else {
        this.disable();
    }
};

ShiftDrag.prototype.init = function() {
    this.state = 'init';
    this.xShift = {
        shiftAlign : 0,
        unshiftAlign : 0
    };

    this.yShift = {
        shiftAlign : 0,
        unshiftAlign : 0
    };
};

ShiftDrag.prototype.disable = function() {
    this.state = 'disabled';
};

ShiftDrag.prototype.update = function(evt, dx ,dy) {
    var that = this;
    switch(this.state) {
        case 'init' :
            this.xShift.shiftAlign += dx;
            this.yShift.shiftAlign += dy;

            if(this.checkShiftHook(evt)) {
                if(Math.abs(this.xShift.shiftAlign) > Math.abs(this.yShift.shiftAlign)) {
                    this.restrictionX = undefined;
                    this.restrictionY = function(evt, dx ,dy) {
                        return that.shiftRestriction(that.yShift, dy);
                    };
                    this.state = 'shiftedX';
                } else {
                    this.restrictionY = undefined;
                    this.restrictionX = function(evt, dx , dy) {
                        return that.shiftRestriction(that.xShift, dx);
                    };
                    this.state = 'shiftedY';
                }
            }
            break;
        case 'shiftedX':
            if(!evt.shiftKey) {
                this.restrictionY = function(evt, dx, dy) {
                    return that.unShiftRestriction(that.yShift, dy);
                };
                this.state = 'init';
            }
            break;
        case 'shiftedY':
            if(!evt.shiftKey) {
                this.restrictionX = function(evt, dx ,dy) {
                    return that.unShiftRestriction(that.xShift, dx);
                };
                this.state = 'init';
            }
            break;
    }
};


ShiftDrag.prototype.shiftRestriction = function(shiftData, d) {
    //Update shifted d
    shiftData.unshiftAlign += d;
    //Align shift drag back to the start position
    var result = (Math.abs(shiftData.shiftAlign) > 0) ? shiftData.shiftAlign * -1 : 0;
    shiftData.shiftAlign = 0;
    return result;
};

ShiftDrag.prototype.unShiftRestriction = function(shiftData, d) {
    //Align shift drag back to the start position
    var result = shiftData.unshiftAlign + d;
    shiftData.unshiftAlign = 0;
    return result;
};

ShiftDrag.prototype.checkShiftHook = function(evt) {
    return evt.shiftKey && (Math.abs(this.xShift.shiftAlign) > 4 || Math.abs(this.yShift.shiftAlign) > 4);
};

//TODO: this would be more elegant to use the alignment align center to center.x if checkShiftHook

ShiftDrag.prototype.getRestrictionX = function() {
    return this.cfg.restrictionX || this.restrictionX;
};

ShiftDrag.prototype.getRestrictionY = function() {
    return this.cfg.restrictionY || this.restrictionY;
};

SVGShape.prototype.draggable = function(cfg, dragElement) {
    var cfg = cfg || {};



    if(dragElement) {
        dragElement = this.svg.get(dragElement);
    } else {
        dragElement = this;
    }

    var that = this;

    var dragMove = function(evt) {
        if(evt.preventDefault) {
            evt.preventDefault();
        }

        if(!evt.triggerEvent) {
            that.attr('pointer-events', 'none');
        }

        var actualdx = (object.isDefined(evt.dx)) ? evt.dx : evt.clientX - that.dragCurrentX;
        var actualdy = (object.isDefined(evt.dy)) ? evt.dy : evt.clientY - that.dragCurrentY;

        // DRAG BEFORE HOOK
        if(cfg.dragBeforeMove) {
            cfg.dragBeforeMove.apply(that, [evt, actualdx, actualdy]);
        }

        // DRAG ALIGNMENT
        if(cfg.dragAlignment && !evt.triggerEvent) {
            var alignment = cfg.dragAlignment.check(actualdx, actualdy);
            actualdx = alignment.dx;
            actualdy = alignment.dy;
        }

        //Check for shiftDrag restriction, shiftDrag will only hook up if no other restriction is set.
        //Shiftdrag is not given for triggerdrags
        if(that.shiftDrag && !evt.triggerEvent) {
            that.shiftDrag.update(evt, actualdx, actualdy);
            var restrictionX = that.shiftDrag.getRestrictionX();
            var restrictionY = that.shiftDrag.getRestrictionY();
        }

        // DRAG RESTRICTION
        var dx = (restrictionX && !evt.triggerEvent) ? restrictionX.apply(that, [evt, actualdx, actualdy]) : actualdx;
        var dy = (restrictionY && !evt.triggerEvent) ? restrictionY.apply(that, [evt, actualdx, actualdy]) : actualdy;

        //TODO: somehow the scale should be determined in a more elegant way perhaps store it in svg instance...
        if(cfg.getScale && !evt.triggerEvent) {
            var scale = cfg.getScale();
            dx /= scale;
            dy /= scale;
        }

        // EXECUTE DRAG
        if(dx !== 0 || dy !== 0) {
            that.move(dx, dy);
        }

        var evtData = getMouseEventData(evt);
        // Keep track of current mouse position
        that.dragCurrentX = evtData.clientX;
        that.dragCurrentY = evtData.clientY;

        that.dxSum += dx;
        that.dySum += dy;

        // DRAG MOVE HOOK
        if(cfg.dragMove) {
            cfg.dragMove.apply(that, [evt, dx, dy]);
        }
    };

    var dragEnd = function(evt) {
        evt.preventDefault();
        //Turn off drag events
        that.getSVGRoot().off('mousemove');
        event.off(document, 'mouseup', dragEnd);

        if(cfg.dragAlignment) {
            cfg.dragAlignment.reset();
        }

        this.drag = false;

        if(cfg.cursor) {
            $('body').css('cursor','default');
        }

        // DRAG END HOOK
        if(cfg.dragEnd) {
            cfg.dragEnd.apply(that, [evt]);
        }

        that.attr('pointer-events', 'all');
    };

    if(dragElement) {
        var mouseDownHandler = function(e) {
            if(e.ctrlKey || !that.isVisible()) {
                return;
            }
            e.preventDefault();
            // We stop the event propagation to prevent the document mousedown handler to fire
            e.stopPropagation();

            initDragValues(that, e, cfg);

            // DRAG START HOOK
            if(cfg.dragStart) {
                cfg.dragStart.apply(that, [e]);
            }

            if(cfg.cursor) {
                $('body').css('cursor', cfg.cursor);
            }

            that.drag = true;
            event.on(that.getRootNode(), 'mousemove', dragMove);
            event.on(document, 'mouseup', dragEnd);
        };

        if(cfg.once) {
            dragElement.on('mousedown', mouseDownHandler);
        } else {
            dragElement.on('mousedown', mouseDownHandler);
        }
    }

    //Simulates an drag start event
    this.initDrag = function() {
        dragElement.trigger('mousedown');
    };

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    //See Selectionmanager setNodeSelection dragMove handler
    this.triggerDrag = function(dx, dy) {
        dragMove.apply(this,[{dx:dx, dy:dy, triggerEvent:true}]);
    };

    return this;
};

var initDragValues = function(that, evt, cfg) {
    that.dxSum = 0;
    that.dySum = 0;
    that.shiftDrag = new ShiftDrag(cfg);
    var evtData = getMouseEventData(evt);
    that.dragCurrentX = evtData.clientX;
    that.dragCurrentY = evtData.clientY;

    that.drag = true;
};

var getMouseEventData = function(evt) {
    if(!evt.clientX) {
        return event.mouse();
    }
    return evt;
};
},{"../core/config":3,"../core/event":4,"../util/util":34,"./svgShape":23}],12:[function(require,module,exports){
var shapes = {}
shapes.svg = shapes.Svg = require('./svgRoot');
shapes.circle = shapes.Circle = require('./circle');
shapes.ellipse = shapes.Ellipse = require('./ellipse');
shapes.text = shapes.Text = require('./text');
shapes.tspan = shapes.TSpan = require('./tspan');
shapes.path = shapes.Path = require('./path');
shapes.rect = shapes.Rect = require('./rect');
shapes.g = shapes.Group = require('./group');
module.exports = shapes;
},{"./circle":10,"./ellipse":13,"./group":14,"./path":16,"./rect":18,"./svgRoot":22,"./text":24,"./tspan":26}],13:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGEllipse = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'ellipse', svgRoot, cfg);
};

util.inherits(SVGEllipse, SVGShape);

SVGEllipse.prototype.x = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype._getHeight = function() {
    return this.ry(false, true) * 2;
};

SVGEllipse.prototype._setHeight = function(value) {
    //When setting the height of an ellipse we move the center to not change the x/y
    var v = value / 2;
    this.cy(v).ry(v);
};

SVGEllipse.prototype._getWidth = function(value) {
    return this.rx(false, true) * 2;
};

SVGEllipse.prototype._setWidth = function(value) {
    //When setting the height of an ellipse we move the center to not change the x/y
    var v = value / 2;
    this.cx(v).rx(v);
};

SVGEllipse.prototype._getX = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype._getY = function() {
    return this.cy() - this.ry();
};

SVGEllipse.prototype.getCenter = function() {
    return {
        x : this.cx(),
        y : this.cy()
    };
};

SVGEllipse.prototype.bottomY = function() {
    return this.cy() + this.ry();
};

SVGEllipse.prototype.cx = function(value) {
    if(!value) {
        return this.translatedX(this.attrNumber('cx'));
    } else {
        this.attr('cx', value);
        return this;
    }
};

SVGEllipse.prototype.cy = function(value) {
    if(!value) {
        return this.translatedY(this.attrNumber('cy'));
    } else {
        this.attr('cy', value);
        return this;
    }
};

SVGEllipse.prototype.rx = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[0];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('rx') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('rx') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('rx', value);
        return this;
    }
};

SVGEllipse.prototype.ry = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[1];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('ry') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('ry') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('ry', value);
        return this;
    }
};

SVGEllipse.prototype.overlayCheck = function(position) {
    return new util.math.Ellipse(this.getCenter(), this.rx(), this.ry()).overlays(position);
};

module.exports = SVGEllipse;
},{"../util/object":32,"../util/util":34,"./svgShape":23}],14:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGGroup = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'g', svgRoot, cfg);
};

util.inherits(SVGGroup, SVGShape);

module.exports = SVGGroup;
},{"../util/object":32,"../util/util":34,"./svgShape":23}],15:[function(require,module,exports){
var Helper = function(svg) {
    this.svg = svg;
    this.points = {};
};

Helper.prototype.point = function(id, p, color, prevText) {
    color = color || 'red';
    var text = id+'(x:'+p.x + ' y:'+p.y+')';
    if(!this.points[id]) {
        var point = this.svg.circle({
            r:2,
            style:'fill:'+color
        });
        var t = this.svg.text(text).fill(color);
        var group = this.svg.g({id:'helper_'+id}, t, point);
        this.points[id] = {
            group : group,
            text : t,
            point : point
        }

        if(prevText) {
            t.hide();
        }
    }

    this.points[id].point.moveTo(p);
    this.points[id].text.$().text(text);
    this.points[id].text.moveTo(p);
};

module.exports = Helper;

},{}],16:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');
var PathData = require('./pathData');

var SVGPath = function(svgRoot, cfg) {
    cfg = cfg || {};
    this.attributeSetter = { d : SVGPath.pathDataAttributeSetter};
    SVGShape.call(this, 'path', svgRoot, cfg, this.attributeSetter);
};

util.inherits(SVGPath, SVGShape);

SVGPath.pathDataAttributeSetter = function(pathDataString) {
    return new PathData(pathDataString);
};

SVGPath.prototype.x = function() {
    return this.d().getX();
};

SVGPath.prototype.y = function() {
    return this.d().getY();
};

SVGPath.prototype.d = function(pathData) {
    if(object.isString(pathData)) {
        this.attributes.d = new PathData(pathData);
        this.updateAttribute('d');
        return this;
    } else if(object.isDefined(pathData)) {
        this.attributes.d = pathData
        this.updateAttribute('d');
        return this;
    } else if(!object.isDefined(this.attributes.d)) {
        this.attributes.d = new PathData();
    }
    return this.attributes.d;
};

module.exports = SVGPath;
},{"../util/object":32,"../util/util":34,"./pathData":17,"./svgShape":23}],17:[function(require,module,exports){
var object = require('../util/object');
var Vector = require('../util/math').Vector;
var math = require('../util/math');
var util = require("../util/util");

var AbstractPathDataType = function(type, absolute) {
    this.vector = new Vector();
    this.vector.add(type);
    this.absolute = absolute || true;
};

AbstractPathDataType.prototype.setAbsolute = function(absolute) {
    this.absolute = absolute || true;
    return this;
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
        return this;
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
    var p = math.getPoint(x,y);
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

LineTo.prototype.moveAlong = function(from, distance) {
    return math.Line.moveAlong(from, this.to(), distance);
};

LineTo.prototype.getNearestPoint = function(from, position) {
    return math.Line.getNearestPoint(from, this.to(), position);
};

var QBezier = function(controlP, toP, absolute) {
    AbstractPathDataType.call(this, 'q', absolute);
    this.control(controlP);
    this.to(toP);
};

util.inherits(QBezier, AbstractPathDataType);

QBezier.prototype.to = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(2,p);
};

QBezier.prototype.control = function(x,y) {
    var p = math.getPoint(x,y);
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
};

CBezier.prototype.control1 = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(1,p);
};

CBezier.prototype.control2 = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(2,p);
};

CBezier.prototype.to = function(x,y) {
    var p = math.getPoint(x,y);
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
};

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
};

var pathType = {
    z : function() { return new Complete() },
    m : function() { return new MoveTo(arguments[0]); },
    l : function() { return new LineTo(arguments[0]); },
    q : function() { return new QBezier(arguments[0], arguments[1]); },
    c : function() { return new CBezier(arguments[0], arguments[1],  arguments[2]); }
};

var PathData = function(def) {
    this.data = new Vector();
    if(object.isString(def)) {
        this.loadFromString(def);
    }
};

PathData.prototype.loadFromString = function(strVal) {
    var that = this;
    //'M100,100 Q200,200 300,300' --> ['M100,100 ', 'Q200,200 300,300']
    var definitions = strVal.split(/(?=[MmLlHhVvCcSsQqTtAaZz]+)/);
    //Each dType
    $.each(definitions, function(index, value) {
        var type = value.charAt(0);
        //'Q200,200 300,300 -> ['200,200', '300,300']
        var values = value.substring(1,value.length).trim().split(' ');
        //['200,200', '300,300'] -> [{x:200, y:200}, {x:300, y:300}]
        var points = [];
        $.each(values, function(i, coord) {
            var coordVals = coord.split(',');
            points.push(math.getPoint(parseFloat(coordVals[0]), parseFloat(coordVals[1])));
        });
        that.data.add(pathType[type.toLowerCase()].apply(undefined, points).setAbsolute((type == type.toUpperCase())));
    });
    return this;
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

PathData.prototype.getX = function() {
    return this.getCorners()[0].x;
};

PathData.prototype.getY = function() {
    return this.getCorners()[0].y;
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

PathData.prototype.getLineByPathIndex = function(index) {
    var p1 = this.value(index - 1).to();
    var p2 = this.value(index).to();
    return new math.Line(p1, p2);
};

PathData.prototype.getNearestPoint = function(point) {
    var index = this.getPathIndexForPosition(point);
    var part = this.getPathPart(index);
    if(part.value.getNearestPoint) {
        return part.value.getNearestPoint(part.start, point);
    };
};

PathData.prototype.getPathIndexForPosition = function(point) {

    if(this.length() === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate = [1,Number.POSITIVE_INFINITY ];

    object.each(this.getPathParts(), function(index, part) {
        //Sort out pathparts which are not within the boundary of start/end points with a little tolerance of 10px
        var p = new util.math.Point(point);
        if(p.isWithinXInterval(part.start, part.end, 10)) {
            var d;
            var line = new math.Line(part.start, part.end);

            if(!line.isVertical()) {
                d = Math.abs(line.calcFX(point.x).y - point.y)
            } else if(p.isWithinYInterval(part.start, part.end)) {
                //Since the point is within x (with tolerance) and y interval we calculate the x distance
                d = Math.abs(part.start.x - p.x);
            }

            if (candidate === undefined || candidate[1] > d) {
                //The pathPartindex is the arrayindex + 1 since we use the end index of the path as identity
                candidate[0] = index + 1;
                candidate[1] = d;
            }
        }
    });

    if (candidate) {
        return candidate[0];
    }
};

/*
 LinePathManager.prototype.getGradien = function(x,y) {
 var position = util.math.getPoint(x,y);
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

PathData.prototype.lastIndexOfType = function(type) {
    var i;
    for(i = this.length() - 1; i >= 0; i--) {
        var value = this.value(i);
        if(value.is(type)) {
            return i;
        }
    }
    return -1;
};

PathData.prototype.valuesByType = function(type) {
    var result = [];

    object.each(this.data.vectors, function(i, value) {
       if(value.is(type)) {
           result.push({index:i, value:value});
       }
    });

    return result;
};

PathData.prototype.start = function(p, absolute) {
    if(arguments.length === 0) {
        return this.value(0).to();
    } else if(this.length() > 0) {
        this.value(0).to(p);
    } else {
        this.data.setValue(0, new MoveTo(p, absolute));
    }
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
    var p = math.getPoint(x,y);
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
    this.data.insert(index, new QBezier(c, to, absolute));
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
},{"../util/math":31,"../util/object":32,"../util/util":34}],18:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGRect = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'rect', svgRoot, cfg);
};

util.inherits(SVGRect, SVGShape);

SVGRect.prototype._getY = function() {
    return this.attrNumber('y') || 0;
};

SVGRect.prototype._getX = function() {
    return this.attrNumber('x') || 0;
};

SVGRect.prototype._getHeight = function(value) {
    return this.attrNumber('height');
};

SVGRect.prototype._setHeight = function(value) {
    this.attr('height',value);
};

SVGRect.prototype._getWidth = function(value) {
    return this.attrNumber('width');
};

SVGRect.prototype._setWidth = function(value) {
    this.attr('width',value);
};

SVGRect.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

module.exports = SVGRect;
},{"../util/object":32,"../util/util":34,"./svgShape":23}],19:[function(require,module,exports){
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

},{"../util/object":32,"../util/string":33}],20:[function(require,module,exports){
/**
 * This module contains functionality for creating and accessing SVG elements.
 * All SVG elements created with this module can be accessed by ID through the instance object.
 *
 * An SVG element created with this module can be seperated into multiple parts which can be managed speratly.
 * The 'root' part will be created by default. When creating a new svg part you can set it as default part, so all actions
 * like insertions will be executed on the default part if there is no other part as argument.
 */
var SVGGenericShape = require('./svgShape');
require('./draggable');
var shapes = require('./elements');
var util = require('../util/Util');

var dom = util.dom;
var object = util.object;
var Helper = require('./helper');

var NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
var NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';

var instances = {};

/**
 * The constructor initializes a new SVG element within the given containerId.
 * The constructor accepts the containerId either as selector '#containerId' or as id string 'containerId'.
 *
 * The id of the nw SVG element will be the containerId with the suffix '_svg' -> 'containerId_svg'.
 *
 * Attributes of the new SVG elemnt can be set through the constructor argument 'cfg'.
 *
 * The SVG can be seperated in multiple parts so you can easily append elements to the different part.
 * The constructor creates a 'root' part as default.
 *
 * @param containerId
 * @param cfg
 * @constructor
 */
var SVG = function(containerId, cfg) {
    if(!(this instanceof SVG)) {
        return SVG.get(containerId);
    }

    cfg = cfg || {};

    //Get id from selector if its an selector
    this.containerId = dom.getRawId(containerId);
    this.$container = $.qCache('#'+this.containerId).get(0);

    if(!this.$container) {
        console.error('Attempt to initiate svg stage for invalid containerId: '+this.containerId);
        return;
    }

    this.svgId = this.containerId+'_svg';

    // Create SVG root element with given settings.
    this.root = new shapes.Svg(this, {id : this.svgId});

    cfg.height = cfg.height || '100%';
    cfg.width = cfg.width  || '100%';

    // Set cfg values as svg root attributes
    this.root.attr(cfg);

    // Append the svg root element to the containernode
    dom.appendSVGElement(this.$container, this.root);

    // The root part is the svg element itself
    this.svgParts = {'root':this.root};
    this.defaultPart = this.root;

    instances[this.svgId] = this;
};

/**
 * Returns the svg root domNode.
 * @returns {*} svg root domNode
 */
SVG.prototype.getRootNode = function() {
    return (this.root) ? this.root.instance() : undefined;
};

/**
 * Returns a cached jQuery object of the root node.
 * @returns {*}
 */
SVG.prototype.$ = function() {
    return $.qCache('#'+this.svgId);
};

/**
 * This is used for importing diagrams into the svg instance.
 * @param element
 */
SVG.prototype.setRoot = function(element) {
    var newId = dom.getAttributes(element)['id'];
    this.root.instance(element);
    this.root.attr({id : newId});
    instances[newId] = this;
};

/**
 * Returns the root element as SVGElement
 * @returns {SVGElement|exports|module.exports|*}
 */
SVG.prototype.getRoot = function() {
    return this.root;
};

/**
 * Returns the current defaultPart
 * @returns {SVGElement|exports|module.exports|*} current defaultPart
 */
SVG.prototype.getDefaultPart = function() {
    return this.defaultPart;
};

/**
 * Creates and returns a new svg part which is represented by a new group within the root.
 * The part id is composite of the svg root id and the partId.
 * By setting the isDefault argument as true the new part will be set as default part.
 * @param partId
 * @param isDefault
 * @returns {*}
 */
SVG.prototype.createPart = function(partId, isDefault) {
    //New parts are always added to the root part
    this.svgParts[partId] = this.g({id: this.svgId+'_'+partId, parentPart: 'root'});
    if(isDefault) {
        this.defaultPart = this.svgParts[partId];
    }
    return this.svgParts[partId];
};

SVG.prototype.part = function(id) {
    return this.svgParts[id];
};

/**
 * Adds an svg element to the given part.
 *
 * @param part
 * @param element
 */
SVG.prototype.addToPart = function(part, element) {
    this.addToGroup(this.svgParts[part], element);
};

/**
 * This function can be used to append or prepend elements with text to the svg root.
 *
 * @param element
 * @param prepend
 * @param text
 * @returns {*}
 */
SVG.prototype.addToRoot = function(element, prepend, text) {
    if(prepend) {
        return dom.prependSVGElement(this.getRoot(), element, text);
    } else {
        return dom.appendSVGElement(this.getRoot(), element, text);
    }
};

/**
 * This function can be used to append/prepend elements with text to a given (or default) svg part.
 *
 * @param element
 * @param part
 * @param prepend
 * @param text
 * @returns {*}
 */
SVG.prototype.add = function(element, part, prepend, text) {
    part = part || this.getDefaultPart();
    element.parent = part;
    if(prepend) {
        return dom.prependSVGElement(part, element, text);
    } else {
        return dom.appendSVGElement(part, element, text);
    }
};

/**
 * Imports an xml document to the given svg part.
 * @param elementXML
 * @param part
 * @returns {*}
 */
SVG.prototype.import = function(svgStr, part, prepend) {
    part = this.svgParts[part] || this.getDefaultPart();
    return SVG.get(dom.importSVG(part, svgStr, prepend));
};

/**
 * Adds and returns a newly created svg Rect with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.rect = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Rect(this, cfg), part);
};

SVG.prototype.helper = function(cfg, part) {
    if(!this._helper) {
        this._helper = new Helper(this);
    }
    return this._helper;
};

/**
 * Adds and returns a newly created svg Text with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.text = function(text, cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Text(this, cfg), part, false).content(text);
};

SVG.prototype.tspan = function(text, cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.TSpan(this, cfg), part, false).content(text);
};

/**
 * Adds and returns a newly created svg Circle with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.circle = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Circle(this, cfg), part);
};

/**
 * Adds and returns a newly created svg Circle with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.ellipse = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Ellipse(this, cfg), part);
};

/**
 * Adds and returns a newly created svg Group with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.g = function(cfg) {
    var cfg = cfg ||{};

    var parentPart = this.svgParts[cfg.parentPart] || this.getDefaultPart();

    delete cfg.part;

    var group = this.add(new shapes.Group(this, cfg), parentPart);

    if(arguments.length > 1) {
        for(var i = 1;i < arguments.length; i++) {
            console.log('addToGroup: '+group.attr('id')+' - '+ arguments[i].attr('id'));
            dom.appendSVGElement(group.instance(), arguments[i]);
        }
    }
    return group;
};

/**
 * Adds ands an svg element ot the given group.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.addToGroup = function(group, element) {
    var result;
    if(object.isArray(element)) {
        result = [];
        object.each(element, function(index, val) {
            result.push(dom.appendSVGElement(group.instance(), element));
        })
    } else {
        return dom.appendSVGElement(group.instance(), element);
    }
};

/**
 * Adds and returns a newly created svg Path with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.path = function(cfg, part) {
    var part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Path(this, cfg), part);
};

SVG.prototype.empty = function() {
    $(this.root.instance()).empty();
};

SVG.prototype.asString = function() {
    return this.root.toString();
};

SVG.prototype.clone = function() {
    return this.root.clone();
}

/**
 * This function creates an SVGElement out of the given id selector element.
 * @param selector
 * @returns {SVGElement|exports|module.exports}
 */
SVG.get = function(selector) {
    if(selector.SVGElement) {
        return selector;
    }
    //TODO:
    if(object.isString(selector)) {
        $node = $(dom.getIdSelector(selector));
    } else {
        $node = $(selector);
    }

    if(!$node.length) {
        console.warn('call SVG.get on a non existing node: '+selector);
        return [];
    } else if($node.length > 1) {
        //Return list of SVGElements
        var result = [];
        $node.each(function(index, value) {
            result.push(SVG.get(this));
        });
        return result;
    } else {
        //Return single SVgElement
        var $svgRootNode = $($node.get(0).ownerSVGElement);
        if($svgRootNode.length) {
            var svgInstance = instances[$svgRootNode.attr('id')];
            var result = SVG._svgInstance($node, svgInstance);
            //This enables $.each for single results.
            result[0] = result;
            result.length = 1;
            result.splice = function() {};
            return result;
        } else {
            console.warn('Call SVG.get on node with no svg root');
        }
    }
};

SVG._svgInstance = function($node, svg) {
    var SVGShape = SVG.getShapeByName($node.get(0).nodeName);
    return (SVGShape) ? new SVGShape(svg).instance($node.get(0)) : new SVGGenericShape($node.get(0), svg);
};

SVG.getShapeByName = function(type) {
    var result = shapes[type.toLowerCase()];
    return result;
};

SVG.prototype.get = SVG.get;

module.exports = SVG;

},{"../util/Util":28,"./draggable":11,"./elements":12,"./helper":15,"./svgShape":23}],21:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"../dom/domElement":7,"../util/util":34,"./style":19,"dup":9}],22:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGElement = require('./svgElement');

var NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
var NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';
var SVG_VERSION = '1.1';

var SVGRoot = function(svg, cfg) {
    cfg = cfg || {};
    cfg['xmlns'] = NAMESPACE_SVG;
    cfg['xmlns:xlink'] = NAMESPACE_XLINK;
    cfg['version'] = SVG_VERSION;
    SVGElement.call(this, 'svg', svg, cfg);
};

util.inherits(SVGRoot, SVGElement);

SVGRoot.prototype.x = function(value) {
    return (value) ? this.attrNumber('x', value) : this.attrNumber('x') || 0 ;
};

SVGRoot.prototype.y = function(value) {
    return (value) ? this.attrNumber('y', value) : this.attrNumber('y') || 0 ;
};

SVGRoot.prototype.getCenter = function() {
    return {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
};

SVGRoot.prototype.height = function(value) {
    if(!value) {
        return this.$().height();
    } else {
        this.attr('height', value);
    }
};

SVGRoot.prototype.width = function(value) {
    if(!value) {
        return this.$().width();
    } else {
        this.attr('width', value);
    }
};

module.exports = SVGRoot;
},{"../util/object":32,"../util/util":34,"./svgElement":21}],23:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var Transform = require('./transform');

var SVGElement = require('./SVGElement');

var SVGShape = function(name, svgRoot, cfg, attributeSetter) {
    cfg = cfg || {};
    this.attributeSetter = attributeSetter || {};
    this.attributeSetter.transform = this.transformationAttributeSetter;
    SVGElement.call(this, name, svgRoot, cfg, attributeSetter);
};

util.inherits(SVGShape, SVGElement);

SVGShape.prototype.transformationAttributeSetter = function(trnasformationString) {
    return new Transform(trnasformationString);
};

SVGShape.prototype.getTransformation = function() {
    if(!this.attributes.transform) {
        this.attributes.transform = new Transform();
    } else if(object.isString(this.attributes.transform)) {
        this.attributes.transform = new Transform(this.attributes.transform);
    }
    return this.attributes.transform;
};

SVGShape.prototype.transformedX = function(px) {
    return this.scaledX(this.translatedX(px));
};

SVGShape.prototype.transformedY = function(px) {
    return this.scaledY(this.translatedY(px));
};

SVGShape.prototype.scaledX = function(px) {
    return px * this.scale()[0]
};

SVGShape.prototype.scaledY = function(py) {
    return py * this.scale()[1]
};

SVGShape.prototype.rotate = function(val) {
    var result = this.getTransformation().rotate(val);

    if(result instanceof Transform) {
        // The scale setter returns the Transform itself object so we reset the scale
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.scale = function(sx, sy) {
    var result = this.getTransformation().scale(sx, sy);

    if(result instanceof Transform) {
        // The scale setter returns the Transform itself object so we reset the scale
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.translate = function(x, y) {
    var result = this.getTransformation().translate(x,y);

    if(result instanceof Transform) {
        // The trnaslate setter returns the Transform object so we reset the
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.translated = function(position) {
    var translate = this.getTransformation().translate();
    return {
        x : translate.x + position.x,
        y : translate.y + position.y
    }
};

SVGShape.prototype.translatedX = function(px) {
    var translate = this.getTransformation().translate();
    px = (object.isDefined(px)) ? px : 0;
    return translate.x + px;
};

SVGShape.prototype.translatedY = function(py) {
    var translate = this.getTransformation().translate();
    py = (object.isDefined(py)) ? py : 0;
    return translate.y + py;
};

SVGShape.prototype.hasTransformation = function(transformation) {
    if(object.isDefined(this.attributes.transform)) {
        return (object.isDefined(this.attributes.transform[transformation]));
    }
};

SVGShape.prototype.fill = function(color) {
    return this.style('fill', color);
};

SVGShape.prototype.fillOpacity = function(opacity) {
    return this.style('fill-opacity', opacity);
};

SVGShape.prototype.strokeOpacity = function(opacity) {
    return this.style('stroke-opacity', opacity);
};

SVGShape.prototype.stroke = function(color, width) {
    if(width) {
        this.strokeWidth(width);
    }
    return this.style('stroke', color);

};

SVGShape.prototype.strokeDasharray = function(type) {
    if(!type) {
        return this.style('stroke-dasharray');
    }
    if(object.isString(type)) {
        this.style('stroke-dasharray', type);
    } else {

    }
};

SVGShape.prototype.strokeDashType = function(type) {
    if(!type) {
        switch(this.strokeDasharray()) {
            case "5,5":
                return 1;
            case "10,10":
                return 2;
            case "20,10,5,5,5,10":
                return 3;
            default:
                return 0;
        }
    } else {
        switch(type) {
            case '1':
            case 1:
                this.strokeDasharray("5,5");
                break;
            case '2':
            case 2:
                this.strokeDasharray("10,10");
                break;
            case '3':
            case 3:
                this.strokeDasharray("20,10,5,5,5,10");
                break;
            default:
                this.strokeDasharray("none");
                break;
        }
    }
};

SVGShape.prototype.strokeWidth = function(width) {
    return util.app.parseNumberString(this.style('stroke-width', width)) || 0;
};

SVGShape.prototype.isVisible = function() {
    return (!this.fillOpacity() || this.fillOpacity() > 0)
        && (!this.strokeOpacity() || this.strokeOpacity() > 0);
};

SVGShape.prototype.hide = function() {
    this.fillOpacity(0);
    this.strokeOpacity(0);
};

SVGShape.prototype.show = function(opacity) {
    opacity = object.isDefined(opacity) ? opacity : 1;
    this.fillOpacity(opacity);
    this.strokeOpacity(opacity);
};

/**
 * Determines the location of a given position relative to the svg element.
 *      _t_
 *    |\   /|
 *  l |  c  | r
 *    |/___\|
 *       b
 * @param node
 * @param position
 * @returns {*}
 */
SVGShape.prototype.getRelativeLocation = function(position) {
    //First we check if the point lies direct on the boundary
    if(position.x === this.x()) {
        return 'left';
    } else if(position.y === this.y()) {
        return 'top';
    } else if(position.x === this.getRightX()) {
        return 'right';
    } else if(position.y === this.getBottomY()) {
        return 'bottom';
    }

    //If its not on the boundary we check the location by means of the line gradient
    var center = this.getCenter();
    var g = util.math.Line.calcGradient(center, position);
    if(position.y < center.y) { //position over elementcenter
        if (position.x >= center.x) { //position right (or eq) of elementcenter
            return (g > -1) ? 'right' : 'top';
        } else if (g < 1) {//position left and over of elementcenter
            return (g < 1) ? 'left' : 'top';
        }
    } else if(position.x >= center.x) { //position under (or eq) and right (or eq) of elementcenter
        return (g < 1) ? 'right' : 'bottom';
    } else { //position under and left of elementcenter
        return (g < -1) ? 'bottom' : 'left';
    }
};

SVGShape.prototype.x = function(withStroke) {
    return (withStroke) ? this.translatedX(this._getX()) - this.scaledX(this.strokeWidth()) / 2 : this.translatedX(this._getX());
};

SVGShape.prototype._getX = function() {
    return 0;
};

SVGShape.prototype.y = function(withStroke) {
    return (withStroke) ? this.translatedY(this._getY()) - this.scaledY(this.strokeWidth()) / 2 : this.translatedY(this._getY());
};

SVGShape.prototype._getY = function() {
    return 0;
};

SVGShape.prototype.position = function(withStroke) {
    var that = this;
    return {
        x : that.x(withStroke),
        y : that.y(withStroke)
    };
};

SVGShape.prototype.topLeft = function(withStroke) {
    return this.position(withStroke);
};

SVGShape.prototype.topRight = function(withStroke) {
    var that = this;
    return {
        x : that.getRightX(withStroke),
        y : that.y(withStroke)
    };
};

SVGShape.prototype.bottomRight = function(withStroke) {
    var that = this;
    return {
        x : that.getRightX(withStroke),
        y : that.getBottomY(withStroke)
    };
};

SVGShape.prototype.bottomLeft = function(withStroke) {
    var that = this;
    return {
        x : that.x(withStroke),
        y : that.getBottomY(withStroke)
    };
};

SVGShape.prototype.getCenter = function() {
    var c = {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
    return util.math.rotate(c, this.position(), this.rotate());
};

SVGShape.prototype.overlays = function() {
    var result = false;
    var that = this;
    object.each(arguments, function(index, position) {
        if(that.overlayCheck(position)) {
            result = true;
            return false; //TO break the each loop
        }
    });
    //console.log('result:'+result);
    return result;
};

/**
 * This is a default implementation for checking if a given position lies within the svgElement.
 * This can be overwritten by shapes like circles and ellipse..
 */
SVGShape.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

SVGShape.prototype.move = function(dx, dy) {
    var translate = this.translate();
    this.translate(translate.x + dx, translate.y + dy);
    return this;
};

SVGShape.prototype.moveTo = function(x, y) {
    var p = util.math.getPoint(x,y);

    var translate = this.translate();
    if(this.x() !== p.x || this.y() !== p.y) {
        //TODO: this does not consider x/y attribute settings
        this.translate(p);
    }
    return this;
};

SVGShape.prototype.moveX = function(x) {
    var translate = this.translate();
    if(translate.x !== x) {
        this.translate(x, translate.y);
    }
    return this;
};

SVGShape.prototype.moveY = function(y) {
    var translate = this.translate();
    if(translate.y !== y) {
        return this.translate(translate.x, y);
    }
    return this;
};

/**
 * Note: the implementation of getBBox differs between browsers some add the sroke-width and some do not add stroke-width
 */
SVGShape.prototype.height = function(value) {
    if((object.isBoolean(value) && value)) {
        return this.scaledY(this._getHeight()) + this.scaledY(this.strokeWidth());
    } else if(!object.isDefined(value) || (object.isBoolean(value) && !value)) {
        return this.scaledY(this._getHeight());
    } else {
        this._setHeight(value);
        return this;
    }
};

SVGShape.prototype._getHeight = function() {
    return this.getBBox().height;
};

SVGShape.prototype._setHeight = function() {
    //ABSTRACT
};

SVGShape.prototype.width = function(value) {
    if((object.isBoolean(value) && value)) {
        return this.scaledX(this._getWidth()) + this.scaledX(this.strokeWidth());
    } else if(!object.isDefined(value) || (object.isBoolean(value) && !value)) {
        return this.scaledX(this._getWidth());
    } else {
        this._setWidth(value);
        return this;
    }
};

SVGShape.prototype._getWidth = function() {
    return this.getBBox().width;
};

SVGShape.prototype._setWidth = function() {
   //ABSTRACT
};

SVGShape.prototype.getBottomY = function(withStroke) {
    return this.y(withStroke) + this.height(withStroke);
};

SVGShape.prototype.getRightX = function(withStroke) {
    return this.x(withStroke) + this.width(withStroke);
};

module.exports = SVGShape;
},{"../util/object":32,"../util/util":34,"./SVGElement":9,"./transform":25}],24:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var DEFAULT_FONT_SIZE = 11;
var DEFAULT_FONT_FAMILY = "Helvetica"; //Verdana, Arial, sans-serif ?
var DEFAULT_TEXT_ANCHOR = "start";
var DEFAULT_DOMINANT_BASELINE = "hanging";

var DEFAULT_SPAN_PADDING = 0;

var SVGText = function(svgRoot, cfg, attributeSetter) {
    cfg = cfg || {};
    cfg['font-family'] = cfg['font-size'] || DEFAULT_FONT_FAMILY;
    cfg['font-size'] = cfg['font-size'] || DEFAULT_FONT_SIZE;
    cfg['text-anchor'] = cfg['text-anchor'] || DEFAULT_TEXT_ANCHOR;
    cfg['dominant-baseline'] = cfg['dominant-baseline'] || DEFAULT_DOMINANT_BASELINE;

    this.spanPadding = cfg['padding'] || DEFAULT_SPAN_PADDING;

    SVGShape.call(this, 'text', svgRoot, cfg, attributeSetter);
    //TODO: Span / multi line text
};

util.inherits(SVGText, SVGShape);

SVGText.prototype.padding = function(value) {
    if(object.isDefined(value)) {
        this.spanPadding = value;
        this.setSpanAttr('x', value);
    } else {
        return this.spanPadding;
    }
};

SVGText.prototype.fontFamily = function(value) {
    return this.attr('font-family', value);
};

SVGText.prototype.fontWeight = function(value) {
    return this.style('font-weight', value);
};

SVGText.prototype.fontSize = function(value) {
    if(value) {
        value = object.isNumber(value) ? value+'px' : value;
    }
    var result = this.attrNumber('font-size', value);
    if(value) {
        this.setSpanAttr('dy', value);
        return this;
    } else {
        return result;
    }
};

SVGText.prototype.setSpanAttr = function(key, value) {
    this.$().children('tspan').attr(key, value);
    return this;
};

SVGText.prototype.x = function(value) {
    return (object.isDefined(value)) ? this.attrNumber('x', value) : this.translatedX(this.attrNumber('x', value)) || 0 ;
};

SVGText.prototype.y = function(value) {
    return (object.isDefined(value)) ? this.attrNumber('y', value) : this.translatedY(this.attrNumber('y', value)) || 0 ;
};

SVGText.prototype.dx = function(value) {
    return this.attrNumber('dx', value);
};

SVGText.prototype.dy = function(value) {
    return this.attrNumber('dy', value);
};

SVGText.prototype.move = function(dx, dy) {
    SVGText.super_.prototype.move.apply(this, [dx, dy]);
    this.alignBackground();
};

SVGText.prototype.moveTo = function(x, y) {
    SVGText.super_.prototype.moveTo.apply(this, [x, y]);
    this.alignBackground();
};

SVGText.prototype.content = function(text) {
    if(!text) {
        return this.getText();
    }

    text = text.toString();

    var that = this;
    var height;
    this.$().empty();
    $.each(text.split('\n'), function(index, value) {
        if(object.isDefined(value) && value.trim().length > 0) {
            var tSpan = that.svg.tspan(value).x(that.spanPadding);
            that.append(tSpan);
            if(index > 0) {
                tSpan.dy(height);
            } else {
                height = tSpan.height();
            }
        }
    });
    return this;
};

SVGText.prototype.getText = function() {
    var result = '';
    var $children = this.$().children('tspan');
    $children.each(function(index, value) {
        result += $(this).text();
        if(index != $children.length -1) {
            result += '\n';
        }
    });
    return result;
};

SVGText.prototype.switchAnchor = function() {
    switch(this.anchor()) {
        case 'start':
            this.end();
        case 'end':
            this.start();
    }
};

SVGText.prototype.getExtentOfChar = function(charNum) {
    return this.instance().getExtentOfChar(charNum);
};

SVGText.prototype.getCharHeight = function(charNum) {
    return this.getExtentOfChar(charNum).height;
};

SVGText.prototype.start = function() {
    return this.anchor('start');
};

SVGText.prototype.end = function() {
    return this.anchor('end');
};

SVGText.prototype.middle = function() {
    return this.anchor('middle');
};

SVGText.prototype.anchor = function(value) {
    return this.attr('text-anchor', value);
};

SVGText.prototype.tSpan = function(index) {
    return this.svg.get(this.$().children('tspan').get(index));
};

SVGText.prototype.hanging = function(hanging) {
    var hanging = object.isDefined(hanging) ? hanging : true;
    var value = hanging ? 'hanging' : 'baseline';
    this.attr('dominant-baseline', value);
    var firstSpan = this.tSpan(0);
    var dy = (hanging) ? 0 : firstSpan.height() + this.getBBox().y;
    firstSpan.dy(dy);
    return this;
};

/**
 * Note: the background won't align when the text is dragged. Perhaps add drag hook
 * @param color
 */
SVGText.prototype.background = function(color) {
    var svgBackground = this.getBackground();
    if(color) {
        if(!svgBackground) {
            svgBackground = this.svg.rect({'class':'textBackground'});
        }
        svgBackground.fill(color);
        svgBackground.$().after(this.$());
        this.alignBackground();
    } else if(svgBackground) {
        svgBackground.fill();
    }
    return this;
};

/**
 *  TODO: probably just works for hanging texts because of the offset...
 */
SVGText.prototype.alignBackground = function() {
    var svgBackground = this.getBackground();
    if(svgBackground) {
        var bgHeight = this.height() + this.getBBox().y; //remove text offset
        svgBackground.height(bgHeight).width(this.width()).translate(this.x(), this.y());
    }
};

SVGText.prototype.getBackground = function() {
    if(this.backgroundSVG) {
        return this.backgroundSVG;
    }

    var prev = this.$().prev();
    if(prev.length > 0) {
        var svgBack = this.svg.get(prev);
        return this.backgroundSVG = (svgBack.hasClass('textBackground')) ? svgBack : undefined;
    }
};

SVGText.prototype.dominantBaseline = function(value) {
    return this.attr('dominant-baseline', value);
};

module.exports = SVGText;
},{"../util/object":32,"../util/util":34,"./svgShape":23}],25:[function(require,module,exports){
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
},{"../dom/domElement":7,"../util/util":34}],26:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');
var SVGText = require('./text');

var DEFAULT_DOMINANT_BASELINE = 'inherit'

var SVGTSpan = function(svgRoot, cfg) {
    cfg = cfg || {};
    cfg['dominant-baseline'] = cfg['dominant-baseline'] || DEFAULT_DOMINANT_BASELINE;
    SVGShape.call(this, 'tspan', svgRoot, cfg);
};

util.inherits(SVGTSpan, SVGText);

SVGTSpan.prototype.getContainerText = function() {
    var parent = this.parent();
    if(parent.tagName === 'text') {
        return parent;
    }
};

SVGTSpan.prototype.fontSize = function(value) {
    if(value) {
        return SVGTSpan.super_.prototype.fontSize.apply(this, [value]);
    } else {
        var result = SVGTSpan.super_.prototype.fontSize.apply(this);
        if(!result) {
            var containerText = this.getContainerText();
            return (containerText) ? containerText.fontSize() : 0;
        } else {
            return result;
        }
    }
};

SVGTSpan.prototype.content = function(value) {
    if(value) {
        this.$().text(value);
        return this;
    } else {
        return this.$().text();
    }
};

SVGTSpan.prototype.getBBox = function() {
    //some browser (e.g. firefox) does not implement the getBBox for tspan elements.
    return this.getBoundingClientRect();
};

module.exports = SVGTSpan;
},{"../util/object":32,"../util/util":34,"./svgShape":23,"./text":24}],27:[function(require,module,exports){
var SVG = require('../svg/svg');
var string = require('../util/string');
var queryCache = require('../core/cache');

$.fn.svg = function(selector) {
    if(selector && selector.SVGElement) {
        return selector;
    } else if(selector) {
        return $(selector).svg();
    }

    if(!this.length) {
        return [];
    } else if(this.length === 1) {
        return SVG.get(this);
    } else if(this.length > 1) {
        var result =  [];
        this.each(function() {
            result.push(SVG.get(this));
        });
        return result;
    }

    return this;
};

$.svg = $.fn.svg;

$.qCache = function(selector, preventCache) {
    if(selector) {
        return queryCache.$(selector, preventCache);
    } else {
        return queryCache;
    }
};

$.qUncache = function(selector) {
    return queryCache.remove(selector);
};

/**
 * The problem with ui-selectmenu is that it causes a second keydown trigger event when focused.
 * So global keydown events are triggered twiche like do/undo if focused. The following event
 * prevents the propagation if the control key is pressed.
 */
$(document, '.ui-selectmenu-button').on('keydown', function(evt) {
    if(evt.ctrlKey) {
        evt.stopPropagation();
    }
});

$.fn.growl = function(params) {
    var $root = this;

    // tooltip content and styling
    var $content = $(
        '<a class="icon-close" href="#"></a>'+
        '<h1 style="color: white; font-size: 12pt; font-weight: bold; padding-bottom: 5px;">' + params.title + '</h1>' +
        '<p style="margin: 0; padding: 5px 0 5px 0; font-size: 10pt;">' + params.text + '</p>');

    // add 'Close' button functionality
    var $close = $($content[0]);
    $close.click(function(e) {
        $root.uitooltip('close');
    });

    // prevent standard tooltip from closing
    $root.bind('focusout mouseleave', function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; });

    // build tooltip
    $root.uitooltip({
        content: function() { return $content; },
        items: $root.selector,
        tooltipClass: 'growl ' + params.growlClass,
        position: {
            my: 'right top',
            at: 'right-10 top+10'
        },
        close: function( event, ui ) {
            $root.uitooltip('destroy');
        }
    }).uitooltip('open');

    if(params.closeAfter) {
        setTimeout(function(){ $root.uitooltip('close'); }, params.closeAfter);
    }
};

if($.ui) {
    $.widget( "custom.iconselectmenu", $.ui.selectmenu, {
        _renderItem: function( ul, item ) {
            var li = $( "<li>", { text: item.label } );
            if ( item.disabled ) {
                li.addClass( "ui-state-disabled" );
            }
            $( "<span>", {
                style: item.element.attr( "data-style" ),
                "class": "ui-icon " + item.element.attr( "data-class" )
            })
                .appendTo( li );
            return li.appendTo( ul );
        }
    });
}

},{"../core/cache":2,"../svg/svg":20,"../util/string":33}],28:[function(require,module,exports){
var util = require("util");

module.exports = {
    object: require('./object'),
    string: require('./string'),
    dom: require('./../dom/dom'),
    app: require('./app'),
    math: require('./math'),
    xml : require('./xml'),
    inherits: util.inherits
}
},{"./../dom/dom":6,"./app":29,"./math":31,"./object":32,"./string":33,"./xml":35,"util":40}],29:[function(require,module,exports){
/**
 * This module serves as an wrapper for dom manipulation functionality. It is
 * highly prefered to use this module instead of jquery directly within other
 * modules.
 */
var object = require('./object');

var parseFeatureStrings = function(value, defaultVal) {
    var result = [];
    value = value.split(' ');
    object.each(value, function(index, feature) {
        result[index] = parseFeatureString(feature, defaultVal);
    });
    return result;
};

/**
 * parse a featurestinrg in the form of
 *  'featurename(30,30)' or 'featurename(30.4) or featurename
 *
 * The result is would be
 *      { type : 'featurename', value : [30,30] }
 *      { type : 'featurename', value : 30.4 }
 *      { type : 'featurename', value : undefined }
 * @param {type} feature
 * @returns {App_L6.parseFeatureString.result}
 */
var parseFeatureString = function(feature, defaultVal) {
    var result = {};
    if(feature.indexOf('(') > -1) {
        var splitted = feature.split('(');
        var value = splitted[1].substring(0, splitted[1].indexOf(')'));

        if(value.indexOf(',') > -1) { // multiple args
            value = value.split(',');
            object.each(value, function(index, v) {
                value[index] = parseNumberString(v);
            });
        } else { // single arg
            value = parseNumberString(value);
        }
        result.type = splitted[0];
        result.value = value;
    } else {
        result.type = feature;
        result.value = defaultVal;
    }
    return result;
};

var parseNumberString = function(value) {
    if(!object.isString(value)) {
        return value;
    }

    //Cut units 1.2em -> 1.2
    value = value.split(/(?=[a-z,A-Z]+)/)[0];

    if(!isNaN(value)) {
        if(value.indexOf('.') > -1) { //float
            value = parseFloat(value);
        } else { //int
            value = parseInt(value);
        }
    }
    return value;
};

var createFeatureString = function(feature, value) {
    var result = feature;

    if(object.isDefined(value)) {
        result += '(';
        if(object.isArray(value)) {
            object.each(value, function(index, value) {
                result += (index !== 0) ? ','+value : value;
            });
        } else {
            result += value;
        }
        result += ')';
    }
    return result;
};

var isMinDist = function(from, to, minDist) {
    return Math.abs(to.x - from.x) > minDist || Math.abs(to.y - from.y) > minDist;
};

module.exports = {
    parseFeatureString:parseFeatureString,
    createFeatureString:createFeatureString,
    parseFeatureStrings:parseFeatureStrings,
    parseNumberString : parseNumberString,
    isMinDist : isMinDist
};

},{"./object":32}],30:[function(require,module,exports){
/**
 * most Bezier helpter functions are taken from jsBezier library https://github.com/jsplumb/jsBezier/blob/master/js/0.6/jsBezier-0.6.js
 * check /libs/jsBezier.js for more functions if required.
 *
 *
 */

if (typeof Math.sgn == "undefined") {
    Math.sgn = function (x) {
        return x == 0 ? 0 : x > 0 ? 1 : -1;
    };
}

var Vectors = {
        subtract: function (v1, v2) {
            return {x: v1.x - v2.x, y: v1.y - v2.y};
        },
        dotProduct: function (v1, v2) {
            return (v1.x * v2.x) + (v1.y * v2.y);
        },
        square: function (v) {
            return Math.sqrt((v.x * v.x) + (v.y * v.y));
        },
        scale: function (v, s) {
            return {x: v.x * s, y: v.y * s};
        }
    },

    maxRecursion = 64,
    flatnessTolerance = Math.pow(2.0, -maxRecursion - 1);

/**
 * finds the nearest point on the curve to the given point.
 */
var _nearestPointOnCurve = function (point, curve) {
    var td = _distanceFromCurve(point, curve);
    return {point: _bezier(curve, curve.length - 1, td.location, null, null), location: td.location};
};

/**
 * Calculates the distance that the point lies from the curve.
 *
 * @param point a point in the form {x:567, y:3342}
 * @param curve a Bezier curve in the form [{x:..., y:...}, {x:..., y:...}, {x:..., y:...}, {x:..., y:...}].  note that this is currently
 * hardcoded to assume cubiz beziers, but would be better off supporting any degree.
 * @return a JS object literal containing location and distance, for example: {location:0.35, distance:10}.  Location is analogous to the location
 * argument you pass to the pointOnPath function: it is a ratio of distance travelled along the curve.  Distance is the distance in pixels from
 * the point to the curve.
 */
var _distanceFromCurve = function (point, curve) {
    var candidates = [],
        w = _convertToBezier(point, curve),
        degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        numSolutions = _findRoots(w, higherDegree, candidates, 0),
        v = Vectors.subtract(point, curve[0]), dist = Vectors.square(v), t = 0.0;

    for (var i = 0; i < numSolutions; i++) {
        v = Vectors.subtract(point, _bezier(curve, degree, candidates[i], null, null));
        var newDist = Vectors.square(v);
        if (newDist < dist) {
            dist = newDist;
            t = candidates[i];
        }
    }
    v = Vectors.subtract(point, curve[degree]);
    newDist = Vectors.square(v);
    if (newDist < dist) {
        dist = newDist;
        t = 1.0;
    }
    return {location: t, distance: dist};
};

var _convertToBezier = function (point, curve) {
    var degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        c = [], d = [], cdTable = [], w = [],
        z = [[1.0, 0.6, 0.3, 0.1], [0.4, 0.6, 0.6, 0.4], [0.1, 0.3, 0.6, 1.0]];

    for (var i = 0; i <= degree; i++) c[i] = Vectors.subtract(curve[i], point);
    for (var i = 0; i <= degree - 1; i++) {
        d[i] = Vectors.subtract(curve[i + 1], curve[i]);
        d[i] = Vectors.scale(d[i], 3.0);
    }
    for (var row = 0; row <= degree - 1; row++) {
        for (var column = 0; column <= degree; column++) {
            if (!cdTable[row]) cdTable[row] = [];
            cdTable[row][column] = Vectors.dotProduct(d[row], c[column]);
        }
    }
    for (i = 0; i <= higherDegree; i++) {
        if (!w[i]) w[i] = [];
        w[i].y = 0.0;
        w[i].x = parseFloat(i) / higherDegree;
    }
    var n = degree, m = degree - 1;
    for (var k = 0; k <= n + m; k++) {
        var lb = Math.max(0, k - m),
            ub = Math.min(k, n);
        for (i = lb; i <= ub; i++) {
            j = k - i;
            w[i + j].y += cdTable[j][i] * z[j][i];
        }
    }
    return w;
};
/**
 * counts how many roots there are.
 */
var _findRoots = function (w, degree, t, depth) {
    var left = [], right = [],
        left_count, right_count,
        left_t = [], right_t = [];

    switch (_getCrossingCount(w, degree)) {
        case 0 :
        {
            return 0;
        }
        case 1 :
        {
            if (depth >= maxRecursion) {
                t[0] = (w[0].x + w[degree].x) / 2.0;
                return 1;
            }
            if (_isFlatEnough(w, degree)) {
                t[0] = _computeXIntercept(w, degree);
                return 1;
            }
            break;
        }
    }
    _bezier(w, degree, 0.5, left, right);
    left_count = _findRoots(left, degree, left_t, depth + 1);
    right_count = _findRoots(right, degree, right_t, depth + 1);
    for (var i = 0; i < left_count; i++) t[i] = left_t[i];
    for (var i = 0; i < right_count; i++) t[i + left_count] = right_t[i];
    return (left_count + right_count);
};
var _getCrossingCount = function (curve, degree) {
    var n_crossings = 0, sign, old_sign;
    sign = old_sign = Math.sgn(curve[0].y);
    for (var i = 1; i <= degree; i++) {
        sign = Math.sgn(curve[i].y);
        if (sign != old_sign) n_crossings++;
        old_sign = sign;
    }
    return n_crossings;
};
var _isFlatEnough = function (curve, degree) {
    var error,
        intercept_1, intercept_2, left_intercept, right_intercept,
        a, b, c, det, dInv, a1, b1, c1, a2, b2, c2;
    a = curve[0].y - curve[degree].y;
    b = curve[degree].x - curve[0].x;
    c = curve[0].x * curve[degree].y - curve[degree].x * curve[0].y;

    var max_distance_above = max_distance_below = 0.0;

    for (var i = 1; i < degree; i++) {
        var value = a * curve[i].x + b * curve[i].y + c;
        if (value > max_distance_above)
            max_distance_above = value;
        else if (value < max_distance_below)
            max_distance_below = value;
    }

    a1 = 0.0;
    b1 = 1.0;
    c1 = 0.0;
    a2 = a;
    b2 = b;
    c2 = c - max_distance_above;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0 / det;
    intercept_1 = (b1 * c2 - b2 * c1) * dInv;
    a2 = a;
    b2 = b;
    c2 = c - max_distance_below;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0 / det;
    intercept_2 = (b1 * c2 - b2 * c1) * dInv;
    left_intercept = Math.min(intercept_1, intercept_2);
    right_intercept = Math.max(intercept_1, intercept_2);
    error = right_intercept - left_intercept;
    return (error < flatnessTolerance) ? 1 : 0;
};
var _computeXIntercept = function (curve, degree) {
    var XLK = 1.0, YLK = 0.0,
        XNM = curve[degree].x - curve[0].x, YNM = curve[degree].y - curve[0].y,
        XMK = curve[0].x - 0.0, YMK = curve[0].y - 0.0,
        det = XNM * YLK - YNM * XLK, detInv = 1.0 / det,
        S = (XNM * YMK - YNM * XMK) * detInv;
    return 0.0 + XLK * S;
};

var _bezier = function (curve, degree, t, left, right) {
    var temp = [[]];
    for (var j = 0; j <= degree; j++) temp[0][j] = curve[j];
    for (var i = 1; i <= degree; i++) {
        for (var j = 0; j <= degree - i; j++) {
            if (!temp[i]) temp[i] = [];
            if (!temp[i][j]) temp[i][j] = {};
            temp[i][j].x = (1.0 - t) * temp[i - 1][j].x + t * temp[i - 1][j + 1].x;
            temp[i][j].y = (1.0 - t) * temp[i - 1][j].y + t * temp[i - 1][j + 1].y;
        }
    }
    if (left != null)
        for (j = 0; j <= degree; j++) left[j] = temp[j][0];
    if (right != null)
        for (j = 0; j <= degree; j++) right[j] = temp[degree - j][j];

    return (temp[degree][0]);
};

var _curveFunctionCache = {};
var _getCurveFunctions = function (order) {
    var fns = _curveFunctionCache[order];
    if (!fns) {
        fns = [];
        var f_term = function () {
                return function (t) {
                    return Math.pow(t, order);
                };
            },
            l_term = function () {
                return function (t) {
                    return Math.pow((1 - t), order);
                };
            },
            c_term = function (c) {
                return function (t) {
                    return c;
                };
            },
            t_term = function () {
                return function (t) {
                    return t;
                };
            },
            one_minus_t_term = function () {
                return function (t) {
                    return 1 - t;
                };
            },
            _termFunc = function (terms) {
                return function (t) {
                    var p = 1;
                    for (var i = 0; i < terms.length; i++) p = p * terms[i](t);
                    return p;
                };
            };

        fns.push(new f_term());  // first is t to the power of the curve order
        for (var i = 1; i < order; i++) {
            var terms = [new c_term(order)];
            for (var j = 0; j < (order - i); j++) terms.push(new t_term());
            for (var j = 0; j < i; j++) terms.push(new one_minus_t_term());
            fns.push(new _termFunc(terms));
        }
        fns.push(new l_term());  // last is (1-t) to the power of the curve order

        _curveFunctionCache[order] = fns;
    }

    return fns;
};


/**
 * calculates a point on the curve, for a Bezier of arbitrary order.
 * @param curve an array of control points, eg [{x:10,y:20}, {x:50,y:50}, {x:100,y:100}, {x:120,y:100}].  For a cubic bezier this should have four points.
 * @param location a decimal indicating the distance along the curve the point should be located at.  this is the distance along the curve as it travels, taking the way it bends into account.  should be a number from 0 to 1, inclusive.
 */
var _pointOnPath = function (curve, location) {
    var cc = _getCurveFunctions(curve.length - 1),
        _x = 0, _y = 0;
    for (var i = 0; i < curve.length; i++) {
        _x = _x + (curve[i].x * cc[i](location));
        _y = _y + (curve[i].y * cc[i](location));
    }

    return {x: _x, y: _y};
};

var _dist = function (p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

var _isPoint = function (curve) {
    return curve[0].x == curve[1].x && curve[0].y == curve[1].y;
};

/**
 * finds the point that is 'distance' along the path from 'location'.  this method returns both the x,y location of the point and also
 * its 'location' (proportion of travel along the path); the method below - _pointAlongPathFrom - calls this method and just returns the
 * point.
 */
var _pointAlongPath = function (curve, location, distance) {

    if (_isPoint(curve)) {
        return {
            point: curve[0],
            location: location
        };
    }

    var prev = _pointOnPath(curve, location),
        tally = 0,
        curLoc = location,
        direction = distance > 0 ? 1 : -1,
        cur = null;

    while (tally < Math.abs(distance)) {
        curLoc += (0.005 * direction);
        cur = _pointOnPath(curve, curLoc);
        tally += _dist(cur, prev);
        prev = cur;
    }
    return {point: cur, location: curLoc};
};

var _length = function (curve) {
    if (_isPoint(curve)) return 0;

    var prev = _pointOnPath(curve, 0),
        tally = 0,
        curLoc = 0,
        direction = 1,
        cur = null;

    while (curLoc < 1) {
        curLoc += (0.005 * direction);
        cur = _pointOnPath(curve, curLoc);
        tally += _dist(cur, prev);
        prev = cur;
    }
    return tally;
};

/**
 * finds the point that is 'distance' along the path from 'location'.
 */
var _pointAlongPathFrom = function (curve, location, distance) {
    return _pointAlongPath(curve, location, distance).point;
};

/**
 * finds the location that is 'distance' along the path from 'location'.
 */
var _locationAlongPathFrom = function (curve, location, distance) {
    return _pointAlongPath(curve, location, distance).location;
};

/**
 * returns the gradient of the curve at the given location, which is a decimal between 0 and 1 inclusive.
 *
 * thanks // http://bimixual.org/AnimationLibrary/beziertangents.html
 */
var _gradientAtPoint = function (curve, location) {
    var p1 = _pointOnPath(curve, location),
        p2 = _pointOnPath(curve.slice(0, curve.length - 1), location),
        dy = p2.y - p1.y, dx = p2.x - p1.x;
    return dy == 0 ? Infinity : Math.atan(dy / dx);
};

/**
 returns the gradient of the curve at the point which is 'distance' from the given location.
 if this point is greater than location 1, the gradient at location 1 is returned.
 if this point is less than location 0, the gradient at location 0 is returned.
 */
var _gradientAtPointAlongPathFrom = function (curve, location, distance) {
    var p = _pointAlongPath(curve, location, distance);
    if (p.location > 1) p.location = 1;
    if (p.location < 0) p.location = 0;
    return _gradientAtPoint(curve, p.location);
};

/**
 * calculates a line that is 'length' pixels long, perpendicular to, and centered on, the path at 'distance' pixels from the given location.
 * if distance is not supplied, the perpendicular for the given location is computed (ie. we set distance to zero).
 */
var _perpendicularToPathAt = function (curve, location, length, distance) {
    distance = distance == null ? 0 : distance;
    var p = _pointAlongPath(curve, location, distance),
        m = _gradientAtPoint(curve, p.location),
        _theta2 = Math.atan(-1 / m),
        y = length / 2 * Math.sin(_theta2),
        x = length / 2 * Math.cos(_theta2);
    return [{x: p.point.x + x, y: p.point.y + y}, {x: p.point.x - x, y: p.point.y - y}];
};

var _calculateSmoothControlPoints = function(K) {
    var resultP1 = [];
    var resultP2 = [];
    var n = K.length-1;

    /*rhs vector init left most segment*/
    var a = [0];
    var b = [2];
    var c = [1];
    var r = [K[0] + 2 * K[1]];

    /*internal segments*/
    for(i = 1; i < n - 1; i++) {
        a[i] = 1;
        b[i] = 4;
        c[i] = 1;
        r[i] = 4 * K[i] + 2 * K[i+1];
    }

    /*right segment*/
    a[n-1] = 2;
    b[n-1] = 7;
    c[n-1] = 0;
    r[n-1] = 8 * K[n-1] + K[n];

    /*solves Ax=b with the Thomas algorithm*/
    for(i = 1; i < n; i++) {
        m = a[i] / b[i-1];
        b[i] = b[i] - m * c[i - 1];
        r[i] = r[i] - m * r[i-1];
    }

    resultP1[n-1] = r[n-1] / b[n-1];
    for (i = n - 2; i >= 0; --i) {
        resultP1[i] = (r[i] - c[i] * resultP1[i + 1]) / b[i];
    }

    /*we have p1, now compute p2*/
    for (i = 0; i < n - 1; i++) {
        resultP2[i] = 2 * K[i + 1] - resultP1[i + 1];
    }

    resultP2[n-1] = 0.5 * (K[n] + resultP1[n-1]);

    return {p1:resultP1, p2:resultP2};
};

/**
 * Moves a point along the given curve
 * @param curve
 * @param distance
 * @returns {*|{x, y}}
 */
var moveAlong = function(curve, distance) {
    // Somehow the pointAlongPath calculates in the wrong direction so we switch the bahaviour by setting
    // the location to 1 (end) for positive distances.
    // and negotiate the distance value.
    var location = distance > 0 ? 1 : 0;
    var distance = distance * -1;
    return _pointAlongPath(curve,location, distance).point;
};

module.exports = {
    nearestPointOnCurve : _nearestPointOnCurve,
    calculateSmoothControlPoints : _calculateSmoothControlPoints,
    moveAlong : moveAlong,
    length : _length
}


},{}],31:[function(require,module,exports){
var object = require('./object');
var bezier = require('./bezier');

var calcLineIntersection = function(pa1, pa2, pb1, pb2) {
    return new Line(pa1,pa2).calcLineIntercept(new Line(pb1,pb2));
};

var Point = function(x, y) {
    var p = getPoint(x,y);
    this.x = p.x;
    this.y = p.y;
};

Point.prototype.isWithinInterval = function(start, end, tolerance) {
    return isPointInInterval(this, start, end, tolerance);
};

Point.prototype.isWithinXInterval = function(start, end, tolerance) {
    return _inInterval(this, start, end, tolerance, 'x');
};

Point.prototype.isWithinYInterval = function(start, end, tolerance) {
    return _inInterval(this, start, end, tolerance, 'y');
};;

var isPointInInterval = function(point, start, end, tolerance) {
    return _inInterval(point, start, end, tolerance, 'x') && _isPointInInterval(point, start, end, tolerance, 'y');
};

var _inInterval = function(p, start, end, tolerance, dimension) {
    tolerance = tolerance || 0;
    var boundary = minMax(start[dimension], end[dimension]);
    boundary.min -= tolerance;
    boundary.max += tolerance;
    return (p[dimension] <= boundary.max && p[dimension] >= boundary.min);
};

var minMax = function(val1, val2) {
    return {
        min :  Math.min(val1, val2),
        max : Math.max(val1, val2)
    };
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

/*
 *  TODO: this is working if you provide start/end and distance (negative or positive) but not tested (and presumably not working)
 *  when given start/end dist and direction e.g move from start point -30 back.
 */
Line.moveAlong = function(p1,p2, dist, direction) {
    var vector = Line.calcNormalizedLineVector(p1,p2);

    //If there is no direction given we handle negative distances as direction -1 (from end to start)
    direction = direction || (dist < 0) ? -1 : 1;

    if(direction < 1) {
        dist = Line.calcDistance(p1,p2) + dist;
    }

    return {
        x : p1.x + vector.x * dist,
        y : p1.y + vector.y * dist
    };
};

Line.prototype.moveAlong = function(dist, direction) {
    //TODO: note this is just working if we are initiating the line with two points...
    return Line.moveAlong(this.p1, this.p2, dist, direction);
};

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
};

Line.calcMidPoint = function(p1, p2) {
    return {
        x : (p1.x+p2.x) / 2,
        y : (p1.y+p2.y) / 2
    };
};

Line.prototype.isVertical = function(x) {
    return !isFinite(this.m);
};

Line.prototype.isHorizontal = function(x) {
    return this.m === 0;
};

Line.prototype.calcLineIntercept = function(other) {
    //mx(1) + t(1) = mx(2) +t(2)
    var m = other.m + (-1 * this.m);
    var t = this.t + (-1 * other.t);
    var x = (m !== 0) ? t / m : t;
    return this.calcFX(x);
};

Line.prototype.getNearestPoint = function(p) {
    return Line.getNearestPoint(this.p1, this.p2, p);
};

Line.getNearestPoint = function(a, b, p) {
    var AP = [p.x - a.x, p.y - a.y]; // vector A->P
    var AB = [b.x - a.x, b.y - a.y]; // vector A->B
    var magnitude = AB[0] * AB[0] + AB[1] * AB[1] //AB.LengthSquared

    var AP_DOT_AB = AP[0] * AB[0] + AP[1] * AB[1];

    var distance = AP_DOT_AB / magnitude;

    if(distance < 0) {
        return a;
    } else if (distance > 1) {
        return b;
    } else {
        return {
            x: a.x + AB[0] * distance,
            y: a.y + AB[1] * distance
        }
    }
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

Ellipse.prototype.overlays = function(p) {
    var bx = Math.pow((p.x - this.c.x), 2) / Math.pow(this.rx, 2);
    var by = Math.pow((p.y - this.c.y), 2) / Math.pow(this.ry, 2);
    return bx + by <= 1
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

Circle.prototype.overlays = function(p) {
    var bx = Math.pow((p.x - this.c.x), 2);
    var by = Math.pow((p.y - this.c.y), 2);
    return bx + by < Math.pow(this.r, 2);
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

/**
 * Checks if the difference between source and target value is lower than the given range value
 */
var checkRangeDiff = function(source, target, range) {
    return isInDiffRange(target, source, range);
};

var isInDiffRange = function(p1, p2, range) {
    return Math.abs(p1 - p2) < range;
};

var getPoint = function(x, y) {
    var result;
    if(x && object.isDefined(x.x) && object.isDefined(x.y)) {
        result = x;
    } else if(!isNaN(x) && !isNaN(y)) {
        result = {
            x : x,
            y : y
        };
    } else if(object.isDefined(x) && object.isDefined(y)) {
        result = toPoint(x,y);
    }
    return result;
};

var toPoint = function(x,y) {
    x = (object.isString(x)) ? parseFloat(x) : x;
    y = (object.isString(y)) ? parseFloat(y) : y;

    return {x:x,y:y};
};

var toRadians = function (angle) {
    return angle * (Math.PI / 180);
};

var toDegrees = function(angle) {
    return angle * (180 / Math.PI);
};

var rotate = function(p, rotCenter, angle) {
    if(angle === 0 || (p.x === rotCenter.x && p.y === rotCenter.y)) {
        return p;
    }

    var rotated = {};
    var rad = toRadians(angle);
    rotated.x = (p.x - rotCenter.x) * Math.cos(rad) - (p.y - rotCenter.y) * Math.sin(rad) + rotCenter.x;
    rotated.y = (p.y - rotCenter.y) * Math.cos(rad) + (p.x - rotCenter.x) * Math.sin(rad) + rotCenter.y;
    p.x = rotated.x;
    p.y = rotated.y;
    return p;
};


module.exports = {
    calcLineIntersection : calcLineIntersection,
    Line : Line,
    Circle : Circle,
    Ellipse : Ellipse,
    Vector : Vector,
    Point : Point,
    isPointInInterval : isPointInInterval,
    minMax : minMax,
    checkRangeDiff : checkRangeDiff,
    getPoint : getPoint,
    bezier : bezier,
    toRadians : toRadians,
    toDegrees : toDegrees,
    rotate : rotate
};
},{"./bezier":30,"./object":32}],32:[function(require,module,exports){
module.exports = {
    each: function() {
        return $.each(arguments[0], arguments[1], arguments[2]);
    },

    grep: function(arr, filter, invert) {
        return $.grep(arr, filter, invert);
    },

    isOneOf: function(search) {
        var i;
        for(i = 1;i < arguments.length;i++) {
          if(search === arguments[i]) {
              return true;
          }
        }
        return false;
    },

    isArray: function(obj) {
        return $.isArray(obj);
    },

    toArray : function(obj) {
        return $.map(obj, function(value, index) {
            return [value];
        });
    },

    removeFromArray: function(arr, item) {
        var index = arr.indexOf(item);
        if(index >= 0) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    },

    size: function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    },

    sort: function(obj, sort) {
        var arr;
        if(!obj) {
            return;
        } else if(this.isArray(obj)) {
            arr = obj;
        } else if(this.isObject(obj)) {
            arr = $.map(obj, function (index, val) {
                return obj[val];
            });
        }

        return arr.sort(sort);
    },

    valueByIndex: function(arr, index) {
        var index = this.getIndex(arr,index);
        return arr[index];
    },

    getIndex: function(arr, index) {
        var result = index;
        // for negative indexes we return values counted from the other side so -1 is the last index
        // if the negative index is out of range we return the last index.
        if(index < 0) {
            result = arr.length + index;
            result = (result > arr.length -1 || result < 0) ? arr.length -1 : result;
        }
        return result;
    },

    isFunction: function(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    },

    isObject: function(obj) {
        return $.isPlainObject(obj);
    },

    isJQuery: function(obj) {
        return obj.jquery;
    },

    isString: function(obj) {
        return typeof obj === 'string';
    },

    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    isBoolean: function(obj) {
        return typeof obj === 'boolean';
    },

    isDefined: function(obj) {
        if(arguments.length > 1) {
            var result = true;
            var that = this;
            this.each(arguments, function(index, value) {
                if(!that.isDefined(value)) {
                    result = false;
                    return false;
                }
            });

            return result;
        }
        return typeof obj !== 'undefined';
    },

    merge: function(target, toMerge) {
        return $.merge(target, toMerge);
    },


    addValue: function(target, newVal) {
        if(isArray(newVal)) {
            merge(target);
        } else {
            target.push(newVal);
        }
    },

    extend: function(target, obj1, obj2) {
        return $.extend(target,obj1,obj2);
    },

    cloneArray: function(arr) {
        return arr.slice(0);
    },

    cloneObject: function(oldObject, deep) {
        deep = deep || false;
        return $.extend(deep, {}, oldObject);
    }
    
};
},{}],33:[function(require,module,exports){
var object = require('./object');

exports.endsWith = function(val, suffix) {
    if(!object.isDefined(val) || !object.isDefined(suffix)) {
        return false;
    }
    return val.indexOf(suffix, val.length - suffix.length) !== -1;
};

exports.cutprefix = function(val, suffix) {
   return val.substring('suffix'.length, val.length);
};

exports.startsWith = function(val, prefix) {
    if(!object.isDefined(val) || !object.isDefined(prefix)) {
        return false;
    }
    return val.indexOf(prefix) === 0;
};
},{"./object":32}],34:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./../dom/dom":6,"./app":29,"./math":31,"./object":32,"./string":33,"./xml":35,"dup":28,"util":40}],35:[function(require,module,exports){
var string = require('./string');

var serializeToString = function(node) {
    var s = new XMLSerializer();
    node = (node.jQuery) ? node[0] : node;
    return s.serializeToString(node);
};

var parseXML = function(strData) {
    return $.parseXML(strData);
};

var format = function (xml) {
    var intend = -1;
    var result = '';
    xml = xml.replace(/(\r\n|\n|\r)/gm,"");
    var lastWasClose = false;
    var lastHadText = false;
    $.each(xml.split('<'), function(index, node) {
        node = node.trim();
        if(node) {
            if(node.indexOf('/') !== 0) {
                if(!lastWasClose) {
                    intend++;
                }

                lastHadText = !string.endsWith(node, '>');
                lastWasClose = string.endsWith(node, '/>');
            } else {
                if(!lastHadText) {
                    lastWasClose = true;
                    intend--;
                }
                lastHadText = !string.endsWith(node, '>');
            }

            var padding = '';
            for (var i = 0; i < intend; i++) {
                padding += '  ';
            }

            var text;
            if(lastHadText) {
                var splitted = node.split('>');
                node = splitted[0] + '>';
                text = splitted[1];
            }
            result += padding + '<'+node+'\r\n';

            if(text) {
                result += padding + '  ' + text+'\r\n';
            }

        }
    });
    return result;
};

module.exports = {
    serializeToString : serializeToString,
    parseXML : parseXML,
    format: format
};
},{"./string":33}],36:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.9.34
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var util = _dereq_("./util.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.enableTrampoline = function() {
    if (!this._trampolineEnabled) {
        this._trampolineEnabled = true;
        this._schedule = function(fn) {
            setTimeout(fn, 0);
        };
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    if (schedule.isStatic) {
        schedule = function(fn) { setTimeout(fn, 0); };
    }
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31,"./util.js":38}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        maybePromise._then(function() {
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    async.enableTrampoline();
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundValue();
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ignoreRejections = function() {
    this._unsetRejectionIsUnhandled();
    this._bitField = this._bitField | 16777216;
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 16777216) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};
var returnUndefined = function() {};
var throwUndefined = function() {
    throw undefined;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value === undefined) return this.then(returnUndefined);

    if (isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (reason === undefined) return this.then(throwUndefined);

    if (isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue())
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue(), value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundValue();
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback =
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var util = _dereq_("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + 2] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./progress.js")(Promise, PromiseArray);
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./call_get.js')(Promise);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._ignoreRejections();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        obj[promisifiedKey] = promisifier === makeNodePromisified
                ? makeNodePromisified(key, THIS, key, fn, suffix)
                : promisifier(fn, function() {
                    return makeNodePromisified(key, THIS, key, fn, suffix);
                });
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundValue();
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
var util = _dereq_("./util");
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = "operation timed out";
    }
    var err = new TimeoutError(message);
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
        len--;
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = arguments[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = fn.apply(undefined, vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function f() {}
    f.prototype = obj;
    var l = 8;
    while (l--) new f();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":38}],37:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],38:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],39:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],40:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":39,"_process":38,"inherits":37}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LnN2Zy5qcyIsImNsaWVudC9jb3JlL2NhY2hlLmpzIiwiY2xpZW50L2NvcmUvY29uZmlnLmpzIiwiY2xpZW50L2NvcmUvZXZlbnQuanMiLCJjbGllbnQvY29yZS9zdWJFdmVudC5qcyIsImNsaWVudC9kb20vZG9tLmpzIiwiY2xpZW50L2RvbS9kb21FbGVtZW50LmpzIiwiY2xpZW50L2RvbS9ldmVudGFibGVOb2RlLmpzIiwiY2xpZW50L3N2Zy9TVkdFbGVtZW50LmpzIiwiY2xpZW50L3N2Zy9jaXJjbGUuanMiLCJjbGllbnQvc3ZnL2RyYWdnYWJsZS5qcyIsImNsaWVudC9zdmcvZWxlbWVudHMuanMiLCJjbGllbnQvc3ZnL2VsbGlwc2UuanMiLCJjbGllbnQvc3ZnL2dyb3VwLmpzIiwiY2xpZW50L3N2Zy9oZWxwZXIuanMiLCJjbGllbnQvc3ZnL3BhdGguanMiLCJjbGllbnQvc3ZnL3BhdGhEYXRhLmpzIiwiY2xpZW50L3N2Zy9yZWN0LmpzIiwiY2xpZW50L3N2Zy9zdHlsZS5qcyIsImNsaWVudC9zdmcvc3ZnLmpzIiwiY2xpZW50L3N2Zy9zdmdSb290LmpzIiwiY2xpZW50L3N2Zy9zdmdTaGFwZS5qcyIsImNsaWVudC9zdmcvdGV4dC5qcyIsImNsaWVudC9zdmcvdHJhbnNmb3JtLmpzIiwiY2xpZW50L3N2Zy90c3Bhbi5qcyIsImNsaWVudC91aS9qcXVlcnlQbHVnaW5zLmpzIiwiY2xpZW50L3V0aWwvVXRpbC5qcyIsImNsaWVudC91dGlsL2FwcC5qcyIsImNsaWVudC91dGlsL2Jlemllci5qcyIsImNsaWVudC91dGlsL21hdGguanMiLCJjbGllbnQvdXRpbC9vYmplY3QuanMiLCJjbGllbnQvdXRpbC9zdHJpbmcuanMiLCJjbGllbnQvdXRpbC94bWwuanMiLCJub2RlX21vZHVsZXMvYmx1ZWJpcmQvanMvYnJvd3Nlci9ibHVlYmlyZC5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeHZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi91aS9qcXVlcnlQbHVnaW5zJyk7XG5yZXF1aXJlKCcuL3N2Zy9kcmFnZ2FibGUnKTtcblxuaWYoIXdpbmRvdy5kYWxhKSB7XG4gICAgZGFsYSA9IHt9O1xufVxuXG5pZighd2luZG93LmRhbGEuU1ZHKSB7XG4gICAgd2luZG93LmRhbGEuU1ZHID0gcmVxdWlyZSgnLi9zdmcvc3ZnJyk7XG59XG5cbiIsInZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbScpO1xyXG52YXIgc3RyaW5nID0gcmVxdWlyZSgnLi4vdXRpbC9zdHJpbmcnKTtcclxuXHJcbnZhciBDYWNoZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5xdWVyeUNhY2hlID0ge307XHJcbiAgICB0aGlzLnN2Z0NhY2hlID0ge307XHJcbn07XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuY2xlYXJCeVN1ZmZpeCA9IGZ1bmN0aW9uKHN1ZmZpeCkge1xyXG4gICAgZm9yKGtleSBpbiB0aGlzLnF1ZXJ5Q2FjaGUpIHtcclxuICAgICAgICBpZih0aGlzLnF1ZXJ5Q2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBzdHJpbmcuZW5kc1dpdGgoa2V5LCBzdWZmaXgpKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnF1ZXJ5Q2FjaGVba2V5XTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZvcihrZXkgaW4gdGhpcy5zdmdDYWNoZSkge1xyXG4gICAgICAgIGlmKHRoaXMuc3ZnQ2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBzdHJpbmcuZW5kc1dpdGgoa2V5LCBzdWZmaXgpKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN2Z0NhY2hlW2tleV07XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS4kID0gZnVuY3Rpb24ob2JqLCBwcmV2ZW50Q2FjaGUpIHtcclxuICAgIGlmKCFvYmopIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5xdWVyeUNhY2hlW29ial0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUNhY2hlW29ial07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNldHRpbmdzID0gdGhpcy5nZXRDYWNoZVNldHRpbmdzKG9iaiwgdGhpcy5xdWVyeUNhY2hlKTtcclxuICAgIHJldHVybiB0aGlzLmNhY2hlQ2hlY2soc2V0dGluZ3Mua2V5LCBzZXR0aW5ncy4kbm9kZSwgdGhpcy5xdWVyeUNhY2hlLCBwcmV2ZW50Q2FjaGUpO1xyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLnN2ZyA9IGZ1bmN0aW9uKG9iaiwgcHJldmVudENhY2hlKSB7XHJcbiAgICBpZighb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuc3ZnQ2FjaGVbb2JqXSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN2Z0NhY2hlW29ial07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNldHRpbmdzID0gdGhpcy5nZXRDYWNoZVNldHRpbmdzKG9iaiwgdGhpcy5zdmdDYWNoZSk7XHJcbiAgICByZXR1cm4gdGhpcy5jYWNoZUNoZWNrKHNldHRpbmdzLmtleSwgJC5zdmcoc2V0dGluZ3MuJG5vZGUpLCB0aGlzLnN2Z0NhY2hlLCBwcmV2ZW50Q2FjaGUpO1xyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLmdldENhY2hlU2V0dGluZ3MgPSBmdW5jdGlvbihvYmosIGNhY2hlKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSB7fTtcclxuXHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcob2JqKSl7XHJcbiAgICAgICAgc2V0dGluZ3MuJG5vZGUgPSB0aGlzLnF1ZXJ5Q2FjaGVbb2JqXSB8fCAkKG9iaik7XHJcbiAgICAgICAgc2V0dGluZ3Mua2V5ID0gb2JqO1xyXG4gICAgfSBlbHNlIGlmKG9iai5qUXVlcnkpIHtcclxuICAgICAgICBzZXR0aW5ncy4kbm9kZSA9IG9iajtcclxuICAgICAgICBzZXR0aW5ncy5rZXkgPSBkb20uZ2V0SWRTZWxlY3RvcihvYmouYXR0cignaWQnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy4kbm9kZSA9ICQob2JqKTtcclxuICAgICAgICAgICAgc2V0dGluZ3Mua2V5ID0gZG9tLmdldElkU2VsZWN0b3Ioc2V0dGluZ3MuJG5vZGUuYXR0cignaWQnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNldHRpbmdzO1xyXG59XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuY2FjaGVDaGVjayA9IGZ1bmN0aW9uKGtleSwgb2JqLCBjYWNoZSwgcHJldmVudENhY2hlKSB7XHJcbiAgICBwcmV2ZW50Q2FjaGUgPSBwcmV2ZW50Q2FjaGUgfHwgZmFsc2U7XHJcbiAgICBpZihrZXkgJiYgb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICghcHJldmVudENhY2hlKSA/IGNhY2hlW2tleV0gPSBvYmogOiBvYmo7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9XHJcbn1cclxuXHJcbkNhY2hlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihvYmopIHtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhvYmopKSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMucXVlcnlDYWNoZVtvYmpdO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLmV4aXN0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICByZXR1cm4gb2JqZWN0LmlzRGVmaW5lZChxdWVyeUNhY2hbc2VsZWN0b3JdKTtcclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgQ2FjaGUoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IENhY2hlKCk7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcblxyXG52YXIgdmFsdWVzID0ge307XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHZhbCA6IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCkge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0RlZmluZWQoa2V5KSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVzW2tleV07XHJcbiAgICAgICAgICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZChyZXN1bHQpKSA/IHJlc3VsdCA6IGRlZmF1bHRWYWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBpcyA6IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbChrZXksZGVmYXVsdFZhbCkgPT09IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlYnVnIDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzQm9vbGVhbih2YWwpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsKCdkZWJ1ZycsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbCgnZGVidWcnLCBmYWxzZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbCA6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGtleSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFsdWVzW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFsKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXBsYWNlQ29uZmlnVmFsdWVzIDogZnVuY3Rpb24odGV4dCwgY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRleHQ7XHJcbiAgICAgICAgb2JqZWN0LmVhY2goY29uZmlnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKFwie1wiICsga2V5ICsgXCJ9XCIsIFwiZ1wiKTtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UocmVnRXhwLCB2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTsiLCJ2YXIgZXZlbnRzID0ge307XHJcblxyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvcmUvY29uZmlnJyk7XHJcbnZhciBTdWJFdmVudCA9IHJlcXVpcmUoJy4vc3ViRXZlbnQnKTtcclxuXHJcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcclxuXHJcbnZhciBoYXNIYW5kbGVyID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgcmV0dXJuIGV2ZW50c1t0eXBlXTtcclxufTtcclxuXHJcbm1vdXNlID0ge307XHJcblxyXG4kKGRvY3VtZW50KS5vbiggJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIG1vdXNlID0gZTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBtb3VzZSA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtb3VzZTtcclxuICAgIH0sXHJcbiAgICBsaXN0ZW46ICBmdW5jdGlvbih0eXBlLCBoYW5kbGVyLCBtb2R1bGUpIHtcclxuICAgICAgICBpZighb2JqZWN0LmlzRnVuY3Rpb24oaGFuZGxlcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGV2ZW50Q29uZmlnID0ge1xyXG4gICAgICAgICAgICBoYW5kbGVyIDogaGFuZGxlcixcclxuICAgICAgICAgICAgbW9kdWxlIDogbW9kdWxlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYoIWV2ZW50c1t0eXBlXSkge1xyXG4gICAgICAgICAgICBldmVudHNbdHlwZV0gPSBbZXZlbnRDb25maWddO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGV2ZW50c1t0eXBlXS5wdXNoKGV2ZW50Q29uZmlnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHVubGlzdGVuOiBmdW5jdGlvbih0eXBlLCBmdW5jKSB7XHJcbiAgICAgICAgaWYoZXZlbnRzW3R5cGVdKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50c1t0eXBlXS5pbmRleE9mKGZ1bmMpO1xyXG4gICAgICAgICAgICBpZihpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudHNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc3ViOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTdWJFdmVudChjb250ZXh0LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tbWFuZDogZnVuY3Rpb24oY29tbWFuZCwgZXhlY3V0ZSkge1xyXG4gICAgICAgIGlmKGV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21tYW5kX2V4ZWN1dGUnLCBjb21tYW5kKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbW1hbmRfYWRkJywgY29tbWFuZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0cmlnZ2VyOiBmdW5jdGlvbih0eXBlLCBkYXRhLCByb290RXZ0KSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gcm9vdEV2dCB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50LmRhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICBldmVudC50eXBlID0gdHlwZTtcclxuXHJcbiAgICAgICAgICAgIGlmKGhhc0hhbmRsZXIoZXZlbnQudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyQXJyID0gZXZlbnRzW2V2ZW50LnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmVhY2goaGFuZGxlckFyciwgZnVuY3Rpb24oaW5kZXgsIGV2ZW50Q29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBldmVudENvbmZpZy5oYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2R1bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlID0gZXZlbnRDb25maWcubW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihldmVudENvbmZpZy5tb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY2FsbChldmVudENvbmZpZy5tb2R1bGUsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZFRleHQgPSAobW9kdWxlICYmIG1vZHVsZS5jb25zdHJ1Y3RvciAmJiBtb2R1bGUuY29uc3RydWN0b3IubmFtZSk/bW9kdWxlLmNvbnN0cnVjdG9yLm5hbWU6J3Vua25vd24nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihtb2RUZXh0ID09PSAndW5rbm93bicgJiYgY29uZmlnLmRlYnVnKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0V2ZW50IGhhbmRsZXIgZXJyb3IgLSBtb2R1bGU6ICcrbW9kVGV4dCsnIGV2ZW50OiAnK2V2ZW50LnR5cGUsIGhhbmRsZXIsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFdmVudCBoYW5kbGVyIGVycm9yIC0gbW9kdWxlOiAnK21vZFRleHQrJyBldmVudDogJytldmVudC50eXBlLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcignZXJyb3InLCAnQW4gZXJyb3Igb2NjdXJlZCB3aGlsZSBleGVjdXRpbmcgdGhlIGxhc3QgYWN0aW9uICEnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9XZSBqdXN0IHJlc29sdmUgaW4gYWxsIGNhc2VzIHNpbmNlIHRoZSBjYWxsZXIgb2YgdHJpZ2dlciBzaG91bGQgcmVtYWluIGluZGVwZW5kZW50IG9mIGhhbmRsZXIgbW9kdWxlc1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uOiBmdW5jdGlvbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpIHtcclxuICAgICAgICAkKG5vZGUpLm9uKGV2ZW50LHNlbGVjdG9yLGRhdGEsIGhhbmRsZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmY6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcikge1xyXG4gICAgICAgICQobm9kZSkub2ZmKGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uY2U6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgZGF0YSwgaGFuZGxlcikge1xyXG4gICAgICAgICQobm9kZSkub25lKGV2ZW50LHNlbGVjdG9yLGRhdGEsIGhhbmRsZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0cmlnZ2VyRG9tOiBmdW5jdGlvbihub2RlLCBldmVudCkge1xyXG4gICAgICAgJChub2RlKS50cmlnZ2VyKGV2ZW50KTtcclxuICAgIH1cclxufTsiLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxuXHJcbnZhciBTdWJFdmVudCA9IGZ1bmN0aW9uKGNvbnRleHQsIGV2ZW50KSB7XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5ldmVudCA9IGV2ZW50O1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm1vdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ldmVudC5tb3VzZSgpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLmdldFN1YlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0Kyc6Jyt0eXBlO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLmxpc3RlbiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIsIG1vZHVsZSkge1xyXG4gICAgLy9UT0RPOiBpbXBsZW1lbnQgYnViYmxlXHJcbiAgICB0aGlzLmV2ZW50Lmxpc3Rlbih0aGlzLmdldFN1YlR5cGUodHlwZSksIGhhbmRsZXIsIG1vZHVsZSk7XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUudW5saXN0ZW4gPSBmdW5jdGlvbih0eXBlLCBmdW5jKSB7XHJcbiAgICB0aGlzLmV2ZW50LnVubGlzdGVuKHRoaXMuZ2V0U3ViVHlwZSh0eXBlKSwgZnVuYyk7XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKHR5cGUsIGRhdGEsIHJvb3RFdnQsIHByZXZlbnRCdWJibGUpIHtcclxuICAgIHRoaXMuZXZlbnQudHJpZ2dlcih0aGlzLmdldFN1YlR5cGUodHlwZSksIGRhdGEsIHJvb3RFdnQpO1xyXG4gICAgaWYoIXByZXZlbnRCdWJibGUpIHtcclxuICAgICAgICB0aGlzLmV2ZW50LnRyaWdnZXIodHlwZSwgZGF0YSwgcm9vdEV2dCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUuY29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQsIGV4ZWN1dGUpIHtcclxuICAgIHRoaXMuZXZlbnQuY29tbWFuZChjb21tYW5kLCBleGVjdXRlKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgZGF0YSwgaGFuZGxlcikge1xyXG4gICAgdGhpcy5ldmVudC5vbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcikge1xyXG4gICAgdGhpcy5ldmVudC5vZmYobm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBoYW5kbGVyKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24obm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKSB7XHJcbiAgICB0aGlzLmV2ZW50Lm9uY2Uobm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS50cmlnZ2VyRG9tID0gZnVuY3Rpb24obm9kZSwgZXZlbnQpIHtcclxuICAgIHRoaXMuZXZlbnQudHJpZ2dlckRvbShub2RlLGV2ZW50KTtcclxufVxyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgIHJldHVybiBuZXcgU3ViRXZlbnQoY29udGV4dCwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3ViRXZlbnQ7IiwidmFyIHhtbCA9IHJlcXVpcmUoJy4uL3V0aWwveG1sJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgc3RyaW5nID0gcmVxdWlyZSgnLi4vdXRpbC9zdHJpbmcnKTtcclxuXHJcbnZhciBlbGVtZW50Q2FjaGUgPSB7fTtcclxuXHJcbnZhciBjcmVhdGUgPSBmdW5jdGlvbihlbGVtZW50LCBhdHRyaWJ1dGVzLCB0ZXh0KSB7XHJcbiAgICB2YXIgJGVsZW1lbnQgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCkpO1xyXG5cclxuICAgIGlmKGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAkLmVhY2goYXR0cmlidXRlcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgJGVsZW1lbnQuYXR0cihrZXksIHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0ZXh0KSB7XHJcbiAgICAgICAgJGVsZW1lbnQudGV4dCh0ZXh0KTtcclxuICAgIH1cclxuICAgIHJldHVybiAkZWxlbWVudDtcclxufTtcclxuXHJcbnZhciBxdWVyeSA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjYWNoZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmKGNhY2hlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gJC5xQ2FjaGUoc2VsZWN0b3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSAkKHNlbGVjdG9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgZ2V0SlF1ZXJ5Tm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmKCFub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gVGhlIG5vZGUgaXMgZWl0aGVyIGEgZG9tIG5vZGUgb3IgYSBzZWxlY3RvclxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKG5vZGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5KG5vZGUpO1xyXG4gICAgfSBlbHNlIGlmKG5vZGUuZ2V0QXR0cmlidXRlKXtcclxuICAgICAgICB2YXIgaWQgPSBub2RlLmdldEF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICBpZihpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJC5xQ2FjaGUoJyMnK25vZGUuZ2V0QXR0cmlidXRlKCdpZCcpLCB0cnVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gJChub2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYobm9kZS5qUXVlcnkpIHtcclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZS5nLiBkb2N1bWVudCwgd2luZG93Li4uXHJcbiAgICAgICAgcmV0dXJuICQobm9kZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgbW92ZURvd24gPSBmdW5jdGlvbihub2RlLCBzZWxlY3Rvcikge1xyXG4gICAgdmFyICRub2RlID0gZ2V0SlF1ZXJ5Tm9kZShub2RlKTtcclxuICAgICRub2RlLmJlZm9yZSgkbm9kZS5uZXh0KHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG52YXIgbW92ZVVwID0gZnVuY3Rpb24obm9kZSwgc2VsZWN0b3IpIHtcclxuICAgIHZhciAkbm9kZSA9IGdldEpRdWVyeU5vZGUobm9kZSk7XHJcbiAgICAkbm9kZS5hZnRlcigkbm9kZS5wcmV2KHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG52YXIgaW5zZXJ0QWZ0ZXJJbmRleCA9IGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XHJcbiAgICB2YXIgJG5vZGUgPSBnZXRKUXVlcnlOb2RlKG5vZGUpO1xyXG4gICAgJG5vZGUucGFyZW50KCkuY2hpbGRyZW4oKS5lcShpbmRleCkuYWZ0ZXIoJG5vZGUpO1xyXG59O1xyXG5cclxudmFyIGluc2VydFNWR0FmdGVyID0gZnVuY3Rpb24oY29udGFpbmVyLCBlbGVtZW50LCB0ZXh0LCBpbnNlcnRBZnRlcikge1xyXG4gICAgdGV4dCA9IHRleHQgfHwgZWxlbWVudC50ZXh0O1xyXG4gICAgZGVsZXRlIGVsZW1lbnQudGV4dDtcclxuICAgIHJldHVybiBhZGRTVkdFbGVtZW50KGNvbnRhaW5lcixlbGVtZW50LHRleHQsaW5zZXJ0QWZ0ZXIpO1xyXG59O1xyXG5cclxudmFyIHByZXBlbmRTVkdFbGVtZW50ID0gZnVuY3Rpb24oY29udGFpbmVyLCBlbGVtZW50LCB0ZXh0KSB7XHJcbiAgICB0ZXh0ID0gdGV4dCB8fCBlbGVtZW50LnRleHQ7XHJcbiAgICBkZWxldGUgZWxlbWVudC50ZXh0O1xyXG4gICAgcmV0dXJuIGFkZFNWR0VsZW1lbnQoY29udGFpbmVyLGVsZW1lbnQsdHJ1ZSx0ZXh0KTtcclxufTtcclxuXHJcbnZhciBhcHBlbmRTVkdFbGVtZW50ID0gZnVuY3Rpb24oY29udGFpbmVyLCBlbGVtZW50LCB0ZXh0KSB7XHJcbiAgICB0ZXh0ID0gdGV4dCB8fCBlbGVtZW50LnRleHQ7XHJcbiAgICBkZWxldGUgZWxlbWVudC50ZXh0O1xyXG4gICAgcmV0dXJuIGFkZFNWR0VsZW1lbnQoY29udGFpbmVyLGVsZW1lbnQsZmFsc2UsdGV4dCk7XHJcbn07XHJcblxyXG52YXIgcHJlcGVuZFRvUm9vdCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIGlmKCFlbGVtZW50LnJvb3QuaGFzQ2hpbGROb2RlcygpKSB7XHJcbiAgICAgICAgZWxlbWVudC5pbnN0YW5jZShlbGVtZW50LnJvb3QuYXBwZW5kQ2hpbGQoZWxlbWVudC5pbnN0YW5jZSgpKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW1lbnQuaW5zdGFuY2UoZWxlbWVudC5yb290Lmluc2VydEJlZm9yZShlbGVtZW50Lmluc3RhbmNlKCksIGVsZW1lbnQucm9vdC5jaGlsZE5vZGVzWzBdKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgYWRkU1ZHRWxlbWVudCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZWxlbWVudCwgcHJlcGVuZCwgdGV4dCwgaW5zZXJ0QWZ0ZXIpIHtcclxuICAgIHByZXBlbmQgPSAob2JqZWN0LmlzRGVmaW5lZChwcmVwZW5kKSk/IHByZXBlbmQgOiBmYWxzZTtcclxuICAgIC8vIElmIG9ubHkgdGhlIGNvbnRhaW5lciBpcyBnaXZlbiB3ZSBhc3N1bWUgaXRzIGFuIFNWR0VsZW1lbnQgb2JqZWN0IHdpdGggY29udGFpbmVkIHJvb3Qgbm9kZVxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChjb250YWluZXIpICYmICFvYmplY3QuaXNEZWZpbmVkKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgZWxlbWVudCA9IGNvbnRhaW5lcjtcclxuICAgICAgICBjb250YWluZXIgPSBjb250YWluZXIuZ2V0Um9vdE5vZGUoKTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNTdHJpbmcoY29udGFpbmVyKSkge1xyXG4gICAgICAgIGNvbnRhaW5lciA9IHF1ZXJ5KGNvbnRhaW5lcilbMF07XHJcbiAgICB9IGVsc2UgaWYoY29udGFpbmVyLmluc3RhbmNlKSB7XHJcbiAgICAgICAgY29udGFpbmVyID0gY29udGFpbmVyLmluc3RhbmNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGluc3RhbmNlO1xyXG5cclxuICAgIGlmKCFlbGVtZW50Lmluc3RhbmNlIHx8ICFvYmplY3QuaXNEZWZpbmVkKGVsZW1lbnQuaW5zdGFuY2UoKSkpIHtcclxuICAgICAgICBpbnN0YW5jZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIGVsZW1lbnQudGFnTmFtZSk7XHJcbiAgICAgICAgJC5lYWNoKGVsZW1lbnQuYXR0cmlidXRlcywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZihzdHJpbmcuc3RhcnRzV2l0aChrZXksICd4bGluazonKSkge1xyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2Uuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLHN0cmluZy5jdXRwcmVmaXgoa2V5LCAneGxpbms6JyksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGluc3RhbmNlID0gZWxlbWVudC5pbnN0YW5jZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodGV4dCkpIHtcclxuICAgICAgICB2YXIgdHh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xyXG4gICAgICAgIGluc3RhbmNlLmFwcGVuZENoaWxkKHR4dE5vZGUpO1xyXG4gICAgfVxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChpbnNlcnRBZnRlcikpIHtcclxuICAgICAgICAvL2lmIHRoZSBwYXJlbnRzIGxhc3RjaGlsZCBpcyB0aGUgdGFyZ2V0RWxlbWVudC4uLlxyXG4gICAgICAgIGlmKGNvbnRhaW5lci5sYXN0Y2hpbGQgPT0gaW5zZXJ0QWZ0ZXIpIHtcclxuICAgICAgICAgICAgLy9hZGQgdGhlIG5ld0VsZW1lbnQgYWZ0ZXIgdGhlIHRhcmdldCBlbGVtZW50LlxyXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5zdGFuY2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGVsc2UgdGhlIHRhcmdldCBoYXMgc2libGluZ3MsIGluc2VydCB0aGUgbmV3IGVsZW1lbnQgYmV0d2VlbiB0aGUgdGFyZ2V0IGFuZCBpdCdzIG5leHQgc2libGluZy5cclxuICAgICAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShpbnN0YW5jZSwgaW5zZXJ0QWZ0ZXIubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZighcHJlcGVuZCB8fCAhY29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSApIHtcclxuICAgICAgICBpbnN0YW5jZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnN0YW5jZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGluc3RhbmNlID0gY29udGFpbmVyLmluc2VydEJlZm9yZShpbnN0YW5jZSxjb250YWluZXIuY2hpbGROb2Rlc1swXSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYob2JqZWN0LmlzRnVuY3Rpb24oZWxlbWVudC5pbnN0YW5jZSkpIHtcclxuICAgICAgICBlbGVtZW50Lmluc3RhbmNlKGluc3RhbmNlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbWVudC5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVtZW50O1xyXG59O1xyXG5cclxudmFyIGltcG9ydFNWRyA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgc3ZnWE1MLCBwcmVwZW5kKSB7XHJcbiAgICB2YXIgJHN2Z1hNTCwgbmFtZSwgYXR0cmlidXRlcztcclxuXHJcbiAgICBpZihzdmdYTUwuanF1ZXJ5KSB7XHJcbiAgICAgICAgJHN2Z1hNTCA9IHN2Z1hNTDtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNTdHJpbmcoc3ZnWE1MKSkge1xyXG4gICAgICAgICRzdmdYTUwgPSAkKHBhcnNlWE1MKHN2Z1hNTC50cmltKCkpKTtcclxuICAgICAgICAkc3ZnWE1MID0gJCgkc3ZnWE1MLmdldCgwKS5kb2N1bWVudEVsZW1lbnQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAkc3ZnWE1MID0gJChzdmdYTUwpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCRzdmdYTUwubm9kZU5hbWUpIHtcclxuICAgICAgICBuYW1lID0gJHN2Z1hNTC5ub2RlTmFtZTtcclxuICAgICAgICBhdHRyaWJ1dGVzID0gZ2V0QXR0cmlidXRlcygkc3ZnWE1MKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9ICRzdmdYTUwuZ2V0KDApLnRhZ05hbWU7XHJcbiAgICAgICAgYXR0cmlidXRlcyA9IGdldEF0dHJpYnV0ZXMoJHN2Z1hNTC5nZXQoMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vV2UgY3JlYXRlIGEgZHVtbXkgZWxlbWVudCBvYmplY3RcclxuICAgIHZhciBlbGVtZW50ID0ge1xyXG4gICAgICAgIHRhZ05hbWUgOiBuYW1lLFxyXG4gICAgICAgIGF0dHJpYnV0ZXMgOiBhdHRyaWJ1dGVzLFxyXG4gICAgICAgIGluc3RhbmNlIDogZnVuY3Rpb24oaW5zdCkge1xyXG4gICAgICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGluc3QpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlRWxlbWVudCA9IGluc3Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZUVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmKCFwcmVwZW5kKSB7XHJcbiAgICAgICAgYXBwZW5kU1ZHRWxlbWVudChjb250YWluZXIsIGVsZW1lbnQsIF9nZXRDaGlsZFRleHQoJHN2Z1hNTCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwcmVwZW5kU1ZHRWxlbWVudChjb250YWluZXIsIGVsZW1lbnQsIF9nZXRDaGlsZFRleHQoJHN2Z1hNTCkpO1xyXG4gICAgfVxyXG5cclxuICAgICRzdmdYTUwuY2hpbGRyZW4oKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBjaGlsZCkge1xyXG4gICAgICAgIGltcG9ydFNWRyhlbGVtZW50Lmluc3RhbmNlKCksIGNoaWxkKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBlbGVtZW50Lmluc3RhbmNlKCk7XHJcbn07XHJcblxyXG52YXIgX2dldENoaWxkVGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmKCFub2RlLmpxdWVyeSkge1xyXG4gICAgICAgIG5vZGUgPSAkKG5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjaGlsZFRleHQgPSBub2RlLmNvbnRlbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZVR5cGUgPT09IDM7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKGNoaWxkVGV4dCkgJiYgY2hpbGRUZXh0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICByZXR1cm4gY2hpbGRUZXh0WzBdLm5vZGVWYWx1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgJChub2RlLmF0dHJpYnV0ZXMpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVzdWx0W3RoaXMubm9kZU5hbWVdID0gdGhpcy52YWx1ZTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBmaW5kSW5jbHVkZVNlbGYgPSBmdW5jdGlvbihub2RlLCBzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuICQobm9kZSkuZmluZChzZWxlY3RvcikuYW5kU2VsZigpLmZpbHRlcihzZWxlY3RvcikuZ2V0KDApO1xyXG59O1xyXG5cclxudmFyIHBhcnNlTm9kZVhNTCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmKCFub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQucGFyc2VYTUwoJChub2RlKS50ZXh0KCkpO1xyXG59O1xyXG5cclxudmFyIHBhcnNlWE1MID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4geG1sLnBhcnNlWE1MKHN0cik7XHJcbn07XHJcblxyXG52YXIgcGFyc2VOb2RlSlNPTiA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHJldHVybiAkLnBhcnNlSlNPTigkKG5vZGUpLnRleHQoKSk7XHJcbn07XHJcblxyXG52YXIgZ2V0UmF3SWQgPSBmdW5jdGlvbihpZFNlbGVjdG9yKSB7XHJcbiAgICBpZighb2JqZWN0LmlzU3RyaW5nKGlkU2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGlkU2VsZWN0b3IuY2hhckF0KDApID09PSAnIycpIHtcclxuICAgICAgICByZXR1cm4gaWRTZWxlY3Rvci5zdWJzdHJpbmcoMSwgaWRTZWxlY3Rvci5sZW5ndGgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaWRTZWxlY3RvcjtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRJZFNlbGVjdG9yID0gZnVuY3Rpb24ocmF3SWQpIHtcclxuICAgIGlmKCFvYmplY3QuaXNTdHJpbmcocmF3SWQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyYXdJZC5jaGFyQXQoMCkgIT09ICcjJykge1xyXG4gICAgICAgIHJldHVybiAnIycgKyByYXdJZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHJhd0lkO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhcHBlbmRTVkdFbGVtZW50IDogYXBwZW5kU1ZHRWxlbWVudCxcclxuICAgIHByZXBlbmRTVkdFbGVtZW50IDogcHJlcGVuZFNWR0VsZW1lbnQsXHJcbiAgICBpbnNlcnRTVkdBZnRlciA6IGluc2VydFNWR0FmdGVyLFxyXG4gICAgaW5zZXJ0QWZ0ZXJJbmRleCA6IGluc2VydEFmdGVySW5kZXgsXHJcbiAgICBjcmVhdGUgOiBjcmVhdGUsXHJcbiAgICBwcmVwZW5kVG9Sb290IDogcHJlcGVuZFRvUm9vdCxcclxuICAgIGltcG9ydFNWRyA6IGltcG9ydFNWRyxcclxuICAgIG1vdmVEb3duIDogbW92ZURvd24sXHJcbiAgICBtb3ZlVXAgOiBtb3ZlVXAsXHJcbiAgICBmaW5kSW5jbHVkZVNlbGYgOiBmaW5kSW5jbHVkZVNlbGYsXHJcbiAgICBwYXJzZU5vZGVYTUwgOiBwYXJzZU5vZGVYTUwsXHJcbiAgICBwYXJzZU5vZGVKU09OIDogcGFyc2VOb2RlSlNPTixcclxuICAgIGdldEF0dHJpYnV0ZXMgOiBnZXRBdHRyaWJ1dGVzLFxyXG4gICAgZ2V0UmF3SWQgOiBnZXRSYXdJZCxcclxuICAgIGdldElkU2VsZWN0b3I6IGdldElkU2VsZWN0b3JcclxufTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gdXRpbC5vYmplY3Q7XHJcbnZhciBkb20gPSB1dGlsLmRvbTtcclxuXHJcbnZhciBFdmVudGFibGUgPSByZXF1aXJlKCcuL2V2ZW50YWJsZU5vZGUnKTtcclxuXHJcbnZhciBFbGVtZW50ID0gZnVuY3Rpb24odGFnTmFtZSwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyID0gYXR0cmlidXRlU2V0dGVyIHx8IHt9O1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XHJcblxyXG4gICAgaWYob2JqZWN0LmlzT2JqZWN0KHRhZ05hbWUpKSB7XHJcbiAgICAgICAgY2ZnID0gdGFnTmFtZTtcclxuICAgICAgICB0YWdOYW1lID0gY2ZnLnRhZ05hbWU7XHJcbiAgICAgICAgZGVsZXRlIGNmZy50YWdOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWU7XHJcblxyXG4gICAgaWYob2JqZWN0LmlzT2JqZWN0KGNmZykpIHtcclxuICAgICAgICBpZihjZmcuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNmZy5jaGlsZHJlbjtcclxuICAgICAgICAgICAgZGVsZXRlIGNmZy5jaGlsZHJlbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2luZ2xlID0gY2ZnLnNpbmdsZSB8fCBmYWxzZTtcclxuICAgICAgICBkZWxldGUgY2ZnLnNpbmdsZTtcclxuXHJcbiAgICAgICAgLy9XZSBhc3N1bWUgYWxsIHJlbWFpbmluZyBjZmcgZW50cmllcyBhcmUgYXR0cmlidXRlc1xyXG4gICAgICAgIGZvcih2YXIgYXR0cmlidXRlS2V5IGluIGNmZykge1xyXG4gICAgICAgICAgICBpZihjZmcuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlS2V5KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGF0dHJpYnV0ZUtleSwgY2ZnW2F0dHJpYnV0ZUtleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vU2VlIGV2ZW50YWJsZVxyXG4gICAgdGhpcy5ldmVudEJhc2UgPSB0aGlzO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhFbGVtZW50LCBFdmVudGFibGUpO1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuaW5zdGFuY2UgPSBmdW5jdGlvbihpbnN0YW5jZSkge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChpbnN0YW5jZSkpIHtcclxuICAgICAgICB0aGlzLmRvbUluc3RhbmNlID0gaW5zdGFuY2U7XHJcbiAgICAgICAgdGhpcy50YWdOYW1lID0gaW5zdGFuY2UudGFnTmFtZTtcclxuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKGluc3RhbmNlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tSW5zdGFuY2U7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYWxsIGF0dHJpYnV0ZXMgZnJvbSB0aGUgZG9tIGluc3RhbmNlIGludG8gb3VyIGF0dHJpYnV0ZSBhcnJheSBleGNlcHQgYWxyZWFkeSBleGlzdGluZyBhdHRyaWJ1dGVzLlxyXG4gKiBAcGFyYW0gaW5zdGFuY2VcclxuICovXHJcbkVsZW1lbnQucHJvdG90eXBlLmxvYWRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oaW5zdGFuY2UpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlcyB8fCB7fTtcclxuICAgIHZhciBhdHRyaWJ1dGVzID0gZG9tLmdldEF0dHJpYnV0ZXMoaW5zdGFuY2UpO1xyXG4gICAgZm9yKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xyXG4gICAgICAgIGlmKGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAhdGhpcy5hdHRyaWJ1dGVzW2tleV0pIHtcclxuICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGVtZW50LnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKG5ld0lkKSB7XHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcobmV3SWQpKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKCdpZCcsbmV3SWQpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyKCdpZCcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBmb3IoYXR0cmlidXRlS2V5IGluIHRoaXMuYXR0cmlidXRlU2V0dGVyKSB7XHJcbiAgICAgICAgaWYodGhpcy5hdHRyaWJ1dGVTZXR0ZXIuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlS2V5KSkge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZShhdHRyaWJ1dGVLZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLnVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdGhpcy5fc2V0QXR0cmlidXRlKGtleSwgdGhpcy5hdHRyaWJ1dGVzW2tleV0pO1xyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuX3NldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIHByZXZEb21TZXQpIHtcclxuICAgIC8vIElmIGZpcnN0IGFyZyBpcyBvYmplY3QgaGFuZGxlIGl0cyBwcm9wZXJ0aWVzIGFzIGF0dHJpYnV0ZXNcclxuICAgIGlmKG9iamVjdC5pc09iamVjdChrZXkpKSB7XHJcbiAgICAgICAgZm9yKHZhciBhdHRyaWJ1dGUgaW4ga2V5KSB7XHJcbiAgICAgICAgICAgIGlmKG9iamVjdC5pc0RlZmluZWQoYXR0cmlidXRlKSAmJiBrZXkuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwga2V5W2F0dHJpYnV0ZV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gU29tZSBlbGVtZW50dHlwZXMgY2FuIHRyYW5zZm9ybSBzcGVjaWZpYyB0eXBlcyBvZiBhdHRyaWJ1dGVzIHRvIHNwZWNpYWwgb2JqZWN0c1xyXG4gICAgICAgIC8vIHdoaWNoIGFyZSBhYmxlIHRvIHJlbmRlciBhbmQgc2V0IHRoZSB2YWx1ZXMgaW4gYSBzcGVjaWFsIHdheS5cclxuICAgICAgICBpZighdGhpcy5oYXNDbGFzcygnbm9QYXJzZScpICYmIG9iamVjdC5pc1N0cmluZyh2YWx1ZSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZVNldHRlcltrZXldKSkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuYXR0cmlidXRlU2V0dGVyW2tleV0odmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBKdXN0IHRyYW5zZm9ybSBzdHJpbmdsaXRzIHZhbHVlcyB0byBhcnJheXMgaW4gY2FzZSBpdHMgYSBzdHJpbmcgbGlzdFxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1trZXldID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIERpcmVjdGx5IHNldCBpdCB0byB0aGUgU1ZHIGluc3RhbmNlIGlmIGFscmVhZHkgcmVuZGVyZWRcclxuICAgICAgICBpZih0aGlzLmRvbUluc3RhbmNlICYmICFwcmV2RG9tU2V0KSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBFbGVtZW50LmdldEF0dHJpYnV0ZVN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9tSW5zdGFuY2Uuc2V0QXR0cmlidXRlKGtleSx2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24oc2VhcmNoQ2xhc3MpIHtcclxuICAgIGlmKHRoaXMuZG9tSW5zdGFuY2UpIHtcclxuICAgICAgICAvL0pxdWVyeSBoYXNjbGFzcyBkb2VzIG5vdCB3b3JrIHdpdGggc3ZnIGVsZW1lbnRzXHJcbiAgICAgICAgdmFyIGVsZW1lbnRDbGFzcyA9ICcgJysgdGhpcy5hdHRyKCdjbGFzcycpKycgJztcclxuICAgICAgICByZXR1cm4gZWxlbWVudENsYXNzLmluZGV4T2YoJyAnK3NlYXJjaENsYXNzKycgJykgPiAtMTtcclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLiQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgaWYoIXRoaXMuJGRvbUluc3RhbmNlICYmIHRoaXMuZG9tSW5zdGFuY2UpIHtcclxuICAgICAgICB0aGlzLiRkb21JbnN0YW5jZSA9ICQodGhpcy5kb21JbnN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChzZWxlY3RvcikgPyB0aGlzLiRkb21JbnN0YW5jZS5maW5kKHNlbGVjdG9yKSA6IHRoaXMuJGRvbUluc3RhbmNlO1xyXG59O1xyXG5cclxuRWxlbWVudC5nZXRBdHRyaWJ1dGVTdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuXHJcbiAgICBpZihvYmplY3QuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBvYmplY3QuZWFjaCh2YWx1ZSwgZnVuY3Rpb24oaW5kZXgsIHBhcnQpIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9ICgrK2luZGV4ID09PSB2YWx1ZS5sZW5ndGgpID8gcGFydCA6IHBhcnQrJyAnO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbkVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWVGcm9tU3RyaW5nTGlzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcodmFsdWUpICYmIHZhbHVlLmluZGV4T2YoJyAnKSA+IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlLnNwbGl0KC9bXFxzXSsvKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuYXR0ck51bWJlciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHZhciB2YWwgPSB1dGlsLmFwcC5wYXJzZU51bWJlclN0cmluZyh0aGlzLmF0dHIoa2V5LCB2YWx1ZSkpO1xyXG4gICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkgPyB0aGlzIDogdmFsO1xyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUucG9pbnRlckV2ZW50cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdwb2ludGVyLWV2ZW50cycsIHZhbHVlKTtcclxufTtcclxuRWxlbWVudC5wcm90b3R5cGUuYXR0ciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgb2JqZWN0LmlzRGVmaW5lZChhcmd1bWVudHNbMV0pKSB7XHJcbiAgICAgICAgLy9UT0RPOiBpbXBsZW1lbnQgZm9yIG1vciB0aGFudCAyXHJcbiAgICAgICAgdmFyIG9iaiA9IHt9O1xyXG4gICAgICAgIG9ialthcmd1bWVudHNbMF1dID0gYXJndW1lbnRzWzFdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIob2JqKTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNTdHJpbmcoYXR0cmlidXRlKSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXTtcclxuICAgICAgICBpZighcmVzdWx0ICYmIHRoaXMuaW5zdGFuY2UoKSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA9ICB0aGlzLiQoKS5hdHRyKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICBFbGVtZW50O1xyXG4iLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvcmUvY29uZmlnJyk7XHJcblxyXG52YXIgRXZlbnRhYmxlID0gZnVuY3Rpb24oZXZlbnRCYXNlKSB7XHJcbiAgICB0aGlzLmV2ZW50QmFzZSA9IGV2ZW50QmFzZTtcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIHByZXZEb21FdmVudCkge1xyXG4gICAgYXJncyA9IGFyZ3MgfHwgdGhpcztcclxuICAgIHRoaXMuZXhlY3V0ZUFkZGl0aW9uKGZ1bmMsIGFyZ3MpO1xyXG4gICAgaWYodGhpcy5leGVjdXRlVGVtcGxhdGVIb29rKSB7XHJcbiAgICAgICAgdGhpcy5leGVjdXRlVGVtcGxhdGVIb29rKGZ1bmMsIGFyZ3MpO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5ldmVudEJhc2UgJiYgIXByZXZEb21FdmVudCkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihmdW5jLCBhcmdzKTtcclxuICAgIH1cclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUuZXhlY3V0ZUFkZGl0aW9uID0gZnVuY3Rpb24oZnVuYywgYXJncykge1xyXG4gICAgaWYoIXRoaXMuYWRkaXRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgb2JqZWN0LmVhY2godGhpcy5hZGRpdGlvbnMsIGZ1bmN0aW9uKGtleSwgYWRkaXRpb24pIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGFkZGl0aW9uKSAmJiBvYmplY3QuaXNGdW5jdGlvbihhZGRpdGlvbltmdW5jXSkpIHtcclxuICAgICAgICAgICAgYWRkaXRpb25bZnVuY10uYXBwbHkoYWRkaXRpb24sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS5vbmUgPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vbmUoZXZ0LCB0aGlzLndyYXAoZXZ0LCBoYW5kbGVyKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vbihldnQsIHRoaXMud3JhcChldnQsIGhhbmRsZXIpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBoYW5kbGVyKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYodGhhdC5pc0V4ZWN1dGlvbkFsbG93ZWQoZXZlbnRUeXBlKSkge1xyXG4gICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLmlzRXhlY3V0aW9uQWxsb3dlZCA9IGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xyXG4gICAgaWYodGhpcy5mcmVlemVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIGlmKGNvbmZpZy5pcygnZXZlbnRzX3Jlc3RyaWN0ZWQnLCBmYWxzZSkgJiYgIXRoaXMuZXhjbHVkZUV2ZW50UmVzdHJpY3Rpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUuZnJlZXplID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmZyZWV6ZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5ldmVudEJhc2UuZnJlZXplZCA9IHRydWU7XHJcbn07XHJcblxyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS51bmZyZWV6ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5mcmVlemVkID0gZmFsc2U7XHJcbiAgICB0aGlzLmV2ZW50QmFzZS5mcmVlemVkID0gdHJ1ZTtcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKGV2dCwgYXJncykge1xyXG4gICAgaWYoIXRoaXMuZXZlbnRCYXNlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudEJhc2UuJCgpLnRyaWdnZXIoZXZ0LCBhcmdzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vZmYoZXZ0LCBoYW5kbGVyKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRXZlbnRhYmxlOyIsInZhciBEb21FbGVtZW50ID0gcmVxdWlyZSgnLi4vZG9tL2RvbUVsZW1lbnQnKTtcclxudmFyIFN0eWxlID0gcmVxdWlyZSgnLi9zdHlsZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxuXHJcbi8qXHJcbiAqIENvbnN0cnVjdG9yIGZvciBTVkcgRWxlbWVudHNcclxuICpcclxuICogQHBhcmFtIHt0eXBlfSBuYW1lIHRoZSBlbGVtZW50IE5hbWUgZS5nLiByZWN0LCBjaXJjbGUsIHBhdGguLi5cclxuICogQHBhcmFtIHt0eXBlfSBjZmcgYXR0cmlidXRlcyBhbmQgYWRkaXRpb25hbCBjb25maWd1cmF0aW9uc1xyXG4gKiBAcGFyYW0ge3R5cGV9IGF0dHJpYnV0ZVNldHRlciB5b3UgY2FuIGFkZCBhZGRpdGlvbmFsIGF0dHJpYnV0ZSBzZXR0ZXJcclxuICogZm9yIHNwZWNpYWwgYXR0cmlidXRlcyBkZWZhdWx0IGF0dHJpYnV0ZSBzZXR0ZXIgZ2l2ZW4gYnkgdGhpcyBpbXBlbGVtZW50YXRpb25cclxuICogYXJlIHRyYW5zZm9ybSBhbmQgc3R5bGUgc2V0dGVyXHJcbiAqL1xyXG52YXIgU1ZHRWxlbWVudCA9IGZ1bmN0aW9uKG5hbWUsIHN2ZywgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyID0gYXR0cmlidXRlU2V0dGVyIHx8IHt9O1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIuc3R5bGUgPSB0aGlzLnN0eWxlQXR0cmlidXRlU2V0dGVyO1xyXG4gICAgdGhpcy5TVkdFbGVtZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBJZiBmaXJzdCBhdHRyaWJ1dGUgaXMgbm90IGEgc3RyaW5nIHdlIGFzc3VtZSBhIHN2ZyBub2RlIGNvbnN0cnVjdG9yIGNhbGwuXHJcbiAgICBpZighb2JqZWN0LmlzU3RyaW5nKG5hbWUpKSB7XHJcbiAgICAgICAgdGhpcy5pbnN0YW5jZShuYW1lKTtcclxuICAgICAgICBjZmcgPSBkb20uZ2V0QXR0cmlidXRlcyhuYW1lKTtcclxuICAgICAgICBuYW1lID0gbmFtZS50YWdOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ZnID0gc3ZnO1xyXG4gICAgdGhpcy5yb290ID0gc3ZnLnJvb3QgfHwgdGhpcztcclxuICAgIERvbUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lLCBjZmcsIHRoaXMuYXR0cmlidXRlU2V0dGVyKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHRWxlbWVudCwgRG9tRWxlbWVudCk7XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5zdHlsZUF0dHJpYnV0ZVNldHRlciA9IGZ1bmN0aW9uKHRybmFzZm9ybWF0aW9uU3RyaW5nKSB7XHJcbiAgICByZXR1cm4gbmV3IFN0eWxlKHRybmFzZm9ybWF0aW9uU3RyaW5nKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290Lmluc3RhbmNlKCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5nZXRTVkdSb290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oaW5kZXgsIHZhbCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0aGF0LmFwcGVuZCh2YWwpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXN1bHQgPSAgdXRpbC5kb20uYXBwZW5kU1ZHRWxlbWVudCh0aGlzLmluc3RhbmNlKCksIGVsZW1lbnQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgb2JqZWN0LmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRoYXQucHJlcGVuZCh2YWwpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXN1bHQgPSAgdXRpbC5kb20ucHJlcGVuZFNWR0VsZW1lbnQodGhpcy5pbnN0YW5jZSgpLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy4kKCkucmVtb3ZlKCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLnN2Zy5nZXQodGhpcy4kKCkuZmluZChzZWxlY3RvcikpO1xyXG4gICAgcmV0dXJuIHV0aWwub2JqZWN0LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdCA6IFtyZXN1bHRdO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZmlyc3RDaGlsZCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICByZXR1cm4gJC5zdmcodGhpcy4kKCkuY2hpbGRyZW4oc2VsZWN0b3IpLmZpcnN0KCkpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuY2hpbGRyZW4gPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuICQuc3ZnKHRoaXMuJCgpLmNoaWxkcmVuKHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5wYXJlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLnN2Zyh0aGlzLiQoKS5wYXJlbnQoKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5tb3ZlRG93biA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJG5vZGUgPSB0aGlzLiQoKTtcclxuICAgICRub2RlLnByZXZBbGwoc2VsZWN0b3IpLmZpcnN0KCkuYmVmb3JlKCRub2RlKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJG5vZGUgPSB0aGlzLiQoKTtcclxuICAgICRub2RlLm5leHRBbGwoc2VsZWN0b3IpLmZpcnN0KCkuYWZ0ZXIoJG5vZGUpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuYmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZG9tLnByZXBlbmRUb1Jvb3QodGhpcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTVkcgU3R5bGVzXHJcbiAqL1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgJiYgb2JqZWN0LmlzU3RyaW5nKGtleSkgJiYga2V5LmluZGV4T2YoJzonKSA8PSAwXHJcbiAgICAgICAgJiYgb2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZXMuc3R5bGUpKSB7XHJcbiAgICAgICAgLy9HRVRURVIgQ0FMTFxyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuc3R5bGUuZ2V0KGtleSk7XHJcbiAgICB9IGVsc2UgaWYoIW9iamVjdC5pc0RlZmluZWQodGhpcy5hdHRyaWJ1dGVzLnN0eWxlKSAmJiBvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5zdHlsZSA9IG5ldyBTdHlsZShrZXksIHZhbHVlKTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5zdHlsZS5zZXQoa2V5LCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKCdzdHlsZScpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5kYWxhID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignZGFsYTonK2tleSwgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZ2V0QkJveCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UoKS5nZXRCQm94KCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHV0aWwueG1sLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuaW5zdGFuY2UoKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJCgpLmNsb25lKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR0VsZW1lbnQ7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHRWxsaXBzZSA9IHJlcXVpcmUoJy4vZWxsaXBzZScpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHQ2lyY2xlID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdjaXJjbGUnLCBzdmdSb290LCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdDaXJjbGUsIFNWR0VsbGlwc2UpO1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHZhciBzY2FsZSA9IChub1NjYWxlKSA/IDEgOiB0aGlzLnNjYWxlKClbMV07XHJcbiAgICBpZigoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdyJykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyJykgKyAodGhpcy5zdHJva2VXaWR0aCgpIC8gMikpICogc2NhbGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0ck51bWJlcigncicsIHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdiA9IHZhbHVlIC8gMjtcclxuICAgIHRoaXMuY3kodikuY3godikucih2KTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmhlaWdodCh2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdDaXJjbGUucHJvdG90eXBlLnJ4ID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHJldHVybiB0aGlzLnIodmFsdWUsIG5vU2NhbGUpO1xyXG59O1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yeSA9IGZ1bmN0aW9uKHZhbHVlLCBub1NjYWxlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yKHZhbHVlLCBub1NjYWxlKTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkNpcmNsZSh0aGlzLmdldENlbnRlcigpLCB0aGlzLnIoKSkub3ZlcmxheXMocG9zaXRpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdDaXJjbGU7IiwidmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgZXZlbnQgPSByZXF1aXJlKCcuLi9jb3JlL2V2ZW50Jyk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb3JlL2NvbmZpZycpO1xyXG5cclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcblxyXG52YXIgU2hpZnREcmFnID0gZnVuY3Rpb24oY2ZnKSB7XHJcbiAgICB0aGlzLmNmZyA9IGNmZztcclxuICAgIGlmKCFjZmcucmVzdHJpY3Rpb25YICYmICFjZmcucmVzdHJpY3Rpb25ZKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgdGhpcy54U2hpZnQgPSB7XHJcbiAgICAgICAgc2hpZnRBbGlnbiA6IDAsXHJcbiAgICAgICAgdW5zaGlmdEFsaWduIDogMFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnlTaGlmdCA9IHtcclxuICAgICAgICBzaGlmdEFsaWduIDogMCxcclxuICAgICAgICB1bnNoaWZ0QWxpZ24gOiAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2Rpc2FibGVkJztcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHN3aXRjaCh0aGlzLnN0YXRlKSB7XHJcbiAgICAgICAgY2FzZSAnaW5pdCcgOlxyXG4gICAgICAgICAgICB0aGlzLnhTaGlmdC5zaGlmdEFsaWduICs9IGR4O1xyXG4gICAgICAgICAgICB0aGlzLnlTaGlmdC5zaGlmdEFsaWduICs9IGR5O1xyXG5cclxuICAgICAgICAgICAgaWYodGhpcy5jaGVja1NoaWZ0SG9vayhldnQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZihNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IE1hdGguYWJzKHRoaXMueVNoaWZ0LnNoaWZ0QWxpZ24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSBmdW5jdGlvbihldnQsIGR4ICxkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5zaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ3NoaWZ0ZWRYJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSBmdW5jdGlvbihldnQsIGR4ICwgZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuc2hpZnRSZXN0cmljdGlvbih0aGF0LnhTaGlmdCwgZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdzaGlmdGVkWSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2hpZnRlZFgnOlxyXG4gICAgICAgICAgICBpZighZXZ0LnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0aW9uWSA9IGZ1bmN0aW9uKGV2dCwgZHgsIGR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQudW5TaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdpbml0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzaGlmdGVkWSc6XHJcbiAgICAgICAgICAgIGlmKCFldnQuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdHJpY3Rpb25YID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC51blNoaWZ0UmVzdHJpY3Rpb24odGhhdC54U2hpZnQsIGR4KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuc2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9VcGRhdGUgc2hpZnRlZCBkXHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduICs9IGQ7XHJcbiAgICAvL0FsaWduIHNoaWZ0IGRyYWcgYmFjayB0byB0aGUgc3RhcnQgcG9zaXRpb25cclxuICAgIHZhciByZXN1bHQgPSAoTWF0aC5hYnMoc2hpZnREYXRhLnNoaWZ0QWxpZ24pID4gMCkgPyBzaGlmdERhdGEuc2hpZnRBbGlnbiAqIC0xIDogMDtcclxuICAgIHNoaWZ0RGF0YS5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLnVuU2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9BbGlnbiBzaGlmdCBkcmFnIGJhY2sgdG8gdGhlIHN0YXJ0IHBvc2l0aW9uXHJcbiAgICB2YXIgcmVzdWx0ID0gc2hpZnREYXRhLnVuc2hpZnRBbGlnbiArIGQ7XHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmNoZWNrU2hpZnRIb29rID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICByZXR1cm4gZXZ0LnNoaWZ0S2V5ICYmIChNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IDQgfHwgTWF0aC5hYnModGhpcy55U2hpZnQuc2hpZnRBbGlnbikgPiA0KTtcclxufTtcclxuXHJcbi8vVE9ETzogdGhpcyB3b3VsZCBiZSBtb3JlIGVsZWdhbnQgdG8gdXNlIHRoZSBhbGlnbm1lbnQgYWxpZ24gY2VudGVyIHRvIGNlbnRlci54IGlmIGNoZWNrU2hpZnRIb29rXHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmdldFJlc3RyaWN0aW9uWCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY2ZnLnJlc3RyaWN0aW9uWCB8fCB0aGlzLnJlc3RyaWN0aW9uWDtcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuZ2V0UmVzdHJpY3Rpb25ZID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jZmcucmVzdHJpY3Rpb25ZIHx8IHRoaXMucmVzdHJpY3Rpb25ZO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmRyYWdnYWJsZSA9IGZ1bmN0aW9uKGNmZywgZHJhZ0VsZW1lbnQpIHtcclxuICAgIHZhciBjZmcgPSBjZmcgfHwge307XHJcblxyXG5cclxuXHJcbiAgICBpZihkcmFnRWxlbWVudCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50ID0gdGhpcy5zdmcuZ2V0KGRyYWdFbGVtZW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZHJhZ0VsZW1lbnQgPSB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICB2YXIgZHJhZ01vdmUgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBpZihldnQucHJldmVudERlZmF1bHQpIHtcclxuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB0aGF0LmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhY3R1YWxkeCA9IChvYmplY3QuaXNEZWZpbmVkKGV2dC5keCkpID8gZXZ0LmR4IDogZXZ0LmNsaWVudFggLSB0aGF0LmRyYWdDdXJyZW50WDtcclxuICAgICAgICB2YXIgYWN0dWFsZHkgPSAob2JqZWN0LmlzRGVmaW5lZChldnQuZHkpKSA/IGV2dC5keSA6IGV2dC5jbGllbnRZIC0gdGhhdC5kcmFnQ3VycmVudFk7XHJcblxyXG4gICAgICAgIC8vIERSQUcgQkVGT1JFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ0JlZm9yZU1vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdCZWZvcmVNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGFjdHVhbGR4LCBhY3R1YWxkeV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRFJBRyBBTElHTk1FTlRcclxuICAgICAgICBpZihjZmcuZHJhZ0FsaWdubWVudCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgYWxpZ25tZW50ID0gY2ZnLmRyYWdBbGlnbm1lbnQuY2hlY2soYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgYWN0dWFsZHggPSBhbGlnbm1lbnQuZHg7XHJcbiAgICAgICAgICAgIGFjdHVhbGR5ID0gYWxpZ25tZW50LmR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9DaGVjayBmb3Igc2hpZnREcmFnIHJlc3RyaWN0aW9uLCBzaGlmdERyYWcgd2lsbCBvbmx5IGhvb2sgdXAgaWYgbm8gb3RoZXIgcmVzdHJpY3Rpb24gaXMgc2V0LlxyXG4gICAgICAgIC8vU2hpZnRkcmFnIGlzIG5vdCBnaXZlbiBmb3IgdHJpZ2dlcmRyYWdzXHJcbiAgICAgICAgaWYodGhhdC5zaGlmdERyYWcgJiYgIWV2dC50cmlnZ2VyRXZlbnQpIHtcclxuICAgICAgICAgICAgdGhhdC5zaGlmdERyYWcudXBkYXRlKGV2dCwgYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgdmFyIHJlc3RyaWN0aW9uWCA9IHRoYXQuc2hpZnREcmFnLmdldFJlc3RyaWN0aW9uWCgpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdHJpY3Rpb25ZID0gdGhhdC5zaGlmdERyYWcuZ2V0UmVzdHJpY3Rpb25ZKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIFJFU1RSSUNUSU9OXHJcbiAgICAgICAgdmFyIGR4ID0gKHJlc3RyaWN0aW9uWCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkgPyByZXN0cmljdGlvblguYXBwbHkodGhhdCwgW2V2dCwgYWN0dWFsZHgsIGFjdHVhbGR5XSkgOiBhY3R1YWxkeDtcclxuICAgICAgICB2YXIgZHkgPSAocmVzdHJpY3Rpb25ZICYmICFldnQudHJpZ2dlckV2ZW50KSA/IHJlc3RyaWN0aW9uWS5hcHBseSh0aGF0LCBbZXZ0LCBhY3R1YWxkeCwgYWN0dWFsZHldKSA6IGFjdHVhbGR5O1xyXG5cclxuICAgICAgICAvL1RPRE86IHNvbWVob3cgdGhlIHNjYWxlIHNob3VsZCBiZSBkZXRlcm1pbmVkIGluIGEgbW9yZSBlbGVnYW50IHdheSBwZXJoYXBzIHN0b3JlIGl0IGluIHN2ZyBpbnN0YW5jZS4uLlxyXG4gICAgICAgIGlmKGNmZy5nZXRTY2FsZSAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBjZmcuZ2V0U2NhbGUoKTtcclxuICAgICAgICAgICAgZHggLz0gc2NhbGU7XHJcbiAgICAgICAgICAgIGR5IC89IHNjYWxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRVhFQ1VURSBEUkFHXHJcbiAgICAgICAgaWYoZHggIT09IDAgfHwgZHkgIT09IDApIHtcclxuICAgICAgICAgICAgdGhhdC5tb3ZlKGR4LCBkeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBjdXJyZW50IG1vdXNlIHBvc2l0aW9uXHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFggPSBldnREYXRhLmNsaWVudFg7XHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFkgPSBldnREYXRhLmNsaWVudFk7XHJcblxyXG4gICAgICAgIHRoYXQuZHhTdW0gKz0gZHg7XHJcbiAgICAgICAgdGhhdC5keVN1bSArPSBkeTtcclxuXHJcbiAgICAgICAgLy8gRFJBRyBNT1ZFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ01vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGR4LCBkeV0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRyYWdFbmQgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL1R1cm4gb2ZmIGRyYWcgZXZlbnRzXHJcbiAgICAgICAgdGhhdC5nZXRTVkdSb290KCkub2ZmKCdtb3VzZW1vdmUnKTtcclxuICAgICAgICBldmVudC5vZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcblxyXG4gICAgICAgIGlmKGNmZy5kcmFnQWxpZ25tZW50KSB7XHJcbiAgICAgICAgICAgIGNmZy5kcmFnQWxpZ25tZW50LnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRyYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAkKCdib2R5JykuY3NzKCdjdXJzb3InLCdkZWZhdWx0Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIEVORCBIT09LXHJcbiAgICAgICAgaWYoY2ZnLmRyYWdFbmQpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdFbmQuYXBwbHkodGhhdCwgW2V2dF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhhdC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdhbGwnKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYoZHJhZ0VsZW1lbnQpIHtcclxuICAgICAgICB2YXIgbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgaWYoZS5jdHJsS2V5IHx8ICF0aGF0LmlzVmlzaWJsZSgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAvLyBXZSBzdG9wIHRoZSBldmVudCBwcm9wYWdhdGlvbiB0byBwcmV2ZW50IHRoZSBkb2N1bWVudCBtb3VzZWRvd24gaGFuZGxlciB0byBmaXJlXHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBpbml0RHJhZ1ZhbHVlcyh0aGF0LCBlLCBjZmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gRFJBRyBTVEFSVCBIT09LXHJcbiAgICAgICAgICAgIGlmKGNmZy5kcmFnU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIGNmZy5kcmFnU3RhcnQuYXBwbHkodGhhdCwgW2VdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAgICAgJCgnYm9keScpLmNzcygnY3Vyc29yJywgY2ZnLmN1cnNvcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGV2ZW50Lm9uKHRoYXQuZ2V0Um9vdE5vZGUoKSwgJ21vdXNlbW92ZScsIGRyYWdNb3ZlKTtcclxuICAgICAgICAgICAgZXZlbnQub24oZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLm9uY2UpIHtcclxuICAgICAgICAgICAgZHJhZ0VsZW1lbnQub24oJ21vdXNlZG93bicsIG1vdXNlRG93bkhhbmRsZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRyYWdFbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBtb3VzZURvd25IYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9TaW11bGF0ZXMgYW4gZHJhZyBzdGFydCBldmVudFxyXG4gICAgdGhpcy5pbml0RHJhZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50LnRyaWdnZXIoJ21vdXNlZG93bicpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL0ZvciBtYW51YWwgZHJhZ2dpbmcgYSBzdmcgZWxlbWVudCB0aGUgdHJpZ2dlckV2ZW50IGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBldmVudCB3YXMgdHJpZ2dlcmVkIG1hbnVhbGx5XHJcbiAgICAvL1NlZSBTZWxlY3Rpb25tYW5hZ2VyIHNldE5vZGVTZWxlY3Rpb24gZHJhZ01vdmUgaGFuZGxlclxyXG4gICAgdGhpcy50cmlnZ2VyRHJhZyA9IGZ1bmN0aW9uKGR4LCBkeSkge1xyXG4gICAgICAgIGRyYWdNb3ZlLmFwcGx5KHRoaXMsW3tkeDpkeCwgZHk6ZHksIHRyaWdnZXJFdmVudDp0cnVlfV0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbnZhciBpbml0RHJhZ1ZhbHVlcyA9IGZ1bmN0aW9uKHRoYXQsIGV2dCwgY2ZnKSB7XHJcbiAgICB0aGF0LmR4U3VtID0gMDtcclxuICAgIHRoYXQuZHlTdW0gPSAwO1xyXG4gICAgdGhhdC5zaGlmdERyYWcgPSBuZXcgU2hpZnREcmFnKGNmZyk7XHJcbiAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICB0aGF0LmRyYWdDdXJyZW50WCA9IGV2dERhdGEuY2xpZW50WDtcclxuICAgIHRoYXQuZHJhZ0N1cnJlbnRZID0gZXZ0RGF0YS5jbGllbnRZO1xyXG5cclxuICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbn07XHJcblxyXG52YXIgZ2V0TW91c2VFdmVudERhdGEgPSBmdW5jdGlvbihldnQpIHtcclxuICAgIGlmKCFldnQuY2xpZW50WCkge1xyXG4gICAgICAgIHJldHVybiBldmVudC5tb3VzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGV2dDtcclxufTsiLCJ2YXIgc2hhcGVzID0ge31cclxuc2hhcGVzLnN2ZyA9IHNoYXBlcy5TdmcgPSByZXF1aXJlKCcuL3N2Z1Jvb3QnKTtcclxuc2hhcGVzLmNpcmNsZSA9IHNoYXBlcy5DaXJjbGUgPSByZXF1aXJlKCcuL2NpcmNsZScpO1xyXG5zaGFwZXMuZWxsaXBzZSA9IHNoYXBlcy5FbGxpcHNlID0gcmVxdWlyZSgnLi9lbGxpcHNlJyk7XHJcbnNoYXBlcy50ZXh0ID0gc2hhcGVzLlRleHQgPSByZXF1aXJlKCcuL3RleHQnKTtcclxuc2hhcGVzLnRzcGFuID0gc2hhcGVzLlRTcGFuID0gcmVxdWlyZSgnLi90c3BhbicpO1xyXG5zaGFwZXMucGF0aCA9IHNoYXBlcy5QYXRoID0gcmVxdWlyZSgnLi9wYXRoJyk7XHJcbnNoYXBlcy5yZWN0ID0gc2hhcGVzLlJlY3QgPSByZXF1aXJlKCcuL3JlY3QnKTtcclxuc2hhcGVzLmcgPSBzaGFwZXMuR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gc2hhcGVzOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHRWxsaXBzZSA9IGZ1bmN0aW9uKHN2Z1Jvb3QsIGNmZykge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAnZWxsaXBzZScsIHN2Z1Jvb3QsIGNmZyk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR0VsbGlwc2UsIFNWR1NoYXBlKTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLnggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN4KCkgLSB0aGlzLnJ4KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yeShmYWxzZSwgdHJ1ZSkgKiAyO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAvL1doZW4gc2V0dGluZyB0aGUgaGVpZ2h0IG9mIGFuIGVsbGlwc2Ugd2UgbW92ZSB0aGUgY2VudGVyIHRvIG5vdCBjaGFuZ2UgdGhlIHgveVxyXG4gICAgdmFyIHYgPSB2YWx1ZSAvIDI7XHJcbiAgICB0aGlzLmN5KHYpLnJ5KHYpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnJ4KGZhbHNlLCB0cnVlKSAqIDI7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fc2V0V2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgLy9XaGVuIHNldHRpbmcgdGhlIGhlaWdodCBvZiBhbiBlbGxpcHNlIHdlIG1vdmUgdGhlIGNlbnRlciB0byBub3QgY2hhbmdlIHRoZSB4L3lcclxuICAgIHZhciB2ID0gdmFsdWUgLyAyO1xyXG4gICAgdGhpcy5jeCh2KS5yeCh2KTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLl9nZXRYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jeCgpIC0gdGhpcy5yeCgpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN5KCkgLSB0aGlzLnJ5KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRoaXMuY3goKSxcclxuICAgICAgICB5IDogdGhpcy5jeSgpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuYm90dG9tWSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY3koKSArIHRoaXMucnkoKTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLmN4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCF2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZWRYKHRoaXMuYXR0ck51bWJlcignY3gnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignY3gnLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5jeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGVkWSh0aGlzLmF0dHJOdW1iZXIoJ2N5JykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ2N5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnggPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVswXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J4JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeCcpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J4JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnkgPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVsxXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J5JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeScpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkVsbGlwc2UodGhpcy5nZXRDZW50ZXIoKSwgdGhpcy5yeCgpLCB0aGlzLnJ5KCkpLm92ZXJsYXlzKHBvc2l0aW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHRWxsaXBzZTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG5cclxudmFyIFNWR0dyb3VwID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdnJywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHR3JvdXAsIFNWR1NoYXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHR3JvdXA7IiwidmFyIEhlbHBlciA9IGZ1bmN0aW9uKHN2Zykge1xyXG4gICAgdGhpcy5zdmcgPSBzdmc7XHJcbiAgICB0aGlzLnBvaW50cyA9IHt9O1xyXG59O1xyXG5cclxuSGVscGVyLnByb3RvdHlwZS5wb2ludCA9IGZ1bmN0aW9uKGlkLCBwLCBjb2xvciwgcHJldlRleHQpIHtcclxuICAgIGNvbG9yID0gY29sb3IgfHwgJ3JlZCc7XHJcbiAgICB2YXIgdGV4dCA9IGlkKycoeDonK3AueCArICcgeTonK3AueSsnKSc7XHJcbiAgICBpZighdGhpcy5wb2ludHNbaWRdKSB7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5zdmcuY2lyY2xlKHtcclxuICAgICAgICAgICAgcjoyLFxyXG4gICAgICAgICAgICBzdHlsZTonZmlsbDonK2NvbG9yXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnN2Zy50ZXh0KHRleHQpLmZpbGwoY29sb3IpO1xyXG4gICAgICAgIHZhciBncm91cCA9IHRoaXMuc3ZnLmcoe2lkOidoZWxwZXJfJytpZH0sIHQsIHBvaW50KTtcclxuICAgICAgICB0aGlzLnBvaW50c1tpZF0gPSB7XHJcbiAgICAgICAgICAgIGdyb3VwIDogZ3JvdXAsXHJcbiAgICAgICAgICAgIHRleHQgOiB0LFxyXG4gICAgICAgICAgICBwb2ludCA6IHBvaW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihwcmV2VGV4dCkge1xyXG4gICAgICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wb2ludHNbaWRdLnBvaW50Lm1vdmVUbyhwKTtcclxuICAgIHRoaXMucG9pbnRzW2lkXS50ZXh0LiQoKS50ZXh0KHRleHQpO1xyXG4gICAgdGhpcy5wb2ludHNbaWRdLnRleHQubW92ZVRvKHApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIZWxwZXI7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnZhciBQYXRoRGF0YSA9IHJlcXVpcmUoJy4vcGF0aERhdGEnKTtcclxuXHJcbnZhciBTVkdQYXRoID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IHsgZCA6IFNWR1BhdGgucGF0aERhdGFBdHRyaWJ1dGVTZXR0ZXJ9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAncGF0aCcsIHN2Z1Jvb3QsIGNmZywgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdQYXRoLCBTVkdTaGFwZSk7XHJcblxyXG5TVkdQYXRoLnBhdGhEYXRhQXR0cmlidXRlU2V0dGVyID0gZnVuY3Rpb24ocGF0aERhdGFTdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgUGF0aERhdGEocGF0aERhdGFTdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHUGF0aC5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZCgpLmdldFgoKTtcclxufTtcclxuXHJcblNWR1BhdGgucHJvdG90eXBlLnkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmQoKS5nZXRZKCk7XHJcbn07XHJcblxyXG5TVkdQYXRoLnByb3RvdHlwZS5kID0gZnVuY3Rpb24ocGF0aERhdGEpIHtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhwYXRoRGF0YSkpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuZCA9IG5ldyBQYXRoRGF0YShwYXRoRGF0YSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ2QnKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNEZWZpbmVkKHBhdGhEYXRhKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gcGF0aERhdGFcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgnZCcpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy5kKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gbmV3IFBhdGhEYXRhKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1BhdGg7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi91dGlsL21hdGgnKS5WZWN0b3I7XHJcbnZhciBtYXRoID0gcmVxdWlyZSgnLi4vdXRpbC9tYXRoJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL3V0aWwvdXRpbFwiKTtcclxuXHJcbnZhciBBYnN0cmFjdFBhdGhEYXRhVHlwZSA9IGZ1bmN0aW9uKHR5cGUsIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLnZlY3RvciA9IG5ldyBWZWN0b3IoKTtcclxuICAgIHRoaXMudmVjdG9yLmFkZCh0eXBlKTtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldEFic29sdXRlID0gZnVuY3Rpb24oYWJzb2x1dGUpIHtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0VHlwZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHR5cGUgPSB0aGlzLnZhbHVlKDAsMCk7XHJcbiAgICByZXR1cm4gdGhpcy5hYnNvbHV0ZSA/IHR5cGUudG9VcHBlckNhc2UoKSA6IHR5cGUudG9Mb3dlckNhc2UoKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmVjdG9yLnZhbHVlKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnZlY3Rvci5zZXRWYWx1ZShwYXRoQXJyLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3Iuc2V0VmFsdWUocGF0aEFyciwgdmFsdWVzKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5pcyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKS50b1VwcGVyQ2FzZSgpID09PSB0eXBlLnRvVXBwZXJDYXNlKCk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUudG8gPSBmdW5jdGlvbihwYXRoQXJyLCB2YWx1ZXMpIHtcclxuICAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5wb2ludFRvU3RyaW5nID0gZnVuY3Rpb24ocCkge1xyXG4gICAgcmV0dXJuIHAueCArICcsJyArIHAueSsnICc7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0T3JTZXQgPSBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZShpbmRleCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZWN0b3IgPSBbWydsJ10sIHt4OngsIHk6eX1dXHJcbiAqL1xyXG52YXIgTGluZVRvID0gZnVuY3Rpb24ocCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ2wnLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhMaW5lVG8sIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG8gPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMudmFsdWUoMSkueCA9IHZhbHVlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZSgxKS54O1xyXG59O1xyXG5cclxuTGluZVRvLnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSgxKS55ID0gdmFsdWVcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnZhbHVlKDEpLnk7XHJcbn07XHJcblxyXG5MaW5lVG8ucHJvdG90eXBlLm1vdmVBbG9uZyA9IGZ1bmN0aW9uKGZyb20sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gbWF0aC5MaW5lLm1vdmVBbG9uZyhmcm9tLCB0aGlzLnRvKCksIGRpc3RhbmNlKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUuZ2V0TmVhcmVzdFBvaW50ID0gZnVuY3Rpb24oZnJvbSwgcG9zaXRpb24pIHtcclxuICAgIHJldHVybiBtYXRoLkxpbmUuZ2V0TmVhcmVzdFBvaW50KGZyb20sIHRoaXMudG8oKSwgcG9zaXRpb24pO1xyXG59O1xyXG5cclxudmFyIFFCZXppZXIgPSBmdW5jdGlvbihjb250cm9sUCwgdG9QLCBhYnNvbHV0ZSkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAncScsIGFic29sdXRlKTtcclxuICAgIHRoaXMuY29udHJvbChjb250cm9sUCk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFFCZXppZXIsIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcblFCZXppZXIucHJvdG90eXBlLnRvID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDEscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHlwZSgpK3RoaXMucG9pbnRUb1N0cmluZyh0aGlzLmNvbnRyb2woKSkrdGhpcy5wb2ludFRvU3RyaW5nKHRoaXMudG8oKSk7XHJcbn07XHJcblxyXG52YXIgQ0JlemllciA9IGZ1bmN0aW9uKGNvbnRyb2xQMSwgY29udHJvbFAyLCB0b1AsIGFic29sdXRlKSB7XHJcbiAgICBBYnN0cmFjdFBhdGhEYXRhVHlwZS5jYWxsKHRoaXMsICdjJywgYWJzb2x1dGUpO1xyXG4gICAgdGhpcy5jb250cm9sMShjb250cm9sUDEpO1xyXG4gICAgdGhpcy5jb250cm9sMihjb250cm9sUDIpO1xyXG4gICAgdGhpcy50byh0b1ApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDQmV6aWVyLCBBYnN0cmFjdFBhdGhEYXRhVHlwZSk7XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sMSh4LHkpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuY29udHJvbDEgPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkNCZXppZXIucHJvdG90eXBlLmNvbnRyb2wyID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgdmFyIHAgPSBtYXRoLmdldFBvaW50KHgseSk7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRPclNldCgzLHApO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMSgpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMigpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIHRoZSBuZWFyZXN0IHBvaW50IG9mIHRoZSBiZXppZXIgY3VydmUgdG8gdGhlIGdpdmVuIHBvc2l0aW9uLiBzaW5jZSB0aGUgQ0JlemllciBkb2VzIG5vdCBrbm93IGl0cyBzdGFydFxyXG4gKiBwb2ludCwgd2UgaGF2ZSB0byBwcm92aWRlIHRoZSBmcm9tIHBvc2l0aW9uIGFzIHdlbGwgYXMgdGhlIHNlYXJjaCBiYXNlIHBvc2l0aW9uLlxyXG4gKiBAcGFyYW0gZnJvbVxyXG4gKiBAcGFyYW0gcG9zaXRpb25cclxuICogQHJldHVybnMge3twb2ludCwgbG9jYXRpb259fCp9XHJcbiAqL1xyXG5DQmV6aWVyLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihmcm9tLCBwb3NpdGlvbikge1xyXG4gICAgcmV0dXJuIG1hdGguYmV6aWVyLm5lYXJlc3RQb2ludE9uQ3VydmUocG9zaXRpb24sIHRoaXMuZ2V0Q3VydmUoZnJvbSkpLnBvaW50O1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oZnJvbSwgZGlzdGFuY2UpIHtcclxuICAgIHJldHVybiBtYXRoLmJlemllci5tb3ZlQWxvbmcodGhpcy5nZXRDdXJ2ZShmcm9tKSwgZGlzdGFuY2UpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuZ2V0Q3VydmUgPSBmdW5jdGlvbihmcm9tKSB7XHJcbiAgICByZXR1cm4gW2Zyb20sIHRoaXMuY29udHJvbDEoKSwgdGhpcy5jb250cm9sMigpLCB0aGlzLnRvKCldO1xyXG59O1xyXG5cclxudmFyIE1vdmVUbyA9IGZ1bmN0aW9uKHRvUCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ20nLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKE1vdmVUbywgTGluZVRvKTtcclxuXHJcbnZhciBDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAneicpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDb21wbGV0ZSwgQWJzdHJhY3RQYXRoRGF0YVR5cGUpO1xyXG5cclxuQ29tcGxldGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUeXBlKCk7XHJcbn07XHJcblxyXG52YXIgcGF0aFR5cGUgPSB7XHJcbiAgICB6IDogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgQ29tcGxldGUoKSB9LFxyXG4gICAgbSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IE1vdmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgbCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IExpbmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgcSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IFFCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pOyB9LFxyXG4gICAgYyA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IENCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sICBhcmd1bWVudHNbMl0pOyB9XHJcbn07XHJcblxyXG52YXIgUGF0aERhdGEgPSBmdW5jdGlvbihkZWYpIHtcclxuICAgIHRoaXMuZGF0YSA9IG5ldyBWZWN0b3IoKTtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhkZWYpKSB7XHJcbiAgICAgICAgdGhpcy5sb2FkRnJvbVN0cmluZyhkZWYpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxvYWRGcm9tU3RyaW5nID0gZnVuY3Rpb24oc3RyVmFsKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvLydNMTAwLDEwMCBRMjAwLDIwMCAzMDAsMzAwJyAtLT4gWydNMTAwLDEwMCAnLCAnUTIwMCwyMDAgMzAwLDMwMCddXHJcbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBzdHJWYWwuc3BsaXQoLyg/PVtNbUxsSGhWdkNjU3NRcVR0QWFael0rKS8pO1xyXG4gICAgLy9FYWNoIGRUeXBlXHJcbiAgICAkLmVhY2goZGVmaW5pdGlvbnMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciB0eXBlID0gdmFsdWUuY2hhckF0KDApO1xyXG4gICAgICAgIC8vJ1EyMDAsMjAwIDMwMCwzMDAgLT4gWycyMDAsMjAwJywgJzMwMCwzMDAnXVxyXG4gICAgICAgIHZhciB2YWx1ZXMgPSB2YWx1ZS5zdWJzdHJpbmcoMSx2YWx1ZS5sZW5ndGgpLnRyaW0oKS5zcGxpdCgnICcpO1xyXG4gICAgICAgIC8vWycyMDAsMjAwJywgJzMwMCwzMDAnXSAtPiBbe3g6MjAwLCB5OjIwMH0sIHt4OjMwMCwgeTozMDB9XVxyXG4gICAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgICAkLmVhY2godmFsdWVzLCBmdW5jdGlvbihpLCBjb29yZCkge1xyXG4gICAgICAgICAgICB2YXIgY29vcmRWYWxzID0gY29vcmQuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgcG9pbnRzLnB1c2gobWF0aC5nZXRQb2ludChwYXJzZUZsb2F0KGNvb3JkVmFsc1swXSksIHBhcnNlRmxvYXQoY29vcmRWYWxzWzFdKSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQuZGF0YS5hZGQocGF0aFR5cGVbdHlwZS50b0xvd2VyQ2FzZSgpXS5hcHBseSh1bmRlZmluZWQsIHBvaW50cykuc2V0QWJzb2x1dGUoKHR5cGUgPT0gdHlwZS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDb3JuZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgeE1pbiwgeE1heCwgeU1pbiwgeU1heDtcclxuICAgIHhNaW4gPSB5TWluID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgeE1heCA9IHlNYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcblxyXG4gICAgdGhpcy5kYXRhLmVhY2goZnVuY3Rpb24oaW5kZXgsIHBhdGhQYXJ0KSB7XHJcbiAgICAgICAgaWYocGF0aFBhcnQueCAmJiBwYXRoUGFydC55KSB7XHJcbiAgICAgICAgICAgIHhNaW4gPSAoeE1pbiA+IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWluO1xyXG4gICAgICAgICAgICB5TWluID0gKHlNaW4gPiBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1pbjtcclxuXHJcbiAgICAgICAgICAgIHhNYXggPSAoeE1heCA8IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWF4O1xyXG4gICAgICAgICAgICB5TWF4ID0gKHlNYXggPCBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1heDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1pbn0sXHJcbiAgICAgICAge3g6eE1heCwgeTp5TWlufSxcclxuICAgICAgICB7eDp4TWF4LCB5OnlNYXh9LFxyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1heH1cclxuICAgIF07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLnk7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUucG9seW5vbXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBpZih2YWx1ZS50bykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZS50bygpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuc1xyXG4gKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0UGF0aFBhcnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgLy9XZSBzdGFydCBhdCBpbmRleCAxIGJlY2F1c2UgdGhlIDAgaW5kZXggb2YgdGhlIHZlY3RvciBjb250YWlucyB0aGUgcGF0aHBhcnQgdHlwZVxyXG4gICAgZm9yKHZhciBpID0gMTsgaSA8PSB0aGlzLmxlbmd0aCgpIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5nZXRQYXRoUGFydChpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoUGFydCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICB2YXIgcGF0aFBhcnQgPSB0aGlzLnZhbHVlKGluZGV4KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnQ6IHRoaXMudmFsdWUoaW5kZXggLSAxKS50bygpLFxyXG4gICAgICAgIGVuZDogcGF0aFBhcnQudG8oKSxcclxuICAgICAgICB2YWx1ZTogcGF0aFBhcnRcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oaW5kZXgsIGRpc3RhbmNlLCBkaXJlY3Rpb24pIHtcclxuICAgIHZhciBwYXRoUGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGF0aFBhcnQudmFsdWUubW92ZUFsb25nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGhQYXJ0LnZhbHVlLm1vdmVBbG9uZyhwYXRoUGFydC5zdGFydCwgZGlzdGFuY2UsIGRpcmVjdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBtYXRoLkxpbmUubW92ZUFsb25nKHBhdGhQYXJ0LnN0YXJ0LCBwYXRoUGFydC5lbmQsIGRpc3RhbmNlLCBkaXJlY3Rpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHJvdWdoIGNlbnRlciBvZiB0aGUgcGF0aCBieSBjYWxjdWxhdGluZyB0aGUgdG90YWwgbGVuZ3RoIG9mIHRoZSBwYXRocGFydHMgKGFzIGRpcmVjdCBsaW5lcykgYW5kIG1vdmluZ1xyXG4gKiBhbG9uZyB0aG9zZSBsaW5lcyB0byB0aGUgY2VudGVyICh0b3RhbCBsZW5ndGggLyAyKS4gTm90ZSB3aXRoIHRoaXMgbWV0aG9kIHdlIGp1c3QgZ2V0IGEgZXhhY3QgcmVzdWx0IGZvciBzaW1wbGVcclxuICogbGluZSBwYXRocy4gSWYgdGhlIGNhbGN1bGF0ZWQgY2VudGVyIHBvc2l0aW9uIGlzIHdpdGhpbiBhIGN1YmljIGJlemllciBwYXRoIHBhcnQsIHdlIHJldHVybiB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICogdG8gdGhlIGNhbGN1bGF0ZWQgY2VudGVyLlxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHREID0gdGhpcy5nZXREaXN0YW5jZSgpIC8gMjtcclxuICAgIHZhciBjdXJyZW50RCA9IDA7XHJcbiAgICB2YXIgY2VudGVyO1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy5nZXRQYXRoUGFydHMoKSwgZnVuY3Rpb24oaW5kZXgsIHBhcnQpIHtcclxuICAgICAgICB2YXIgbGluZUQgPSBtYXRoLkxpbmUuY2FsY0Rpc3RhbmNlKHBhcnQuc3RhcnQsIHBhcnQuZW5kKTtcclxuICAgICAgICB2YXIgbmV4dEQgPSBjdXJyZW50RCArIGxpbmVEO1xyXG4gICAgICAgIGlmKG5leHREID4gcmVzdWx0RCkge1xyXG4gICAgICAgICAgICB2YXIgZGlmZkQgPSAgcmVzdWx0RCAtIGN1cnJlbnREO1xyXG4gICAgICAgICAgICBjZW50ZXIgPSBtYXRoLkxpbmUubW92ZUFsb25nKHBhcnQuc3RhcnQsIHBhcnQuZW5kLCBkaWZmRCk7XHJcblxyXG4gICAgICAgICAgICAvL0lmIHdlIGhhdmUgYSBjdWJpYyBiZXppZXIgcGF0aCBwYXJ0IHdlIGNhbGN1bGF0ZSB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICAgICAgICAgICAgaWYocGFydC52YWx1ZS5pcygnYycpKSB7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXIgPSBwYXJ0LnZhbHVlLmdldE5lYXJlc3RQb2ludChwYXJ0LnN0YXJ0LCBjZW50ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VycmVudEQgPSBuZXh0RDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNlbnRlcjtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXREaXN0YW5jZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGRpc3RhbmNlID0gMDtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgZGlzdGFuY2UgKz0gbWF0aC5MaW5lLmNhbGNEaXN0YW5jZShwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBkaXN0YW5jZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBc3N1bWluZyB0aGVyZSBhcmUgb25seSEgY3ViaWMgYmV6aWVyIGN1cnZlZCBwYXRoIHBhcnRzIHRoaXMgZnVuY3Rpb24gcmVjYWxjdWxhdGVzIGFsbCBjb250cm9sIHBvaW50cyBvZiB0aGUgY3VydmVzXHJcbiAqIHRvIHNtb290aGVuIHRoZSBlbnRpcmUgcGF0aC5cclxuICpcclxuICogQHBhcmFtIHBvbHlub21zXHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuc21vb3RoZW4gPSBmdW5jdGlvbihwb2x5bm9tcykge1xyXG4gICAgaWYoIXBvbHlub21zKSB7XHJcbiAgICAgICAgcG9seW5vbXMgPSB0aGlzLnBvbHlub21zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHggPSBbXTtcclxuICAgIHZhciB5ID0gW107XHJcblxyXG4gICAgb2JqZWN0LmVhY2gocG9seW5vbXMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHhbaW5kZXhdID0gdmFsdWUueDtcclxuICAgICAgICB5W2luZGV4XSA9IHZhbHVlLnk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcHggPSBtYXRoLmJlemllci5jYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzKHgpO1xyXG4gICAgdmFyIHB5ID0gbWF0aC5iZXppZXIuY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyh5KTtcclxuXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBvYmplY3QuZWFjaChweC5wMSwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhhdC52YWx1ZShpbmRleCArIDEpLmNvbnRyb2wxKHB4LnAxW2luZGV4XSwgcHkucDFbaW5kZXhdKTtcclxuICAgICAgICB0aGF0LnZhbHVlKGluZGV4ICsgMSkuY29udHJvbDIocHgucDJbaW5kZXhdLCBweS5wMltpbmRleF0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRMaW5lQnlQYXRoSW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdmFyIHAxID0gdGhpcy52YWx1ZShpbmRleCAtIDEpLnRvKCk7XHJcbiAgICB2YXIgcDIgPSB0aGlzLnZhbHVlKGluZGV4KS50bygpO1xyXG4gICAgcmV0dXJuIG5ldyBtYXRoLkxpbmUocDEsIHAyKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihwb2ludCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbihwb2ludCk7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQpIHtcclxuICAgICAgICByZXR1cm4gcGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQocGFydC5zdGFydCwgcG9pbnQpO1xyXG4gICAgfTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvaW50KSB7XHJcblxyXG4gICAgaWYodGhpcy5sZW5ndGgoKSA9PT0gMikge1xyXG4gICAgICAgIC8vSWYgdGhlcmUgaXMganVzdCB0aGUgc3RhcnQgYW5kIGVuZCBkb2NraW5nIHdlIGtub3cgdGhlIG5ldyBpbmRleFxyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkb2NraW5nSW5kZXggPSAxO1xyXG4gICAgdmFyIGNhbmRpZGF0ZSA9IFsxLE51bWJlci5QT1NJVElWRV9JTkZJTklUWSBdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgLy9Tb3J0IG91dCBwYXRocGFydHMgd2hpY2ggYXJlIG5vdCB3aXRoaW4gdGhlIGJvdW5kYXJ5IG9mIHN0YXJ0L2VuZCBwb2ludHMgd2l0aCBhIGxpdHRsZSB0b2xlcmFuY2Ugb2YgMTBweFxyXG4gICAgICAgIHZhciBwID0gbmV3IHV0aWwubWF0aC5Qb2ludChwb2ludCk7XHJcbiAgICAgICAgaWYocC5pc1dpdGhpblhJbnRlcnZhbChwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCwgMTApKSB7XHJcbiAgICAgICAgICAgIHZhciBkO1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IG5ldyBtYXRoLkxpbmUocGFydC5zdGFydCwgcGFydC5lbmQpO1xyXG5cclxuICAgICAgICAgICAgaWYoIWxpbmUuaXNWZXJ0aWNhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICBkID0gTWF0aC5hYnMobGluZS5jYWxjRlgocG9pbnQueCkueSAtIHBvaW50LnkpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihwLmlzV2l0aGluWUludGVydmFsKHBhcnQuc3RhcnQsIHBhcnQuZW5kKSkge1xyXG4gICAgICAgICAgICAgICAgLy9TaW5jZSB0aGUgcG9pbnQgaXMgd2l0aGluIHggKHdpdGggdG9sZXJhbmNlKSBhbmQgeSBpbnRlcnZhbCB3ZSBjYWxjdWxhdGUgdGhlIHggZGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLmFicyhwYXJ0LnN0YXJ0LnggLSBwLngpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FuZGlkYXRlID09PSB1bmRlZmluZWQgfHwgY2FuZGlkYXRlWzFdID4gZCkge1xyXG4gICAgICAgICAgICAgICAgLy9UaGUgcGF0aFBhcnRpbmRleCBpcyB0aGUgYXJyYXlpbmRleCArIDEgc2luY2Ugd2UgdXNlIHRoZSBlbmQgaW5kZXggb2YgdGhlIHBhdGggYXMgaWRlbnRpdHlcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVswXSA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVsxXSA9IGQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY2FuZGlkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZVswXTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldEdyYWRpZW4gPSBmdW5jdGlvbih4LHkpIHtcclxuIHZhciBwb3NpdGlvbiA9IHV0aWwubWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gdmFyIGluZGV4ID0gdGhpcy50cmFuc2l0aW9uLmdldEtub2JJbmRleEZvclBvaW50KHBvc2l0aW9uKTtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuIExpbmVQYXRoTWFuYWdlci5wcm90b3R5cGUuZ2V0R3JhZGllbnRCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldFZlY3RvckJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCwgZnJvbUVuZCkge1xyXG4gdmFyIHAxLCBwMjtcclxuIGlmKGZyb21FbmQpIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4ICsgMSkucG9zaXRpb24oKTtcclxuIHAyID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gfSBlbHNlIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gcDIgPSB0aGlzLmRhdGEuZ2V0RG9ja2luZ0J5SW5kZXgoaW5kZXggKyAxKS5wb3NpdGlvbigpO1xyXG4gfVxyXG4gcmV0dXJuIHV0aWwubWF0aC5MaW5lLmNhbGNOb3JtYWxpemVkTGluZVZlY3RvcihwMSwgcDIpO1xyXG4gfTtcclxuICovXHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMF0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRSaWdodFggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzFdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0Qm90dG9tWSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMl0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmRhdGEuY2xlYXIoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGgoKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlKGluZGV4KTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5sYXN0SW5kZXhPZlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICB2YXIgaTtcclxuICAgIGZvcihpID0gdGhpcy5sZW5ndGgoKSAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZShpKTtcclxuICAgICAgICBpZih2YWx1ZS5pcyh0eXBlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gLTE7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUudmFsdWVzQnlUeXBlID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpLCB2YWx1ZSkge1xyXG4gICAgICAgaWYodmFsdWUuaXModHlwZSkpIHtcclxuICAgICAgICAgICByZXN1bHQucHVzaCh7aW5kZXg6aSwgdmFsdWU6dmFsdWV9KTtcclxuICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihwLCBhYnNvbHV0ZSkge1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlKDApLnRvKCk7XHJcbiAgICB9IGVsc2UgaWYodGhpcy5sZW5ndGgoKSA+IDApIHtcclxuICAgICAgICB0aGlzLnZhbHVlKDApLnRvKHApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuc2V0VmFsdWUoMCwgbmV3IE1vdmVUbyhwLCBhYnNvbHV0ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sYXN0KCkudG8odmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmxhc3QoKS50bygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IHJlZmFjdG9yIHRvIHNldFRvXHJcbiAqIEBwYXJhbSBpbmRleFxyXG4gKiBAcGFyYW0gdmFsdWVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLnNldFRvID0gZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmRhdGEudmFsdWUoaW5kZXgpLnRvKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnJlbW92ZVBhdGggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZShpbmRleCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ29tcGxldGUoKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5saW5lID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHRoaXMuZGF0YS5hZGQobmV3IExpbmVUbyhwLCB0cnVlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jQmV6aWVyID0gZnVuY3Rpb24oYzEsIGMyLCB0bykge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ0JlemllcihjMSxjMiwgdG8sIHRydWUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IExpbmUgdG9cclxuICogQHBhcmFtIGluZGV4XHJcbiAqIEBwYXJhbSB2YWx1ZVxyXG4gKiBAcGFyYW0gYWJzb2x1dGVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLmluc2VydExpbmUgPSBmdW5jdGlvbihpbmRleCwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgTGluZVRvKHRvLGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5xQmV6aWVyID0gZnVuY3Rpb24oY29udHJvbFAsdG9QKSB7XHJcbiAgICB0aGlzLmRhdGEuYWRkKG5ldyBRQmV6aWVyKGNvbnRyb2xQLHRvUCwgdHJ1ZSkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuaW5zZXJ0UUJlemllciA9IGZ1bmN0aW9uKGluZGV4LGMsIHRvLCBhYnNvbHV0ZSkge1xyXG4gICAgdGhpcy5kYXRhLmluc2VydChpbmRleCwgbmV3IFFCZXppZXIoYywgdG8sIGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5pbnNlcnRDQmV6aWVyID0gZnVuY3Rpb24oaW5kZXgsIGMxLCBjMiwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgQ0JlemllcihjMSxjMiwgdG8sYWJzb2x1dGUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gJyc7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmRhdGEuZWFjaChmdW5jdGlvbihpbmRleCwgcGF0aFBhcnQpIHtcclxuICAgICAgIHJlc3VsdCArPSBwYXRoUGFydC50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0LnRyaW0oKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aERhdGE7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBTVkdTaGFwZSA9IHJlcXVpcmUoJy4vc3ZnU2hhcGUnKTtcclxuXHJcbnZhciBTVkdSZWN0ID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdyZWN0Jywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHUmVjdCwgU1ZHU2hhcGUpO1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3knKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3gnKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdoZWlnaHQnKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9zZXRIZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdGhpcy5hdHRyKCdoZWlnaHQnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9nZXRXaWR0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCd3aWR0aCcpO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHRoaXMuYXR0cignd2lkdGgnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLm92ZXJsYXlDaGVjayA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICByZXR1cm4gcG9zaXRpb24ueCA+PSB0aGlzLngoKSAmJiBwb3NpdGlvbi54IDw9IHRoaXMuZ2V0UmlnaHRYKClcclxuICAgICAgICAmJiBwb3NpdGlvbi55ID49IHRoaXMueSgpICYmIHBvc2l0aW9uLnkgPD0gdGhpcy5nZXRCb3R0b21ZKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1JlY3Q7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBzdHJpbmcgPSByZXF1aXJlKCcuLi91dGlsL3N0cmluZycpO1xyXG5cclxudmFyIFJFR0VYUF9QUk9QRVJUWV9TVUZGSVggPSAnOlthLXpBLVowLTkjLFxcLl0qKDt8JCknO1xyXG5cclxudmFyIFN0eWxlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgIW9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IGtleTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXQoa2V5LHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBpZihvYmplY3QuaXNPYmplY3Qoa2V5KSkge1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGtleSwgZnVuY3Rpb24ob2JqS2V5LCB2YWwpIHtcclxuICAgICAgICAgICAgaWYoa2V5Lmhhc093blByb3BlcnR5KG9iaktleSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KG9iaktleSx2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh0aGlzLnZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmFsdWUuaW5kZXhPZihrZXkrJzonKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKGtleStSRUdFWFBfUFJPUEVSVFlfU1VGRklYLCAnZ2knKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUucmVwbGFjZShyZWdFeHAsIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSArPSAoIXN0cmluZy5lbmRzV2l0aCh0aGlzLnZhbHVlLCc7JykgJiYgdGhpcy52YWx1ZS5sZW5ndGggPiAwKSA/ICc7JyArIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSA6IHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0ga2V5O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU3R5bGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdmFyIHJlZ0V4cCA9IG5ldyBSZWdFeHAoa2V5K1JFR0VYUF9QUk9QRVJUWV9TVUZGSVgsICdnaScpO1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMudmFsdWUubWF0Y2gocmVnRXhwKTtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHJlc3VsdCkpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHRbMF07XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gdmFsdWUuc3BsaXQoJzonKTtcclxuICAgICAgICBpZihzcGxpdHRlZC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzcGxpdHRlZFsxXTtcclxuICAgICAgICAgICAgcmV0dXJuIChzdHJpbmcuZW5kc1dpdGgocmVzdWx0LCAnOycpKT8gcmVzdWx0LnN1YnN0cmluZygwLHJlc3VsdC5sZW5ndGggLTEpIDogcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5jcmVhdGVWYWx1ZVN0cmluZyA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHJldHVybiBrZXkrJzonK3ZhbHVlKyc7JztcclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlO1xyXG4iLCIvKipcclxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgZnVuY3Rpb25hbGl0eSBmb3IgY3JlYXRpbmcgYW5kIGFjY2Vzc2luZyBTVkcgZWxlbWVudHMuXHJcbiAqIEFsbCBTVkcgZWxlbWVudHMgY3JlYXRlZCB3aXRoIHRoaXMgbW9kdWxlIGNhbiBiZSBhY2Nlc3NlZCBieSBJRCB0aHJvdWdoIHRoZSBpbnN0YW5jZSBvYmplY3QuXHJcbiAqXHJcbiAqIEFuIFNWRyBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGlzIG1vZHVsZSBjYW4gYmUgc2VwZXJhdGVkIGludG8gbXVsdGlwbGUgcGFydHMgd2hpY2ggY2FuIGJlIG1hbmFnZWQgc3BlcmF0bHkuXHJcbiAqIFRoZSAncm9vdCcgcGFydCB3aWxsIGJlIGNyZWF0ZWQgYnkgZGVmYXVsdC4gV2hlbiBjcmVhdGluZyBhIG5ldyBzdmcgcGFydCB5b3UgY2FuIHNldCBpdCBhcyBkZWZhdWx0IHBhcnQsIHNvIGFsbCBhY3Rpb25zXHJcbiAqIGxpa2UgaW5zZXJ0aW9ucyB3aWxsIGJlIGV4ZWN1dGVkIG9uIHRoZSBkZWZhdWx0IHBhcnQgaWYgdGhlcmUgaXMgbm8gb3RoZXIgcGFydCBhcyBhcmd1bWVudC5cclxuICovXHJcbnZhciBTVkdHZW5lcmljU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnJlcXVpcmUoJy4vZHJhZ2dhYmxlJyk7XHJcbnZhciBzaGFwZXMgPSByZXF1aXJlKCcuL2VsZW1lbnRzJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyk7XHJcblxyXG52YXIgZG9tID0gdXRpbC5kb207XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxudmFyIEhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyJyk7XHJcblxyXG52YXIgTkFNRVNQQUNFX1NWRyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcbnZhciBOQU1FU1BBQ0VfWExJTksgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XHJcblxyXG52YXIgaW5zdGFuY2VzID0ge307XHJcblxyXG4vKipcclxuICogVGhlIGNvbnN0cnVjdG9yIGluaXRpYWxpemVzIGEgbmV3IFNWRyBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gY29udGFpbmVySWQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBhY2NlcHRzIHRoZSBjb250YWluZXJJZCBlaXRoZXIgYXMgc2VsZWN0b3IgJyNjb250YWluZXJJZCcgb3IgYXMgaWQgc3RyaW5nICdjb250YWluZXJJZCcuXHJcbiAqXHJcbiAqIFRoZSBpZCBvZiB0aGUgbncgU1ZHIGVsZW1lbnQgd2lsbCBiZSB0aGUgY29udGFpbmVySWQgd2l0aCB0aGUgc3VmZml4ICdfc3ZnJyAtPiAnY29udGFpbmVySWRfc3ZnJy5cclxuICpcclxuICogQXR0cmlidXRlcyBvZiB0aGUgbmV3IFNWRyBlbGVtbnQgY2FuIGJlIHNldCB0aHJvdWdoIHRoZSBjb25zdHJ1Y3RvciBhcmd1bWVudCAnY2ZnJy5cclxuICpcclxuICogVGhlIFNWRyBjYW4gYmUgc2VwZXJhdGVkIGluIG11bHRpcGxlIHBhcnRzIHNvIHlvdSBjYW4gZWFzaWx5IGFwcGVuZCBlbGVtZW50cyB0byB0aGUgZGlmZmVyZW50IHBhcnQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgJ3Jvb3QnIHBhcnQgYXMgZGVmYXVsdC5cclxuICpcclxuICogQHBhcmFtIGNvbnRhaW5lcklkXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgU1ZHID0gZnVuY3Rpb24oY29udGFpbmVySWQsIGNmZykge1xyXG4gICAgaWYoISh0aGlzIGluc3RhbmNlb2YgU1ZHKSkge1xyXG4gICAgICAgIHJldHVybiBTVkcuZ2V0KGNvbnRhaW5lcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcblxyXG4gICAgLy9HZXQgaWQgZnJvbSBzZWxlY3RvciBpZiBpdHMgYW4gc2VsZWN0b3JcclxuICAgIHRoaXMuY29udGFpbmVySWQgPSBkb20uZ2V0UmF3SWQoY29udGFpbmVySWQpO1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJC5xQ2FjaGUoJyMnK3RoaXMuY29udGFpbmVySWQpLmdldCgwKTtcclxuXHJcbiAgICBpZighdGhpcy4kY29udGFpbmVyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQXR0ZW1wdCB0byBpbml0aWF0ZSBzdmcgc3RhZ2UgZm9yIGludmFsaWQgY29udGFpbmVySWQ6ICcrdGhpcy5jb250YWluZXJJZCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ZnSWQgPSB0aGlzLmNvbnRhaW5lcklkKydfc3ZnJztcclxuXHJcbiAgICAvLyBDcmVhdGUgU1ZHIHJvb3QgZWxlbWVudCB3aXRoIGdpdmVuIHNldHRpbmdzLlxyXG4gICAgdGhpcy5yb290ID0gbmV3IHNoYXBlcy5TdmcodGhpcywge2lkIDogdGhpcy5zdmdJZH0pO1xyXG5cclxuICAgIGNmZy5oZWlnaHQgPSBjZmcuaGVpZ2h0IHx8ICcxMDAlJztcclxuICAgIGNmZy53aWR0aCA9IGNmZy53aWR0aCAgfHwgJzEwMCUnO1xyXG5cclxuICAgIC8vIFNldCBjZmcgdmFsdWVzIGFzIHN2ZyByb290IGF0dHJpYnV0ZXNcclxuICAgIHRoaXMucm9vdC5hdHRyKGNmZyk7XHJcblxyXG4gICAgLy8gQXBwZW5kIHRoZSBzdmcgcm9vdCBlbGVtZW50IHRvIHRoZSBjb250YWluZXJub2RlXHJcbiAgICBkb20uYXBwZW5kU1ZHRWxlbWVudCh0aGlzLiRjb250YWluZXIsIHRoaXMucm9vdCk7XHJcblxyXG4gICAgLy8gVGhlIHJvb3QgcGFydCBpcyB0aGUgc3ZnIGVsZW1lbnQgaXRzZWxmXHJcbiAgICB0aGlzLnN2Z1BhcnRzID0geydyb290Jzp0aGlzLnJvb3R9O1xyXG4gICAgdGhpcy5kZWZhdWx0UGFydCA9IHRoaXMucm9vdDtcclxuXHJcbiAgICBpbnN0YW5jZXNbdGhpcy5zdmdJZF0gPSB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHN2ZyByb290IGRvbU5vZGUuXHJcbiAqIEByZXR1cm5zIHsqfSBzdmcgcm9vdCBkb21Ob2RlXHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKHRoaXMucm9vdCkgPyB0aGlzLnJvb3QuaW5zdGFuY2UoKSA6IHVuZGVmaW5lZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgY2FjaGVkIGpRdWVyeSBvYmplY3Qgb2YgdGhlIHJvb3Qgbm9kZS5cclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLiQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLnFDYWNoZSgnIycrdGhpcy5zdmdJZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB1c2VkIGZvciBpbXBvcnRpbmcgZGlhZ3JhbXMgaW50byB0aGUgc3ZnIGluc3RhbmNlLlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5zZXRSb290ID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdmFyIG5ld0lkID0gZG9tLmdldEF0dHJpYnV0ZXMoZWxlbWVudClbJ2lkJ107XHJcbiAgICB0aGlzLnJvb3QuaW5zdGFuY2UoZWxlbWVudCk7XHJcbiAgICB0aGlzLnJvb3QuYXR0cih7aWQgOiBuZXdJZH0pO1xyXG4gICAgaW5zdGFuY2VzW25ld0lkXSA9IHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgcm9vdCBlbGVtZW50IGFzIFNWR0VsZW1lbnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5nZXRSb290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgZGVmYXVsdFBhcnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfSBjdXJyZW50IGRlZmF1bHRQYXJ0XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldERlZmF1bHRQYXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0UGFydDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgbmV3IHN2ZyBwYXJ0IHdoaWNoIGlzIHJlcHJlc2VudGVkIGJ5IGEgbmV3IGdyb3VwIHdpdGhpbiB0aGUgcm9vdC5cclxuICogVGhlIHBhcnQgaWQgaXMgY29tcG9zaXRlIG9mIHRoZSBzdmcgcm9vdCBpZCBhbmQgdGhlIHBhcnRJZC5cclxuICogQnkgc2V0dGluZyB0aGUgaXNEZWZhdWx0IGFyZ3VtZW50IGFzIHRydWUgdGhlIG5ldyBwYXJ0IHdpbGwgYmUgc2V0IGFzIGRlZmF1bHQgcGFydC5cclxuICogQHBhcmFtIHBhcnRJZFxyXG4gKiBAcGFyYW0gaXNEZWZhdWx0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5jcmVhdGVQYXJ0ID0gZnVuY3Rpb24ocGFydElkLCBpc0RlZmF1bHQpIHtcclxuICAgIC8vTmV3IHBhcnRzIGFyZSBhbHdheXMgYWRkZWQgdG8gdGhlIHJvb3QgcGFydFxyXG4gICAgdGhpcy5zdmdQYXJ0c1twYXJ0SWRdID0gdGhpcy5nKHtpZDogdGhpcy5zdmdJZCsnXycrcGFydElkLCBwYXJlbnRQYXJ0OiAncm9vdCd9KTtcclxuICAgIGlmKGlzRGVmYXVsdCkge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRJZF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5zdmdQYXJ0c1twYXJ0SWRdO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5wYXJ0ID0gZnVuY3Rpb24oaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnN2Z1BhcnRzW2lkXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIHN2ZyBlbGVtZW50IHRvIHRoZSBnaXZlbiBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5hZGRUb1BhcnQgPSBmdW5jdGlvbihwYXJ0LCBlbGVtZW50KSB7XHJcbiAgICB0aGlzLmFkZFRvR3JvdXAodGhpcy5zdmdQYXJ0c1twYXJ0XSwgZWxlbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZCB0byBhcHBlbmQgb3IgcHJlcGVuZCBlbGVtZW50cyB3aXRoIHRleHQgdG8gdGhlIHN2ZyByb290LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Sb290ID0gZnVuY3Rpb24oZWxlbWVudCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gYXBwZW5kL3ByZXBlbmQgZWxlbWVudHMgd2l0aCB0ZXh0IHRvIGEgZ2l2ZW4gKG9yIGRlZmF1bHQpIHN2ZyBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZWxlbWVudCwgcGFydCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgcGFydCA9IHBhcnQgfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgZWxlbWVudC5wYXJlbnQgPSBwYXJ0O1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQocGFydCwgZWxlbWVudCwgdGV4dCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBkb20uYXBwZW5kU1ZHRWxlbWVudChwYXJ0LCBlbGVtZW50LCB0ZXh0KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBvcnRzIGFuIHhtbCBkb2N1bWVudCB0byB0aGUgZ2l2ZW4gc3ZnIHBhcnQuXHJcbiAqIEBwYXJhbSBlbGVtZW50WE1MXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihzdmdTdHIsIHBhcnQsIHByZXBlbmQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiBTVkcuZ2V0KGRvbS5pbXBvcnRTVkcocGFydCwgc3ZnU3RyLCBwcmVwZW5kKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFJlY3Qgd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5SZWN0KHRoaXMsIGNmZyksIHBhcnQpO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5oZWxwZXIgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIGlmKCF0aGlzLl9oZWxwZXIpIHtcclxuICAgICAgICB0aGlzLl9oZWxwZXIgPSBuZXcgSGVscGVyKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2hlbHBlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgVGV4dCB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLnRleHQgPSBmdW5jdGlvbih0ZXh0LCBjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLlRleHQodGhpcywgY2ZnKSwgcGFydCwgZmFsc2UpLmNvbnRlbnQodGV4dCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLnRzcGFuID0gZnVuY3Rpb24odGV4dCwgY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5UU3Bhbih0aGlzLCBjZmcpLCBwYXJ0LCBmYWxzZSkuY29udGVudCh0ZXh0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgQ2lyY2xlIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuY2lyY2xlID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5DaXJjbGUodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIENpcmNsZSB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmVsbGlwc2UgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLkVsbGlwc2UodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIEdyb3VwIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuZyA9IGZ1bmN0aW9uKGNmZykge1xyXG4gICAgdmFyIGNmZyA9IGNmZyB8fHt9O1xyXG5cclxuICAgIHZhciBwYXJlbnRQYXJ0ID0gdGhpcy5zdmdQYXJ0c1tjZmcucGFyZW50UGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG5cclxuICAgIGRlbGV0ZSBjZmcucGFydDtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB0aGlzLmFkZChuZXcgc2hhcGVzLkdyb3VwKHRoaXMsIGNmZyksIHBhcmVudFBhcnQpO1xyXG5cclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMTtpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRUb0dyb3VwOiAnK2dyb3VwLmF0dHIoJ2lkJykrJyAtICcrIGFyZ3VtZW50c1tpXS5hdHRyKCdpZCcpKTtcclxuICAgICAgICAgICAgZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3JvdXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmRzIGFuIHN2ZyBlbGVtZW50IG90IHRoZSBnaXZlbiBncm91cC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Hcm91cCA9IGZ1bmN0aW9uKGdyb3VwLCBlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYob2JqZWN0LmlzQXJyYXkoZWxlbWVudCkpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBvYmplY3QuZWFjaChlbGVtZW50LCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRvbS5hcHBlbmRTVkdFbGVtZW50KGdyb3VwLmluc3RhbmNlKCksIGVsZW1lbnQpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgZWxlbWVudCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFBhdGggd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5wYXRoID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuc3ZnUGFydHNbcGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKG5ldyBzaGFwZXMuUGF0aCh0aGlzLCBjZmcpLCBwYXJ0KTtcclxufTtcclxuXHJcblNWRy5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcclxuICAgICQodGhpcy5yb290Lmluc3RhbmNlKCkpLmVtcHR5KCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmFzU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290LnRvU3RyaW5nKCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290LmNsb25lKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYW4gU1ZHRWxlbWVudCBvdXQgb2YgdGhlIGdpdmVuIGlkIHNlbGVjdG9yIGVsZW1lbnQuXHJcbiAqIEBwYXJhbSBzZWxlY3RvclxyXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudHxleHBvcnRzfG1vZHVsZS5leHBvcnRzfVxyXG4gKi9cclxuU1ZHLmdldCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICBpZihzZWxlY3Rvci5TVkdFbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yO1xyXG4gICAgfVxyXG4gICAgLy9UT0RPOlxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICRub2RlID0gJChkb20uZ2V0SWRTZWxlY3RvcihzZWxlY3RvcikpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAkbm9kZSA9ICQoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCEkbm9kZS5sZW5ndGgpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ2NhbGwgU1ZHLmdldCBvbiBhIG5vbiBleGlzdGluZyBub2RlOiAnK3NlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9IGVsc2UgaWYoJG5vZGUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIC8vUmV0dXJuIGxpc3Qgb2YgU1ZHRWxlbWVudHNcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgJG5vZGUuZWFjaChmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goU1ZHLmdldCh0aGlzKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9SZXR1cm4gc2luZ2xlIFNWZ0VsZW1lbnRcclxuICAgICAgICB2YXIgJHN2Z1Jvb3ROb2RlID0gJCgkbm9kZS5nZXQoMCkub3duZXJTVkdFbGVtZW50KTtcclxuICAgICAgICBpZigkc3ZnUm9vdE5vZGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBzdmdJbnN0YW5jZSA9IGluc3RhbmNlc1skc3ZnUm9vdE5vZGUuYXR0cignaWQnKV07XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBTVkcuX3N2Z0luc3RhbmNlKCRub2RlLCBzdmdJbnN0YW5jZSk7XHJcbiAgICAgICAgICAgIC8vVGhpcyBlbmFibGVzICQuZWFjaCBmb3Igc2luZ2xlIHJlc3VsdHMuXHJcbiAgICAgICAgICAgIHJlc3VsdFswXSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgcmVzdWx0Lmxlbmd0aCA9IDE7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zcGxpY2UgPSBmdW5jdGlvbigpIHt9O1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ2FsbCBTVkcuZ2V0IG9uIG5vZGUgd2l0aCBubyBzdmcgcm9vdCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblNWRy5fc3ZnSW5zdGFuY2UgPSBmdW5jdGlvbigkbm9kZSwgc3ZnKSB7XHJcbiAgICB2YXIgU1ZHU2hhcGUgPSBTVkcuZ2V0U2hhcGVCeU5hbWUoJG5vZGUuZ2V0KDApLm5vZGVOYW1lKTtcclxuICAgIHJldHVybiAoU1ZHU2hhcGUpID8gbmV3IFNWR1NoYXBlKHN2ZykuaW5zdGFuY2UoJG5vZGUuZ2V0KDApKSA6IG5ldyBTVkdHZW5lcmljU2hhcGUoJG5vZGUuZ2V0KDApLCBzdmcpO1xyXG59O1xyXG5cclxuU1ZHLmdldFNoYXBlQnlOYW1lID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHNoYXBlc1t0eXBlLnRvTG93ZXJDYXNlKCldO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWRy5wcm90b3R5cGUuZ2V0ID0gU1ZHLmdldDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHO1xyXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR0VsZW1lbnQgPSByZXF1aXJlKCcuL3N2Z0VsZW1lbnQnKTtcclxuXHJcbnZhciBOQU1FU1BBQ0VfU1ZHID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcclxudmFyIE5BTUVTUEFDRV9YTElOSyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcclxudmFyIFNWR19WRVJTSU9OID0gJzEuMSc7XHJcblxyXG52YXIgU1ZHUm9vdCA9IGZ1bmN0aW9uKHN2ZywgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBjZmdbJ3htbG5zJ10gPSBOQU1FU1BBQ0VfU1ZHO1xyXG4gICAgY2ZnWyd4bWxuczp4bGluayddID0gTkFNRVNQQUNFX1hMSU5LO1xyXG4gICAgY2ZnWyd2ZXJzaW9uJ10gPSBTVkdfVkVSU0lPTjtcclxuICAgIFNWR0VsZW1lbnQuY2FsbCh0aGlzLCAnc3ZnJywgc3ZnLCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdSb290LCBTVkdFbGVtZW50KTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLnggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3gnLCB2YWx1ZSkgOiB0aGlzLmF0dHJOdW1iZXIoJ3gnKSB8fCAwIDtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLnkgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3knLCB2YWx1ZSkgOiB0aGlzLmF0dHJOdW1iZXIoJ3knKSB8fCAwIDtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLmdldENlbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4OiB0aGlzLngoKSArIE1hdGguZmxvb3IodGhpcy53aWR0aCgpIC8gMiksXHJcbiAgICAgICAgeTogdGhpcy55KCkgKyBNYXRoLmZsb29yKHRoaXMuaGVpZ2h0KCkgLyAyKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4kKCkuaGVpZ2h0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignaGVpZ2h0JywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHUm9vdC5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoIXZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgpLndpZHRoKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignd2lkdGgnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1Jvb3Q7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xyXG5cclxudmFyIFNWR0VsZW1lbnQgPSByZXF1aXJlKCcuL1NWR0VsZW1lbnQnKTtcclxuXHJcbnZhciBTVkdTaGFwZSA9IGZ1bmN0aW9uKG5hbWUsIHN2Z1Jvb3QsIGNmZywgYXR0cmlidXRlU2V0dGVyKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IGF0dHJpYnV0ZVNldHRlciB8fCB7fTtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyLnRyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3JtYXRpb25BdHRyaWJ1dGVTZXR0ZXI7XHJcbiAgICBTVkdFbGVtZW50LmNhbGwodGhpcywgbmFtZSwgc3ZnUm9vdCwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdTaGFwZSwgU1ZHRWxlbWVudCk7XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNmb3JtYXRpb25BdHRyaWJ1dGVTZXR0ZXIgPSBmdW5jdGlvbih0cm5hc2Zvcm1hdGlvblN0cmluZykge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0odHJuYXNmb3JtYXRpb25TdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldFRyYW5zZm9ybWF0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZighdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKCk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pKSB7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0odGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50cmFuc2Zvcm1lZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2NhbGVkWCh0aGlzLnRyYW5zbGF0ZWRYKHB4KSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNmb3JtZWRZID0gZnVuY3Rpb24ocHgpIHtcclxuICAgIHJldHVybiB0aGlzLnNjYWxlZFkodGhpcy50cmFuc2xhdGVkWShweCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnNjYWxlZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgcmV0dXJuIHB4ICogdGhpcy5zY2FsZSgpWzBdXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc2NhbGVkWSA9IGZ1bmN0aW9uKHB5KSB7XHJcbiAgICByZXR1cm4gcHkgKiB0aGlzLnNjYWxlKClbMV1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbih2YWwpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkucm90YXRlKHZhbCk7XHJcblxyXG4gICAgaWYocmVzdWx0IGluc3RhbmNlb2YgVHJhbnNmb3JtKSB7XHJcbiAgICAgICAgLy8gVGhlIHNjYWxlIHNldHRlciByZXR1cm5zIHRoZSBUcmFuc2Zvcm0gaXRzZWxmIG9iamVjdCBzbyB3ZSByZXNldCB0aGUgc2NhbGVcclxuICAgICAgICAvLyB0cmFuc2Zvcm0gYXR0cmlidXRlIGluIGRvbSAoc2V0dGVyIHdhcyBjYWxsZWQpXHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ3RyYW5zZm9ybScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBUaGUgZ2V0dGVyIGp1c3QgcmV0dXJucyB0aGUgeCx5IHZhbHVlcyBvZiB0aGUgdHJhbnNsYXRlIHRyYW5zZm9ybWF0aW9uXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHN4LCBzeSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgIGlmKHJlc3VsdCBpbnN0YW5jZW9mIFRyYW5zZm9ybSkge1xyXG4gICAgICAgIC8vIFRoZSBzY2FsZSBzZXR0ZXIgcmV0dXJucyB0aGUgVHJhbnNmb3JtIGl0c2VsZiBvYmplY3Qgc28gd2UgcmVzZXQgdGhlIHNjYWxlXHJcbiAgICAgICAgLy8gdHJhbnNmb3JtIGF0dHJpYnV0ZSBpbiBkb20gKHNldHRlciB3YXMgY2FsbGVkKVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKCd0cmFuc2Zvcm0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gVGhlIGdldHRlciBqdXN0IHJldHVybnMgdGhlIHgseSB2YWx1ZXMgb2YgdGhlIHRyYW5zbGF0ZSB0cmFuc2Zvcm1hdGlvblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoeCx5KTtcclxuXHJcbiAgICBpZihyZXN1bHQgaW5zdGFuY2VvZiBUcmFuc2Zvcm0pIHtcclxuICAgICAgICAvLyBUaGUgdHJuYXNsYXRlIHNldHRlciByZXR1cm5zIHRoZSBUcmFuc2Zvcm0gb2JqZWN0IHNvIHdlIHJlc2V0IHRoZVxyXG4gICAgICAgIC8vIHRyYW5zZm9ybSBhdHRyaWJ1dGUgaW4gZG9tIChzZXR0ZXIgd2FzIGNhbGxlZClcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgndHJhbnNmb3JtJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFRoZSBnZXR0ZXIganVzdCByZXR1cm5zIHRoZSB4LHkgdmFsdWVzIG9mIHRoZSB0cmFuc2xhdGUgdHJhbnNmb3JtYXRpb25cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZWQgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRyYW5zbGF0ZS54ICsgcG9zaXRpb24ueCxcclxuICAgICAgICB5IDogdHJhbnNsYXRlLnkgKyBwb3NpdGlvbi55XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNsYXRlZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoKTtcclxuICAgIHB4ID0gKG9iamVjdC5pc0RlZmluZWQocHgpKSA/IHB4IDogMDtcclxuICAgIHJldHVybiB0cmFuc2xhdGUueCArIHB4O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZWRZID0gZnVuY3Rpb24ocHkpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkudHJhbnNsYXRlKCk7XHJcbiAgICBweSA9IChvYmplY3QuaXNEZWZpbmVkKHB5KSkgPyBweSA6IDA7XHJcbiAgICByZXR1cm4gdHJhbnNsYXRlLnkgKyBweTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5oYXNUcmFuc2Zvcm1hdGlvbiA9IGZ1bmN0aW9uKHRyYW5zZm9ybWF0aW9uKSB7XHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pKSB7XHJcbiAgICAgICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm1bdHJhbnNmb3JtYXRpb25dKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdHlsZSgnZmlsbCcsIGNvbG9yKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5maWxsT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuICAgIHJldHVybiB0aGlzLnN0eWxlKCdmaWxsLW9wYWNpdHknLCBvcGFjaXR5KTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zdHJva2VPcGFjaXR5ID0gZnVuY3Rpb24ob3BhY2l0eSkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5Jywgb3BhY2l0eSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlID0gZnVuY3Rpb24oY29sb3IsIHdpZHRoKSB7XHJcbiAgICBpZih3aWR0aCkge1xyXG4gICAgICAgIHRoaXMuc3Ryb2tlV2lkdGgod2lkdGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuc3R5bGUoJ3N0cm9rZScsIGNvbG9yKTtcclxuXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlRGFzaGFycmF5ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYoIXR5cGUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZSgnc3Ryb2tlLWRhc2hhcnJheScpO1xyXG4gICAgfVxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKHR5cGUpKSB7XHJcbiAgICAgICAgdGhpcy5zdHlsZSgnc3Ryb2tlLWRhc2hhcnJheScsIHR5cGUpO1xyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlRGFzaFR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZighdHlwZSkge1xyXG4gICAgICAgIHN3aXRjaCh0aGlzLnN0cm9rZURhc2hhcnJheSgpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCI1LDVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICBjYXNlIFwiMTAsMTBcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICBjYXNlIFwiMjAsMTAsNSw1LDUsMTBcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAzO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzd2l0Y2godHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICcxJzpcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJva2VEYXNoYXJyYXkoXCI1LDVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnMic6XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwiMTAsMTBcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnMyc6XHJcbiAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwiMjAsMTAsNSw1LDUsMTBcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwibm9uZVwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zdHJva2VXaWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICByZXR1cm4gdXRpbC5hcHAucGFyc2VOdW1iZXJTdHJpbmcodGhpcy5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgd2lkdGgpKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICghdGhpcy5maWxsT3BhY2l0eSgpIHx8IHRoaXMuZmlsbE9wYWNpdHkoKSA+IDApXHJcbiAgICAgICAgJiYgKCF0aGlzLnN0cm9rZU9wYWNpdHkoKSB8fCB0aGlzLnN0cm9rZU9wYWNpdHkoKSA+IDApO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuZmlsbE9wYWNpdHkoMCk7XHJcbiAgICB0aGlzLnN0cm9rZU9wYWNpdHkoMCk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuICAgIG9wYWNpdHkgPSBvYmplY3QuaXNEZWZpbmVkKG9wYWNpdHkpID8gb3BhY2l0eSA6IDE7XHJcbiAgICB0aGlzLmZpbGxPcGFjaXR5KG9wYWNpdHkpO1xyXG4gICAgdGhpcy5zdHJva2VPcGFjaXR5KG9wYWNpdHkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgdGhlIGxvY2F0aW9uIG9mIGEgZ2l2ZW4gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHN2ZyBlbGVtZW50LlxyXG4gKiAgICAgIF90X1xyXG4gKiAgICB8XFwgICAvfFxyXG4gKiAgbCB8ICBjICB8IHJcclxuICogICAgfC9fX19cXHxcclxuICogICAgICAgYlxyXG4gKiBAcGFyYW0gbm9kZVxyXG4gKiBAcGFyYW0gcG9zaXRpb25cclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAvL0ZpcnN0IHdlIGNoZWNrIGlmIHRoZSBwb2ludCBsaWVzIGRpcmVjdCBvbiB0aGUgYm91bmRhcnlcclxuICAgIGlmKHBvc2l0aW9uLnggPT09IHRoaXMueCgpKSB7XHJcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcclxuICAgIH0gZWxzZSBpZihwb3NpdGlvbi55ID09PSB0aGlzLnkoKSkge1xyXG4gICAgICAgIHJldHVybiAndG9wJztcclxuICAgIH0gZWxzZSBpZihwb3NpdGlvbi54ID09PSB0aGlzLmdldFJpZ2h0WCgpKSB7XHJcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XHJcbiAgICB9IGVsc2UgaWYocG9zaXRpb24ueSA9PT0gdGhpcy5nZXRCb3R0b21ZKCkpIHtcclxuICAgICAgICByZXR1cm4gJ2JvdHRvbSc7XHJcbiAgICB9XHJcblxyXG4gICAgLy9JZiBpdHMgbm90IG9uIHRoZSBib3VuZGFyeSB3ZSBjaGVjayB0aGUgbG9jYXRpb24gYnkgbWVhbnMgb2YgdGhlIGxpbmUgZ3JhZGllbnRcclxuICAgIHZhciBjZW50ZXIgPSB0aGlzLmdldENlbnRlcigpO1xyXG4gICAgdmFyIGcgPSB1dGlsLm1hdGguTGluZS5jYWxjR3JhZGllbnQoY2VudGVyLCBwb3NpdGlvbik7XHJcbiAgICBpZihwb3NpdGlvbi55IDwgY2VudGVyLnkpIHsgLy9wb3NpdGlvbiBvdmVyIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICBpZiAocG9zaXRpb24ueCA+PSBjZW50ZXIueCkgeyAvL3Bvc2l0aW9uIHJpZ2h0IChvciBlcSkgb2YgZWxlbWVudGNlbnRlclxyXG4gICAgICAgICAgICByZXR1cm4gKGcgPiAtMSkgPyAncmlnaHQnIDogJ3RvcCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChnIDwgMSkgey8vcG9zaXRpb24gbGVmdCBhbmQgb3ZlciBvZiBlbGVtZW50Y2VudGVyXHJcbiAgICAgICAgICAgIHJldHVybiAoZyA8IDEpID8gJ2xlZnQnIDogJ3RvcCc7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmKHBvc2l0aW9uLnggPj0gY2VudGVyLngpIHsgLy9wb3NpdGlvbiB1bmRlciAob3IgZXEpIGFuZCByaWdodCAob3IgZXEpIG9mIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICByZXR1cm4gKGcgPCAxKSA/ICdyaWdodCcgOiAnYm90dG9tJztcclxuICAgIH0gZWxzZSB7IC8vcG9zaXRpb24gdW5kZXIgYW5kIGxlZnQgb2YgZWxlbWVudGNlbnRlclxyXG4gICAgICAgIHJldHVybiAoZyA8IC0xKSA/ICdib3R0b20nIDogJ2xlZnQnO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnggPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICByZXR1cm4gKHdpdGhTdHJva2UpID8gdGhpcy50cmFuc2xhdGVkWCh0aGlzLl9nZXRYKCkpIC0gdGhpcy5zY2FsZWRYKHRoaXMuc3Ryb2tlV2lkdGgoKSkgLyAyIDogdGhpcy50cmFuc2xhdGVkWCh0aGlzLl9nZXRYKCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLl9nZXRYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS55ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuICh3aXRoU3Ryb2tlKSA/IHRoaXMudHJhbnNsYXRlZFkodGhpcy5fZ2V0WSgpKSAtIHRoaXMuc2NhbGVkWSh0aGlzLnN0cm9rZVdpZHRoKCkpIC8gMiA6IHRoaXMudHJhbnNsYXRlZFkodGhpcy5fZ2V0WSgpKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0WSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB0aGF0Lngod2l0aFN0cm9rZSksXHJcbiAgICAgICAgeSA6IHRoYXQueSh3aXRoU3Ryb2tlKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50b3BMZWZ0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb24od2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudG9wUmlnaHQgPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB0aGF0LmdldFJpZ2h0WCh3aXRoU3Ryb2tlKSxcclxuICAgICAgICB5IDogdGhhdC55KHdpdGhTdHJva2UpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmJvdHRvbVJpZ2h0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC5nZXRSaWdodFgod2l0aFN0cm9rZSksXHJcbiAgICAgICAgeSA6IHRoYXQuZ2V0Qm90dG9tWSh3aXRoU3Ryb2tlKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5ib3R0b21MZWZ0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC54KHdpdGhTdHJva2UpLFxyXG4gICAgICAgIHkgOiB0aGF0LmdldEJvdHRvbVkod2l0aFN0cm9rZSlcclxuICAgIH07XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0Q2VudGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYyA9IHtcclxuICAgICAgICB4OiB0aGlzLngoKSArIE1hdGguZmxvb3IodGhpcy53aWR0aCgpIC8gMiksXHJcbiAgICAgICAgeTogdGhpcy55KCkgKyBNYXRoLmZsb29yKHRoaXMuaGVpZ2h0KCkgLyAyKVxyXG4gICAgfTtcclxuICAgIHJldHVybiB1dGlsLm1hdGgucm90YXRlKGMsIHRoaXMucG9zaXRpb24oKSwgdGhpcy5yb3RhdGUoKSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUub3ZlcmxheXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIG9iamVjdC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oaW5kZXgsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYodGhhdC5vdmVybGF5Q2hlY2socG9zaXRpb24pKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy9UTyBicmVhayB0aGUgZWFjaCBsb29wXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdyZXN1bHQ6JytyZXN1bHQpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIGEgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBmb3IgY2hlY2tpbmcgaWYgYSBnaXZlbiBwb3NpdGlvbiBsaWVzIHdpdGhpbiB0aGUgc3ZnRWxlbWVudC5cclxuICogVGhpcyBjYW4gYmUgb3ZlcndyaXR0ZW4gYnkgc2hhcGVzIGxpa2UgY2lyY2xlcyBhbmQgZWxsaXBzZS4uXHJcbiAqL1xyXG5TVkdTaGFwZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBwb3NpdGlvbi54ID49IHRoaXMueCgpICYmIHBvc2l0aW9uLnggPD0gdGhpcy5nZXRSaWdodFgoKVxyXG4gICAgICAgICYmIHBvc2l0aW9uLnkgPj0gdGhpcy55KCkgJiYgcG9zaXRpb24ueSA8PSB0aGlzLmdldEJvdHRvbVkoKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oZHgsIGR5KSB7XHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRlKHRyYW5zbGF0ZS54ICsgZHgsIHRyYW5zbGF0ZS55ICsgZHkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHAgPSB1dGlsLm1hdGguZ2V0UG9pbnQoeCx5KTtcclxuXHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIGlmKHRoaXMueCgpICE9PSBwLnggfHwgdGhpcy55KCkgIT09IHAueSkge1xyXG4gICAgICAgIC8vVE9ETzogdGhpcyBkb2VzIG5vdCBjb25zaWRlciB4L3kgYXR0cmlidXRlIHNldHRpbmdzXHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGUocCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlWCA9IGZ1bmN0aW9uKHgpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLnRyYW5zbGF0ZSgpO1xyXG4gICAgaWYodHJhbnNsYXRlLnggIT09IHgpIHtcclxuICAgICAgICB0aGlzLnRyYW5zbGF0ZSh4LCB0cmFuc2xhdGUueSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlWSA9IGZ1bmN0aW9uKHkpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLnRyYW5zbGF0ZSgpO1xyXG4gICAgaWYodHJhbnNsYXRlLnkgIT09IHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGUodHJhbnNsYXRlLngsIHkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogTm90ZTogdGhlIGltcGxlbWVudGF0aW9uIG9mIGdldEJCb3ggZGlmZmVycyBiZXR3ZWVuIGJyb3dzZXJzIHNvbWUgYWRkIHRoZSBzcm9rZS13aWR0aCBhbmQgc29tZSBkbyBub3QgYWRkIHN0cm9rZS13aWR0aFxyXG4gKi9cclxuU1ZHU2hhcGUucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZigob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGVkWSh0aGlzLl9nZXRIZWlnaHQoKSkgKyB0aGlzLnNjYWxlZFkodGhpcy5zdHJva2VXaWR0aCgpKTtcclxuICAgIH0gZWxzZSBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgKG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY2FsZWRZKHRoaXMuX2dldEhlaWdodCgpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fc2V0SGVpZ2h0KHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCQm94KCkuaGVpZ2h0O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLl9zZXRIZWlnaHQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZigob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGVkWCh0aGlzLl9nZXRXaWR0aCgpKSArIHRoaXMuc2NhbGVkWCh0aGlzLnN0cm9rZVdpZHRoKCkpO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSB8fCAob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlZFgodGhpcy5fZ2V0V2lkdGgoKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldFdpZHRoKHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0V2lkdGggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJCb3goKS53aWR0aDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fc2V0V2lkdGggPSBmdW5jdGlvbigpIHtcclxuICAgLy9BQlNUUkFDVFxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldEJvdHRvbVkgPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICByZXR1cm4gdGhpcy55KHdpdGhTdHJva2UpICsgdGhpcy5oZWlnaHQod2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0UmlnaHRYID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuIHRoaXMueCh3aXRoU3Ryb2tlKSArIHRoaXMud2lkdGgod2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1NoYXBlOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgREVGQVVMVF9GT05UX1NJWkUgPSAxMTtcclxudmFyIERFRkFVTFRfRk9OVF9GQU1JTFkgPSBcIkhlbHZldGljYVwiOyAvL1ZlcmRhbmEsIEFyaWFsLCBzYW5zLXNlcmlmID9cclxudmFyIERFRkFVTFRfVEVYVF9BTkNIT1IgPSBcInN0YXJ0XCI7XHJcbnZhciBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FID0gXCJoYW5naW5nXCI7XHJcblxyXG52YXIgREVGQVVMVF9TUEFOX1BBRERJTkcgPSAwO1xyXG5cclxudmFyIFNWR1RleHQgPSBmdW5jdGlvbihzdmdSb290LCBjZmcsIGF0dHJpYnV0ZVNldHRlcikge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgY2ZnWydmb250LWZhbWlseSddID0gY2ZnWydmb250LXNpemUnXSB8fCBERUZBVUxUX0ZPTlRfRkFNSUxZO1xyXG4gICAgY2ZnWydmb250LXNpemUnXSA9IGNmZ1snZm9udC1zaXplJ10gfHwgREVGQVVMVF9GT05UX1NJWkU7XHJcbiAgICBjZmdbJ3RleHQtYW5jaG9yJ10gPSBjZmdbJ3RleHQtYW5jaG9yJ10gfHwgREVGQVVMVF9URVhUX0FOQ0hPUjtcclxuICAgIGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSA9IGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSB8fCBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FO1xyXG5cclxuICAgIHRoaXMuc3BhblBhZGRpbmcgPSBjZmdbJ3BhZGRpbmcnXSB8fCBERUZBVUxUX1NQQU5fUEFERElORztcclxuXHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICd0ZXh0Jywgc3ZnUm9vdCwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpO1xyXG4gICAgLy9UT0RPOiBTcGFuIC8gbXVsdGkgbGluZSB0ZXh0XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR1RleHQsIFNWR1NoYXBlKTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnBhZGRpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICB0aGlzLnNwYW5QYWRkaW5nID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5zZXRTcGFuQXR0cigneCcsIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhblBhZGRpbmc7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5mb250RmFtaWx5ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2ZvbnQtZmFtaWx5JywgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZm9udFdlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdHlsZSgnZm9udC13ZWlnaHQnLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5mb250U2l6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHZhbHVlID0gb2JqZWN0LmlzTnVtYmVyKHZhbHVlKSA/IHZhbHVlKydweCcgOiB2YWx1ZTtcclxuICAgIH1cclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmF0dHJOdW1iZXIoJ2ZvbnQtc2l6ZScsIHZhbHVlKTtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTcGFuQXR0cignZHknLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5zZXRTcGFuQXR0ciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHRoaXMuJCgpLmNoaWxkcmVuKCd0c3BhbicpLmF0dHIoa2V5LCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3gnLCB2YWx1ZSkgOiB0aGlzLnRyYW5zbGF0ZWRYKHRoaXMuYXR0ck51bWJlcigneCcsIHZhbHVlKSkgfHwgMCA7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpID8gdGhpcy5hdHRyTnVtYmVyKCd5JywgdmFsdWUpIDogdGhpcy50cmFuc2xhdGVkWSh0aGlzLmF0dHJOdW1iZXIoJ3knLCB2YWx1ZSkpIHx8IDAgO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZHggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0ck51bWJlcignZHgnLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5keSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdkeScsIHZhbHVlKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbihkeCwgZHkpIHtcclxuICAgIFNWR1RleHQuc3VwZXJfLnByb3RvdHlwZS5tb3ZlLmFwcGx5KHRoaXMsIFtkeCwgZHldKTtcclxuICAgIHRoaXMuYWxpZ25CYWNrZ3JvdW5kKCk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICBTVkdUZXh0LnN1cGVyXy5wcm90b3R5cGUubW92ZVRvLmFwcGx5KHRoaXMsIFt4LCB5XSk7XHJcbiAgICB0aGlzLmFsaWduQmFja2dyb3VuZCgpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuY29udGVudCA9IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgIGlmKCF0ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRleHQgPSB0ZXh0LnRvU3RyaW5nKCk7XHJcblxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdmFyIGhlaWdodDtcclxuICAgIHRoaXMuJCgpLmVtcHR5KCk7XHJcbiAgICAkLmVhY2godGV4dC5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0RlZmluZWQodmFsdWUpICYmIHZhbHVlLnRyaW0oKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciB0U3BhbiA9IHRoYXQuc3ZnLnRzcGFuKHZhbHVlKS54KHRoYXQuc3BhblBhZGRpbmcpO1xyXG4gICAgICAgICAgICB0aGF0LmFwcGVuZCh0U3Bhbik7XHJcbiAgICAgICAgICAgIGlmKGluZGV4ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdFNwYW4uZHkoaGVpZ2h0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhlaWdodCA9IHRTcGFuLmhlaWdodCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmdldFRleHQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSAnJztcclxuICAgIHZhciAkY2hpbGRyZW4gPSB0aGlzLiQoKS5jaGlsZHJlbigndHNwYW4nKTtcclxuICAgICRjaGlsZHJlbi5lYWNoKGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHJlc3VsdCArPSAkKHRoaXMpLnRleHQoKTtcclxuICAgICAgICBpZihpbmRleCAhPSAkY2hpbGRyZW4ubGVuZ3RoIC0xKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5zd2l0Y2hBbmNob3IgPSBmdW5jdGlvbigpIHtcclxuICAgIHN3aXRjaCh0aGlzLmFuY2hvcigpKSB7XHJcbiAgICAgICAgY2FzZSAnc3RhcnQnOlxyXG4gICAgICAgICAgICB0aGlzLmVuZCgpO1xyXG4gICAgICAgIGNhc2UgJ2VuZCc6XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmdldEV4dGVudE9mQ2hhciA9IGZ1bmN0aW9uKGNoYXJOdW0pIHtcclxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlKCkuZ2V0RXh0ZW50T2ZDaGFyKGNoYXJOdW0pO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZ2V0Q2hhckhlaWdodCA9IGZ1bmN0aW9uKGNoYXJOdW0pIHtcclxuICAgIHJldHVybiB0aGlzLmdldEV4dGVudE9mQ2hhcihjaGFyTnVtKS5oZWlnaHQ7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYW5jaG9yKCdzdGFydCcpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hbmNob3IoJ2VuZCcpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUubWlkZGxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hbmNob3IoJ21pZGRsZScpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuYW5jaG9yID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ3RleHQtYW5jaG9yJywgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUudFNwYW4gPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3ZnLmdldCh0aGlzLiQoKS5jaGlsZHJlbigndHNwYW4nKS5nZXQoaW5kZXgpKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmhhbmdpbmcgPSBmdW5jdGlvbihoYW5naW5nKSB7XHJcbiAgICB2YXIgaGFuZ2luZyA9IG9iamVjdC5pc0RlZmluZWQoaGFuZ2luZykgPyBoYW5naW5nIDogdHJ1ZTtcclxuICAgIHZhciB2YWx1ZSA9IGhhbmdpbmcgPyAnaGFuZ2luZycgOiAnYmFzZWxpbmUnO1xyXG4gICAgdGhpcy5hdHRyKCdkb21pbmFudC1iYXNlbGluZScsIHZhbHVlKTtcclxuICAgIHZhciBmaXJzdFNwYW4gPSB0aGlzLnRTcGFuKDApO1xyXG4gICAgdmFyIGR5ID0gKGhhbmdpbmcpID8gMCA6IGZpcnN0U3Bhbi5oZWlnaHQoKSArIHRoaXMuZ2V0QkJveCgpLnk7XHJcbiAgICBmaXJzdFNwYW4uZHkoZHkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogTm90ZTogdGhlIGJhY2tncm91bmQgd29uJ3QgYWxpZ24gd2hlbiB0aGUgdGV4dCBpcyBkcmFnZ2VkLiBQZXJoYXBzIGFkZCBkcmFnIGhvb2tcclxuICogQHBhcmFtIGNvbG9yXHJcbiAqL1xyXG5TVkdUZXh0LnByb3RvdHlwZS5iYWNrZ3JvdW5kID0gZnVuY3Rpb24oY29sb3IpIHtcclxuICAgIHZhciBzdmdCYWNrZ3JvdW5kID0gdGhpcy5nZXRCYWNrZ3JvdW5kKCk7XHJcbiAgICBpZihjb2xvcikge1xyXG4gICAgICAgIGlmKCFzdmdCYWNrZ3JvdW5kKSB7XHJcbiAgICAgICAgICAgIHN2Z0JhY2tncm91bmQgPSB0aGlzLnN2Zy5yZWN0KHsnY2xhc3MnOid0ZXh0QmFja2dyb3VuZCd9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3ZnQmFja2dyb3VuZC5maWxsKGNvbG9yKTtcclxuICAgICAgICBzdmdCYWNrZ3JvdW5kLiQoKS5hZnRlcih0aGlzLiQoKSk7XHJcbiAgICAgICAgdGhpcy5hbGlnbkJhY2tncm91bmQoKTtcclxuICAgIH0gZWxzZSBpZihzdmdCYWNrZ3JvdW5kKSB7XHJcbiAgICAgICAgc3ZnQmFja2dyb3VuZC5maWxsKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiAgVE9ETzogcHJvYmFibHkganVzdCB3b3JrcyBmb3IgaGFuZ2luZyB0ZXh0cyBiZWNhdXNlIG9mIHRoZSBvZmZzZXQuLi5cclxuICovXHJcblNWR1RleHQucHJvdG90eXBlLmFsaWduQmFja2dyb3VuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHN2Z0JhY2tncm91bmQgPSB0aGlzLmdldEJhY2tncm91bmQoKTtcclxuICAgIGlmKHN2Z0JhY2tncm91bmQpIHtcclxuICAgICAgICB2YXIgYmdIZWlnaHQgPSB0aGlzLmhlaWdodCgpICsgdGhpcy5nZXRCQm94KCkueTsgLy9yZW1vdmUgdGV4dCBvZmZzZXRcclxuICAgICAgICBzdmdCYWNrZ3JvdW5kLmhlaWdodChiZ0hlaWdodCkud2lkdGgodGhpcy53aWR0aCgpKS50cmFuc2xhdGUodGhpcy54KCksIHRoaXMueSgpKTtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmdldEJhY2tncm91bmQgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmKHRoaXMuYmFja2dyb3VuZFNWRykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tncm91bmRTVkc7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByZXYgPSB0aGlzLiQoKS5wcmV2KCk7XHJcbiAgICBpZihwcmV2Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICB2YXIgc3ZnQmFjayA9IHRoaXMuc3ZnLmdldChwcmV2KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5iYWNrZ3JvdW5kU1ZHID0gKHN2Z0JhY2suaGFzQ2xhc3MoJ3RleHRCYWNrZ3JvdW5kJykpID8gc3ZnQmFjayA6IHVuZGVmaW5lZDtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmRvbWluYW50QmFzZWxpbmUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignZG9taW5hbnQtYmFzZWxpbmUnLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1RleHQ7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG52YXIgRG9tRWxlbWVudCA9IHJlcXVpcmUoJy4uL2RvbS9kb21FbGVtZW50Jyk7XHJcblxyXG52YXIgVHJhbnNmb3JtID0gZnVuY3Rpb24oZGVmKSB7XHJcbiAgICBpZih0eXBlb2YgZGVmICE9PSAndW5kZWZpbmVkJyApIHtcclxuICAgICAgICBpZihvYmplY3QuaXNTdHJpbmcoZGVmKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldERlZmluaXRpb25Gcm9tU3RyaW5nKGRlZik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gZGVmO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0ge307XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldERlZmluaXRpb25Gcm9tU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCF0aGlzLmRlZmluaXRpb24pIHtcclxuICAgICAgICB0aGlzLmRlZmluaXRpb24gPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBleHRyYWN0ICd0cmFuc2xhdGUoMjAwIDIwMCkgcm90YXRlKDQ1IDUwIDUwKScgdG8gXCJ0cmFuc2xhdGVcIiBcIjIwMCAyMDBcIiBcIiByb3RhdGVcIiBcIjQ1IDUwIDUwXCIgXCJcIlxyXG4gICAgdmFyIHRyYW5zZm9ybWF0aW9ucyA9IHZhbHVlLnNwbGl0KC9bXFwoXFwpXSsvKTtcclxuICAgIGZvcih2YXIgaSA9IDA7aSA8IHRyYW5zZm9ybWF0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xyXG4gICAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IHRyYW5zZm9ybWF0aW9uc1tpXS50cmltKCk7XHJcbiAgICAgICAgaWYodHJhbnNmb3JtYXRpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gRG9tRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZUZyb21TdHJpbmdMaXN0KHRyYW5zZm9ybWF0aW9uc1tpKzFdKTtcclxuICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgcHJlZmVyIGZsb2F0IHZhbHVlcyBmb3IgY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWVzW2pdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1tqXSA9IHBhcnNlRmxvYXQodmFsdWVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb25bdHJhbnNmb3JtYXRpb25dID0gdmFsdWVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgIGZvcih2YXIga2V5IGluIHRoaXMuZGVmaW5pdGlvbikge1xyXG4gICAgICAgIGlmKHRoaXMuZGVmaW5pdGlvbi5oYXNPd25Qcm9wZXJ0eSgoa2V5KSkpIHtcclxuICAgICAgICAgICAgLy8gZmlyc3Qgd2UgYXNzYW1ibGUgYWxsIHRyYW5zZm9ybWF0aW9ucyBpbiBhbiBhcnJheSBbJ3RyYW5zbGF0ZSgzMCknLCdyb3RhdGUoNDUgNTAgNTApJ11cclxuICAgICAgICAgICAgdmFyIHNpbmdsZVRyYW5zZm9ybWF0aW9uID0ga2V5KycoJytEb21FbGVtZW50LmdldEF0dHJpYnV0ZVN0cmluZyh0aGlzLmRlZmluaXRpb25ba2V5XSkrJyknO1xyXG4gICAgICAgICAgICB2YWx1ZXMucHVzaChzaW5nbGVUcmFuc2Zvcm1hdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gbWVyZ2UgdGhlIHRyYW5zZm9ybWF0aW9ucyB0byBvbmUgYXR0cmlidXRlc3RyaW5nXHJcbiAgICB2YXIgdmFsdWVTdHIgPSBEb21FbGVtZW50LmdldEF0dHJpYnV0ZVN0cmluZyh2YWx1ZXMpO1xyXG5cclxuICAgIGlmKHZhbHVlU3RyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICByZXR1cm4gdmFsdWVTdHI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGlmIHdlIGRvbid0IGhhdmUgYW55IHRyYW5zb3JtYXRpb25zIHNldCB3ZSBqdXN0IHJldHVybiBhbiBlbXB0eSBzdHJpbmdcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmhhc1RyYW5zZm9ybWF0aW9uID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZiB0aGlzLmRlZmluaXRpb25ba2V5XSAhPT0gJ3VuZGVmaW5lZCcpO1xyXG59O1xyXG5cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHZhbCkpIHtcclxuICAgICAgICB0aGlzLmRlZmluaXRpb24ucm90YXRlID0gdmFsO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWZpbml0aW9uLnJvdGF0ZSB8fCAwO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHN4LCBzeSkge1xyXG4gICAgc3kgPSBzeSB8fCBzeDtcclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQoc3gpKSB7XHJcbiAgICAgICAgaWYoIXRoaXMuZGVmaW5pdGlvbi5zY2FsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24uc2NhbGUgPSBbc3gsIHN5XTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24uc2NhbGVbMF0gPSBzeDtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnNjYWxlWzFdID0gc3k7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5kZWZpbml0aW9uLnNjYWxlO1xyXG4gICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcmVzdWx0WzBdLCByZXN1bHRbMF1dO1xyXG4gICAgICAgIH0gZWxzZSBpZihyZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICByZXR1cm4gW3Jlc3VsdFswXSwgcmVzdWx0WzFdXVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbMSwxXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICBpZihpbmRleCA8IDIgJiYgdGhpcy5kZWZpbml0aW9uLnNjYWxlKSB7XHJcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uLnNjYWxlW2luZGV4XSA9IHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcCA9IHV0aWwubWF0aC5nZXRQb2ludCh4LHkpO1xyXG5cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQocCkpIHtcclxuICAgICAgICBpZighdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlID0gW3AueCwgcC55XTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlWzBdID0gcC54O1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlWzFdID0gcC55O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYodGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeCA6IHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGVbMF0sXHJcbiAgICAgICAgICAgICAgICB5IDogdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZVsxXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB4IDogMCxcclxuICAgICAgICAgICAgICAgIHkgOiAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnZhciBTVkdUZXh0ID0gcmVxdWlyZSgnLi90ZXh0Jyk7XHJcblxyXG52YXIgREVGQVVMVF9ET01JTkFOVF9CQVNFTElORSA9ICdpbmhlcml0J1xyXG5cclxudmFyIFNWR1RTcGFuID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBjZmdbJ2RvbWluYW50LWJhc2VsaW5lJ10gPSBjZmdbJ2RvbWluYW50LWJhc2VsaW5lJ10gfHwgREVGQVVMVF9ET01JTkFOVF9CQVNFTElORTtcclxuICAgIFNWR1NoYXBlLmNhbGwodGhpcywgJ3RzcGFuJywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHVFNwYW4sIFNWR1RleHQpO1xyXG5cclxuU1ZHVFNwYW4ucHJvdG90eXBlLmdldENvbnRhaW5lclRleHQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpO1xyXG4gICAgaWYocGFyZW50LnRhZ05hbWUgPT09ICd0ZXh0Jykge1xyXG4gICAgICAgIHJldHVybiBwYXJlbnQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUU3Bhbi5wcm90b3R5cGUuZm9udFNpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gU1ZHVFNwYW4uc3VwZXJfLnByb3RvdHlwZS5mb250U2l6ZS5hcHBseSh0aGlzLCBbdmFsdWVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFNWR1RTcGFuLnN1cGVyXy5wcm90b3R5cGUuZm9udFNpemUuYXBwbHkodGhpcyk7XHJcbiAgICAgICAgaWYoIXJlc3VsdCkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyVGV4dCA9IHRoaXMuZ2V0Q29udGFpbmVyVGV4dCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGNvbnRhaW5lclRleHQpID8gY29udGFpbmVyVGV4dC5mb250U2l6ZSgpIDogMDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblNWR1RTcGFuLnByb3RvdHlwZS5jb250ZW50ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy4kKCkudGV4dCh2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiQoKS50ZXh0KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUU3Bhbi5wcm90b3R5cGUuZ2V0QkJveCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9zb21lIGJyb3dzZXIgKGUuZy4gZmlyZWZveCkgZG9lcyBub3QgaW1wbGVtZW50IHRoZSBnZXRCQm94IGZvciB0c3BhbiBlbGVtZW50cy5cclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdUU3BhbjsiLCJ2YXIgU1ZHID0gcmVxdWlyZSgnLi4vc3ZnL3N2ZycpO1xyXG52YXIgc3RyaW5nID0gcmVxdWlyZSgnLi4vdXRpbC9zdHJpbmcnKTtcclxudmFyIHF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCcuLi9jb3JlL2NhY2hlJyk7XHJcblxyXG4kLmZuLnN2ZyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICBpZihzZWxlY3RvciAmJiBzZWxlY3Rvci5TVkdFbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yO1xyXG4gICAgfSBlbHNlIGlmKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuICQoc2VsZWN0b3IpLnN2ZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH0gZWxzZSBpZih0aGlzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiBTVkcuZ2V0KHRoaXMpO1xyXG4gICAgfSBlbHNlIGlmKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAgW107XHJcbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChTVkcuZ2V0KHRoaXMpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5zdmcgPSAkLmZuLnN2ZztcclxuXHJcbiQucUNhY2hlID0gZnVuY3Rpb24oc2VsZWN0b3IsIHByZXZlbnRDYWNoZSkge1xyXG4gICAgaWYoc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS4kKHNlbGVjdG9yLCBwcmV2ZW50Q2FjaGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZTtcclxuICAgIH1cclxufTtcclxuXHJcbiQucVVuY2FjaGUgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuIHF1ZXJ5Q2FjaGUucmVtb3ZlKHNlbGVjdG9yKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgcHJvYmxlbSB3aXRoIHVpLXNlbGVjdG1lbnUgaXMgdGhhdCBpdCBjYXVzZXMgYSBzZWNvbmQga2V5ZG93biB0cmlnZ2VyIGV2ZW50IHdoZW4gZm9jdXNlZC5cclxuICogU28gZ2xvYmFsIGtleWRvd24gZXZlbnRzIGFyZSB0cmlnZ2VyZWQgdHdpY2hlIGxpa2UgZG8vdW5kbyBpZiBmb2N1c2VkLiBUaGUgZm9sbG93aW5nIGV2ZW50XHJcbiAqIHByZXZlbnRzIHRoZSBwcm9wYWdhdGlvbiBpZiB0aGUgY29udHJvbCBrZXkgaXMgcHJlc3NlZC5cclxuICovXHJcbiQoZG9jdW1lbnQsICcudWktc2VsZWN0bWVudS1idXR0b24nKS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgaWYoZXZ0LmN0cmxLZXkpIHtcclxuICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJC5mbi5ncm93bCA9IGZ1bmN0aW9uKHBhcmFtcykge1xyXG4gICAgdmFyICRyb290ID0gdGhpcztcclxuXHJcbiAgICAvLyB0b29sdGlwIGNvbnRlbnQgYW5kIHN0eWxpbmdcclxuICAgIHZhciAkY29udGVudCA9ICQoXHJcbiAgICAgICAgJzxhIGNsYXNzPVwiaWNvbi1jbG9zZVwiIGhyZWY9XCIjXCI+PC9hPicrXHJcbiAgICAgICAgJzxoMSBzdHlsZT1cImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxMnB0OyBmb250LXdlaWdodDogYm9sZDsgcGFkZGluZy1ib3R0b206IDVweDtcIj4nICsgcGFyYW1zLnRpdGxlICsgJzwvaDE+JyArXHJcbiAgICAgICAgJzxwIHN0eWxlPVwibWFyZ2luOiAwOyBwYWRkaW5nOiA1cHggMCA1cHggMDsgZm9udC1zaXplOiAxMHB0O1wiPicgKyBwYXJhbXMudGV4dCArICc8L3A+Jyk7XHJcblxyXG4gICAgLy8gYWRkICdDbG9zZScgYnV0dG9uIGZ1bmN0aW9uYWxpdHlcclxuICAgIHZhciAkY2xvc2UgPSAkKCRjb250ZW50WzBdKTtcclxuICAgICRjbG9zZS5jbGljayhmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgJHJvb3QudWl0b29sdGlwKCdjbG9zZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gcHJldmVudCBzdGFuZGFyZCB0b29sdGlwIGZyb20gY2xvc2luZ1xyXG4gICAgJHJvb3QuYmluZCgnZm9jdXNvdXQgbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG5cclxuICAgIC8vIGJ1aWxkIHRvb2x0aXBcclxuICAgICRyb290LnVpdG9vbHRpcCh7XHJcbiAgICAgICAgY29udGVudDogZnVuY3Rpb24oKSB7IHJldHVybiAkY29udGVudDsgfSxcclxuICAgICAgICBpdGVtczogJHJvb3Quc2VsZWN0b3IsXHJcbiAgICAgICAgdG9vbHRpcENsYXNzOiAnZ3Jvd2wgJyArIHBhcmFtcy5ncm93bENsYXNzLFxyXG4gICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgIG15OiAncmlnaHQgdG9wJyxcclxuICAgICAgICAgICAgYXQ6ICdyaWdodC0xMCB0b3ArMTAnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcclxuICAgICAgICAgICAgJHJvb3QudWl0b29sdGlwKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkudWl0b29sdGlwKCdvcGVuJyk7XHJcblxyXG4gICAgaWYocGFyYW1zLmNsb3NlQWZ0ZXIpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ICRyb290LnVpdG9vbHRpcCgnY2xvc2UnKTsgfSwgcGFyYW1zLmNsb3NlQWZ0ZXIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuaWYoJC51aSkge1xyXG4gICAgJC53aWRnZXQoIFwiY3VzdG9tLmljb25zZWxlY3RtZW51XCIsICQudWkuc2VsZWN0bWVudSwge1xyXG4gICAgICAgIF9yZW5kZXJJdGVtOiBmdW5jdGlvbiggdWwsIGl0ZW0gKSB7XHJcbiAgICAgICAgICAgIHZhciBsaSA9ICQoIFwiPGxpPlwiLCB7IHRleHQ6IGl0ZW0ubGFiZWwgfSApO1xyXG4gICAgICAgICAgICBpZiAoIGl0ZW0uZGlzYWJsZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBsaS5hZGRDbGFzcyggXCJ1aS1zdGF0ZS1kaXNhYmxlZFwiICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJCggXCI8c3Bhbj5cIiwge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IGl0ZW0uZWxlbWVudC5hdHRyKCBcImRhdGEtc3R5bGVcIiApLFxyXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcInVpLWljb24gXCIgKyBpdGVtLmVsZW1lbnQuYXR0ciggXCJkYXRhLWNsYXNzXCIgKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZFRvKCBsaSApO1xyXG4gICAgICAgICAgICByZXR1cm4gbGkuYXBwZW5kVG8oIHVsICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwidmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb2JqZWN0OiByZXF1aXJlKCcuL29iamVjdCcpLFxyXG4gICAgc3RyaW5nOiByZXF1aXJlKCcuL3N0cmluZycpLFxyXG4gICAgZG9tOiByZXF1aXJlKCcuLy4uL2RvbS9kb20nKSxcclxuICAgIGFwcDogcmVxdWlyZSgnLi9hcHAnKSxcclxuICAgIG1hdGg6IHJlcXVpcmUoJy4vbWF0aCcpLFxyXG4gICAgeG1sIDogcmVxdWlyZSgnLi94bWwnKSxcclxuICAgIGluaGVyaXRzOiB1dGlsLmluaGVyaXRzXHJcbn0iLCIvKipcclxuICogVGhpcyBtb2R1bGUgc2VydmVzIGFzIGFuIHdyYXBwZXIgZm9yIGRvbSBtYW5pcHVsYXRpb24gZnVuY3Rpb25hbGl0eS4gSXQgaXNcclxuICogaGlnaGx5IHByZWZlcmVkIHRvIHVzZSB0aGlzIG1vZHVsZSBpbnN0ZWFkIG9mIGpxdWVyeSBkaXJlY3RseSB3aXRoaW4gb3RoZXJcclxuICogbW9kdWxlcy5cclxuICovXHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuL29iamVjdCcpO1xyXG5cclxudmFyIHBhcnNlRmVhdHVyZVN0cmluZ3MgPSBmdW5jdGlvbih2YWx1ZSwgZGVmYXVsdFZhbCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgnICcpO1xyXG4gICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCBmZWF0dXJlKSB7XHJcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IHBhcnNlRmVhdHVyZVN0cmluZyhmZWF0dXJlLCBkZWZhdWx0VmFsKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBwYXJzZSBhIGZlYXR1cmVzdGlucmcgaW4gdGhlIGZvcm0gb2ZcclxuICogICdmZWF0dXJlbmFtZSgzMCwzMCknIG9yICdmZWF0dXJlbmFtZSgzMC40KSBvciBmZWF0dXJlbmFtZVxyXG4gKlxyXG4gKiBUaGUgcmVzdWx0IGlzIHdvdWxkIGJlXHJcbiAqICAgICAgeyB0eXBlIDogJ2ZlYXR1cmVuYW1lJywgdmFsdWUgOiBbMzAsMzBdIH1cclxuICogICAgICB7IHR5cGUgOiAnZmVhdHVyZW5hbWUnLCB2YWx1ZSA6IDMwLjQgfVxyXG4gKiAgICAgIHsgdHlwZSA6ICdmZWF0dXJlbmFtZScsIHZhbHVlIDogdW5kZWZpbmVkIH1cclxuICogQHBhcmFtIHt0eXBlfSBmZWF0dXJlXHJcbiAqIEByZXR1cm5zIHtBcHBfTDYucGFyc2VGZWF0dXJlU3RyaW5nLnJlc3VsdH1cclxuICovXHJcbnZhciBwYXJzZUZlYXR1cmVTdHJpbmcgPSBmdW5jdGlvbihmZWF0dXJlLCBkZWZhdWx0VmFsKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZihmZWF0dXJlLmluZGV4T2YoJygnKSA+IC0xKSB7XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gZmVhdHVyZS5zcGxpdCgnKCcpO1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0dGVkWzFdLnN1YnN0cmluZygwLCBzcGxpdHRlZFsxXS5pbmRleE9mKCcpJykpO1xyXG5cclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKCcsJykgPiAtMSkgeyAvLyBtdWx0aXBsZSBhcmdzXHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCB2KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZVtpbmRleF0gPSBwYXJzZU51bWJlclN0cmluZyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gc2luZ2xlIGFyZ1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlTnVtYmVyU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0LnR5cGUgPSBzcGxpdHRlZFswXTtcclxuICAgICAgICByZXN1bHQudmFsdWUgPSB2YWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0LnR5cGUgPSBmZWF0dXJlO1xyXG4gICAgICAgIHJlc3VsdC52YWx1ZSA9IGRlZmF1bHRWYWw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIHBhcnNlTnVtYmVyU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCFvYmplY3QuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ3V0IHVuaXRzIDEuMmVtIC0+IDEuMlxyXG4gICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgvKD89W2EteixBLVpdKykvKVswXTtcclxuXHJcbiAgICBpZighaXNOYU4odmFsdWUpKSB7XHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZignLicpID4gLTEpIHsgLy9mbG9hdFxyXG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vaW50XHJcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBjcmVhdGVGZWF0dXJlU3RyaW5nID0gZnVuY3Rpb24oZmVhdHVyZSwgdmFsdWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBmZWF0dXJlO1xyXG5cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9ICcoJztcclxuICAgICAgICBpZihvYmplY3QuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IChpbmRleCAhPT0gMCkgPyAnLCcrdmFsdWUgOiB2YWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgKz0gJyknO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBpc01pbkRpc3QgPSBmdW5jdGlvbihmcm9tLCB0bywgbWluRGlzdCkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKHRvLnggLSBmcm9tLngpID4gbWluRGlzdCB8fCBNYXRoLmFicyh0by55IC0gZnJvbS55KSA+IG1pbkRpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlRmVhdHVyZVN0cmluZzpwYXJzZUZlYXR1cmVTdHJpbmcsXHJcbiAgICBjcmVhdGVGZWF0dXJlU3RyaW5nOmNyZWF0ZUZlYXR1cmVTdHJpbmcsXHJcbiAgICBwYXJzZUZlYXR1cmVTdHJpbmdzOnBhcnNlRmVhdHVyZVN0cmluZ3MsXHJcbiAgICBwYXJzZU51bWJlclN0cmluZyA6IHBhcnNlTnVtYmVyU3RyaW5nLFxyXG4gICAgaXNNaW5EaXN0IDogaXNNaW5EaXN0XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBtb3N0IEJlemllciBoZWxwdGVyIGZ1bmN0aW9ucyBhcmUgdGFrZW4gZnJvbSBqc0JlemllciBsaWJyYXJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9qc3BsdW1iL2pzQmV6aWVyL2Jsb2IvbWFzdGVyL2pzLzAuNi9qc0Jlemllci0wLjYuanNcclxuICogY2hlY2sgL2xpYnMvanNCZXppZXIuanMgZm9yIG1vcmUgZnVuY3Rpb25zIGlmIHJlcXVpcmVkLlxyXG4gKlxyXG4gKlxyXG4gKi9cclxuXHJcbmlmICh0eXBlb2YgTWF0aC5zZ24gPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgTWF0aC5zZ24gPSBmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgIHJldHVybiB4ID09IDAgPyAwIDogeCA+IDAgPyAxIDogLTE7XHJcbiAgICB9O1xyXG59XHJcblxyXG52YXIgVmVjdG9ycyA9IHtcclxuICAgICAgICBzdWJ0cmFjdDogZnVuY3Rpb24gKHYxLCB2Mikge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IHYxLnggLSB2Mi54LCB5OiB2MS55IC0gdjIueX07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkb3RQcm9kdWN0OiBmdW5jdGlvbiAodjEsIHYyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAodjEueCAqIHYyLngpICsgKHYxLnkgKiB2Mi55KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNxdWFyZTogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguc3FydCgodi54ICogdi54KSArICh2LnkgKiB2LnkpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNjYWxlOiBmdW5jdGlvbiAodiwgcykge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IHYueCAqIHMsIHk6IHYueSAqIHN9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgbWF4UmVjdXJzaW9uID0gNjQsXHJcbiAgICBmbGF0bmVzc1RvbGVyYW5jZSA9IE1hdGgucG93KDIuMCwgLW1heFJlY3Vyc2lvbiAtIDEpO1xyXG5cclxuLyoqXHJcbiAqIGZpbmRzIHRoZSBuZWFyZXN0IHBvaW50IG9uIHRoZSBjdXJ2ZSB0byB0aGUgZ2l2ZW4gcG9pbnQuXHJcbiAqL1xyXG52YXIgX25lYXJlc3RQb2ludE9uQ3VydmUgPSBmdW5jdGlvbiAocG9pbnQsIGN1cnZlKSB7XHJcbiAgICB2YXIgdGQgPSBfZGlzdGFuY2VGcm9tQ3VydmUocG9pbnQsIGN1cnZlKTtcclxuICAgIHJldHVybiB7cG9pbnQ6IF9iZXppZXIoY3VydmUsIGN1cnZlLmxlbmd0aCAtIDEsIHRkLmxvY2F0aW9uLCBudWxsLCBudWxsKSwgbG9jYXRpb246IHRkLmxvY2F0aW9ufTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSB0aGF0IHRoZSBwb2ludCBsaWVzIGZyb20gdGhlIGN1cnZlLlxyXG4gKlxyXG4gKiBAcGFyYW0gcG9pbnQgYSBwb2ludCBpbiB0aGUgZm9ybSB7eDo1NjcsIHk6MzM0Mn1cclxuICogQHBhcmFtIGN1cnZlIGEgQmV6aWVyIGN1cnZlIGluIHRoZSBmb3JtIFt7eDouLi4sIHk6Li4ufSwge3g6Li4uLCB5Oi4uLn0sIHt4Oi4uLiwgeTouLi59LCB7eDouLi4sIHk6Li4ufV0uICBub3RlIHRoYXQgdGhpcyBpcyBjdXJyZW50bHlcclxuICogaGFyZGNvZGVkIHRvIGFzc3VtZSBjdWJpeiBiZXppZXJzLCBidXQgd291bGQgYmUgYmV0dGVyIG9mZiBzdXBwb3J0aW5nIGFueSBkZWdyZWUuXHJcbiAqIEByZXR1cm4gYSBKUyBvYmplY3QgbGl0ZXJhbCBjb250YWluaW5nIGxvY2F0aW9uIGFuZCBkaXN0YW5jZSwgZm9yIGV4YW1wbGU6IHtsb2NhdGlvbjowLjM1LCBkaXN0YW5jZToxMH0uICBMb2NhdGlvbiBpcyBhbmFsb2dvdXMgdG8gdGhlIGxvY2F0aW9uXHJcbiAqIGFyZ3VtZW50IHlvdSBwYXNzIHRvIHRoZSBwb2ludE9uUGF0aCBmdW5jdGlvbjogaXQgaXMgYSByYXRpbyBvZiBkaXN0YW5jZSB0cmF2ZWxsZWQgYWxvbmcgdGhlIGN1cnZlLiAgRGlzdGFuY2UgaXMgdGhlIGRpc3RhbmNlIGluIHBpeGVscyBmcm9tXHJcbiAqIHRoZSBwb2ludCB0byB0aGUgY3VydmUuXHJcbiAqL1xyXG52YXIgX2Rpc3RhbmNlRnJvbUN1cnZlID0gZnVuY3Rpb24gKHBvaW50LCBjdXJ2ZSkge1xyXG4gICAgdmFyIGNhbmRpZGF0ZXMgPSBbXSxcclxuICAgICAgICB3ID0gX2NvbnZlcnRUb0Jlemllcihwb2ludCwgY3VydmUpLFxyXG4gICAgICAgIGRlZ3JlZSA9IGN1cnZlLmxlbmd0aCAtIDEsIGhpZ2hlckRlZ3JlZSA9ICgyICogZGVncmVlKSAtIDEsXHJcbiAgICAgICAgbnVtU29sdXRpb25zID0gX2ZpbmRSb290cyh3LCBoaWdoZXJEZWdyZWUsIGNhbmRpZGF0ZXMsIDApLFxyXG4gICAgICAgIHYgPSBWZWN0b3JzLnN1YnRyYWN0KHBvaW50LCBjdXJ2ZVswXSksIGRpc3QgPSBWZWN0b3JzLnNxdWFyZSh2KSwgdCA9IDAuMDtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVNvbHV0aW9uczsgaSsrKSB7XHJcbiAgICAgICAgdiA9IFZlY3RvcnMuc3VidHJhY3QocG9pbnQsIF9iZXppZXIoY3VydmUsIGRlZ3JlZSwgY2FuZGlkYXRlc1tpXSwgbnVsbCwgbnVsbCkpO1xyXG4gICAgICAgIHZhciBuZXdEaXN0ID0gVmVjdG9ycy5zcXVhcmUodik7XHJcbiAgICAgICAgaWYgKG5ld0Rpc3QgPCBkaXN0KSB7XHJcbiAgICAgICAgICAgIGRpc3QgPSBuZXdEaXN0O1xyXG4gICAgICAgICAgICB0ID0gY2FuZGlkYXRlc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2ID0gVmVjdG9ycy5zdWJ0cmFjdChwb2ludCwgY3VydmVbZGVncmVlXSk7XHJcbiAgICBuZXdEaXN0ID0gVmVjdG9ycy5zcXVhcmUodik7XHJcbiAgICBpZiAobmV3RGlzdCA8IGRpc3QpIHtcclxuICAgICAgICBkaXN0ID0gbmV3RGlzdDtcclxuICAgICAgICB0ID0gMS4wO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtsb2NhdGlvbjogdCwgZGlzdGFuY2U6IGRpc3R9O1xyXG59O1xyXG5cclxudmFyIF9jb252ZXJ0VG9CZXppZXIgPSBmdW5jdGlvbiAocG9pbnQsIGN1cnZlKSB7XHJcbiAgICB2YXIgZGVncmVlID0gY3VydmUubGVuZ3RoIC0gMSwgaGlnaGVyRGVncmVlID0gKDIgKiBkZWdyZWUpIC0gMSxcclxuICAgICAgICBjID0gW10sIGQgPSBbXSwgY2RUYWJsZSA9IFtdLCB3ID0gW10sXHJcbiAgICAgICAgeiA9IFtbMS4wLCAwLjYsIDAuMywgMC4xXSwgWzAuNCwgMC42LCAwLjYsIDAuNF0sIFswLjEsIDAuMywgMC42LCAxLjBdXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBkZWdyZWU7IGkrKykgY1tpXSA9IFZlY3RvcnMuc3VidHJhY3QoY3VydmVbaV0sIHBvaW50KTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGRlZ3JlZSAtIDE7IGkrKykge1xyXG4gICAgICAgIGRbaV0gPSBWZWN0b3JzLnN1YnRyYWN0KGN1cnZlW2kgKyAxXSwgY3VydmVbaV0pO1xyXG4gICAgICAgIGRbaV0gPSBWZWN0b3JzLnNjYWxlKGRbaV0sIDMuMCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciByb3cgPSAwOyByb3cgPD0gZGVncmVlIC0gMTsgcm93KyspIHtcclxuICAgICAgICBmb3IgKHZhciBjb2x1bW4gPSAwOyBjb2x1bW4gPD0gZGVncmVlOyBjb2x1bW4rKykge1xyXG4gICAgICAgICAgICBpZiAoIWNkVGFibGVbcm93XSkgY2RUYWJsZVtyb3ddID0gW107XHJcbiAgICAgICAgICAgIGNkVGFibGVbcm93XVtjb2x1bW5dID0gVmVjdG9ycy5kb3RQcm9kdWN0KGRbcm93XSwgY1tjb2x1bW5dKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmb3IgKGkgPSAwOyBpIDw9IGhpZ2hlckRlZ3JlZTsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCF3W2ldKSB3W2ldID0gW107XHJcbiAgICAgICAgd1tpXS55ID0gMC4wO1xyXG4gICAgICAgIHdbaV0ueCA9IHBhcnNlRmxvYXQoaSkgLyBoaWdoZXJEZWdyZWU7XHJcbiAgICB9XHJcbiAgICB2YXIgbiA9IGRlZ3JlZSwgbSA9IGRlZ3JlZSAtIDE7XHJcbiAgICBmb3IgKHZhciBrID0gMDsgayA8PSBuICsgbTsgaysrKSB7XHJcbiAgICAgICAgdmFyIGxiID0gTWF0aC5tYXgoMCwgayAtIG0pLFxyXG4gICAgICAgICAgICB1YiA9IE1hdGgubWluKGssIG4pO1xyXG4gICAgICAgIGZvciAoaSA9IGxiOyBpIDw9IHViOyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGsgLSBpO1xyXG4gICAgICAgICAgICB3W2kgKyBqXS55ICs9IGNkVGFibGVbal1baV0gKiB6W2pdW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB3O1xyXG59O1xyXG4vKipcclxuICogY291bnRzIGhvdyBtYW55IHJvb3RzIHRoZXJlIGFyZS5cclxuICovXHJcbnZhciBfZmluZFJvb3RzID0gZnVuY3Rpb24gKHcsIGRlZ3JlZSwgdCwgZGVwdGgpIHtcclxuICAgIHZhciBsZWZ0ID0gW10sIHJpZ2h0ID0gW10sXHJcbiAgICAgICAgbGVmdF9jb3VudCwgcmlnaHRfY291bnQsXHJcbiAgICAgICAgbGVmdF90ID0gW10sIHJpZ2h0X3QgPSBbXTtcclxuXHJcbiAgICBzd2l0Y2ggKF9nZXRDcm9zc2luZ0NvdW50KHcsIGRlZ3JlZSkpIHtcclxuICAgICAgICBjYXNlIDAgOlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgMSA6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZGVwdGggPj0gbWF4UmVjdXJzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0WzBdID0gKHdbMF0ueCArIHdbZGVncmVlXS54KSAvIDIuMDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChfaXNGbGF0RW5vdWdoKHcsIGRlZ3JlZSkpIHtcclxuICAgICAgICAgICAgICAgIHRbMF0gPSBfY29tcHV0ZVhJbnRlcmNlcHQodywgZGVncmVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9iZXppZXIodywgZGVncmVlLCAwLjUsIGxlZnQsIHJpZ2h0KTtcclxuICAgIGxlZnRfY291bnQgPSBfZmluZFJvb3RzKGxlZnQsIGRlZ3JlZSwgbGVmdF90LCBkZXB0aCArIDEpO1xyXG4gICAgcmlnaHRfY291bnQgPSBfZmluZFJvb3RzKHJpZ2h0LCBkZWdyZWUsIHJpZ2h0X3QsIGRlcHRoICsgMSk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlZnRfY291bnQ7IGkrKykgdFtpXSA9IGxlZnRfdFtpXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmlnaHRfY291bnQ7IGkrKykgdFtpICsgbGVmdF9jb3VudF0gPSByaWdodF90W2ldO1xyXG4gICAgcmV0dXJuIChsZWZ0X2NvdW50ICsgcmlnaHRfY291bnQpO1xyXG59O1xyXG52YXIgX2dldENyb3NzaW5nQ291bnQgPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIG5fY3Jvc3NpbmdzID0gMCwgc2lnbiwgb2xkX3NpZ247XHJcbiAgICBzaWduID0gb2xkX3NpZ24gPSBNYXRoLnNnbihjdXJ2ZVswXS55KTtcclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGRlZ3JlZTsgaSsrKSB7XHJcbiAgICAgICAgc2lnbiA9IE1hdGguc2duKGN1cnZlW2ldLnkpO1xyXG4gICAgICAgIGlmIChzaWduICE9IG9sZF9zaWduKSBuX2Nyb3NzaW5ncysrO1xyXG4gICAgICAgIG9sZF9zaWduID0gc2lnbjtcclxuICAgIH1cclxuICAgIHJldHVybiBuX2Nyb3NzaW5ncztcclxufTtcclxudmFyIF9pc0ZsYXRFbm91Z2ggPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIGVycm9yLFxyXG4gICAgICAgIGludGVyY2VwdF8xLCBpbnRlcmNlcHRfMiwgbGVmdF9pbnRlcmNlcHQsIHJpZ2h0X2ludGVyY2VwdCxcclxuICAgICAgICBhLCBiLCBjLCBkZXQsIGRJbnYsIGExLCBiMSwgYzEsIGEyLCBiMiwgYzI7XHJcbiAgICBhID0gY3VydmVbMF0ueSAtIGN1cnZlW2RlZ3JlZV0ueTtcclxuICAgIGIgPSBjdXJ2ZVtkZWdyZWVdLnggLSBjdXJ2ZVswXS54O1xyXG4gICAgYyA9IGN1cnZlWzBdLnggKiBjdXJ2ZVtkZWdyZWVdLnkgLSBjdXJ2ZVtkZWdyZWVdLnggKiBjdXJ2ZVswXS55O1xyXG5cclxuICAgIHZhciBtYXhfZGlzdGFuY2VfYWJvdmUgPSBtYXhfZGlzdGFuY2VfYmVsb3cgPSAwLjA7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkZWdyZWU7IGkrKykge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IGEgKiBjdXJ2ZVtpXS54ICsgYiAqIGN1cnZlW2ldLnkgKyBjO1xyXG4gICAgICAgIGlmICh2YWx1ZSA+IG1heF9kaXN0YW5jZV9hYm92ZSlcclxuICAgICAgICAgICAgbWF4X2Rpc3RhbmNlX2Fib3ZlID0gdmFsdWU7XHJcbiAgICAgICAgZWxzZSBpZiAodmFsdWUgPCBtYXhfZGlzdGFuY2VfYmVsb3cpXHJcbiAgICAgICAgICAgIG1heF9kaXN0YW5jZV9iZWxvdyA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGExID0gMC4wO1xyXG4gICAgYjEgPSAxLjA7XHJcbiAgICBjMSA9IDAuMDtcclxuICAgIGEyID0gYTtcclxuICAgIGIyID0gYjtcclxuICAgIGMyID0gYyAtIG1heF9kaXN0YW5jZV9hYm92ZTtcclxuICAgIGRldCA9IGExICogYjIgLSBhMiAqIGIxO1xyXG4gICAgZEludiA9IDEuMCAvIGRldDtcclxuICAgIGludGVyY2VwdF8xID0gKGIxICogYzIgLSBiMiAqIGMxKSAqIGRJbnY7XHJcbiAgICBhMiA9IGE7XHJcbiAgICBiMiA9IGI7XHJcbiAgICBjMiA9IGMgLSBtYXhfZGlzdGFuY2VfYmVsb3c7XHJcbiAgICBkZXQgPSBhMSAqIGIyIC0gYTIgKiBiMTtcclxuICAgIGRJbnYgPSAxLjAgLyBkZXQ7XHJcbiAgICBpbnRlcmNlcHRfMiA9IChiMSAqIGMyIC0gYjIgKiBjMSkgKiBkSW52O1xyXG4gICAgbGVmdF9pbnRlcmNlcHQgPSBNYXRoLm1pbihpbnRlcmNlcHRfMSwgaW50ZXJjZXB0XzIpO1xyXG4gICAgcmlnaHRfaW50ZXJjZXB0ID0gTWF0aC5tYXgoaW50ZXJjZXB0XzEsIGludGVyY2VwdF8yKTtcclxuICAgIGVycm9yID0gcmlnaHRfaW50ZXJjZXB0IC0gbGVmdF9pbnRlcmNlcHQ7XHJcbiAgICByZXR1cm4gKGVycm9yIDwgZmxhdG5lc3NUb2xlcmFuY2UpID8gMSA6IDA7XHJcbn07XHJcbnZhciBfY29tcHV0ZVhJbnRlcmNlcHQgPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIFhMSyA9IDEuMCwgWUxLID0gMC4wLFxyXG4gICAgICAgIFhOTSA9IGN1cnZlW2RlZ3JlZV0ueCAtIGN1cnZlWzBdLngsIFlOTSA9IGN1cnZlW2RlZ3JlZV0ueSAtIGN1cnZlWzBdLnksXHJcbiAgICAgICAgWE1LID0gY3VydmVbMF0ueCAtIDAuMCwgWU1LID0gY3VydmVbMF0ueSAtIDAuMCxcclxuICAgICAgICBkZXQgPSBYTk0gKiBZTEsgLSBZTk0gKiBYTEssIGRldEludiA9IDEuMCAvIGRldCxcclxuICAgICAgICBTID0gKFhOTSAqIFlNSyAtIFlOTSAqIFhNSykgKiBkZXRJbnY7XHJcbiAgICByZXR1cm4gMC4wICsgWExLICogUztcclxufTtcclxuXHJcbnZhciBfYmV6aWVyID0gZnVuY3Rpb24gKGN1cnZlLCBkZWdyZWUsIHQsIGxlZnQsIHJpZ2h0KSB7XHJcbiAgICB2YXIgdGVtcCA9IFtbXV07XHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8PSBkZWdyZWU7IGorKykgdGVtcFswXVtqXSA9IGN1cnZlW2pdO1xyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gZGVncmVlOyBpKyspIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8PSBkZWdyZWUgLSBpOyBqKyspIHtcclxuICAgICAgICAgICAgaWYgKCF0ZW1wW2ldKSB0ZW1wW2ldID0gW107XHJcbiAgICAgICAgICAgIGlmICghdGVtcFtpXVtqXSkgdGVtcFtpXVtqXSA9IHt9O1xyXG4gICAgICAgICAgICB0ZW1wW2ldW2pdLnggPSAoMS4wIC0gdCkgKiB0ZW1wW2kgLSAxXVtqXS54ICsgdCAqIHRlbXBbaSAtIDFdW2ogKyAxXS54O1xyXG4gICAgICAgICAgICB0ZW1wW2ldW2pdLnkgPSAoMS4wIC0gdCkgKiB0ZW1wW2kgLSAxXVtqXS55ICsgdCAqIHRlbXBbaSAtIDFdW2ogKyAxXS55O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChsZWZ0ICE9IG51bGwpXHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8PSBkZWdyZWU7IGorKykgbGVmdFtqXSA9IHRlbXBbal1bMF07XHJcbiAgICBpZiAocmlnaHQgIT0gbnVsbClcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDw9IGRlZ3JlZTsgaisrKSByaWdodFtqXSA9IHRlbXBbZGVncmVlIC0gal1bal07XHJcblxyXG4gICAgcmV0dXJuICh0ZW1wW2RlZ3JlZV1bMF0pO1xyXG59O1xyXG5cclxudmFyIF9jdXJ2ZUZ1bmN0aW9uQ2FjaGUgPSB7fTtcclxudmFyIF9nZXRDdXJ2ZUZ1bmN0aW9ucyA9IGZ1bmN0aW9uIChvcmRlcikge1xyXG4gICAgdmFyIGZucyA9IF9jdXJ2ZUZ1bmN0aW9uQ2FjaGVbb3JkZXJdO1xyXG4gICAgaWYgKCFmbnMpIHtcclxuICAgICAgICBmbnMgPSBbXTtcclxuICAgICAgICB2YXIgZl90ZXJtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucG93KHQsIG9yZGVyKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxfdGVybSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnBvdygoMSAtIHQpLCBvcmRlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjX3Rlcm0gPSBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0X3Rlcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uZV9taW51c190X3Rlcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMSAtIHQ7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBfdGVybUZ1bmMgPSBmdW5jdGlvbiAodGVybXMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gMTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlcm1zLmxlbmd0aDsgaSsrKSBwID0gcCAqIHRlcm1zW2ldKHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZm5zLnB1c2gobmV3IGZfdGVybSgpKTsgIC8vIGZpcnN0IGlzIHQgdG8gdGhlIHBvd2VyIG9mIHRoZSBjdXJ2ZSBvcmRlclxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgb3JkZXI7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGVybXMgPSBbbmV3IGNfdGVybShvcmRlcildO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IChvcmRlciAtIGkpOyBqKyspIHRlcm1zLnB1c2gobmV3IHRfdGVybSgpKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpOyBqKyspIHRlcm1zLnB1c2gobmV3IG9uZV9taW51c190X3Rlcm0oKSk7XHJcbiAgICAgICAgICAgIGZucy5wdXNoKG5ldyBfdGVybUZ1bmModGVybXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm5zLnB1c2gobmV3IGxfdGVybSgpKTsgIC8vIGxhc3QgaXMgKDEtdCkgdG8gdGhlIHBvd2VyIG9mIHRoZSBjdXJ2ZSBvcmRlclxyXG5cclxuICAgICAgICBfY3VydmVGdW5jdGlvbkNhY2hlW29yZGVyXSA9IGZucztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZm5zO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIGEgcG9pbnQgb24gdGhlIGN1cnZlLCBmb3IgYSBCZXppZXIgb2YgYXJiaXRyYXJ5IG9yZGVyLlxyXG4gKiBAcGFyYW0gY3VydmUgYW4gYXJyYXkgb2YgY29udHJvbCBwb2ludHMsIGVnIFt7eDoxMCx5OjIwfSwge3g6NTAseTo1MH0sIHt4OjEwMCx5OjEwMH0sIHt4OjEyMCx5OjEwMH1dLiAgRm9yIGEgY3ViaWMgYmV6aWVyIHRoaXMgc2hvdWxkIGhhdmUgZm91ciBwb2ludHMuXHJcbiAqIEBwYXJhbSBsb2NhdGlvbiBhIGRlY2ltYWwgaW5kaWNhdGluZyB0aGUgZGlzdGFuY2UgYWxvbmcgdGhlIGN1cnZlIHRoZSBwb2ludCBzaG91bGQgYmUgbG9jYXRlZCBhdC4gIHRoaXMgaXMgdGhlIGRpc3RhbmNlIGFsb25nIHRoZSBjdXJ2ZSBhcyBpdCB0cmF2ZWxzLCB0YWtpbmcgdGhlIHdheSBpdCBiZW5kcyBpbnRvIGFjY291bnQuICBzaG91bGQgYmUgYSBudW1iZXIgZnJvbSAwIHRvIDEsIGluY2x1c2l2ZS5cclxuICovXHJcbnZhciBfcG9pbnRPblBhdGggPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uKSB7XHJcbiAgICB2YXIgY2MgPSBfZ2V0Q3VydmVGdW5jdGlvbnMoY3VydmUubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgX3ggPSAwLCBfeSA9IDA7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnZlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgX3ggPSBfeCArIChjdXJ2ZVtpXS54ICogY2NbaV0obG9jYXRpb24pKTtcclxuICAgICAgICBfeSA9IF95ICsgKGN1cnZlW2ldLnkgKiBjY1tpXShsb2NhdGlvbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7eDogX3gsIHk6IF95fTtcclxufTtcclxuXHJcbnZhciBfZGlzdCA9IGZ1bmN0aW9uIChwMSwgcDIpIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDEueCAtIHAyLngsIDIpICsgTWF0aC5wb3cocDEueSAtIHAyLnksIDIpKTtcclxufTtcclxuXHJcbnZhciBfaXNQb2ludCA9IGZ1bmN0aW9uIChjdXJ2ZSkge1xyXG4gICAgcmV0dXJuIGN1cnZlWzBdLnggPT0gY3VydmVbMV0ueCAmJiBjdXJ2ZVswXS55ID09IGN1cnZlWzFdLnk7XHJcbn07XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIHBvaW50IHRoYXQgaXMgJ2Rpc3RhbmNlJyBhbG9uZyB0aGUgcGF0aCBmcm9tICdsb2NhdGlvbicuICB0aGlzIG1ldGhvZCByZXR1cm5zIGJvdGggdGhlIHgseSBsb2NhdGlvbiBvZiB0aGUgcG9pbnQgYW5kIGFsc29cclxuICogaXRzICdsb2NhdGlvbicgKHByb3BvcnRpb24gb2YgdHJhdmVsIGFsb25nIHRoZSBwYXRoKTsgdGhlIG1ldGhvZCBiZWxvdyAtIF9wb2ludEFsb25nUGF0aEZyb20gLSBjYWxscyB0aGlzIG1ldGhvZCBhbmQganVzdCByZXR1cm5zIHRoZVxyXG4gKiBwb2ludC5cclxuICovXHJcbnZhciBfcG9pbnRBbG9uZ1BhdGggPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG5cclxuICAgIGlmIChfaXNQb2ludChjdXJ2ZSkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBwb2ludDogY3VydmVbMF0sXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByZXYgPSBfcG9pbnRPblBhdGgoY3VydmUsIGxvY2F0aW9uKSxcclxuICAgICAgICB0YWxseSA9IDAsXHJcbiAgICAgICAgY3VyTG9jID0gbG9jYXRpb24sXHJcbiAgICAgICAgZGlyZWN0aW9uID0gZGlzdGFuY2UgPiAwID8gMSA6IC0xLFxyXG4gICAgICAgIGN1ciA9IG51bGw7XHJcblxyXG4gICAgd2hpbGUgKHRhbGx5IDwgTWF0aC5hYnMoZGlzdGFuY2UpKSB7XHJcbiAgICAgICAgY3VyTG9jICs9ICgwLjAwNSAqIGRpcmVjdGlvbik7XHJcbiAgICAgICAgY3VyID0gX3BvaW50T25QYXRoKGN1cnZlLCBjdXJMb2MpO1xyXG4gICAgICAgIHRhbGx5ICs9IF9kaXN0KGN1ciwgcHJldik7XHJcbiAgICAgICAgcHJldiA9IGN1cjtcclxuICAgIH1cclxuICAgIHJldHVybiB7cG9pbnQ6IGN1ciwgbG9jYXRpb246IGN1ckxvY307XHJcbn07XHJcblxyXG52YXIgX2xlbmd0aCA9IGZ1bmN0aW9uIChjdXJ2ZSkge1xyXG4gICAgaWYgKF9pc1BvaW50KGN1cnZlKSkgcmV0dXJuIDA7XHJcblxyXG4gICAgdmFyIHByZXYgPSBfcG9pbnRPblBhdGgoY3VydmUsIDApLFxyXG4gICAgICAgIHRhbGx5ID0gMCxcclxuICAgICAgICBjdXJMb2MgPSAwLFxyXG4gICAgICAgIGRpcmVjdGlvbiA9IDEsXHJcbiAgICAgICAgY3VyID0gbnVsbDtcclxuXHJcbiAgICB3aGlsZSAoY3VyTG9jIDwgMSkge1xyXG4gICAgICAgIGN1ckxvYyArPSAoMC4wMDUgKiBkaXJlY3Rpb24pO1xyXG4gICAgICAgIGN1ciA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgY3VyTG9jKTtcclxuICAgICAgICB0YWxseSArPSBfZGlzdChjdXIsIHByZXYpO1xyXG4gICAgICAgIHByZXYgPSBjdXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGFsbHk7XHJcbn07XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIHBvaW50IHRoYXQgaXMgJ2Rpc3RhbmNlJyBhbG9uZyB0aGUgcGF0aCBmcm9tICdsb2NhdGlvbicuXHJcbiAqL1xyXG52YXIgX3BvaW50QWxvbmdQYXRoRnJvbSA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gX3BvaW50QWxvbmdQYXRoKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpLnBvaW50O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGZpbmRzIHRoZSBsb2NhdGlvbiB0aGF0IGlzICdkaXN0YW5jZScgYWxvbmcgdGhlIHBhdGggZnJvbSAnbG9jYXRpb24nLlxyXG4gKi9cclxudmFyIF9sb2NhdGlvbkFsb25nUGF0aEZyb20gPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG4gICAgcmV0dXJuIF9wb2ludEFsb25nUGF0aChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKS5sb2NhdGlvbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiByZXR1cm5zIHRoZSBncmFkaWVudCBvZiB0aGUgY3VydmUgYXQgdGhlIGdpdmVuIGxvY2F0aW9uLCB3aGljaCBpcyBhIGRlY2ltYWwgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZS5cclxuICpcclxuICogdGhhbmtzIC8vIGh0dHA6Ly9iaW1peHVhbC5vcmcvQW5pbWF0aW9uTGlicmFyeS9iZXppZXJ0YW5nZW50cy5odG1sXHJcbiAqL1xyXG52YXIgX2dyYWRpZW50QXRQb2ludCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24pIHtcclxuICAgIHZhciBwMSA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgbG9jYXRpb24pLFxyXG4gICAgICAgIHAyID0gX3BvaW50T25QYXRoKGN1cnZlLnNsaWNlKDAsIGN1cnZlLmxlbmd0aCAtIDEpLCBsb2NhdGlvbiksXHJcbiAgICAgICAgZHkgPSBwMi55IC0gcDEueSwgZHggPSBwMi54IC0gcDEueDtcclxuICAgIHJldHVybiBkeSA9PSAwID8gSW5maW5pdHkgOiBNYXRoLmF0YW4oZHkgLyBkeCk7XHJcbn07XHJcblxyXG4vKipcclxuIHJldHVybnMgdGhlIGdyYWRpZW50IG9mIHRoZSBjdXJ2ZSBhdCB0aGUgcG9pbnQgd2hpY2ggaXMgJ2Rpc3RhbmNlJyBmcm9tIHRoZSBnaXZlbiBsb2NhdGlvbi5cclxuIGlmIHRoaXMgcG9pbnQgaXMgZ3JlYXRlciB0aGFuIGxvY2F0aW9uIDEsIHRoZSBncmFkaWVudCBhdCBsb2NhdGlvbiAxIGlzIHJldHVybmVkLlxyXG4gaWYgdGhpcyBwb2ludCBpcyBsZXNzIHRoYW4gbG9jYXRpb24gMCwgdGhlIGdyYWRpZW50IGF0IGxvY2F0aW9uIDAgaXMgcmV0dXJuZWQuXHJcbiAqL1xyXG52YXIgX2dyYWRpZW50QXRQb2ludEFsb25nUGF0aEZyb20gPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG4gICAgdmFyIHAgPSBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSk7XHJcbiAgICBpZiAocC5sb2NhdGlvbiA+IDEpIHAubG9jYXRpb24gPSAxO1xyXG4gICAgaWYgKHAubG9jYXRpb24gPCAwKSBwLmxvY2F0aW9uID0gMDtcclxuICAgIHJldHVybiBfZ3JhZGllbnRBdFBvaW50KGN1cnZlLCBwLmxvY2F0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIGEgbGluZSB0aGF0IGlzICdsZW5ndGgnIHBpeGVscyBsb25nLCBwZXJwZW5kaWN1bGFyIHRvLCBhbmQgY2VudGVyZWQgb24sIHRoZSBwYXRoIGF0ICdkaXN0YW5jZScgcGl4ZWxzIGZyb20gdGhlIGdpdmVuIGxvY2F0aW9uLlxyXG4gKiBpZiBkaXN0YW5jZSBpcyBub3Qgc3VwcGxpZWQsIHRoZSBwZXJwZW5kaWN1bGFyIGZvciB0aGUgZ2l2ZW4gbG9jYXRpb24gaXMgY29tcHV0ZWQgKGllLiB3ZSBzZXQgZGlzdGFuY2UgdG8gemVybykuXHJcbiAqL1xyXG52YXIgX3BlcnBlbmRpY3VsYXJUb1BhdGhBdCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGxlbmd0aCwgZGlzdGFuY2UpIHtcclxuICAgIGRpc3RhbmNlID0gZGlzdGFuY2UgPT0gbnVsbCA/IDAgOiBkaXN0YW5jZTtcclxuICAgIHZhciBwID0gX3BvaW50QWxvbmdQYXRoKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpLFxyXG4gICAgICAgIG0gPSBfZ3JhZGllbnRBdFBvaW50KGN1cnZlLCBwLmxvY2F0aW9uKSxcclxuICAgICAgICBfdGhldGEyID0gTWF0aC5hdGFuKC0xIC8gbSksXHJcbiAgICAgICAgeSA9IGxlbmd0aCAvIDIgKiBNYXRoLnNpbihfdGhldGEyKSxcclxuICAgICAgICB4ID0gbGVuZ3RoIC8gMiAqIE1hdGguY29zKF90aGV0YTIpO1xyXG4gICAgcmV0dXJuIFt7eDogcC5wb2ludC54ICsgeCwgeTogcC5wb2ludC55ICsgeX0sIHt4OiBwLnBvaW50LnggLSB4LCB5OiBwLnBvaW50LnkgLSB5fV07XHJcbn07XHJcblxyXG52YXIgX2NhbGN1bGF0ZVNtb290aENvbnRyb2xQb2ludHMgPSBmdW5jdGlvbihLKSB7XHJcbiAgICB2YXIgcmVzdWx0UDEgPSBbXTtcclxuICAgIHZhciByZXN1bHRQMiA9IFtdO1xyXG4gICAgdmFyIG4gPSBLLmxlbmd0aC0xO1xyXG5cclxuICAgIC8qcmhzIHZlY3RvciBpbml0IGxlZnQgbW9zdCBzZWdtZW50Ki9cclxuICAgIHZhciBhID0gWzBdO1xyXG4gICAgdmFyIGIgPSBbMl07XHJcbiAgICB2YXIgYyA9IFsxXTtcclxuICAgIHZhciByID0gW0tbMF0gKyAyICogS1sxXV07XHJcblxyXG4gICAgLyppbnRlcm5hbCBzZWdtZW50cyovXHJcbiAgICBmb3IoaSA9IDE7IGkgPCBuIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgYVtpXSA9IDE7XHJcbiAgICAgICAgYltpXSA9IDQ7XHJcbiAgICAgICAgY1tpXSA9IDE7XHJcbiAgICAgICAgcltpXSA9IDQgKiBLW2ldICsgMiAqIEtbaSsxXTtcclxuICAgIH1cclxuXHJcbiAgICAvKnJpZ2h0IHNlZ21lbnQqL1xyXG4gICAgYVtuLTFdID0gMjtcclxuICAgIGJbbi0xXSA9IDc7XHJcbiAgICBjW24tMV0gPSAwO1xyXG4gICAgcltuLTFdID0gOCAqIEtbbi0xXSArIEtbbl07XHJcblxyXG4gICAgLypzb2x2ZXMgQXg9YiB3aXRoIHRoZSBUaG9tYXMgYWxnb3JpdGhtKi9cclxuICAgIGZvcihpID0gMTsgaSA8IG47IGkrKykge1xyXG4gICAgICAgIG0gPSBhW2ldIC8gYltpLTFdO1xyXG4gICAgICAgIGJbaV0gPSBiW2ldIC0gbSAqIGNbaSAtIDFdO1xyXG4gICAgICAgIHJbaV0gPSByW2ldIC0gbSAqIHJbaS0xXTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHRQMVtuLTFdID0gcltuLTFdIC8gYltuLTFdO1xyXG4gICAgZm9yIChpID0gbiAtIDI7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgcmVzdWx0UDFbaV0gPSAocltpXSAtIGNbaV0gKiByZXN1bHRQMVtpICsgMV0pIC8gYltpXTtcclxuICAgIH1cclxuXHJcbiAgICAvKndlIGhhdmUgcDEsIG5vdyBjb21wdXRlIHAyKi9cclxuICAgIGZvciAoaSA9IDA7IGkgPCBuIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgcmVzdWx0UDJbaV0gPSAyICogS1tpICsgMV0gLSByZXN1bHRQMVtpICsgMV07XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdWx0UDJbbi0xXSA9IDAuNSAqIChLW25dICsgcmVzdWx0UDFbbi0xXSk7XHJcblxyXG4gICAgcmV0dXJuIHtwMTpyZXN1bHRQMSwgcDI6cmVzdWx0UDJ9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1vdmVzIGEgcG9pbnQgYWxvbmcgdGhlIGdpdmVuIGN1cnZlXHJcbiAqIEBwYXJhbSBjdXJ2ZVxyXG4gKiBAcGFyYW0gZGlzdGFuY2VcclxuICogQHJldHVybnMgeyp8e3gsIHl9fVxyXG4gKi9cclxudmFyIG1vdmVBbG9uZyA9IGZ1bmN0aW9uKGN1cnZlLCBkaXN0YW5jZSkge1xyXG4gICAgLy8gU29tZWhvdyB0aGUgcG9pbnRBbG9uZ1BhdGggY2FsY3VsYXRlcyBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIHNvIHdlIHN3aXRjaCB0aGUgYmFoYXZpb3VyIGJ5IHNldHRpbmdcclxuICAgIC8vIHRoZSBsb2NhdGlvbiB0byAxIChlbmQpIGZvciBwb3NpdGl2ZSBkaXN0YW5jZXMuXHJcbiAgICAvLyBhbmQgbmVnb3RpYXRlIHRoZSBkaXN0YW5jZSB2YWx1ZS5cclxuICAgIHZhciBsb2NhdGlvbiA9IGRpc3RhbmNlID4gMCA/IDEgOiAwO1xyXG4gICAgdmFyIGRpc3RhbmNlID0gZGlzdGFuY2UgKiAtMTtcclxuICAgIHJldHVybiBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsbG9jYXRpb24sIGRpc3RhbmNlKS5wb2ludDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbmVhcmVzdFBvaW50T25DdXJ2ZSA6IF9uZWFyZXN0UG9pbnRPbkN1cnZlLFxyXG4gICAgY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyA6IF9jYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzLFxyXG4gICAgbW92ZUFsb25nIDogbW92ZUFsb25nLFxyXG4gICAgbGVuZ3RoIDogX2xlbmd0aFxyXG59XHJcblxyXG4iLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi9vYmplY3QnKTtcclxudmFyIGJlemllciA9IHJlcXVpcmUoJy4vYmV6aWVyJyk7XHJcblxyXG52YXIgY2FsY0xpbmVJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihwYTEsIHBhMiwgcGIxLCBwYjIpIHtcclxuICAgIHJldHVybiBuZXcgTGluZShwYTEscGEyKS5jYWxjTGluZUludGVyY2VwdChuZXcgTGluZShwYjEscGIyKSk7XHJcbn07XHJcblxyXG52YXIgUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcCA9IGdldFBvaW50KHgseSk7XHJcbiAgICB0aGlzLnggPSBwLng7XHJcbiAgICB0aGlzLnkgPSBwLnk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5JbnRlcnZhbCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIGlzUG9pbnRJbkludGVydmFsKHRoaXMsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5YSW50ZXJ2YWwgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0b2xlcmFuY2UpIHtcclxuICAgIHJldHVybiBfaW5JbnRlcnZhbCh0aGlzLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd4Jyk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5ZSW50ZXJ2YWwgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0b2xlcmFuY2UpIHtcclxuICAgIHJldHVybiBfaW5JbnRlcnZhbCh0aGlzLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd5Jyk7XHJcbn07O1xyXG5cclxudmFyIGlzUG9pbnRJbkludGVydmFsID0gZnVuY3Rpb24ocG9pbnQsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIF9pbkludGVydmFsKHBvaW50LCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd4JykgJiYgX2lzUG9pbnRJbkludGVydmFsKHBvaW50LCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd5Jyk7XHJcbn07XHJcblxyXG52YXIgX2luSW50ZXJ2YWwgPSBmdW5jdGlvbihwLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsIGRpbWVuc2lvbikge1xyXG4gICAgdG9sZXJhbmNlID0gdG9sZXJhbmNlIHx8IDA7XHJcbiAgICB2YXIgYm91bmRhcnkgPSBtaW5NYXgoc3RhcnRbZGltZW5zaW9uXSwgZW5kW2RpbWVuc2lvbl0pO1xyXG4gICAgYm91bmRhcnkubWluIC09IHRvbGVyYW5jZTtcclxuICAgIGJvdW5kYXJ5Lm1heCArPSB0b2xlcmFuY2U7XHJcbiAgICByZXR1cm4gKHBbZGltZW5zaW9uXSA8PSBib3VuZGFyeS5tYXggJiYgcFtkaW1lbnNpb25dID49IGJvdW5kYXJ5Lm1pbik7XHJcbn07XHJcblxyXG52YXIgbWluTWF4ID0gZnVuY3Rpb24odmFsMSwgdmFsMikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBtaW4gOiAgTWF0aC5taW4odmFsMSwgdmFsMiksXHJcbiAgICAgICAgbWF4IDogTWF0aC5tYXgodmFsMSwgdmFsMilcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgTGluZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgLy95ID0gbXggKyB0XHJcbiAgICBpZihwMS54KSB7XHJcbiAgICAgICAgdGhpcy5vcDEgPSBwMTtcclxuICAgICAgICB0aGlzLm9wMiA9IHAyO1xyXG4gICAgICAgIHRoaXMucDEgPSAocDEueCA8PSBwMi54KT8gcDEgOiBwMjtcclxuICAgICAgICB0aGlzLnAyID0gKHAxLnggPiBwMi54KT8gcDEgOiBwMjtcclxuICAgICAgICB0aGlzLm0gPSB0aGlzLmNhbGNHcmFkaWVudCgpO1xyXG4gICAgICAgIHRoaXMudCA9IHRoaXMuY2FsY1lJbnRlcmNlcHQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tID0gcDE7XHJcbiAgICAgICAgdGhpcy50ID0gcDI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjWUludGVyY2VwdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8geSA9IG0gKiB4ICsgdCA9PiB0ID0gLW14ICsgeVxyXG4gICAgcmV0dXJuICgtMSAqIHRoaXMubSAqIHRoaXMucDEueCkgKyB0aGlzLnAxLnk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5nZXRPcnRob2dvbmFsID0gZnVuY3Rpb24ocCkge1xyXG4gICAgLy9cclxuICAgIHZhciBuZXdNID0gLTEgLyB0aGlzLm07XHJcbiAgICB2YXIgdCA9IHAueSAtIChuZXdNICogcC54KTtcclxuICAgIHJldHVybiBuZXcgTGluZShuZXdNLHQpO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY0dyYWRpZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gTGluZS5jYWxjR3JhZGllbnQodGhpcy5wMSwgdGhpcy5wMik7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjTm9ybWFsaXplZExpbmVWZWN0b3IgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBMaW5lLmNhbGNOb3JtYWxpemVkTGluZVZlY3Rvcih0aGlzLnAxLCB0aGlzLnAyKTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmlzTHRSID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcDEueCA8IHRoaXMub3AyLng7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5pc1R0QiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3AxLnkgPCB0aGlzLm9wMi55O1xyXG59O1xyXG5cclxuXHJcbkxpbmUuY2FsY05vcm1hbGl6ZWRMaW5lVmVjdG9yID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICB2YXIgdmVjdG9yID0ge1xyXG4gICAgICAgIHggOiBwMi54IC0gcDEueCxcclxuICAgICAgICB5IDogcDIueSAtIHAxLnlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh2ZWN0b3IueCp2ZWN0b3IueCArIHZlY3Rvci55KnZlY3Rvci55KTtcclxuXHJcbiAgICB2ZWN0b3IueCA9IHZlY3Rvci54IC8gbGVuZ3RoO1xyXG4gICAgdmVjdG9yLnkgPSB2ZWN0b3IueSAvIGxlbmd0aDtcclxuICAgIHJldHVybiB2ZWN0b3I7XHJcbn07XHJcblxyXG4vKlxyXG4gKiAgVE9ETzogdGhpcyBpcyB3b3JraW5nIGlmIHlvdSBwcm92aWRlIHN0YXJ0L2VuZCBhbmQgZGlzdGFuY2UgKG5lZ2F0aXZlIG9yIHBvc2l0aXZlKSBidXQgbm90IHRlc3RlZCAoYW5kIHByZXN1bWFibHkgbm90IHdvcmtpbmcpXHJcbiAqICB3aGVuIGdpdmVuIHN0YXJ0L2VuZCBkaXN0IGFuZCBkaXJlY3Rpb24gZS5nIG1vdmUgZnJvbSBzdGFydCBwb2ludCAtMzAgYmFjay5cclxuICovXHJcbkxpbmUubW92ZUFsb25nID0gZnVuY3Rpb24ocDEscDIsIGRpc3QsIGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHZlY3RvciA9IExpbmUuY2FsY05vcm1hbGl6ZWRMaW5lVmVjdG9yKHAxLHAyKTtcclxuXHJcbiAgICAvL0lmIHRoZXJlIGlzIG5vIGRpcmVjdGlvbiBnaXZlbiB3ZSBoYW5kbGUgbmVnYXRpdmUgZGlzdGFuY2VzIGFzIGRpcmVjdGlvbiAtMSAoZnJvbSBlbmQgdG8gc3RhcnQpXHJcbiAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24gfHwgKGRpc3QgPCAwKSA/IC0xIDogMTtcclxuXHJcbiAgICBpZihkaXJlY3Rpb24gPCAxKSB7XHJcbiAgICAgICAgZGlzdCA9IExpbmUuY2FsY0Rpc3RhbmNlKHAxLHAyKSArIGRpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogcDEueCArIHZlY3Rvci54ICogZGlzdCxcclxuICAgICAgICB5IDogcDEueSArIHZlY3Rvci55ICogZGlzdFxyXG4gICAgfTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLm1vdmVBbG9uZyA9IGZ1bmN0aW9uKGRpc3QsIGRpcmVjdGlvbikge1xyXG4gICAgLy9UT0RPOiBub3RlIHRoaXMgaXMganVzdCB3b3JraW5nIGlmIHdlIGFyZSBpbml0aWF0aW5nIHRoZSBsaW5lIHdpdGggdHdvIHBvaW50cy4uLlxyXG4gICAgcmV0dXJuIExpbmUubW92ZUFsb25nKHRoaXMucDEsIHRoaXMucDIsIGRpc3QsIGRpcmVjdGlvbik7XHJcbn07XHJcblxyXG5MaW5lLmNhbGNHcmFkaWVudCA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIChwMi55IC0gcDEueSkgLyAocDIueCAtIHAxLngpO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY0ZYID0gZnVuY3Rpb24oeCkge1xyXG4gICAgdmFyIHkgPSAodGhpcy5tKSAqIHggKyB0aGlzLnQ7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB4LFxyXG4gICAgICAgIHkgOiB5XHJcbiAgICB9O1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY01pZFBvaW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gTGluZS5jYWxjTWlkUG9pbnQodGhpcy5wMSwgdGhpcy5wMik7XHJcbn07XHJcblxyXG5MaW5lLmNhbGNNaWRQb2ludCA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogKHAxLngrcDIueCkgLyAyLFxyXG4gICAgICAgIHkgOiAocDEueStwMi55KSAvIDJcclxuICAgIH07XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5pc1ZlcnRpY2FsID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuICFpc0Zpbml0ZSh0aGlzLm0pO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuaXNIb3Jpem9udGFsID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIHRoaXMubSA9PT0gMDtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmNhbGNMaW5lSW50ZXJjZXB0ID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgIC8vbXgoMSkgKyB0KDEpID0gbXgoMikgK3QoMilcclxuICAgIHZhciBtID0gb3RoZXIubSArICgtMSAqIHRoaXMubSk7XHJcbiAgICB2YXIgdCA9IHRoaXMudCArICgtMSAqIG90aGVyLnQpO1xyXG4gICAgdmFyIHggPSAobSAhPT0gMCkgPyB0IC8gbSA6IHQ7XHJcbiAgICByZXR1cm4gdGhpcy5jYWxjRlgoeCk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihwKSB7XHJcbiAgICByZXR1cm4gTGluZS5nZXROZWFyZXN0UG9pbnQodGhpcy5wMSwgdGhpcy5wMiwgcCk7XHJcbn07XHJcblxyXG5MaW5lLmdldE5lYXJlc3RQb2ludCA9IGZ1bmN0aW9uKGEsIGIsIHApIHtcclxuICAgIHZhciBBUCA9IFtwLnggLSBhLngsIHAueSAtIGEueV07IC8vIHZlY3RvciBBLT5QXHJcbiAgICB2YXIgQUIgPSBbYi54IC0gYS54LCBiLnkgLSBhLnldOyAvLyB2ZWN0b3IgQS0+QlxyXG4gICAgdmFyIG1hZ25pdHVkZSA9IEFCWzBdICogQUJbMF0gKyBBQlsxXSAqIEFCWzFdIC8vQUIuTGVuZ3RoU3F1YXJlZFxyXG5cclxuICAgIHZhciBBUF9ET1RfQUIgPSBBUFswXSAqIEFCWzBdICsgQVBbMV0gKiBBQlsxXTtcclxuXHJcbiAgICB2YXIgZGlzdGFuY2UgPSBBUF9ET1RfQUIgLyBtYWduaXR1ZGU7XHJcblxyXG4gICAgaWYoZGlzdGFuY2UgPCAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGE7XHJcbiAgICB9IGVsc2UgaWYgKGRpc3RhbmNlID4gMSkge1xyXG4gICAgICAgIHJldHVybiBiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBhLnggKyBBQlswXSAqIGRpc3RhbmNlLFxyXG4gICAgICAgICAgICB5OiBhLnkgKyBBQlsxXSAqIGRpc3RhbmNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuTGluZS5jYWxjRGlzdGFuY2UgPSBmdW5jdGlvbihwMSwgcDIpIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coKHAyLnkgLSBwMS55KSwyKSArIE1hdGgucG93KChwMi54IC0gcDEueCksMikpO1xyXG59XHJcblxyXG52YXIgU2ltcGxlVmVjdG9yID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbn07XHJcblxyXG5TaW1wbGVWZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHRoYXQpIHtcclxuICAgIHJldHVybiB0aGlzLngqdGhhdC54ICsgdGhpcy55KnRoYXQueTtcclxufTtcclxuXHJcblNpbXBsZVZlY3Rvci5mcm9tUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICByZXR1cm4gbmV3IFNpbXBsZVZlY3RvcihcclxuICAgICAgICBwMi54IC0gcDEueCxcclxuICAgICAgICBwMi55IC0gcDEueVxyXG4gICAgKTtcclxufTtcclxuXHJcblNpbXBsZVZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih0aGF0KSB7XHJcbiAgICByZXR1cm4gbmV3IFNpbXBsZVZlY3Rvcih0aGlzLnggLSB0aGF0LngsIHRoaXMueSAtIHRoYXQueSk7XHJcbn07XHJcblxyXG52YXIgRWxsaXBzZSA9IGZ1bmN0aW9uKGN4LCBjeSwgcngsIHJ5KSB7XHJcbiAgICBzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgdGhpcy5jID0ge3g6Y3gseTpjeX07XHJcbiAgICAgICAgICAgIHRoaXMucnggPSByeDtcclxuICAgICAgICAgICAgdGhpcy5yeSA9IHJ5O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIHRoaXMuYyA9IGN4O1xyXG4gICAgICAgICAgICB0aGlzLnJ4ID0gY3k7XHJcbiAgICAgICAgICAgIHRoaXMucnkgPSByeDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5jYWxjTGluZUludGVyY2VwdCA9IGZ1bmN0aW9uKHAxLHAyKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHAyID0gcDEucDI7XHJcbiAgICAgICAgcDEgPSBwMS5wMTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb3JpZ2luID0gbmV3IFNpbXBsZVZlY3RvcihwMS54LCBwMS55KTtcclxuICAgIHZhciBkaXIgPSBTaW1wbGVWZWN0b3IuZnJvbVBvaW50cyhwMSwgcDIpO1xyXG4gICAgdmFyIGNlbnRlciA9IG5ldyBTaW1wbGVWZWN0b3IodGhpcy5jLngsIHRoaXMuYy55KTtcclxuICAgIHZhciBkaWZmID0gb3JpZ2luLnN1YnRyYWN0KGNlbnRlcik7XHJcbiAgICB2YXIgbURpciA9IG5ldyBTaW1wbGVWZWN0b3IoZGlyLngvKHRoaXMucngqdGhpcy5yeCksICBkaXIueS8odGhpcy5yeSp0aGlzLnJ5KSk7XHJcbiAgICB2YXIgbURpZmYgPSBuZXcgU2ltcGxlVmVjdG9yKGRpZmYueC8odGhpcy5yeCp0aGlzLnJ4KSwgZGlmZi55Lyh0aGlzLnJ5KnRoaXMucnkpKTtcclxuXHJcbiAgICB2YXIgYURpZmYgPSBkaXIuZG90KG1EaXIpO1xyXG4gICAgdmFyIGJEaWZmID0gZGlyLmRvdChtRGlmZik7XHJcbiAgICB2YXIgY0RpZmYgPSBkaWZmLmRvdChtRGlmZikgLSAxLjA7XHJcbiAgICB2YXIgZERpZmYgPSBiRGlmZipiRGlmZiAtIGFEaWZmKmNEaWZmO1xyXG5cclxuICAgIGlmIChkRGlmZiA+IDApIHtcclxuICAgICAgICB2YXIgcm9vdCA9IE1hdGguc3FydChkRGlmZik7XHJcbiAgICAgICAgdmFyIHRBICA9ICgtYkRpZmYgLSByb290KSAvIGFEaWZmO1xyXG4gICAgICAgIHZhciB0QiAgPSAoLWJEaWZmICsgcm9vdCkgLyBhRGlmZjtcclxuXHJcbiAgICAgICAgaWYgKCEoKHRBIDwgMCB8fCAxIDwgdEEpICYmICh0QiA8IDAgfHwgMSA8IHRCKSkpIHtcclxuICAgICAgICAgICAgaWYgKDAgPD0gdEEgJiYgdEEgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMSwgcDIsIHRBKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCAwIDw9IHRCICYmIHRCIDw9IDEgKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsZXJwKHAxLCBwMiwgdEIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHQgPSAtYkRpZmYvYURpZmY7XHJcbiAgICAgICAgaWYgKDAgPD0gdCAmJiB0IDw9IDEpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMS4gYTIsIHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLm92ZXJsYXlzID0gZnVuY3Rpb24ocCkge1xyXG4gICAgdmFyIGJ4ID0gTWF0aC5wb3coKHAueCAtIHRoaXMuYy54KSwgMikgLyBNYXRoLnBvdyh0aGlzLnJ4LCAyKTtcclxuICAgIHZhciBieSA9IE1hdGgucG93KChwLnkgLSB0aGlzLmMueSksIDIpIC8gTWF0aC5wb3codGhpcy5yeSwgMik7XHJcbiAgICByZXR1cm4gYnggKyBieSA8PSAxXHJcbn07XHJcblxyXG52YXIgQ2lyY2xlID0gZnVuY3Rpb24oY3gsIGN5LCByKSB7XHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgdGhpcy5jID0gY3g7XHJcbiAgICAgICAgdGhpcy5yID0gY3k7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYyA9IHt4OiBjeCwgeSA6IGN5fTtcclxuICAgICAgICB0aGlzLnIgPSByO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQ2lyY2xlLnByb3RvdHlwZS5vdmVybGF5cyA9IGZ1bmN0aW9uKHApIHtcclxuICAgIHZhciBieCA9IE1hdGgucG93KChwLnggLSB0aGlzLmMueCksIDIpO1xyXG4gICAgdmFyIGJ5ID0gTWF0aC5wb3coKHAueSAtIHRoaXMuYy55KSwgMik7XHJcbiAgICByZXR1cm4gYnggKyBieSA8IE1hdGgucG93KHRoaXMuciwgMik7XHJcbn07XHJcblxyXG5DaXJjbGUucHJvdG90eXBlLmNhbGNMaW5lSW50ZXJjZXB0ID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHAyID0gcDEucDI7XHJcbiAgICAgICAgcDEgPSBwMS5wMTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYSA9IChwMi54IC0gcDEueCkgKiAocDIueCAtIHAxLngpXHJcbiAgICAgICAgKyAocDIueSAtIHAxLnkpICogKHAyLnkgLSBwMS55KTtcclxuICAgIHZhciBiICA9IDIgKiAoKHAyLnggLSBwMS54KSAqIChwMS54IC0gdGhpcy5jLngpXHJcbiAgICAgICAgKyAocDIueSAtIHAxLnkpICogKHAxLnkgLSB0aGlzLmMueSkgICApO1xyXG4gICAgdmFyIGNjID0gdGhpcy5jLngqdGhpcy5jLnggKyB0aGlzLmMueSp0aGlzLmMueSArIHAxLngqcDEueCArIHAxLnkqcDEueSAtXHJcbiAgICAgICAgMiAqICh0aGlzLmMueCAqIHAxLnggKyB0aGlzLmMueSAqIHAxLnkpIC0gdGhpcy5yKnRoaXMucjtcclxuICAgIHZhciBkZXRlciA9IGIqYiAtIDQqYSpjYztcclxuXHJcbiAgICBpZihkZXRlciA+IDApIHtcclxuICAgICAgICB2YXIgcm9vdCAgPSBNYXRoLnNxcnQoZGV0ZXIpO1xyXG4gICAgICAgIHZhciB0QSA9ICgtYiArIHJvb3QpIC8gKDIqYSk7XHJcbiAgICAgICAgdmFyIHRCID0gKC1iIC0gcm9vdCkgLyAoMiphKTtcclxuXHJcbiAgICAgICAgaWYgKCEoKHRBIDwgMCB8fCB0QSA+IDEpICYmICh0QiA8IDAgfHwgdEIgPiAxKSkpIHtcclxuICAgICAgICAgICAgaWYgKDAgPD0gdEEgJiYgdEEgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMSwgcDIsIHRBKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICgwIDw9IHRCICYmIHRCIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxlcnAocDEsIHAyLCB0QikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBsZXJwID0gZnVuY3Rpb24oYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogYS54ICsgKGIueCAtIGEueCkgKiB0LFxyXG4gICAgICAgIHkgOiBhLnkgKyAoYi55IC0gYS55KSAqIHRcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgVmVjdG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnZlY3RvcnMgPSBbXTtcclxuICAgIHZhciBjdXJyZW50QXJyO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0FycmF5KGFyZ3VtZW50c1tpXSkpIHtcclxuICAgICAgICAgICAgaWYoY3VycmVudEFycikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGQoY3VycmVudEFycik7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50QXJyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3VycmVudEFyciA9IGN1cnJlbnRBcnIgfHwgW107XHJcbiAgICAgICAgICAgIGN1cnJlbnRBcnIucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYoY3VycmVudEFycikge1xyXG4gICAgICAgIHRoaXMuYWRkKGN1cnJlbnRBcnIpO1xyXG4gICAgICAgIGRlbGV0ZSBjdXJyZW50QXJyO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB2ZWN0b3IgdmFsdWUgZWl0aGVyIGJ5IHByb3ZpZGluZyBzZXBlcmF0ZWQgYXJndW1lbnRzIG9yIGFuIGFycmF5IG9mIHZhbHVlc1xyXG4gKi9cclxuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciB2YWx1ZTtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgdmFsdWUgPSBbXTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlLnB1c2goYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHZhbHVlID0gYXJndW1lbnRzWzBdO1xyXG4gICAgfVxyXG4gICAgdGhpcy52ZWN0b3JzLnB1c2godmFsdWUpO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcGF0aCA9IG9iamVjdC5pc0FycmF5KGFyZ3VtZW50c1swXSkgPyBhcmd1bWVudHNbMF0gOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG4gICAgICAgIHJldHVybiBnZXRWZWN0b3JWYWx1ZSh0aGlzLnZlY3RvcnMsIHBhdGgpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignZ2V0IHZhbHVlIHZlY3RvciBmYWlsZWQgLSAnK3RoaXMudmVjdG9ycysnIGFyZ3M6ICcrYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcblZlY3Rvci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudmVjdG9ycyA9IFtdO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHBhdGhBcnIsIHZhbHVlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHBhdGhBcnIgPSAhb2JqZWN0LmlzQXJyYXkocGF0aEFycikgPyBbcGF0aEFycl0gOiBwYXRoQXJyO1xyXG4gICAgICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aEFyci5zcGxpY2UoMCwgcGF0aEFyci5sZW5ndGggLTEpO1xyXG4gICAgICAgIHRoaXMudmFsdWUocGFyZW50UGF0aClbcGF0aEFycltwYXRoQXJyLmxlbmd0aCAtMV1dID0gdmFsdWU7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdzZXQgdmFsdWUgdmVjdG9yIGZhaWxlZCAtICcrdGhpcy52ZWN0b3JzKycgYXJnczogJythcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihwYXRoQXJyLCB2YWx1ZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBwYXRoQXJyID0gIW9iamVjdC5pc0FycmF5KHBhdGhBcnIpID8gW3BhdGhBcnJdIDogcGF0aEFycjtcclxuICAgICAgICB2YXIgcGFyZW50UGF0aCA9IHBhdGhBcnIuc3BsaWNlKDAsIHBhdGhBcnIubGVuZ3RoIC0xKTtcclxuICAgICAgICB0aGlzLnZhbHVlKHBhcmVudFBhdGgpLnNwbGljZShwYXRoQXJyW3BhdGhBcnIubGVuZ3RoIC0xXSwgMCwgdmFsdWUpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignc2V0IHZhbHVlIHZlY3RvciBmYWlsZWQgLSAnK3RoaXMudmVjdG9ycysnIGFyZ3M6ICcrYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcblZlY3Rvci5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3JzLmxlbmd0aDtcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihwYXRoQXJyKSB7XHJcbiAgICBwYXRoQXJyID0gIW9iamVjdC5pc0FycmF5KHBhdGhBcnIpID8gW3BhdGhBcnJdIDogcGF0aEFycjtcclxuICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aEFyci5zcGxpY2UoMCwgcGF0aEFyci5sZW5ndGggLTEpO1xyXG4gICAgdGhpcy52YWx1ZShwYXJlbnRQYXRoKS5zcGxpY2UocGF0aEFycltwYXRoQXJyLmxlbmd0aCAtMV0sIDEpO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3JzW3RoaXMudmVjdG9ycy5sZW5ndGggLTFdO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24oaGFuZGxlcikge1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy52ZWN0b3JzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBoYW5kbGVyKGluZGV4LHZhbHVlKTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5vdGUgdGhlIGluZGV4ZXMgY2FuIGJlIG5lZ2F0aXZlIHRvIHJldHJpZXZlIHZhbHVlcyBmcm9tIHRoZSBlbmQgb2YgdGhlIHZlY3RvciBlLmcuIC0xIGlzIHRoZSBsYXN0XHJcbiAqIEBwYXJhbSB2ZWN0b3JBcnJcclxuICogQHBhcmFtIGFyZ3NcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG52YXIgZ2V0VmVjdG9yVmFsdWUgPSBmdW5jdGlvbih2ZWN0b3JBcnIsIGFyZ3MpIHtcclxuICAgIGlmKCFhcmdzKSB7XHJcbiAgICAgICAgcmV0dXJuIHZlY3RvckFycjtcclxuICAgIH1lbHNlIGlmKG9iamVjdC5pc0FycmF5KGFyZ3MpKSB7XHJcbiAgICAgICAgc3dpdGNoKGFyZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB2ZWN0b3JBcnI7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3QudmFsdWVCeUluZGV4KHZlY3RvckFyciwgYXJnc1swXSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFZlY3RvclZhbHVlKHZlY3RvckFycltpbmRleF0sIGFyZ3Muc3BsaWNlKDEpKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBvYmplY3QudmFsdWVCeUluZGV4KHZlY3RvckFyciwgYXJncyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gc291cmNlIGFuZCB0YXJnZXQgdmFsdWUgaXMgbG93ZXIgdGhhbiB0aGUgZ2l2ZW4gcmFuZ2UgdmFsdWVcclxuICovXHJcbnZhciBjaGVja1JhbmdlRGlmZiA9IGZ1bmN0aW9uKHNvdXJjZSwgdGFyZ2V0LCByYW5nZSkge1xyXG4gICAgcmV0dXJuIGlzSW5EaWZmUmFuZ2UodGFyZ2V0LCBzb3VyY2UsIHJhbmdlKTtcclxufTtcclxuXHJcbnZhciBpc0luRGlmZlJhbmdlID0gZnVuY3Rpb24ocDEsIHAyLCByYW5nZSkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKHAxIC0gcDIpIDwgcmFuZ2U7XHJcbn07XHJcblxyXG52YXIgZ2V0UG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoeCAmJiBvYmplY3QuaXNEZWZpbmVkKHgueCkgJiYgb2JqZWN0LmlzRGVmaW5lZCh4LnkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0geDtcclxuICAgIH0gZWxzZSBpZighaXNOYU4oeCkgJiYgIWlzTmFOKHkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICB4IDogeCxcclxuICAgICAgICAgICAgeSA6IHlcclxuICAgICAgICB9O1xyXG4gICAgfSBlbHNlIGlmKG9iamVjdC5pc0RlZmluZWQoeCkgJiYgb2JqZWN0LmlzRGVmaW5lZCh5KSkge1xyXG4gICAgICAgIHJlc3VsdCA9IHRvUG9pbnQoeCx5KTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgdG9Qb2ludCA9IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgeCA9IChvYmplY3QuaXNTdHJpbmcoeCkpID8gcGFyc2VGbG9hdCh4KSA6IHg7XHJcbiAgICB5ID0gKG9iamVjdC5pc1N0cmluZyh5KSkgPyBwYXJzZUZsb2F0KHkpIDogeTtcclxuXHJcbiAgICByZXR1cm4ge3g6eCx5Onl9O1xyXG59O1xyXG5cclxudmFyIHRvUmFkaWFucyA9IGZ1bmN0aW9uIChhbmdsZSkge1xyXG4gICAgcmV0dXJuIGFuZ2xlICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxudmFyIHRvRGVncmVlcyA9IGZ1bmN0aW9uKGFuZ2xlKSB7XHJcbiAgICByZXR1cm4gYW5nbGUgKiAoMTgwIC8gTWF0aC5QSSk7XHJcbn07XHJcblxyXG52YXIgcm90YXRlID0gZnVuY3Rpb24ocCwgcm90Q2VudGVyLCBhbmdsZSkge1xyXG4gICAgaWYoYW5nbGUgPT09IDAgfHwgKHAueCA9PT0gcm90Q2VudGVyLnggJiYgcC55ID09PSByb3RDZW50ZXIueSkpIHtcclxuICAgICAgICByZXR1cm4gcDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcm90YXRlZCA9IHt9O1xyXG4gICAgdmFyIHJhZCA9IHRvUmFkaWFucyhhbmdsZSk7XHJcbiAgICByb3RhdGVkLnggPSAocC54IC0gcm90Q2VudGVyLngpICogTWF0aC5jb3MocmFkKSAtIChwLnkgLSByb3RDZW50ZXIueSkgKiBNYXRoLnNpbihyYWQpICsgcm90Q2VudGVyLng7XHJcbiAgICByb3RhdGVkLnkgPSAocC55IC0gcm90Q2VudGVyLnkpICogTWF0aC5jb3MocmFkKSArIChwLnggLSByb3RDZW50ZXIueCkgKiBNYXRoLnNpbihyYWQpICsgcm90Q2VudGVyLnk7XHJcbiAgICBwLnggPSByb3RhdGVkLng7XHJcbiAgICBwLnkgPSByb3RhdGVkLnk7XHJcbiAgICByZXR1cm4gcDtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNhbGNMaW5lSW50ZXJzZWN0aW9uIDogY2FsY0xpbmVJbnRlcnNlY3Rpb24sXHJcbiAgICBMaW5lIDogTGluZSxcclxuICAgIENpcmNsZSA6IENpcmNsZSxcclxuICAgIEVsbGlwc2UgOiBFbGxpcHNlLFxyXG4gICAgVmVjdG9yIDogVmVjdG9yLFxyXG4gICAgUG9pbnQgOiBQb2ludCxcclxuICAgIGlzUG9pbnRJbkludGVydmFsIDogaXNQb2ludEluSW50ZXJ2YWwsXHJcbiAgICBtaW5NYXggOiBtaW5NYXgsXHJcbiAgICBjaGVja1JhbmdlRGlmZiA6IGNoZWNrUmFuZ2VEaWZmLFxyXG4gICAgZ2V0UG9pbnQgOiBnZXRQb2ludCxcclxuICAgIGJlemllciA6IGJlemllcixcclxuICAgIHRvUmFkaWFucyA6IHRvUmFkaWFucyxcclxuICAgIHRvRGVncmVlcyA6IHRvRGVncmVlcyxcclxuICAgIHJvdGF0ZSA6IHJvdGF0ZVxyXG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZWFjaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICQuZWFjaChhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ3JlcDogZnVuY3Rpb24oYXJyLCBmaWx0ZXIsIGludmVydCkge1xyXG4gICAgICAgIHJldHVybiAkLmdyZXAoYXJyLCBmaWx0ZXIsIGludmVydCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzT25lT2Y6IGZ1bmN0aW9uKHNlYXJjaCkge1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIGZvcihpID0gMTtpIDwgYXJndW1lbnRzLmxlbmd0aDtpKyspIHtcclxuICAgICAgICAgIGlmKHNlYXJjaCA9PT0gYXJndW1lbnRzW2ldKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNBcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQuaXNBcnJheShvYmopO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5IDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbdmFsdWVdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVGcm9tQXJyYXk6IGZ1bmN0aW9uKGFyciwgaXRlbSkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IGFyci5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIGlmKGluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHNpemU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHZhciBzaXplID0gMCwga2V5O1xyXG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHNpemUrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpemU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKG9iaiwgc29ydCkge1xyXG4gICAgICAgIHZhciBhcnI7XHJcbiAgICAgICAgaWYoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG9iajtcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgICAgIGFyciA9ICQubWFwKG9iaiwgZnVuY3Rpb24gKGluZGV4LCB2YWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyLnNvcnQoc29ydCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbHVlQnlJbmRleDogZnVuY3Rpb24oYXJyLCBpbmRleCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoYXJyLGluZGV4KTtcclxuICAgICAgICByZXR1cm4gYXJyW2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5kZXg6IGZ1bmN0aW9uKGFyciwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gaW5kZXg7XHJcbiAgICAgICAgLy8gZm9yIG5lZ2F0aXZlIGluZGV4ZXMgd2UgcmV0dXJuIHZhbHVlcyBjb3VudGVkIGZyb20gdGhlIG90aGVyIHNpZGUgc28gLTEgaXMgdGhlIGxhc3QgaW5kZXhcclxuICAgICAgICAvLyBpZiB0aGUgbmVnYXRpdmUgaW5kZXggaXMgb3V0IG9mIHJhbmdlIHdlIHJldHVybiB0aGUgbGFzdCBpbmRleC5cclxuICAgICAgICBpZihpbmRleCA8IDApIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gYXJyLmxlbmd0aCArIGluZGV4O1xyXG4gICAgICAgICAgICByZXN1bHQgPSAocmVzdWx0ID4gYXJyLmxlbmd0aCAtMSB8fCByZXN1bHQgPCAwKSA/IGFyci5sZW5ndGggLTEgOiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzRnVuY3Rpb246IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcclxuICAgIH0sXHJcblxyXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiAkLmlzUGxhaW5PYmplY3Qob2JqKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNKUXVlcnk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiBvYmouanF1ZXJ5O1xyXG4gICAgfSxcclxuXHJcbiAgICBpc1N0cmluZzogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdzdHJpbmcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc051bWJlcjogZnVuY3Rpb24obikge1xyXG4gICAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbGVhbjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdib29sZWFuJztcclxuICAgIH0sXHJcblxyXG4gICAgaXNEZWZpbmVkOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZihhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGF0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogIT09ICd1bmRlZmluZWQnO1xyXG4gICAgfSxcclxuXHJcbiAgICBtZXJnZTogZnVuY3Rpb24odGFyZ2V0LCB0b01lcmdlKSB7XHJcbiAgICAgICAgcmV0dXJuICQubWVyZ2UodGFyZ2V0LCB0b01lcmdlKTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIGFkZFZhbHVlOiBmdW5jdGlvbih0YXJnZXQsIG5ld1ZhbCkge1xyXG4gICAgICAgIGlmKGlzQXJyYXkobmV3VmFsKSkge1xyXG4gICAgICAgICAgICBtZXJnZSh0YXJnZXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKG5ld1ZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKHRhcmdldCwgb2JqMSwgb2JqMikge1xyXG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0YXJnZXQsb2JqMSxvYmoyKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmVBcnJheTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyci5zbGljZSgwKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmVPYmplY3Q6IGZ1bmN0aW9uKG9sZE9iamVjdCwgZGVlcCkge1xyXG4gICAgICAgIGRlZXAgPSBkZWVwIHx8IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiAkLmV4dGVuZChkZWVwLCB7fSwgb2xkT2JqZWN0KTtcclxuICAgIH1cclxuICAgIFxyXG59OyIsInZhciBvYmplY3QgPSByZXF1aXJlKCcuL29iamVjdCcpO1xyXG5cclxuZXhwb3J0cy5lbmRzV2l0aCA9IGZ1bmN0aW9uKHZhbCwgc3VmZml4KSB7XHJcbiAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWwpIHx8ICFvYmplY3QuaXNEZWZpbmVkKHN1ZmZpeCkpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsLmluZGV4T2Yoc3VmZml4LCB2YWwubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgIT09IC0xO1xyXG59O1xyXG5cclxuZXhwb3J0cy5jdXRwcmVmaXggPSBmdW5jdGlvbih2YWwsIHN1ZmZpeCkge1xyXG4gICByZXR1cm4gdmFsLnN1YnN0cmluZygnc3VmZml4Jy5sZW5ndGgsIHZhbC5sZW5ndGgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5zdGFydHNXaXRoID0gZnVuY3Rpb24odmFsLCBwcmVmaXgpIHtcclxuICAgIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbCkgfHwgIW9iamVjdC5pc0RlZmluZWQocHJlZml4KSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWwuaW5kZXhPZihwcmVmaXgpID09PSAwO1xyXG59OyIsInZhciBzdHJpbmcgPSByZXF1aXJlKCcuL3N0cmluZycpO1xyXG5cclxudmFyIHNlcmlhbGl6ZVRvU3RyaW5nID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgdmFyIHMgPSBuZXcgWE1MU2VyaWFsaXplcigpO1xyXG4gICAgbm9kZSA9IChub2RlLmpRdWVyeSkgPyBub2RlWzBdIDogbm9kZTtcclxuICAgIHJldHVybiBzLnNlcmlhbGl6ZVRvU3RyaW5nKG5vZGUpO1xyXG59O1xyXG5cclxudmFyIHBhcnNlWE1MID0gZnVuY3Rpb24oc3RyRGF0YSkge1xyXG4gICAgcmV0dXJuICQucGFyc2VYTUwoc3RyRGF0YSk7XHJcbn07XHJcblxyXG52YXIgZm9ybWF0ID0gZnVuY3Rpb24gKHhtbCkge1xyXG4gICAgdmFyIGludGVuZCA9IC0xO1xyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xyXG4gICAgeG1sID0geG1sLnJlcGxhY2UoLyhcXHJcXG58XFxufFxccikvZ20sXCJcIik7XHJcbiAgICB2YXIgbGFzdFdhc0Nsb3NlID0gZmFsc2U7XHJcbiAgICB2YXIgbGFzdEhhZFRleHQgPSBmYWxzZTtcclxuICAgICQuZWFjaCh4bWwuc3BsaXQoJzwnKSwgZnVuY3Rpb24oaW5kZXgsIG5vZGUpIHtcclxuICAgICAgICBub2RlID0gbm9kZS50cmltKCk7XHJcbiAgICAgICAgaWYobm9kZSkge1xyXG4gICAgICAgICAgICBpZihub2RlLmluZGV4T2YoJy8nKSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYoIWxhc3RXYXNDbG9zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGludGVuZCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxhc3RIYWRUZXh0ID0gIXN0cmluZy5lbmRzV2l0aChub2RlLCAnPicpO1xyXG4gICAgICAgICAgICAgICAgbGFzdFdhc0Nsb3NlID0gc3RyaW5nLmVuZHNXaXRoKG5vZGUsICcvPicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYoIWxhc3RIYWRUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFdhc0Nsb3NlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpbnRlbmQtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxhc3RIYWRUZXh0ID0gIXN0cmluZy5lbmRzV2l0aChub2RlLCAnPicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFkZGluZyA9ICcnO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGludGVuZDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nICs9ICcgICc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB0ZXh0O1xyXG4gICAgICAgICAgICBpZihsYXN0SGFkVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNwbGl0dGVkID0gbm9kZS5zcGxpdCgnPicpO1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHNwbGl0dGVkWzBdICsgJz4nO1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHNwbGl0dGVkWzFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBwYWRkaW5nICsgJzwnK25vZGUrJ1xcclxcbic7XHJcblxyXG4gICAgICAgICAgICBpZih0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gcGFkZGluZyArICcgICcgKyB0ZXh0KydcXHJcXG4nO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VyaWFsaXplVG9TdHJpbmcgOiBzZXJpYWxpemVUb1N0cmluZyxcclxuICAgIHBhcnNlWE1MIDogcGFyc2VYTUwsXHJcbiAgICBmb3JtYXQ6IGZvcm1hdFxyXG59OyIsIi8qIEBwcmVzZXJ2ZVxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNCBQZXRrYSBBbnRvbm92XG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuICBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuLyoqXG4gKiBibHVlYmlyZCBidWlsZCB2ZXJzaW9uIDIuOS4zNFxuICogRmVhdHVyZXMgZW5hYmxlZDogY29yZSwgcmFjZSwgY2FsbF9nZXQsIGdlbmVyYXRvcnMsIG1hcCwgbm9kZWlmeSwgcHJvbWlzaWZ5LCBwcm9wcywgcmVkdWNlLCBzZXR0bGUsIHNvbWUsIGNhbmNlbCwgdXNpbmcsIGZpbHRlciwgYW55LCBlYWNoLCB0aW1lcnNcbiovXG4hZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi5Qcm9taXNlPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiBfZGVyZXFfPT1cImZ1bmN0aW9uXCImJl9kZXJlcV87aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIF9kZXJlcV89PVwiZnVuY3Rpb25cIiYmX2RlcmVxXztmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciBTb21lUHJvbWlzZUFycmF5ID0gUHJvbWlzZS5fU29tZVByb21pc2VBcnJheTtcbmZ1bmN0aW9uIGFueShwcm9taXNlcykge1xuICAgIHZhciByZXQgPSBuZXcgU29tZVByb21pc2VBcnJheShwcm9taXNlcyk7XG4gICAgdmFyIHByb21pc2UgPSByZXQucHJvbWlzZSgpO1xuICAgIHJldC5zZXRIb3dNYW55KDEpO1xuICAgIHJldC5zZXRVbndyYXAoKTtcbiAgICByZXQuaW5pdCgpO1xuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLmFueSA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBhbnkocHJvbWlzZXMpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbnkodGhpcyk7XG59O1xuXG59O1xuXG59LHt9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIGZpcnN0TGluZUVycm9yO1xudHJ5IHt0aHJvdyBuZXcgRXJyb3IoKTsgfSBjYXRjaCAoZSkge2ZpcnN0TGluZUVycm9yID0gZTt9XG52YXIgc2NoZWR1bGUgPSBfZGVyZXFfKFwiLi9zY2hlZHVsZS5qc1wiKTtcbnZhciBRdWV1ZSA9IF9kZXJlcV8oXCIuL3F1ZXVlLmpzXCIpO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xuXG5mdW5jdGlvbiBBc3luYygpIHtcbiAgICB0aGlzLl9pc1RpY2tVc2VkID0gZmFsc2U7XG4gICAgdGhpcy5fbGF0ZVF1ZXVlID0gbmV3IFF1ZXVlKDE2KTtcbiAgICB0aGlzLl9ub3JtYWxRdWV1ZSA9IG5ldyBRdWV1ZSgxNik7XG4gICAgdGhpcy5fdHJhbXBvbGluZUVuYWJsZWQgPSB0cnVlO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmRyYWluUXVldWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLl9kcmFpblF1ZXVlcygpO1xuICAgIH07XG4gICAgdGhpcy5fc2NoZWR1bGUgPVxuICAgICAgICBzY2hlZHVsZS5pc1N0YXRpYyA/IHNjaGVkdWxlKHRoaXMuZHJhaW5RdWV1ZXMpIDogc2NoZWR1bGU7XG59XG5cbkFzeW5jLnByb3RvdHlwZS5kaXNhYmxlVHJhbXBvbGluZUlmTmVjZXNzYXJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaGFzRGV2VG9vbHMpIHtcbiAgICAgICAgdGhpcy5fdHJhbXBvbGluZUVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuZW5hYmxlVHJhbXBvbGluZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5fdHJhbXBvbGluZUVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fdHJhbXBvbGluZUVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zY2hlZHVsZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuaGF2ZUl0ZW1zUXVldWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9ub3JtYWxRdWV1ZS5sZW5ndGgoKSA+IDA7XG59O1xuXG5Bc3luYy5wcm90b3R5cGUudGhyb3dMYXRlciA9IGZ1bmN0aW9uKGZuLCBhcmcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBhcmcgPSBmbjtcbiAgICAgICAgZm4gPSBmdW5jdGlvbiAoKSB7IHRocm93IGFyZzsgfTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihhcmcpO1xuICAgICAgICB9LCAwKTtcbiAgICB9IGVsc2UgdHJ5IHtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihhcmcpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGFzeW5jIHNjaGVkdWxlciBhdmFpbGFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9tM09UWGtcXHUwMDBhXCIpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIEFzeW5jSW52b2tlTGF0ZXIoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB0aGlzLl9sYXRlUXVldWUucHVzaChmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59XG5cbmZ1bmN0aW9uIEFzeW5jSW52b2tlKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdGhpcy5fbm9ybWFsUXVldWUucHVzaChmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59XG5cbmZ1bmN0aW9uIEFzeW5jU2V0dGxlUHJvbWlzZXMocHJvbWlzZSkge1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlLl9wdXNoT25lKHByb21pc2UpO1xuICAgIHRoaXMuX3F1ZXVlVGljaygpO1xufVxuXG5pZiAoIXV0aWwuaGFzRGV2VG9vbHMpIHtcbiAgICBBc3luYy5wcm90b3R5cGUuaW52b2tlTGF0ZXIgPSBBc3luY0ludm9rZUxhdGVyO1xuICAgIEFzeW5jLnByb3RvdHlwZS5pbnZva2UgPSBBc3luY0ludm9rZTtcbiAgICBBc3luYy5wcm90b3R5cGUuc2V0dGxlUHJvbWlzZXMgPSBBc3luY1NldHRsZVByb21pc2VzO1xufSBlbHNlIHtcbiAgICBpZiAoc2NoZWR1bGUuaXNTdGF0aWMpIHtcbiAgICAgICAgc2NoZWR1bGUgPSBmdW5jdGlvbihmbikgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTtcbiAgICB9XG4gICAgQXN5bmMucHJvdG90eXBlLmludm9rZUxhdGVyID0gZnVuY3Rpb24gKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgICAgIGlmICh0aGlzLl90cmFtcG9saW5lRW5hYmxlZCkge1xuICAgICAgICAgICAgQXN5bmNJbnZva2VMYXRlci5jYWxsKHRoaXMsIGZuLCByZWNlaXZlciwgYXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuLmNhbGwocmVjZWl2ZXIsIGFyZyk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEFzeW5jLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkKSB7XG4gICAgICAgICAgICBBc3luY0ludm9rZS5jYWxsKHRoaXMsIGZuLCByZWNlaXZlciwgYXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwocmVjZWl2ZXIsIGFyZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBc3luYy5wcm90b3R5cGUuc2V0dGxlUHJvbWlzZXMgPSBmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIGlmICh0aGlzLl90cmFtcG9saW5lRW5hYmxlZCkge1xuICAgICAgICAgICAgQXN5bmNTZXR0bGVQcm9taXNlcy5jYWxsKHRoaXMsIHByb21pc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fc2V0dGxlUHJvbWlzZXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuQXN5bmMucHJvdG90eXBlLmludm9rZUZpcnN0ID0gZnVuY3Rpb24gKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdGhpcy5fbm9ybWFsUXVldWUudW5zaGlmdChmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuX2RyYWluUXVldWUgPSBmdW5jdGlvbihxdWV1ZSkge1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgoKSA+IDApIHtcbiAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBmbi5fc2V0dGxlUHJvbWlzZXMoKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZWNlaXZlciA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIHZhciBhcmcgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBmbi5jYWxsKHJlY2VpdmVyLCBhcmcpO1xuICAgIH1cbn07XG5cbkFzeW5jLnByb3RvdHlwZS5fZHJhaW5RdWV1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZHJhaW5RdWV1ZSh0aGlzLl9ub3JtYWxRdWV1ZSk7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLl9kcmFpblF1ZXVlKHRoaXMuX2xhdGVRdWV1ZSk7XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuX3F1ZXVlVGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2lzVGlja1VzZWQpIHtcbiAgICAgICAgdGhpcy5faXNUaWNrVXNlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlKHRoaXMuZHJhaW5RdWV1ZXMpO1xuICAgIH1cbn07XG5cbkFzeW5jLnByb3RvdHlwZS5fcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faXNUaWNrVXNlZCA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQXN5bmMoKTtcbm1vZHVsZS5leHBvcnRzLmZpcnN0TGluZUVycm9yID0gZmlyc3RMaW5lRXJyb3I7XG5cbn0se1wiLi9xdWV1ZS5qc1wiOjI4LFwiLi9zY2hlZHVsZS5qc1wiOjMxLFwiLi91dGlsLmpzXCI6Mzh9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSkge1xudmFyIHJlamVjdFRoaXMgPSBmdW5jdGlvbihfLCBlKSB7XG4gICAgdGhpcy5fcmVqZWN0KGUpO1xufTtcblxudmFyIHRhcmdldFJlamVjdGVkID0gZnVuY3Rpb24oZSwgY29udGV4dCkge1xuICAgIGNvbnRleHQucHJvbWlzZVJlamVjdGlvblF1ZXVlZCA9IHRydWU7XG4gICAgY29udGV4dC5iaW5kaW5nUHJvbWlzZS5fdGhlbihyZWplY3RUaGlzLCByZWplY3RUaGlzLCBudWxsLCB0aGlzLCBlKTtcbn07XG5cbnZhciBiaW5kaW5nUmVzb2x2ZWQgPSBmdW5jdGlvbih0aGlzQXJnLCBjb250ZXh0KSB7XG4gICAgaWYgKHRoaXMuX2lzUGVuZGluZygpKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmVDYWxsYmFjayhjb250ZXh0LnRhcmdldCk7XG4gICAgfVxufTtcblxudmFyIGJpbmRpbmdSZWplY3RlZCA9IGZ1bmN0aW9uKGUsIGNvbnRleHQpIHtcbiAgICBpZiAoIWNvbnRleHQucHJvbWlzZVJlamVjdGlvblF1ZXVlZCkgdGhpcy5fcmVqZWN0KGUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uICh0aGlzQXJnKSB7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodGhpc0FyZyk7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXQuX3Byb3BhZ2F0ZUZyb20odGhpcywgMSk7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuXG4gICAgcmV0Ll9zZXRCb3VuZFRvKG1heWJlUHJvbWlzZSk7XG4gICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7XG4gICAgICAgICAgICBwcm9taXNlUmVqZWN0aW9uUXVldWVkOiBmYWxzZSxcbiAgICAgICAgICAgIHByb21pc2U6IHJldCxcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICAgICAgYmluZGluZ1Byb21pc2U6IG1heWJlUHJvbWlzZVxuICAgICAgICB9O1xuICAgICAgICB0YXJnZXQuX3RoZW4oSU5URVJOQUwsIHRhcmdldFJlamVjdGVkLCByZXQuX3Byb2dyZXNzLCByZXQsIGNvbnRleHQpO1xuICAgICAgICBtYXliZVByb21pc2UuX3RoZW4oXG4gICAgICAgICAgICBiaW5kaW5nUmVzb2x2ZWQsIGJpbmRpbmdSZWplY3RlZCwgcmV0Ll9wcm9ncmVzcywgcmV0LCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXQuX3Jlc29sdmVDYWxsYmFjayh0YXJnZXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldEJvdW5kVG8gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxMzEwNzI7XG4gICAgICAgIHRoaXMuX2JvdW5kVG8gPSBvYmo7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+MTMxMDcyKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMTMxMDcyKSA9PT0gMTMxMDcyO1xufTtcblxuUHJvbWlzZS5iaW5kID0gZnVuY3Rpb24gKHRoaXNBcmcsIHZhbHVlKSB7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodGhpc0FyZyk7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcblxuICAgIHJldC5fc2V0Qm91bmRUbyhtYXliZVByb21pc2UpO1xuICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIG1heWJlUHJvbWlzZS5fdGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldC5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgfSwgcmV0Ll9yZWplY3QsIHJldC5fcHJvZ3Jlc3MsIHJldCwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0Ll9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcbn07XG5cbn0se31dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgb2xkO1xuaWYgKHR5cGVvZiBQcm9taXNlICE9PSBcInVuZGVmaW5lZFwiKSBvbGQgPSBQcm9taXNlO1xuZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcbiAgICB0cnkgeyBpZiAoUHJvbWlzZSA9PT0gYmx1ZWJpcmQpIFByb21pc2UgPSBvbGQ7IH1cbiAgICBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gYmx1ZWJpcmQ7XG59XG52YXIgYmx1ZWJpcmQgPSBfZGVyZXFfKFwiLi9wcm9taXNlLmpzXCIpKCk7XG5ibHVlYmlyZC5ub0NvbmZsaWN0ID0gbm9Db25mbGljdDtcbm1vZHVsZS5leHBvcnRzID0gYmx1ZWJpcmQ7XG5cbn0se1wiLi9wcm9taXNlLmpzXCI6MjN9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIGNyID0gT2JqZWN0LmNyZWF0ZTtcbmlmIChjcikge1xuICAgIHZhciBjYWxsZXJDYWNoZSA9IGNyKG51bGwpO1xuICAgIHZhciBnZXR0ZXJDYWNoZSA9IGNyKG51bGwpO1xuICAgIGNhbGxlckNhY2hlW1wiIHNpemVcIl0gPSBnZXR0ZXJDYWNoZVtcIiBzaXplXCJdID0gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgY2FuRXZhbHVhdGUgPSB1dGlsLmNhbkV2YWx1YXRlO1xudmFyIGlzSWRlbnRpZmllciA9IHV0aWwuaXNJZGVudGlmaWVyO1xuXG52YXIgZ2V0TWV0aG9kQ2FsbGVyO1xudmFyIGdldEdldHRlcjtcbmlmICghdHJ1ZSkge1xudmFyIG1ha2VNZXRob2RDYWxsZXIgPSBmdW5jdGlvbiAobWV0aG9kTmFtZSkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJlbnN1cmVNZXRob2RcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgZW5zdXJlTWV0aG9kKG9iaiwgJ21ldGhvZE5hbWUnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgc3dpdGNoKGxlbikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIG9iai5tZXRob2ROYW1lKHRoaXNbMF0pOyAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIG9iai5tZXRob2ROYW1lKHRoaXNbMF0sIHRoaXNbMV0pOyAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIG9iai5tZXRob2ROYW1lKHRoaXNbMF0sIHRoaXNbMV0sIHRoaXNbMl0pOyAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIG9iai5tZXRob2ROYW1lKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqLm1ldGhvZE5hbWUuYXBwbHkob2JqLCB0aGlzKTsgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICB9OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIi5yZXBsYWNlKC9tZXRob2ROYW1lL2csIG1ldGhvZE5hbWUpKShlbnN1cmVNZXRob2QpO1xufTtcblxudmFyIG1ha2VHZXR0ZXIgPSBmdW5jdGlvbiAocHJvcGVydHlOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcIm9ialwiLCBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICd1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIHJldHVybiBvYmoucHJvcGVydHlOYW1lOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIFwiLnJlcGxhY2UoXCJwcm9wZXJ0eU5hbWVcIiwgcHJvcGVydHlOYW1lKSk7XG59O1xuXG52YXIgZ2V0Q29tcGlsZWQgPSBmdW5jdGlvbihuYW1lLCBjb21waWxlciwgY2FjaGUpIHtcbiAgICB2YXIgcmV0ID0gY2FjaGVbbmFtZV07XG4gICAgaWYgKHR5cGVvZiByZXQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBpZiAoIWlzSWRlbnRpZmllcihuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gY29tcGlsZXIobmFtZSk7XG4gICAgICAgIGNhY2hlW25hbWVdID0gcmV0O1xuICAgICAgICBjYWNoZVtcIiBzaXplXCJdKys7XG4gICAgICAgIGlmIChjYWNoZVtcIiBzaXplXCJdID4gNTEyKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGNhY2hlKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIGRlbGV0ZSBjYWNoZVtrZXlzW2ldXTtcbiAgICAgICAgICAgIGNhY2hlW1wiIHNpemVcIl0gPSBrZXlzLmxlbmd0aCAtIDI1NjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuZ2V0TWV0aG9kQ2FsbGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBnZXRDb21waWxlZChuYW1lLCBtYWtlTWV0aG9kQ2FsbGVyLCBjYWxsZXJDYWNoZSk7XG59O1xuXG5nZXRHZXR0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGdldENvbXBpbGVkKG5hbWUsIG1ha2VHZXR0ZXIsIGdldHRlckNhY2hlKTtcbn07XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU1ldGhvZChvYmosIG1ldGhvZE5hbWUpIHtcbiAgICB2YXIgZm47XG4gICAgaWYgKG9iaiAhPSBudWxsKSBmbiA9IG9ialttZXRob2ROYW1lXTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIk9iamVjdCBcIiArIHV0aWwuY2xhc3NTdHJpbmcob2JqKSArIFwiIGhhcyBubyBtZXRob2QgJ1wiICtcbiAgICAgICAgICAgIHV0aWwudG9TdHJpbmcobWV0aG9kTmFtZSkgKyBcIidcIjtcbiAgICAgICAgdGhyb3cgbmV3IFByb21pc2UuVHlwZUVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gZm47XG59XG5cbmZ1bmN0aW9uIGNhbGxlcihvYmopIHtcbiAgICB2YXIgbWV0aG9kTmFtZSA9IHRoaXMucG9wKCk7XG4gICAgdmFyIGZuID0gZW5zdXJlTWV0aG9kKG9iaiwgbWV0aG9kTmFtZSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KG9iaiwgdGhpcyk7XG59XG5Qcm9taXNlLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcbiAgICB2YXIgJF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoO3ZhciBhcmdzID0gbmV3IEFycmF5KCRfbGVuIC0gMSk7IGZvcih2YXIgJF9pID0gMTsgJF9pIDwgJF9sZW47ICsrJF9pKSB7YXJnc1skX2kgLSAxXSA9IGFyZ3VtZW50c1skX2ldO31cbiAgICBpZiAoIXRydWUpIHtcbiAgICAgICAgaWYgKGNhbkV2YWx1YXRlKSB7XG4gICAgICAgICAgICB2YXIgbWF5YmVDYWxsZXIgPSBnZXRNZXRob2RDYWxsZXIobWV0aG9kTmFtZSk7XG4gICAgICAgICAgICBpZiAobWF5YmVDYWxsZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVDYWxsZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBhcmdzLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFyZ3MucHVzaChtZXRob2ROYW1lKTtcbiAgICByZXR1cm4gdGhpcy5fdGhlbihjYWxsZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBhcmdzLCB1bmRlZmluZWQpO1xufTtcblxuZnVuY3Rpb24gbmFtZWRHZXR0ZXIob2JqKSB7XG4gICAgcmV0dXJuIG9ialt0aGlzXTtcbn1cbmZ1bmN0aW9uIGluZGV4ZWRHZXR0ZXIob2JqKSB7XG4gICAgdmFyIGluZGV4ID0gK3RoaXM7XG4gICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSBNYXRoLm1heCgwLCBpbmRleCArIG9iai5sZW5ndGgpO1xuICAgIHJldHVybiBvYmpbaW5kZXhdO1xufVxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHByb3BlcnR5TmFtZSkge1xuICAgIHZhciBpc0luZGV4ID0gKHR5cGVvZiBwcm9wZXJ0eU5hbWUgPT09IFwibnVtYmVyXCIpO1xuICAgIHZhciBnZXR0ZXI7XG4gICAgaWYgKCFpc0luZGV4KSB7XG4gICAgICAgIGlmIChjYW5FdmFsdWF0ZSkge1xuICAgICAgICAgICAgdmFyIG1heWJlR2V0dGVyID0gZ2V0R2V0dGVyKHByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICBnZXR0ZXIgPSBtYXliZUdldHRlciAhPT0gbnVsbCA/IG1heWJlR2V0dGVyIDogbmFtZWRHZXR0ZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZXR0ZXIgPSBuYW1lZEdldHRlcjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldHRlciA9IGluZGV4ZWRHZXR0ZXI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90aGVuKGdldHRlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHByb3BlcnR5TmFtZSwgdW5kZWZpbmVkKTtcbn07XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKTtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIENhbmNlbGxhdGlvbkVycm9yID0gZXJyb3JzLkNhbmNlbGxhdGlvbkVycm9yO1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2FuY2VsID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmICghdGhpcy5pc0NhbmNlbGxhYmxlKCkpIHJldHVybiB0aGlzO1xuICAgIHZhciBwYXJlbnQ7XG4gICAgdmFyIHByb21pc2VUb1JlamVjdCA9IHRoaXM7XG4gICAgd2hpbGUgKChwYXJlbnQgPSBwcm9taXNlVG9SZWplY3QuX2NhbmNlbGxhdGlvblBhcmVudCkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBwYXJlbnQuaXNDYW5jZWxsYWJsZSgpKSB7XG4gICAgICAgIHByb21pc2VUb1JlamVjdCA9IHBhcmVudDtcbiAgICB9XG4gICAgdGhpcy5fdW5zZXRDYW5jZWxsYWJsZSgpO1xuICAgIHByb21pc2VUb1JlamVjdC5fdGFyZ2V0KCkuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgZmFsc2UsIHRydWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmICghdGhpcy5pc0NhbmNlbGxhYmxlKCkpIHJldHVybiB0aGlzO1xuICAgIGlmIChyZWFzb24gPT09IHVuZGVmaW5lZCkgcmVhc29uID0gbmV3IENhbmNlbGxhdGlvbkVycm9yKCk7XG4gICAgYXN5bmMuaW52b2tlTGF0ZXIodGhpcy5fY2FuY2VsLCB0aGlzLCByZWFzb24pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuY2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2NhbmNlbGxhYmxlKCkpIHJldHVybiB0aGlzO1xuICAgIGFzeW5jLmVuYWJsZVRyYW1wb2xpbmUoKTtcbiAgICB0aGlzLl9zZXRDYW5jZWxsYWJsZSgpO1xuICAgIHRoaXMuX2NhbmNlbGxhdGlvblBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblByb21pc2UucHJvdG90eXBlLnVuY2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJldCA9IHRoaXMudGhlbigpO1xuICAgIHJldC5fdW5zZXRDYW5jZWxsYWJsZSgpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mb3JrID0gZnVuY3Rpb24gKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MpIHtcbiAgICB2YXIgcmV0ID0gdGhpcy5fdGhlbihkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcblxuICAgIHJldC5fc2V0Q2FuY2VsbGFibGUoKTtcbiAgICByZXQuX2NhbmNlbGxhdGlvblBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmV0O1xufTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL2Vycm9ycy5qc1wiOjEzfV0sNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBibHVlYmlyZEZyYW1lUGF0dGVybiA9XG4gICAgL1tcXFxcXFwvXWJsdWViaXJkW1xcXFxcXC9danNbXFxcXFxcL10obWFpbnxkZWJ1Z3x6YWxnb3xpbnN0cnVtZW50ZWQpLztcbnZhciBzdGFja0ZyYW1lUGF0dGVybiA9IG51bGw7XG52YXIgZm9ybWF0U3RhY2sgPSBudWxsO1xudmFyIGluZGVudFN0YWNrRnJhbWVzID0gZmFsc2U7XG52YXIgd2FybjtcblxuZnVuY3Rpb24gQ2FwdHVyZWRUcmFjZShwYXJlbnQpIHtcbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuX2xlbmd0aCA9IDEgKyAocGFyZW50ID09PSB1bmRlZmluZWQgPyAwIDogcGFyZW50Ll9sZW5ndGgpO1xuICAgIGNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIENhcHR1cmVkVHJhY2UpO1xuICAgIGlmIChsZW5ndGggPiAzMikgdGhpcy51bmN5Y2xlKCk7XG59XG51dGlsLmluaGVyaXRzKENhcHR1cmVkVHJhY2UsIEVycm9yKTtcblxuQ2FwdHVyZWRUcmFjZS5wcm90b3R5cGUudW5jeWNsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLl9sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA8IDIpIHJldHVybjtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICB2YXIgc3RhY2tUb0luZGV4ID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbm9kZSA9IHRoaXM7IG5vZGUgIT09IHVuZGVmaW5lZDsgKytpKSB7XG4gICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIG5vZGUgPSBub2RlLl9wYXJlbnQ7XG4gICAgfVxuICAgIGxlbmd0aCA9IHRoaXMuX2xlbmd0aCA9IGk7XG4gICAgZm9yICh2YXIgaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBzdGFjayA9IG5vZGVzW2ldLnN0YWNrO1xuICAgICAgICBpZiAoc3RhY2tUb0luZGV4W3N0YWNrXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdGFja1RvSW5kZXhbc3RhY2tdID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjdXJyZW50U3RhY2sgPSBub2Rlc1tpXS5zdGFjaztcbiAgICAgICAgdmFyIGluZGV4ID0gc3RhY2tUb0luZGV4W2N1cnJlbnRTdGFja107XG4gICAgICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkICYmIGluZGV4ICE9PSBpKSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZXNbaW5kZXggLSAxXS5fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIG5vZGVzW2luZGV4IC0gMV0uX2xlbmd0aCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2Rlc1tpXS5fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbm9kZXNbaV0uX2xlbmd0aCA9IDE7XG4gICAgICAgICAgICB2YXIgY3ljbGVFZGdlTm9kZSA9IGkgPiAwID8gbm9kZXNbaSAtIDFdIDogdGhpcztcblxuICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX3BhcmVudCA9IG5vZGVzW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fcGFyZW50LnVuY3ljbGUoKTtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9sZW5ndGggPVxuICAgICAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQuX2xlbmd0aCArIDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX3BhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9sZW5ndGggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN1cnJlbnRDaGlsZExlbmd0aCA9IGN5Y2xlRWRnZU5vZGUuX2xlbmd0aCArIDE7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSAtIDI7IGogPj0gMDsgLS1qKSB7XG4gICAgICAgICAgICAgICAgbm9kZXNbal0uX2xlbmd0aCA9IGN1cnJlbnRDaGlsZExlbmd0aDtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q2hpbGRMZW5ndGgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkNhcHR1cmVkVHJhY2UucHJvdG90eXBlLnBhcmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQ7XG59O1xuXG5DYXB0dXJlZFRyYWNlLnByb3RvdHlwZS5oYXNQYXJlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50ICE9PSB1bmRlZmluZWQ7XG59O1xuXG5DYXB0dXJlZFRyYWNlLnByb3RvdHlwZS5hdHRhY2hFeHRyYVRyYWNlID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IuX19zdGFja0NsZWFuZWRfXykgcmV0dXJuO1xuICAgIHRoaXMudW5jeWNsZSgpO1xuICAgIHZhciBwYXJzZWQgPSBDYXB0dXJlZFRyYWNlLnBhcnNlU3RhY2tBbmRNZXNzYWdlKGVycm9yKTtcbiAgICB2YXIgbWVzc2FnZSA9IHBhcnNlZC5tZXNzYWdlO1xuICAgIHZhciBzdGFja3MgPSBbcGFyc2VkLnN0YWNrXTtcblxuICAgIHZhciB0cmFjZSA9IHRoaXM7XG4gICAgd2hpbGUgKHRyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3RhY2tzLnB1c2goY2xlYW5TdGFjayh0cmFjZS5zdGFjay5zcGxpdChcIlxcblwiKSkpO1xuICAgICAgICB0cmFjZSA9IHRyYWNlLl9wYXJlbnQ7XG4gICAgfVxuICAgIHJlbW92ZUNvbW1vblJvb3RzKHN0YWNrcyk7XG4gICAgcmVtb3ZlRHVwbGljYXRlT3JFbXB0eUp1bXBzKHN0YWNrcyk7XG4gICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChlcnJvciwgXCJzdGFja1wiLCByZWNvbnN0cnVjdFN0YWNrKG1lc3NhZ2UsIHN0YWNrcykpO1xuICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwiX19zdGFja0NsZWFuZWRfX1wiLCB0cnVlKTtcbn07XG5cbmZ1bmN0aW9uIHJlY29uc3RydWN0U3RhY2sobWVzc2FnZSwgc3RhY2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFja3MubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgICAgIHN0YWNrc1tpXS5wdXNoKFwiRnJvbSBwcmV2aW91cyBldmVudDpcIik7XG4gICAgICAgIHN0YWNrc1tpXSA9IHN0YWNrc1tpXS5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgICBpZiAoaSA8IHN0YWNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhY2tzW2ldID0gc3RhY2tzW2ldLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlICsgXCJcXG5cIiArIHN0YWNrcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVPckVtcHR5SnVtcHMoc3RhY2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHN0YWNrc1tpXS5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgICAgICgoaSArIDEgPCBzdGFja3MubGVuZ3RoKSAmJiBzdGFja3NbaV1bMF0gPT09IHN0YWNrc1tpKzFdWzBdKSkge1xuICAgICAgICAgICAgc3RhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ29tbW9uUm9vdHMoc3RhY2tzKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBzdGFja3NbMF07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdGFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHByZXYgPSBzdGFja3NbaV07XG4gICAgICAgIHZhciBjdXJyZW50TGFzdEluZGV4ID0gY3VycmVudC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgY3VycmVudExhc3RMaW5lID0gY3VycmVudFtjdXJyZW50TGFzdEluZGV4XTtcbiAgICAgICAgdmFyIGNvbW1vblJvb3RNZWV0UG9pbnQgPSAtMTtcblxuICAgICAgICBmb3IgKHZhciBqID0gcHJldi5sZW5ndGggLSAxOyBqID49IDA7IC0taikge1xuICAgICAgICAgICAgaWYgKHByZXZbal0gPT09IGN1cnJlbnRMYXN0TGluZSkge1xuICAgICAgICAgICAgICAgIGNvbW1vblJvb3RNZWV0UG9pbnQgPSBqO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IGNvbW1vblJvb3RNZWV0UG9pbnQ7IGogPj0gMDsgLS1qKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHByZXZbal07XG4gICAgICAgICAgICBpZiAoY3VycmVudFtjdXJyZW50TGFzdEluZGV4XSA9PT0gbGluZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQucG9wKCk7XG4gICAgICAgICAgICAgICAgY3VycmVudExhc3RJbmRleC0tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50ID0gcHJldjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFuU3RhY2soc3RhY2spIHtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IHN0YWNrW2ldO1xuICAgICAgICB2YXIgaXNUcmFjZUxpbmUgPSBzdGFja0ZyYW1lUGF0dGVybi50ZXN0KGxpbmUpIHx8XG4gICAgICAgICAgICBcIiAgICAoTm8gc3RhY2sgdHJhY2UpXCIgPT09IGxpbmU7XG4gICAgICAgIHZhciBpc0ludGVybmFsRnJhbWUgPSBpc1RyYWNlTGluZSAmJiBzaG91bGRJZ25vcmUobGluZSk7XG4gICAgICAgIGlmIChpc1RyYWNlTGluZSAmJiAhaXNJbnRlcm5hbEZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoaW5kZW50U3RhY2tGcmFtZXMgJiYgbGluZS5jaGFyQXQoMCkgIT09IFwiIFwiKSB7XG4gICAgICAgICAgICAgICAgbGluZSA9IFwiICAgIFwiICsgbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldC5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHN0YWNrRnJhbWVzQXNBcnJheShlcnJvcikge1xuICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrLnJlcGxhY2UoL1xccyskL2csIFwiXCIpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBzdGFja1tpXTtcbiAgICAgICAgaWYgKFwiICAgIChObyBzdGFjayB0cmFjZSlcIiA9PT0gbGluZSB8fCBzdGFja0ZyYW1lUGF0dGVybi50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgc3RhY2sgPSBzdGFjay5zbGljZShpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YWNrO1xufVxuXG5DYXB0dXJlZFRyYWNlLnBhcnNlU3RhY2tBbmRNZXNzYWdlID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgICB2YXIgc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgICB2YXIgbWVzc2FnZSA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgc3RhY2sgPSB0eXBlb2Ygc3RhY2sgPT09IFwic3RyaW5nXCIgJiYgc3RhY2subGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc3RhY2tGcmFtZXNBc0FycmF5KGVycm9yKSA6IFtcIiAgICAoTm8gc3RhY2sgdHJhY2UpXCJdO1xuICAgIHJldHVybiB7XG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHN0YWNrOiBjbGVhblN0YWNrKHN0YWNrKVxuICAgIH07XG59O1xuXG5DYXB0dXJlZFRyYWNlLmZvcm1hdEFuZExvZ0Vycm9yID0gZnVuY3Rpb24oZXJyb3IsIHRpdGxlKSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICBpZiAodHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBlcnJvciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIgc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0aXRsZSArIGZvcm1hdFN0YWNrKHN0YWNrLCBlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gdGl0bGUgKyBTdHJpbmcoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygd2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB3YXJuKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS5sb2cgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuQ2FwdHVyZWRUcmFjZS51bmhhbmRsZWRSZWplY3Rpb24gPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgQ2FwdHVyZWRUcmFjZS5mb3JtYXRBbmRMb2dFcnJvcihyZWFzb24sIFwiXi0tLSBXaXRoIGFkZGl0aW9uYWwgc3RhY2sgdHJhY2U6IFwiKTtcbn07XG5cbkNhcHR1cmVkVHJhY2UuaXNTdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBjYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiO1xufTtcblxuQ2FwdHVyZWRUcmFjZS5maXJlUmVqZWN0aW9uRXZlbnQgPVxuZnVuY3Rpb24obmFtZSwgbG9jYWxIYW5kbGVyLCByZWFzb24sIHByb21pc2UpIHtcbiAgICB2YXIgbG9jYWxFdmVudEZpcmVkID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBsb2NhbEhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgbG9jYWxFdmVudEZpcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcInJlamVjdGlvbkhhbmRsZWRcIikge1xuICAgICAgICAgICAgICAgIGxvY2FsSGFuZGxlcihwcm9taXNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9jYWxIYW5kbGVyKHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIoZSk7XG4gICAgfVxuXG4gICAgdmFyIGdsb2JhbEV2ZW50RmlyZWQgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBnbG9iYWxFdmVudEZpcmVkID0gZmlyZUdsb2JhbEV2ZW50KG5hbWUsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBnbG9iYWxFdmVudEZpcmVkID0gdHJ1ZTtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihlKTtcbiAgICB9XG5cbiAgICB2YXIgZG9tRXZlbnRGaXJlZCA9IGZhbHNlO1xuICAgIGlmIChmaXJlRG9tRXZlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRvbUV2ZW50RmlyZWQgPSBmaXJlRG9tRXZlbnQobmFtZS50b0xvd2VyQ2FzZSgpLCB7XG4gICAgICAgICAgICAgICAgcmVhc29uOiByZWFzb24sXG4gICAgICAgICAgICAgICAgcHJvbWlzZTogcHJvbWlzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGRvbUV2ZW50RmlyZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXN5bmMudGhyb3dMYXRlcihlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghZ2xvYmFsRXZlbnRGaXJlZCAmJiAhbG9jYWxFdmVudEZpcmVkICYmICFkb21FdmVudEZpcmVkICYmXG4gICAgICAgIG5hbWUgPT09IFwidW5oYW5kbGVkUmVqZWN0aW9uXCIpIHtcbiAgICAgICAgQ2FwdHVyZWRUcmFjZS5mb3JtYXRBbmRMb2dFcnJvcihyZWFzb24sIFwiVW5oYW5kbGVkIHJlamVjdGlvbiBcIik7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZm9ybWF0Tm9uRXJyb3Iob2JqKSB7XG4gICAgdmFyIHN0cjtcbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHN0ciA9IFwiW2Z1bmN0aW9uIFwiICtcbiAgICAgICAgICAgIChvYmoubmFtZSB8fCBcImFub255bW91c1wiKSArXG4gICAgICAgICAgICBcIl1cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBvYmoudG9TdHJpbmcoKTtcbiAgICAgICAgdmFyIHJ1c2VsZXNzVG9TdHJpbmcgPSAvXFxbb2JqZWN0IFthLXpBLVowLTkkX10rXFxdLztcbiAgICAgICAgaWYgKHJ1c2VsZXNzVG9TdHJpbmcudGVzdChzdHIpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdTdHIgPSBKU09OLnN0cmluZ2lmeShvYmopO1xuICAgICAgICAgICAgICAgIHN0ciA9IG5ld1N0cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBzdHIgPSBcIihlbXB0eSBhcnJheSlcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFwiKDxcIiArIHNuaXAoc3RyKSArIFwiPiwgbm8gc3RhY2sgdHJhY2UpXCIpO1xufVxuXG5mdW5jdGlvbiBzbmlwKHN0cikge1xuICAgIHZhciBtYXhDaGFycyA9IDQxO1xuICAgIGlmIChzdHIubGVuZ3RoIDwgbWF4Q2hhcnMpIHtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoMCwgbWF4Q2hhcnMgLSAzKSArIFwiLi4uXCI7XG59XG5cbnZhciBzaG91bGRJZ25vcmUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9O1xudmFyIHBhcnNlTGluZUluZm9SZWdleCA9IC9bXFwvPFxcKF0oW146XFwvXSspOihcXGQrKTooPzpcXGQrKVxcKT9cXHMqJC87XG5mdW5jdGlvbiBwYXJzZUxpbmVJbmZvKGxpbmUpIHtcbiAgICB2YXIgbWF0Y2hlcyA9IGxpbmUubWF0Y2gocGFyc2VMaW5lSW5mb1JlZ2V4KTtcbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZU5hbWU6IG1hdGNoZXNbMV0sXG4gICAgICAgICAgICBsaW5lOiBwYXJzZUludChtYXRjaGVzWzJdLCAxMClcbiAgICAgICAgfTtcbiAgICB9XG59XG5DYXB0dXJlZFRyYWNlLnNldEJvdW5kcyA9IGZ1bmN0aW9uKGZpcnN0TGluZUVycm9yLCBsYXN0TGluZUVycm9yKSB7XG4gICAgaWYgKCFDYXB0dXJlZFRyYWNlLmlzU3VwcG9ydGVkKCkpIHJldHVybjtcbiAgICB2YXIgZmlyc3RTdGFja0xpbmVzID0gZmlyc3RMaW5lRXJyb3Iuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGxhc3RTdGFja0xpbmVzID0gbGFzdExpbmVFcnJvci5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZmlyc3RJbmRleCA9IC0xO1xuICAgIHZhciBsYXN0SW5kZXggPSAtMTtcbiAgICB2YXIgZmlyc3RGaWxlTmFtZTtcbiAgICB2YXIgbGFzdEZpbGVOYW1lO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3RTdGFja0xpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJzZUxpbmVJbmZvKGZpcnN0U3RhY2tMaW5lc1tpXSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGZpcnN0RmlsZU5hbWUgPSByZXN1bHQuZmlsZU5hbWU7XG4gICAgICAgICAgICBmaXJzdEluZGV4ID0gcmVzdWx0LmxpbmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RTdGFja0xpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJzZUxpbmVJbmZvKGxhc3RTdGFja0xpbmVzW2ldKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgbGFzdEZpbGVOYW1lID0gcmVzdWx0LmZpbGVOYW1lO1xuICAgICAgICAgICAgbGFzdEluZGV4ID0gcmVzdWx0LmxpbmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZmlyc3RJbmRleCA8IDAgfHwgbGFzdEluZGV4IDwgMCB8fCAhZmlyc3RGaWxlTmFtZSB8fCAhbGFzdEZpbGVOYW1lIHx8XG4gICAgICAgIGZpcnN0RmlsZU5hbWUgIT09IGxhc3RGaWxlTmFtZSB8fCBmaXJzdEluZGV4ID49IGxhc3RJbmRleCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2hvdWxkSWdub3JlID0gZnVuY3Rpb24obGluZSkge1xuICAgICAgICBpZiAoYmx1ZWJpcmRGcmFtZVBhdHRlcm4udGVzdChsaW5lKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIHZhciBpbmZvID0gcGFyc2VMaW5lSW5mbyhsaW5lKTtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpbGVOYW1lID09PSBmaXJzdEZpbGVOYW1lICYmXG4gICAgICAgICAgICAgICAgKGZpcnN0SW5kZXggPD0gaW5mby5saW5lICYmIGluZm8ubGluZSA8PSBsYXN0SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59O1xuXG52YXIgY2FwdHVyZVN0YWNrVHJhY2UgPSAoZnVuY3Rpb24gc3RhY2tEZXRlY3Rpb24oKSB7XG4gICAgdmFyIHY4c3RhY2tGcmFtZVBhdHRlcm4gPSAvXlxccyphdFxccyovO1xuICAgIHZhciB2OHN0YWNrRm9ybWF0dGVyID0gZnVuY3Rpb24oc3RhY2ssIGVycm9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhY2sgPT09IFwic3RyaW5nXCIpIHJldHVybiBzdGFjaztcblxuICAgICAgICBpZiAoZXJyb3IubmFtZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXROb25FcnJvcihlcnJvcik7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID09PSBcIm51bWJlclwiICYmXG4gICAgICAgIHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdCArIDY7XG4gICAgICAgIHN0YWNrRnJhbWVQYXR0ZXJuID0gdjhzdGFja0ZyYW1lUGF0dGVybjtcbiAgICAgICAgZm9ybWF0U3RhY2sgPSB2OHN0YWNrRm9ybWF0dGVyO1xuICAgICAgICB2YXIgY2FwdHVyZVN0YWNrVHJhY2UgPSBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZTtcblxuICAgICAgICBzaG91bGRJZ25vcmUgPSBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gYmx1ZWJpcmRGcmFtZVBhdHRlcm4udGVzdChsaW5lKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHJlY2VpdmVyLCBpZ25vcmVVbnRpbCkge1xuICAgICAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ICsgNjtcbiAgICAgICAgICAgIGNhcHR1cmVTdGFja1RyYWNlKHJlY2VpdmVyLCBpZ25vcmVVbnRpbCk7XG4gICAgICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQgLSA2O1xuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG5cbiAgICBpZiAodHlwZW9mIGVyci5zdGFjayA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICBlcnIuc3RhY2suc3BsaXQoXCJcXG5cIilbMF0uaW5kZXhPZihcInN0YWNrRGV0ZWN0aW9uQFwiKSA+PSAwKSB7XG4gICAgICAgIHN0YWNrRnJhbWVQYXR0ZXJuID0gL0AvO1xuICAgICAgICBmb3JtYXRTdGFjayA9IHY4c3RhY2tGb3JtYXR0ZXI7XG4gICAgICAgIGluZGVudFN0YWNrRnJhbWVzID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhcHR1cmVTdGFja1RyYWNlKG8pIHtcbiAgICAgICAgICAgIG8uc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaGFzU3RhY2tBZnRlclRocm93O1xuICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcigpOyB9XG4gICAgY2F0Y2goZSkge1xuICAgICAgICBoYXNTdGFja0FmdGVyVGhyb3cgPSAoXCJzdGFja1wiIGluIGUpO1xuICAgIH1cbiAgICBpZiAoIShcInN0YWNrXCIgaW4gZXJyKSAmJiBoYXNTdGFja0FmdGVyVGhyb3cgJiZcbiAgICAgICAgdHlwZW9mIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBzdGFja0ZyYW1lUGF0dGVybiA9IHY4c3RhY2tGcmFtZVBhdHRlcm47XG4gICAgICAgIGZvcm1hdFN0YWNrID0gdjhzdGFja0Zvcm1hdHRlcjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhcHR1cmVTdGFja1RyYWNlKG8pIHtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdCArIDY7XG4gICAgICAgICAgICB0cnkgeyB0aHJvdyBuZXcgRXJyb3IoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBvLnN0YWNrID0gZS5zdGFjazsgfVxuICAgICAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0IC0gNjtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmb3JtYXRTdGFjayA9IGZ1bmN0aW9uKHN0YWNrLCBlcnJvcikge1xuICAgICAgICBpZiAodHlwZW9mIHN0YWNrID09PSBcInN0cmluZ1wiKSByZXR1cm4gc3RhY2s7XG5cbiAgICAgICAgaWYgKCh0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgICAgICAgZXJyb3IubmFtZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXROb25FcnJvcihlcnJvcik7XG4gICAgfTtcblxuICAgIHJldHVybiBudWxsO1xuXG59KShbXSk7XG5cbnZhciBmaXJlRG9tRXZlbnQ7XG52YXIgZmlyZUdsb2JhbEV2ZW50ID0gKGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTm9kZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmFtZSwgcmVhc29uLCBwcm9taXNlKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJyZWplY3Rpb25IYW5kbGVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5lbWl0KG5hbWUsIHByb21pc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5lbWl0KG5hbWUsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGN1c3RvbUV2ZW50V29ya3MgPSBmYWxzZTtcbiAgICAgICAgdmFyIGFueUV2ZW50V29ya3MgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGV2ID0gbmV3IHNlbGYuQ3VzdG9tRXZlbnQoXCJ0ZXN0XCIpO1xuICAgICAgICAgICAgY3VzdG9tRXZlbnRXb3JrcyA9IGV2IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgIGlmICghY3VzdG9tRXZlbnRXb3Jrcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgICAgICAgICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChcInRlc3Rpbmd0aGVldmVudFwiLCBmYWxzZSwgdHJ1ZSwge30pO1xuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgYW55RXZlbnRXb3JrcyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbnlFdmVudFdvcmtzKSB7XG4gICAgICAgICAgICBmaXJlRG9tRXZlbnQgPSBmdW5jdGlvbih0eXBlLCBkZXRhaWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbUV2ZW50V29ya3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgc2VsZi5DdXN0b21FdmVudCh0eXBlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbGYuZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgdHJ1ZSwgZGV0YWlsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQgPyAhc2VsZi5kaXNwYXRjaEV2ZW50KGV2ZW50KSA6IGZhbHNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b1dpbmRvd01ldGhvZE5hbWVNYXAgPSB7fTtcbiAgICAgICAgdG9XaW5kb3dNZXRob2ROYW1lTWFwW1widW5oYW5kbGVkUmVqZWN0aW9uXCJdID0gKFwib25cIiArXG4gICAgICAgICAgICBcInVuaGFuZGxlZFJlamVjdGlvblwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0b1dpbmRvd01ldGhvZE5hbWVNYXBbXCJyZWplY3Rpb25IYW5kbGVkXCJdID0gKFwib25cIiArXG4gICAgICAgICAgICBcInJlamVjdGlvbkhhbmRsZWRcIikudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmFtZSwgcmVhc29uLCBwcm9taXNlKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IHRvV2luZG93TWV0aG9kTmFtZU1hcFtuYW1lXTtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBzZWxmW21ldGhvZE5hbWVdO1xuICAgICAgICAgICAgaWYgKCFtZXRob2QpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcInJlamVjdGlvbkhhbmRsZWRcIikge1xuICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHNlbGYsIHByb21pc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXRob2QuY2FsbChzZWxmLCByZWFzb24sIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBjb25zb2xlLndhcm4gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB3YXJuID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgIH07XG4gICAgaWYgKHV0aWwuaXNOb2RlICYmIHByb2Nlc3Muc3RkZXJyLmlzVFRZKSB7XG4gICAgICAgIHdhcm4gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGVyci53cml0ZShcIlxcdTAwMWJbMzFtXCIgKyBtZXNzYWdlICsgXCJcXHUwMDFiWzM5bVxcblwiKTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKCF1dGlsLmlzTm9kZSAmJiB0eXBlb2YgKG5ldyBFcnJvcigpLnN0YWNrKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB3YXJuID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiJWNcIiArIG1lc3NhZ2UsIFwiY29sb3I6IHJlZFwiKTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbnJldHVybiBDYXB0dXJlZFRyYWNlO1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vdXRpbC5qc1wiOjM4fV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oTkVYVF9GSUxURVIpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciBrZXlzID0gX2RlcmVxXyhcIi4vZXM1LmpzXCIpLmtleXM7XG52YXIgVHlwZUVycm9yID0gZXJyb3JzLlR5cGVFcnJvcjtcblxuZnVuY3Rpb24gQ2F0Y2hGaWx0ZXIoaW5zdGFuY2VzLCBjYWxsYmFjaywgcHJvbWlzZSkge1xuICAgIHRoaXMuX2luc3RhbmNlcyA9IGluc3RhbmNlcztcbiAgICB0aGlzLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHRoaXMuX3Byb21pc2UgPSBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBzYWZlUHJlZGljYXRlKHByZWRpY2F0ZSwgZSkge1xuICAgIHZhciBzYWZlT2JqZWN0ID0ge307XG4gICAgdmFyIHJldGZpbHRlciA9IHRyeUNhdGNoKHByZWRpY2F0ZSkuY2FsbChzYWZlT2JqZWN0LCBlKTtcblxuICAgIGlmIChyZXRmaWx0ZXIgPT09IGVycm9yT2JqKSByZXR1cm4gcmV0ZmlsdGVyO1xuXG4gICAgdmFyIHNhZmVLZXlzID0ga2V5cyhzYWZlT2JqZWN0KTtcbiAgICBpZiAoc2FmZUtleXMubGVuZ3RoKSB7XG4gICAgICAgIGVycm9yT2JqLmUgPSBuZXcgVHlwZUVycm9yKFwiQ2F0Y2ggZmlsdGVyIG11c3QgaW5oZXJpdCBmcm9tIEVycm9yIG9yIGJlIGEgc2ltcGxlIHByZWRpY2F0ZSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL284NG82OFxcdTAwMGFcIik7XG4gICAgICAgIHJldHVybiBlcnJvck9iajtcbiAgICB9XG4gICAgcmV0dXJuIHJldGZpbHRlcjtcbn1cblxuQ2F0Y2hGaWx0ZXIucHJvdG90eXBlLmRvRmlsdGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgY2IgPSB0aGlzLl9jYWxsYmFjaztcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2U7XG4gICAgdmFyIGJvdW5kVG8gPSBwcm9taXNlLl9ib3VuZFZhbHVlKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuX2luc3RhbmNlc1tpXTtcbiAgICAgICAgdmFyIGl0ZW1Jc0Vycm9yVHlwZSA9IGl0ZW0gPT09IEVycm9yIHx8XG4gICAgICAgICAgICAoaXRlbSAhPSBudWxsICYmIGl0ZW0ucHJvdG90eXBlIGluc3RhbmNlb2YgRXJyb3IpO1xuXG4gICAgICAgIGlmIChpdGVtSXNFcnJvclR5cGUgJiYgZSBpbnN0YW5jZW9mIGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciByZXQgPSB0cnlDYXRjaChjYikuY2FsbChib3VuZFRvLCBlKTtcbiAgICAgICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICAgICAgTkVYVF9GSUxURVIuZSA9IHJldC5lO1xuICAgICAgICAgICAgICAgIHJldHVybiBORVhUX0ZJTFRFUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09IFwiZnVuY3Rpb25cIiAmJiAhaXRlbUlzRXJyb3JUeXBlKSB7XG4gICAgICAgICAgICB2YXIgc2hvdWxkSGFuZGxlID0gc2FmZVByZWRpY2F0ZShpdGVtLCBlKTtcbiAgICAgICAgICAgIGlmIChzaG91bGRIYW5kbGUgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVycm9yT2JqLmU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNob3VsZEhhbmRsZSkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSB0cnlDYXRjaChjYikuY2FsbChib3VuZFRvLCBlKTtcbiAgICAgICAgICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgICAgICAgICBORVhUX0ZJTFRFUi5lID0gcmV0LmU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBORVhUX0ZJTFRFUjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBORVhUX0ZJTFRFUi5lID0gZTtcbiAgICByZXR1cm4gTkVYVF9GSUxURVI7XG59O1xuXG5yZXR1cm4gQ2F0Y2hGaWx0ZXI7XG59O1xuXG59LHtcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL2VzNS5qc1wiOjE0LFwiLi91dGlsLmpzXCI6Mzh9XSw5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBDYXB0dXJlZFRyYWNlLCBpc0RlYnVnZ2luZykge1xudmFyIGNvbnRleHRTdGFjayA9IFtdO1xuZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgICB0aGlzLl90cmFjZSA9IG5ldyBDYXB0dXJlZFRyYWNlKHBlZWtDb250ZXh0KCkpO1xufVxuQ29udGV4dC5wcm90b3R5cGUuX3B1c2hDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghaXNEZWJ1Z2dpbmcoKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl90cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHRTdGFjay5wdXNoKHRoaXMuX3RyYWNlKTtcbiAgICB9XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5fcG9wQ29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWlzRGVidWdnaW5nKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fdHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0U3RhY2sucG9wKCk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQ29udGV4dCgpIHtcbiAgICBpZiAoaXNEZWJ1Z2dpbmcoKSkgcmV0dXJuIG5ldyBDb250ZXh0KCk7XG59XG5cbmZ1bmN0aW9uIHBlZWtDb250ZXh0KCkge1xuICAgIHZhciBsYXN0SW5kZXggPSBjb250ZXh0U3RhY2subGVuZ3RoIC0gMTtcbiAgICBpZiAobGFzdEluZGV4ID49IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHRTdGFja1tsYXN0SW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5fcGVla0NvbnRleHQgPSBwZWVrQ29udGV4dDtcblByb21pc2UucHJvdG90eXBlLl9wdXNoQ29udGV4dCA9IENvbnRleHQucHJvdG90eXBlLl9wdXNoQ29udGV4dDtcblByb21pc2UucHJvdG90eXBlLl9wb3BDb250ZXh0ID0gQ29udGV4dC5wcm90b3R5cGUuX3BvcENvbnRleHQ7XG5cbnJldHVybiBjcmVhdGVDb250ZXh0O1xufTtcblxufSx7fV0sMTA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIENhcHR1cmVkVHJhY2UpIHtcbnZhciBnZXREb21haW4gPSBQcm9taXNlLl9nZXREb21haW47XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciBXYXJuaW5nID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpLldhcm5pbmc7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgY2FuQXR0YWNoVHJhY2UgPSB1dGlsLmNhbkF0dGFjaFRyYWNlO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQ7XG52YXIgcG9zc2libHlVbmhhbmRsZWRSZWplY3Rpb247XG52YXIgZGVidWdnaW5nID0gZmFsc2UgfHwgKHV0aWwuaXNOb2RlICYmXG4gICAgICAgICAgICAgICAgICAgICghIXByb2Nlc3MuZW52W1wiQkxVRUJJUkRfREVCVUdcIl0gfHxcbiAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52W1wiTk9ERV9FTlZcIl0gPT09IFwiZGV2ZWxvcG1lbnRcIikpO1xuXG5pZiAoZGVidWdnaW5nKSB7XG4gICAgYXN5bmMuZGlzYWJsZVRyYW1wb2xpbmVJZk5lY2Vzc2FyeSgpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5faWdub3JlUmVqZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMTY3NzcyMTY7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZW5zdXJlUG9zc2libGVSZWplY3Rpb25IYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgodGhpcy5fYml0RmllbGQgJiAxNjc3NzIxNikgIT09IDApIHJldHVybjtcbiAgICB0aGlzLl9zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIGFzeW5jLmludm9rZUxhdGVyKHRoaXMuX25vdGlmeVVuaGFuZGxlZFJlamVjdGlvbiwgdGhpcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9ub3RpZnlVbmhhbmRsZWRSZWplY3Rpb25Jc0hhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ2FwdHVyZWRUcmFjZS5maXJlUmVqZWN0aW9uRXZlbnQoXCJyZWplY3Rpb25IYW5kbGVkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZCwgdW5kZWZpbmVkLCB0aGlzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9ub3RpZnlVbmhhbmRsZWRSZWplY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2lzUmVqZWN0aW9uVW5oYW5kbGVkKCkpIHtcbiAgICAgICAgdmFyIHJlYXNvbiA9IHRoaXMuX2dldENhcnJpZWRTdGFja1RyYWNlKCkgfHwgdGhpcy5fc2V0dGxlZFZhbHVlO1xuICAgICAgICB0aGlzLl9zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkKCk7XG4gICAgICAgIENhcHR1cmVkVHJhY2UuZmlyZVJlamVjdGlvbkV2ZW50KFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uLCByZWFzb24sIHRoaXMpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCA1MjQyODg7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjUyNDI4OCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNVbmhhbmRsZWRSZWplY3Rpb25Ob3RpZmllZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNTI0Mjg4KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDIwOTcxNTI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH4yMDk3MTUyKTtcbiAgICBpZiAodGhpcy5faXNVbmhhbmRsZWRSZWplY3Rpb25Ob3RpZmllZCgpKSB7XG4gICAgICAgIHRoaXMuX3Vuc2V0VW5oYW5kbGVkUmVqZWN0aW9uSXNOb3RpZmllZCgpO1xuICAgICAgICB0aGlzLl9ub3RpZnlVbmhhbmRsZWRSZWplY3Rpb25Jc0hhbmRsZWQoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNSZWplY3Rpb25VbmhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDIwOTcxNTIpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRDYXJyaWVkU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChjYXB0dXJlZFRyYWNlKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDEwNDg1NzY7XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMCA9IGNhcHR1cmVkVHJhY2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNDYXJyeWluZ1N0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDEwNDg1NzYpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9nZXRDYXJyaWVkU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNDYXJyeWluZ1N0YWNrVHJhY2UoKVxuICAgICAgICA/IHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjBcbiAgICAgICAgOiB1bmRlZmluZWQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2FwdHVyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGRlYnVnZ2luZykge1xuICAgICAgICB0aGlzLl90cmFjZSA9IG5ldyBDYXB0dXJlZFRyYWNlKHRoaXMuX3BlZWtDb250ZXh0KCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9hdHRhY2hFeHRyYVRyYWNlID0gZnVuY3Rpb24gKGVycm9yLCBpZ25vcmVTZWxmKSB7XG4gICAgaWYgKGRlYnVnZ2luZyAmJiBjYW5BdHRhY2hUcmFjZShlcnJvcikpIHtcbiAgICAgICAgdmFyIHRyYWNlID0gdGhpcy5fdHJhY2U7XG4gICAgICAgIGlmICh0cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoaWdub3JlU2VsZikgdHJhY2UgPSB0cmFjZS5fcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0cmFjZS5hdHRhY2hFeHRyYVRyYWNlKGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICghZXJyb3IuX19zdGFja0NsZWFuZWRfXykge1xuICAgICAgICAgICAgdmFyIHBhcnNlZCA9IENhcHR1cmVkVHJhY2UucGFyc2VTdGFja0FuZE1lc3NhZ2UoZXJyb3IpO1xuICAgICAgICAgICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChlcnJvciwgXCJzdGFja1wiLFxuICAgICAgICAgICAgICAgIHBhcnNlZC5tZXNzYWdlICsgXCJcXG5cIiArIHBhcnNlZC5zdGFjay5qb2luKFwiXFxuXCIpKTtcbiAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwiX19zdGFja0NsZWFuZWRfX1wiLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl93YXJuID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciB3YXJuaW5nID0gbmV3IFdhcm5pbmcobWVzc2FnZSk7XG4gICAgdmFyIGN0eCA9IHRoaXMuX3BlZWtDb250ZXh0KCk7XG4gICAgaWYgKGN0eCkge1xuICAgICAgICBjdHguYXR0YWNoRXh0cmFUcmFjZSh3YXJuaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGFyc2VkID0gQ2FwdHVyZWRUcmFjZS5wYXJzZVN0YWNrQW5kTWVzc2FnZSh3YXJuaW5nKTtcbiAgICAgICAgd2FybmluZy5zdGFjayA9IHBhcnNlZC5tZXNzYWdlICsgXCJcXG5cIiArIHBhcnNlZC5zdGFjay5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgICBDYXB0dXJlZFRyYWNlLmZvcm1hdEFuZExvZ0Vycm9yKHdhcm5pbmcsIFwiXCIpO1xufTtcblxuUHJvbWlzZS5vblBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGRvbWFpbiA9IGdldERvbWFpbigpO1xuICAgIHBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uID1cbiAgICAgICAgdHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIgPyAoZG9tYWluID09PSBudWxsID8gZm4gOiBkb21haW4uYmluZChmbikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbn07XG5cblByb21pc2Uub25VbmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGRvbWFpbiA9IGdldERvbWFpbigpO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQgPVxuICAgICAgICB0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIiA/IChkb21haW4gPT09IG51bGwgPyBmbiA6IGRvbWFpbi5iaW5kKGZuKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xufTtcblxuUHJvbWlzZS5sb25nU3RhY2tUcmFjZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGFzeW5jLmhhdmVJdGVtc1F1ZXVlZCgpICYmXG4gICAgICAgIGRlYnVnZ2luZyA9PT0gZmFsc2VcbiAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgZW5hYmxlIGxvbmcgc3RhY2sgdHJhY2VzIGFmdGVyIHByb21pc2VzIGhhdmUgYmVlbiBjcmVhdGVkXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvRFQxcXlHXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgZGVidWdnaW5nID0gQ2FwdHVyZWRUcmFjZS5pc1N1cHBvcnRlZCgpO1xuICAgIGlmIChkZWJ1Z2dpbmcpIHtcbiAgICAgICAgYXN5bmMuZGlzYWJsZVRyYW1wb2xpbmVJZk5lY2Vzc2FyeSgpO1xuICAgIH1cbn07XG5cblByb21pc2UuaGFzTG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBkZWJ1Z2dpbmcgJiYgQ2FwdHVyZWRUcmFjZS5pc1N1cHBvcnRlZCgpO1xufTtcblxuaWYgKCFDYXB0dXJlZFRyYWNlLmlzU3VwcG9ydGVkKCkpIHtcbiAgICBQcm9taXNlLmxvbmdTdGFja1RyYWNlcyA9IGZ1bmN0aW9uKCl7fTtcbiAgICBkZWJ1Z2dpbmcgPSBmYWxzZTtcbn1cblxucmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkZWJ1Z2dpbmc7XG59O1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL3V0aWwuanNcIjozOH1dLDExOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGlzUHJpbWl0aXZlID0gdXRpbC5pc1ByaW1pdGl2ZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG52YXIgcmV0dXJuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xudmFyIHRocm93ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhyb3cgdGhpcztcbn07XG52YXIgcmV0dXJuVW5kZWZpbmVkID0gZnVuY3Rpb24oKSB7fTtcbnZhciB0aHJvd1VuZGVmaW5lZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IHVuZGVmaW5lZDtcbn07XG5cbnZhciB3cmFwcGVyID0gZnVuY3Rpb24gKHZhbHVlLCBhY3Rpb24pIHtcbiAgICBpZiAoYWN0aW9uID09PSAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gMikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cblxuUHJvbWlzZS5wcm90b3R5cGVbXCJyZXR1cm5cIl0gPVxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJldHVybiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcy50aGVuKHJldHVyblVuZGVmaW5lZCk7XG5cbiAgICBpZiAoaXNQcmltaXRpdmUodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICAgICAgd3JhcHBlcih2YWx1ZSwgMiksXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWRcbiAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbihyZXR1cm5lciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHZhbHVlLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGVbXCJ0aHJvd1wiXSA9XG5Qcm9taXNlLnByb3RvdHlwZS50aGVuVGhyb3cgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKHJlYXNvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcy50aGVuKHRocm93VW5kZWZpbmVkKTtcblxuICAgIGlmIChpc1ByaW1pdGl2ZShyZWFzb24pKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICAgICAgd3JhcHBlcihyZWFzb24sIDEpLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4odGhyb3dlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHJlYXNvbiwgdW5kZWZpbmVkKTtcbn07XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMTI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMKSB7XG52YXIgUHJvbWlzZVJlZHVjZSA9IFByb21pc2UucmVkdWNlO1xuXG5Qcm9taXNlLnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIFByb21pc2VSZWR1Y2UodGhpcywgZm4sIG51bGwsIElOVEVSTkFMKTtcbn07XG5cblByb21pc2UuZWFjaCA9IGZ1bmN0aW9uIChwcm9taXNlcywgZm4pIHtcbiAgICByZXR1cm4gUHJvbWlzZVJlZHVjZShwcm9taXNlcywgZm4sIG51bGwsIElOVEVSTkFMKTtcbn07XG59O1xuXG59LHt9XSwxMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczUuanNcIik7XG52YXIgT2JqZWN0ZnJlZXplID0gZXM1LmZyZWV6ZTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBpbmhlcml0cyA9IHV0aWwuaW5oZXJpdHM7XG52YXIgbm90RW51bWVyYWJsZVByb3AgPSB1dGlsLm5vdEVudW1lcmFibGVQcm9wO1xuXG5mdW5jdGlvbiBzdWJFcnJvcihuYW1lUHJvcGVydHksIGRlZmF1bHRNZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gU3ViRXJyb3IobWVzc2FnZSkge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU3ViRXJyb3IpKSByZXR1cm4gbmV3IFN1YkVycm9yKG1lc3NhZ2UpO1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgIHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiID8gbWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlKTtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJuYW1lXCIsIG5hbWVQcm9wZXJ0eSk7XG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFcnJvci5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaGVyaXRzKFN1YkVycm9yLCBFcnJvcik7XG4gICAgcmV0dXJuIFN1YkVycm9yO1xufVxuXG52YXIgX1R5cGVFcnJvciwgX1JhbmdlRXJyb3I7XG52YXIgV2FybmluZyA9IHN1YkVycm9yKFwiV2FybmluZ1wiLCBcIndhcm5pbmdcIik7XG52YXIgQ2FuY2VsbGF0aW9uRXJyb3IgPSBzdWJFcnJvcihcIkNhbmNlbGxhdGlvbkVycm9yXCIsIFwiY2FuY2VsbGF0aW9uIGVycm9yXCIpO1xudmFyIFRpbWVvdXRFcnJvciA9IHN1YkVycm9yKFwiVGltZW91dEVycm9yXCIsIFwidGltZW91dCBlcnJvclwiKTtcbnZhciBBZ2dyZWdhdGVFcnJvciA9IHN1YkVycm9yKFwiQWdncmVnYXRlRXJyb3JcIiwgXCJhZ2dyZWdhdGUgZXJyb3JcIik7XG50cnkge1xuICAgIF9UeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gICAgX1JhbmdlRXJyb3IgPSBSYW5nZUVycm9yO1xufSBjYXRjaChlKSB7XG4gICAgX1R5cGVFcnJvciA9IHN1YkVycm9yKFwiVHlwZUVycm9yXCIsIFwidHlwZSBlcnJvclwiKTtcbiAgICBfUmFuZ2VFcnJvciA9IHN1YkVycm9yKFwiUmFuZ2VFcnJvclwiLCBcInJhbmdlIGVycm9yXCIpO1xufVxuXG52YXIgbWV0aG9kcyA9IChcImpvaW4gcG9wIHB1c2ggc2hpZnQgdW5zaGlmdCBzbGljZSBmaWx0ZXIgZm9yRWFjaCBzb21lIFwiICtcbiAgICBcImV2ZXJ5IG1hcCBpbmRleE9mIGxhc3RJbmRleE9mIHJlZHVjZSByZWR1Y2VSaWdodCBzb3J0IHJldmVyc2VcIikuc3BsaXQoXCIgXCIpO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IG1ldGhvZHMubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZVttZXRob2RzW2ldXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEFnZ3JlZ2F0ZUVycm9yLnByb3RvdHlwZVttZXRob2RzW2ldXSA9IEFycmF5LnByb3RvdHlwZVttZXRob2RzW2ldXTtcbiAgICB9XG59XG5cbmVzNS5kZWZpbmVQcm9wZXJ0eShBZ2dyZWdhdGVFcnJvci5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICB2YWx1ZTogMCxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbn0pO1xuQWdncmVnYXRlRXJyb3IucHJvdG90eXBlW1wiaXNPcGVyYXRpb25hbFwiXSA9IHRydWU7XG52YXIgbGV2ZWwgPSAwO1xuQWdncmVnYXRlRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGVudCA9IEFycmF5KGxldmVsICogNCArIDEpLmpvaW4oXCIgXCIpO1xuICAgIHZhciByZXQgPSBcIlxcblwiICsgaW5kZW50ICsgXCJBZ2dyZWdhdGVFcnJvciBvZjpcIiArIFwiXFxuXCI7XG4gICAgbGV2ZWwrKztcbiAgICBpbmRlbnQgPSBBcnJheShsZXZlbCAqIDQgKyAxKS5qb2luKFwiIFwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHN0ciA9IHRoaXNbaV0gPT09IHRoaXMgPyBcIltDaXJjdWxhciBBZ2dyZWdhdGVFcnJvcl1cIiA6IHRoaXNbaV0gKyBcIlwiO1xuICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIGxpbmVzW2pdID0gaW5kZW50ICsgbGluZXNbal07XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gbGluZXMuam9pbihcIlxcblwiKTtcbiAgICAgICAgcmV0ICs9IHN0ciArIFwiXFxuXCI7XG4gICAgfVxuICAgIGxldmVsLS07XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIE9wZXJhdGlvbmFsRXJyb3IobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBPcGVyYXRpb25hbEVycm9yKSlcbiAgICAgICAgcmV0dXJuIG5ldyBPcGVyYXRpb25hbEVycm9yKG1lc3NhZ2UpO1xuICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibmFtZVwiLCBcIk9wZXJhdGlvbmFsRXJyb3JcIik7XG4gICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuY2F1c2UgPSBtZXNzYWdlO1xuICAgIHRoaXNbXCJpc09wZXJhdGlvbmFsXCJdID0gdHJ1ZTtcblxuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJtZXNzYWdlXCIsIG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwic3RhY2tcIiwgbWVzc2FnZS5zdGFjayk7XG4gICAgfSBlbHNlIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9XG5cbn1cbmluaGVyaXRzKE9wZXJhdGlvbmFsRXJyb3IsIEVycm9yKTtcblxudmFyIGVycm9yVHlwZXMgPSBFcnJvcltcIl9fQmx1ZWJpcmRFcnJvclR5cGVzX19cIl07XG5pZiAoIWVycm9yVHlwZXMpIHtcbiAgICBlcnJvclR5cGVzID0gT2JqZWN0ZnJlZXplKHtcbiAgICAgICAgQ2FuY2VsbGF0aW9uRXJyb3I6IENhbmNlbGxhdGlvbkVycm9yLFxuICAgICAgICBUaW1lb3V0RXJyb3I6IFRpbWVvdXRFcnJvcixcbiAgICAgICAgT3BlcmF0aW9uYWxFcnJvcjogT3BlcmF0aW9uYWxFcnJvcixcbiAgICAgICAgUmVqZWN0aW9uRXJyb3I6IE9wZXJhdGlvbmFsRXJyb3IsXG4gICAgICAgIEFnZ3JlZ2F0ZUVycm9yOiBBZ2dyZWdhdGVFcnJvclxuICAgIH0pO1xuICAgIG5vdEVudW1lcmFibGVQcm9wKEVycm9yLCBcIl9fQmx1ZWJpcmRFcnJvclR5cGVzX19cIiwgZXJyb3JUeXBlcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIEVycm9yOiBFcnJvcixcbiAgICBUeXBlRXJyb3I6IF9UeXBlRXJyb3IsXG4gICAgUmFuZ2VFcnJvcjogX1JhbmdlRXJyb3IsXG4gICAgQ2FuY2VsbGF0aW9uRXJyb3I6IGVycm9yVHlwZXMuQ2FuY2VsbGF0aW9uRXJyb3IsXG4gICAgT3BlcmF0aW9uYWxFcnJvcjogZXJyb3JUeXBlcy5PcGVyYXRpb25hbEVycm9yLFxuICAgIFRpbWVvdXRFcnJvcjogZXJyb3JUeXBlcy5UaW1lb3V0RXJyb3IsXG4gICAgQWdncmVnYXRlRXJyb3I6IGVycm9yVHlwZXMuQWdncmVnYXRlRXJyb3IsXG4gICAgV2FybmluZzogV2FybmluZ1xufTtcblxufSx7XCIuL2VzNS5qc1wiOjE0LFwiLi91dGlsLmpzXCI6Mzh9XSwxNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG52YXIgaXNFUzUgPSAoZnVuY3Rpb24oKXtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICByZXR1cm4gdGhpcyA9PT0gdW5kZWZpbmVkO1xufSkoKTtcblxuaWYgKGlzRVM1KSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGZyZWV6ZTogT2JqZWN0LmZyZWV6ZSxcbiAgICAgICAgZGVmaW5lUHJvcGVydHk6IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSxcbiAgICAgICAgZ2V0RGVzY3JpcHRvcjogT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgICAga2V5czogT2JqZWN0LmtleXMsXG4gICAgICAgIG5hbWVzOiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICAgICAgZ2V0UHJvdG90eXBlT2Y6IE9iamVjdC5nZXRQcm90b3R5cGVPZixcbiAgICAgICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSxcbiAgICAgICAgaXNFUzU6IGlzRVM1LFxuICAgICAgICBwcm9wZXJ0eUlzV3JpdGFibGU6IGZ1bmN0aW9uKG9iaiwgcHJvcCkge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgcHJvcCk7XG4gICAgICAgICAgICByZXR1cm4gISEoIWRlc2NyaXB0b3IgfHwgZGVzY3JpcHRvci53cml0YWJsZSB8fCBkZXNjcmlwdG9yLnNldCk7XG4gICAgICAgIH1cbiAgICB9O1xufSBlbHNlIHtcbiAgICB2YXIgaGFzID0ge30uaGFzT3duUHJvcGVydHk7XG4gICAgdmFyIHN0ciA9IHt9LnRvU3RyaW5nO1xuICAgIHZhciBwcm90byA9IHt9LmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcblxuICAgIHZhciBPYmplY3RLZXlzID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gbykge1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKG8sIGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIHZhciBPYmplY3RHZXREZXNjcmlwdG9yID0gZnVuY3Rpb24obywga2V5KSB7XG4gICAgICAgIHJldHVybiB7dmFsdWU6IG9ba2V5XX07XG4gICAgfTtcblxuICAgIHZhciBPYmplY3REZWZpbmVQcm9wZXJ0eSA9IGZ1bmN0aW9uIChvLCBrZXksIGRlc2MpIHtcbiAgICAgICAgb1trZXldID0gZGVzYy52YWx1ZTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfTtcblxuICAgIHZhciBPYmplY3RGcmVlemUgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcblxuICAgIHZhciBPYmplY3RHZXRQcm90b3R5cGVPZiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qob2JqKS5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgQXJyYXlJc0FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ci5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGlzQXJyYXk6IEFycmF5SXNBcnJheSxcbiAgICAgICAga2V5czogT2JqZWN0S2V5cyxcbiAgICAgICAgbmFtZXM6IE9iamVjdEtleXMsXG4gICAgICAgIGRlZmluZVByb3BlcnR5OiBPYmplY3REZWZpbmVQcm9wZXJ0eSxcbiAgICAgICAgZ2V0RGVzY3JpcHRvcjogT2JqZWN0R2V0RGVzY3JpcHRvcixcbiAgICAgICAgZnJlZXplOiBPYmplY3RGcmVlemUsXG4gICAgICAgIGdldFByb3RvdHlwZU9mOiBPYmplY3RHZXRQcm90b3R5cGVPZixcbiAgICAgICAgaXNFUzU6IGlzRVM1LFxuICAgICAgICBwcm9wZXJ0eUlzV3JpdGFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG59LHt9XSwxNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciBQcm9taXNlTWFwID0gUHJvbWlzZS5tYXA7XG5cblByb21pc2UucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChmbiwgb3B0aW9ucykge1xuICAgIHJldHVybiBQcm9taXNlTWFwKHRoaXMsIGZuLCBvcHRpb25zLCBJTlRFUk5BTCk7XG59O1xuXG5Qcm9taXNlLmZpbHRlciA9IGZ1bmN0aW9uIChwcm9taXNlcywgZm4sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gUHJvbWlzZU1hcChwcm9taXNlcywgZm4sIG9wdGlvbnMsIElOVEVSTkFMKTtcbn07XG59O1xuXG59LHt9XSwxNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgTkVYVF9GSUxURVIsIHRyeUNvbnZlcnRUb1Byb21pc2UpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBpc1ByaW1pdGl2ZSA9IHV0aWwuaXNQcmltaXRpdmU7XG52YXIgdGhyb3dlciA9IHV0aWwudGhyb3dlcjtcblxuZnVuY3Rpb24gcmV0dXJuVGhpcygpIHtcbiAgICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHRocm93VGhpcygpIHtcbiAgICB0aHJvdyB0aGlzO1xufVxuZnVuY3Rpb24gcmV0dXJuJChyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9O1xufVxuZnVuY3Rpb24gdGhyb3ckKHIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IHI7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHByb21pc2VkRmluYWxseShyZXQsIHJlYXNvbk9yVmFsdWUsIGlzRnVsZmlsbGVkKSB7XG4gICAgdmFyIHRoZW47XG4gICAgaWYgKGlzUHJpbWl0aXZlKHJlYXNvbk9yVmFsdWUpKSB7XG4gICAgICAgIHRoZW4gPSBpc0Z1bGZpbGxlZCA/IHJldHVybiQocmVhc29uT3JWYWx1ZSkgOiB0aHJvdyQocmVhc29uT3JWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhlbiA9IGlzRnVsZmlsbGVkID8gcmV0dXJuVGhpcyA6IHRocm93VGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHJldC5fdGhlbih0aGVuLCB0aHJvd2VyLCB1bmRlZmluZWQsIHJlYXNvbk9yVmFsdWUsIHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIGZpbmFsbHlIYW5kbGVyKHJlYXNvbk9yVmFsdWUpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcbiAgICB2YXIgaGFuZGxlciA9IHRoaXMuaGFuZGxlcjtcblxuICAgIHZhciByZXQgPSBwcm9taXNlLl9pc0JvdW5kKClcbiAgICAgICAgICAgICAgICAgICAgPyBoYW5kbGVyLmNhbGwocHJvbWlzZS5fYm91bmRWYWx1ZSgpKVxuICAgICAgICAgICAgICAgICAgICA6IGhhbmRsZXIoKTtcblxuICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHByb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlZEZpbmFsbHkobWF5YmVQcm9taXNlLCByZWFzb25PclZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5pc0Z1bGZpbGxlZCgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcm9taXNlLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICBORVhUX0ZJTFRFUi5lID0gcmVhc29uT3JWYWx1ZTtcbiAgICAgICAgcmV0dXJuIE5FWFRfRklMVEVSO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZWFzb25PclZhbHVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdGFwSGFuZGxlcih2YWx1ZSkge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuICAgIHZhciBoYW5kbGVyID0gdGhpcy5oYW5kbGVyO1xuXG4gICAgdmFyIHJldCA9IHByb21pc2UuX2lzQm91bmQoKVxuICAgICAgICAgICAgICAgICAgICA/IGhhbmRsZXIuY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCksIHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IGhhbmRsZXIodmFsdWUpO1xuXG4gICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJldCwgcHJvbWlzZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VkRmluYWxseShtYXliZVByb21pc2UsIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cblByb21pc2UucHJvdG90eXBlLl9wYXNzVGhyb3VnaEhhbmRsZXIgPSBmdW5jdGlvbiAoaGFuZGxlciwgaXNGaW5hbGx5KSB7XG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0aGlzLnRoZW4oKTtcblxuICAgIHZhciBwcm9taXNlQW5kSGFuZGxlciA9IHtcbiAgICAgICAgcHJvbWlzZTogdGhpcyxcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlclxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgIGlzRmluYWxseSA/IGZpbmFsbHlIYW5kbGVyIDogdGFwSGFuZGxlcixcbiAgICAgICAgICAgIGlzRmluYWxseSA/IGZpbmFsbHlIYW5kbGVyIDogdW5kZWZpbmVkLCB1bmRlZmluZWQsXG4gICAgICAgICAgICBwcm9taXNlQW5kSGFuZGxlciwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmxhc3RseSA9XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl9wYXNzVGhyb3VnaEhhbmRsZXIoaGFuZGxlciwgdHJ1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl9wYXNzVGhyb3VnaEhhbmRsZXIoaGFuZGxlciwgZmFsc2UpO1xufTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwxNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXBpUmVqZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBJTlRFUk5BTCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSkge1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKTtcbnZhciBUeXBlRXJyb3IgPSBlcnJvcnMuVHlwZUVycm9yO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgeWllbGRIYW5kbGVycyA9IFtdO1xuXG5mdW5jdGlvbiBwcm9taXNlRnJvbVlpZWxkSGFuZGxlcih2YWx1ZSwgeWllbGRIYW5kbGVycywgdHJhY2VQYXJlbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHlpZWxkSGFuZGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdHJhY2VQYXJlbnQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaCh5aWVsZEhhbmRsZXJzW2ldKSh2YWx1ZSk7XG4gICAgICAgIHRyYWNlUGFyZW50Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICB0cmFjZVBhcmVudC5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBQcm9taXNlLnJlamVjdChlcnJvck9iai5lKTtcbiAgICAgICAgICAgIHRyYWNlUGFyZW50Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJlc3VsdCwgdHJhY2VQYXJlbnQpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkgcmV0dXJuIG1heWJlUHJvbWlzZTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIFByb21pc2VTcGF3bihnZW5lcmF0b3JGdW5jdGlvbiwgcmVjZWl2ZXIsIHlpZWxkSGFuZGxlciwgc3RhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB0aGlzLl9zdGFjayA9IHN0YWNrO1xuICAgIHRoaXMuX2dlbmVyYXRvckZ1bmN0aW9uID0gZ2VuZXJhdG9yRnVuY3Rpb247XG4gICAgdGhpcy5fcmVjZWl2ZXIgPSByZWNlaXZlcjtcbiAgICB0aGlzLl9nZW5lcmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5feWllbGRIYW5kbGVycyA9IHR5cGVvZiB5aWVsZEhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IFt5aWVsZEhhbmRsZXJdLmNvbmNhdCh5aWVsZEhhbmRsZXJzKVxuICAgICAgICA6IHlpZWxkSGFuZGxlcnM7XG59XG5cblByb21pc2VTcGF3bi5wcm90b3R5cGUucHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbn07XG5cblByb21pc2VTcGF3bi5wcm90b3R5cGUuX3J1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9nZW5lcmF0b3IgPSB0aGlzLl9nZW5lcmF0b3JGdW5jdGlvbi5jYWxsKHRoaXMuX3JlY2VpdmVyKTtcbiAgICB0aGlzLl9yZWNlaXZlciA9XG4gICAgICAgIHRoaXMuX2dlbmVyYXRvckZ1bmN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX25leHQodW5kZWZpbmVkKTtcbn07XG5cblByb21pc2VTcGF3bi5wcm90b3R5cGUuX2NvbnRpbnVlID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGlmIChyZXN1bHQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXN1bHQuZSwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZSA9IHJlc3VsdC52YWx1ZTtcbiAgICBpZiAocmVzdWx0LmRvbmUgPT09IHRydWUpIHtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh2YWx1ZSwgdGhpcy5fcHJvbWlzZSk7XG4gICAgICAgIGlmICghKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPVxuICAgICAgICAgICAgICAgIHByb21pc2VGcm9tWWllbGRIYW5kbGVyKG1heWJlUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl95aWVsZEhhbmRsZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb21pc2UpO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Rocm93KFxuICAgICAgICAgICAgICAgICAgICBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBIHZhbHVlICVzIHdhcyB5aWVsZGVkIHRoYXQgY291bGQgbm90IGJlIHRyZWF0ZWQgYXMgYSBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvNFk0cERrXFx1MDAwYVxcdTAwMGFcIi5yZXBsYWNlKFwiJXNcIiwgdmFsdWUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRnJvbSBjb3JvdXRpbmU6XFx1MDAwYVwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YWNrLnNwbGl0KFwiXFxuXCIpLnNsaWNlKDEsIC03KS5qb2luKFwiXFxuXCIpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtYXliZVByb21pc2UuX3RoZW4oXG4gICAgICAgICAgICB0aGlzLl9uZXh0LFxuICAgICAgICAgICAgdGhpcy5fdGhyb3csXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgbnVsbFxuICAgICAgICk7XG4gICAgfVxufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fdGhyb3cgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZShyZWFzb24pO1xuICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKHRoaXMuX2dlbmVyYXRvcltcInRocm93XCJdKVxuICAgICAgICAuY2FsbCh0aGlzLl9nZW5lcmF0b3IsIHJlYXNvbik7XG4gICAgdGhpcy5fcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbnRpbnVlKHJlc3VsdCk7XG59O1xuXG5Qcm9taXNlU3Bhd24ucHJvdG90eXBlLl9uZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2godGhpcy5fZ2VuZXJhdG9yLm5leHQpLmNhbGwodGhpcy5fZ2VuZXJhdG9yLCB2YWx1ZSk7XG4gICAgdGhpcy5fcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbnRpbnVlKHJlc3VsdCk7XG59O1xuXG5Qcm9taXNlLmNvcm91dGluZSA9IGZ1bmN0aW9uIChnZW5lcmF0b3JGdW5jdGlvbiwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZ2VuZXJhdG9yRnVuY3Rpb24gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZ2VuZXJhdG9yRnVuY3Rpb24gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvNlZxaG0wXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdmFyIHlpZWxkSGFuZGxlciA9IE9iamVjdChvcHRpb25zKS55aWVsZEhhbmRsZXI7XG4gICAgdmFyIFByb21pc2VTcGF3biQgPSBQcm9taXNlU3Bhd247XG4gICAgdmFyIHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IGdlbmVyYXRvckZ1bmN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBzcGF3biA9IG5ldyBQcm9taXNlU3Bhd24kKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB5aWVsZEhhbmRsZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrKTtcbiAgICAgICAgc3Bhd24uX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgc3Bhd24uX25leHQodW5kZWZpbmVkKTtcbiAgICAgICAgcmV0dXJuIHNwYXduLnByb21pc2UoKTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5jb3JvdXRpbmUuYWRkWWllbGRIYW5kbGVyID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIHlpZWxkSGFuZGxlcnMucHVzaChmbik7XG59O1xuXG5Qcm9taXNlLnNwYXduID0gZnVuY3Rpb24gKGdlbmVyYXRvckZ1bmN0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBnZW5lcmF0b3JGdW5jdGlvbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJnZW5lcmF0b3JGdW5jdGlvbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC82VnFobTBcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgc3Bhd24gPSBuZXcgUHJvbWlzZVNwYXduKGdlbmVyYXRvckZ1bmN0aW9uLCB0aGlzKTtcbiAgICB2YXIgcmV0ID0gc3Bhd24ucHJvbWlzZSgpO1xuICAgIHNwYXduLl9ydW4oUHJvbWlzZS5zcGF3bik7XG4gICAgcmV0dXJuIHJldDtcbn07XG59O1xuXG59LHtcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL3V0aWwuanNcIjozOH1dLDE4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24oUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGNhbkV2YWx1YXRlID0gdXRpbC5jYW5FdmFsdWF0ZTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIHJlamVjdDtcblxuaWYgKCF0cnVlKSB7XG5pZiAoY2FuRXZhbHVhdGUpIHtcbiAgICB2YXIgdGhlbkNhbGxiYWNrID0gZnVuY3Rpb24oaSkge1xuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwidmFsdWVcIiwgXCJob2xkZXJcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBob2xkZXIucEluZGV4ID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBob2xkZXIuY2hlY2tGdWxmaWxsbWVudCh0aGlzKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBcIi5yZXBsYWNlKC9JbmRleC9nLCBpKSk7XG4gICAgfTtcblxuICAgIHZhciBjYWxsZXIgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGNvdW50OyArK2kpIHZhbHVlcy5wdXNoKFwiaG9sZGVyLnBcIiArIGkpO1xuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwiaG9sZGVyXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gaG9sZGVyLmZuOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHZhbHVlcyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgXCIucmVwbGFjZSgvdmFsdWVzL2csIHZhbHVlcy5qb2luKFwiLCBcIikpKTtcbiAgICB9O1xuICAgIHZhciB0aGVuQ2FsbGJhY2tzID0gW107XG4gICAgdmFyIGNhbGxlcnMgPSBbdW5kZWZpbmVkXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSA1OyArK2kpIHtcbiAgICAgICAgdGhlbkNhbGxiYWNrcy5wdXNoKHRoZW5DYWxsYmFjayhpKSk7XG4gICAgICAgIGNhbGxlcnMucHVzaChjYWxsZXIoaSkpO1xuICAgIH1cblxuICAgIHZhciBIb2xkZXIgPSBmdW5jdGlvbih0b3RhbCwgZm4pIHtcbiAgICAgICAgdGhpcy5wMSA9IHRoaXMucDIgPSB0aGlzLnAzID0gdGhpcy5wNCA9IHRoaXMucDUgPSBudWxsO1xuICAgICAgICB0aGlzLmZuID0gZm47XG4gICAgICAgIHRoaXMudG90YWwgPSB0b3RhbDtcbiAgICAgICAgdGhpcy5ub3cgPSAwO1xuICAgIH07XG5cbiAgICBIb2xkZXIucHJvdG90eXBlLmNhbGxlcnMgPSBjYWxsZXJzO1xuICAgIEhvbGRlci5wcm90b3R5cGUuY2hlY2tGdWxmaWxsbWVudCA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMubm93O1xuICAgICAgICBub3crKztcbiAgICAgICAgdmFyIHRvdGFsID0gdGhpcy50b3RhbDtcbiAgICAgICAgaWYgKG5vdyA+PSB0b3RhbCkge1xuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmNhbGxlcnNbdG90YWxdO1xuICAgICAgICAgICAgcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgICAgIHZhciByZXQgPSB0cnlDYXRjaChoYW5kbGVyKSh0aGlzKTtcbiAgICAgICAgICAgIHByb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICAgICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmV0LmUsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHJldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm5vdyA9IG5vdztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aGlzLl9yZWplY3QocmVhc29uKTtcbiAgICB9O1xufVxufVxuXG5Qcm9taXNlLmpvaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhc3QgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTtcbiAgICB2YXIgZm47XG4gICAgaWYgKGxhc3QgPiAwICYmIHR5cGVvZiBhcmd1bWVudHNbbGFzdF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBmbiA9IGFyZ3VtZW50c1tsYXN0XTtcbiAgICAgICAgaWYgKCF0cnVlKSB7XG4gICAgICAgICAgICBpZiAobGFzdCA8IDYgJiYgY2FuRXZhbHVhdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICAgICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgaG9sZGVyID0gbmV3IEhvbGRlcihsYXN0LCBmbik7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHRoZW5DYWxsYmFja3M7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0OyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UoYXJndW1lbnRzW2ldLCByZXQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKGNhbGxiYWNrc1tpXSwgcmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHJldCwgaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldLmNhbGwocmV0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fdmFsdWUoKSwgaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0Ll9yZWplY3QobWF5YmVQcm9taXNlLl9yZWFzb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbChyZXQsIG1heWJlUHJvbWlzZSwgaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciAkX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7dmFyIGFyZ3MgPSBuZXcgQXJyYXkoJF9sZW4pOyBmb3IodmFyICRfaSA9IDA7ICRfaSA8ICRfbGVuOyArKyRfaSkge2FyZ3NbJF9pXSA9IGFyZ3VtZW50c1skX2ldO31cbiAgICBpZiAoZm4pIGFyZ3MucG9wKCk7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlQXJyYXkoYXJncykucHJvbWlzZSgpO1xuICAgIHJldHVybiBmbiAhPT0gdW5kZWZpbmVkID8gcmV0LnNwcmVhZChmbikgOiByZXQ7XG59O1xuXG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMTk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2VBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXBpUmVqZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlDb252ZXJ0VG9Qcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBJTlRFUk5BTCkge1xudmFyIGdldERvbWFpbiA9IFByb21pc2UuX2dldERvbWFpbjtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgUEVORElORyA9IHt9O1xudmFyIEVNUFRZX0FSUkFZID0gW107XG5cbmZ1bmN0aW9uIE1hcHBpbmdQcm9taXNlQXJyYXkocHJvbWlzZXMsIGZuLCBsaW1pdCwgX2ZpbHRlcikge1xuICAgIHRoaXMuY29uc3RydWN0b3IkKHByb21pc2VzKTtcbiAgICB0aGlzLl9wcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHZhciBkb21haW4gPSBnZXREb21haW4oKTtcbiAgICB0aGlzLl9jYWxsYmFjayA9IGRvbWFpbiA9PT0gbnVsbCA/IGZuIDogZG9tYWluLmJpbmQoZm4pO1xuICAgIHRoaXMuX3ByZXNlcnZlZFZhbHVlcyA9IF9maWx0ZXIgPT09IElOVEVSTkFMXG4gICAgICAgID8gbmV3IEFycmF5KHRoaXMubGVuZ3RoKCkpXG4gICAgICAgIDogbnVsbDtcbiAgICB0aGlzLl9saW1pdCA9IGxpbWl0O1xuICAgIHRoaXMuX2luRmxpZ2h0ID0gMDtcbiAgICB0aGlzLl9xdWV1ZSA9IGxpbWl0ID49IDEgPyBbXSA6IEVNUFRZX0FSUkFZO1xuICAgIGFzeW5jLmludm9rZShpbml0LCB0aGlzLCB1bmRlZmluZWQpO1xufVxudXRpbC5pbmhlcml0cyhNYXBwaW5nUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuZnVuY3Rpb24gaW5pdCgpIHt0aGlzLl9pbml0JCh1bmRlZmluZWQsIC0yKTt9XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge307XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdmFyIHByZXNlcnZlZFZhbHVlcyA9IHRoaXMuX3ByZXNlcnZlZFZhbHVlcztcbiAgICB2YXIgbGltaXQgPSB0aGlzLl9saW1pdDtcbiAgICBpZiAodmFsdWVzW2luZGV4XSA9PT0gUEVORElORykge1xuICAgICAgICB2YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgIGlmIChsaW1pdCA+PSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9pbkZsaWdodC0tO1xuICAgICAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzUmVzb2x2ZWQoKSkgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGxpbWl0ID49IDEgJiYgdGhpcy5faW5GbGlnaHQgPj0gbGltaXQpIHtcbiAgICAgICAgICAgIHZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVzZXJ2ZWRWYWx1ZXMgIT09IG51bGwpIHByZXNlcnZlZFZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9jYWxsYmFjaztcbiAgICAgICAgdmFyIHJlY2VpdmVyID0gdGhpcy5fcHJvbWlzZS5fYm91bmRWYWx1ZSgpO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2goY2FsbGJhY2spLmNhbGwocmVjZWl2ZXIsIHZhbHVlLCBpbmRleCwgbGVuZ3RoKTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikgcmV0dXJuIHRoaXMuX3JlamVjdChyZXQuZSk7XG5cbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmV0LCB0aGlzLl9wcm9taXNlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgICAgIGlmIChsaW1pdCA+PSAxKSB0aGlzLl9pbkZsaWdodCsrO1xuICAgICAgICAgICAgICAgIHZhbHVlc1tpbmRleF0gPSBQRU5ESU5HO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXliZVByb21pc2UuX3Byb3h5UHJvbWlzZUFycmF5KHRoaXMsIGluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0ID0gbWF5YmVQcm9taXNlLl92YWx1ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0KG1heWJlUHJvbWlzZS5fcmVhc29uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tpbmRleF0gPSByZXQ7XG4gICAgfVxuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IGxlbmd0aCkge1xuICAgICAgICBpZiAocHJlc2VydmVkVmFsdWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9maWx0ZXIodmFsdWVzLCBwcmVzZXJ2ZWRWYWx1ZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSh2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICB9XG59O1xuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZHJhaW5RdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl9xdWV1ZTtcbiAgICB2YXIgbGltaXQgPSB0aGlzLl9saW1pdDtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwICYmIHRoaXMuX2luRmxpZ2h0IDwgbGltaXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzUmVzb2x2ZWQoKSkgcmV0dXJuO1xuICAgICAgICB2YXIgaW5kZXggPSBxdWV1ZS5wb3AoKTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZCh2YWx1ZXNbaW5kZXhdLCBpbmRleCk7XG4gICAgfVxufTtcblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUuX2ZpbHRlciA9IGZ1bmN0aW9uIChib29sZWFucywgdmFsdWVzKSB7XG4gICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShsZW4pO1xuICAgIHZhciBqID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIGlmIChib29sZWFuc1tpXSkgcmV0W2orK10gPSB2YWx1ZXNbaV07XG4gICAgfVxuICAgIHJldC5sZW5ndGggPSBqO1xuICAgIHRoaXMuX3Jlc29sdmUocmV0KTtcbn07XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLnByZXNlcnZlZFZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlc2VydmVkVmFsdWVzO1xufTtcblxuZnVuY3Rpb24gbWFwKHByb21pc2VzLCBmbiwgb3B0aW9ucywgX2ZpbHRlcikge1xuICAgIHZhciBsaW1pdCA9IHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnMgIT09IG51bGxcbiAgICAgICAgPyBvcHRpb25zLmNvbmN1cnJlbmN5XG4gICAgICAgIDogMDtcbiAgICBsaW1pdCA9IHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICBpc0Zpbml0ZShsaW1pdCkgJiYgbGltaXQgPj0gMSA/IGxpbWl0IDogMDtcbiAgICByZXR1cm4gbmV3IE1hcHBpbmdQcm9taXNlQXJyYXkocHJvbWlzZXMsIGZuLCBsaW1pdCwgX2ZpbHRlcik7XG59XG5cblByb21pc2UucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmbiwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFwaVJlamVjdGlvbihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG5cbiAgICByZXR1cm4gbWFwKHRoaXMsIGZuLCBvcHRpb25zLCBudWxsKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLm1hcCA9IGZ1bmN0aW9uIChwcm9taXNlcywgZm4sIG9wdGlvbnMsIF9maWx0ZXIpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhcGlSZWplY3Rpb24oXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIHJldHVybiBtYXAocHJvbWlzZXMsIGZuLCBvcHRpb25zLCBfZmlsdGVyKS5wcm9taXNlKCk7XG59O1xuXG5cbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL3V0aWwuanNcIjozOH1dLDIwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcblxuUHJvbWlzZS5tZXRob2QgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFByb21pc2UuVHlwZUVycm9yKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgICAgICByZXQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRyeUNhdGNoKGZuKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXQuX3BvcENvbnRleHQoKTtcbiAgICAgICAgcmV0Ll9yZXNvbHZlRnJvbVN5bmNWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbn07XG5cblByb21pc2UuYXR0ZW1wdCA9IFByb21pc2VbXCJ0cnlcIl0gPSBmdW5jdGlvbiAoZm4sIGFyZ3MsIGN0eCkge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgcmV0Ll9wdXNoQ29udGV4dCgpO1xuICAgIHZhciB2YWx1ZSA9IHV0aWwuaXNBcnJheShhcmdzKVxuICAgICAgICA/IHRyeUNhdGNoKGZuKS5hcHBseShjdHgsIGFyZ3MpXG4gICAgICAgIDogdHJ5Q2F0Y2goZm4pLmNhbGwoY3R4LCBhcmdzKTtcbiAgICByZXQuX3BvcENvbnRleHQoKTtcbiAgICByZXQuX3Jlc29sdmVGcm9tU3luY1ZhbHVlKHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Jlc29sdmVGcm9tU3luY1ZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1dGlsLmVycm9yT2JqKSB7XG4gICAgICAgIHRoaXMuX3JlamVjdENhbGxiYWNrKHZhbHVlLmUsIGZhbHNlLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUsIHRydWUpO1xuICAgIH1cbn07XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMjE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG5cbmZ1bmN0aW9uIHNwcmVhZEFkYXB0ZXIodmFsLCBub2RlYmFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICBpZiAoIXV0aWwuaXNBcnJheSh2YWwpKSByZXR1cm4gc3VjY2Vzc0FkYXB0ZXIuY2FsbChwcm9taXNlLCB2YWwsIG5vZGViYWNrKTtcbiAgICB2YXIgcmV0ID1cbiAgICAgICAgdHJ5Q2F0Y2gobm9kZWJhY2spLmFwcGx5KHByb21pc2UuX2JvdW5kVmFsdWUoKSwgW251bGxdLmNvbmNhdCh2YWwpKTtcbiAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKHJldC5lKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN1Y2Nlc3NBZGFwdGVyKHZhbCwgbm9kZWJhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIHJlY2VpdmVyID0gcHJvbWlzZS5fYm91bmRWYWx1ZSgpO1xuICAgIHZhciByZXQgPSB2YWwgPT09IHVuZGVmaW5lZFxuICAgICAgICA/IHRyeUNhdGNoKG5vZGViYWNrKS5jYWxsKHJlY2VpdmVyLCBudWxsKVxuICAgICAgICA6IHRyeUNhdGNoKG5vZGViYWNrKS5jYWxsKHJlY2VpdmVyLCBudWxsLCB2YWwpO1xuICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIocmV0LmUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVycm9yQWRhcHRlcihyZWFzb24sIG5vZGViYWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIGlmICghcmVhc29uKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBwcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgdmFyIG5ld1JlYXNvbiA9IHRhcmdldC5fZ2V0Q2FycmllZFN0YWNrVHJhY2UoKTtcbiAgICAgICAgbmV3UmVhc29uLmNhdXNlID0gcmVhc29uO1xuICAgICAgICByZWFzb24gPSBuZXdSZWFzb247XG4gICAgfVxuICAgIHZhciByZXQgPSB0cnlDYXRjaChub2RlYmFjaykuY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCksIHJlYXNvbik7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihyZXQuZSk7XG4gICAgfVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hc0NhbGxiYWNrID1cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAobm9kZWJhY2ssIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG5vZGViYWNrID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgYWRhcHRlciA9IHN1Y2Nlc3NBZGFwdGVyO1xuICAgICAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIE9iamVjdChvcHRpb25zKS5zcHJlYWQpIHtcbiAgICAgICAgICAgIGFkYXB0ZXIgPSBzcHJlYWRBZGFwdGVyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICBhZGFwdGVyLFxuICAgICAgICAgICAgZXJyb3JBZGFwdGVyLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIG5vZGViYWNrXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL3V0aWwuanNcIjozOH1dLDIyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXkpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG5cblByb21pc2UucHJvdG90eXBlLnByb2dyZXNzZWQgPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl90aGVuKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBoYW5kbGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NWYWx1ZSkge1xuICAgIGlmICh0aGlzLl9pc0ZvbGxvd2luZ09yRnVsZmlsbGVkT3JSZWplY3RlZCgpKSByZXR1cm47XG4gICAgdGhpcy5fdGFyZ2V0KCkuX3Byb2dyZXNzVW5jaGVja2VkKHByb2dyZXNzVmFsdWUpO1xuXG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvZ3Jlc3NIYW5kbGVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IDBcbiAgICAgICAgPyB0aGlzLl9wcm9ncmVzc0hhbmRsZXIwXG4gICAgICAgIDogdGhpc1soaW5kZXggPDwgMikgKyBpbmRleCAtIDUgKyAyXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9kb1Byb2dyZXNzV2l0aCA9IGZ1bmN0aW9uIChwcm9ncmVzc2lvbikge1xuICAgIHZhciBwcm9ncmVzc1ZhbHVlID0gcHJvZ3Jlc3Npb24udmFsdWU7XG4gICAgdmFyIGhhbmRsZXIgPSBwcm9ncmVzc2lvbi5oYW5kbGVyO1xuICAgIHZhciBwcm9taXNlID0gcHJvZ3Jlc3Npb24ucHJvbWlzZTtcbiAgICB2YXIgcmVjZWl2ZXIgPSBwcm9ncmVzc2lvbi5yZWNlaXZlcjtcblxuICAgIHZhciByZXQgPSB0cnlDYXRjaChoYW5kbGVyKS5jYWxsKHJlY2VpdmVyLCBwcm9ncmVzc1ZhbHVlKTtcbiAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICBpZiAocmV0LmUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgcmV0LmUubmFtZSAhPT0gXCJTdG9wUHJvZ3Jlc3NQcm9wYWdhdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIgdHJhY2UgPSB1dGlsLmNhbkF0dGFjaFRyYWNlKHJldC5lKVxuICAgICAgICAgICAgICAgID8gcmV0LmUgOiBuZXcgRXJyb3IodXRpbC50b1N0cmluZyhyZXQuZSkpO1xuICAgICAgICAgICAgcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZSh0cmFjZSk7XG4gICAgICAgICAgICBwcm9taXNlLl9wcm9ncmVzcyhyZXQuZSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0Ll90aGVuKHByb21pc2UuX3Byb2dyZXNzLCBudWxsLCBudWxsLCBwcm9taXNlLCB1bmRlZmluZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHByb21pc2UuX3Byb2dyZXNzKHJldCk7XG4gICAgfVxufTtcblxuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvZ3Jlc3NVbmNoZWNrZWQgPSBmdW5jdGlvbiAocHJvZ3Jlc3NWYWx1ZSkge1xuICAgIHZhciBsZW4gPSB0aGlzLl9sZW5ndGgoKTtcbiAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLl9wcm9ncmVzcztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5fcHJvZ3Jlc3NIYW5kbGVyQXQoaSk7XG4gICAgICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZUF0KGkpO1xuICAgICAgICBpZiAoIShwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgICAgIHZhciByZWNlaXZlciA9IHRoaXMuX3JlY2VpdmVyQXQoaSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY2FsbChyZWNlaXZlciwgcHJvZ3Jlc3NWYWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlY2VpdmVyIGluc3RhbmNlb2YgUHJvbWlzZUFycmF5ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICFyZWNlaXZlci5faXNSZXNvbHZlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIuX3Byb21pc2VQcm9ncmVzc2VkKHByb2dyZXNzVmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgYXN5bmMuaW52b2tlKHRoaXMuX2RvUHJvZ3Jlc3NXaXRoLCB0aGlzLCB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgICAgICAgICBwcm9taXNlOiBwcm9taXNlLFxuICAgICAgICAgICAgICAgIHJlY2VpdmVyOiB0aGlzLl9yZWNlaXZlckF0KGkpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9ncmVzc1ZhbHVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFzeW5jLmludm9rZShwcm9ncmVzcywgcHJvbWlzZSwgcHJvZ3Jlc3NWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vdXRpbC5qc1wiOjM4fV0sMjM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xudmFyIG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVHlwZUVycm9yKFwiY2lyY3VsYXIgcHJvbWlzZSByZXNvbHV0aW9uIGNoYWluXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTGhGcG8wXFx1MDAwYVwiKTtcbn07XG52YXIgcmVmbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZS5Qcm9taXNlSW5zcGVjdGlvbih0aGlzLl90YXJnZXQoKSk7XG59O1xudmFyIGFwaVJlamVjdGlvbiA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKG1zZykpO1xufTtcblxudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xuXG52YXIgZ2V0RG9tYWluO1xuaWYgKHV0aWwuaXNOb2RlKSB7XG4gICAgZ2V0RG9tYWluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXQgPSBwcm9jZXNzLmRvbWFpbjtcbiAgICAgICAgaWYgKHJldCA9PT0gdW5kZWZpbmVkKSByZXQgPSBudWxsO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG59IGVsc2Uge1xuICAgIGdldERvbWFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xufVxudXRpbC5ub3RFbnVtZXJhYmxlUHJvcChQcm9taXNlLCBcIl9nZXREb21haW5cIiwgZ2V0RG9tYWluKTtcblxudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgZXJyb3JzID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpO1xudmFyIFR5cGVFcnJvciA9IFByb21pc2UuVHlwZUVycm9yID0gZXJyb3JzLlR5cGVFcnJvcjtcblByb21pc2UuUmFuZ2VFcnJvciA9IGVycm9ycy5SYW5nZUVycm9yO1xuUHJvbWlzZS5DYW5jZWxsYXRpb25FcnJvciA9IGVycm9ycy5DYW5jZWxsYXRpb25FcnJvcjtcblByb21pc2UuVGltZW91dEVycm9yID0gZXJyb3JzLlRpbWVvdXRFcnJvcjtcblByb21pc2UuT3BlcmF0aW9uYWxFcnJvciA9IGVycm9ycy5PcGVyYXRpb25hbEVycm9yO1xuUHJvbWlzZS5SZWplY3Rpb25FcnJvciA9IGVycm9ycy5PcGVyYXRpb25hbEVycm9yO1xuUHJvbWlzZS5BZ2dyZWdhdGVFcnJvciA9IGVycm9ycy5BZ2dyZWdhdGVFcnJvcjtcbnZhciBJTlRFUk5BTCA9IGZ1bmN0aW9uKCl7fTtcbnZhciBBUFBMWSA9IHt9O1xudmFyIE5FWFRfRklMVEVSID0ge2U6IG51bGx9O1xudmFyIHRyeUNvbnZlcnRUb1Byb21pc2UgPSBfZGVyZXFfKFwiLi90aGVuYWJsZXMuanNcIikoUHJvbWlzZSwgSU5URVJOQUwpO1xudmFyIFByb21pc2VBcnJheSA9XG4gICAgX2RlcmVxXyhcIi4vcHJvbWlzZV9hcnJheS5qc1wiKShQcm9taXNlLCBJTlRFUk5BTCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbik7XG52YXIgQ2FwdHVyZWRUcmFjZSA9IF9kZXJlcV8oXCIuL2NhcHR1cmVkX3RyYWNlLmpzXCIpKCk7XG52YXIgaXNEZWJ1Z2dpbmcgPSBfZGVyZXFfKFwiLi9kZWJ1Z2dhYmlsaXR5LmpzXCIpKFByb21pc2UsIENhcHR1cmVkVHJhY2UpO1xuIC8qanNoaW50IHVudXNlZDpmYWxzZSovXG52YXIgY3JlYXRlQ29udGV4dCA9XG4gICAgX2RlcmVxXyhcIi4vY29udGV4dC5qc1wiKShQcm9taXNlLCBDYXB0dXJlZFRyYWNlLCBpc0RlYnVnZ2luZyk7XG52YXIgQ2F0Y2hGaWx0ZXIgPSBfZGVyZXFfKFwiLi9jYXRjaF9maWx0ZXIuanNcIikoTkVYVF9GSUxURVIpO1xudmFyIFByb21pc2VSZXNvbHZlciA9IF9kZXJlcV8oXCIuL3Byb21pc2VfcmVzb2x2ZXIuanNcIik7XG52YXIgbm9kZWJhY2tGb3JQcm9taXNlID0gUHJvbWlzZVJlc29sdmVyLl9ub2RlYmFja0ZvclByb21pc2U7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgcmVzb2x2ZXIgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9FQzIyWW5cXHUwMDBhXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25zdHJ1Y3RvciAhPT0gUHJvbWlzZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidGhlIHByb21pc2UgY29uc3RydWN0b3IgY2Fubm90IGJlIGludm9rZWQgZGlyZWN0bHlcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9Lc0lsZ2VcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB0aGlzLl9iaXRGaWVsZCA9IDA7XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9wcm9ncmVzc0hhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Byb21pc2UwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3JlY2VpdmVyMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zZXR0bGVkVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHJlc29sdmVyICE9PSBJTlRFUk5BTCkgdGhpcy5fcmVzb2x2ZUZyb21SZXNvbHZlcihyZXNvbHZlcik7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZV1cIjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmNhdWdodCA9IFByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAobGVuID4gMSkge1xuICAgICAgICB2YXIgY2F0Y2hJbnN0YW5jZXMgPSBuZXcgQXJyYXkobGVuIC0gMSksXG4gICAgICAgICAgICBqID0gMCwgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbiAtIDE7ICsraSkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGNhdGNoSW5zdGFuY2VzW2orK10gPSBpdGVtO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBUeXBlRXJyb3IoXCJDYXRjaCBmaWx0ZXIgbXVzdCBpbmhlcml0IGZyb20gRXJyb3Igb3IgYmUgYSBzaW1wbGUgcHJlZGljYXRlIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvbzg0bzY4XFx1MDAwYVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2hJbnN0YW5jZXMubGVuZ3RoID0gajtcbiAgICAgICAgZm4gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHZhciBjYXRjaEZpbHRlciA9IG5ldyBDYXRjaEZpbHRlcihjYXRjaEluc3RhbmNlcywgZm4sIHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcy5fdGhlbih1bmRlZmluZWQsIGNhdGNoRmlsdGVyLmRvRmlsdGVyLCB1bmRlZmluZWQsXG4gICAgICAgICAgICBjYXRjaEZpbHRlciwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4odW5kZWZpbmVkLCBmbiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yZWZsZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl90aGVuKHJlZmxlY3QsIHJlZmxlY3QsIHVuZGVmaW5lZCwgdGhpcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcykge1xuICAgIGlmIChpc0RlYnVnZ2luZygpICYmIGFyZ3VtZW50cy5sZW5ndGggPiAwICYmXG4gICAgICAgIHR5cGVvZiBkaWRGdWxmaWxsICE9PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgdHlwZW9mIGRpZFJlamVjdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBtc2cgPSBcIi50aGVuKCkgb25seSBhY2NlcHRzIGZ1bmN0aW9ucyBidXQgd2FzIHBhc3NlZDogXCIgK1xuICAgICAgICAgICAgICAgIHV0aWwuY2xhc3NTdHJpbmcoZGlkRnVsZmlsbCk7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgbXNnICs9IFwiLCBcIiArIHV0aWwuY2xhc3NTdHJpbmcoZGlkUmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl93YXJuKG1zZyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90aGVuKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MsXG4gICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fdGhlbihkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzLFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgcHJvbWlzZS5fc2V0SXNGaW5hbCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLl90aGVuKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgdW5kZWZpbmVkLCBBUFBMWSwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzQ2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzUmVzb2x2ZWQoKSAmJlxuICAgICAgICB0aGlzLl9jYW5jZWxsYWJsZSgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXQgPSB7XG4gICAgICAgIGlzRnVsZmlsbGVkOiBmYWxzZSxcbiAgICAgICAgaXNSZWplY3RlZDogZmFsc2UsXG4gICAgICAgIGZ1bGZpbGxtZW50VmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgcmVqZWN0aW9uUmVhc29uOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIGlmICh0aGlzLmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgcmV0LmZ1bGZpbGxtZW50VmFsdWUgPSB0aGlzLnZhbHVlKCk7XG4gICAgICAgIHJldC5pc0Z1bGZpbGxlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICByZXQucmVqZWN0aW9uUmVhc29uID0gdGhpcy5yZWFzb24oKTtcbiAgICAgICAgcmV0LmlzUmVqZWN0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZUFycmF5KHRoaXMpLnByb21pc2UoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuY2F1Z2h0KHV0aWwub3JpZ2luYXRlc0Zyb21SZWplY3Rpb24sIGZuKTtcbn07XG5cblByb21pc2UuaXMgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIFByb21pc2U7XG59O1xuXG5Qcm9taXNlLmZyb21Ob2RlID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaChmbikobm9kZWJhY2tGb3JQcm9taXNlKHJldCkpO1xuICAgIGlmIChyZXN1bHQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIHJldC5fcmVqZWN0Q2FsbGJhY2socmVzdWx0LmUsIHRydWUsIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2VBcnJheShwcm9taXNlcykucHJvbWlzZSgpO1xufTtcblxuUHJvbWlzZS5kZWZlciA9IFByb21pc2UucGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2VSZXNvbHZlcihwcm9taXNlKTtcbn07XG5cblByb21pc2UuY2FzdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmV0ID0gdHJ5Q29udmVydFRvUHJvbWlzZShvYmopO1xuICAgIGlmICghKHJldCBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgICAgIHZhciB2YWwgPSByZXQ7XG4gICAgICAgIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgcmV0Ll9mdWxmaWxsVW5jaGVja2VkKHZhbCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnJlc29sdmUgPSBQcm9taXNlLmZ1bGZpbGxlZCA9IFByb21pc2UuY2FzdDtcblxuUHJvbWlzZS5yZWplY3QgPSBQcm9taXNlLnJlamVjdGVkID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHJldC5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCB0cnVlKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5zZXRTY2hlZHVsZXIgPSBmdW5jdGlvbihmbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgdmFyIHByZXYgPSBhc3luYy5fc2NoZWR1bGU7XG4gICAgYXN5bmMuX3NjaGVkdWxlID0gZm47XG4gICAgcmV0dXJuIHByZXY7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdGhlbiA9IGZ1bmN0aW9uIChcbiAgICBkaWRGdWxmaWxsLFxuICAgIGRpZFJlamVjdCxcbiAgICBkaWRQcm9ncmVzcyxcbiAgICByZWNlaXZlcixcbiAgICBpbnRlcm5hbERhdGFcbikge1xuICAgIHZhciBoYXZlSW50ZXJuYWxEYXRhID0gaW50ZXJuYWxEYXRhICE9PSB1bmRlZmluZWQ7XG4gICAgdmFyIHJldCA9IGhhdmVJbnRlcm5hbERhdGEgPyBpbnRlcm5hbERhdGEgOiBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG5cbiAgICBpZiAoIWhhdmVJbnRlcm5hbERhdGEpIHtcbiAgICAgICAgcmV0Ll9wcm9wYWdhdGVGcm9tKHRoaXMsIDQgfCAxKTtcbiAgICAgICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXQoKTtcbiAgICBpZiAodGFyZ2V0ICE9PSB0aGlzKSB7XG4gICAgICAgIGlmIChyZWNlaXZlciA9PT0gdW5kZWZpbmVkKSByZWNlaXZlciA9IHRoaXMuX2JvdW5kVG87XG4gICAgICAgIGlmICghaGF2ZUludGVybmFsRGF0YSkgcmV0Ll9zZXRJc01pZ3JhdGVkKCk7XG4gICAgfVxuXG4gICAgdmFyIGNhbGxiYWNrSW5kZXggPSB0YXJnZXQuX2FkZENhbGxiYWNrcyhkaWRGdWxmaWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlkUmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlkUHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNlaXZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldERvbWFpbigpKTtcblxuICAgIGlmICh0YXJnZXQuX2lzUmVzb2x2ZWQoKSAmJiAhdGFyZ2V0Ll9pc1NldHRsZVByb21pc2VzUXVldWVkKCkpIHtcbiAgICAgICAgYXN5bmMuaW52b2tlKFxuICAgICAgICAgICAgdGFyZ2V0Ll9zZXR0bGVQcm9taXNlQXRQb3N0UmVzb2x1dGlvbiwgdGFyZ2V0LCBjYWxsYmFja0luZGV4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldHRsZVByb21pc2VBdFBvc3RSZXNvbHV0aW9uID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKHRoaXMuX2lzUmVqZWN0aW9uVW5oYW5kbGVkKCkpIHRoaXMuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICB0aGlzLl9zZXR0bGVQcm9taXNlQXQoaW5kZXgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2xlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fYml0RmllbGQgJiAxMzEwNzE7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNGb2xsb3dpbmdPckZ1bGZpbGxlZE9yUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDkzOTUyNDA5NikgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzRm9sbG93aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA1MzY4NzA5MTIpID09PSA1MzY4NzA5MTI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gKHRoaXMuX2JpdEZpZWxkICYgLTEzMTA3MikgfFxuICAgICAgICAobGVuICYgMTMxMDcxKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDI2ODQzNTQ1Njtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMTM0MjE3NzI4O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldEZvbGxvd2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgNTM2ODcwOTEyO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldElzRmluYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDMzNTU0NDMyO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzRmluYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDMzNTU0NDMyKSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDY3MTA4ODY0KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Q2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDY3MTA4ODY0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0Q2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+NjcxMDg4NjQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldElzTWlncmF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDQxOTQzMDQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRJc01pZ3JhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjQxOTQzMDQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzTWlncmF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDQxOTQzMDQpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWNlaXZlckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgdmFyIHJldCA9IGluZGV4ID09PSAwXG4gICAgICAgID8gdGhpcy5fcmVjZWl2ZXIwXG4gICAgICAgIDogdGhpc1tcbiAgICAgICAgICAgIGluZGV4ICogNSAtIDUgKyA0XTtcbiAgICBpZiAocmV0ID09PSB1bmRlZmluZWQgJiYgdGhpcy5faXNCb3VuZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZFZhbHVlKCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvbWlzZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ID09PSAwXG4gICAgICAgID8gdGhpcy5fcHJvbWlzZTBcbiAgICAgICAgOiB0aGlzW2luZGV4ICogNSAtIDUgKyAzXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9mdWxmaWxsbWVudEhhbmRsZXJBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHJldHVybiBpbmRleCA9PT0gMFxuICAgICAgICA/IHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjBcbiAgICAgICAgOiB0aGlzW2luZGV4ICogNSAtIDUgKyAwXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3Rpb25IYW5kbGVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IDBcbiAgICAgICAgPyB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMFxuICAgICAgICA6IHRoaXNbaW5kZXggKiA1IC0gNSArIDFdO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2JvdW5kVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmV0ID0gdGhpcy5fYm91bmRUbztcbiAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXQuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXQudmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX21pZ3JhdGVDYWxsYmFja3MgPSBmdW5jdGlvbiAoZm9sbG93ZXIsIGluZGV4KSB7XG4gICAgdmFyIGZ1bGZpbGwgPSBmb2xsb3dlci5fZnVsZmlsbG1lbnRIYW5kbGVyQXQoaW5kZXgpO1xuICAgIHZhciByZWplY3QgPSBmb2xsb3dlci5fcmVqZWN0aW9uSGFuZGxlckF0KGluZGV4KTtcbiAgICB2YXIgcHJvZ3Jlc3MgPSBmb2xsb3dlci5fcHJvZ3Jlc3NIYW5kbGVyQXQoaW5kZXgpO1xuICAgIHZhciBwcm9taXNlID0gZm9sbG93ZXIuX3Byb21pc2VBdChpbmRleCk7XG4gICAgdmFyIHJlY2VpdmVyID0gZm9sbG93ZXIuX3JlY2VpdmVyQXQoaW5kZXgpO1xuICAgIGlmIChwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkgcHJvbWlzZS5fc2V0SXNNaWdyYXRlZCgpO1xuICAgIHRoaXMuX2FkZENhbGxiYWNrcyhmdWxmaWxsLCByZWplY3QsIHByb2dyZXNzLCBwcm9taXNlLCByZWNlaXZlciwgbnVsbCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fYWRkQ2FsbGJhY2tzID0gZnVuY3Rpb24gKFxuICAgIGZ1bGZpbGwsXG4gICAgcmVqZWN0LFxuICAgIHByb2dyZXNzLFxuICAgIHByb21pc2UsXG4gICAgcmVjZWl2ZXIsXG4gICAgZG9tYWluXG4pIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9sZW5ndGgoKTtcblxuICAgIGlmIChpbmRleCA+PSAxMzEwNzEgLSA1KSB7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fc2V0TGVuZ3RoKDApO1xuICAgIH1cblxuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICB0aGlzLl9wcm9taXNlMCA9IHByb21pc2U7XG4gICAgICAgIGlmIChyZWNlaXZlciAhPT0gdW5kZWZpbmVkKSB0aGlzLl9yZWNlaXZlcjAgPSByZWNlaXZlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBmdWxmaWxsID09PSBcImZ1bmN0aW9uXCIgJiYgIXRoaXMuX2lzQ2FycnlpbmdTdGFja1RyYWNlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IGZ1bGZpbGwgOiBkb21haW4uYmluZChmdWxmaWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJlamVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gcmVqZWN0IDogZG9tYWluLmJpbmQocmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHByb2dyZXNzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzSGFuZGxlcjAgPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IHByb2dyZXNzIDogZG9tYWluLmJpbmQocHJvZ3Jlc3MpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGJhc2UgPSBpbmRleCAqIDUgLSA1O1xuICAgICAgICB0aGlzW2Jhc2UgKyAzXSA9IHByb21pc2U7XG4gICAgICAgIHRoaXNbYmFzZSArIDRdID0gcmVjZWl2ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgZnVsZmlsbCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzW2Jhc2UgKyAwXSA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gZnVsZmlsbCA6IGRvbWFpbi5iaW5kKGZ1bGZpbGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXNbYmFzZSArIDFdID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyByZWplY3QgOiBkb21haW4uYmluZChyZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcHJvZ3Jlc3MgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpc1tiYXNlICsgMl0gPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IHByb2dyZXNzIDogZG9tYWluLmJpbmQocHJvZ3Jlc3MpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3NldExlbmd0aChpbmRleCArIDEpO1xuICAgIHJldHVybiBpbmRleDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRQcm94eUhhbmRsZXJzID0gZnVuY3Rpb24gKHJlY2VpdmVyLCBwcm9taXNlU2xvdFZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fbGVuZ3RoKCk7XG5cbiAgICBpZiAoaW5kZXggPj0gMTMxMDcxIC0gNSkge1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NldExlbmd0aCgwKTtcbiAgICB9XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3Byb21pc2UwID0gcHJvbWlzZVNsb3RWYWx1ZTtcbiAgICAgICAgdGhpcy5fcmVjZWl2ZXIwID0gcmVjZWl2ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGJhc2UgPSBpbmRleCAqIDUgLSA1O1xuICAgICAgICB0aGlzW2Jhc2UgKyAzXSA9IHByb21pc2VTbG90VmFsdWU7XG4gICAgICAgIHRoaXNbYmFzZSArIDRdID0gcmVjZWl2ZXI7XG4gICAgfVxuICAgIHRoaXMuX3NldExlbmd0aChpbmRleCArIDEpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb3h5UHJvbWlzZUFycmF5ID0gZnVuY3Rpb24gKHByb21pc2VBcnJheSwgaW5kZXgpIHtcbiAgICB0aGlzLl9zZXRQcm94eUhhbmRsZXJzKHByb21pc2VBcnJheSwgaW5kZXgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Jlc29sdmVDYWxsYmFjayA9IGZ1bmN0aW9uKHZhbHVlLCBzaG91bGRCaW5kKSB7XG4gICAgaWYgKHRoaXMuX2lzRm9sbG93aW5nT3JGdWxmaWxsZWRPclJlamVjdGVkKCkpIHJldHVybjtcbiAgICBpZiAodmFsdWUgPT09IHRoaXMpXG4gICAgICAgIHJldHVybiB0aGlzLl9yZWplY3RDYWxsYmFjayhtYWtlU2VsZlJlc29sdXRpb25FcnJvcigpLCBmYWxzZSwgdHJ1ZSk7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodmFsdWUsIHRoaXMpO1xuICAgIGlmICghKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpKSByZXR1cm4gdGhpcy5fZnVsZmlsbCh2YWx1ZSk7XG5cbiAgICB2YXIgcHJvcGFnYXRpb25GbGFncyA9IDEgfCAoc2hvdWxkQmluZCA/IDQgOiAwKTtcbiAgICB0aGlzLl9wcm9wYWdhdGVGcm9tKG1heWJlUHJvbWlzZSwgcHJvcGFnYXRpb25GbGFncyk7XG4gICAgdmFyIHByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgIGlmIChwcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICB2YXIgbGVuID0gdGhpcy5fbGVuZ3RoKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHByb21pc2UuX21pZ3JhdGVDYWxsYmFja3ModGhpcywgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2V0Rm9sbG93aW5nKCk7XG4gICAgICAgIHRoaXMuX3NldExlbmd0aCgwKTtcbiAgICAgICAgdGhpcy5fc2V0Rm9sbG93ZWUocHJvbWlzZSk7XG4gICAgfSBlbHNlIGlmIChwcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgIHRoaXMuX2Z1bGZpbGxVbmNoZWNrZWQocHJvbWlzZS5fdmFsdWUoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0VW5jaGVja2VkKHByb21pc2UuX3JlYXNvbigpLFxuICAgICAgICAgICAgcHJvbWlzZS5fZ2V0Q2FycmllZFN0YWNrVHJhY2UoKSk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlamVjdENhbGxiYWNrID1cbmZ1bmN0aW9uKHJlYXNvbiwgc3luY2hyb25vdXMsIHNob3VsZE5vdE1hcmtPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24pIHtcbiAgICBpZiAoIXNob3VsZE5vdE1hcmtPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24pIHtcbiAgICAgICAgdXRpbC5tYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24ocmVhc29uKTtcbiAgICB9XG4gICAgdmFyIHRyYWNlID0gdXRpbC5lbnN1cmVFcnJvck9iamVjdChyZWFzb24pO1xuICAgIHZhciBoYXNTdGFjayA9IHRyYWNlID09PSByZWFzb247XG4gICAgdGhpcy5fYXR0YWNoRXh0cmFUcmFjZSh0cmFjZSwgc3luY2hyb25vdXMgPyBoYXNTdGFjayA6IGZhbHNlKTtcbiAgICB0aGlzLl9yZWplY3QocmVhc29uLCBoYXNTdGFjayA/IHVuZGVmaW5lZCA6IHRyYWNlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXNvbHZlRnJvbVJlc29sdmVyID0gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHRoaXMuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgdGhpcy5fcHVzaENvbnRleHQoKTtcbiAgICB2YXIgc3luY2hyb25vdXMgPSB0cnVlO1xuICAgIHZhciByID0gdHJ5Q2F0Y2gocmVzb2x2ZXIpKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmIChwcm9taXNlID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHByb21pc2UgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCBzeW5jaHJvbm91cyk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH0pO1xuICAgIHN5bmNocm9ub3VzID0gZmFsc2U7XG4gICAgdGhpcy5fcG9wQ29udGV4dCgpO1xuXG4gICAgaWYgKHIgIT09IHVuZGVmaW5lZCAmJiByID09PSBlcnJvck9iaiAmJiBwcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHIuZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlRnJvbUhhbmRsZXIgPSBmdW5jdGlvbiAoXG4gICAgaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlLCBwcm9taXNlXG4pIHtcbiAgICBpZiAocHJvbWlzZS5faXNSZWplY3RlZCgpKSByZXR1cm47XG4gICAgcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICB2YXIgeDtcbiAgICBpZiAocmVjZWl2ZXIgPT09IEFQUExZICYmICF0aGlzLl9pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgeCA9IHRyeUNhdGNoKGhhbmRsZXIpLmFwcGx5KHRoaXMuX2JvdW5kVmFsdWUoKSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHggPSB0cnlDYXRjaChoYW5kbGVyKS5jYWxsKHJlY2VpdmVyLCB2YWx1ZSk7XG4gICAgfVxuICAgIHByb21pc2UuX3BvcENvbnRleHQoKTtcblxuICAgIGlmICh4ID09PSBlcnJvck9iaiB8fCB4ID09PSBwcm9taXNlIHx8IHggPT09IE5FWFRfRklMVEVSKSB7XG4gICAgICAgIHZhciBlcnIgPSB4ID09PSBwcm9taXNlID8gbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IoKSA6IHguZTtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2soZXJyLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHgpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl90YXJnZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmV0ID0gdGhpcztcbiAgICB3aGlsZSAocmV0Ll9pc0ZvbGxvd2luZygpKSByZXQgPSByZXQuX2ZvbGxvd2VlKCk7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9mb2xsb3dlZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRGb2xsb3dlZSA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9IHByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2xlYW5WYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2NhbmNlbGxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uUGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9wcm9wYWdhdGVGcm9tID0gZnVuY3Rpb24gKHBhcmVudCwgZmxhZ3MpIHtcbiAgICBpZiAoKGZsYWdzICYgMSkgPiAwICYmIHBhcmVudC5fY2FuY2VsbGFibGUoKSkge1xuICAgICAgICB0aGlzLl9zZXRDYW5jZWxsYWJsZSgpO1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25QYXJlbnQgPSBwYXJlbnQ7XG4gICAgfVxuICAgIGlmICgoZmxhZ3MgJiA0KSA+IDAgJiYgcGFyZW50Ll9pc0JvdW5kKCkpIHtcbiAgICAgICAgdGhpcy5fc2V0Qm91bmRUbyhwYXJlbnQuX2JvdW5kVG8pO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2lzRm9sbG93aW5nT3JGdWxmaWxsZWRPclJlamVjdGVkKCkpIHJldHVybjtcbiAgICB0aGlzLl9mdWxmaWxsVW5jaGVja2VkKHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uLCBjYXJyaWVkU3RhY2tUcmFjZSkge1xuICAgIGlmICh0aGlzLl9pc0ZvbGxvd2luZ09yRnVsZmlsbGVkT3JSZWplY3RlZCgpKSByZXR1cm47XG4gICAgdGhpcy5fcmVqZWN0VW5jaGVja2VkKHJlYXNvbiwgY2FycmllZFN0YWNrVHJhY2UpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldHRsZVByb21pc2VBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZUF0KGluZGV4KTtcbiAgICB2YXIgaXNQcm9taXNlID0gcHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2U7XG5cbiAgICBpZiAoaXNQcm9taXNlICYmIHByb21pc2UuX2lzTWlncmF0ZWQoKSkge1xuICAgICAgICBwcm9taXNlLl91bnNldElzTWlncmF0ZWQoKTtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmludm9rZSh0aGlzLl9zZXR0bGVQcm9taXNlQXQsIHRoaXMsIGluZGV4KTtcbiAgICB9XG4gICAgdmFyIGhhbmRsZXIgPSB0aGlzLl9pc0Z1bGZpbGxlZCgpXG4gICAgICAgID8gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyQXQoaW5kZXgpXG4gICAgICAgIDogdGhpcy5fcmVqZWN0aW9uSGFuZGxlckF0KGluZGV4KTtcblxuICAgIHZhciBjYXJyaWVkU3RhY2tUcmFjZSA9XG4gICAgICAgIHRoaXMuX2lzQ2FycnlpbmdTdGFja1RyYWNlKCkgPyB0aGlzLl9nZXRDYXJyaWVkU3RhY2tUcmFjZSgpIDogdW5kZWZpbmVkO1xuICAgIHZhciB2YWx1ZSA9IHRoaXMuX3NldHRsZWRWYWx1ZTtcbiAgICB2YXIgcmVjZWl2ZXIgPSB0aGlzLl9yZWNlaXZlckF0KGluZGV4KTtcbiAgICB0aGlzLl9jbGVhckNhbGxiYWNrRGF0YUF0SW5kZXgoaW5kZXgpO1xuXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgaWYgKCFpc1Byb21pc2UpIHtcbiAgICAgICAgICAgIGhhbmRsZXIuY2FsbChyZWNlaXZlciwgdmFsdWUsIHByb21pc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0dGxlUHJvbWlzZUZyb21IYW5kbGVyKGhhbmRsZXIsIHJlY2VpdmVyLCB2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlY2VpdmVyIGluc3RhbmNlb2YgUHJvbWlzZUFycmF5KSB7XG4gICAgICAgIGlmICghcmVjZWl2ZXIuX2lzUmVzb2x2ZWQoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZWNlaXZlci5fcHJvbWlzZUZ1bGZpbGxlZCh2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNlaXZlci5fcHJvbWlzZVJlamVjdGVkKHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNQcm9taXNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9mdWxmaWxsKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UuX3JlamVjdCh2YWx1ZSwgY2FycmllZFN0YWNrVHJhY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ID49IDQgJiYgKGluZGV4ICYgMzEpID09PSA0KVxuICAgICAgICBhc3luYy5pbnZva2VMYXRlcih0aGlzLl9zZXRMZW5ndGgsIHRoaXMsIDApO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NsZWFyQ2FsbGJhY2tEYXRhQXRJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNDYXJyeWluZ1N0YWNrVHJhY2UoKSkge1xuICAgICAgICAgICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9XG4gICAgICAgIHRoaXMuX3Byb2dyZXNzSGFuZGxlcjAgPVxuICAgICAgICB0aGlzLl9yZWNlaXZlcjAgPVxuICAgICAgICB0aGlzLl9wcm9taXNlMCA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgYmFzZSA9IGluZGV4ICogNSAtIDU7XG4gICAgICAgIHRoaXNbYmFzZSArIDNdID1cbiAgICAgICAgdGhpc1tiYXNlICsgNF0gPVxuICAgICAgICB0aGlzW2Jhc2UgKyAwXSA9XG4gICAgICAgIHRoaXNbYmFzZSArIDFdID1cbiAgICAgICAgdGhpc1tiYXNlICsgMl0gPSB1bmRlZmluZWQ7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzU2V0dGxlUHJvbWlzZXNRdWV1ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmXG4gICAgICAgICAgICAtMTA3Mzc0MTgyNCkgPT09IC0xMDczNzQxODI0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFNldHRsZVByb21pc2VzUXVldWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAtMTA3Mzc0MTgyNDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl91bnNldFNldHRsZVByb21pc2VzUXVldWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofi0xMDczNzQxODI0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9xdWV1ZVNldHRsZVByb21pc2VzID0gZnVuY3Rpb24oKSB7XG4gICAgYXN5bmMuc2V0dGxlUHJvbWlzZXModGhpcyk7XG4gICAgdGhpcy5fc2V0U2V0dGxlUHJvbWlzZXNRdWV1ZWQoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9mdWxmaWxsVW5jaGVja2VkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB0aGlzKSB7XG4gICAgICAgIHZhciBlcnIgPSBtYWtlU2VsZlJlc29sdXRpb25FcnJvcigpO1xuICAgICAgICB0aGlzLl9hdHRhY2hFeHRyYVRyYWNlKGVycik7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWplY3RVbmNoZWNrZWQoZXJyLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICB0aGlzLl9zZXRGdWxmaWxsZWQoKTtcbiAgICB0aGlzLl9zZXR0bGVkVmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLl9jbGVhblZhbHVlcygpO1xuXG4gICAgaWYgKHRoaXMuX2xlbmd0aCgpID4gMCkge1xuICAgICAgICB0aGlzLl9xdWV1ZVNldHRsZVByb21pc2VzKCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlamVjdFVuY2hlY2tlZENoZWNrRXJyb3IgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdmFyIHRyYWNlID0gdXRpbC5lbnN1cmVFcnJvck9iamVjdChyZWFzb24pO1xuICAgIHRoaXMuX3JlamVjdFVuY2hlY2tlZChyZWFzb24sIHRyYWNlID09PSByZWFzb24gPyB1bmRlZmluZWQgOiB0cmFjZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0VW5jaGVja2VkID0gZnVuY3Rpb24gKHJlYXNvbiwgdHJhY2UpIHtcbiAgICBpZiAocmVhc29uID09PSB0aGlzKSB7XG4gICAgICAgIHZhciBlcnIgPSBtYWtlU2VsZlJlc29sdXRpb25FcnJvcigpO1xuICAgICAgICB0aGlzLl9hdHRhY2hFeHRyYVRyYWNlKGVycik7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWplY3RVbmNoZWNrZWQoZXJyKTtcbiAgICB9XG4gICAgdGhpcy5fc2V0UmVqZWN0ZWQoKTtcbiAgICB0aGlzLl9zZXR0bGVkVmFsdWUgPSByZWFzb247XG4gICAgdGhpcy5fY2xlYW5WYWx1ZXMoKTtcblxuICAgIGlmICh0aGlzLl9pc0ZpbmFsKCkpIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoXCJzdGFja1wiIGluIGUpIHtcbiAgICAgICAgICAgICAgICBhc3luYy5pbnZva2VGaXJzdChcbiAgICAgICAgICAgICAgICAgICAgQ2FwdHVyZWRUcmFjZS51bmhhbmRsZWRSZWplY3Rpb24sIHVuZGVmaW5lZCwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9LCB0cmFjZSA9PT0gdW5kZWZpbmVkID8gcmVhc29uIDogdHJhY2UpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRyYWNlICE9PSB1bmRlZmluZWQgJiYgdHJhY2UgIT09IHJlYXNvbikge1xuICAgICAgICB0aGlzLl9zZXRDYXJyaWVkU3RhY2tUcmFjZSh0cmFjZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xlbmd0aCgpID4gMCkge1xuICAgICAgICB0aGlzLl9xdWV1ZVNldHRsZVByb21pc2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZW5zdXJlUG9zc2libGVSZWplY3Rpb25IYW5kbGVkKCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldHRsZVByb21pc2VzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3Vuc2V0U2V0dGxlUHJvbWlzZXNRdWV1ZWQoKTtcbiAgICB2YXIgbGVuID0gdGhpcy5fbGVuZ3RoKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB0aGlzLl9zZXR0bGVQcm9taXNlQXQoaSk7XG4gICAgfVxufTtcblxudXRpbC5ub3RFbnVtZXJhYmxlUHJvcChQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICBcIl9tYWtlU2VsZlJlc29sdXRpb25FcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICBtYWtlU2VsZlJlc29sdXRpb25FcnJvcik7XG5cbl9kZXJlcV8oXCIuL3Byb2dyZXNzLmpzXCIpKFByb21pc2UsIFByb21pc2VBcnJheSk7XG5fZGVyZXFfKFwiLi9tZXRob2QuanNcIikoUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbik7XG5fZGVyZXFfKFwiLi9iaW5kLmpzXCIpKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlKTtcbl9kZXJlcV8oXCIuL2ZpbmFsbHkuanNcIikoUHJvbWlzZSwgTkVYVF9GSUxURVIsIHRyeUNvbnZlcnRUb1Byb21pc2UpO1xuX2RlcmVxXyhcIi4vZGlyZWN0X3Jlc29sdmUuanNcIikoUHJvbWlzZSk7XG5fZGVyZXFfKFwiLi9zeW5jaHJvbm91c19pbnNwZWN0aW9uLmpzXCIpKFByb21pc2UpO1xuX2RlcmVxXyhcIi4vam9pbi5qc1wiKShQcm9taXNlLCBQcm9taXNlQXJyYXksIHRyeUNvbnZlcnRUb1Byb21pc2UsIElOVEVSTkFMKTtcblByb21pc2UuUHJvbWlzZSA9IFByb21pc2U7XG5fZGVyZXFfKCcuL21hcC5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL2NhbmNlbC5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi91c2luZy5qcycpKFByb21pc2UsIGFwaVJlamVjdGlvbiwgdHJ5Q29udmVydFRvUHJvbWlzZSwgY3JlYXRlQ29udGV4dCk7XG5fZGVyZXFfKCcuL2dlbmVyYXRvcnMuanMnKShQcm9taXNlLCBhcGlSZWplY3Rpb24sIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlKTtcbl9kZXJlcV8oJy4vbm9kZWlmeS5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi9jYWxsX2dldC5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi9wcm9wcy5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKTtcbl9kZXJlcV8oJy4vcmFjZS5qcycpKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pO1xuX2RlcmVxXygnLi9yZWR1Y2UuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbiwgdHJ5Q29udmVydFRvUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi9zZXR0bGUuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXkpO1xuX2RlcmVxXygnLi9zb21lLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCBhcGlSZWplY3Rpb24pO1xuX2RlcmVxXygnLi9wcm9taXNpZnkuanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL2FueS5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi9lYWNoLmpzJykoUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi90aW1lcnMuanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL2ZpbHRlci5qcycpKFByb21pc2UsIElOVEVSTkFMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIHV0aWwudG9GYXN0UHJvcGVydGllcyhQcm9taXNlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICB1dGlsLnRvRmFzdFByb3BlcnRpZXMoUHJvbWlzZS5wcm90b3R5cGUpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZnVuY3Rpb24gZmlsbFR5cGVzKHZhbHVlKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fZnVsZmlsbG1lbnRIYW5kbGVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3JlamVjdGlvbkhhbmRsZXIwID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9wcm9ncmVzc0hhbmRsZXIwID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fcHJvbWlzZTAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3JlY2VpdmVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9zZXR0bGVkVmFsdWUgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgLy8gQ29tcGxldGUgc2xhY2sgdHJhY2tpbmcsIG9wdCBvdXQgb2YgZmllbGQtdHlwZSB0cmFja2luZyBhbmQgICAgICAgICAgIFxuICAgIC8vIHN0YWJpbGl6ZSBtYXAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoe2E6IDF9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHtiOiAyfSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyh7YzogM30pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoMSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKGZ1bmN0aW9uKCl7fSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyh1bmRlZmluZWQpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoZmFsc2UpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKG5ldyBQcm9taXNlKElOVEVSTkFMKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIENhcHR1cmVkVHJhY2Uuc2V0Qm91bmRzKGFzeW5jLmZpcnN0TGluZUVycm9yLCB1dGlsLmxhc3RMaW5lRXJyb3IpOyAgICAgICBcbiAgICByZXR1cm4gUHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbn07XG5cbn0se1wiLi9hbnkuanNcIjoxLFwiLi9hc3luYy5qc1wiOjIsXCIuL2JpbmQuanNcIjozLFwiLi9jYWxsX2dldC5qc1wiOjUsXCIuL2NhbmNlbC5qc1wiOjYsXCIuL2NhcHR1cmVkX3RyYWNlLmpzXCI6NyxcIi4vY2F0Y2hfZmlsdGVyLmpzXCI6OCxcIi4vY29udGV4dC5qc1wiOjksXCIuL2RlYnVnZ2FiaWxpdHkuanNcIjoxMCxcIi4vZGlyZWN0X3Jlc29sdmUuanNcIjoxMSxcIi4vZWFjaC5qc1wiOjEyLFwiLi9lcnJvcnMuanNcIjoxMyxcIi4vZmlsdGVyLmpzXCI6MTUsXCIuL2ZpbmFsbHkuanNcIjoxNixcIi4vZ2VuZXJhdG9ycy5qc1wiOjE3LFwiLi9qb2luLmpzXCI6MTgsXCIuL21hcC5qc1wiOjE5LFwiLi9tZXRob2QuanNcIjoyMCxcIi4vbm9kZWlmeS5qc1wiOjIxLFwiLi9wcm9ncmVzcy5qc1wiOjIyLFwiLi9wcm9taXNlX2FycmF5LmpzXCI6MjQsXCIuL3Byb21pc2VfcmVzb2x2ZXIuanNcIjoyNSxcIi4vcHJvbWlzaWZ5LmpzXCI6MjYsXCIuL3Byb3BzLmpzXCI6MjcsXCIuL3JhY2UuanNcIjoyOSxcIi4vcmVkdWNlLmpzXCI6MzAsXCIuL3NldHRsZS5qc1wiOjMyLFwiLi9zb21lLmpzXCI6MzMsXCIuL3N5bmNocm9ub3VzX2luc3BlY3Rpb24uanNcIjozNCxcIi4vdGhlbmFibGVzLmpzXCI6MzUsXCIuL3RpbWVycy5qc1wiOjM2LFwiLi91c2luZy5qc1wiOjM3LFwiLi91dGlsLmpzXCI6Mzh9XSwyNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgYXBpUmVqZWN0aW9uKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgaXNBcnJheSA9IHV0aWwuaXNBcnJheTtcblxuZnVuY3Rpb24gdG9SZXNvbHV0aW9uVmFsdWUodmFsKSB7XG4gICAgc3dpdGNoKHZhbCkge1xuICAgIGNhc2UgLTI6IHJldHVybiBbXTtcbiAgICBjYXNlIC0zOiByZXR1cm4ge307XG4gICAgfVxufVxuXG5mdW5jdGlvbiBQcm9taXNlQXJyYXkodmFsdWVzKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHZhciBwYXJlbnQ7XG4gICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcGFyZW50ID0gdmFsdWVzO1xuICAgICAgICBwcm9taXNlLl9wcm9wYWdhdGVGcm9tKHBhcmVudCwgMSB8IDQpO1xuICAgIH1cbiAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG4gICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICB0aGlzLl90b3RhbFJlc29sdmVkID0gMDtcbiAgICB0aGlzLl9pbml0KHVuZGVmaW5lZCwgLTIpO1xufVxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUucHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiBpbml0KF8sIHJlc29sdmVWYWx1ZUlmRW1wdHkpIHtcbiAgICB2YXIgdmFsdWVzID0gdHJ5Q29udmVydFRvUHJvbWlzZSh0aGlzLl92YWx1ZXMsIHRoaXMuX3Byb21pc2UpO1xuICAgIGlmICh2YWx1ZXMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHZhbHVlcyA9IHZhbHVlcy5fdGFyZ2V0KCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlcyA9IHZhbHVlcztcbiAgICAgICAgaWYgKHZhbHVlcy5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgdmFsdWVzID0gdmFsdWVzLl92YWx1ZSgpO1xuICAgICAgICAgICAgaWYgKCFpc0FycmF5KHZhbHVlcykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyID0gbmV3IFByb21pc2UuVHlwZUVycm9yKFwiZXhwZWN0aW5nIGFuIGFycmF5LCBhIHByb21pc2Ugb3IgYSB0aGVuYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3M4TU1oY1xcdTAwMGFcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2hhcmRSZWplY3RfXyhlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZXMuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICB2YWx1ZXMuX3RoZW4oXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWplY3QsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZVZhbHVlSWZFbXB0eVxuICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVqZWN0KHZhbHVlcy5fcmVhc29uKCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNBcnJheSh2YWx1ZXMpKSB7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3JlamVjdChhcGlSZWplY3Rpb24oXCJleHBlY3RpbmcgYW4gYXJyYXksIGEgcHJvbWlzZSBvciBhIHRoZW5hYmxlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvczhNTWhjXFx1MDAwYVwiKS5fcmVhc29uKCkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaWYgKHJlc29sdmVWYWx1ZUlmRW1wdHkgPT09IC01KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlRW1wdHlBcnJheSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSh0b1Jlc29sdXRpb25WYWx1ZShyZXNvbHZlVmFsdWVJZkVtcHR5KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbGVuID0gdGhpcy5nZXRBY3R1YWxMZW5ndGgodmFsdWVzLmxlbmd0aCk7XG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuO1xuICAgIHRoaXMuX3ZhbHVlcyA9IHRoaXMuc2hvdWxkQ29weVZhbHVlcygpID8gbmV3IEFycmF5KGxlbikgOiB0aGlzLl92YWx1ZXM7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIGlzUmVzb2x2ZWQgPSB0aGlzLl9pc1Jlc29sdmVkKCk7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHZhbHVlc1tpXSwgcHJvbWlzZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX2lnbm9yZVJlamVjdGlvbnMoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fcHJveHlQcm9taXNlQXJyYXkodGhpcywgaSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb21pc2VGdWxmaWxsZWQobWF5YmVQcm9taXNlLl92YWx1ZSgpLCBpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZVJlamVjdGVkKG1heWJlUHJvbWlzZS5fcmVhc29uKCksIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFpc1Jlc29sdmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9taXNlRnVsZmlsbGVkKG1heWJlUHJvbWlzZSwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9pc1Jlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMgPT09IG51bGw7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fdmFsdWVzID0gbnVsbDtcbiAgICB0aGlzLl9wcm9taXNlLl9mdWxmaWxsKHZhbHVlKTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX19oYXJkUmVqZWN0X18gPVxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHRoaXMuX3ZhbHVlcyA9IG51bGw7XG4gICAgdGhpcy5fcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCBmYWxzZSwgdHJ1ZSk7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUHJvZ3Jlc3NlZCA9IGZ1bmN0aW9uIChwcm9ncmVzc1ZhbHVlLCBpbmRleCkge1xuICAgIHRoaXMuX3Byb21pc2UuX3Byb2dyZXNzKHtcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NWYWx1ZVxuICAgIH0pO1xufTtcblxuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICB2YXIgdG90YWxSZXNvbHZlZCA9ICsrdGhpcy5fdG90YWxSZXNvbHZlZDtcbiAgICBpZiAodG90YWxSZXNvbHZlZCA+PSB0aGlzLl9sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl92YWx1ZXMpO1xuICAgIH1cbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VSZWplY3RlZCA9IGZ1bmN0aW9uIChyZWFzb24sIGluZGV4KSB7XG4gICAgdGhpcy5fdG90YWxSZXNvbHZlZCsrO1xuICAgIHRoaXMuX3JlamVjdChyZWFzb24pO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zaG91bGRDb3B5VmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5nZXRBY3R1YWxMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XG4gICAgcmV0dXJuIGxlbjtcbn07XG5cbnJldHVybiBQcm9taXNlQXJyYXk7XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMjU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgbWF5YmVXcmFwQXNFcnJvciA9IHV0aWwubWF5YmVXcmFwQXNFcnJvcjtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIik7XG52YXIgVGltZW91dEVycm9yID0gZXJyb3JzLlRpbWVvdXRFcnJvcjtcbnZhciBPcGVyYXRpb25hbEVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG52YXIgaGF2ZUdldHRlcnMgPSB1dGlsLmhhdmVHZXR0ZXJzO1xudmFyIGVzNSA9IF9kZXJlcV8oXCIuL2VzNS5qc1wiKTtcblxuZnVuY3Rpb24gaXNVbnR5cGVkRXJyb3Iob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEVycm9yICYmXG4gICAgICAgIGVzNS5nZXRQcm90b3R5cGVPZihvYmopID09PSBFcnJvci5wcm90b3R5cGU7XG59XG5cbnZhciByRXJyb3JLZXkgPSAvXig/Om5hbWV8bWVzc2FnZXxzdGFja3xjYXVzZSkkLztcbmZ1bmN0aW9uIHdyYXBBc09wZXJhdGlvbmFsRXJyb3Iob2JqKSB7XG4gICAgdmFyIHJldDtcbiAgICBpZiAoaXNVbnR5cGVkRXJyb3Iob2JqKSkge1xuICAgICAgICByZXQgPSBuZXcgT3BlcmF0aW9uYWxFcnJvcihvYmopO1xuICAgICAgICByZXQubmFtZSA9IG9iai5uYW1lO1xuICAgICAgICByZXQubWVzc2FnZSA9IG9iai5tZXNzYWdlO1xuICAgICAgICByZXQuc3RhY2sgPSBvYmouc3RhY2s7XG4gICAgICAgIHZhciBrZXlzID0gZXM1LmtleXMob2JqKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICAgIGlmICghckVycm9yS2V5LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldFtrZXldID0gb2JqW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgdXRpbC5tYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24ob2JqKTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBub2RlYmFja0ZvclByb21pc2UocHJvbWlzZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihlcnIsIHZhbHVlKSB7XG4gICAgICAgIGlmIChwcm9taXNlID09PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgdmFyIHdyYXBwZWQgPSB3cmFwQXNPcGVyYXRpb25hbEVycm9yKG1heWJlV3JhcEFzRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICBwcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKHdyYXBwZWQpO1xuICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0KHdyYXBwZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICB2YXIgJF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoO3ZhciBhcmdzID0gbmV3IEFycmF5KCRfbGVuIC0gMSk7IGZvcih2YXIgJF9pID0gMTsgJF9pIDwgJF9sZW47ICsrJF9pKSB7YXJnc1skX2kgLSAxXSA9IGFyZ3VtZW50c1skX2ldO31cbiAgICAgICAgICAgIHByb21pc2UuX2Z1bGZpbGwoYXJncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlLl9mdWxmaWxsKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH07XG59XG5cblxudmFyIFByb21pc2VSZXNvbHZlcjtcbmlmICghaGF2ZUdldHRlcnMpIHtcbiAgICBQcm9taXNlUmVzb2x2ZXIgPSBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xuICAgICAgICB0aGlzLmFzQ2FsbGJhY2sgPSBub2RlYmFja0ZvclByb21pc2UocHJvbWlzZSk7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSB0aGlzLmFzQ2FsbGJhY2s7XG4gICAgfTtcbn1cbmVsc2Uge1xuICAgIFByb21pc2VSZXNvbHZlciA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgIHRoaXMucHJvbWlzZSA9IHByb21pc2U7XG4gICAgfTtcbn1cbmlmIChoYXZlR2V0dGVycykge1xuICAgIHZhciBwcm9wID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGViYWNrRm9yUHJvbWlzZSh0aGlzLnByb21pc2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBlczUuZGVmaW5lUHJvcGVydHkoUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZSwgXCJhc0NhbGxiYWNrXCIsIHByb3ApO1xuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShQcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLCBcImNhbGxiYWNrXCIsIHByb3ApO1xufVxuXG5Qcm9taXNlUmVzb2x2ZXIuX25vZGViYWNrRm9yUHJvbWlzZSA9IG5vZGViYWNrRm9yUHJvbWlzZTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VSZXNvbHZlcl1cIjtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUucmVzb2x2ZSA9XG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZVJlc29sdmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBpbnZvY2F0aW9uLCByZXNvbHZlciByZXNvbHZlL3JlamVjdCBtdXN0IGJlIGNhbGxlZCB3aXRoaW4gYSByZXNvbHZlciBjb250ZXh0LiBDb25zaWRlciB1c2luZyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpbnN0ZWFkLlxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3Nka1hMOVxcdTAwMGFcIik7XG4gICAgfVxuICAgIHRoaXMucHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlUmVzb2x2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbGxlZ2FsIGludm9jYXRpb24sIHJlc29sdmVyIHJlc29sdmUvcmVqZWN0IG11c3QgYmUgY2FsbGVkIHdpdGhpbiBhIHJlc29sdmVyIGNvbnRleHQuIENvbnNpZGVyIHVzaW5nIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGluc3RlYWQuXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvc2RrWEw5XFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdGhpcy5wcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZWFzb24pO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlUmVzb2x2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbGxlZ2FsIGludm9jYXRpb24sIHJlc29sdmVyIHJlc29sdmUvcmVqZWN0IG11c3QgYmUgY2FsbGVkIHdpdGhpbiBhIHJlc29sdmVyIGNvbnRleHQuIENvbnNpZGVyIHVzaW5nIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGluc3RlYWQuXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvc2RrWEw5XFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdGhpcy5wcm9taXNlLl9wcm9ncmVzcyh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICB0aGlzLnByb21pc2UuY2FuY2VsKGVycik7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZWplY3QobmV3IFRpbWVvdXRFcnJvcihcInRpbWVvdXRcIikpO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5pc1Jlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb21pc2UuaXNSZXNvbHZlZCgpO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvbWlzZS50b0pTT04oKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVJlc29sdmVyO1xuXG59LHtcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL2VzNS5qc1wiOjE0LFwiLi91dGlsLmpzXCI6Mzh9XSwyNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciBUSElTID0ge307XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgbm9kZWJhY2tGb3JQcm9taXNlID0gX2RlcmVxXyhcIi4vcHJvbWlzZV9yZXNvbHZlci5qc1wiKVxuICAgIC5fbm9kZWJhY2tGb3JQcm9taXNlO1xudmFyIHdpdGhBcHBlbmRlZCA9IHV0aWwud2l0aEFwcGVuZGVkO1xudmFyIG1heWJlV3JhcEFzRXJyb3IgPSB1dGlsLm1heWJlV3JhcEFzRXJyb3I7XG52YXIgY2FuRXZhbHVhdGUgPSB1dGlsLmNhbkV2YWx1YXRlO1xudmFyIFR5cGVFcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9yc1wiKS5UeXBlRXJyb3I7XG52YXIgZGVmYXVsdFN1ZmZpeCA9IFwiQXN5bmNcIjtcbnZhciBkZWZhdWx0UHJvbWlzaWZpZWQgPSB7X19pc1Byb21pc2lmaWVkX186IHRydWV9O1xudmFyIG5vQ29weVByb3BzID0gW1xuICAgIFwiYXJpdHlcIiwgICAgXCJsZW5ndGhcIixcbiAgICBcIm5hbWVcIixcbiAgICBcImFyZ3VtZW50c1wiLFxuICAgIFwiY2FsbGVyXCIsXG4gICAgXCJjYWxsZWVcIixcbiAgICBcInByb3RvdHlwZVwiLFxuICAgIFwiX19pc1Byb21pc2lmaWVkX19cIlxuXTtcbnZhciBub0NvcHlQcm9wc1BhdHRlcm4gPSBuZXcgUmVnRXhwKFwiXig/OlwiICsgbm9Db3B5UHJvcHMuam9pbihcInxcIikgKyBcIikkXCIpO1xuXG52YXIgZGVmYXVsdEZpbHRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdXRpbC5pc0lkZW50aWZpZXIobmFtZSkgJiZcbiAgICAgICAgbmFtZS5jaGFyQXQoMCkgIT09IFwiX1wiICYmXG4gICAgICAgIG5hbWUgIT09IFwiY29uc3RydWN0b3JcIjtcbn07XG5cbmZ1bmN0aW9uIHByb3BzRmlsdGVyKGtleSkge1xuICAgIHJldHVybiAhbm9Db3B5UHJvcHNQYXR0ZXJuLnRlc3Qoa2V5KTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNpZmllZChmbikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmbi5fX2lzUHJvbWlzaWZpZWRfXyA9PT0gdHJ1ZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzUHJvbWlzaWZpZWQob2JqLCBrZXksIHN1ZmZpeCkge1xuICAgIHZhciB2YWwgPSB1dGlsLmdldERhdGFQcm9wZXJ0eU9yRGVmYXVsdChvYmosIGtleSArIHN1ZmZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFByb21pc2lmaWVkKTtcbiAgICByZXR1cm4gdmFsID8gaXNQcm9taXNpZmllZCh2YWwpIDogZmFsc2U7XG59XG5mdW5jdGlvbiBjaGVja1ZhbGlkKHJldCwgc3VmZml4LCBzdWZmaXhSZWdleHApIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICB2YXIga2V5ID0gcmV0W2ldO1xuICAgICAgICBpZiAoc3VmZml4UmVnZXhwLnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgdmFyIGtleVdpdGhvdXRBc3luY1N1ZmZpeCA9IGtleS5yZXBsYWNlKHN1ZmZpeFJlZ2V4cCwgXCJcIik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJldC5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICAgICAgICAgIGlmIChyZXRbal0gPT09IGtleVdpdGhvdXRBc3luY1N1ZmZpeCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHByb21pc2lmeSBhbiBBUEkgdGhhdCBoYXMgbm9ybWFsIG1ldGhvZHMgd2l0aCAnJXMnLXN1ZmZpeFxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL2lXclpid1xcdTAwMGFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoXCIlc1wiLCBzdWZmaXgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByb21pc2lmaWFibGVNZXRob2RzKG9iaiwgc3VmZml4LCBzdWZmaXhSZWdleHAsIGZpbHRlcikge1xuICAgIHZhciBrZXlzID0gdXRpbC5pbmhlcml0ZWREYXRhS2V5cyhvYmopO1xuICAgIHZhciByZXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICB2YXIgcGFzc2VzRGVmYXVsdEZpbHRlciA9IGZpbHRlciA9PT0gZGVmYXVsdEZpbHRlclxuICAgICAgICAgICAgPyB0cnVlIDogZGVmYXVsdEZpbHRlcihrZXksIHZhbHVlLCBvYmopO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICFpc1Byb21pc2lmaWVkKHZhbHVlKSAmJlxuICAgICAgICAgICAgIWhhc1Byb21pc2lmaWVkKG9iaiwga2V5LCBzdWZmaXgpICYmXG4gICAgICAgICAgICBmaWx0ZXIoa2V5LCB2YWx1ZSwgb2JqLCBwYXNzZXNEZWZhdWx0RmlsdGVyKSkge1xuICAgICAgICAgICAgcmV0LnB1c2goa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hlY2tWYWxpZChyZXQsIHN1ZmZpeCwgc3VmZml4UmVnZXhwKTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG52YXIgZXNjYXBlSWRlbnRSZWdleCA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFskXSkvLCBcIlxcXFwkXCIpO1xufTtcblxudmFyIG1ha2VOb2RlUHJvbWlzaWZpZWRFdmFsO1xuaWYgKCF0cnVlKSB7XG52YXIgc3dpdGNoQ2FzZUFyZ3VtZW50T3JkZXIgPSBmdW5jdGlvbihsaWtlbHlBcmd1bWVudENvdW50KSB7XG4gICAgdmFyIHJldCA9IFtsaWtlbHlBcmd1bWVudENvdW50XTtcbiAgICB2YXIgbWluID0gTWF0aC5tYXgoMCwgbGlrZWx5QXJndW1lbnRDb3VudCAtIDEgLSAzKTtcbiAgICBmb3IodmFyIGkgPSBsaWtlbHlBcmd1bWVudENvdW50IC0gMTsgaSA+PSBtaW47IC0taSkge1xuICAgICAgICByZXQucHVzaChpKTtcbiAgICB9XG4gICAgZm9yKHZhciBpID0gbGlrZWx5QXJndW1lbnRDb3VudCArIDE7IGkgPD0gMzsgKytpKSB7XG4gICAgICAgIHJldC5wdXNoKGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxudmFyIGFyZ3VtZW50U2VxdWVuY2UgPSBmdW5jdGlvbihhcmd1bWVudENvdW50KSB7XG4gICAgcmV0dXJuIHV0aWwuZmlsbGVkUmFuZ2UoYXJndW1lbnRDb3VudCwgXCJfYXJnXCIsIFwiXCIpO1xufTtcblxudmFyIHBhcmFtZXRlckRlY2xhcmF0aW9uID0gZnVuY3Rpb24ocGFyYW1ldGVyQ291bnQpIHtcbiAgICByZXR1cm4gdXRpbC5maWxsZWRSYW5nZShcbiAgICAgICAgTWF0aC5tYXgocGFyYW1ldGVyQ291bnQsIDMpLCBcIl9hcmdcIiwgXCJcIik7XG59O1xuXG52YXIgcGFyYW1ldGVyQ291bnQgPSBmdW5jdGlvbihmbikge1xuICAgIGlmICh0eXBlb2YgZm4ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heChNYXRoLm1pbihmbi5sZW5ndGgsIDEwMjMgKyAxKSwgMCk7XG4gICAgfVxuICAgIHJldHVybiAwO1xufTtcblxubWFrZU5vZGVQcm9taXNpZmllZEV2YWwgPVxuZnVuY3Rpb24oY2FsbGJhY2ssIHJlY2VpdmVyLCBvcmlnaW5hbE5hbWUsIGZuKSB7XG4gICAgdmFyIG5ld1BhcmFtZXRlckNvdW50ID0gTWF0aC5tYXgoMCwgcGFyYW1ldGVyQ291bnQoZm4pIC0gMSk7XG4gICAgdmFyIGFyZ3VtZW50T3JkZXIgPSBzd2l0Y2hDYXNlQXJndW1lbnRPcmRlcihuZXdQYXJhbWV0ZXJDb3VudCk7XG4gICAgdmFyIHNob3VsZFByb3h5VGhpcyA9IHR5cGVvZiBjYWxsYmFjayA9PT0gXCJzdHJpbmdcIiB8fCByZWNlaXZlciA9PT0gVEhJUztcblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlQ2FsbEZvckFyZ3VtZW50Q291bnQoY291bnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudFNlcXVlbmNlKGNvdW50KS5qb2luKFwiLCBcIik7XG4gICAgICAgIHZhciBjb21tYSA9IGNvdW50ID4gMCA/IFwiLCBcIiA6IFwiXCI7XG4gICAgICAgIHZhciByZXQ7XG4gICAgICAgIGlmIChzaG91bGRQcm94eVRoaXMpIHtcbiAgICAgICAgICAgIHJldCA9IFwicmV0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCB7e2FyZ3N9fSwgbm9kZWJhY2spOyBicmVhaztcXG5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlY2VpdmVyID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IFwicmV0ID0gY2FsbGJhY2soe3thcmdzfX0sIG5vZGViYWNrKTsgYnJlYWs7XFxuXCJcbiAgICAgICAgICAgICAgICA6IFwicmV0ID0gY2FsbGJhY2suY2FsbChyZWNlaXZlciwge3thcmdzfX0sIG5vZGViYWNrKTsgYnJlYWs7XFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldC5yZXBsYWNlKFwie3thcmdzfX1cIiwgYXJncykucmVwbGFjZShcIiwgXCIsIGNvbW1hKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUFyZ3VtZW50U3dpdGNoQ2FzZSgpIHtcbiAgICAgICAgdmFyIHJldCA9IFwiXCI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRPcmRlci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcmV0ICs9IFwiY2FzZSBcIiArIGFyZ3VtZW50T3JkZXJbaV0gK1wiOlwiICtcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUNhbGxGb3JBcmd1bWVudENvdW50KGFyZ3VtZW50T3JkZXJbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0ICs9IFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsZW4gKyAxKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgaSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBhcmdzW2ldID0gbm9kZWJhY2s7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBbQ29kZUZvckNhbGxdICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBicmVhazsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIFwiLnJlcGxhY2UoXCJbQ29kZUZvckNhbGxdXCIsIChzaG91bGRQcm94eVRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcInJldCA9IGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xcblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJyZXQgPSBjYWxsYmFjay5hcHBseShyZWNlaXZlciwgYXJncyk7XFxuXCIpKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICB2YXIgZ2V0RnVuY3Rpb25Db2RlID0gdHlwZW9mIGNhbGxiYWNrID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKFwidGhpcyAhPSBudWxsID8gdGhpc1snXCIrY2FsbGJhY2srXCInXSA6IGZuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJmblwiO1xuXG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcIlByb21pc2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZm5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVjZWl2ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid2l0aEFwcGVuZGVkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm1heWJlV3JhcEFzRXJyb3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibm9kZWJhY2tGb3JQcm9taXNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRyeUNhdGNoXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImVycm9yT2JqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm5vdEVudW1lcmFibGVQcm9wXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIklOVEVSTkFMXCIsXCIndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIHZhciByZXQgPSBmdW5jdGlvbiAoUGFyYW1ldGVycykgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBwcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgbm9kZWJhY2sgPSBub2RlYmFja0ZvclByb21pc2UocHJvbWlzZSk7ICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgcmV0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSB0cnlDYXRjaChbR2V0RnVuY3Rpb25Db2RlXSk7ICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBzd2l0Y2gobGVuKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgW0NvZGVGb3JTd2l0Y2hDYXNlXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2sobWF5YmVXcmFwQXNFcnJvcihyZXQuZSksIHRydWUsIHRydWUpO1xcblxcXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIH07ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHJldCwgJ19faXNQcm9taXNpZmllZF9fJywgdHJ1ZSk7ICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIHJldHVybiByZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIFwiXG4gICAgICAgIC5yZXBsYWNlKFwiUGFyYW1ldGVyc1wiLCBwYXJhbWV0ZXJEZWNsYXJhdGlvbihuZXdQYXJhbWV0ZXJDb3VudCkpXG4gICAgICAgIC5yZXBsYWNlKFwiW0NvZGVGb3JTd2l0Y2hDYXNlXVwiLCBnZW5lcmF0ZUFyZ3VtZW50U3dpdGNoQ2FzZSgpKVxuICAgICAgICAucmVwbGFjZShcIltHZXRGdW5jdGlvbkNvZGVdXCIsIGdldEZ1bmN0aW9uQ29kZSkpKFxuICAgICAgICAgICAgUHJvbWlzZSxcbiAgICAgICAgICAgIGZuLFxuICAgICAgICAgICAgcmVjZWl2ZXIsXG4gICAgICAgICAgICB3aXRoQXBwZW5kZWQsXG4gICAgICAgICAgICBtYXliZVdyYXBBc0Vycm9yLFxuICAgICAgICAgICAgbm9kZWJhY2tGb3JQcm9taXNlLFxuICAgICAgICAgICAgdXRpbC50cnlDYXRjaCxcbiAgICAgICAgICAgIHV0aWwuZXJyb3JPYmosXG4gICAgICAgICAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wLFxuICAgICAgICAgICAgSU5URVJOQUxcbiAgICAgICAgKTtcbn07XG59XG5cbmZ1bmN0aW9uIG1ha2VOb2RlUHJvbWlzaWZpZWRDbG9zdXJlKGNhbGxiYWNrLCByZWNlaXZlciwgXywgZm4pIHtcbiAgICB2YXIgZGVmYXVsdFRoaXMgPSAoZnVuY3Rpb24oKSB7cmV0dXJuIHRoaXM7fSkoKTtcbiAgICB2YXIgbWV0aG9kID0gY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBmbjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHJvbWlzaWZpZWQoKSB7XG4gICAgICAgIHZhciBfcmVjZWl2ZXIgPSByZWNlaXZlcjtcbiAgICAgICAgaWYgKHJlY2VpdmVyID09PSBUSElTKSBfcmVjZWl2ZXIgPSB0aGlzO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgdmFyIGNiID0gdHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIiAmJiB0aGlzICE9PSBkZWZhdWx0VGhpc1xuICAgICAgICAgICAgPyB0aGlzW21ldGhvZF0gOiBjYWxsYmFjaztcbiAgICAgICAgdmFyIGZuID0gbm9kZWJhY2tGb3JQcm9taXNlKHByb21pc2UpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2IuYXBwbHkoX3JlY2VpdmVyLCB3aXRoQXBwZW5kZWQoYXJndW1lbnRzLCBmbikpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKG1heWJlV3JhcEFzRXJyb3IoZSksIHRydWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKHByb21pc2lmaWVkLCBcIl9faXNQcm9taXNpZmllZF9fXCIsIHRydWUpO1xuICAgIHJldHVybiBwcm9taXNpZmllZDtcbn1cblxudmFyIG1ha2VOb2RlUHJvbWlzaWZpZWQgPSBjYW5FdmFsdWF0ZVxuICAgID8gbWFrZU5vZGVQcm9taXNpZmllZEV2YWxcbiAgICA6IG1ha2VOb2RlUHJvbWlzaWZpZWRDbG9zdXJlO1xuXG5mdW5jdGlvbiBwcm9taXNpZnlBbGwob2JqLCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIpIHtcbiAgICB2YXIgc3VmZml4UmVnZXhwID0gbmV3IFJlZ0V4cChlc2NhcGVJZGVudFJlZ2V4KHN1ZmZpeCkgKyBcIiRcIik7XG4gICAgdmFyIG1ldGhvZHMgPVxuICAgICAgICBwcm9taXNpZmlhYmxlTWV0aG9kcyhvYmosIHN1ZmZpeCwgc3VmZml4UmVnZXhwLCBmaWx0ZXIpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG1ldGhvZHMubGVuZ3RoOyBpIDwgbGVuOyBpKz0gMikge1xuICAgICAgICB2YXIga2V5ID0gbWV0aG9kc1tpXTtcbiAgICAgICAgdmFyIGZuID0gbWV0aG9kc1tpKzFdO1xuICAgICAgICB2YXIgcHJvbWlzaWZpZWRLZXkgPSBrZXkgKyBzdWZmaXg7XG4gICAgICAgIG9ialtwcm9taXNpZmllZEtleV0gPSBwcm9taXNpZmllciA9PT0gbWFrZU5vZGVQcm9taXNpZmllZFxuICAgICAgICAgICAgICAgID8gbWFrZU5vZGVQcm9taXNpZmllZChrZXksIFRISVMsIGtleSwgZm4sIHN1ZmZpeClcbiAgICAgICAgICAgICAgICA6IHByb21pc2lmaWVyKGZuLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ha2VOb2RlUHJvbWlzaWZpZWQoa2V5LCBUSElTLCBrZXksIGZuLCBzdWZmaXgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICB1dGlsLnRvRmFzdFByb3BlcnRpZXMob2JqKTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBwcm9taXNpZnkoY2FsbGJhY2ssIHJlY2VpdmVyKSB7XG4gICAgcmV0dXJuIG1ha2VOb2RlUHJvbWlzaWZpZWQoY2FsbGJhY2ssIHJlY2VpdmVyLCB1bmRlZmluZWQsIGNhbGxiYWNrKTtcbn1cblxuUHJvbWlzZS5wcm9taXNpZnkgPSBmdW5jdGlvbiAoZm4sIHJlY2VpdmVyKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIH1cbiAgICBpZiAoaXNQcm9taXNpZmllZChmbikpIHtcbiAgICAgICAgcmV0dXJuIGZuO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gcHJvbWlzaWZ5KGZuLCBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IFRISVMgOiByZWNlaXZlcik7XG4gICAgdXRpbC5jb3B5RGVzY3JpcHRvcnMoZm4sIHJldCwgcHJvcHNGaWx0ZXIpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb21pc2lmeUFsbCA9IGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRoZSB0YXJnZXQgb2YgcHJvbWlzaWZ5QWxsIG11c3QgYmUgYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85SVRsVjBcXHUwMDBhXCIpO1xuICAgIH1cbiAgICBvcHRpb25zID0gT2JqZWN0KG9wdGlvbnMpO1xuICAgIHZhciBzdWZmaXggPSBvcHRpb25zLnN1ZmZpeDtcbiAgICBpZiAodHlwZW9mIHN1ZmZpeCAhPT0gXCJzdHJpbmdcIikgc3VmZml4ID0gZGVmYXVsdFN1ZmZpeDtcbiAgICB2YXIgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgIT09IFwiZnVuY3Rpb25cIikgZmlsdGVyID0gZGVmYXVsdEZpbHRlcjtcbiAgICB2YXIgcHJvbWlzaWZpZXIgPSBvcHRpb25zLnByb21pc2lmaWVyO1xuICAgIGlmICh0eXBlb2YgcHJvbWlzaWZpZXIgIT09IFwiZnVuY3Rpb25cIikgcHJvbWlzaWZpZXIgPSBtYWtlTm9kZVByb21pc2lmaWVkO1xuXG4gICAgaWYgKCF1dGlsLmlzSWRlbnRpZmllcihzdWZmaXgpKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwic3VmZml4IG11c3QgYmUgYSB2YWxpZCBpZGVudGlmaWVyXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOEZabzVWXFx1MDAwYVwiKTtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IHV0aWwuaW5oZXJpdGVkRGF0YUtleXModGFyZ2V0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0W2tleXNbaV1dO1xuICAgICAgICBpZiAoa2V5c1tpXSAhPT0gXCJjb25zdHJ1Y3RvclwiICYmXG4gICAgICAgICAgICB1dGlsLmlzQ2xhc3ModmFsdWUpKSB7XG4gICAgICAgICAgICBwcm9taXNpZnlBbGwodmFsdWUucHJvdG90eXBlLCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIpO1xuICAgICAgICAgICAgcHJvbWlzaWZ5QWxsKHZhbHVlLCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2lmeUFsbCh0YXJnZXQsIHN1ZmZpeCwgZmlsdGVyLCBwcm9taXNpZmllcik7XG59O1xufTtcblxuXG59LHtcIi4vZXJyb3JzXCI6MTMsXCIuL3Byb21pc2VfcmVzb2x2ZXIuanNcIjoyNSxcIi4vdXRpbC5qc1wiOjM4fV0sMjc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFxuICAgIFByb21pc2UsIFByb21pc2VBcnJheSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgaXNPYmplY3QgPSB1dGlsLmlzT2JqZWN0O1xudmFyIGVzNSA9IF9kZXJlcV8oXCIuL2VzNS5qc1wiKTtcblxuZnVuY3Rpb24gUHJvcGVydGllc1Byb21pc2VBcnJheShvYmopIHtcbiAgICB2YXIga2V5cyA9IGVzNS5rZXlzKG9iaik7XG4gICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuICogMik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgdmFsdWVzW2ldID0gb2JqW2tleV07XG4gICAgICAgIHZhbHVlc1tpICsgbGVuXSA9IGtleTtcbiAgICB9XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQodmFsdWVzKTtcbn1cbnV0aWwuaW5oZXJpdHMoUHJvcGVydGllc1Byb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCAtMykgO1xufTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IHRoaXMuX2xlbmd0aCkge1xuICAgICAgICB2YXIgdmFsID0ge307XG4gICAgICAgIHZhciBrZXlPZmZzZXQgPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGgoKTsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICB2YWxbdGhpcy5fdmFsdWVzW2kgKyBrZXlPZmZzZXRdXSA9IHRoaXMuX3ZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZXNvbHZlKHZhbCk7XG4gICAgfVxufTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VQcm9ncmVzc2VkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHRoaXMuX3Byb21pc2UuX3Byb2dyZXNzKHtcbiAgICAgICAga2V5OiB0aGlzLl92YWx1ZXNbaW5kZXggKyB0aGlzLmxlbmd0aCgpXSxcbiAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG59O1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zaG91bGRDb3B5VmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbn07XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLmdldEFjdHVhbExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcbiAgICByZXR1cm4gbGVuID4+IDE7XG59O1xuXG5mdW5jdGlvbiBwcm9wcyhwcm9taXNlcykge1xuICAgIHZhciByZXQ7XG4gICAgdmFyIGNhc3RWYWx1ZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocHJvbWlzZXMpO1xuXG4gICAgaWYgKCFpc09iamVjdChjYXN0VmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJjYW5ub3QgYXdhaXQgcHJvcGVydGllcyBvZiBhIG5vbi1vYmplY3RcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9Pc0ZLQzhcXHUwMDBhXCIpO1xuICAgIH0gZWxzZSBpZiAoY2FzdFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXQgPSBjYXN0VmFsdWUuX3RoZW4oXG4gICAgICAgICAgICBQcm9taXNlLnByb3BzLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IG5ldyBQcm9wZXJ0aWVzUHJvbWlzZUFycmF5KGNhc3RWYWx1ZSkucHJvbWlzZSgpO1xuICAgIH1cblxuICAgIGlmIChjYXN0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldC5fcHJvcGFnYXRlRnJvbShjYXN0VmFsdWUsIDQpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9wcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcHJvcHModGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3BzID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHByb3BzKHByb21pc2VzKTtcbn07XG59O1xuXG59LHtcIi4vZXM1LmpzXCI6MTQsXCIuL3V0aWwuanNcIjozOH1dLDI4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gYXJyYXlNb3ZlKHNyYywgc3JjSW5kZXgsIGRzdCwgZHN0SW5kZXgsIGxlbikge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgZHN0W2ogKyBkc3RJbmRleF0gPSBzcmNbaiArIHNyY0luZGV4XTtcbiAgICAgICAgc3JjW2ogKyBzcmNJbmRleF0gPSB2b2lkIDA7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBRdWV1ZShjYXBhY2l0eSkge1xuICAgIHRoaXMuX2NhcGFjaXR5ID0gY2FwYWNpdHk7XG4gICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICB0aGlzLl9mcm9udCA9IDA7XG59XG5cblF1ZXVlLnByb3RvdHlwZS5fd2lsbEJlT3ZlckNhcGFjaXR5ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FwYWNpdHkgPCBzaXplO1xufTtcblxuUXVldWUucHJvdG90eXBlLl9wdXNoT25lID0gZnVuY3Rpb24gKGFyZykge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgIHRoaXMuX2NoZWNrQ2FwYWNpdHkobGVuZ3RoICsgMSk7XG4gICAgdmFyIGkgPSAodGhpcy5fZnJvbnQgKyBsZW5ndGgpICYgKHRoaXMuX2NhcGFjaXR5IC0gMSk7XG4gICAgdGhpc1tpXSA9IGFyZztcbiAgICB0aGlzLl9sZW5ndGggPSBsZW5ndGggKyAxO1xufTtcblxuUXVldWUucHJvdG90eXBlLl91bnNoaWZ0T25lID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgY2FwYWNpdHkgPSB0aGlzLl9jYXBhY2l0eTtcbiAgICB0aGlzLl9jaGVja0NhcGFjaXR5KHRoaXMubGVuZ3RoKCkgKyAxKTtcbiAgICB2YXIgZnJvbnQgPSB0aGlzLl9mcm9udDtcbiAgICB2YXIgaSA9ICgoKCggZnJvbnQgLSAxICkgJlxuICAgICAgICAgICAgICAgICAgICAoIGNhcGFjaXR5IC0gMSkgKSBeIGNhcGFjaXR5ICkgLSBjYXBhY2l0eSApO1xuICAgIHRoaXNbaV0gPSB2YWx1ZTtcbiAgICB0aGlzLl9mcm9udCA9IGk7XG4gICAgdGhpcy5fbGVuZ3RoID0gdGhpcy5sZW5ndGgoKSArIDE7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdGhpcy5fdW5zaGlmdE9uZShhcmcpO1xuICAgIHRoaXMuX3Vuc2hpZnRPbmUocmVjZWl2ZXIpO1xuICAgIHRoaXMuX3Vuc2hpZnRPbmUoZm4pO1xufTtcblxuUXVldWUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKSArIDM7XG4gICAgaWYgKHRoaXMuX3dpbGxCZU92ZXJDYXBhY2l0eShsZW5ndGgpKSB7XG4gICAgICAgIHRoaXMuX3B1c2hPbmUoZm4pO1xuICAgICAgICB0aGlzLl9wdXNoT25lKHJlY2VpdmVyKTtcbiAgICAgICAgdGhpcy5fcHVzaE9uZShhcmcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBqID0gdGhpcy5fZnJvbnQgKyBsZW5ndGggLSAzO1xuICAgIHRoaXMuX2NoZWNrQ2FwYWNpdHkobGVuZ3RoKTtcbiAgICB2YXIgd3JhcE1hc2sgPSB0aGlzLl9jYXBhY2l0eSAtIDE7XG4gICAgdGhpc1soaiArIDApICYgd3JhcE1hc2tdID0gZm47XG4gICAgdGhpc1soaiArIDEpICYgd3JhcE1hc2tdID0gcmVjZWl2ZXI7XG4gICAgdGhpc1soaiArIDIpICYgd3JhcE1hc2tdID0gYXJnO1xuICAgIHRoaXMuX2xlbmd0aCA9IGxlbmd0aDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnJvbnQgPSB0aGlzLl9mcm9udCxcbiAgICAgICAgcmV0ID0gdGhpc1tmcm9udF07XG5cbiAgICB0aGlzW2Zyb250XSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9mcm9udCA9IChmcm9udCArIDEpICYgKHRoaXMuX2NhcGFjaXR5IC0gMSk7XG4gICAgdGhpcy5fbGVuZ3RoLS07XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fY2hlY2tDYXBhY2l0eSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgaWYgKHRoaXMuX2NhcGFjaXR5IDwgc2l6ZSkge1xuICAgICAgICB0aGlzLl9yZXNpemVUbyh0aGlzLl9jYXBhY2l0eSA8PCAxKTtcbiAgICB9XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX3Jlc2l6ZVRvID0gZnVuY3Rpb24gKGNhcGFjaXR5KSB7XG4gICAgdmFyIG9sZENhcGFjaXR5ID0gdGhpcy5fY2FwYWNpdHk7XG4gICAgdGhpcy5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICB2YXIgZnJvbnQgPSB0aGlzLl9mcm9udDtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5fbGVuZ3RoO1xuICAgIHZhciBtb3ZlSXRlbXNDb3VudCA9IChmcm9udCArIGxlbmd0aCkgJiAob2xkQ2FwYWNpdHkgLSAxKTtcbiAgICBhcnJheU1vdmUodGhpcywgMCwgdGhpcywgb2xkQ2FwYWNpdHksIG1vdmVJdGVtc0NvdW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVldWU7XG5cbn0se31dLDI5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihcbiAgICBQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKSB7XG52YXIgaXNBcnJheSA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIikuaXNBcnJheTtcblxudmFyIHJhY2VMYXRlciA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgcmV0dXJuIHByb21pc2UudGhlbihmdW5jdGlvbihhcnJheSkge1xuICAgICAgICByZXR1cm4gcmFjZShhcnJheSwgcHJvbWlzZSk7XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiByYWNlKHByb21pc2VzLCBwYXJlbnQpIHtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShwcm9taXNlcyk7XG5cbiAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gcmFjZUxhdGVyKG1heWJlUHJvbWlzZSk7XG4gICAgfSBlbHNlIGlmICghaXNBcnJheShwcm9taXNlcykpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImV4cGVjdGluZyBhbiBhcnJheSwgYSBwcm9taXNlIG9yIGEgdGhlbmFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zOE1NaGNcXHUwMDBhXCIpO1xuICAgIH1cblxuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldC5fcHJvcGFnYXRlRnJvbShwYXJlbnQsIDQgfCAxKTtcbiAgICB9XG4gICAgdmFyIGZ1bGZpbGwgPSByZXQuX2Z1bGZpbGw7XG4gICAgdmFyIHJlamVjdCA9IHJldC5fcmVqZWN0O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwcm9taXNlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgdmFsID0gcHJvbWlzZXNbaV07XG5cbiAgICAgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkICYmICEoaSBpbiBwcm9taXNlcykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZS5jYXN0KHZhbCkuX3RoZW4oZnVsZmlsbCwgcmVqZWN0LCB1bmRlZmluZWQsIHJldCwgbnVsbCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cblByb21pc2UucmFjZSA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiByYWNlKHByb21pc2VzLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcmFjZSh0aGlzLCB1bmRlZmluZWQpO1xufTtcblxufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDMwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlQXJyYXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwaVJlamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSU5URVJOQUwpIHtcbnZhciBnZXREb21haW4gPSBQcm9taXNlLl9nZXREb21haW47XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xuZnVuY3Rpb24gUmVkdWN0aW9uUHJvbWlzZUFycmF5KHByb21pc2VzLCBmbiwgYWNjdW0sIF9lYWNoKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQocHJvbWlzZXMpO1xuICAgIHRoaXMuX3Byb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgdGhpcy5fcHJlc2VydmVkVmFsdWVzID0gX2VhY2ggPT09IElOVEVSTkFMID8gW10gOiBudWxsO1xuICAgIHRoaXMuX3plcm90aElzQWNjdW0gPSAoYWNjdW0gPT09IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5fZ290QWNjdW0gPSBmYWxzZTtcbiAgICB0aGlzLl9yZWR1Y2luZ0luZGV4ID0gKHRoaXMuX3plcm90aElzQWNjdW0gPyAxIDogMCk7XG4gICAgdGhpcy5fdmFsdWVzUGhhc2UgPSB1bmRlZmluZWQ7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UoYWNjdW0sIHRoaXMuX3Byb21pc2UpO1xuICAgIHZhciByZWplY3RlZCA9IGZhbHNlO1xuICAgIHZhciBpc1Byb21pc2UgPSBtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlO1xuICAgIGlmIChpc1Byb21pc2UpIHtcbiAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fcHJveHlQcm9taXNlQXJyYXkodGhpcywgLTEpO1xuICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgYWNjdW0gPSBtYXliZVByb21pc2UuX3ZhbHVlKCk7XG4gICAgICAgICAgICB0aGlzLl9nb3RBY2N1bSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QobWF5YmVQcm9taXNlLl9yZWFzb24oKSk7XG4gICAgICAgICAgICByZWplY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEoaXNQcm9taXNlIHx8IHRoaXMuX3plcm90aElzQWNjdW0pKSB0aGlzLl9nb3RBY2N1bSA9IHRydWU7XG4gICAgdmFyIGRvbWFpbiA9IGdldERvbWFpbigpO1xuICAgIHRoaXMuX2NhbGxiYWNrID0gZG9tYWluID09PSBudWxsID8gZm4gOiBkb21haW4uYmluZChmbik7XG4gICAgdGhpcy5fYWNjdW0gPSBhY2N1bTtcbiAgICBpZiAoIXJlamVjdGVkKSBhc3luYy5pbnZva2UoaW5pdCwgdGhpcywgdW5kZWZpbmVkKTtcbn1cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCAtNSk7XG59XG51dGlsLmluaGVyaXRzKFJlZHVjdGlvblByb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuXG5SZWR1Y3Rpb25Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZXNvbHZlRW1wdHlBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fZ290QWNjdW0gfHwgdGhpcy5femVyb3RoSXNBY2N1bSkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ByZXNlcnZlZFZhbHVlcyAhPT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBbXSA6IHRoaXMuX2FjY3VtKTtcbiAgICB9XG59O1xuXG5SZWR1Y3Rpb25Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgIHZhciBwcmVzZXJ2ZWRWYWx1ZXMgPSB0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXM7XG4gICAgdmFyIGlzRWFjaCA9IHByZXNlcnZlZFZhbHVlcyAhPT0gbnVsbDtcbiAgICB2YXIgZ290QWNjdW0gPSB0aGlzLl9nb3RBY2N1bTtcbiAgICB2YXIgdmFsdWVzUGhhc2UgPSB0aGlzLl92YWx1ZXNQaGFzZTtcbiAgICB2YXIgdmFsdWVzUGhhc2VJbmRleDtcbiAgICBpZiAoIXZhbHVlc1BoYXNlKSB7XG4gICAgICAgIHZhbHVlc1BoYXNlID0gdGhpcy5fdmFsdWVzUGhhc2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YWx1ZXNQaGFzZUluZGV4PTA7IHZhbHVlc1BoYXNlSW5kZXg8bGVuZ3RoOyArK3ZhbHVlc1BoYXNlSW5kZXgpIHtcbiAgICAgICAgICAgIHZhbHVlc1BoYXNlW3ZhbHVlc1BoYXNlSW5kZXhdID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YWx1ZXNQaGFzZUluZGV4ID0gdmFsdWVzUGhhc2VbaW5kZXhdO1xuXG4gICAgaWYgKGluZGV4ID09PSAwICYmIHRoaXMuX3plcm90aElzQWNjdW0pIHtcbiAgICAgICAgdGhpcy5fYWNjdW0gPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fZ290QWNjdW0gPSBnb3RBY2N1bSA9IHRydWU7XG4gICAgICAgIHZhbHVlc1BoYXNlW2luZGV4XSA9ICgodmFsdWVzUGhhc2VJbmRleCA9PT0gMClcbiAgICAgICAgICAgID8gMSA6IDIpO1xuICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIHRoaXMuX2FjY3VtID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2dvdEFjY3VtID0gZ290QWNjdW0gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh2YWx1ZXNQaGFzZUluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICB2YWx1ZXNQaGFzZVtpbmRleF0gPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWVzUGhhc2VbaW5kZXhdID0gMjtcbiAgICAgICAgICAgIHRoaXMuX2FjY3VtID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFnb3RBY2N1bSkgcmV0dXJuO1xuXG4gICAgdmFyIGNhbGxiYWNrID0gdGhpcy5fY2FsbGJhY2s7XG4gICAgdmFyIHJlY2VpdmVyID0gdGhpcy5fcHJvbWlzZS5fYm91bmRWYWx1ZSgpO1xuICAgIHZhciByZXQ7XG5cbiAgICBmb3IgKHZhciBpID0gdGhpcy5fcmVkdWNpbmdJbmRleDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhbHVlc1BoYXNlSW5kZXggPSB2YWx1ZXNQaGFzZVtpXTtcbiAgICAgICAgaWYgKHZhbHVlc1BoYXNlSW5kZXggPT09IDIpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZHVjaW5nSW5kZXggPSBpICsgMTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXNQaGFzZUluZGV4ICE9PSAxKSByZXR1cm47XG4gICAgICAgIHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgICAgICBpZiAoaXNFYWNoKSB7XG4gICAgICAgICAgICBwcmVzZXJ2ZWRWYWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICByZXQgPSB0cnlDYXRjaChjYWxsYmFjaykuY2FsbChyZWNlaXZlciwgdmFsdWUsIGksIGxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXQgPSB0cnlDYXRjaChjYWxsYmFjaylcbiAgICAgICAgICAgICAgICAuY2FsbChyZWNlaXZlciwgdGhpcy5fYWNjdW0sIHZhbHVlLCBpLCBsZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcblxuICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikgcmV0dXJuIHRoaXMuX3JlamVjdChyZXQuZSk7XG5cbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmV0LCB0aGlzLl9wcm9taXNlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlc1BoYXNlW2ldID0gNDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVQcm9taXNlLl9wcm94eVByb21pc2VBcnJheSh0aGlzLCBpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0ID0gbWF5YmVQcm9taXNlLl92YWx1ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0KG1heWJlUHJvbWlzZS5fcmVhc29uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcmVkdWNpbmdJbmRleCA9IGkgKyAxO1xuICAgICAgICB0aGlzLl9hY2N1bSA9IHJldDtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlKGlzRWFjaCA/IHByZXNlcnZlZFZhbHVlcyA6IHRoaXMuX2FjY3VtKTtcbn07XG5cbmZ1bmN0aW9uIHJlZHVjZShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhcGlSZWplY3Rpb24oXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIHZhciBhcnJheSA9IG5ldyBSZWR1Y3Rpb25Qcm9taXNlQXJyYXkocHJvbWlzZXMsIGZuLCBpbml0aWFsVmFsdWUsIF9lYWNoKTtcbiAgICByZXR1cm4gYXJyYXkucHJvbWlzZSgpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoZm4sIGluaXRpYWxWYWx1ZSkge1xuICAgIHJldHVybiByZWR1Y2UodGhpcywgZm4sIGluaXRpYWxWYWx1ZSwgbnVsbCk7XG59O1xuXG5Qcm9taXNlLnJlZHVjZSA9IGZ1bmN0aW9uIChwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpIHtcbiAgICByZXR1cm4gcmVkdWNlKHByb21pc2VzLCBmbiwgaW5pdGlhbFZhbHVlLCBfZWFjaCk7XG59O1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vdXRpbC5qc1wiOjM4fV0sMzE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgc2NoZWR1bGU7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWxcIik7XG52YXIgbm9Bc3luY1NjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGFzeW5jIHNjaGVkdWxlciBhdmFpbGFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9tM09UWGtcXHUwMDBhXCIpO1xufTtcbmlmICh1dGlsLmlzTm9kZSAmJiB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhciBHbG9iYWxTZXRJbW1lZGlhdGUgPSBnbG9iYWwuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBQcm9jZXNzTmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgIHNjaGVkdWxlID0gdXRpbC5pc1JlY2VudE5vZGVcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uKGZuKSB7IEdsb2JhbFNldEltbWVkaWF0ZS5jYWxsKGdsb2JhbCwgZm4pOyB9XG4gICAgICAgICAgICAgICAgOiBmdW5jdGlvbihmbikgeyBQcm9jZXNzTmV4dFRpY2suY2FsbChwcm9jZXNzLCBmbik7IH07XG59IGVsc2UgaWYgKCh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICAhKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IgJiZcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0b3Iuc3RhbmRhbG9uZSkpIHtcbiAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmbik7XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZGl2LCB7YXR0cmlidXRlczogdHJ1ZX0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7IGRpdi5jbGFzc0xpc3QudG9nZ2xlKFwiZm9vXCIpOyB9O1xuICAgIH07XG4gICAgc2NoZWR1bGUuaXNTdGF0aWMgPSB0cnVlO1xufSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgc2NoZWR1bGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcbiAgICB9O1xufSBlbHNlIGlmICh0eXBlb2Ygc2V0VGltZW91dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHNjaGVkdWxlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59IGVsc2Uge1xuICAgIHNjaGVkdWxlID0gbm9Bc3luY1NjaGVkdWxlcjtcbn1cbm1vZHVsZS5leHBvcnRzID0gc2NoZWR1bGU7XG5cbn0se1wiLi91dGlsXCI6Mzh9XSwzMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID1cbiAgICBmdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXkpIHtcbnZhciBQcm9taXNlSW5zcGVjdGlvbiA9IFByb21pc2UuUHJvbWlzZUluc3BlY3Rpb247XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG5cbmZ1bmN0aW9uIFNldHRsZWRQcm9taXNlQXJyYXkodmFsdWVzKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQodmFsdWVzKTtcbn1cbnV0aWwuaW5oZXJpdHMoU2V0dGxlZFByb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuU2V0dGxlZFByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VSZXNvbHZlZCA9IGZ1bmN0aW9uIChpbmRleCwgaW5zcGVjdGlvbikge1xuICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSBpbnNwZWN0aW9uO1xuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IHRoaXMuX2xlbmd0aCkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgfVxufTtcblxuU2V0dGxlZFByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlSW5zcGVjdGlvbigpO1xuICAgIHJldC5fYml0RmllbGQgPSAyNjg0MzU0NTY7XG4gICAgcmV0Ll9zZXR0bGVkVmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLl9wcm9taXNlUmVzb2x2ZWQoaW5kZXgsIHJldCk7XG59O1xuU2V0dGxlZFByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VSZWplY3RlZCA9IGZ1bmN0aW9uIChyZWFzb24sIGluZGV4KSB7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlSW5zcGVjdGlvbigpO1xuICAgIHJldC5fYml0RmllbGQgPSAxMzQyMTc3Mjg7XG4gICAgcmV0Ll9zZXR0bGVkVmFsdWUgPSByZWFzb247XG4gICAgdGhpcy5fcHJvbWlzZVJlc29sdmVkKGluZGV4LCByZXQpO1xufTtcblxuUHJvbWlzZS5zZXR0bGUgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gbmV3IFNldHRsZWRQcm9taXNlQXJyYXkocHJvbWlzZXMpLnByb21pc2UoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldHRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbmV3IFNldHRsZWRQcm9taXNlQXJyYXkodGhpcykucHJvbWlzZSgpO1xufTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwzMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgUmFuZ2VFcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKS5SYW5nZUVycm9yO1xudmFyIEFnZ3JlZ2F0ZUVycm9yID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpLkFnZ3JlZ2F0ZUVycm9yO1xudmFyIGlzQXJyYXkgPSB1dGlsLmlzQXJyYXk7XG5cblxuZnVuY3Rpb24gU29tZVByb21pc2VBcnJheSh2YWx1ZXMpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJCh2YWx1ZXMpO1xuICAgIHRoaXMuX2hvd01hbnkgPSAwO1xuICAgIHRoaXMuX3Vud3JhcCA9IGZhbHNlO1xuICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG59XG51dGlsLmluaGVyaXRzKFNvbWVQcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5faG93TWFueSA9PT0gMCkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKFtdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9pbml0JCh1bmRlZmluZWQsIC01KTtcbiAgICB2YXIgaXNBcnJheVJlc29sdmVkID0gaXNBcnJheSh0aGlzLl92YWx1ZXMpO1xuICAgIGlmICghdGhpcy5faXNSZXNvbHZlZCgpICYmXG4gICAgICAgIGlzQXJyYXlSZXNvbHZlZCAmJlxuICAgICAgICB0aGlzLl9ob3dNYW55ID4gdGhpcy5fY2FuUG9zc2libHlGdWxmaWxsKCkpIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0KHRoaXMuX2dldFJhbmdlRXJyb3IodGhpcy5sZW5ndGgoKSkpO1xuICAgIH1cbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHRoaXMuX2luaXQoKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLnNldFVud3JhcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl91bndyYXAgPSB0cnVlO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuaG93TWFueSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faG93TWFueTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLnNldEhvd01hbnkgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICB0aGlzLl9ob3dNYW55ID0gY291bnQ7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX2FkZEZ1bGZpbGxlZCh2YWx1ZSk7XG4gICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCgpID09PSB0aGlzLmhvd01hbnkoKSkge1xuICAgICAgICB0aGlzLl92YWx1ZXMubGVuZ3RoID0gdGhpcy5ob3dNYW55KCk7XG4gICAgICAgIGlmICh0aGlzLmhvd01hbnkoKSA9PT0gMSAmJiB0aGlzLl91bndyYXApIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUodGhpcy5fdmFsdWVzWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUodGhpcy5fdmFsdWVzKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fYWRkUmVqZWN0ZWQocmVhc29uKTtcbiAgICBpZiAodGhpcy5ob3dNYW55KCkgPiB0aGlzLl9jYW5Qb3NzaWJseUZ1bGZpbGwoKSkge1xuICAgICAgICB2YXIgZSA9IG5ldyBBZ2dyZWdhdGVFcnJvcigpO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sZW5ndGgoKTsgaSA8IHRoaXMuX3ZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgZS5wdXNoKHRoaXMuX3ZhbHVlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVqZWN0KGUpO1xuICAgIH1cbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9mdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RvdGFsUmVzb2x2ZWQ7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5sZW5ndGggLSB0aGlzLmxlbmd0aCgpO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2FkZFJlamVjdGVkID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHRoaXMuX3ZhbHVlcy5wdXNoKHJlYXNvbik7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fYWRkRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fdmFsdWVzW3RoaXMuX3RvdGFsUmVzb2x2ZWQrK10gPSB2YWx1ZTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9jYW5Qb3NzaWJseUZ1bGZpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubGVuZ3RoKCkgLSB0aGlzLl9yZWplY3RlZCgpO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2dldFJhbmdlRXJyb3IgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICB2YXIgbWVzc2FnZSA9IFwiSW5wdXQgYXJyYXkgbXVzdCBjb250YWluIGF0IGxlYXN0IFwiICtcbiAgICAgICAgICAgIHRoaXMuX2hvd01hbnkgKyBcIiBpdGVtcyBidXQgY29udGFpbnMgb25seSBcIiArIGNvdW50ICsgXCIgaXRlbXNcIjtcbiAgICByZXR1cm4gbmV3IFJhbmdlRXJyb3IobWVzc2FnZSk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVzb2x2ZUVtcHR5QXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVqZWN0KHRoaXMuX2dldFJhbmdlRXJyb3IoMCkpO1xufTtcblxuZnVuY3Rpb24gc29tZShwcm9taXNlcywgaG93TWFueSkge1xuICAgIGlmICgoaG93TWFueSB8IDApICE9PSBob3dNYW55IHx8IGhvd01hbnkgPCAwKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJleHBlY3RpbmcgYSBwb3NpdGl2ZSBpbnRlZ2VyXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvMXdBbUh4XFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdmFyIHJldCA9IG5ldyBTb21lUHJvbWlzZUFycmF5KHByb21pc2VzKTtcbiAgICB2YXIgcHJvbWlzZSA9IHJldC5wcm9taXNlKCk7XG4gICAgcmV0LnNldEhvd01hbnkoaG93TWFueSk7XG4gICAgcmV0LmluaXQoKTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5zb21lID0gZnVuY3Rpb24gKHByb21pc2VzLCBob3dNYW55KSB7XG4gICAgcmV0dXJuIHNvbWUocHJvbWlzZXMsIGhvd01hbnkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc29tZSA9IGZ1bmN0aW9uIChob3dNYW55KSB7XG4gICAgcmV0dXJuIHNvbWUodGhpcywgaG93TWFueSk7XG59O1xuXG5Qcm9taXNlLl9Tb21lUHJvbWlzZUFycmF5ID0gU29tZVByb21pc2VBcnJheTtcbn07XG5cbn0se1wiLi9lcnJvcnMuanNcIjoxMyxcIi4vdXRpbC5qc1wiOjM4fV0sMzQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbmZ1bmN0aW9uIFByb21pc2VJbnNwZWN0aW9uKHByb21pc2UpIHtcbiAgICBpZiAocHJvbWlzZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByb21pc2UgPSBwcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSBwcm9taXNlLl9iaXRGaWVsZDtcbiAgICAgICAgdGhpcy5fc2V0dGxlZFZhbHVlID0gcHJvbWlzZS5fc2V0dGxlZFZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSAwO1xuICAgICAgICB0aGlzLl9zZXR0bGVkVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgb2YgYSBub24tZnVsZmlsbGVkIHByb21pc2VcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9oYzFETGpcXHUwMDBhXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZFZhbHVlO1xufTtcblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmVycm9yID1cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5yZWFzb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2Fubm90IGdldCByZWplY3Rpb24gcmVhc29uIG9mIGEgbm9uLXJlamVjdGVkIHByb21pc2VcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9oUHVpd0JcXHUwMDBhXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZFZhbHVlO1xufTtcblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzRnVsZmlsbGVkID1cblByb21pc2UucHJvdG90eXBlLl9pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMjY4NDM1NDU2KSA+IDA7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNSZWplY3RlZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5faXNSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMTM0MjE3NzI4KSA+IDA7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNQZW5kaW5nID1cblByb21pc2UucHJvdG90eXBlLl9pc1BlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDQwMjY1MzE4NCkgPT09IDA7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNSZXNvbHZlZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5faXNSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNDAyNjUzMTg0KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0KCkuX2lzUGVuZGluZygpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl90YXJnZXQoKS5faXNSZWplY3RlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0KCkuX2lzRnVsZmlsbGVkKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1Jlc29sdmVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldCgpLl9pc1Jlc29sdmVkKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZFZhbHVlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlYXNvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZFZhbHVlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0KCk7XG4gICAgaWYgKCF0YXJnZXQuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2Fubm90IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBvZiBhIG5vbi1mdWxmaWxsZWQgcHJvbWlzZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL2hjMURMalxcdTAwMGFcIik7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQuX3NldHRsZWRWYWx1ZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnJlYXNvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXQoKTtcbiAgICBpZiAoIXRhcmdldC5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBnZXQgcmVqZWN0aW9uIHJlYXNvbiBvZiBhIG5vbi1yZWplY3RlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvaFB1aXdCXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdGFyZ2V0Ll91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgcmV0dXJuIHRhcmdldC5fc2V0dGxlZFZhbHVlO1xufTtcblxuXG5Qcm9taXNlLlByb21pc2VJbnNwZWN0aW9uID0gUHJvbWlzZUluc3BlY3Rpb247XG59O1xuXG59LHt9XSwzNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgaXNPYmplY3QgPSB1dGlsLmlzT2JqZWN0O1xuXG5mdW5jdGlvbiB0cnlDb252ZXJ0VG9Qcm9taXNlKG9iaiwgY29udGV4dCkge1xuICAgIGlmIChpc09iamVjdChvYmopKSB7XG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQW55Qmx1ZWJpcmRQcm9taXNlKG9iaikpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgICAgICBvYmouX3RoZW4oXG4gICAgICAgICAgICAgICAgcmV0Ll9mdWxmaWxsVW5jaGVja2VkLFxuICAgICAgICAgICAgICAgIHJldC5fcmVqZWN0VW5jaGVja2VkQ2hlY2tFcnJvcixcbiAgICAgICAgICAgICAgICByZXQuX3Byb2dyZXNzVW5jaGVja2VkLFxuICAgICAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhlbiA9IHV0aWwudHJ5Q2F0Y2goZ2V0VGhlbikob2JqKTtcbiAgICAgICAgaWYgKHRoZW4gPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICBpZiAoY29udGV4dCkgY29udGV4dC5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBQcm9taXNlLnJlamVjdCh0aGVuLmUpO1xuICAgICAgICAgICAgaWYgKGNvbnRleHQpIGNvbnRleHQuX3BvcENvbnRleHQoKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIGRvVGhlbmFibGUob2JqLCB0aGVuLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBnZXRUaGVuKG9iaikge1xuICAgIHJldHVybiBvYmoudGhlbjtcbn1cblxudmFyIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGlzQW55Qmx1ZWJpcmRQcm9taXNlKG9iaikge1xuICAgIHJldHVybiBoYXNQcm9wLmNhbGwob2JqLCBcIl9wcm9taXNlMFwiKTtcbn1cblxuZnVuY3Rpb24gZG9UaGVuYWJsZSh4LCB0aGVuLCBjb250ZXh0KSB7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgdmFyIHJldCA9IHByb21pc2U7XG4gICAgaWYgKGNvbnRleHQpIGNvbnRleHQuX3B1c2hDb250ZXh0KCk7XG4gICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICBpZiAoY29udGV4dCkgY29udGV4dC5fcG9wQ29udGV4dCgpO1xuICAgIHZhciBzeW5jaHJvbm91cyA9IHRydWU7XG4gICAgdmFyIHJlc3VsdCA9IHV0aWwudHJ5Q2F0Y2godGhlbikuY2FsbCh4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVGcm9tVGhlbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0RnJvbVRoZW5hYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRnJvbVRoZW5hYmxlKTtcbiAgICBzeW5jaHJvbm91cyA9IGZhbHNlO1xuICAgIGlmIChwcm9taXNlICYmIHJlc3VsdCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVzdWx0LmUsIHRydWUsIHRydWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlRnJvbVRoZW5hYmxlKHZhbHVlKSB7XG4gICAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuO1xuICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWplY3RGcm9tVGhlbmFibGUocmVhc29uKSB7XG4gICAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuO1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZWFzb24sIHN5bmNocm9ub3VzLCB0cnVlKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvZ3Jlc3NGcm9tVGhlbmFibGUodmFsdWUpIHtcbiAgICAgICAgaWYgKCFwcm9taXNlKSByZXR1cm47XG4gICAgICAgIGlmICh0eXBlb2YgcHJvbWlzZS5fcHJvZ3Jlc3MgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcHJvbWlzZS5fcHJvZ3Jlc3ModmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbnJldHVybiB0cnlDb252ZXJ0VG9Qcm9taXNlO1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDM2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIFRpbWVvdXRFcnJvciA9IFByb21pc2UuVGltZW91dEVycm9yO1xuXG52YXIgYWZ0ZXJUaW1lb3V0ID0gZnVuY3Rpb24gKHByb21pc2UsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXByb21pc2UuaXNQZW5kaW5nKCkpIHJldHVybjtcbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IFwib3BlcmF0aW9uIHRpbWVkIG91dFwiO1xuICAgIH1cbiAgICB2YXIgZXJyID0gbmV3IFRpbWVvdXRFcnJvcihtZXNzYWdlKTtcbiAgICB1dGlsLm1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbihlcnIpO1xuICAgIHByb21pc2UuX2F0dGFjaEV4dHJhVHJhY2UoZXJyKTtcbiAgICBwcm9taXNlLl9jYW5jZWwoZXJyKTtcbn07XG5cbnZhciBhZnRlclZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHsgcmV0dXJuIGRlbGF5KCt0aGlzKS50aGVuUmV0dXJuKHZhbHVlKTsgfTtcbnZhciBkZWxheSA9IFByb21pc2UuZGVsYXkgPSBmdW5jdGlvbiAodmFsdWUsIG1zKSB7XG4gICAgaWYgKG1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbXMgPSB2YWx1ZTtcbiAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHJldC5fZnVsZmlsbCgpOyB9LCBtcyk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIG1zID0gK21zO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpLl90aGVuKGFmdGVyVmFsdWUsIG51bGwsIG51bGwsIG1zLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAobXMpIHtcbiAgICByZXR1cm4gZGVsYXkodGhpcywgbXMpO1xufTtcblxuZnVuY3Rpb24gc3VjY2Vzc0NsZWFyKHZhbHVlKSB7XG4gICAgdmFyIGhhbmRsZSA9IHRoaXM7XG4gICAgaWYgKGhhbmRsZSBpbnN0YW5jZW9mIE51bWJlcikgaGFuZGxlID0gK2hhbmRsZTtcbiAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGZhaWx1cmVDbGVhcihyZWFzb24pIHtcbiAgICB2YXIgaGFuZGxlID0gdGhpcztcbiAgICBpZiAoaGFuZGxlIGluc3RhbmNlb2YgTnVtYmVyKSBoYW5kbGUgPSAraGFuZGxlO1xuICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgIHRocm93IHJlYXNvbjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgbWVzc2FnZSkge1xuICAgIG1zID0gK21zO1xuICAgIHZhciByZXQgPSB0aGlzLnRoZW4oKS5jYW5jZWxsYWJsZSgpO1xuICAgIHJldC5fY2FuY2VsbGF0aW9uUGFyZW50ID0gdGhpcztcbiAgICB2YXIgaGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbiB0aW1lb3V0VGltZW91dCgpIHtcbiAgICAgICAgYWZ0ZXJUaW1lb3V0KHJldCwgbWVzc2FnZSk7XG4gICAgfSwgbXMpO1xuICAgIHJldHVybiByZXQuX3RoZW4oc3VjY2Vzc0NsZWFyLCBmYWlsdXJlQ2xlYXIsIHVuZGVmaW5lZCwgaGFuZGxlLCB1bmRlZmluZWQpO1xufTtcblxufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDM3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoUHJvbWlzZSwgYXBpUmVqZWN0aW9uLCB0cnlDb252ZXJ0VG9Qcm9taXNlLFxuICAgIGNyZWF0ZUNvbnRleHQpIHtcbiAgICB2YXIgVHlwZUVycm9yID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpLlR5cGVFcnJvcjtcbiAgICB2YXIgaW5oZXJpdHMgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpLmluaGVyaXRzO1xuICAgIHZhciBQcm9taXNlSW5zcGVjdGlvbiA9IFByb21pc2UuUHJvbWlzZUluc3BlY3Rpb247XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0aW9uTWFwcGVyKGluc3BlY3Rpb25zKSB7XG4gICAgICAgIHZhciBsZW4gPSBpbnNwZWN0aW9ucy5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpbnNwZWN0aW9uID0gaW5zcGVjdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAoaW5zcGVjdGlvbi5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoaW5zcGVjdGlvbi5lcnJvcigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluc3BlY3Rpb25zW2ldID0gaW5zcGVjdGlvbi5fc2V0dGxlZFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnNwZWN0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aHJvd2VyKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe3Rocm93IGU7fSwgMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FzdFByZXNlcnZpbmdEaXNwb3NhYmxlKHRoZW5hYmxlKSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoZW5hYmxlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSAhPT0gdGhlbmFibGUgJiZcbiAgICAgICAgICAgIHR5cGVvZiB0aGVuYWJsZS5faXNEaXNwb3NhYmxlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiB0aGVuYWJsZS5fZ2V0RGlzcG9zZXIgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgdGhlbmFibGUuX2lzRGlzcG9zYWJsZSgpKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UuX3NldERpc3Bvc2FibGUodGhlbmFibGUuX2dldERpc3Bvc2VyKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXliZVByb21pc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UocmVzb3VyY2VzLCBpbnNwZWN0aW9uKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IHJlc291cmNlcy5sZW5ndGg7XG4gICAgICAgIHZhciByZXQgPSBQcm9taXNlLmRlZmVyKCk7XG4gICAgICAgIGZ1bmN0aW9uIGl0ZXJhdG9yKCkge1xuICAgICAgICAgICAgaWYgKGkgPj0gbGVuKSByZXR1cm4gcmV0LnJlc29sdmUoKTtcbiAgICAgICAgICAgIHZhciBtYXliZVByb21pc2UgPSBjYXN0UHJlc2VydmluZ0Rpc3Bvc2FibGUocmVzb3VyY2VzW2krK10pO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UgJiZcbiAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX2lzRGlzcG9zYWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fZ2V0RGlzcG9zZXIoKS50cnlEaXNwb3NlKGluc3BlY3Rpb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzLnByb21pc2UpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRocm93ZXIoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXliZVByb21pc2UuX3RoZW4oaXRlcmF0b3IsIHRocm93ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlcmF0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICBpdGVyYXRvcigpO1xuICAgICAgICByZXR1cm4gcmV0LnByb21pc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcG9zZXJTdWNjZXNzKHZhbHVlKSB7XG4gICAgICAgIHZhciBpbnNwZWN0aW9uID0gbmV3IFByb21pc2VJbnNwZWN0aW9uKCk7XG4gICAgICAgIGluc3BlY3Rpb24uX3NldHRsZWRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICBpbnNwZWN0aW9uLl9iaXRGaWVsZCA9IDI2ODQzNTQ1NjtcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2UodGhpcywgaW5zcGVjdGlvbikudGhlblJldHVybih2YWx1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcG9zZXJGYWlsKHJlYXNvbikge1xuICAgICAgICB2YXIgaW5zcGVjdGlvbiA9IG5ldyBQcm9taXNlSW5zcGVjdGlvbigpO1xuICAgICAgICBpbnNwZWN0aW9uLl9zZXR0bGVkVmFsdWUgPSByZWFzb247XG4gICAgICAgIGluc3BlY3Rpb24uX2JpdEZpZWxkID0gMTM0MjE3NzI4O1xuICAgICAgICByZXR1cm4gZGlzcG9zZSh0aGlzLCBpbnNwZWN0aW9uKS50aGVuVGhyb3cocmVhc29uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBEaXNwb3NlcihkYXRhLCBwcm9taXNlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLl9wcm9taXNlID0gcHJvbWlzZTtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgRGlzcG9zZXIucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUucHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfTtcblxuICAgIERpc3Bvc2VyLnByb3RvdHlwZS5yZXNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvbWlzZSgpLmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb21pc2UoKS52YWx1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUudHJ5RGlzcG9zZSA9IGZ1bmN0aW9uKGluc3BlY3Rpb24pIHtcbiAgICAgICAgdmFyIHJlc291cmNlID0gdGhpcy5yZXNvdXJjZSgpO1xuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIGlmIChjb250ZXh0ICE9PSB1bmRlZmluZWQpIGNvbnRleHQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHZhciByZXQgPSByZXNvdXJjZSAhPT0gbnVsbFxuICAgICAgICAgICAgPyB0aGlzLmRvRGlzcG9zZShyZXNvdXJjZSwgaW5zcGVjdGlvbikgOiBudWxsO1xuICAgICAgICBpZiAoY29udGV4dCAhPT0gdW5kZWZpbmVkKSBjb250ZXh0Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3Vuc2V0RGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgRGlzcG9zZXIuaXNEaXNwb3NlciA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiAoZCAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIGQucmVzb3VyY2UgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBkLnRyeURpc3Bvc2UgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIEZ1bmN0aW9uRGlzcG9zZXIoZm4sIHByb21pc2UsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciQoZm4sIHByb21pc2UsIGNvbnRleHQpO1xuICAgIH1cbiAgICBpbmhlcml0cyhGdW5jdGlvbkRpc3Bvc2VyLCBEaXNwb3Nlcik7XG5cbiAgICBGdW5jdGlvbkRpc3Bvc2VyLnByb3RvdHlwZS5kb0Rpc3Bvc2UgPSBmdW5jdGlvbiAocmVzb3VyY2UsIGluc3BlY3Rpb24pIHtcbiAgICAgICAgdmFyIGZuID0gdGhpcy5kYXRhKCk7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHJlc291cmNlLCByZXNvdXJjZSwgaW5zcGVjdGlvbik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1heWJlVW53cmFwRGlzcG9zZXIodmFsdWUpIHtcbiAgICAgICAgaWYgKERpc3Bvc2VyLmlzRGlzcG9zZXIodmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlc1t0aGlzLmluZGV4XS5fc2V0RGlzcG9zYWJsZSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBQcm9taXNlLnVzaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiA8IDIpIHJldHVybiBhcGlSZWplY3Rpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlvdSBtdXN0IHBhc3MgYXQgbGVhc3QgMiBhcmd1bWVudHMgdG8gUHJvbWlzZS51c2luZ1wiKTtcbiAgICAgICAgdmFyIGZuID0gYXJndW1lbnRzW2xlbiAtIDFdO1xuICAgICAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhcGlSZWplY3Rpb24oXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgICAgICBsZW4tLTtcbiAgICAgICAgdmFyIHJlc291cmNlcyA9IG5ldyBBcnJheShsZW4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBpZiAoRGlzcG9zZXIuaXNEaXNwb3NlcihyZXNvdXJjZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlzcG9zZXIgPSByZXNvdXJjZTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZSA9IHJlc291cmNlLnByb21pc2UoKTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5fc2V0RGlzcG9zYWJsZShkaXNwb3Nlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX3RoZW4obWF5YmVVbndyYXBEaXNwb3NlciwgbnVsbCwgbnVsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogcmVzb3VyY2VzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpXG4gICAgICAgICAgICAgICAgICAgIH0sIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb3VyY2VzW2ldID0gcmVzb3VyY2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvbWlzZSA9IFByb21pc2Uuc2V0dGxlKHJlc291cmNlcylcbiAgICAgICAgICAgIC50aGVuKGluc3BlY3Rpb25NYXBwZXIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbih2YWxzKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgcmV0O1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldCA9IGZuLmFwcGx5KHVuZGVmaW5lZCwgdmFscyk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5fdGhlbihcbiAgICAgICAgICAgICAgICBkaXNwb3NlclN1Y2Nlc3MsIGRpc3Bvc2VyRmFpbCwgdW5kZWZpbmVkLCByZXNvdXJjZXMsIHVuZGVmaW5lZCk7XG4gICAgICAgIHJlc291cmNlcy5wcm9taXNlID0gcHJvbWlzZTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl9zZXREaXNwb3NhYmxlID0gZnVuY3Rpb24gKGRpc3Bvc2VyKSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAyNjIxNDQ7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VyID0gZGlzcG9zZXI7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl9pc0Rpc3Bvc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAyNjIxNDQpID4gMDtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX2dldERpc3Bvc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcG9zZXI7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl91bnNldERpc3Bvc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjI2MjE0NCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VyID0gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5kaXNwb3NlciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb25EaXNwb3NlcihmbiwgdGhpcywgY3JlYXRlQ29udGV4dCgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgfTtcblxufTtcblxufSx7XCIuL2Vycm9ycy5qc1wiOjEzLFwiLi91dGlsLmpzXCI6Mzh9XSwzODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczUuanNcIik7XG52YXIgY2FuRXZhbHVhdGUgPSB0eXBlb2YgbmF2aWdhdG9yID09IFwidW5kZWZpbmVkXCI7XG52YXIgaGF2ZUdldHRlcnMgPSAoZnVuY3Rpb24oKXtcbiAgICB0cnkge1xuICAgICAgICB2YXIgbyA9IHt9O1xuICAgICAgICBlczUuZGVmaW5lUHJvcGVydHkobywgXCJmXCIsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG8uZiA9PT0gMztcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxufSkoKTtcblxudmFyIGVycm9yT2JqID0ge2U6IHt9fTtcbnZhciB0cnlDYXRjaFRhcmdldDtcbmZ1bmN0aW9uIHRyeUNhdGNoZXIoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRyeUNhdGNoVGFyZ2V0O1xuICAgICAgICB0cnlDYXRjaFRhcmdldCA9IG51bGw7XG4gICAgICAgIHJldHVybiB0YXJnZXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVycm9yT2JqLmUgPSBlO1xuICAgICAgICByZXR1cm4gZXJyb3JPYmo7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJ5Q2F0Y2goZm4pIHtcbiAgICB0cnlDYXRjaFRhcmdldCA9IGZuO1xuICAgIHJldHVybiB0cnlDYXRjaGVyO1xufVxuXG52YXIgaW5oZXJpdHMgPSBmdW5jdGlvbihDaGlsZCwgUGFyZW50KSB7XG4gICAgdmFyIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICAgIGZ1bmN0aW9uIFQoKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBDaGlsZDtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciQgPSBQYXJlbnQ7XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBQYXJlbnQucHJvdG90eXBlKSB7XG4gICAgICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKFBhcmVudC5wcm90b3R5cGUsIHByb3BlcnR5TmFtZSkgJiZcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUuY2hhckF0KHByb3BlcnR5TmFtZS5sZW5ndGgtMSkgIT09IFwiJFwiXG4gICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lICsgXCIkXCJdID0gUGFyZW50LnByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFQucHJvdG90eXBlID0gUGFyZW50LnByb3RvdHlwZTtcbiAgICBDaGlsZC5wcm90b3R5cGUgPSBuZXcgVCgpO1xuICAgIHJldHVybiBDaGlsZC5wcm90b3R5cGU7XG59O1xuXG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbCkge1xuICAgIHJldHVybiB2YWwgPT0gbnVsbCB8fCB2YWwgPT09IHRydWUgfHwgdmFsID09PSBmYWxzZSB8fFxuICAgICAgICB0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiB2YWwgPT09IFwibnVtYmVyXCI7XG5cbn1cblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gIWlzUHJpbWl0aXZlKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVXcmFwQXNFcnJvcihtYXliZUVycm9yKSB7XG4gICAgaWYgKCFpc1ByaW1pdGl2ZShtYXliZUVycm9yKSkgcmV0dXJuIG1heWJlRXJyb3I7XG5cbiAgICByZXR1cm4gbmV3IEVycm9yKHNhZmVUb1N0cmluZyhtYXliZUVycm9yKSk7XG59XG5cbmZ1bmN0aW9uIHdpdGhBcHBlbmRlZCh0YXJnZXQsIGFwcGVuZGVlKSB7XG4gICAgdmFyIGxlbiA9IHRhcmdldC5sZW5ndGg7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShsZW4gKyAxKTtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgcmV0W2ldID0gdGFyZ2V0W2ldO1xuICAgIH1cbiAgICByZXRbaV0gPSBhcHBlbmRlZTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBnZXREYXRhUHJvcGVydHlPckRlZmF1bHQob2JqLCBrZXksIGRlZmF1bHRWYWx1ZSkge1xuICAgIGlmIChlczUuaXNFUzUpIHtcbiAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KTtcblxuICAgICAgICBpZiAoZGVzYyAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVzYy5nZXQgPT0gbnVsbCAmJiBkZXNjLnNldCA9PSBudWxsXG4gICAgICAgICAgICAgICAgICAgID8gZGVzYy52YWx1ZVxuICAgICAgICAgICAgICAgICAgICA6IGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSA/IG9ialtrZXldIDogdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90RW51bWVyYWJsZVByb3Aob2JqLCBuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChpc1ByaW1pdGl2ZShvYmopKSByZXR1cm4gb2JqO1xuICAgIHZhciBkZXNjcmlwdG9yID0ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgICBlczUuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCBkZXNjcmlwdG9yKTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiB0aHJvd2VyKHIpIHtcbiAgICB0aHJvdyByO1xufVxuXG52YXIgaW5oZXJpdGVkRGF0YUtleXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGV4Y2x1ZGVkUHJvdG90eXBlcyA9IFtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLFxuICAgICAgICBPYmplY3QucHJvdG90eXBlLFxuICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGVcbiAgICBdO1xuXG4gICAgdmFyIGlzRXhjbHVkZWRQcm90byA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVkUHJvdG90eXBlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGV4Y2x1ZGVkUHJvdG90eXBlc1tpXSA9PT0gdmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBpZiAoZXM1LmlzRVM1KSB7XG4gICAgICAgIHZhciBnZXRLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgICAgIHZhciB2aXNpdGVkS2V5cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgICB3aGlsZSAob2JqICE9IG51bGwgJiYgIWlzRXhjbHVkZWRQcm90byhvYmopKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXM7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAga2V5cyA9IGdldEtleXMob2JqKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZpc2l0ZWRLZXlzW2tleV0pIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB2aXNpdGVkS2V5c1trZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlc2MgIT0gbnVsbCAmJiBkZXNjLmdldCA9PSBudWxsICYmIGRlc2Muc2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2JqID0gZXM1LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIGlmIChpc0V4Y2x1ZGVkUHJvdG8ob2JqKSkgcmV0dXJuIFtdO1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXG4gICAgICAgICAgICAvKmpzaGludCBmb3JpbjpmYWxzZSAqL1xuICAgICAgICAgICAgZW51bWVyYXRpb246IGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZWRQcm90b3R5cGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKGV4Y2x1ZGVkUHJvdG90eXBlc1tpXSwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGVudW1lcmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfTtcbiAgICB9XG5cbn0pKCk7XG5cbnZhciB0aGlzQXNzaWdubWVudFBhdHRlcm4gPSAvdGhpc1xccypcXC5cXHMqXFxTK1xccyo9LztcbmZ1bmN0aW9uIGlzQ2xhc3MoZm4pIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gZXM1Lm5hbWVzKGZuLnByb3RvdHlwZSk7XG5cbiAgICAgICAgICAgIHZhciBoYXNNZXRob2RzID0gZXM1LmlzRVM1ICYmIGtleXMubGVuZ3RoID4gMTtcbiAgICAgICAgICAgIHZhciBoYXNNZXRob2RzT3RoZXJUaGFuQ29uc3RydWN0b3IgPSBrZXlzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAhKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwiY29uc3RydWN0b3JcIik7XG4gICAgICAgICAgICB2YXIgaGFzVGhpc0Fzc2lnbm1lbnRBbmRTdGF0aWNNZXRob2RzID1cbiAgICAgICAgICAgICAgICB0aGlzQXNzaWdubWVudFBhdHRlcm4udGVzdChmbiArIFwiXCIpICYmIGVzNS5uYW1lcyhmbikubGVuZ3RoID4gMDtcblxuICAgICAgICAgICAgaWYgKGhhc01ldGhvZHMgfHwgaGFzTWV0aG9kc090aGVyVGhhbkNvbnN0cnVjdG9yIHx8XG4gICAgICAgICAgICAgICAgaGFzVGhpc0Fzc2lnbm1lbnRBbmRTdGF0aWNNZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9GYXN0UHJvcGVydGllcyhvYmopIHtcbiAgICAvKmpzaGludCAtVzAyNywtVzA1NSwtVzAzMSovXG4gICAgZnVuY3Rpb24gZigpIHt9XG4gICAgZi5wcm90b3R5cGUgPSBvYmo7XG4gICAgdmFyIGwgPSA4O1xuICAgIHdoaWxlIChsLS0pIG5ldyBmKCk7XG4gICAgcmV0dXJuIG9iajtcbiAgICBldmFsKG9iaik7XG59XG5cbnZhciByaWRlbnQgPSAvXlthLXokX11bYS16JF8wLTldKiQvaTtcbmZ1bmN0aW9uIGlzSWRlbnRpZmllcihzdHIpIHtcbiAgICByZXR1cm4gcmlkZW50LnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gZmlsbGVkUmFuZ2UoY291bnQsIHByZWZpeCwgc3VmZml4KSB7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShjb3VudCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgcmV0W2ldID0gcHJlZml4ICsgaSArIHN1ZmZpeDtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gc2FmZVRvU3RyaW5nKG9iaikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBvYmogKyBcIlwiO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFwiW25vIHN0cmluZyByZXByZXNlbnRhdGlvbl1cIjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbihlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AoZSwgXCJpc09wZXJhdGlvbmFsXCIsIHRydWUpO1xuICAgIH1cbiAgICBjYXRjaChpZ25vcmUpIHt9XG59XG5cbmZ1bmN0aW9uIG9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uKGUpIHtcbiAgICBpZiAoZSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuICgoZSBpbnN0YW5jZW9mIEVycm9yW1wiX19CbHVlYmlyZEVycm9yVHlwZXNfX1wiXS5PcGVyYXRpb25hbEVycm9yKSB8fFxuICAgICAgICBlW1wiaXNPcGVyYXRpb25hbFwiXSA9PT0gdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGNhbkF0dGFjaFRyYWNlKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBFcnJvciAmJiBlczUucHJvcGVydHlJc1dyaXRhYmxlKG9iaiwgXCJzdGFja1wiKTtcbn1cblxudmFyIGVuc3VyZUVycm9yT2JqZWN0ID0gKGZ1bmN0aW9uKCkge1xuICAgIGlmICghKFwic3RhY2tcIiBpbiBuZXcgRXJyb3IoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoY2FuQXR0YWNoVHJhY2UodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB0cnkge3Rocm93IG5ldyBFcnJvcihzYWZlVG9TdHJpbmcodmFsdWUpKTt9XG4gICAgICAgICAgICBjYXRjaChlcnIpIHtyZXR1cm4gZXJyO31cbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjYW5BdHRhY2hUcmFjZSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3Ioc2FmZVRvU3RyaW5nKHZhbHVlKSk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuZnVuY3Rpb24gY2xhc3NTdHJpbmcob2JqKSB7XG4gICAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cblxuZnVuY3Rpb24gY29weURlc2NyaXB0b3JzKGZyb20sIHRvLCBmaWx0ZXIpIHtcbiAgICB2YXIga2V5cyA9IGVzNS5uYW1lcyhmcm9tKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChmaWx0ZXIoa2V5KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlczUuZGVmaW5lUHJvcGVydHkodG8sIGtleSwgZXM1LmdldERlc2NyaXB0b3IoZnJvbSwga2V5KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciByZXQgPSB7XG4gICAgaXNDbGFzczogaXNDbGFzcyxcbiAgICBpc0lkZW50aWZpZXI6IGlzSWRlbnRpZmllcixcbiAgICBpbmhlcml0ZWREYXRhS2V5czogaW5oZXJpdGVkRGF0YUtleXMsXG4gICAgZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0OiBnZXREYXRhUHJvcGVydHlPckRlZmF1bHQsXG4gICAgdGhyb3dlcjogdGhyb3dlcixcbiAgICBpc0FycmF5OiBlczUuaXNBcnJheSxcbiAgICBoYXZlR2V0dGVyczogaGF2ZUdldHRlcnMsXG4gICAgbm90RW51bWVyYWJsZVByb3A6IG5vdEVudW1lcmFibGVQcm9wLFxuICAgIGlzUHJpbWl0aXZlOiBpc1ByaW1pdGl2ZSxcbiAgICBpc09iamVjdDogaXNPYmplY3QsXG4gICAgY2FuRXZhbHVhdGU6IGNhbkV2YWx1YXRlLFxuICAgIGVycm9yT2JqOiBlcnJvck9iaixcbiAgICB0cnlDYXRjaDogdHJ5Q2F0Y2gsXG4gICAgaW5oZXJpdHM6IGluaGVyaXRzLFxuICAgIHdpdGhBcHBlbmRlZDogd2l0aEFwcGVuZGVkLFxuICAgIG1heWJlV3JhcEFzRXJyb3I6IG1heWJlV3JhcEFzRXJyb3IsXG4gICAgdG9GYXN0UHJvcGVydGllczogdG9GYXN0UHJvcGVydGllcyxcbiAgICBmaWxsZWRSYW5nZTogZmlsbGVkUmFuZ2UsXG4gICAgdG9TdHJpbmc6IHNhZmVUb1N0cmluZyxcbiAgICBjYW5BdHRhY2hUcmFjZTogY2FuQXR0YWNoVHJhY2UsXG4gICAgZW5zdXJlRXJyb3JPYmplY3Q6IGVuc3VyZUVycm9yT2JqZWN0LFxuICAgIG9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uOiBvcmlnaW5hdGVzRnJvbVJlamVjdGlvbixcbiAgICBtYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb246IG1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbixcbiAgICBjbGFzc1N0cmluZzogY2xhc3NTdHJpbmcsXG4gICAgY29weURlc2NyaXB0b3JzOiBjb3B5RGVzY3JpcHRvcnMsXG4gICAgaGFzRGV2VG9vbHM6IHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lICYmXG4gICAgICAgICAgICAgICAgIHR5cGVvZiBjaHJvbWUubG9hZFRpbWVzID09PSBcImZ1bmN0aW9uXCIsXG4gICAgaXNOb2RlOiB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICBjbGFzc1N0cmluZyhwcm9jZXNzKS50b0xvd2VyQ2FzZSgpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIlxufTtcbnJldC5pc1JlY2VudE5vZGUgPSByZXQuaXNOb2RlICYmIChmdW5jdGlvbigpIHtcbiAgICB2YXIgdmVyc2lvbiA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5zcGxpdChcIi5cIikubWFwKE51bWJlcik7XG4gICAgcmV0dXJuICh2ZXJzaW9uWzBdID09PSAwICYmIHZlcnNpb25bMV0gPiAxMCkgfHwgKHZlcnNpb25bMF0gPiAwKTtcbn0pKCk7XG5cbmlmIChyZXQuaXNOb2RlKSByZXQudG9GYXN0UHJvcGVydGllcyhwcm9jZXNzKTtcblxudHJ5IHt0aHJvdyBuZXcgRXJyb3IoKTsgfSBjYXRjaCAoZSkge3JldC5sYXN0TGluZUVycm9yID0gZTt9XG5tb2R1bGUuZXhwb3J0cyA9IHJldDtcblxufSx7XCIuL2VzNS5qc1wiOjE0fV19LHt9LFs0XSkoNClcbn0pOyAgICAgICAgICAgICAgICAgICAgO2lmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cgIT09IG51bGwpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LlAgPSB3aW5kb3cuUHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYgIT09IG51bGwpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuUCA9IHNlbGYuUHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiJdfQ==
