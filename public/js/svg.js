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
            instance.setAttribute(key, value.toString());
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
},{"../util/object":32,"../util/xml":35}],7:[function(require,module,exports){
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
    if(config.is('events_restricted', false) && !this.excludeEventRestrictions) {
        return false;
    } else {
        return true;
    }
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
    opacity = opacity || 1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LnN2Zy5qcyIsImNsaWVudC9jb3JlL2NhY2hlLmpzIiwiY2xpZW50L2NvcmUvY29uZmlnLmpzIiwiY2xpZW50L2NvcmUvZXZlbnQuanMiLCJjbGllbnQvY29yZS9zdWJFdmVudC5qcyIsImNsaWVudC9kb20vZG9tLmpzIiwiY2xpZW50L2RvbS9kb21FbGVtZW50LmpzIiwiY2xpZW50L2RvbS9ldmVudGFibGVOb2RlLmpzIiwiY2xpZW50L3N2Zy9TVkdFbGVtZW50LmpzIiwiY2xpZW50L3N2Zy9jaXJjbGUuanMiLCJjbGllbnQvc3ZnL2RyYWdnYWJsZS5qcyIsImNsaWVudC9zdmcvZWxlbWVudHMuanMiLCJjbGllbnQvc3ZnL2VsbGlwc2UuanMiLCJjbGllbnQvc3ZnL2dyb3VwLmpzIiwiY2xpZW50L3N2Zy9oZWxwZXIuanMiLCJjbGllbnQvc3ZnL3BhdGguanMiLCJjbGllbnQvc3ZnL3BhdGhEYXRhLmpzIiwiY2xpZW50L3N2Zy9yZWN0LmpzIiwiY2xpZW50L3N2Zy9zdHlsZS5qcyIsImNsaWVudC9zdmcvc3ZnLmpzIiwiY2xpZW50L3N2Zy9zdmdSb290LmpzIiwiY2xpZW50L3N2Zy9zdmdTaGFwZS5qcyIsImNsaWVudC9zdmcvdGV4dC5qcyIsImNsaWVudC9zdmcvdHJhbnNmb3JtLmpzIiwiY2xpZW50L3N2Zy90c3Bhbi5qcyIsImNsaWVudC91aS9qcXVlcnlQbHVnaW5zLmpzIiwiY2xpZW50L3V0aWwvVXRpbC5qcyIsImNsaWVudC91dGlsL2FwcC5qcyIsImNsaWVudC91dGlsL2Jlemllci5qcyIsImNsaWVudC91dGlsL21hdGguanMiLCJjbGllbnQvdXRpbC9vYmplY3QuanMiLCJjbGllbnQvdXRpbC9zdHJpbmcuanMiLCJjbGllbnQvdXRpbC94bWwuanMiLCJub2RlX21vZHVsZXMvYmx1ZWJpcmQvanMvYnJvd3Nlci9ibHVlYmlyZC5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeHZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi91aS9qcXVlcnlQbHVnaW5zJyk7XG5yZXF1aXJlKCcuL3N2Zy9kcmFnZ2FibGUnKTtcblxuaWYoIXdpbmRvdy5kYWxhKSB7XG4gICAgZGFsYSA9IHt9O1xufVxuXG5pZighd2luZG93LmRhbGEuU1ZHKSB7XG4gICAgd2luZG93LmRhbGEuU1ZHID0gcmVxdWlyZSgnLi9zdmcvc3ZnJyk7XG59XG5cbiIsInZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbScpO1xyXG52YXIgc3RyaW5nID0gcmVxdWlyZSgnLi4vdXRpbC9zdHJpbmcnKTtcclxuXHJcbnZhciBDYWNoZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5xdWVyeUNhY2hlID0ge307XHJcbiAgICB0aGlzLnN2Z0NhY2hlID0ge307XHJcbn07XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuY2xlYXJCeVN1ZmZpeCA9IGZ1bmN0aW9uKHN1ZmZpeCkge1xyXG4gICAgZm9yKGtleSBpbiB0aGlzLnF1ZXJ5Q2FjaGUpIHtcclxuICAgICAgICBpZih0aGlzLnF1ZXJ5Q2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBzdHJpbmcuZW5kc1dpdGgoa2V5LCBzdWZmaXgpKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnF1ZXJ5Q2FjaGVba2V5XTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZvcihrZXkgaW4gdGhpcy5zdmdDYWNoZSkge1xyXG4gICAgICAgIGlmKHRoaXMuc3ZnQ2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBzdHJpbmcuZW5kc1dpdGgoa2V5LCBzdWZmaXgpKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN2Z0NhY2hlW2tleV07XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS4kID0gZnVuY3Rpb24ob2JqLCBwcmV2ZW50Q2FjaGUpIHtcclxuICAgIGlmKCFvYmopIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5xdWVyeUNhY2hlW29ial0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUNhY2hlW29ial07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNldHRpbmdzID0gdGhpcy5nZXRDYWNoZVNldHRpbmdzKG9iaiwgdGhpcy5xdWVyeUNhY2hlKTtcclxuICAgIHJldHVybiB0aGlzLmNhY2hlQ2hlY2soc2V0dGluZ3Mua2V5LCBzZXR0aW5ncy4kbm9kZSwgdGhpcy5xdWVyeUNhY2hlLCBwcmV2ZW50Q2FjaGUpO1xyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLnN2ZyA9IGZ1bmN0aW9uKG9iaiwgcHJldmVudENhY2hlKSB7XHJcbiAgICBpZighb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuc3ZnQ2FjaGVbb2JqXSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN2Z0NhY2hlW29ial07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNldHRpbmdzID0gdGhpcy5nZXRDYWNoZVNldHRpbmdzKG9iaiwgdGhpcy5zdmdDYWNoZSk7XHJcbiAgICByZXR1cm4gdGhpcy5jYWNoZUNoZWNrKHNldHRpbmdzLmtleSwgJC5zdmcoc2V0dGluZ3MuJG5vZGUpLCB0aGlzLnN2Z0NhY2hlLCBwcmV2ZW50Q2FjaGUpO1xyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLmdldENhY2hlU2V0dGluZ3MgPSBmdW5jdGlvbihvYmosIGNhY2hlKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSB7fTtcclxuXHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcob2JqKSl7XHJcbiAgICAgICAgc2V0dGluZ3MuJG5vZGUgPSB0aGlzLnF1ZXJ5Q2FjaGVbb2JqXSB8fCAkKG9iaik7XHJcbiAgICAgICAgc2V0dGluZ3Mua2V5ID0gb2JqO1xyXG4gICAgfSBlbHNlIGlmKG9iai5qUXVlcnkpIHtcclxuICAgICAgICBzZXR0aW5ncy4kbm9kZSA9IG9iajtcclxuICAgICAgICBzZXR0aW5ncy5rZXkgPSBkb20uZ2V0SWRTZWxlY3RvcihvYmouYXR0cignaWQnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy4kbm9kZSA9ICQob2JqKTtcclxuICAgICAgICAgICAgc2V0dGluZ3Mua2V5ID0gZG9tLmdldElkU2VsZWN0b3Ioc2V0dGluZ3MuJG5vZGUuYXR0cignaWQnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNldHRpbmdzO1xyXG59XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuY2FjaGVDaGVjayA9IGZ1bmN0aW9uKGtleSwgb2JqLCBjYWNoZSwgcHJldmVudENhY2hlKSB7XHJcbiAgICBwcmV2ZW50Q2FjaGUgPSBwcmV2ZW50Q2FjaGUgfHwgZmFsc2U7XHJcbiAgICBpZihrZXkgJiYgb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICghcHJldmVudENhY2hlKSA/IGNhY2hlW2tleV0gPSBvYmogOiBvYmo7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9XHJcbn1cclxuXHJcbkNhY2hlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihvYmopIHtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhvYmopKSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMucXVlcnlDYWNoZVtvYmpdO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLmV4aXN0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICByZXR1cm4gb2JqZWN0LmlzRGVmaW5lZChxdWVyeUNhY2hbc2VsZWN0b3JdKTtcclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgQ2FjaGUoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IENhY2hlKCk7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcblxyXG52YXIgdmFsdWVzID0ge307XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHZhbCA6IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCkge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0RlZmluZWQoa2V5KSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVzW2tleV07XHJcbiAgICAgICAgICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZChyZXN1bHQpKSA/IHJlc3VsdCA6IGRlZmF1bHRWYWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBpcyA6IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbChrZXksZGVmYXVsdFZhbCkgPT09IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlYnVnIDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzQm9vbGVhbih2YWwpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsKCdkZWJ1ZycsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbCgnZGVidWcnLCBmYWxzZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbCA6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGtleSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFsdWVzW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFsKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXBsYWNlQ29uZmlnVmFsdWVzIDogZnVuY3Rpb24odGV4dCwgY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRleHQ7XHJcbiAgICAgICAgb2JqZWN0LmVhY2goY29uZmlnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKFwie1wiICsga2V5ICsgXCJ9XCIsIFwiZ1wiKTtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UocmVnRXhwLCB2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTsiLCJ2YXIgZXZlbnRzID0ge307XHJcblxyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvcmUvY29uZmlnJyk7XHJcbnZhciBTdWJFdmVudCA9IHJlcXVpcmUoJy4vc3ViRXZlbnQnKTtcclxuXHJcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcclxuXHJcbnZhciBoYXNIYW5kbGVyID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgcmV0dXJuIGV2ZW50c1t0eXBlXTtcclxufTtcclxuXHJcbm1vdXNlID0ge307XHJcblxyXG4kKGRvY3VtZW50KS5vbiggJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIG1vdXNlID0gZTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBtb3VzZSA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtb3VzZTtcclxuICAgIH0sXHJcbiAgICBsaXN0ZW46ICBmdW5jdGlvbih0eXBlLCBoYW5kbGVyLCBtb2R1bGUpIHtcclxuICAgICAgICBpZighb2JqZWN0LmlzRnVuY3Rpb24oaGFuZGxlcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGV2ZW50Q29uZmlnID0ge1xyXG4gICAgICAgICAgICBoYW5kbGVyIDogaGFuZGxlcixcclxuICAgICAgICAgICAgbW9kdWxlIDogbW9kdWxlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYoIWV2ZW50c1t0eXBlXSkge1xyXG4gICAgICAgICAgICBldmVudHNbdHlwZV0gPSBbZXZlbnRDb25maWddO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGV2ZW50c1t0eXBlXS5wdXNoKGV2ZW50Q29uZmlnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHVubGlzdGVuOiBmdW5jdGlvbih0eXBlLCBmdW5jKSB7XHJcbiAgICAgICAgaWYoZXZlbnRzW3R5cGVdKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50c1t0eXBlXS5pbmRleE9mKGZ1bmMpO1xyXG4gICAgICAgICAgICBpZihpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudHNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc3ViOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTdWJFdmVudChjb250ZXh0LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tbWFuZDogZnVuY3Rpb24oY29tbWFuZCwgZXhlY3V0ZSkge1xyXG4gICAgICAgIGlmKGV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21tYW5kX2V4ZWN1dGUnLCBjb21tYW5kKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbW1hbmRfYWRkJywgY29tbWFuZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0cmlnZ2VyOiBmdW5jdGlvbih0eXBlLCBkYXRhLCByb290RXZ0KSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gcm9vdEV2dCB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50LmRhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICBldmVudC50eXBlID0gdHlwZTtcclxuXHJcbiAgICAgICAgICAgIGlmKGhhc0hhbmRsZXIoZXZlbnQudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyQXJyID0gZXZlbnRzW2V2ZW50LnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmVhY2goaGFuZGxlckFyciwgZnVuY3Rpb24oaW5kZXgsIGV2ZW50Q29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBldmVudENvbmZpZy5oYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2R1bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlID0gZXZlbnRDb25maWcubW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihldmVudENvbmZpZy5tb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY2FsbChldmVudENvbmZpZy5tb2R1bGUsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZFRleHQgPSAobW9kdWxlICYmIG1vZHVsZS5jb25zdHJ1Y3RvciAmJiBtb2R1bGUuY29uc3RydWN0b3IubmFtZSk/bW9kdWxlLmNvbnN0cnVjdG9yLm5hbWU6J3Vua25vd24nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihtb2RUZXh0ID09PSAndW5rbm93bicgJiYgY29uZmlnLmRlYnVnKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0V2ZW50IGhhbmRsZXIgZXJyb3IgLSBtb2R1bGU6ICcrbW9kVGV4dCsnIGV2ZW50OiAnK2V2ZW50LnR5cGUsIGhhbmRsZXIsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFdmVudCBoYW5kbGVyIGVycm9yIC0gbW9kdWxlOiAnK21vZFRleHQrJyBldmVudDogJytldmVudC50eXBlLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcignZXJyb3InLCAnQW4gZXJyb3Igb2NjdXJlZCB3aGlsZSBleGVjdXRpbmcgdGhlIGxhc3QgYWN0aW9uICEnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9XZSBqdXN0IHJlc29sdmUgaW4gYWxsIGNhc2VzIHNpbmNlIHRoZSBjYWxsZXIgb2YgdHJpZ2dlciBzaG91bGQgcmVtYWluIGluZGVwZW5kZW50IG9mIGhhbmRsZXIgbW9kdWxlc1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uOiBmdW5jdGlvbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpIHtcclxuICAgICAgICAkKG5vZGUpLm9uKGV2ZW50LHNlbGVjdG9yLGRhdGEsIGhhbmRsZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmY6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcikge1xyXG4gICAgICAgICQobm9kZSkub2ZmKGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uY2U6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgZGF0YSwgaGFuZGxlcikge1xyXG4gICAgICAgICQobm9kZSkub25lKGV2ZW50LHNlbGVjdG9yLGRhdGEsIGhhbmRsZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0cmlnZ2VyRG9tOiBmdW5jdGlvbihub2RlLCBldmVudCkge1xyXG4gICAgICAgJChub2RlKS50cmlnZ2VyKGV2ZW50KTtcclxuICAgIH1cclxufTsiLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxuXHJcbnZhciBTdWJFdmVudCA9IGZ1bmN0aW9uKGNvbnRleHQsIGV2ZW50KSB7XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5ldmVudCA9IGV2ZW50O1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm1vdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ldmVudC5tb3VzZSgpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLmdldFN1YlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0Kyc6Jyt0eXBlO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLmxpc3RlbiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIsIG1vZHVsZSkge1xyXG4gICAgLy9UT0RPOiBpbXBsZW1lbnQgYnViYmxlXHJcbiAgICB0aGlzLmV2ZW50Lmxpc3Rlbih0aGlzLmdldFN1YlR5cGUodHlwZSksIGhhbmRsZXIsIG1vZHVsZSk7XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUudW5saXN0ZW4gPSBmdW5jdGlvbih0eXBlLCBmdW5jKSB7XHJcbiAgICB0aGlzLmV2ZW50LnVubGlzdGVuKHRoaXMuZ2V0U3ViVHlwZSh0eXBlKSwgZnVuYyk7XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKHR5cGUsIGRhdGEsIHJvb3RFdnQsIHByZXZlbnRCdWJibGUpIHtcclxuICAgIHRoaXMuZXZlbnQudHJpZ2dlcih0aGlzLmdldFN1YlR5cGUodHlwZSksIGRhdGEsIHJvb3RFdnQpO1xyXG4gICAgaWYoIXByZXZlbnRCdWJibGUpIHtcclxuICAgICAgICB0aGlzLmV2ZW50LnRyaWdnZXIodHlwZSwgZGF0YSwgcm9vdEV2dCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUuY29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQsIGV4ZWN1dGUpIHtcclxuICAgIHRoaXMuZXZlbnQuY29tbWFuZChjb21tYW5kLCBleGVjdXRlKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgZGF0YSwgaGFuZGxlcikge1xyXG4gICAgdGhpcy5ldmVudC5vbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgaGFuZGxlcikge1xyXG4gICAgdGhpcy5ldmVudC5vZmYobm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBoYW5kbGVyKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24obm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKSB7XHJcbiAgICB0aGlzLmV2ZW50Lm9uY2Uobm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS50cmlnZ2VyRG9tID0gZnVuY3Rpb24obm9kZSwgZXZlbnQpIHtcclxuICAgIHRoaXMuZXZlbnQudHJpZ2dlckRvbShub2RlLGV2ZW50KTtcclxufVxyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgIHJldHVybiBuZXcgU3ViRXZlbnQoY29udGV4dCwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3ViRXZlbnQ7IiwidmFyIHhtbCA9IHJlcXVpcmUoJy4uL3V0aWwveG1sJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG5cclxudmFyIGVsZW1lbnRDYWNoZSA9IHt9O1xyXG5cclxudmFyIGNyZWF0ZSA9IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJpYnV0ZXMsIHRleHQpIHtcclxuICAgIHZhciAkZWxlbWVudCA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50KSk7XHJcblxyXG4gICAgaWYoYXR0cmlidXRlcykge1xyXG4gICAgICAgICQuZWFjaChhdHRyaWJ1dGVzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAkZWxlbWVudC5hdHRyKGtleSwgdmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHRleHQpIHtcclxuICAgICAgICAkZWxlbWVudC50ZXh0KHRleHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICRlbGVtZW50O1xyXG59O1xyXG5cclxudmFyIHF1ZXJ5ID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNhY2hlKSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoY2FjaGUpIHtcclxuICAgICAgICByZXN1bHQgPSAkLnFDYWNoZShzZWxlY3Rvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9ICQoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBnZXRKUXVlcnlOb2RlID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgaWYoIW5vZGUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyBUaGUgbm9kZSBpcyBlaXRoZXIgYSBkb20gbm9kZSBvciBhIHNlbGVjdG9yXHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcobm9kZSkpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnkobm9kZSk7XHJcbiAgICB9IGVsc2UgaWYobm9kZS5nZXRBdHRyaWJ1dGUpe1xyXG4gICAgICAgIHZhciBpZCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgIGlmKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLnFDYWNoZSgnIycrbm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJyksIHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKG5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZihub2RlLmpRdWVyeSkge1xyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBlLmcuIGRvY3VtZW50LCB3aW5kb3cuLi5cclxuICAgICAgICByZXR1cm4gJChub2RlKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBtb3ZlRG93biA9IGZ1bmN0aW9uKG5vZGUsIHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJG5vZGUgPSBnZXRKUXVlcnlOb2RlKG5vZGUpO1xyXG4gICAgJG5vZGUuYmVmb3JlKCRub2RlLm5leHQoc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbnZhciBtb3ZlVXAgPSBmdW5jdGlvbihub2RlLCBzZWxlY3Rvcikge1xyXG4gICAgdmFyICRub2RlID0gZ2V0SlF1ZXJ5Tm9kZShub2RlKTtcclxuICAgICRub2RlLmFmdGVyKCRub2RlLnByZXYoc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbnZhciBpbnNlcnRBZnRlckluZGV4ID0gZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIHZhciAkbm9kZSA9IGdldEpRdWVyeU5vZGUobm9kZSk7XHJcbiAgICAkbm9kZS5wYXJlbnQoKS5jaGlsZHJlbigpLmVxKGluZGV4KS5hZnRlcigkbm9kZSk7XHJcbn07XHJcblxyXG52YXIgaW5zZXJ0U1ZHQWZ0ZXIgPSBmdW5jdGlvbihjb250YWluZXIsIGVsZW1lbnQsIHRleHQsIGluc2VydEFmdGVyKSB7XHJcbiAgICB0ZXh0ID0gdGV4dCB8fCBlbGVtZW50LnRleHQ7XHJcbiAgICBkZWxldGUgZWxlbWVudC50ZXh0O1xyXG4gICAgcmV0dXJuIGFkZFNWR0VsZW1lbnQoY29udGFpbmVyLGVsZW1lbnQsdGV4dCxpbnNlcnRBZnRlcik7XHJcbn07XHJcblxyXG52YXIgcHJlcGVuZFNWR0VsZW1lbnQgPSBmdW5jdGlvbihjb250YWluZXIsIGVsZW1lbnQsIHRleHQpIHtcclxuICAgIHRleHQgPSB0ZXh0IHx8IGVsZW1lbnQudGV4dDtcclxuICAgIGRlbGV0ZSBlbGVtZW50LnRleHQ7XHJcbiAgICByZXR1cm4gYWRkU1ZHRWxlbWVudChjb250YWluZXIsZWxlbWVudCx0cnVlLHRleHQpO1xyXG59O1xyXG5cclxudmFyIGFwcGVuZFNWR0VsZW1lbnQgPSBmdW5jdGlvbihjb250YWluZXIsIGVsZW1lbnQsIHRleHQpIHtcclxuICAgIHRleHQgPSB0ZXh0IHx8IGVsZW1lbnQudGV4dDtcclxuICAgIGRlbGV0ZSBlbGVtZW50LnRleHQ7XHJcbiAgICByZXR1cm4gYWRkU1ZHRWxlbWVudChjb250YWluZXIsZWxlbWVudCxmYWxzZSx0ZXh0KTtcclxufTtcclxuXHJcbnZhciBwcmVwZW5kVG9Sb290ID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgaWYoIWVsZW1lbnQucm9vdC5oYXNDaGlsZE5vZGVzKCkpIHtcclxuICAgICAgICBlbGVtZW50Lmluc3RhbmNlKGVsZW1lbnQucm9vdC5hcHBlbmRDaGlsZChlbGVtZW50Lmluc3RhbmNlKCkpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbWVudC5pbnN0YW5jZShlbGVtZW50LnJvb3QuaW5zZXJ0QmVmb3JlKGVsZW1lbnQuaW5zdGFuY2UoKSwgZWxlbWVudC5yb290LmNoaWxkTm9kZXNbMF0pKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBhZGRTVkdFbGVtZW50ID0gZnVuY3Rpb24oY29udGFpbmVyLCBlbGVtZW50LCBwcmVwZW5kLCB0ZXh0LCBpbnNlcnRBZnRlcikge1xyXG4gICAgcHJlcGVuZCA9IChvYmplY3QuaXNEZWZpbmVkKHByZXBlbmQpKT8gcHJlcGVuZCA6IGZhbHNlO1xyXG4gICAgLy8gSWYgb25seSB0aGUgY29udGFpbmVyIGlzIGdpdmVuIHdlIGFzc3VtZSBpdHMgYW4gU1ZHRWxlbWVudCBvYmplY3Qgd2l0aCBjb250YWluZWQgcm9vdCBub2RlXHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKGNvbnRhaW5lcikgJiYgIW9iamVjdC5pc0RlZmluZWQoZWxlbWVudCkpIHtcclxuICAgICAgICBlbGVtZW50ID0gY29udGFpbmVyO1xyXG4gICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5nZXRSb290Tm9kZSgpO1xyXG4gICAgfSBlbHNlIGlmKG9iamVjdC5pc1N0cmluZyhjb250YWluZXIpKSB7XHJcbiAgICAgICAgY29udGFpbmVyID0gcXVlcnkoY29udGFpbmVyKVswXTtcclxuICAgIH0gZWxzZSBpZihjb250YWluZXIuaW5zdGFuY2UpIHtcclxuICAgICAgICBjb250YWluZXIgPSBjb250YWluZXIuaW5zdGFuY2UoKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaW5zdGFuY2U7XHJcblxyXG4gICAgaWYoIWVsZW1lbnQuaW5zdGFuY2UgfHwgIW9iamVjdC5pc0RlZmluZWQoZWxlbWVudC5pbnN0YW5jZSgpKSkge1xyXG4gICAgICAgIGluc3RhbmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgZWxlbWVudC50YWdOYW1lKTtcclxuICAgICAgICAkLmVhY2goZWxlbWVudC5hdHRyaWJ1dGVzLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpbnN0YW5jZSA9IGVsZW1lbnQuaW5zdGFuY2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHRleHQpKSB7XHJcbiAgICAgICAgdmFyIHR4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcclxuICAgICAgICBpbnN0YW5jZS5hcHBlbmRDaGlsZCh0eHROb2RlKTtcclxuICAgIH1cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQoaW5zZXJ0QWZ0ZXIpKSB7XHJcbiAgICAgICAgLy9pZiB0aGUgcGFyZW50cyBsYXN0Y2hpbGQgaXMgdGhlIHRhcmdldEVsZW1lbnQuLi5cclxuICAgICAgICBpZihjb250YWluZXIubGFzdGNoaWxkID09IGluc2VydEFmdGVyKSB7XHJcbiAgICAgICAgICAgIC8vYWRkIHRoZSBuZXdFbGVtZW50IGFmdGVyIHRoZSB0YXJnZXQgZWxlbWVudC5cclxuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGluc3RhbmNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBlbHNlIHRoZSB0YXJnZXQgaGFzIHNpYmxpbmdzLCBpbnNlcnQgdGhlIG5ldyBlbGVtZW50IGJldHdlZW4gdGhlIHRhcmdldCBhbmQgaXQncyBuZXh0IHNpYmxpbmcuXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoaW5zdGFuY2UsIGluc2VydEFmdGVyLm5leHRTaWJsaW5nKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYoIXByZXBlbmQgfHwgIWNvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkgKSB7XHJcbiAgICAgICAgaW5zdGFuY2UgPSBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5zdGFuY2UpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpbnN0YW5jZSA9IGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoaW5zdGFuY2UsY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKG9iamVjdC5pc0Z1bmN0aW9uKGVsZW1lbnQuaW5zdGFuY2UpKSB7XHJcbiAgICAgICAgZWxlbWVudC5pbnN0YW5jZShpbnN0YW5jZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW1lbnQuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlbWVudDtcclxufTtcclxuXHJcbnZhciBpbXBvcnRTVkcgPSBmdW5jdGlvbihjb250YWluZXIsIHN2Z1hNTCwgcHJlcGVuZCkge1xyXG4gICAgdmFyICRzdmdYTUwsIG5hbWUsIGF0dHJpYnV0ZXM7XHJcblxyXG4gICAgaWYoc3ZnWE1MLmpxdWVyeSkge1xyXG4gICAgICAgICRzdmdYTUwgPSBzdmdYTUw7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKHN2Z1hNTCkpIHtcclxuICAgICAgICAkc3ZnWE1MID0gJChwYXJzZVhNTChzdmdYTUwudHJpbSgpKSk7XHJcbiAgICAgICAgJHN2Z1hNTCA9ICQoJHN2Z1hNTC5nZXQoMCkuZG9jdW1lbnRFbGVtZW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgJHN2Z1hNTCA9ICQoc3ZnWE1MKTtcclxuICAgIH1cclxuXHJcbiAgICBpZigkc3ZnWE1MLm5vZGVOYW1lKSB7XHJcbiAgICAgICAgbmFtZSA9ICRzdmdYTUwubm9kZU5hbWU7XHJcbiAgICAgICAgYXR0cmlidXRlcyA9IGdldEF0dHJpYnV0ZXMoJHN2Z1hNTCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5hbWUgPSAkc3ZnWE1MLmdldCgwKS50YWdOYW1lO1xyXG4gICAgICAgIGF0dHJpYnV0ZXMgPSBnZXRBdHRyaWJ1dGVzKCRzdmdYTUwuZ2V0KDApKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1dlIGNyZWF0ZSBhIGR1bW15IGVsZW1lbnQgb2JqZWN0XHJcbiAgICB2YXIgZWxlbWVudCA9IHtcclxuICAgICAgICB0YWdOYW1lIDogbmFtZSxcclxuICAgICAgICBhdHRyaWJ1dGVzIDogYXR0cmlidXRlcyxcclxuICAgICAgICBpbnN0YW5jZSA6IGZ1bmN0aW9uKGluc3QpIHtcclxuICAgICAgICAgICAgaWYob2JqZWN0LmlzRGVmaW5lZChpbnN0KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZUVsZW1lbnQgPSBpbnN0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VFbGVtZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpZighcHJlcGVuZCkge1xyXG4gICAgICAgIGFwcGVuZFNWR0VsZW1lbnQoY29udGFpbmVyLCBlbGVtZW50LCBfZ2V0Q2hpbGRUZXh0KCRzdmdYTUwpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJlcGVuZFNWR0VsZW1lbnQoY29udGFpbmVyLCBlbGVtZW50LCBfZ2V0Q2hpbGRUZXh0KCRzdmdYTUwpKTtcclxuICAgIH1cclxuXHJcbiAgICAkc3ZnWE1MLmNoaWxkcmVuKCkuZWFjaChmdW5jdGlvbihpbmRleCwgY2hpbGQpIHtcclxuICAgICAgICBpbXBvcnRTVkcoZWxlbWVudC5pbnN0YW5jZSgpLCBjaGlsZCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZWxlbWVudC5pbnN0YW5jZSgpO1xyXG59O1xyXG5cclxudmFyIF9nZXRDaGlsZFRleHQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICBpZighbm9kZS5qcXVlcnkpIHtcclxuICAgICAgICBub2RlID0gJChub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY2hpbGRUZXh0ID0gbm9kZS5jb250ZW50cygpLmZpbHRlcihmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVUeXBlID09PSAzO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChjaGlsZFRleHQpICYmIGNoaWxkVGV4dC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGNoaWxkVGV4dFswXS5ub2RlVmFsdWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgICQobm9kZS5hdHRyaWJ1dGVzKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJlc3VsdFt0aGlzLm5vZGVOYW1lXSA9IHRoaXMudmFsdWU7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgZmluZEluY2x1ZGVTZWxmID0gZnVuY3Rpb24obm9kZSwgc2VsZWN0b3IpIHtcclxuICAgIHJldHVybiAkKG5vZGUpLmZpbmQoc2VsZWN0b3IpLmFuZFNlbGYoKS5maWx0ZXIoc2VsZWN0b3IpLmdldCgwKTtcclxufTtcclxuXHJcbnZhciBwYXJzZU5vZGVYTUwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICBpZighbm9kZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHJldHVybiAkLnBhcnNlWE1MKCQobm9kZSkudGV4dCgpKTtcclxufTtcclxuXHJcbnZhciBwYXJzZVhNTCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIHhtbC5wYXJzZVhNTChzdHIpO1xyXG59O1xyXG5cclxudmFyIHBhcnNlTm9kZUpTT04gPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICByZXR1cm4gJC5wYXJzZUpTT04oJChub2RlKS50ZXh0KCkpO1xyXG59O1xyXG5cclxudmFyIGdldFJhd0lkID0gZnVuY3Rpb24oaWRTZWxlY3Rvcikge1xyXG4gICAgaWYoIW9iamVjdC5pc1N0cmluZyhpZFNlbGVjdG9yKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZihpZFNlbGVjdG9yLmNoYXJBdCgwKSA9PT0gJyMnKSB7XHJcbiAgICAgICAgcmV0dXJuIGlkU2VsZWN0b3Iuc3Vic3RyaW5nKDEsIGlkU2VsZWN0b3IubGVuZ3RoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGlkU2VsZWN0b3I7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0SWRTZWxlY3RvciA9IGZ1bmN0aW9uKHJhd0lkKSB7XHJcbiAgICBpZighb2JqZWN0LmlzU3RyaW5nKHJhd0lkKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmF3SWQuY2hhckF0KDApICE9PSAnIycpIHtcclxuICAgICAgICByZXR1cm4gJyMnICsgcmF3SWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiByYXdJZDtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYXBwZW5kU1ZHRWxlbWVudCA6IGFwcGVuZFNWR0VsZW1lbnQsXHJcbiAgICBwcmVwZW5kU1ZHRWxlbWVudCA6IHByZXBlbmRTVkdFbGVtZW50LFxyXG4gICAgaW5zZXJ0U1ZHQWZ0ZXIgOiBpbnNlcnRTVkdBZnRlcixcclxuICAgIGluc2VydEFmdGVySW5kZXggOiBpbnNlcnRBZnRlckluZGV4LFxyXG4gICAgY3JlYXRlIDogY3JlYXRlLFxyXG4gICAgcHJlcGVuZFRvUm9vdCA6IHByZXBlbmRUb1Jvb3QsXHJcbiAgICBpbXBvcnRTVkcgOiBpbXBvcnRTVkcsXHJcbiAgICBtb3ZlRG93biA6IG1vdmVEb3duLFxyXG4gICAgbW92ZVVwIDogbW92ZVVwLFxyXG4gICAgZmluZEluY2x1ZGVTZWxmIDogZmluZEluY2x1ZGVTZWxmLFxyXG4gICAgcGFyc2VOb2RlWE1MIDogcGFyc2VOb2RlWE1MLFxyXG4gICAgcGFyc2VOb2RlSlNPTiA6IHBhcnNlTm9kZUpTT04sXHJcbiAgICBnZXRBdHRyaWJ1dGVzIDogZ2V0QXR0cmlidXRlcyxcclxuICAgIGdldFJhd0lkIDogZ2V0UmF3SWQsXHJcbiAgICBnZXRJZFNlbGVjdG9yOiBnZXRJZFNlbGVjdG9yXHJcbn07IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcblxyXG52YXIgRXZlbnRhYmxlID0gcmVxdWlyZSgnLi9ldmVudGFibGVOb2RlJyk7XHJcblxyXG52YXIgRWxlbWVudCA9IGZ1bmN0aW9uKHRhZ05hbWUsIGNmZywgYXR0cmlidXRlU2V0dGVyKSB7XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IGF0dHJpYnV0ZVNldHRlciB8fCB7fTtcclxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xyXG5cclxuICAgIGlmKG9iamVjdC5pc09iamVjdCh0YWdOYW1lKSkge1xyXG4gICAgICAgIGNmZyA9IHRhZ05hbWU7XHJcbiAgICAgICAgdGFnTmFtZSA9IGNmZy50YWdOYW1lO1xyXG4gICAgICAgIGRlbGV0ZSBjZmcudGFnTmFtZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xyXG5cclxuICAgIGlmKG9iamVjdC5pc09iamVjdChjZmcpKSB7XHJcbiAgICAgICAgaWYoY2ZnLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjZmcuY2hpbGRyZW47XHJcbiAgICAgICAgICAgIGRlbGV0ZSBjZmcuY2hpbGRyZW47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNpbmdsZSA9IGNmZy5zaW5nbGUgfHwgZmFsc2U7XHJcbiAgICAgICAgZGVsZXRlIGNmZy5zaW5nbGU7XHJcblxyXG4gICAgICAgIC8vV2UgYXNzdW1lIGFsbCByZW1haW5pbmcgY2ZnIGVudHJpZXMgYXJlIGF0dHJpYnV0ZXNcclxuICAgICAgICBmb3IodmFyIGF0dHJpYnV0ZUtleSBpbiBjZmcpIHtcclxuICAgICAgICAgICAgaWYoY2ZnLmhhc093blByb3BlcnR5KGF0dHJpYnV0ZUtleSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZShhdHRyaWJ1dGVLZXksIGNmZ1thdHRyaWJ1dGVLZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1NlZSBldmVudGFibGVcclxuICAgIHRoaXMuZXZlbnRCYXNlID0gdGhpcztcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoRWxlbWVudCwgRXZlbnRhYmxlKTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLmluc3RhbmNlID0gZnVuY3Rpb24oaW5zdGFuY2UpIHtcclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQoaW5zdGFuY2UpKSB7XHJcbiAgICAgICAgdGhpcy5kb21JbnN0YW5jZSA9IGluc3RhbmNlO1xyXG4gICAgICAgIHRoaXMudGFnTmFtZSA9IGluc3RhbmNlLnRhZ05hbWU7XHJcbiAgICAgICAgdGhpcy5sb2FkQXR0cmlidXRlcyhpbnN0YW5jZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRvbUluc3RhbmNlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIGFsbCBhdHRyaWJ1dGVzIGZyb20gdGhlIGRvbSBpbnN0YW5jZSBpbnRvIG91ciBhdHRyaWJ1dGUgYXJyYXkgZXhjZXB0IGFscmVhZHkgZXhpc3RpbmcgYXR0cmlidXRlcy5cclxuICogQHBhcmFtIGluc3RhbmNlXHJcbiAqL1xyXG5FbGVtZW50LnByb3RvdHlwZS5sb2FkQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGluc3RhbmNlKSB7XHJcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB0aGlzLmF0dHJpYnV0ZXMgfHwge307XHJcbiAgICB2YXIgYXR0cmlidXRlcyA9IGRvbS5nZXRBdHRyaWJ1dGVzKGluc3RhbmNlKTtcclxuICAgIGZvcih2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICBpZihhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGtleSkgJiYgIXRoaXMuYXR0cmlidXRlc1trZXldKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuaWQgPSBmdW5jdGlvbihuZXdJZCkge1xyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKG5ld0lkKSkge1xyXG4gICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZSgnaWQnLG5ld0lkKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cignaWQnKTtcclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZm9yKGF0dHJpYnV0ZUtleSBpbiB0aGlzLmF0dHJpYnV0ZVNldHRlcikge1xyXG4gICAgICAgIGlmKHRoaXMuYXR0cmlidXRlU2V0dGVyLmhhc093blByb3BlcnR5KGF0dHJpYnV0ZUtleSkpIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoYXR0cmlidXRlS2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGVtZW50LnByb3RvdHlwZS51cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgIHRoaXMuX3NldEF0dHJpYnV0ZShrZXksIHRoaXMuYXR0cmlidXRlc1trZXldKTtcclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLl9zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihrZXksIHZhbHVlLCBwcmV2RG9tU2V0KSB7XHJcbiAgICAvLyBJZiBmaXJzdCBhcmcgaXMgb2JqZWN0IGhhbmRsZSBpdHMgcHJvcGVydGllcyBhcyBhdHRyaWJ1dGVzXHJcbiAgICBpZihvYmplY3QuaXNPYmplY3Qoa2V5KSkge1xyXG4gICAgICAgIGZvcih2YXIgYXR0cmlidXRlIGluIGtleSkge1xyXG4gICAgICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGF0dHJpYnV0ZSkgJiYga2V5Lmhhc093blByb3BlcnR5KGF0dHJpYnV0ZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIGtleVthdHRyaWJ1dGVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIFNvbWUgZWxlbWVudHR5cGVzIGNhbiB0cmFuc2Zvcm0gc3BlY2lmaWMgdHlwZXMgb2YgYXR0cmlidXRlcyB0byBzcGVjaWFsIG9iamVjdHNcclxuICAgICAgICAvLyB3aGljaCBhcmUgYWJsZSB0byByZW5kZXIgYW5kIHNldCB0aGUgdmFsdWVzIGluIGEgc3BlY2lhbCB3YXkuXHJcbiAgICAgICAgaWYoIXRoaXMuaGFzQ2xhc3MoJ25vUGFyc2UnKSAmJiBvYmplY3QuaXNTdHJpbmcodmFsdWUpICYmIG9iamVjdC5pc0RlZmluZWQodGhpcy5hdHRyaWJ1dGVTZXR0ZXJba2V5XSkpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmF0dHJpYnV0ZVNldHRlcltrZXldKHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSnVzdCB0cmFuc2Zvcm0gc3RyaW5nbGl0cyB2YWx1ZXMgdG8gYXJyYXlzIGluIGNhc2UgaXRzIGEgc3RyaW5nIGxpc3RcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXNba2V5XSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAvLyBEaXJlY3RseSBzZXQgaXQgdG8gdGhlIFNWRyBpbnN0YW5jZSBpZiBhbHJlYWR5IHJlbmRlcmVkXHJcbiAgICAgICAgaWYodGhpcy5kb21JbnN0YW5jZSAmJiAhcHJldkRvbVNldCkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gRWxlbWVudC5nZXRBdHRyaWJ1dGVTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRvbUluc3RhbmNlLnNldEF0dHJpYnV0ZShrZXksdmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGVtZW50LnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKHNlYXJjaENsYXNzKSB7XHJcbiAgICBpZih0aGlzLmRvbUluc3RhbmNlKSB7XHJcbiAgICAgICAgLy9KcXVlcnkgaGFzY2xhc3MgZG9lcyBub3Qgd29yayB3aXRoIHN2ZyBlbGVtZW50c1xyXG4gICAgICAgIHZhciBlbGVtZW50Q2xhc3MgPSAnICcrIHRoaXMuYXR0cignY2xhc3MnKSsnICc7XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRDbGFzcy5pbmRleE9mKCcgJytzZWFyY2hDbGFzcysnICcpID4gLTE7XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGVtZW50LnByb3RvdHlwZS4kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIGlmKCF0aGlzLiRkb21JbnN0YW5jZSAmJiB0aGlzLmRvbUluc3RhbmNlKSB7XHJcbiAgICAgICAgdGhpcy4kZG9tSW5zdGFuY2UgPSAkKHRoaXMuZG9tSW5zdGFuY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoc2VsZWN0b3IpID8gdGhpcy4kZG9tSW5zdGFuY2UuZmluZChzZWxlY3RvcikgOiB0aGlzLiRkb21JbnN0YW5jZTtcclxufTtcclxuXHJcbkVsZW1lbnQuZ2V0QXR0cmlidXRlU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciByZXN1bHQgPSAnJztcclxuXHJcbiAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYob2JqZWN0LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSAoKytpbmRleCA9PT0gdmFsdWUubGVuZ3RoKSA/IHBhcnQgOiBwYXJ0KycgJztcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5FbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlRnJvbVN0cmluZ0xpc3QgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKHZhbHVlKSAmJiB2YWx1ZS5pbmRleE9mKCcgJykgPiAtMSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS5zcGxpdCgvW1xcc10rLyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLmF0dHJOdW1iZXIgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICB2YXIgdmFsID0gdXRpbC5hcHAucGFyc2VOdW1iZXJTdHJpbmcodGhpcy5hdHRyKGtleSwgdmFsdWUpKTtcclxuICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpID8gdGhpcyA6IHZhbDtcclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLnBvaW50ZXJFdmVudHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigncG9pbnRlci1ldmVudHMnLCB2YWx1ZSk7XHJcbn07XHJcbkVsZW1lbnQucHJvdG90eXBlLmF0dHIgPSBmdW5jdGlvbihhdHRyaWJ1dGUpIHtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIG9iamVjdC5pc0RlZmluZWQoYXJndW1lbnRzWzFdKSkge1xyXG4gICAgICAgIC8vVE9ETzogaW1wbGVtZW50IGZvciBtb3IgdGhhbnQgMlxyXG4gICAgICAgIHZhciBvYmogPSB7fTtcclxuICAgICAgICBvYmpbYXJndW1lbnRzWzBdXSA9IGFyZ3VtZW50c1sxXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyKG9iaik7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGF0dHJpYnV0ZSkpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV07XHJcbiAgICAgICAgaWYoIXJlc3VsdCAmJiB0aGlzLmluc3RhbmNlKCkpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSAgdGhpcy4kKCkuYXR0cihhdHRyaWJ1dGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLl9zZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAgRWxlbWVudDtcclxuIiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb3JlL2NvbmZpZycpO1xyXG5cclxudmFyIEV2ZW50YWJsZSA9IGZ1bmN0aW9uKGV2ZW50QmFzZSkge1xyXG4gICAgdGhpcy5ldmVudEJhc2UgPSBldmVudEJhc2U7XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbihmdW5jLCBhcmdzLCBwcmV2RG9tRXZlbnQpIHtcclxuICAgIGFyZ3MgPSBhcmdzIHx8IHRoaXM7XHJcbiAgICB0aGlzLmV4ZWN1dGVBZGRpdGlvbihmdW5jLCBhcmdzKTtcclxuICAgIGlmKHRoaXMuZXhlY3V0ZVRlbXBsYXRlSG9vaykge1xyXG4gICAgICAgIHRoaXMuZXhlY3V0ZVRlbXBsYXRlSG9vayhmdW5jLCBhcmdzKTtcclxuICAgIH1cclxuICAgIGlmKHRoaXMuZXZlbnRCYXNlICYmICFwcmV2RG9tRXZlbnQpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoZnVuYywgYXJncyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLmV4ZWN1dGVBZGRpdGlvbiA9IGZ1bmN0aW9uKGZ1bmMsIGFyZ3MpIHtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuYWRkaXRpb25zLCBmdW5jdGlvbihrZXksIGFkZGl0aW9uKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzRGVmaW5lZChhZGRpdGlvbikgJiYgb2JqZWN0LmlzRnVuY3Rpb24oYWRkaXRpb25bZnVuY10pKSB7XHJcbiAgICAgICAgICAgIGFkZGl0aW9uW2Z1bmNdLmFwcGx5KGFkZGl0aW9uLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUub25lID0gZnVuY3Rpb24oZXZ0LCBoYW5kbGVyKSB7XHJcbiAgICBpZighdGhpcy5ldmVudEJhc2UpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50QmFzZS4kKCkub25lKGV2dCwgdGhpcy53cmFwKGV2dCwgaGFuZGxlcikpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZ0LCBoYW5kbGVyKSB7XHJcbiAgICBpZighdGhpcy5ldmVudEJhc2UpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50QmFzZS4kKCkub24oZXZ0LCB0aGlzLndyYXAoZXZ0LCBoYW5kbGVyKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgaGFuZGxlcikge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmKHRoYXQuaXNFeGVjdXRpb25BbGxvd2VkKGV2ZW50VHlwZSkpIHtcclxuICAgICAgICAgICAgaGFuZGxlci5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS5pc0V4ZWN1dGlvbkFsbG93ZWQgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcclxuICAgIGlmKGNvbmZpZy5pcygnZXZlbnRzX3Jlc3RyaWN0ZWQnLCBmYWxzZSkgJiYgIXRoaXMuZXhjbHVkZUV2ZW50UmVzdHJpY3Rpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKGV2dCwgYXJncykge1xyXG4gICAgaWYoIXRoaXMuZXZlbnRCYXNlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudEJhc2UuJCgpLnRyaWdnZXIoZXZ0LCBhcmdzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vZmYoZXZ0LCBoYW5kbGVyKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRXZlbnRhYmxlOyIsInZhciBEb21FbGVtZW50ID0gcmVxdWlyZSgnLi4vZG9tL2RvbUVsZW1lbnQnKTtcclxudmFyIFN0eWxlID0gcmVxdWlyZSgnLi9zdHlsZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxuXHJcbi8qXHJcbiAqIENvbnN0cnVjdG9yIGZvciBTVkcgRWxlbWVudHNcclxuICpcclxuICogQHBhcmFtIHt0eXBlfSBuYW1lIHRoZSBlbGVtZW50IE5hbWUgZS5nLiByZWN0LCBjaXJjbGUsIHBhdGguLi5cclxuICogQHBhcmFtIHt0eXBlfSBjZmcgYXR0cmlidXRlcyBhbmQgYWRkaXRpb25hbCBjb25maWd1cmF0aW9uc1xyXG4gKiBAcGFyYW0ge3R5cGV9IGF0dHJpYnV0ZVNldHRlciB5b3UgY2FuIGFkZCBhZGRpdGlvbmFsIGF0dHJpYnV0ZSBzZXR0ZXJcclxuICogZm9yIHNwZWNpYWwgYXR0cmlidXRlcyBkZWZhdWx0IGF0dHJpYnV0ZSBzZXR0ZXIgZ2l2ZW4gYnkgdGhpcyBpbXBlbGVtZW50YXRpb25cclxuICogYXJlIHRyYW5zZm9ybSBhbmQgc3R5bGUgc2V0dGVyXHJcbiAqL1xyXG52YXIgU1ZHRWxlbWVudCA9IGZ1bmN0aW9uKG5hbWUsIHN2ZywgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyID0gYXR0cmlidXRlU2V0dGVyIHx8IHt9O1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIuc3R5bGUgPSB0aGlzLnN0eWxlQXR0cmlidXRlU2V0dGVyO1xyXG4gICAgdGhpcy5TVkdFbGVtZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBJZiBmaXJzdCBhdHRyaWJ1dGUgaXMgbm90IGEgc3RyaW5nIHdlIGFzc3VtZSBhIHN2ZyBub2RlIGNvbnN0cnVjdG9yIGNhbGwuXHJcbiAgICBpZighb2JqZWN0LmlzU3RyaW5nKG5hbWUpKSB7XHJcbiAgICAgICAgdGhpcy5pbnN0YW5jZShuYW1lKTtcclxuICAgICAgICBjZmcgPSBkb20uZ2V0QXR0cmlidXRlcyhuYW1lKTtcclxuICAgICAgICBuYW1lID0gbmFtZS50YWdOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ZnID0gc3ZnO1xyXG4gICAgdGhpcy5yb290ID0gc3ZnLnJvb3QgfHwgdGhpcztcclxuICAgIERvbUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lLCBjZmcsIHRoaXMuYXR0cmlidXRlU2V0dGVyKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHRWxlbWVudCwgRG9tRWxlbWVudCk7XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5zdHlsZUF0dHJpYnV0ZVNldHRlciA9IGZ1bmN0aW9uKHRybmFzZm9ybWF0aW9uU3RyaW5nKSB7XHJcbiAgICByZXR1cm4gbmV3IFN0eWxlKHRybmFzZm9ybWF0aW9uU3RyaW5nKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290Lmluc3RhbmNlKCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5nZXRTVkdSb290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oaW5kZXgsIHZhbCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0aGF0LmFwcGVuZCh2YWwpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXN1bHQgPSAgdXRpbC5kb20uYXBwZW5kU1ZHRWxlbWVudCh0aGlzLmluc3RhbmNlKCksIGVsZW1lbnQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgb2JqZWN0LmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRoYXQucHJlcGVuZCh2YWwpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXN1bHQgPSAgdXRpbC5kb20ucHJlcGVuZFNWR0VsZW1lbnQodGhpcy5pbnN0YW5jZSgpLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy4kKCkucmVtb3ZlKCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLnN2Zy5nZXQodGhpcy4kKCkuZmluZChzZWxlY3RvcikpO1xyXG4gICAgcmV0dXJuIHV0aWwub2JqZWN0LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdCA6IFtyZXN1bHRdO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZmlyc3RDaGlsZCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICByZXR1cm4gJC5zdmcodGhpcy4kKCkuY2hpbGRyZW4oc2VsZWN0b3IpLmZpcnN0KCkpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuY2hpbGRyZW4gPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuICQuc3ZnKHRoaXMuJCgpLmNoaWxkcmVuKHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5wYXJlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLnN2Zyh0aGlzLiQoKS5wYXJlbnQoKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5tb3ZlRG93biA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJG5vZGUgPSB0aGlzLiQoKTtcclxuICAgICRub2RlLnByZXZBbGwoc2VsZWN0b3IpLmZpcnN0KCkuYmVmb3JlKCRub2RlKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJG5vZGUgPSB0aGlzLiQoKTtcclxuICAgICRub2RlLm5leHRBbGwoc2VsZWN0b3IpLmZpcnN0KCkuYWZ0ZXIoJG5vZGUpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuYmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZG9tLnByZXBlbmRUb1Jvb3QodGhpcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTVkcgU3R5bGVzXHJcbiAqL1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgJiYgb2JqZWN0LmlzU3RyaW5nKGtleSkgJiYga2V5LmluZGV4T2YoJzonKSA8PSAwXHJcbiAgICAgICAgJiYgb2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZXMuc3R5bGUpKSB7XHJcbiAgICAgICAgLy9HRVRURVIgQ0FMTFxyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuc3R5bGUuZ2V0KGtleSk7XHJcbiAgICB9IGVsc2UgaWYoIW9iamVjdC5pc0RlZmluZWQodGhpcy5hdHRyaWJ1dGVzLnN0eWxlKSAmJiBvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5zdHlsZSA9IG5ldyBTdHlsZShrZXksIHZhbHVlKTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5zdHlsZS5zZXQoa2V5LCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKCdzdHlsZScpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5kYWxhID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignZGFsYTonK2tleSwgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZ2V0QkJveCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UoKS5nZXRCQm94KCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHV0aWwueG1sLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuaW5zdGFuY2UoKSk7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJCgpLmNsb25lKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR0VsZW1lbnQ7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHRWxsaXBzZSA9IHJlcXVpcmUoJy4vZWxsaXBzZScpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHQ2lyY2xlID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdjaXJjbGUnLCBzdmdSb290LCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdDaXJjbGUsIFNWR0VsbGlwc2UpO1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHZhciBzY2FsZSA9IChub1NjYWxlKSA/IDEgOiB0aGlzLnNjYWxlKClbMV07XHJcbiAgICBpZigoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdyJykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyJykgKyAodGhpcy5zdHJva2VXaWR0aCgpIC8gMikpICogc2NhbGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0ck51bWJlcigncicsIHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdiA9IHZhbHVlIC8gMjtcclxuICAgIHRoaXMuY3kodikuY3godikucih2KTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmhlaWdodCh2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdDaXJjbGUucHJvdG90eXBlLnJ4ID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHJldHVybiB0aGlzLnIodmFsdWUsIG5vU2NhbGUpO1xyXG59O1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yeSA9IGZ1bmN0aW9uKHZhbHVlLCBub1NjYWxlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yKHZhbHVlLCBub1NjYWxlKTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkNpcmNsZSh0aGlzLmdldENlbnRlcigpLCB0aGlzLnIoKSkub3ZlcmxheXMocG9zaXRpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdDaXJjbGU7IiwidmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgZXZlbnQgPSByZXF1aXJlKCcuLi9jb3JlL2V2ZW50Jyk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb3JlL2NvbmZpZycpO1xyXG5cclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcblxyXG52YXIgU2hpZnREcmFnID0gZnVuY3Rpb24oY2ZnKSB7XHJcbiAgICB0aGlzLmNmZyA9IGNmZztcclxuICAgIGlmKCFjZmcucmVzdHJpY3Rpb25YICYmICFjZmcucmVzdHJpY3Rpb25ZKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgdGhpcy54U2hpZnQgPSB7XHJcbiAgICAgICAgc2hpZnRBbGlnbiA6IDAsXHJcbiAgICAgICAgdW5zaGlmdEFsaWduIDogMFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnlTaGlmdCA9IHtcclxuICAgICAgICBzaGlmdEFsaWduIDogMCxcclxuICAgICAgICB1bnNoaWZ0QWxpZ24gOiAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2Rpc2FibGVkJztcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHN3aXRjaCh0aGlzLnN0YXRlKSB7XHJcbiAgICAgICAgY2FzZSAnaW5pdCcgOlxyXG4gICAgICAgICAgICB0aGlzLnhTaGlmdC5zaGlmdEFsaWduICs9IGR4O1xyXG4gICAgICAgICAgICB0aGlzLnlTaGlmdC5zaGlmdEFsaWduICs9IGR5O1xyXG5cclxuICAgICAgICAgICAgaWYodGhpcy5jaGVja1NoaWZ0SG9vayhldnQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZihNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IE1hdGguYWJzKHRoaXMueVNoaWZ0LnNoaWZ0QWxpZ24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSBmdW5jdGlvbihldnQsIGR4ICxkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5zaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ3NoaWZ0ZWRYJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSBmdW5jdGlvbihldnQsIGR4ICwgZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuc2hpZnRSZXN0cmljdGlvbih0aGF0LnhTaGlmdCwgZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdzaGlmdGVkWSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2hpZnRlZFgnOlxyXG4gICAgICAgICAgICBpZighZXZ0LnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0aW9uWSA9IGZ1bmN0aW9uKGV2dCwgZHgsIGR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQudW5TaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdpbml0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzaGlmdGVkWSc6XHJcbiAgICAgICAgICAgIGlmKCFldnQuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdHJpY3Rpb25YID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC51blNoaWZ0UmVzdHJpY3Rpb24odGhhdC54U2hpZnQsIGR4KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuc2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9VcGRhdGUgc2hpZnRlZCBkXHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduICs9IGQ7XHJcbiAgICAvL0FsaWduIHNoaWZ0IGRyYWcgYmFjayB0byB0aGUgc3RhcnQgcG9zaXRpb25cclxuICAgIHZhciByZXN1bHQgPSAoTWF0aC5hYnMoc2hpZnREYXRhLnNoaWZ0QWxpZ24pID4gMCkgPyBzaGlmdERhdGEuc2hpZnRBbGlnbiAqIC0xIDogMDtcclxuICAgIHNoaWZ0RGF0YS5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLnVuU2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9BbGlnbiBzaGlmdCBkcmFnIGJhY2sgdG8gdGhlIHN0YXJ0IHBvc2l0aW9uXHJcbiAgICB2YXIgcmVzdWx0ID0gc2hpZnREYXRhLnVuc2hpZnRBbGlnbiArIGQ7XHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmNoZWNrU2hpZnRIb29rID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICByZXR1cm4gZXZ0LnNoaWZ0S2V5ICYmIChNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IDQgfHwgTWF0aC5hYnModGhpcy55U2hpZnQuc2hpZnRBbGlnbikgPiA0KTtcclxufTtcclxuXHJcbi8vVE9ETzogdGhpcyB3b3VsZCBiZSBtb3JlIGVsZWdhbnQgdG8gdXNlIHRoZSBhbGlnbm1lbnQgYWxpZ24gY2VudGVyIHRvIGNlbnRlci54IGlmIGNoZWNrU2hpZnRIb29rXHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmdldFJlc3RyaWN0aW9uWCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY2ZnLnJlc3RyaWN0aW9uWCB8fCB0aGlzLnJlc3RyaWN0aW9uWDtcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuZ2V0UmVzdHJpY3Rpb25ZID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jZmcucmVzdHJpY3Rpb25ZIHx8IHRoaXMucmVzdHJpY3Rpb25ZO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmRyYWdnYWJsZSA9IGZ1bmN0aW9uKGNmZywgZHJhZ0VsZW1lbnQpIHtcclxuICAgIHZhciBjZmcgPSBjZmcgfHwge307XHJcblxyXG5cclxuXHJcbiAgICBpZihkcmFnRWxlbWVudCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50ID0gdGhpcy5zdmcuZ2V0KGRyYWdFbGVtZW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZHJhZ0VsZW1lbnQgPSB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICB2YXIgZHJhZ01vdmUgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBpZihldnQucHJldmVudERlZmF1bHQpIHtcclxuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB0aGF0LmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhY3R1YWxkeCA9IChvYmplY3QuaXNEZWZpbmVkKGV2dC5keCkpID8gZXZ0LmR4IDogZXZ0LmNsaWVudFggLSB0aGF0LmRyYWdDdXJyZW50WDtcclxuICAgICAgICB2YXIgYWN0dWFsZHkgPSAob2JqZWN0LmlzRGVmaW5lZChldnQuZHkpKSA/IGV2dC5keSA6IGV2dC5jbGllbnRZIC0gdGhhdC5kcmFnQ3VycmVudFk7XHJcblxyXG4gICAgICAgIC8vIERSQUcgQkVGT1JFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ0JlZm9yZU1vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdCZWZvcmVNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGFjdHVhbGR4LCBhY3R1YWxkeV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRFJBRyBBTElHTk1FTlRcclxuICAgICAgICBpZihjZmcuZHJhZ0FsaWdubWVudCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgYWxpZ25tZW50ID0gY2ZnLmRyYWdBbGlnbm1lbnQuY2hlY2soYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgYWN0dWFsZHggPSBhbGlnbm1lbnQuZHg7XHJcbiAgICAgICAgICAgIGFjdHVhbGR5ID0gYWxpZ25tZW50LmR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9DaGVjayBmb3Igc2hpZnREcmFnIHJlc3RyaWN0aW9uLCBzaGlmdERyYWcgd2lsbCBvbmx5IGhvb2sgdXAgaWYgbm8gb3RoZXIgcmVzdHJpY3Rpb24gaXMgc2V0LlxyXG4gICAgICAgIC8vU2hpZnRkcmFnIGlzIG5vdCBnaXZlbiBmb3IgdHJpZ2dlcmRyYWdzXHJcbiAgICAgICAgaWYodGhhdC5zaGlmdERyYWcgJiYgIWV2dC50cmlnZ2VyRXZlbnQpIHtcclxuICAgICAgICAgICAgdGhhdC5zaGlmdERyYWcudXBkYXRlKGV2dCwgYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgdmFyIHJlc3RyaWN0aW9uWCA9IHRoYXQuc2hpZnREcmFnLmdldFJlc3RyaWN0aW9uWCgpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdHJpY3Rpb25ZID0gdGhhdC5zaGlmdERyYWcuZ2V0UmVzdHJpY3Rpb25ZKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIFJFU1RSSUNUSU9OXHJcbiAgICAgICAgdmFyIGR4ID0gKHJlc3RyaWN0aW9uWCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkgPyByZXN0cmljdGlvblguYXBwbHkodGhhdCwgW2V2dCwgYWN0dWFsZHgsIGFjdHVhbGR5XSkgOiBhY3R1YWxkeDtcclxuICAgICAgICB2YXIgZHkgPSAocmVzdHJpY3Rpb25ZICYmICFldnQudHJpZ2dlckV2ZW50KSA/IHJlc3RyaWN0aW9uWS5hcHBseSh0aGF0LCBbZXZ0LCBhY3R1YWxkeCwgYWN0dWFsZHldKSA6IGFjdHVhbGR5O1xyXG5cclxuICAgICAgICAvL1RPRE86IHNvbWVob3cgdGhlIHNjYWxlIHNob3VsZCBiZSBkZXRlcm1pbmVkIGluIGEgbW9yZSBlbGVnYW50IHdheSBwZXJoYXBzIHN0b3JlIGl0IGluIHN2ZyBpbnN0YW5jZS4uLlxyXG4gICAgICAgIGlmKGNmZy5nZXRTY2FsZSAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBjZmcuZ2V0U2NhbGUoKTtcclxuICAgICAgICAgICAgZHggLz0gc2NhbGU7XHJcbiAgICAgICAgICAgIGR5IC89IHNjYWxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRVhFQ1VURSBEUkFHXHJcbiAgICAgICAgaWYoZHggIT09IDAgfHwgZHkgIT09IDApIHtcclxuICAgICAgICAgICAgdGhhdC5tb3ZlKGR4LCBkeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBjdXJyZW50IG1vdXNlIHBvc2l0aW9uXHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFggPSBldnREYXRhLmNsaWVudFg7XHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFkgPSBldnREYXRhLmNsaWVudFk7XHJcblxyXG4gICAgICAgIHRoYXQuZHhTdW0gKz0gZHg7XHJcbiAgICAgICAgdGhhdC5keVN1bSArPSBkeTtcclxuXHJcbiAgICAgICAgLy8gRFJBRyBNT1ZFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ01vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGR4LCBkeV0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRyYWdFbmQgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL1R1cm4gb2ZmIGRyYWcgZXZlbnRzXHJcbiAgICAgICAgdGhhdC5nZXRTVkdSb290KCkub2ZmKCdtb3VzZW1vdmUnKTtcclxuICAgICAgICBldmVudC5vZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcblxyXG4gICAgICAgIGlmKGNmZy5kcmFnQWxpZ25tZW50KSB7XHJcbiAgICAgICAgICAgIGNmZy5kcmFnQWxpZ25tZW50LnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRyYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAkKCdib2R5JykuY3NzKCdjdXJzb3InLCdkZWZhdWx0Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIEVORCBIT09LXHJcbiAgICAgICAgaWYoY2ZnLmRyYWdFbmQpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdFbmQuYXBwbHkodGhhdCwgW2V2dF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhhdC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdhbGwnKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYoZHJhZ0VsZW1lbnQpIHtcclxuICAgICAgICB2YXIgbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgaWYoZS5jdHJsS2V5IHx8ICF0aGF0LmlzVmlzaWJsZSgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAvLyBXZSBzdG9wIHRoZSBldmVudCBwcm9wYWdhdGlvbiB0byBwcmV2ZW50IHRoZSBkb2N1bWVudCBtb3VzZWRvd24gaGFuZGxlciB0byBmaXJlXHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBpbml0RHJhZ1ZhbHVlcyh0aGF0LCBlLCBjZmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gRFJBRyBTVEFSVCBIT09LXHJcbiAgICAgICAgICAgIGlmKGNmZy5kcmFnU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIGNmZy5kcmFnU3RhcnQuYXBwbHkodGhhdCwgW2VdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAgICAgJCgnYm9keScpLmNzcygnY3Vyc29yJywgY2ZnLmN1cnNvcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGV2ZW50Lm9uKHRoYXQuZ2V0Um9vdE5vZGUoKSwgJ21vdXNlbW92ZScsIGRyYWdNb3ZlKTtcclxuICAgICAgICAgICAgZXZlbnQub24oZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLm9uY2UpIHtcclxuICAgICAgICAgICAgZHJhZ0VsZW1lbnQub24oJ21vdXNlZG93bicsIG1vdXNlRG93bkhhbmRsZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRyYWdFbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBtb3VzZURvd25IYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9TaW11bGF0ZXMgYW4gZHJhZyBzdGFydCBldmVudFxyXG4gICAgdGhpcy5pbml0RHJhZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50LnRyaWdnZXIoJ21vdXNlZG93bicpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL0ZvciBtYW51YWwgZHJhZ2dpbmcgYSBzdmcgZWxlbWVudCB0aGUgdHJpZ2dlckV2ZW50IGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBldmVudCB3YXMgdHJpZ2dlcmVkIG1hbnVhbGx5XHJcbiAgICAvL1NlZSBTZWxlY3Rpb25tYW5hZ2VyIHNldE5vZGVTZWxlY3Rpb24gZHJhZ01vdmUgaGFuZGxlclxyXG4gICAgdGhpcy50cmlnZ2VyRHJhZyA9IGZ1bmN0aW9uKGR4LCBkeSkge1xyXG4gICAgICAgIGRyYWdNb3ZlLmFwcGx5KHRoaXMsW3tkeDpkeCwgZHk6ZHksIHRyaWdnZXJFdmVudDp0cnVlfV0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbnZhciBpbml0RHJhZ1ZhbHVlcyA9IGZ1bmN0aW9uKHRoYXQsIGV2dCwgY2ZnKSB7XHJcbiAgICB0aGF0LmR4U3VtID0gMDtcclxuICAgIHRoYXQuZHlTdW0gPSAwO1xyXG4gICAgdGhhdC5zaGlmdERyYWcgPSBuZXcgU2hpZnREcmFnKGNmZyk7XHJcbiAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICB0aGF0LmRyYWdDdXJyZW50WCA9IGV2dERhdGEuY2xpZW50WDtcclxuICAgIHRoYXQuZHJhZ0N1cnJlbnRZID0gZXZ0RGF0YS5jbGllbnRZO1xyXG5cclxuICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbn07XHJcblxyXG52YXIgZ2V0TW91c2VFdmVudERhdGEgPSBmdW5jdGlvbihldnQpIHtcclxuICAgIGlmKCFldnQuY2xpZW50WCkge1xyXG4gICAgICAgIHJldHVybiBldmVudC5tb3VzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGV2dDtcclxufTsiLCJ2YXIgc2hhcGVzID0ge31cclxuc2hhcGVzLnN2ZyA9IHNoYXBlcy5TdmcgPSByZXF1aXJlKCcuL3N2Z1Jvb3QnKTtcclxuc2hhcGVzLmNpcmNsZSA9IHNoYXBlcy5DaXJjbGUgPSByZXF1aXJlKCcuL2NpcmNsZScpO1xyXG5zaGFwZXMuZWxsaXBzZSA9IHNoYXBlcy5FbGxpcHNlID0gcmVxdWlyZSgnLi9lbGxpcHNlJyk7XHJcbnNoYXBlcy50ZXh0ID0gc2hhcGVzLlRleHQgPSByZXF1aXJlKCcuL3RleHQnKTtcclxuc2hhcGVzLnRzcGFuID0gc2hhcGVzLlRTcGFuID0gcmVxdWlyZSgnLi90c3BhbicpO1xyXG5zaGFwZXMucGF0aCA9IHNoYXBlcy5QYXRoID0gcmVxdWlyZSgnLi9wYXRoJyk7XHJcbnNoYXBlcy5yZWN0ID0gc2hhcGVzLlJlY3QgPSByZXF1aXJlKCcuL3JlY3QnKTtcclxuc2hhcGVzLmcgPSBzaGFwZXMuR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gc2hhcGVzOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHRWxsaXBzZSA9IGZ1bmN0aW9uKHN2Z1Jvb3QsIGNmZykge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAnZWxsaXBzZScsIHN2Z1Jvb3QsIGNmZyk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR0VsbGlwc2UsIFNWR1NoYXBlKTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLnggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN4KCkgLSB0aGlzLnJ4KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yeShmYWxzZSwgdHJ1ZSkgKiAyO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAvL1doZW4gc2V0dGluZyB0aGUgaGVpZ2h0IG9mIGFuIGVsbGlwc2Ugd2UgbW92ZSB0aGUgY2VudGVyIHRvIG5vdCBjaGFuZ2UgdGhlIHgveVxyXG4gICAgdmFyIHYgPSB2YWx1ZSAvIDI7XHJcbiAgICB0aGlzLmN5KHYpLnJ5KHYpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnJ4KGZhbHNlLCB0cnVlKSAqIDI7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fc2V0V2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgLy9XaGVuIHNldHRpbmcgdGhlIGhlaWdodCBvZiBhbiBlbGxpcHNlIHdlIG1vdmUgdGhlIGNlbnRlciB0byBub3QgY2hhbmdlIHRoZSB4L3lcclxuICAgIHZhciB2ID0gdmFsdWUgLyAyO1xyXG4gICAgdGhpcy5jeCh2KS5yeCh2KTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLl9nZXRYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jeCgpIC0gdGhpcy5yeCgpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN5KCkgLSB0aGlzLnJ5KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRoaXMuY3goKSxcclxuICAgICAgICB5IDogdGhpcy5jeSgpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuYm90dG9tWSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY3koKSArIHRoaXMucnkoKTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLmN4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCF2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZWRYKHRoaXMuYXR0ck51bWJlcignY3gnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignY3gnLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5jeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGVkWSh0aGlzLmF0dHJOdW1iZXIoJ2N5JykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ2N5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnggPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVswXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J4JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeCcpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J4JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnkgPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVsxXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J5JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeScpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkVsbGlwc2UodGhpcy5nZXRDZW50ZXIoKSwgdGhpcy5yeCgpLCB0aGlzLnJ5KCkpLm92ZXJsYXlzKHBvc2l0aW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHRWxsaXBzZTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG5cclxudmFyIFNWR0dyb3VwID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdnJywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHR3JvdXAsIFNWR1NoYXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHR3JvdXA7IiwidmFyIEhlbHBlciA9IGZ1bmN0aW9uKHN2Zykge1xyXG4gICAgdGhpcy5zdmcgPSBzdmc7XHJcbiAgICB0aGlzLnBvaW50cyA9IHt9O1xyXG59O1xyXG5cclxuSGVscGVyLnByb3RvdHlwZS5wb2ludCA9IGZ1bmN0aW9uKGlkLCBwLCBjb2xvciwgcHJldlRleHQpIHtcclxuICAgIGNvbG9yID0gY29sb3IgfHwgJ3JlZCc7XHJcbiAgICB2YXIgdGV4dCA9IGlkKycoeDonK3AueCArICcgeTonK3AueSsnKSc7XHJcbiAgICBpZighdGhpcy5wb2ludHNbaWRdKSB7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5zdmcuY2lyY2xlKHtcclxuICAgICAgICAgICAgcjoyLFxyXG4gICAgICAgICAgICBzdHlsZTonZmlsbDonK2NvbG9yXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnN2Zy50ZXh0KHRleHQpLmZpbGwoY29sb3IpO1xyXG4gICAgICAgIHZhciBncm91cCA9IHRoaXMuc3ZnLmcoe2lkOidoZWxwZXJfJytpZH0sIHQsIHBvaW50KTtcclxuICAgICAgICB0aGlzLnBvaW50c1tpZF0gPSB7XHJcbiAgICAgICAgICAgIGdyb3VwIDogZ3JvdXAsXHJcbiAgICAgICAgICAgIHRleHQgOiB0LFxyXG4gICAgICAgICAgICBwb2ludCA6IHBvaW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihwcmV2VGV4dCkge1xyXG4gICAgICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wb2ludHNbaWRdLnBvaW50Lm1vdmVUbyhwKTtcclxuICAgIHRoaXMucG9pbnRzW2lkXS50ZXh0LiQoKS50ZXh0KHRleHQpO1xyXG4gICAgdGhpcy5wb2ludHNbaWRdLnRleHQubW92ZVRvKHApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIZWxwZXI7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnZhciBQYXRoRGF0YSA9IHJlcXVpcmUoJy4vcGF0aERhdGEnKTtcclxuXHJcbnZhciBTVkdQYXRoID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IHsgZCA6IFNWR1BhdGgucGF0aERhdGFBdHRyaWJ1dGVTZXR0ZXJ9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAncGF0aCcsIHN2Z1Jvb3QsIGNmZywgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdQYXRoLCBTVkdTaGFwZSk7XHJcblxyXG5TVkdQYXRoLnBhdGhEYXRhQXR0cmlidXRlU2V0dGVyID0gZnVuY3Rpb24ocGF0aERhdGFTdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgUGF0aERhdGEocGF0aERhdGFTdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHUGF0aC5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZCgpLmdldFgoKTtcclxufTtcclxuXHJcblNWR1BhdGgucHJvdG90eXBlLnkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmQoKS5nZXRZKCk7XHJcbn07XHJcblxyXG5TVkdQYXRoLnByb3RvdHlwZS5kID0gZnVuY3Rpb24ocGF0aERhdGEpIHtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhwYXRoRGF0YSkpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuZCA9IG5ldyBQYXRoRGF0YShwYXRoRGF0YSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ2QnKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNEZWZpbmVkKHBhdGhEYXRhKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gcGF0aERhdGFcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgnZCcpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy5kKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gbmV3IFBhdGhEYXRhKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1BhdGg7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi91dGlsL21hdGgnKS5WZWN0b3I7XHJcbnZhciBtYXRoID0gcmVxdWlyZSgnLi4vdXRpbC9tYXRoJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL3V0aWwvdXRpbFwiKTtcclxuXHJcbnZhciBBYnN0cmFjdFBhdGhEYXRhVHlwZSA9IGZ1bmN0aW9uKHR5cGUsIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLnZlY3RvciA9IG5ldyBWZWN0b3IoKTtcclxuICAgIHRoaXMudmVjdG9yLmFkZCh0eXBlKTtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldEFic29sdXRlID0gZnVuY3Rpb24oYWJzb2x1dGUpIHtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0VHlwZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHR5cGUgPSB0aGlzLnZhbHVlKDAsMCk7XHJcbiAgICByZXR1cm4gdGhpcy5hYnNvbHV0ZSA/IHR5cGUudG9VcHBlckNhc2UoKSA6IHR5cGUudG9Mb3dlckNhc2UoKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmVjdG9yLnZhbHVlKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnZlY3Rvci5zZXRWYWx1ZShwYXRoQXJyLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3Iuc2V0VmFsdWUocGF0aEFyciwgdmFsdWVzKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5pcyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKS50b1VwcGVyQ2FzZSgpID09PSB0eXBlLnRvVXBwZXJDYXNlKCk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUudG8gPSBmdW5jdGlvbihwYXRoQXJyLCB2YWx1ZXMpIHtcclxuICAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5wb2ludFRvU3RyaW5nID0gZnVuY3Rpb24ocCkge1xyXG4gICAgcmV0dXJuIHAueCArICcsJyArIHAueSsnICc7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0T3JTZXQgPSBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZShpbmRleCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZWN0b3IgPSBbWydsJ10sIHt4OngsIHk6eX1dXHJcbiAqL1xyXG52YXIgTGluZVRvID0gZnVuY3Rpb24ocCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ2wnLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhMaW5lVG8sIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG8gPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMudmFsdWUoMSkueCA9IHZhbHVlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZSgxKS54O1xyXG59O1xyXG5cclxuTGluZVRvLnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSgxKS55ID0gdmFsdWVcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnZhbHVlKDEpLnk7XHJcbn07XHJcblxyXG5MaW5lVG8ucHJvdG90eXBlLm1vdmVBbG9uZyA9IGZ1bmN0aW9uKGZyb20sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gbWF0aC5MaW5lLm1vdmVBbG9uZyhmcm9tLCB0aGlzLnRvKCksIGRpc3RhbmNlKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUuZ2V0TmVhcmVzdFBvaW50ID0gZnVuY3Rpb24oZnJvbSwgcG9zaXRpb24pIHtcclxuICAgIHJldHVybiBtYXRoLkxpbmUuZ2V0TmVhcmVzdFBvaW50KGZyb20sIHRoaXMudG8oKSwgcG9zaXRpb24pO1xyXG59O1xyXG5cclxudmFyIFFCZXppZXIgPSBmdW5jdGlvbihjb250cm9sUCwgdG9QLCBhYnNvbHV0ZSkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAncScsIGFic29sdXRlKTtcclxuICAgIHRoaXMuY29udHJvbChjb250cm9sUCk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFFCZXppZXIsIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcblFCZXppZXIucHJvdG90eXBlLnRvID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDEscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHlwZSgpK3RoaXMucG9pbnRUb1N0cmluZyh0aGlzLmNvbnRyb2woKSkrdGhpcy5wb2ludFRvU3RyaW5nKHRoaXMudG8oKSk7XHJcbn07XHJcblxyXG52YXIgQ0JlemllciA9IGZ1bmN0aW9uKGNvbnRyb2xQMSwgY29udHJvbFAyLCB0b1AsIGFic29sdXRlKSB7XHJcbiAgICBBYnN0cmFjdFBhdGhEYXRhVHlwZS5jYWxsKHRoaXMsICdjJywgYWJzb2x1dGUpO1xyXG4gICAgdGhpcy5jb250cm9sMShjb250cm9sUDEpO1xyXG4gICAgdGhpcy5jb250cm9sMihjb250cm9sUDIpO1xyXG4gICAgdGhpcy50byh0b1ApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDQmV6aWVyLCBBYnN0cmFjdFBhdGhEYXRhVHlwZSk7XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sMSh4LHkpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuY29udHJvbDEgPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkNCZXppZXIucHJvdG90eXBlLmNvbnRyb2wyID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgdmFyIHAgPSBtYXRoLmdldFBvaW50KHgseSk7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRPclNldCgzLHApO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMSgpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMigpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIHRoZSBuZWFyZXN0IHBvaW50IG9mIHRoZSBiZXppZXIgY3VydmUgdG8gdGhlIGdpdmVuIHBvc2l0aW9uLiBzaW5jZSB0aGUgQ0JlemllciBkb2VzIG5vdCBrbm93IGl0cyBzdGFydFxyXG4gKiBwb2ludCwgd2UgaGF2ZSB0byBwcm92aWRlIHRoZSBmcm9tIHBvc2l0aW9uIGFzIHdlbGwgYXMgdGhlIHNlYXJjaCBiYXNlIHBvc2l0aW9uLlxyXG4gKiBAcGFyYW0gZnJvbVxyXG4gKiBAcGFyYW0gcG9zaXRpb25cclxuICogQHJldHVybnMge3twb2ludCwgbG9jYXRpb259fCp9XHJcbiAqL1xyXG5DQmV6aWVyLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihmcm9tLCBwb3NpdGlvbikge1xyXG4gICAgcmV0dXJuIG1hdGguYmV6aWVyLm5lYXJlc3RQb2ludE9uQ3VydmUocG9zaXRpb24sIHRoaXMuZ2V0Q3VydmUoZnJvbSkpLnBvaW50O1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oZnJvbSwgZGlzdGFuY2UpIHtcclxuICAgIHJldHVybiBtYXRoLmJlemllci5tb3ZlQWxvbmcodGhpcy5nZXRDdXJ2ZShmcm9tKSwgZGlzdGFuY2UpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuZ2V0Q3VydmUgPSBmdW5jdGlvbihmcm9tKSB7XHJcbiAgICByZXR1cm4gW2Zyb20sIHRoaXMuY29udHJvbDEoKSwgdGhpcy5jb250cm9sMigpLCB0aGlzLnRvKCldO1xyXG59O1xyXG5cclxudmFyIE1vdmVUbyA9IGZ1bmN0aW9uKHRvUCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ20nLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKE1vdmVUbywgTGluZVRvKTtcclxuXHJcbnZhciBDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAneicpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDb21wbGV0ZSwgQWJzdHJhY3RQYXRoRGF0YVR5cGUpO1xyXG5cclxuQ29tcGxldGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUeXBlKCk7XHJcbn07XHJcblxyXG52YXIgcGF0aFR5cGUgPSB7XHJcbiAgICB6IDogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgQ29tcGxldGUoKSB9LFxyXG4gICAgbSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IE1vdmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgbCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IExpbmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgcSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IFFCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pOyB9LFxyXG4gICAgYyA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IENCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sICBhcmd1bWVudHNbMl0pOyB9XHJcbn07XHJcblxyXG52YXIgUGF0aERhdGEgPSBmdW5jdGlvbihkZWYpIHtcclxuICAgIHRoaXMuZGF0YSA9IG5ldyBWZWN0b3IoKTtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhkZWYpKSB7XHJcbiAgICAgICAgdGhpcy5sb2FkRnJvbVN0cmluZyhkZWYpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxvYWRGcm9tU3RyaW5nID0gZnVuY3Rpb24oc3RyVmFsKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvLydNMTAwLDEwMCBRMjAwLDIwMCAzMDAsMzAwJyAtLT4gWydNMTAwLDEwMCAnLCAnUTIwMCwyMDAgMzAwLDMwMCddXHJcbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBzdHJWYWwuc3BsaXQoLyg/PVtNbUxsSGhWdkNjU3NRcVR0QWFael0rKS8pO1xyXG4gICAgLy9FYWNoIGRUeXBlXHJcbiAgICAkLmVhY2goZGVmaW5pdGlvbnMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciB0eXBlID0gdmFsdWUuY2hhckF0KDApO1xyXG4gICAgICAgIC8vJ1EyMDAsMjAwIDMwMCwzMDAgLT4gWycyMDAsMjAwJywgJzMwMCwzMDAnXVxyXG4gICAgICAgIHZhciB2YWx1ZXMgPSB2YWx1ZS5zdWJzdHJpbmcoMSx2YWx1ZS5sZW5ndGgpLnRyaW0oKS5zcGxpdCgnICcpO1xyXG4gICAgICAgIC8vWycyMDAsMjAwJywgJzMwMCwzMDAnXSAtPiBbe3g6MjAwLCB5OjIwMH0sIHt4OjMwMCwgeTozMDB9XVxyXG4gICAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgICAkLmVhY2godmFsdWVzLCBmdW5jdGlvbihpLCBjb29yZCkge1xyXG4gICAgICAgICAgICB2YXIgY29vcmRWYWxzID0gY29vcmQuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgcG9pbnRzLnB1c2gobWF0aC5nZXRQb2ludChwYXJzZUZsb2F0KGNvb3JkVmFsc1swXSksIHBhcnNlRmxvYXQoY29vcmRWYWxzWzFdKSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQuZGF0YS5hZGQocGF0aFR5cGVbdHlwZS50b0xvd2VyQ2FzZSgpXS5hcHBseSh1bmRlZmluZWQsIHBvaW50cykuc2V0QWJzb2x1dGUoKHR5cGUgPT0gdHlwZS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDb3JuZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgeE1pbiwgeE1heCwgeU1pbiwgeU1heDtcclxuICAgIHhNaW4gPSB5TWluID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgeE1heCA9IHlNYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcblxyXG4gICAgdGhpcy5kYXRhLmVhY2goZnVuY3Rpb24oaW5kZXgsIHBhdGhQYXJ0KSB7XHJcbiAgICAgICAgaWYocGF0aFBhcnQueCAmJiBwYXRoUGFydC55KSB7XHJcbiAgICAgICAgICAgIHhNaW4gPSAoeE1pbiA+IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWluO1xyXG4gICAgICAgICAgICB5TWluID0gKHlNaW4gPiBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1pbjtcclxuXHJcbiAgICAgICAgICAgIHhNYXggPSAoeE1heCA8IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWF4O1xyXG4gICAgICAgICAgICB5TWF4ID0gKHlNYXggPCBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1heDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1pbn0sXHJcbiAgICAgICAge3g6eE1heCwgeTp5TWlufSxcclxuICAgICAgICB7eDp4TWF4LCB5OnlNYXh9LFxyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1heH1cclxuICAgIF07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLnk7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUucG9seW5vbXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBpZih2YWx1ZS50bykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZS50bygpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuc1xyXG4gKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0UGF0aFBhcnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgLy9XZSBzdGFydCBhdCBpbmRleCAxIGJlY2F1c2UgdGhlIDAgaW5kZXggb2YgdGhlIHZlY3RvciBjb250YWlucyB0aGUgcGF0aHBhcnQgdHlwZVxyXG4gICAgZm9yKHZhciBpID0gMTsgaSA8PSB0aGlzLmxlbmd0aCgpIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5nZXRQYXRoUGFydChpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoUGFydCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICB2YXIgcGF0aFBhcnQgPSB0aGlzLnZhbHVlKGluZGV4KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnQ6IHRoaXMudmFsdWUoaW5kZXggLSAxKS50bygpLFxyXG4gICAgICAgIGVuZDogcGF0aFBhcnQudG8oKSxcclxuICAgICAgICB2YWx1ZTogcGF0aFBhcnRcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oaW5kZXgsIGRpc3RhbmNlLCBkaXJlY3Rpb24pIHtcclxuICAgIHZhciBwYXRoUGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGF0aFBhcnQudmFsdWUubW92ZUFsb25nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGhQYXJ0LnZhbHVlLm1vdmVBbG9uZyhwYXRoUGFydC5zdGFydCwgZGlzdGFuY2UsIGRpcmVjdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBtYXRoLkxpbmUubW92ZUFsb25nKHBhdGhQYXJ0LnN0YXJ0LCBwYXRoUGFydC5lbmQsIGRpc3RhbmNlLCBkaXJlY3Rpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHJvdWdoIGNlbnRlciBvZiB0aGUgcGF0aCBieSBjYWxjdWxhdGluZyB0aGUgdG90YWwgbGVuZ3RoIG9mIHRoZSBwYXRocGFydHMgKGFzIGRpcmVjdCBsaW5lcykgYW5kIG1vdmluZ1xyXG4gKiBhbG9uZyB0aG9zZSBsaW5lcyB0byB0aGUgY2VudGVyICh0b3RhbCBsZW5ndGggLyAyKS4gTm90ZSB3aXRoIHRoaXMgbWV0aG9kIHdlIGp1c3QgZ2V0IGEgZXhhY3QgcmVzdWx0IGZvciBzaW1wbGVcclxuICogbGluZSBwYXRocy4gSWYgdGhlIGNhbGN1bGF0ZWQgY2VudGVyIHBvc2l0aW9uIGlzIHdpdGhpbiBhIGN1YmljIGJlemllciBwYXRoIHBhcnQsIHdlIHJldHVybiB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICogdG8gdGhlIGNhbGN1bGF0ZWQgY2VudGVyLlxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHREID0gdGhpcy5nZXREaXN0YW5jZSgpIC8gMjtcclxuICAgIHZhciBjdXJyZW50RCA9IDA7XHJcbiAgICB2YXIgY2VudGVyO1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy5nZXRQYXRoUGFydHMoKSwgZnVuY3Rpb24oaW5kZXgsIHBhcnQpIHtcclxuICAgICAgICB2YXIgbGluZUQgPSBtYXRoLkxpbmUuY2FsY0Rpc3RhbmNlKHBhcnQuc3RhcnQsIHBhcnQuZW5kKTtcclxuICAgICAgICB2YXIgbmV4dEQgPSBjdXJyZW50RCArIGxpbmVEO1xyXG4gICAgICAgIGlmKG5leHREID4gcmVzdWx0RCkge1xyXG4gICAgICAgICAgICB2YXIgZGlmZkQgPSAgcmVzdWx0RCAtIGN1cnJlbnREO1xyXG4gICAgICAgICAgICBjZW50ZXIgPSBtYXRoLkxpbmUubW92ZUFsb25nKHBhcnQuc3RhcnQsIHBhcnQuZW5kLCBkaWZmRCk7XHJcblxyXG4gICAgICAgICAgICAvL0lmIHdlIGhhdmUgYSBjdWJpYyBiZXppZXIgcGF0aCBwYXJ0IHdlIGNhbGN1bGF0ZSB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICAgICAgICAgICAgaWYocGFydC52YWx1ZS5pcygnYycpKSB7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXIgPSBwYXJ0LnZhbHVlLmdldE5lYXJlc3RQb2ludChwYXJ0LnN0YXJ0LCBjZW50ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VycmVudEQgPSBuZXh0RDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNlbnRlcjtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXREaXN0YW5jZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGRpc3RhbmNlID0gMDtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgZGlzdGFuY2UgKz0gbWF0aC5MaW5lLmNhbGNEaXN0YW5jZShwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBkaXN0YW5jZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBc3N1bWluZyB0aGVyZSBhcmUgb25seSEgY3ViaWMgYmV6aWVyIGN1cnZlZCBwYXRoIHBhcnRzIHRoaXMgZnVuY3Rpb24gcmVjYWxjdWxhdGVzIGFsbCBjb250cm9sIHBvaW50cyBvZiB0aGUgY3VydmVzXHJcbiAqIHRvIHNtb290aGVuIHRoZSBlbnRpcmUgcGF0aC5cclxuICpcclxuICogQHBhcmFtIHBvbHlub21zXHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuc21vb3RoZW4gPSBmdW5jdGlvbihwb2x5bm9tcykge1xyXG4gICAgaWYoIXBvbHlub21zKSB7XHJcbiAgICAgICAgcG9seW5vbXMgPSB0aGlzLnBvbHlub21zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHggPSBbXTtcclxuICAgIHZhciB5ID0gW107XHJcblxyXG4gICAgb2JqZWN0LmVhY2gocG9seW5vbXMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHhbaW5kZXhdID0gdmFsdWUueDtcclxuICAgICAgICB5W2luZGV4XSA9IHZhbHVlLnk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcHggPSBtYXRoLmJlemllci5jYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzKHgpO1xyXG4gICAgdmFyIHB5ID0gbWF0aC5iZXppZXIuY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyh5KTtcclxuXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBvYmplY3QuZWFjaChweC5wMSwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhhdC52YWx1ZShpbmRleCArIDEpLmNvbnRyb2wxKHB4LnAxW2luZGV4XSwgcHkucDFbaW5kZXhdKTtcclxuICAgICAgICB0aGF0LnZhbHVlKGluZGV4ICsgMSkuY29udHJvbDIocHgucDJbaW5kZXhdLCBweS5wMltpbmRleF0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRMaW5lQnlQYXRoSW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdmFyIHAxID0gdGhpcy52YWx1ZShpbmRleCAtIDEpLnRvKCk7XHJcbiAgICB2YXIgcDIgPSB0aGlzLnZhbHVlKGluZGV4KS50bygpO1xyXG4gICAgcmV0dXJuIG5ldyBtYXRoLkxpbmUocDEsIHAyKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihwb2ludCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbihwb2ludCk7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQpIHtcclxuICAgICAgICByZXR1cm4gcGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQocGFydC5zdGFydCwgcG9pbnQpO1xyXG4gICAgfTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvaW50KSB7XHJcblxyXG4gICAgaWYodGhpcy5sZW5ndGgoKSA9PT0gMikge1xyXG4gICAgICAgIC8vSWYgdGhlcmUgaXMganVzdCB0aGUgc3RhcnQgYW5kIGVuZCBkb2NraW5nIHdlIGtub3cgdGhlIG5ldyBpbmRleFxyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkb2NraW5nSW5kZXggPSAxO1xyXG4gICAgdmFyIGNhbmRpZGF0ZSA9IFsxLE51bWJlci5QT1NJVElWRV9JTkZJTklUWSBdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgLy9Tb3J0IG91dCBwYXRocGFydHMgd2hpY2ggYXJlIG5vdCB3aXRoaW4gdGhlIGJvdW5kYXJ5IG9mIHN0YXJ0L2VuZCBwb2ludHMgd2l0aCBhIGxpdHRsZSB0b2xlcmFuY2Ugb2YgMTBweFxyXG4gICAgICAgIHZhciBwID0gbmV3IHV0aWwubWF0aC5Qb2ludChwb2ludCk7XHJcbiAgICAgICAgaWYocC5pc1dpdGhpblhJbnRlcnZhbChwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCwgMTApKSB7XHJcbiAgICAgICAgICAgIHZhciBkO1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IG5ldyBtYXRoLkxpbmUocGFydC5zdGFydCwgcGFydC5lbmQpO1xyXG5cclxuICAgICAgICAgICAgaWYoIWxpbmUuaXNWZXJ0aWNhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICBkID0gTWF0aC5hYnMobGluZS5jYWxjRlgocG9pbnQueCkueSAtIHBvaW50LnkpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihwLmlzV2l0aGluWUludGVydmFsKHBhcnQuc3RhcnQsIHBhcnQuZW5kKSkge1xyXG4gICAgICAgICAgICAgICAgLy9TaW5jZSB0aGUgcG9pbnQgaXMgd2l0aGluIHggKHdpdGggdG9sZXJhbmNlKSBhbmQgeSBpbnRlcnZhbCB3ZSBjYWxjdWxhdGUgdGhlIHggZGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLmFicyhwYXJ0LnN0YXJ0LnggLSBwLngpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FuZGlkYXRlID09PSB1bmRlZmluZWQgfHwgY2FuZGlkYXRlWzFdID4gZCkge1xyXG4gICAgICAgICAgICAgICAgLy9UaGUgcGF0aFBhcnRpbmRleCBpcyB0aGUgYXJyYXlpbmRleCArIDEgc2luY2Ugd2UgdXNlIHRoZSBlbmQgaW5kZXggb2YgdGhlIHBhdGggYXMgaWRlbnRpdHlcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVswXSA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVsxXSA9IGQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY2FuZGlkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZVswXTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldEdyYWRpZW4gPSBmdW5jdGlvbih4LHkpIHtcclxuIHZhciBwb3NpdGlvbiA9IHV0aWwubWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gdmFyIGluZGV4ID0gdGhpcy50cmFuc2l0aW9uLmdldEtub2JJbmRleEZvclBvaW50KHBvc2l0aW9uKTtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuIExpbmVQYXRoTWFuYWdlci5wcm90b3R5cGUuZ2V0R3JhZGllbnRCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldFZlY3RvckJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCwgZnJvbUVuZCkge1xyXG4gdmFyIHAxLCBwMjtcclxuIGlmKGZyb21FbmQpIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4ICsgMSkucG9zaXRpb24oKTtcclxuIHAyID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gfSBlbHNlIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gcDIgPSB0aGlzLmRhdGEuZ2V0RG9ja2luZ0J5SW5kZXgoaW5kZXggKyAxKS5wb3NpdGlvbigpO1xyXG4gfVxyXG4gcmV0dXJuIHV0aWwubWF0aC5MaW5lLmNhbGNOb3JtYWxpemVkTGluZVZlY3RvcihwMSwgcDIpO1xyXG4gfTtcclxuICovXHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMF0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRSaWdodFggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzFdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0Qm90dG9tWSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMl0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmRhdGEuY2xlYXIoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGgoKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlKGluZGV4KTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5sYXN0SW5kZXhPZlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICB2YXIgaTtcclxuICAgIGZvcihpID0gdGhpcy5sZW5ndGgoKSAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZShpKTtcclxuICAgICAgICBpZih2YWx1ZS5pcyh0eXBlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gLTE7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUudmFsdWVzQnlUeXBlID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpLCB2YWx1ZSkge1xyXG4gICAgICAgaWYodmFsdWUuaXModHlwZSkpIHtcclxuICAgICAgICAgICByZXN1bHQucHVzaCh7aW5kZXg6aSwgdmFsdWU6dmFsdWV9KTtcclxuICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihwLCBhYnNvbHV0ZSkge1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlKDApLnRvKCk7XHJcbiAgICB9IGVsc2UgaWYodGhpcy5sZW5ndGgoKSA+IDApIHtcclxuICAgICAgICB0aGlzLnZhbHVlKDApLnRvKHApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuc2V0VmFsdWUoMCwgbmV3IE1vdmVUbyhwLCBhYnNvbHV0ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sYXN0KCkudG8odmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmxhc3QoKS50bygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IHJlZmFjdG9yIHRvIHNldFRvXHJcbiAqIEBwYXJhbSBpbmRleFxyXG4gKiBAcGFyYW0gdmFsdWVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLnNldFRvID0gZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmRhdGEudmFsdWUoaW5kZXgpLnRvKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnJlbW92ZVBhdGggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZShpbmRleCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ29tcGxldGUoKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5saW5lID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHRoaXMuZGF0YS5hZGQobmV3IExpbmVUbyhwLCB0cnVlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jQmV6aWVyID0gZnVuY3Rpb24oYzEsIGMyLCB0bykge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ0JlemllcihjMSxjMiwgdG8sIHRydWUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IExpbmUgdG9cclxuICogQHBhcmFtIGluZGV4XHJcbiAqIEBwYXJhbSB2YWx1ZVxyXG4gKiBAcGFyYW0gYWJzb2x1dGVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLmluc2VydExpbmUgPSBmdW5jdGlvbihpbmRleCwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgTGluZVRvKHRvLGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5xQmV6aWVyID0gZnVuY3Rpb24oY29udHJvbFAsdG9QKSB7XHJcbiAgICB0aGlzLmRhdGEuYWRkKG5ldyBRQmV6aWVyKGNvbnRyb2xQLHRvUCwgdHJ1ZSkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuaW5zZXJ0UUJlemllciA9IGZ1bmN0aW9uKGluZGV4LGMsIHRvLCBhYnNvbHV0ZSkge1xyXG4gICAgdGhpcy5kYXRhLmluc2VydChpbmRleCwgbmV3IFFCZXppZXIoYywgdG8sIGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5pbnNlcnRDQmV6aWVyID0gZnVuY3Rpb24oaW5kZXgsIGMxLCBjMiwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgQ0JlemllcihjMSxjMiwgdG8sYWJzb2x1dGUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gJyc7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmRhdGEuZWFjaChmdW5jdGlvbihpbmRleCwgcGF0aFBhcnQpIHtcclxuICAgICAgIHJlc3VsdCArPSBwYXRoUGFydC50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0LnRyaW0oKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aERhdGE7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBTVkdTaGFwZSA9IHJlcXVpcmUoJy4vc3ZnU2hhcGUnKTtcclxuXHJcbnZhciBTVkdSZWN0ID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdyZWN0Jywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHUmVjdCwgU1ZHU2hhcGUpO1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3knKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3gnKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdoZWlnaHQnKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9zZXRIZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdGhpcy5hdHRyKCdoZWlnaHQnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9nZXRXaWR0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCd3aWR0aCcpO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHRoaXMuYXR0cignd2lkdGgnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLm92ZXJsYXlDaGVjayA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICByZXR1cm4gcG9zaXRpb24ueCA+PSB0aGlzLngoKSAmJiBwb3NpdGlvbi54IDw9IHRoaXMuZ2V0UmlnaHRYKClcclxuICAgICAgICAmJiBwb3NpdGlvbi55ID49IHRoaXMueSgpICYmIHBvc2l0aW9uLnkgPD0gdGhpcy5nZXRCb3R0b21ZKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1JlY3Q7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBzdHJpbmcgPSByZXF1aXJlKCcuLi91dGlsL3N0cmluZycpO1xyXG5cclxudmFyIFJFR0VYUF9QUk9QRVJUWV9TVUZGSVggPSAnOlthLXpBLVowLTkjLFxcLl0qKDt8JCknO1xyXG5cclxudmFyIFN0eWxlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgIW9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IGtleTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXQoa2V5LHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBpZihvYmplY3QuaXNPYmplY3Qoa2V5KSkge1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGtleSwgZnVuY3Rpb24ob2JqS2V5LCB2YWwpIHtcclxuICAgICAgICAgICAgaWYoa2V5Lmhhc093blByb3BlcnR5KG9iaktleSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KG9iaktleSx2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh0aGlzLnZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmFsdWUuaW5kZXhPZihrZXkrJzonKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKGtleStSRUdFWFBfUFJPUEVSVFlfU1VGRklYLCAnZ2knKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUucmVwbGFjZShyZWdFeHAsIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSArPSAoIXN0cmluZy5lbmRzV2l0aCh0aGlzLnZhbHVlLCc7JykgJiYgdGhpcy52YWx1ZS5sZW5ndGggPiAwKSA/ICc7JyArIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSA6IHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0ga2V5O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU3R5bGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdmFyIHJlZ0V4cCA9IG5ldyBSZWdFeHAoa2V5K1JFR0VYUF9QUk9QRVJUWV9TVUZGSVgsICdnaScpO1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMudmFsdWUubWF0Y2gocmVnRXhwKTtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHJlc3VsdCkpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHRbMF07XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gdmFsdWUuc3BsaXQoJzonKTtcclxuICAgICAgICBpZihzcGxpdHRlZC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzcGxpdHRlZFsxXTtcclxuICAgICAgICAgICAgcmV0dXJuIChzdHJpbmcuZW5kc1dpdGgocmVzdWx0LCAnOycpKT8gcmVzdWx0LnN1YnN0cmluZygwLHJlc3VsdC5sZW5ndGggLTEpIDogcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5jcmVhdGVWYWx1ZVN0cmluZyA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHJldHVybiBrZXkrJzonK3ZhbHVlKyc7JztcclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlO1xyXG4iLCIvKipcclxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgZnVuY3Rpb25hbGl0eSBmb3IgY3JlYXRpbmcgYW5kIGFjY2Vzc2luZyBTVkcgZWxlbWVudHMuXHJcbiAqIEFsbCBTVkcgZWxlbWVudHMgY3JlYXRlZCB3aXRoIHRoaXMgbW9kdWxlIGNhbiBiZSBhY2Nlc3NlZCBieSBJRCB0aHJvdWdoIHRoZSBpbnN0YW5jZSBvYmplY3QuXHJcbiAqXHJcbiAqIEFuIFNWRyBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGlzIG1vZHVsZSBjYW4gYmUgc2VwZXJhdGVkIGludG8gbXVsdGlwbGUgcGFydHMgd2hpY2ggY2FuIGJlIG1hbmFnZWQgc3BlcmF0bHkuXHJcbiAqIFRoZSAncm9vdCcgcGFydCB3aWxsIGJlIGNyZWF0ZWQgYnkgZGVmYXVsdC4gV2hlbiBjcmVhdGluZyBhIG5ldyBzdmcgcGFydCB5b3UgY2FuIHNldCBpdCBhcyBkZWZhdWx0IHBhcnQsIHNvIGFsbCBhY3Rpb25zXHJcbiAqIGxpa2UgaW5zZXJ0aW9ucyB3aWxsIGJlIGV4ZWN1dGVkIG9uIHRoZSBkZWZhdWx0IHBhcnQgaWYgdGhlcmUgaXMgbm8gb3RoZXIgcGFydCBhcyBhcmd1bWVudC5cclxuICovXHJcbnZhciBTVkdHZW5lcmljU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnJlcXVpcmUoJy4vZHJhZ2dhYmxlJyk7XHJcbnZhciBzaGFwZXMgPSByZXF1aXJlKCcuL2VsZW1lbnRzJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyk7XHJcblxyXG52YXIgZG9tID0gdXRpbC5kb207XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxudmFyIEhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyJyk7XHJcblxyXG52YXIgTkFNRVNQQUNFX1NWRyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcbnZhciBOQU1FU1BBQ0VfWExJTksgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XHJcblxyXG52YXIgaW5zdGFuY2VzID0ge307XHJcblxyXG4vKipcclxuICogVGhlIGNvbnN0cnVjdG9yIGluaXRpYWxpemVzIGEgbmV3IFNWRyBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gY29udGFpbmVySWQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBhY2NlcHRzIHRoZSBjb250YWluZXJJZCBlaXRoZXIgYXMgc2VsZWN0b3IgJyNjb250YWluZXJJZCcgb3IgYXMgaWQgc3RyaW5nICdjb250YWluZXJJZCcuXHJcbiAqXHJcbiAqIFRoZSBpZCBvZiB0aGUgbncgU1ZHIGVsZW1lbnQgd2lsbCBiZSB0aGUgY29udGFpbmVySWQgd2l0aCB0aGUgc3VmZml4ICdfc3ZnJyAtPiAnY29udGFpbmVySWRfc3ZnJy5cclxuICpcclxuICogQXR0cmlidXRlcyBvZiB0aGUgbmV3IFNWRyBlbGVtbnQgY2FuIGJlIHNldCB0aHJvdWdoIHRoZSBjb25zdHJ1Y3RvciBhcmd1bWVudCAnY2ZnJy5cclxuICpcclxuICogVGhlIFNWRyBjYW4gYmUgc2VwZXJhdGVkIGluIG11bHRpcGxlIHBhcnRzIHNvIHlvdSBjYW4gZWFzaWx5IGFwcGVuZCBlbGVtZW50cyB0byB0aGUgZGlmZmVyZW50IHBhcnQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgJ3Jvb3QnIHBhcnQgYXMgZGVmYXVsdC5cclxuICpcclxuICogQHBhcmFtIGNvbnRhaW5lcklkXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgU1ZHID0gZnVuY3Rpb24oY29udGFpbmVySWQsIGNmZykge1xyXG4gICAgaWYoISh0aGlzIGluc3RhbmNlb2YgU1ZHKSkge1xyXG4gICAgICAgIHJldHVybiBTVkcuZ2V0KGNvbnRhaW5lcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcblxyXG4gICAgLy9HZXQgaWQgZnJvbSBzZWxlY3RvciBpZiBpdHMgYW4gc2VsZWN0b3JcclxuICAgIHRoaXMuY29udGFpbmVySWQgPSBkb20uZ2V0UmF3SWQoY29udGFpbmVySWQpO1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJC5xQ2FjaGUoJyMnK3RoaXMuY29udGFpbmVySWQpLmdldCgwKTtcclxuXHJcbiAgICBpZighdGhpcy4kY29udGFpbmVyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQXR0ZW1wdCB0byBpbml0aWF0ZSBzdmcgc3RhZ2UgZm9yIGludmFsaWQgY29udGFpbmVySWQ6ICcrdGhpcy5jb250YWluZXJJZCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ZnSWQgPSB0aGlzLmNvbnRhaW5lcklkKydfc3ZnJztcclxuXHJcbiAgICAvLyBDcmVhdGUgU1ZHIHJvb3QgZWxlbWVudCB3aXRoIGdpdmVuIHNldHRpbmdzLlxyXG4gICAgdGhpcy5yb290ID0gbmV3IHNoYXBlcy5TdmcodGhpcywge2lkIDogdGhpcy5zdmdJZH0pO1xyXG5cclxuICAgIGNmZy5oZWlnaHQgPSBjZmcuaGVpZ2h0IHx8ICcxMDAlJztcclxuICAgIGNmZy53aWR0aCA9IGNmZy53aWR0aCAgfHwgJzEwMCUnO1xyXG5cclxuICAgIC8vIFNldCBjZmcgdmFsdWVzIGFzIHN2ZyByb290IGF0dHJpYnV0ZXNcclxuICAgIHRoaXMucm9vdC5hdHRyKGNmZyk7XHJcblxyXG4gICAgLy8gQXBwZW5kIHRoZSBzdmcgcm9vdCBlbGVtZW50IHRvIHRoZSBjb250YWluZXJub2RlXHJcbiAgICBkb20uYXBwZW5kU1ZHRWxlbWVudCh0aGlzLiRjb250YWluZXIsIHRoaXMucm9vdCk7XHJcblxyXG4gICAgLy8gVGhlIHJvb3QgcGFydCBpcyB0aGUgc3ZnIGVsZW1lbnQgaXRzZWxmXHJcbiAgICB0aGlzLnN2Z1BhcnRzID0geydyb290Jzp0aGlzLnJvb3R9O1xyXG4gICAgdGhpcy5kZWZhdWx0UGFydCA9IHRoaXMucm9vdDtcclxuXHJcbiAgICBpbnN0YW5jZXNbdGhpcy5zdmdJZF0gPSB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHN2ZyByb290IGRvbU5vZGUuXHJcbiAqIEByZXR1cm5zIHsqfSBzdmcgcm9vdCBkb21Ob2RlXHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKHRoaXMucm9vdCkgPyB0aGlzLnJvb3QuaW5zdGFuY2UoKSA6IHVuZGVmaW5lZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgY2FjaGVkIGpRdWVyeSBvYmplY3Qgb2YgdGhlIHJvb3Qgbm9kZS5cclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLiQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLnFDYWNoZSgnIycrdGhpcy5zdmdJZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB1c2VkIGZvciBpbXBvcnRpbmcgZGlhZ3JhbXMgaW50byB0aGUgc3ZnIGluc3RhbmNlLlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5zZXRSb290ID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdmFyIG5ld0lkID0gZG9tLmdldEF0dHJpYnV0ZXMoZWxlbWVudClbJ2lkJ107XHJcbiAgICB0aGlzLnJvb3QuaW5zdGFuY2UoZWxlbWVudCk7XHJcbiAgICB0aGlzLnJvb3QuYXR0cih7aWQgOiBuZXdJZH0pO1xyXG4gICAgaW5zdGFuY2VzW25ld0lkXSA9IHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgcm9vdCBlbGVtZW50IGFzIFNWR0VsZW1lbnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5nZXRSb290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgZGVmYXVsdFBhcnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfSBjdXJyZW50IGRlZmF1bHRQYXJ0XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldERlZmF1bHRQYXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0UGFydDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgbmV3IHN2ZyBwYXJ0IHdoaWNoIGlzIHJlcHJlc2VudGVkIGJ5IGEgbmV3IGdyb3VwIHdpdGhpbiB0aGUgcm9vdC5cclxuICogVGhlIHBhcnQgaWQgaXMgY29tcG9zaXRlIG9mIHRoZSBzdmcgcm9vdCBpZCBhbmQgdGhlIHBhcnRJZC5cclxuICogQnkgc2V0dGluZyB0aGUgaXNEZWZhdWx0IGFyZ3VtZW50IGFzIHRydWUgdGhlIG5ldyBwYXJ0IHdpbGwgYmUgc2V0IGFzIGRlZmF1bHQgcGFydC5cclxuICogQHBhcmFtIHBhcnRJZFxyXG4gKiBAcGFyYW0gaXNEZWZhdWx0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5jcmVhdGVQYXJ0ID0gZnVuY3Rpb24ocGFydElkLCBpc0RlZmF1bHQpIHtcclxuICAgIC8vTmV3IHBhcnRzIGFyZSBhbHdheXMgYWRkZWQgdG8gdGhlIHJvb3QgcGFydFxyXG4gICAgdGhpcy5zdmdQYXJ0c1twYXJ0SWRdID0gdGhpcy5nKHtpZDogdGhpcy5zdmdJZCsnXycrcGFydElkLCBwYXJlbnRQYXJ0OiAncm9vdCd9KTtcclxuICAgIGlmKGlzRGVmYXVsdCkge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRJZF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5zdmdQYXJ0c1twYXJ0SWRdO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5wYXJ0ID0gZnVuY3Rpb24oaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnN2Z1BhcnRzW2lkXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIHN2ZyBlbGVtZW50IHRvIHRoZSBnaXZlbiBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5hZGRUb1BhcnQgPSBmdW5jdGlvbihwYXJ0LCBlbGVtZW50KSB7XHJcbiAgICB0aGlzLmFkZFRvR3JvdXAodGhpcy5zdmdQYXJ0c1twYXJ0XSwgZWxlbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZCB0byBhcHBlbmQgb3IgcHJlcGVuZCBlbGVtZW50cyB3aXRoIHRleHQgdG8gdGhlIHN2ZyByb290LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Sb290ID0gZnVuY3Rpb24oZWxlbWVudCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gYXBwZW5kL3ByZXBlbmQgZWxlbWVudHMgd2l0aCB0ZXh0IHRvIGEgZ2l2ZW4gKG9yIGRlZmF1bHQpIHN2ZyBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZWxlbWVudCwgcGFydCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgcGFydCA9IHBhcnQgfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgZWxlbWVudC5wYXJlbnQgPSBwYXJ0O1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQocGFydCwgZWxlbWVudCwgdGV4dCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBkb20uYXBwZW5kU1ZHRWxlbWVudChwYXJ0LCBlbGVtZW50LCB0ZXh0KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBvcnRzIGFuIHhtbCBkb2N1bWVudCB0byB0aGUgZ2l2ZW4gc3ZnIHBhcnQuXHJcbiAqIEBwYXJhbSBlbGVtZW50WE1MXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihzdmdTdHIsIHBhcnQsIHByZXBlbmQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiBTVkcuZ2V0KGRvbS5pbXBvcnRTVkcocGFydCwgc3ZnU3RyLCBwcmVwZW5kKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFJlY3Qgd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5SZWN0KHRoaXMsIGNmZyksIHBhcnQpO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5oZWxwZXIgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIGlmKCF0aGlzLl9oZWxwZXIpIHtcclxuICAgICAgICB0aGlzLl9oZWxwZXIgPSBuZXcgSGVscGVyKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2hlbHBlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgVGV4dCB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLnRleHQgPSBmdW5jdGlvbih0ZXh0LCBjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLlRleHQodGhpcywgY2ZnKSwgcGFydCwgZmFsc2UpLmNvbnRlbnQodGV4dCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLnRzcGFuID0gZnVuY3Rpb24odGV4dCwgY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5UU3Bhbih0aGlzLCBjZmcpLCBwYXJ0LCBmYWxzZSkuY29udGVudCh0ZXh0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgQ2lyY2xlIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuY2lyY2xlID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5DaXJjbGUodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIENpcmNsZSB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmVsbGlwc2UgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLkVsbGlwc2UodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIEdyb3VwIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuZyA9IGZ1bmN0aW9uKGNmZykge1xyXG4gICAgdmFyIGNmZyA9IGNmZyB8fHt9O1xyXG5cclxuICAgIHZhciBwYXJlbnRQYXJ0ID0gdGhpcy5zdmdQYXJ0c1tjZmcucGFyZW50UGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG5cclxuICAgIGRlbGV0ZSBjZmcucGFydDtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB0aGlzLmFkZChuZXcgc2hhcGVzLkdyb3VwKHRoaXMsIGNmZyksIHBhcmVudFBhcnQpO1xyXG5cclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMTtpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRUb0dyb3VwOiAnK2dyb3VwLmF0dHIoJ2lkJykrJyAtICcrIGFyZ3VtZW50c1tpXS5hdHRyKCdpZCcpKTtcclxuICAgICAgICAgICAgZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3JvdXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmRzIGFuIHN2ZyBlbGVtZW50IG90IHRoZSBnaXZlbiBncm91cC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Hcm91cCA9IGZ1bmN0aW9uKGdyb3VwLCBlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYob2JqZWN0LmlzQXJyYXkoZWxlbWVudCkpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBvYmplY3QuZWFjaChlbGVtZW50LCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRvbS5hcHBlbmRTVkdFbGVtZW50KGdyb3VwLmluc3RhbmNlKCksIGVsZW1lbnQpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgZWxlbWVudCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFBhdGggd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5wYXRoID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuc3ZnUGFydHNbcGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKG5ldyBzaGFwZXMuUGF0aCh0aGlzLCBjZmcpLCBwYXJ0KTtcclxufTtcclxuXHJcblNWRy5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcclxuICAgICQodGhpcy5yb290Lmluc3RhbmNlKCkpLmVtcHR5KCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmFzU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290LnRvU3RyaW5nKCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290LmNsb25lKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYW4gU1ZHRWxlbWVudCBvdXQgb2YgdGhlIGdpdmVuIGlkIHNlbGVjdG9yIGVsZW1lbnQuXHJcbiAqIEBwYXJhbSBzZWxlY3RvclxyXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudHxleHBvcnRzfG1vZHVsZS5leHBvcnRzfVxyXG4gKi9cclxuU1ZHLmdldCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICBpZihzZWxlY3Rvci5TVkdFbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yO1xyXG4gICAgfVxyXG4gICAgLy9UT0RPOlxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICRub2RlID0gJChkb20uZ2V0SWRTZWxlY3RvcihzZWxlY3RvcikpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAkbm9kZSA9ICQoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCEkbm9kZS5sZW5ndGgpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ2NhbGwgU1ZHLmdldCBvbiBhIG5vbiBleGlzdGluZyBub2RlOiAnK3NlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9IGVsc2UgaWYoJG5vZGUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIC8vUmV0dXJuIGxpc3Qgb2YgU1ZHRWxlbWVudHNcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgJG5vZGUuZWFjaChmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goU1ZHLmdldCh0aGlzKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9SZXR1cm4gc2luZ2xlIFNWZ0VsZW1lbnRcclxuICAgICAgICB2YXIgJHN2Z1Jvb3ROb2RlID0gJCgkbm9kZS5nZXQoMCkub3duZXJTVkdFbGVtZW50KTtcclxuICAgICAgICBpZigkc3ZnUm9vdE5vZGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBzdmdJbnN0YW5jZSA9IGluc3RhbmNlc1skc3ZnUm9vdE5vZGUuYXR0cignaWQnKV07XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBTVkcuX3N2Z0luc3RhbmNlKCRub2RlLCBzdmdJbnN0YW5jZSk7XHJcbiAgICAgICAgICAgIC8vVGhpcyBlbmFibGVzICQuZWFjaCBmb3Igc2luZ2xlIHJlc3VsdHMuXHJcbiAgICAgICAgICAgIHJlc3VsdFswXSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgcmVzdWx0Lmxlbmd0aCA9IDE7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zcGxpY2UgPSBmdW5jdGlvbigpIHt9O1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ2FsbCBTVkcuZ2V0IG9uIG5vZGUgd2l0aCBubyBzdmcgcm9vdCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblNWRy5fc3ZnSW5zdGFuY2UgPSBmdW5jdGlvbigkbm9kZSwgc3ZnKSB7XHJcbiAgICB2YXIgU1ZHU2hhcGUgPSBTVkcuZ2V0U2hhcGVCeU5hbWUoJG5vZGUuZ2V0KDApLm5vZGVOYW1lKTtcclxuICAgIHJldHVybiAoU1ZHU2hhcGUpID8gbmV3IFNWR1NoYXBlKHN2ZykuaW5zdGFuY2UoJG5vZGUuZ2V0KDApKSA6IG5ldyBTVkdHZW5lcmljU2hhcGUoJG5vZGUuZ2V0KDApLCBzdmcpO1xyXG59O1xyXG5cclxuU1ZHLmdldFNoYXBlQnlOYW1lID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHNoYXBlc1t0eXBlLnRvTG93ZXJDYXNlKCldO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWRy5wcm90b3R5cGUuZ2V0ID0gU1ZHLmdldDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHO1xyXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR0VsZW1lbnQgPSByZXF1aXJlKCcuL3N2Z0VsZW1lbnQnKTtcclxuXHJcbnZhciBOQU1FU1BBQ0VfU1ZHID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcclxudmFyIE5BTUVTUEFDRV9YTElOSyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcclxudmFyIFNWR19WRVJTSU9OID0gJzEuMSc7XHJcblxyXG52YXIgU1ZHUm9vdCA9IGZ1bmN0aW9uKHN2ZywgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBjZmdbJ3htbG5zJ10gPSBOQU1FU1BBQ0VfU1ZHO1xyXG4gICAgY2ZnWyd4bWxuczp4bGluayddID0gTkFNRVNQQUNFX1hMSU5LO1xyXG4gICAgY2ZnWyd2ZXJzaW9uJ10gPSBTVkdfVkVSU0lPTjtcclxuICAgIFNWR0VsZW1lbnQuY2FsbCh0aGlzLCAnc3ZnJywgc3ZnLCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdSb290LCBTVkdFbGVtZW50KTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLnggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3gnLCB2YWx1ZSkgOiB0aGlzLmF0dHJOdW1iZXIoJ3gnKSB8fCAwIDtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLnkgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3knLCB2YWx1ZSkgOiB0aGlzLmF0dHJOdW1iZXIoJ3knKSB8fCAwIDtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLmdldENlbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4OiB0aGlzLngoKSArIE1hdGguZmxvb3IodGhpcy53aWR0aCgpIC8gMiksXHJcbiAgICAgICAgeTogdGhpcy55KCkgKyBNYXRoLmZsb29yKHRoaXMuaGVpZ2h0KCkgLyAyKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4kKCkuaGVpZ2h0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignaGVpZ2h0JywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHUm9vdC5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoIXZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgpLndpZHRoKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignd2lkdGgnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1Jvb3Q7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xyXG5cclxudmFyIFNWR0VsZW1lbnQgPSByZXF1aXJlKCcuL1NWR0VsZW1lbnQnKTtcclxuXHJcbnZhciBTVkdTaGFwZSA9IGZ1bmN0aW9uKG5hbWUsIHN2Z1Jvb3QsIGNmZywgYXR0cmlidXRlU2V0dGVyKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IGF0dHJpYnV0ZVNldHRlciB8fCB7fTtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyLnRyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3JtYXRpb25BdHRyaWJ1dGVTZXR0ZXI7XHJcbiAgICBTVkdFbGVtZW50LmNhbGwodGhpcywgbmFtZSwgc3ZnUm9vdCwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdTaGFwZSwgU1ZHRWxlbWVudCk7XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNmb3JtYXRpb25BdHRyaWJ1dGVTZXR0ZXIgPSBmdW5jdGlvbih0cm5hc2Zvcm1hdGlvblN0cmluZykge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0odHJuYXNmb3JtYXRpb25TdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldFRyYW5zZm9ybWF0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZighdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKCk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pKSB7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0odGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnRyYW5zZm9ybTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50cmFuc2Zvcm1lZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2NhbGVkWCh0aGlzLnRyYW5zbGF0ZWRYKHB4KSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNmb3JtZWRZID0gZnVuY3Rpb24ocHgpIHtcclxuICAgIHJldHVybiB0aGlzLnNjYWxlZFkodGhpcy50cmFuc2xhdGVkWShweCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnNjYWxlZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgcmV0dXJuIHB4ICogdGhpcy5zY2FsZSgpWzBdXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc2NhbGVkWSA9IGZ1bmN0aW9uKHB5KSB7XHJcbiAgICByZXR1cm4gcHkgKiB0aGlzLnNjYWxlKClbMV1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbih2YWwpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkucm90YXRlKHZhbCk7XHJcblxyXG4gICAgaWYocmVzdWx0IGluc3RhbmNlb2YgVHJhbnNmb3JtKSB7XHJcbiAgICAgICAgLy8gVGhlIHNjYWxlIHNldHRlciByZXR1cm5zIHRoZSBUcmFuc2Zvcm0gaXRzZWxmIG9iamVjdCBzbyB3ZSByZXNldCB0aGUgc2NhbGVcclxuICAgICAgICAvLyB0cmFuc2Zvcm0gYXR0cmlidXRlIGluIGRvbSAoc2V0dGVyIHdhcyBjYWxsZWQpXHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ3RyYW5zZm9ybScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBUaGUgZ2V0dGVyIGp1c3QgcmV0dXJucyB0aGUgeCx5IHZhbHVlcyBvZiB0aGUgdHJhbnNsYXRlIHRyYW5zZm9ybWF0aW9uXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHN4LCBzeSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgIGlmKHJlc3VsdCBpbnN0YW5jZW9mIFRyYW5zZm9ybSkge1xyXG4gICAgICAgIC8vIFRoZSBzY2FsZSBzZXR0ZXIgcmV0dXJucyB0aGUgVHJhbnNmb3JtIGl0c2VsZiBvYmplY3Qgc28gd2UgcmVzZXQgdGhlIHNjYWxlXHJcbiAgICAgICAgLy8gdHJhbnNmb3JtIGF0dHJpYnV0ZSBpbiBkb20gKHNldHRlciB3YXMgY2FsbGVkKVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKCd0cmFuc2Zvcm0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gVGhlIGdldHRlciBqdXN0IHJldHVybnMgdGhlIHgseSB2YWx1ZXMgb2YgdGhlIHRyYW5zbGF0ZSB0cmFuc2Zvcm1hdGlvblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoeCx5KTtcclxuXHJcbiAgICBpZihyZXN1bHQgaW5zdGFuY2VvZiBUcmFuc2Zvcm0pIHtcclxuICAgICAgICAvLyBUaGUgdHJuYXNsYXRlIHNldHRlciByZXR1cm5zIHRoZSBUcmFuc2Zvcm0gb2JqZWN0IHNvIHdlIHJlc2V0IHRoZVxyXG4gICAgICAgIC8vIHRyYW5zZm9ybSBhdHRyaWJ1dGUgaW4gZG9tIChzZXR0ZXIgd2FzIGNhbGxlZClcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgndHJhbnNmb3JtJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFRoZSBnZXR0ZXIganVzdCByZXR1cm5zIHRoZSB4LHkgdmFsdWVzIG9mIHRoZSB0cmFuc2xhdGUgdHJhbnNmb3JtYXRpb25cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZWQgPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRyYW5zbGF0ZS54ICsgcG9zaXRpb24ueCxcclxuICAgICAgICB5IDogdHJhbnNsYXRlLnkgKyBwb3NpdGlvbi55XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNsYXRlZFggPSBmdW5jdGlvbihweCkge1xyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMuZ2V0VHJhbnNmb3JtYXRpb24oKS50cmFuc2xhdGUoKTtcclxuICAgIHB4ID0gKG9iamVjdC5pc0RlZmluZWQocHgpKSA/IHB4IDogMDtcclxuICAgIHJldHVybiB0cmFuc2xhdGUueCArIHB4O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZWRZID0gZnVuY3Rpb24ocHkpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkudHJhbnNsYXRlKCk7XHJcbiAgICBweSA9IChvYmplY3QuaXNEZWZpbmVkKHB5KSkgPyBweSA6IDA7XHJcbiAgICByZXR1cm4gdHJhbnNsYXRlLnkgKyBweTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5oYXNUcmFuc2Zvcm1hdGlvbiA9IGZ1bmN0aW9uKHRyYW5zZm9ybWF0aW9uKSB7XHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pKSB7XHJcbiAgICAgICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm1bdHJhbnNmb3JtYXRpb25dKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdHlsZSgnZmlsbCcsIGNvbG9yKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5maWxsT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuICAgIHJldHVybiB0aGlzLnN0eWxlKCdmaWxsLW9wYWNpdHknLCBvcGFjaXR5KTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zdHJva2VPcGFjaXR5ID0gZnVuY3Rpb24ob3BhY2l0eSkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5Jywgb3BhY2l0eSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlID0gZnVuY3Rpb24oY29sb3IsIHdpZHRoKSB7XHJcbiAgICBpZih3aWR0aCkge1xyXG4gICAgICAgIHRoaXMuc3Ryb2tlV2lkdGgod2lkdGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuc3R5bGUoJ3N0cm9rZScsIGNvbG9yKTtcclxuXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlRGFzaGFycmF5ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYoIXR5cGUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZSgnc3Ryb2tlLWRhc2hhcnJheScpO1xyXG4gICAgfVxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKHR5cGUpKSB7XHJcbiAgICAgICAgdGhpcy5zdHlsZSgnc3Ryb2tlLWRhc2hhcnJheScsIHR5cGUpO1xyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlRGFzaFR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZighdHlwZSkge1xyXG4gICAgICAgIHN3aXRjaCh0aGlzLnN0cm9rZURhc2hhcnJheSgpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCI1LDVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICBjYXNlIFwiMTAsMTBcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICBjYXNlIFwiMjAsMTAsNSw1LDUsMTBcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAzO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzd2l0Y2godHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICcxJzpcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJva2VEYXNoYXJyYXkoXCI1LDVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnMic6XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwiMTAsMTBcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnMyc6XHJcbiAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwiMjAsMTAsNSw1LDUsMTBcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwibm9uZVwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zdHJva2VXaWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICByZXR1cm4gdXRpbC5hcHAucGFyc2VOdW1iZXJTdHJpbmcodGhpcy5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgd2lkdGgpKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICghdGhpcy5maWxsT3BhY2l0eSgpIHx8IHRoaXMuZmlsbE9wYWNpdHkoKSA+IDApXHJcbiAgICAgICAgJiYgKCF0aGlzLnN0cm9rZU9wYWNpdHkoKSB8fCB0aGlzLnN0cm9rZU9wYWNpdHkoKSA+IDApO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuZmlsbE9wYWNpdHkoMCk7XHJcbiAgICB0aGlzLnN0cm9rZU9wYWNpdHkoMCk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuICAgIG9wYWNpdHkgPSBvcGFjaXR5IHx8IDE7XHJcbiAgICB0aGlzLmZpbGxPcGFjaXR5KG9wYWNpdHkpO1xyXG4gICAgdGhpcy5zdHJva2VPcGFjaXR5KG9wYWNpdHkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgdGhlIGxvY2F0aW9uIG9mIGEgZ2l2ZW4gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHN2ZyBlbGVtZW50LlxyXG4gKiAgICAgIF90X1xyXG4gKiAgICB8XFwgICAvfFxyXG4gKiAgbCB8ICBjICB8IHJcclxuICogICAgfC9fX19cXHxcclxuICogICAgICAgYlxyXG4gKiBAcGFyYW0gbm9kZVxyXG4gKiBAcGFyYW0gcG9zaXRpb25cclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAvL0ZpcnN0IHdlIGNoZWNrIGlmIHRoZSBwb2ludCBsaWVzIGRpcmVjdCBvbiB0aGUgYm91bmRhcnlcclxuICAgIGlmKHBvc2l0aW9uLnggPT09IHRoaXMueCgpKSB7XHJcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcclxuICAgIH0gZWxzZSBpZihwb3NpdGlvbi55ID09PSB0aGlzLnkoKSkge1xyXG4gICAgICAgIHJldHVybiAndG9wJztcclxuICAgIH0gZWxzZSBpZihwb3NpdGlvbi54ID09PSB0aGlzLmdldFJpZ2h0WCgpKSB7XHJcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XHJcbiAgICB9IGVsc2UgaWYocG9zaXRpb24ueSA9PT0gdGhpcy5nZXRCb3R0b21ZKCkpIHtcclxuICAgICAgICByZXR1cm4gJ2JvdHRvbSc7XHJcbiAgICB9XHJcblxyXG4gICAgLy9JZiBpdHMgbm90IG9uIHRoZSBib3VuZGFyeSB3ZSBjaGVjayB0aGUgbG9jYXRpb24gYnkgbWVhbnMgb2YgdGhlIGxpbmUgZ3JhZGllbnRcclxuICAgIHZhciBjZW50ZXIgPSB0aGlzLmdldENlbnRlcigpO1xyXG4gICAgdmFyIGcgPSB1dGlsLm1hdGguTGluZS5jYWxjR3JhZGllbnQoY2VudGVyLCBwb3NpdGlvbik7XHJcbiAgICBpZihwb3NpdGlvbi55IDwgY2VudGVyLnkpIHsgLy9wb3NpdGlvbiBvdmVyIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICBpZiAocG9zaXRpb24ueCA+PSBjZW50ZXIueCkgeyAvL3Bvc2l0aW9uIHJpZ2h0IChvciBlcSkgb2YgZWxlbWVudGNlbnRlclxyXG4gICAgICAgICAgICByZXR1cm4gKGcgPiAtMSkgPyAncmlnaHQnIDogJ3RvcCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChnIDwgMSkgey8vcG9zaXRpb24gbGVmdCBhbmQgb3ZlciBvZiBlbGVtZW50Y2VudGVyXHJcbiAgICAgICAgICAgIHJldHVybiAoZyA8IDEpID8gJ2xlZnQnIDogJ3RvcCc7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmKHBvc2l0aW9uLnggPj0gY2VudGVyLngpIHsgLy9wb3NpdGlvbiB1bmRlciAob3IgZXEpIGFuZCByaWdodCAob3IgZXEpIG9mIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICByZXR1cm4gKGcgPCAxKSA/ICdyaWdodCcgOiAnYm90dG9tJztcclxuICAgIH0gZWxzZSB7IC8vcG9zaXRpb24gdW5kZXIgYW5kIGxlZnQgb2YgZWxlbWVudGNlbnRlclxyXG4gICAgICAgIHJldHVybiAoZyA8IC0xKSA/ICdib3R0b20nIDogJ2xlZnQnO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnggPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICByZXR1cm4gKHdpdGhTdHJva2UpID8gdGhpcy50cmFuc2xhdGVkWCh0aGlzLl9nZXRYKCkpIC0gdGhpcy5zY2FsZWRYKHRoaXMuc3Ryb2tlV2lkdGgoKSkgLyAyIDogdGhpcy50cmFuc2xhdGVkWCh0aGlzLl9nZXRYKCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLl9nZXRYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS55ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuICh3aXRoU3Ryb2tlKSA/IHRoaXMudHJhbnNsYXRlZFkodGhpcy5fZ2V0WSgpKSAtIHRoaXMuc2NhbGVkWSh0aGlzLnN0cm9rZVdpZHRoKCkpIC8gMiA6IHRoaXMudHJhbnNsYXRlZFkodGhpcy5fZ2V0WSgpKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0WSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB0aGF0Lngod2l0aFN0cm9rZSksXHJcbiAgICAgICAgeSA6IHRoYXQueSh3aXRoU3Ryb2tlKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50b3BMZWZ0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb24od2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudG9wUmlnaHQgPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB0aGF0LmdldFJpZ2h0WCh3aXRoU3Ryb2tlKSxcclxuICAgICAgICB5IDogdGhhdC55KHdpdGhTdHJva2UpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmJvdHRvbVJpZ2h0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC5nZXRSaWdodFgod2l0aFN0cm9rZSksXHJcbiAgICAgICAgeSA6IHRoYXQuZ2V0Qm90dG9tWSh3aXRoU3Ryb2tlKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5ib3R0b21MZWZ0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC54KHdpdGhTdHJva2UpLFxyXG4gICAgICAgIHkgOiB0aGF0LmdldEJvdHRvbVkod2l0aFN0cm9rZSlcclxuICAgIH07XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0Q2VudGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYyA9IHtcclxuICAgICAgICB4OiB0aGlzLngoKSArIE1hdGguZmxvb3IodGhpcy53aWR0aCgpIC8gMiksXHJcbiAgICAgICAgeTogdGhpcy55KCkgKyBNYXRoLmZsb29yKHRoaXMuaGVpZ2h0KCkgLyAyKVxyXG4gICAgfTtcclxuICAgIHJldHVybiB1dGlsLm1hdGgucm90YXRlKGMsIHRoaXMucG9zaXRpb24oKSwgdGhpcy5yb3RhdGUoKSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUub3ZlcmxheXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIG9iamVjdC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oaW5kZXgsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYodGhhdC5vdmVybGF5Q2hlY2socG9zaXRpb24pKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy9UTyBicmVhayB0aGUgZWFjaCBsb29wXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdyZXN1bHQ6JytyZXN1bHQpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIGEgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBmb3IgY2hlY2tpbmcgaWYgYSBnaXZlbiBwb3NpdGlvbiBsaWVzIHdpdGhpbiB0aGUgc3ZnRWxlbWVudC5cclxuICogVGhpcyBjYW4gYmUgb3ZlcndyaXR0ZW4gYnkgc2hhcGVzIGxpa2UgY2lyY2xlcyBhbmQgZWxsaXBzZS4uXHJcbiAqL1xyXG5TVkdTaGFwZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBwb3NpdGlvbi54ID49IHRoaXMueCgpICYmIHBvc2l0aW9uLnggPD0gdGhpcy5nZXRSaWdodFgoKVxyXG4gICAgICAgICYmIHBvc2l0aW9uLnkgPj0gdGhpcy55KCkgJiYgcG9zaXRpb24ueSA8PSB0aGlzLmdldEJvdHRvbVkoKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oZHgsIGR5KSB7XHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRlKHRyYW5zbGF0ZS54ICsgZHgsIHRyYW5zbGF0ZS55ICsgZHkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHAgPSB1dGlsLm1hdGguZ2V0UG9pbnQoeCx5KTtcclxuXHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIGlmKHRoaXMueCgpICE9PSBwLnggfHwgdGhpcy55KCkgIT09IHAueSkge1xyXG4gICAgICAgIC8vVE9ETzogdGhpcyBkb2VzIG5vdCBjb25zaWRlciB4L3kgYXR0cmlidXRlIHNldHRpbmdzXHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGUocCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlWCA9IGZ1bmN0aW9uKHgpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLnRyYW5zbGF0ZSgpO1xyXG4gICAgaWYodHJhbnNsYXRlLnggIT09IHgpIHtcclxuICAgICAgICB0aGlzLnRyYW5zbGF0ZSh4LCB0cmFuc2xhdGUueSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5tb3ZlWSA9IGZ1bmN0aW9uKHkpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLnRyYW5zbGF0ZSgpO1xyXG4gICAgaWYodHJhbnNsYXRlLnkgIT09IHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGUodHJhbnNsYXRlLngsIHkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogTm90ZTogdGhlIGltcGxlbWVudGF0aW9uIG9mIGdldEJCb3ggZGlmZmVycyBiZXR3ZWVuIGJyb3dzZXJzIHNvbWUgYWRkIHRoZSBzcm9rZS13aWR0aCBhbmQgc29tZSBkbyBub3QgYWRkIHN0cm9rZS13aWR0aFxyXG4gKi9cclxuU1ZHU2hhcGUucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZigob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGVkWSh0aGlzLl9nZXRIZWlnaHQoKSkgKyB0aGlzLnNjYWxlZFkodGhpcy5zdHJva2VXaWR0aCgpKTtcclxuICAgIH0gZWxzZSBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgKG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY2FsZWRZKHRoaXMuX2dldEhlaWdodCgpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fc2V0SGVpZ2h0KHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCQm94KCkuaGVpZ2h0O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLl9zZXRIZWlnaHQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZigob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGVkWCh0aGlzLl9nZXRXaWR0aCgpKSArIHRoaXMuc2NhbGVkWCh0aGlzLnN0cm9rZVdpZHRoKCkpO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSB8fCAob2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlZFgodGhpcy5fZ2V0V2lkdGgoKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldFdpZHRoKHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0V2lkdGggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJCb3goKS53aWR0aDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fc2V0V2lkdGggPSBmdW5jdGlvbigpIHtcclxuICAgLy9BQlNUUkFDVFxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldEJvdHRvbVkgPSBmdW5jdGlvbih3aXRoU3Ryb2tlKSB7XHJcbiAgICByZXR1cm4gdGhpcy55KHdpdGhTdHJva2UpICsgdGhpcy5oZWlnaHQod2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZ2V0UmlnaHRYID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuIHRoaXMueCh3aXRoU3Ryb2tlKSArIHRoaXMud2lkdGgod2l0aFN0cm9rZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1NoYXBlOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgREVGQVVMVF9GT05UX1NJWkUgPSAxMTtcclxudmFyIERFRkFVTFRfRk9OVF9GQU1JTFkgPSBcIkhlbHZldGljYVwiOyAvL1ZlcmRhbmEsIEFyaWFsLCBzYW5zLXNlcmlmID9cclxudmFyIERFRkFVTFRfVEVYVF9BTkNIT1IgPSBcInN0YXJ0XCI7XHJcbnZhciBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FID0gXCJoYW5naW5nXCI7XHJcblxyXG52YXIgREVGQVVMVF9TUEFOX1BBRERJTkcgPSAwO1xyXG5cclxudmFyIFNWR1RleHQgPSBmdW5jdGlvbihzdmdSb290LCBjZmcsIGF0dHJpYnV0ZVNldHRlcikge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgY2ZnWydmb250LWZhbWlseSddID0gY2ZnWydmb250LXNpemUnXSB8fCBERUZBVUxUX0ZPTlRfRkFNSUxZO1xyXG4gICAgY2ZnWydmb250LXNpemUnXSA9IGNmZ1snZm9udC1zaXplJ10gfHwgREVGQVVMVF9GT05UX1NJWkU7XHJcbiAgICBjZmdbJ3RleHQtYW5jaG9yJ10gPSBjZmdbJ3RleHQtYW5jaG9yJ10gfHwgREVGQVVMVF9URVhUX0FOQ0hPUjtcclxuICAgIGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSA9IGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSB8fCBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FO1xyXG5cclxuICAgIHRoaXMuc3BhblBhZGRpbmcgPSBjZmdbJ3BhZGRpbmcnXSB8fCBERUZBVUxUX1NQQU5fUEFERElORztcclxuXHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICd0ZXh0Jywgc3ZnUm9vdCwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpO1xyXG4gICAgLy9UT0RPOiBTcGFuIC8gbXVsdGkgbGluZSB0ZXh0XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR1RleHQsIFNWR1NoYXBlKTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnBhZGRpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICB0aGlzLnNwYW5QYWRkaW5nID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5zZXRTcGFuQXR0cigneCcsIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhblBhZGRpbmc7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5mb250RmFtaWx5ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2ZvbnQtZmFtaWx5JywgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZm9udFNpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYodmFsdWUpIHtcclxuICAgICAgICB2YWx1ZSA9IG9iamVjdC5pc051bWJlcih2YWx1ZSkgPyB2YWx1ZSsncHgnIDogdmFsdWU7XHJcbiAgICB9XHJcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5hdHRyTnVtYmVyKCdmb250LXNpemUnLCB2YWx1ZSk7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuc2V0U3BhbkF0dHIoJ2R5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuc2V0U3BhbkF0dHIgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICB0aGlzLiQoKS5jaGlsZHJlbigndHNwYW4nKS5hdHRyKGtleSwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS54ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpID8gdGhpcy5hdHRyTnVtYmVyKCd4JywgdmFsdWUpIDogdGhpcy50cmFuc2xhdGVkWCh0aGlzLmF0dHJOdW1iZXIoJ3gnLCB2YWx1ZSkpIHx8IDAgO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUueSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKG9iamVjdC5pc0RlZmluZWQodmFsdWUpKSA/IHRoaXMuYXR0ck51bWJlcigneScsIHZhbHVlKSA6IHRoaXMudHJhbnNsYXRlZFkodGhpcy5hdHRyTnVtYmVyKCd5JywgdmFsdWUpKSB8fCAwIDtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmR4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ2R4JywgdmFsdWUpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZHkgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0ck51bWJlcignZHknLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oZHgsIGR5KSB7XHJcbiAgICBTVkdUZXh0LnN1cGVyXy5wcm90b3R5cGUubW92ZS5hcHBseSh0aGlzLCBbZHgsIGR5XSk7XHJcbiAgICB0aGlzLmFsaWduQmFja2dyb3VuZCgpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgU1ZHVGV4dC5zdXBlcl8ucHJvdG90eXBlLm1vdmVUby5hcHBseSh0aGlzLCBbeCwgeV0pO1xyXG4gICAgdGhpcy5hbGlnbkJhY2tncm91bmQoKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmNvbnRlbnQgPSBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICBpZighdGV4dCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFRleHQoKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB2YXIgaGVpZ2h0O1xyXG4gICAgdGhpcy4kKCkuZW1wdHkoKTtcclxuICAgICQuZWFjaCh0ZXh0LnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgJiYgdmFsdWUudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHRTcGFuID0gdGhhdC5zdmcudHNwYW4odmFsdWUpLngodGhhdC5zcGFuUGFkZGluZyk7XHJcbiAgICAgICAgICAgIHRoYXQuYXBwZW5kKHRTcGFuKTtcclxuICAgICAgICAgICAgaWYoaW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0U3Bhbi5keShoZWlnaHQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gdFNwYW4uaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZ2V0VGV4dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xyXG4gICAgdmFyICRjaGlsZHJlbiA9IHRoaXMuJCgpLmNoaWxkcmVuKCd0c3BhbicpO1xyXG4gICAgJGNoaWxkcmVuLmVhY2goZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9ICQodGhpcykudGV4dCgpO1xyXG4gICAgICAgIGlmKGluZGV4ICE9ICRjaGlsZHJlbi5sZW5ndGggLTEpIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnN3aXRjaEFuY2hvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgc3dpdGNoKHRoaXMuYW5jaG9yKCkpIHtcclxuICAgICAgICBjYXNlICdzdGFydCc6XHJcbiAgICAgICAgICAgIHRoaXMuZW5kKCk7XHJcbiAgICAgICAgY2FzZSAnZW5kJzpcclxuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZ2V0RXh0ZW50T2ZDaGFyID0gZnVuY3Rpb24oY2hhck51bSkge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UoKS5nZXRFeHRlbnRPZkNoYXIoY2hhck51bSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5nZXRDaGFySGVpZ2h0ID0gZnVuY3Rpb24oY2hhck51bSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0RXh0ZW50T2ZDaGFyKGNoYXJOdW0pLmhlaWdodDtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hbmNob3IoJ3N0YXJ0Jyk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmFuY2hvcignZW5kJyk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5taWRkbGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmFuY2hvcignbWlkZGxlJyk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5hbmNob3IgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigndGV4dC1hbmNob3InLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS50U3BhbiA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdmcuZ2V0KHRoaXMuJCgpLmNoaWxkcmVuKCd0c3BhbicpLmdldChpbmRleCkpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuaGFuZ2luZyA9IGZ1bmN0aW9uKGhhbmdpbmcpIHtcclxuICAgIHZhciBoYW5naW5nID0gb2JqZWN0LmlzRGVmaW5lZChoYW5naW5nKSA/IGhhbmdpbmcgOiB0cnVlO1xyXG4gICAgdmFyIHZhbHVlID0gaGFuZ2luZyA/ICdoYW5naW5nJyA6ICdiYXNlbGluZSc7XHJcbiAgICB0aGlzLmF0dHIoJ2RvbWluYW50LWJhc2VsaW5lJywgdmFsdWUpO1xyXG4gICAgdmFyIGZpcnN0U3BhbiA9IHRoaXMudFNwYW4oMCk7XHJcbiAgICB2YXIgZHkgPSAoaGFuZ2luZykgPyAwIDogZmlyc3RTcGFuLmhlaWdodCgpICsgdGhpcy5nZXRCQm94KCkueTtcclxuICAgIGZpcnN0U3Bhbi5keShkeSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOb3RlOiB0aGUgYmFja2dyb3VuZCB3b24ndCBhbGlnbiB3aGVuIHRoZSB0ZXh0IGlzIGRyYWdnZWQuIFBlcmhhcHMgYWRkIGRyYWcgaG9va1xyXG4gKiBAcGFyYW0gY29sb3JcclxuICovXHJcblNWR1RleHQucHJvdG90eXBlLmJhY2tncm91bmQgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gICAgdmFyIHN2Z0JhY2tncm91bmQgPSB0aGlzLmdldEJhY2tncm91bmQoKTtcclxuICAgIGlmKGNvbG9yKSB7XHJcbiAgICAgICAgaWYoIXN2Z0JhY2tncm91bmQpIHtcclxuICAgICAgICAgICAgc3ZnQmFja2dyb3VuZCA9IHRoaXMuc3ZnLnJlY3QoeydjbGFzcyc6J3RleHRCYWNrZ3JvdW5kJ30pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdmdCYWNrZ3JvdW5kLmZpbGwoY29sb3IpO1xyXG4gICAgICAgIHN2Z0JhY2tncm91bmQuJCgpLmFmdGVyKHRoaXMuJCgpKTtcclxuICAgICAgICB0aGlzLmFsaWduQmFja2dyb3VuZCgpO1xyXG4gICAgfSBlbHNlIGlmKHN2Z0JhY2tncm91bmQpIHtcclxuICAgICAgICBzdmdCYWNrZ3JvdW5kLmZpbGwoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqICBUT0RPOiBwcm9iYWJseSBqdXN0IHdvcmtzIGZvciBoYW5naW5nIHRleHRzIGJlY2F1c2Ugb2YgdGhlIG9mZnNldC4uLlxyXG4gKi9cclxuU1ZHVGV4dC5wcm90b3R5cGUuYWxpZ25CYWNrZ3JvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc3ZnQmFja2dyb3VuZCA9IHRoaXMuZ2V0QmFja2dyb3VuZCgpO1xyXG4gICAgaWYoc3ZnQmFja2dyb3VuZCkge1xyXG4gICAgICAgIHZhciBiZ0hlaWdodCA9IHRoaXMuaGVpZ2h0KCkgKyB0aGlzLmdldEJCb3goKS55OyAvL3JlbW92ZSB0ZXh0IG9mZnNldFxyXG4gICAgICAgIHN2Z0JhY2tncm91bmQuaGVpZ2h0KGJnSGVpZ2h0KS53aWR0aCh0aGlzLndpZHRoKCkpLnRyYW5zbGF0ZSh0aGlzLngoKSwgdGhpcy55KCkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZ2V0QmFja2dyb3VuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYodGhpcy5iYWNrZ3JvdW5kU1ZHKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2dyb3VuZFNWRztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJldiA9IHRoaXMuJCgpLnByZXYoKTtcclxuICAgIGlmKHByZXYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBzdmdCYWNrID0gdGhpcy5zdmcuZ2V0KHByZXYpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tncm91bmRTVkcgPSAoc3ZnQmFjay5oYXNDbGFzcygndGV4dEJhY2tncm91bmQnKSkgPyBzdmdCYWNrIDogdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZG9taW5hbnRCYXNlbGluZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdkb21pbmFudC1iYXNlbGluZScsIHZhbHVlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHVGV4dDsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gdXRpbC5vYmplY3Q7XHJcbnZhciBEb21FbGVtZW50ID0gcmVxdWlyZSgnLi4vZG9tL2RvbUVsZW1lbnQnKTtcclxuXHJcbnZhciBUcmFuc2Zvcm0gPSBmdW5jdGlvbihkZWYpIHtcclxuICAgIGlmKHR5cGVvZiBkZWYgIT09ICd1bmRlZmluZWQnICkge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc1N0cmluZyhkZWYpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RGVmaW5pdGlvbkZyb21TdHJpbmcoZGVmKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24gPSBkZWY7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRlZmluaXRpb24gPSB7fTtcclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0RGVmaW5pdGlvbkZyb21TdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoIXRoaXMuZGVmaW5pdGlvbikge1xyXG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGV4dHJhY3QgJ3RyYW5zbGF0ZSgyMDAgMjAwKSByb3RhdGUoNDUgNTAgNTApJyB0byBcInRyYW5zbGF0ZVwiIFwiMjAwIDIwMFwiIFwiIHJvdGF0ZVwiIFwiNDUgNTAgNTBcIiBcIlwiXHJcbiAgICB2YXIgdHJhbnNmb3JtYXRpb25zID0gdmFsdWUuc3BsaXQoL1tcXChcXCldKy8pO1xyXG4gICAgZm9yKHZhciBpID0gMDtpIDwgdHJhbnNmb3JtYXRpb25zLmxlbmd0aDsgaSArPSAyKSB7XHJcbiAgICAgICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gdHJhbnNmb3JtYXRpb25zW2ldLnRyaW0oKTtcclxuICAgICAgICBpZih0cmFuc2Zvcm1hdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBEb21FbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlRnJvbVN0cmluZ0xpc3QodHJhbnNmb3JtYXRpb25zW2krMV0pO1xyXG4gICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBwcmVmZXIgZmxvYXQgdmFsdWVzIGZvciBjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZXNbal0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2pdID0gcGFyc2VGbG9hdCh2YWx1ZXNbal0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvblt0cmFuc2Zvcm1hdGlvbl0gPSB2YWx1ZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgZm9yKHZhciBrZXkgaW4gdGhpcy5kZWZpbml0aW9uKSB7XHJcbiAgICAgICAgaWYodGhpcy5kZWZpbml0aW9uLmhhc093blByb3BlcnR5KChrZXkpKSkge1xyXG4gICAgICAgICAgICAvLyBmaXJzdCB3ZSBhc3NhbWJsZSBhbGwgdHJhbnNmb3JtYXRpb25zIGluIGFuIGFycmF5IFsndHJhbnNsYXRlKDMwKScsJ3JvdGF0ZSg0NSA1MCA1MCknXVxyXG4gICAgICAgICAgICB2YXIgc2luZ2xlVHJhbnNmb3JtYXRpb24gPSBrZXkrJygnK0RvbUVsZW1lbnQuZ2V0QXR0cmlidXRlU3RyaW5nKHRoaXMuZGVmaW5pdGlvbltrZXldKSsnKSc7XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHNpbmdsZVRyYW5zZm9ybWF0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBtZXJnZSB0aGUgdHJhbnNmb3JtYXRpb25zIHRvIG9uZSBhdHRyaWJ1dGVzdHJpbmdcclxuICAgIHZhciB2YWx1ZVN0ciA9IERvbUVsZW1lbnQuZ2V0QXR0cmlidXRlU3RyaW5nKHZhbHVlcyk7XHJcblxyXG4gICAgaWYodmFsdWVTdHIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZVN0cjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSBhbnkgdHJhbnNvcm1hdGlvbnMgc2V0IHdlIGp1c3QgcmV0dXJuIGFuIGVtcHR5IHN0cmluZ1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuaGFzVHJhbnNmb3JtYXRpb24gPSBmdW5jdGlvbihrZXkpIHtcclxuICAgIHJldHVybiAodHlwZW9mIHRoaXMuZGVmaW5pdGlvbltrZXldICE9PSAndW5kZWZpbmVkJyk7XHJcbn07XHJcblxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbih2YWwpIHtcclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodmFsKSkge1xyXG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbi5yb3RhdGUgPSB2YWw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRlZmluaXRpb24ucm90YXRlIHx8IDA7XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc3gsIHN5KSB7XHJcbiAgICBzeSA9IHN5IHx8IHN4O1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChzeCkpIHtcclxuICAgICAgICBpZighdGhpcy5kZWZpbml0aW9uLnNjYWxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi5zY2FsZSA9IFtzeCwgc3ldO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi5zY2FsZVswXSA9IHN4O1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluaXRpb24uc2NhbGVbMV0gPSBzeTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmRlZmluaXRpb24uc2NhbGU7XHJcbiAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHRbMF0sIHJlc3VsdFswXV07XHJcbiAgICAgICAgfSBlbHNlIGlmKHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcmVzdWx0WzBdLCByZXN1bHRbMV1dXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFsxLDFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2NhbGUgPSBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgIGlmKGluZGV4IDwgMiAmJiB0aGlzLmRlZmluaXRpb24uc2NhbGUpIHtcclxuICAgICAgICB0aGlzLmRlZmluaXRpb24uc2NhbGVbaW5kZXhdID0gdmFsdWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBwID0gdXRpbC5tYXRoLmdldFBvaW50KHgseSk7XHJcblxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChwKSkge1xyXG4gICAgICAgIGlmKCF0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGUgPSBbcC54LCBwLnldO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGVbMF0gPSBwLng7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGVbMV0gPSBwLnk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZih0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB4IDogdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZVswXSxcclxuICAgICAgICAgICAgICAgIHkgOiB0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlWzFdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHggOiAwLFxyXG4gICAgICAgICAgICAgICAgeSA6IDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBTVkdTaGFwZSA9IHJlcXVpcmUoJy4vc3ZnU2hhcGUnKTtcclxudmFyIFNWR1RleHQgPSByZXF1aXJlKCcuL3RleHQnKTtcclxuXHJcbnZhciBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FID0gJ2luaGVyaXQnXHJcblxyXG52YXIgU1ZHVFNwYW4gPSBmdW5jdGlvbihzdmdSb290LCBjZmcpIHtcclxuICAgIGNmZyA9IGNmZyB8fCB7fTtcclxuICAgIGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSA9IGNmZ1snZG9taW5hbnQtYmFzZWxpbmUnXSB8fCBERUZBVUxUX0RPTUlOQU5UX0JBU0VMSU5FO1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAndHNwYW4nLCBzdmdSb290LCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdUU3BhbiwgU1ZHVGV4dCk7XHJcblxyXG5TVkdUU3Bhbi5wcm90b3R5cGUuZ2V0Q29udGFpbmVyVGV4dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50KCk7XHJcbiAgICBpZihwYXJlbnQudGFnTmFtZSA9PT0gJ3RleHQnKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcmVudDtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1RTcGFuLnByb3RvdHlwZS5mb250U2l6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiBTVkdUU3Bhbi5zdXBlcl8ucHJvdG90eXBlLmZvbnRTaXplLmFwcGx5KHRoaXMsIFt2YWx1ZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gU1ZHVFNwYW4uc3VwZXJfLnByb3RvdHlwZS5mb250U2l6ZS5hcHBseSh0aGlzKTtcclxuICAgICAgICBpZighcmVzdWx0KSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXJUZXh0ID0gdGhpcy5nZXRDb250YWluZXJUZXh0KCk7XHJcbiAgICAgICAgICAgIHJldHVybiAoY29udGFpbmVyVGV4dCkgPyBjb250YWluZXJUZXh0LmZvbnRTaXplKCkgOiAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVFNwYW4ucHJvdG90eXBlLmNvbnRlbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYodmFsdWUpIHtcclxuICAgICAgICB0aGlzLiQoKS50ZXh0KHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgpLnRleHQoKTtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1RTcGFuLnByb3RvdHlwZS5nZXRCQm94ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL3NvbWUgYnJvd3NlciAoZS5nLiBmaXJlZm94KSBkb2VzIG5vdCBpbXBsZW1lbnQgdGhlIGdldEJCb3ggZm9yIHRzcGFuIGVsZW1lbnRzLlxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1RTcGFuOyIsInZhciBTVkcgPSByZXF1aXJlKCcuLi9zdmcvc3ZnJyk7XHJcbnZhciBzdHJpbmcgPSByZXF1aXJlKCcuLi91dGlsL3N0cmluZycpO1xyXG52YXIgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NvcmUvY2FjaGUnKTtcclxuXHJcbiQuZm4uc3ZnID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIGlmKHNlbGVjdG9yICYmIHNlbGVjdG9yLlNWR0VsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gc2VsZWN0b3I7XHJcbiAgICB9IGVsc2UgaWYoc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gJChzZWxlY3Rvcikuc3ZnKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoIXRoaXMubGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfSBlbHNlIGlmKHRoaXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIFNWRy5nZXQodGhpcyk7XHJcbiAgICB9IGVsc2UgaWYodGhpcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9ICBbXTtcclxuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKFNWRy5nZXQodGhpcykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4kLnN2ZyA9ICQuZm4uc3ZnO1xyXG5cclxuJC5xQ2FjaGUgPSBmdW5jdGlvbihzZWxlY3RvciwgcHJldmVudENhY2hlKSB7XHJcbiAgICBpZihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlLiQoc2VsZWN0b3IsIHByZXZlbnRDYWNoZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5xVW5jYWNoZSA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICByZXR1cm4gcXVlcnlDYWNoZS5yZW1vdmUoc2VsZWN0b3IpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBwcm9ibGVtIHdpdGggdWktc2VsZWN0bWVudSBpcyB0aGF0IGl0IGNhdXNlcyBhIHNlY29uZCBrZXlkb3duIHRyaWdnZXIgZXZlbnQgd2hlbiBmb2N1c2VkLlxyXG4gKiBTbyBnbG9iYWwga2V5ZG93biBldmVudHMgYXJlIHRyaWdnZXJlZCB0d2ljaGUgbGlrZSBkby91bmRvIGlmIGZvY3VzZWQuIFRoZSBmb2xsb3dpbmcgZXZlbnRcclxuICogcHJldmVudHMgdGhlIHByb3BhZ2F0aW9uIGlmIHRoZSBjb250cm9sIGtleSBpcyBwcmVzc2VkLlxyXG4gKi9cclxuJChkb2N1bWVudCwgJy51aS1zZWxlY3RtZW51LWJ1dHRvbicpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICBpZihldnQuY3RybEtleSkge1xyXG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4kLmZuLmdyb3dsID0gZnVuY3Rpb24ocGFyYW1zKSB7XHJcbiAgICB2YXIgJHJvb3QgPSB0aGlzO1xyXG5cclxuICAgIC8vIHRvb2x0aXAgY29udGVudCBhbmQgc3R5bGluZ1xyXG4gICAgdmFyICRjb250ZW50ID0gJChcclxuICAgICAgICAnPGEgY2xhc3M9XCJpY29uLWNsb3NlXCIgaHJlZj1cIiNcIj48L2E+JytcclxuICAgICAgICAnPGgxIHN0eWxlPVwiY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDEycHQ7IGZvbnQtd2VpZ2h0OiBib2xkOyBwYWRkaW5nLWJvdHRvbTogNXB4O1wiPicgKyBwYXJhbXMudGl0bGUgKyAnPC9oMT4nICtcclxuICAgICAgICAnPHAgc3R5bGU9XCJtYXJnaW46IDA7IHBhZGRpbmc6IDVweCAwIDVweCAwOyBmb250LXNpemU6IDEwcHQ7XCI+JyArIHBhcmFtcy50ZXh0ICsgJzwvcD4nKTtcclxuXHJcbiAgICAvLyBhZGQgJ0Nsb3NlJyBidXR0b24gZnVuY3Rpb25hbGl0eVxyXG4gICAgdmFyICRjbG9zZSA9ICQoJGNvbnRlbnRbMF0pO1xyXG4gICAgJGNsb3NlLmNsaWNrKGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAkcm9vdC51aXRvb2x0aXAoJ2Nsb3NlJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IHN0YW5kYXJkIHRvb2x0aXAgZnJvbSBjbG9zaW5nXHJcbiAgICAkcm9vdC5iaW5kKCdmb2N1c291dCBtb3VzZWxlYXZlJywgZnVuY3Rpb24oZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcblxyXG4gICAgLy8gYnVpbGQgdG9vbHRpcFxyXG4gICAgJHJvb3QudWl0b29sdGlwKHtcclxuICAgICAgICBjb250ZW50OiBmdW5jdGlvbigpIHsgcmV0dXJuICRjb250ZW50OyB9LFxyXG4gICAgICAgIGl0ZW1zOiAkcm9vdC5zZWxlY3RvcixcclxuICAgICAgICB0b29sdGlwQ2xhc3M6ICdncm93bCAnICsgcGFyYW1zLmdyb3dsQ2xhc3MsXHJcbiAgICAgICAgcG9zaXRpb246IHtcclxuICAgICAgICAgICAgbXk6ICdyaWdodCB0b3AnLFxyXG4gICAgICAgICAgICBhdDogJ3JpZ2h0LTEwIHRvcCsxMCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xyXG4gICAgICAgICAgICAkcm9vdC51aXRvb2x0aXAoJ2Rlc3Ryb3knKTtcclxuICAgICAgICB9XHJcbiAgICB9KS51aXRvb2x0aXAoJ29wZW4nKTtcclxuXHJcbiAgICBpZihwYXJhbXMuY2xvc2VBZnRlcikge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgJHJvb3QudWl0b29sdGlwKCdjbG9zZScpOyB9LCBwYXJhbXMuY2xvc2VBZnRlcik7XHJcbiAgICB9XHJcbn07XHJcblxyXG5pZigkLnVpKSB7XHJcbiAgICAkLndpZGdldCggXCJjdXN0b20uaWNvbnNlbGVjdG1lbnVcIiwgJC51aS5zZWxlY3RtZW51LCB7XHJcbiAgICAgICAgX3JlbmRlckl0ZW06IGZ1bmN0aW9uKCB1bCwgaXRlbSApIHtcclxuICAgICAgICAgICAgdmFyIGxpID0gJCggXCI8bGk+XCIsIHsgdGV4dDogaXRlbS5sYWJlbCB9ICk7XHJcbiAgICAgICAgICAgIGlmICggaXRlbS5kaXNhYmxlZCApIHtcclxuICAgICAgICAgICAgICAgIGxpLmFkZENsYXNzKCBcInVpLXN0YXRlLWRpc2FibGVkXCIgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKCBcIjxzcGFuPlwiLCB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZTogaXRlbS5lbGVtZW50LmF0dHIoIFwiZGF0YS1zdHlsZVwiICksXHJcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwidWktaWNvbiBcIiArIGl0ZW0uZWxlbWVudC5hdHRyKCBcImRhdGEtY2xhc3NcIiApXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYXBwZW5kVG8oIGxpICk7XHJcbiAgICAgICAgICAgIHJldHVybiBsaS5hcHBlbmRUbyggdWwgKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvYmplY3Q6IHJlcXVpcmUoJy4vb2JqZWN0JyksXHJcbiAgICBzdHJpbmc6IHJlcXVpcmUoJy4vc3RyaW5nJyksXHJcbiAgICBkb206IHJlcXVpcmUoJy4vLi4vZG9tL2RvbScpLFxyXG4gICAgYXBwOiByZXF1aXJlKCcuL2FwcCcpLFxyXG4gICAgbWF0aDogcmVxdWlyZSgnLi9tYXRoJyksXHJcbiAgICB4bWwgOiByZXF1aXJlKCcuL3htbCcpLFxyXG4gICAgaW5oZXJpdHM6IHV0aWwuaW5oZXJpdHNcclxufSIsIi8qKlxyXG4gKiBUaGlzIG1vZHVsZSBzZXJ2ZXMgYXMgYW4gd3JhcHBlciBmb3IgZG9tIG1hbmlwdWxhdGlvbiBmdW5jdGlvbmFsaXR5LiBJdCBpc1xyXG4gKiBoaWdobHkgcHJlZmVyZWQgdG8gdXNlIHRoaXMgbW9kdWxlIGluc3RlYWQgb2YganF1ZXJ5IGRpcmVjdGx5IHdpdGhpbiBvdGhlclxyXG4gKiBtb2R1bGVzLlxyXG4gKi9cclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4vb2JqZWN0Jyk7XHJcblxyXG52YXIgcGFyc2VGZWF0dXJlU3RyaW5ncyA9IGZ1bmN0aW9uKHZhbHVlLCBkZWZhdWx0VmFsKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICB2YWx1ZSA9IHZhbHVlLnNwbGl0KCcgJyk7XHJcbiAgICBvYmplY3QuZWFjaCh2YWx1ZSwgZnVuY3Rpb24oaW5kZXgsIGZlYXR1cmUpIHtcclxuICAgICAgICByZXN1bHRbaW5kZXhdID0gcGFyc2VGZWF0dXJlU3RyaW5nKGZlYXR1cmUsIGRlZmF1bHRWYWwpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHBhcnNlIGEgZmVhdHVyZXN0aW5yZyBpbiB0aGUgZm9ybSBvZlxyXG4gKiAgJ2ZlYXR1cmVuYW1lKDMwLDMwKScgb3IgJ2ZlYXR1cmVuYW1lKDMwLjQpIG9yIGZlYXR1cmVuYW1lXHJcbiAqXHJcbiAqIFRoZSByZXN1bHQgaXMgd291bGQgYmVcclxuICogICAgICB7IHR5cGUgOiAnZmVhdHVyZW5hbWUnLCB2YWx1ZSA6IFszMCwzMF0gfVxyXG4gKiAgICAgIHsgdHlwZSA6ICdmZWF0dXJlbmFtZScsIHZhbHVlIDogMzAuNCB9XHJcbiAqICAgICAgeyB0eXBlIDogJ2ZlYXR1cmVuYW1lJywgdmFsdWUgOiB1bmRlZmluZWQgfVxyXG4gKiBAcGFyYW0ge3R5cGV9IGZlYXR1cmVcclxuICogQHJldHVybnMge0FwcF9MNi5wYXJzZUZlYXR1cmVTdHJpbmcucmVzdWx0fVxyXG4gKi9cclxudmFyIHBhcnNlRmVhdHVyZVN0cmluZyA9IGZ1bmN0aW9uKGZlYXR1cmUsIGRlZmF1bHRWYWwpIHtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmKGZlYXR1cmUuaW5kZXhPZignKCcpID4gLTEpIHtcclxuICAgICAgICB2YXIgc3BsaXR0ZWQgPSBmZWF0dXJlLnNwbGl0KCcoJyk7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gc3BsaXR0ZWRbMV0uc3Vic3RyaW5nKDAsIHNwbGl0dGVkWzFdLmluZGV4T2YoJyknKSk7XHJcblxyXG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoJywnKSA+IC0xKSB7IC8vIG11bHRpcGxlIGFyZ3NcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgnLCcpO1xyXG4gICAgICAgICAgICBvYmplY3QuZWFjaCh2YWx1ZSwgZnVuY3Rpb24oaW5kZXgsIHYpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlW2luZGV4XSA9IHBhcnNlTnVtYmVyU3RyaW5nKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBzaW5nbGUgYXJnXHJcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VOdW1iZXJTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQudHlwZSA9IHNwbGl0dGVkWzBdO1xyXG4gICAgICAgIHJlc3VsdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQudHlwZSA9IGZlYXR1cmU7XHJcbiAgICAgICAgcmVzdWx0LnZhbHVlID0gZGVmYXVsdFZhbDtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VOdW1iZXJTdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoIW9iamVjdC5pc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy9DdXQgdW5pdHMgMS4yZW0gLT4gMS4yXHJcbiAgICB2YWx1ZSA9IHZhbHVlLnNwbGl0KC8oPz1bYS16LEEtWl0rKS8pWzBdO1xyXG5cclxuICAgIGlmKCFpc05hTih2YWx1ZSkpIHtcclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKCcuJykgPiAtMSkgeyAvL2Zsb2F0XHJcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy9pbnRcclxuICAgICAgICAgICAgdmFsdWUgPSBwYXJzZUludCh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5cclxudmFyIGNyZWF0ZUZlYXR1cmVTdHJpbmcgPSBmdW5jdGlvbihmZWF0dXJlLCB2YWx1ZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IGZlYXR1cmU7XHJcblxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICByZXN1bHQgKz0gJygnO1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICBvYmplY3QuZWFjaCh2YWx1ZSwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gKGluZGV4ICE9PSAwKSA/ICcsJyt2YWx1ZSA6IHZhbHVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQgKz0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdCArPSAnKSc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIGlzTWluRGlzdCA9IGZ1bmN0aW9uKGZyb20sIHRvLCBtaW5EaXN0KSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnModG8ueCAtIGZyb20ueCkgPiBtaW5EaXN0IHx8IE1hdGguYWJzKHRvLnkgLSBmcm9tLnkpID4gbWluRGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcGFyc2VGZWF0dXJlU3RyaW5nOnBhcnNlRmVhdHVyZVN0cmluZyxcclxuICAgIGNyZWF0ZUZlYXR1cmVTdHJpbmc6Y3JlYXRlRmVhdHVyZVN0cmluZyxcclxuICAgIHBhcnNlRmVhdHVyZVN0cmluZ3M6cGFyc2VGZWF0dXJlU3RyaW5ncyxcclxuICAgIHBhcnNlTnVtYmVyU3RyaW5nIDogcGFyc2VOdW1iZXJTdHJpbmcsXHJcbiAgICBpc01pbkRpc3QgOiBpc01pbkRpc3RcclxufTtcclxuIiwiLyoqXHJcbiAqIG1vc3QgQmV6aWVyIGhlbHB0ZXIgZnVuY3Rpb25zIGFyZSB0YWtlbiBmcm9tIGpzQmV6aWVyIGxpYnJhcnkgaHR0cHM6Ly9naXRodWIuY29tL2pzcGx1bWIvanNCZXppZXIvYmxvYi9tYXN0ZXIvanMvMC42L2pzQmV6aWVyLTAuNi5qc1xyXG4gKiBjaGVjayAvbGlicy9qc0Jlemllci5qcyBmb3IgbW9yZSBmdW5jdGlvbnMgaWYgcmVxdWlyZWQuXHJcbiAqXHJcbiAqXHJcbiAqL1xyXG5cclxuaWYgKHR5cGVvZiBNYXRoLnNnbiA9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICBNYXRoLnNnbiA9IGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgcmV0dXJuIHggPT0gMCA/IDAgOiB4ID4gMCA/IDEgOiAtMTtcclxuICAgIH07XHJcbn1cclxuXHJcbnZhciBWZWN0b3JzID0ge1xyXG4gICAgICAgIHN1YnRyYWN0OiBmdW5jdGlvbiAodjEsIHYyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7eDogdjEueCAtIHYyLngsIHk6IHYxLnkgLSB2Mi55fTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRvdFByb2R1Y3Q6IGZ1bmN0aW9uICh2MSwgdjIpIHtcclxuICAgICAgICAgICAgcmV0dXJuICh2MS54ICogdjIueCkgKyAodjEueSAqIHYyLnkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3F1YXJlOiBmdW5jdGlvbiAodikge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KCh2LnggKiB2LngpICsgKHYueSAqIHYueSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2NhbGU6IGZ1bmN0aW9uICh2LCBzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7eDogdi54ICogcywgeTogdi55ICogc307XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBtYXhSZWN1cnNpb24gPSA2NCxcclxuICAgIGZsYXRuZXNzVG9sZXJhbmNlID0gTWF0aC5wb3coMi4wLCAtbWF4UmVjdXJzaW9uIC0gMSk7XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIG5lYXJlc3QgcG9pbnQgb24gdGhlIGN1cnZlIHRvIHRoZSBnaXZlbiBwb2ludC5cclxuICovXHJcbnZhciBfbmVhcmVzdFBvaW50T25DdXJ2ZSA9IGZ1bmN0aW9uIChwb2ludCwgY3VydmUpIHtcclxuICAgIHZhciB0ZCA9IF9kaXN0YW5jZUZyb21DdXJ2ZShwb2ludCwgY3VydmUpO1xyXG4gICAgcmV0dXJuIHtwb2ludDogX2JlemllcihjdXJ2ZSwgY3VydmUubGVuZ3RoIC0gMSwgdGQubG9jYXRpb24sIG51bGwsIG51bGwpLCBsb2NhdGlvbjogdGQubG9jYXRpb259O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGRpc3RhbmNlIHRoYXQgdGhlIHBvaW50IGxpZXMgZnJvbSB0aGUgY3VydmUuXHJcbiAqXHJcbiAqIEBwYXJhbSBwb2ludCBhIHBvaW50IGluIHRoZSBmb3JtIHt4OjU2NywgeTozMzQyfVxyXG4gKiBAcGFyYW0gY3VydmUgYSBCZXppZXIgY3VydmUgaW4gdGhlIGZvcm0gW3t4Oi4uLiwgeTouLi59LCB7eDouLi4sIHk6Li4ufSwge3g6Li4uLCB5Oi4uLn0sIHt4Oi4uLiwgeTouLi59XS4gIG5vdGUgdGhhdCB0aGlzIGlzIGN1cnJlbnRseVxyXG4gKiBoYXJkY29kZWQgdG8gYXNzdW1lIGN1Yml6IGJlemllcnMsIGJ1dCB3b3VsZCBiZSBiZXR0ZXIgb2ZmIHN1cHBvcnRpbmcgYW55IGRlZ3JlZS5cclxuICogQHJldHVybiBhIEpTIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5pbmcgbG9jYXRpb24gYW5kIGRpc3RhbmNlLCBmb3IgZXhhbXBsZToge2xvY2F0aW9uOjAuMzUsIGRpc3RhbmNlOjEwfS4gIExvY2F0aW9uIGlzIGFuYWxvZ291cyB0byB0aGUgbG9jYXRpb25cclxuICogYXJndW1lbnQgeW91IHBhc3MgdG8gdGhlIHBvaW50T25QYXRoIGZ1bmN0aW9uOiBpdCBpcyBhIHJhdGlvIG9mIGRpc3RhbmNlIHRyYXZlbGxlZCBhbG9uZyB0aGUgY3VydmUuICBEaXN0YW5jZSBpcyB0aGUgZGlzdGFuY2UgaW4gcGl4ZWxzIGZyb21cclxuICogdGhlIHBvaW50IHRvIHRoZSBjdXJ2ZS5cclxuICovXHJcbnZhciBfZGlzdGFuY2VGcm9tQ3VydmUgPSBmdW5jdGlvbiAocG9pbnQsIGN1cnZlKSB7XHJcbiAgICB2YXIgY2FuZGlkYXRlcyA9IFtdLFxyXG4gICAgICAgIHcgPSBfY29udmVydFRvQmV6aWVyKHBvaW50LCBjdXJ2ZSksXHJcbiAgICAgICAgZGVncmVlID0gY3VydmUubGVuZ3RoIC0gMSwgaGlnaGVyRGVncmVlID0gKDIgKiBkZWdyZWUpIC0gMSxcclxuICAgICAgICBudW1Tb2x1dGlvbnMgPSBfZmluZFJvb3RzKHcsIGhpZ2hlckRlZ3JlZSwgY2FuZGlkYXRlcywgMCksXHJcbiAgICAgICAgdiA9IFZlY3RvcnMuc3VidHJhY3QocG9pbnQsIGN1cnZlWzBdKSwgZGlzdCA9IFZlY3RvcnMuc3F1YXJlKHYpLCB0ID0gMC4wO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtU29sdXRpb25zOyBpKyspIHtcclxuICAgICAgICB2ID0gVmVjdG9ycy5zdWJ0cmFjdChwb2ludCwgX2JlemllcihjdXJ2ZSwgZGVncmVlLCBjYW5kaWRhdGVzW2ldLCBudWxsLCBudWxsKSk7XHJcbiAgICAgICAgdmFyIG5ld0Rpc3QgPSBWZWN0b3JzLnNxdWFyZSh2KTtcclxuICAgICAgICBpZiAobmV3RGlzdCA8IGRpc3QpIHtcclxuICAgICAgICAgICAgZGlzdCA9IG5ld0Rpc3Q7XHJcbiAgICAgICAgICAgIHQgPSBjYW5kaWRhdGVzW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHYgPSBWZWN0b3JzLnN1YnRyYWN0KHBvaW50LCBjdXJ2ZVtkZWdyZWVdKTtcclxuICAgIG5ld0Rpc3QgPSBWZWN0b3JzLnNxdWFyZSh2KTtcclxuICAgIGlmIChuZXdEaXN0IDwgZGlzdCkge1xyXG4gICAgICAgIGRpc3QgPSBuZXdEaXN0O1xyXG4gICAgICAgIHQgPSAxLjA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge2xvY2F0aW9uOiB0LCBkaXN0YW5jZTogZGlzdH07XHJcbn07XHJcblxyXG52YXIgX2NvbnZlcnRUb0JlemllciA9IGZ1bmN0aW9uIChwb2ludCwgY3VydmUpIHtcclxuICAgIHZhciBkZWdyZWUgPSBjdXJ2ZS5sZW5ndGggLSAxLCBoaWdoZXJEZWdyZWUgPSAoMiAqIGRlZ3JlZSkgLSAxLFxyXG4gICAgICAgIGMgPSBbXSwgZCA9IFtdLCBjZFRhYmxlID0gW10sIHcgPSBbXSxcclxuICAgICAgICB6ID0gW1sxLjAsIDAuNiwgMC4zLCAwLjFdLCBbMC40LCAwLjYsIDAuNiwgMC40XSwgWzAuMSwgMC4zLCAwLjYsIDEuMF1dO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGRlZ3JlZTsgaSsrKSBjW2ldID0gVmVjdG9ycy5zdWJ0cmFjdChjdXJ2ZVtpXSwgcG9pbnQpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gZGVncmVlIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgZFtpXSA9IFZlY3RvcnMuc3VidHJhY3QoY3VydmVbaSArIDFdLCBjdXJ2ZVtpXSk7XHJcbiAgICAgICAgZFtpXSA9IFZlY3RvcnMuc2NhbGUoZFtpXSwgMy4wKTtcclxuICAgIH1cclxuICAgIGZvciAodmFyIHJvdyA9IDA7IHJvdyA8PSBkZWdyZWUgLSAxOyByb3crKykge1xyXG4gICAgICAgIGZvciAodmFyIGNvbHVtbiA9IDA7IGNvbHVtbiA8PSBkZWdyZWU7IGNvbHVtbisrKSB7XHJcbiAgICAgICAgICAgIGlmICghY2RUYWJsZVtyb3ddKSBjZFRhYmxlW3Jvd10gPSBbXTtcclxuICAgICAgICAgICAgY2RUYWJsZVtyb3ddW2NvbHVtbl0gPSBWZWN0b3JzLmRvdFByb2R1Y3QoZFtyb3ddLCBjW2NvbHVtbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAoaSA9IDA7IGkgPD0gaGlnaGVyRGVncmVlOyBpKyspIHtcclxuICAgICAgICBpZiAoIXdbaV0pIHdbaV0gPSBbXTtcclxuICAgICAgICB3W2ldLnkgPSAwLjA7XHJcbiAgICAgICAgd1tpXS54ID0gcGFyc2VGbG9hdChpKSAvIGhpZ2hlckRlZ3JlZTtcclxuICAgIH1cclxuICAgIHZhciBuID0gZGVncmVlLCBtID0gZGVncmVlIC0gMTtcclxuICAgIGZvciAodmFyIGsgPSAwOyBrIDw9IG4gKyBtOyBrKyspIHtcclxuICAgICAgICB2YXIgbGIgPSBNYXRoLm1heCgwLCBrIC0gbSksXHJcbiAgICAgICAgICAgIHViID0gTWF0aC5taW4oaywgbik7XHJcbiAgICAgICAgZm9yIChpID0gbGI7IGkgPD0gdWI7IGkrKykge1xyXG4gICAgICAgICAgICBqID0gayAtIGk7XHJcbiAgICAgICAgICAgIHdbaSArIGpdLnkgKz0gY2RUYWJsZVtqXVtpXSAqIHpbal1baV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHc7XHJcbn07XHJcbi8qKlxyXG4gKiBjb3VudHMgaG93IG1hbnkgcm9vdHMgdGhlcmUgYXJlLlxyXG4gKi9cclxudmFyIF9maW5kUm9vdHMgPSBmdW5jdGlvbiAodywgZGVncmVlLCB0LCBkZXB0aCkge1xyXG4gICAgdmFyIGxlZnQgPSBbXSwgcmlnaHQgPSBbXSxcclxuICAgICAgICBsZWZ0X2NvdW50LCByaWdodF9jb3VudCxcclxuICAgICAgICBsZWZ0X3QgPSBbXSwgcmlnaHRfdCA9IFtdO1xyXG5cclxuICAgIHN3aXRjaCAoX2dldENyb3NzaW5nQ291bnQodywgZGVncmVlKSkge1xyXG4gICAgICAgIGNhc2UgMCA6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAxIDpcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChkZXB0aCA+PSBtYXhSZWN1cnNpb24pIHtcclxuICAgICAgICAgICAgICAgIHRbMF0gPSAod1swXS54ICsgd1tkZWdyZWVdLngpIC8gMi4wO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKF9pc0ZsYXRFbm91Z2godywgZGVncmVlKSkge1xyXG4gICAgICAgICAgICAgICAgdFswXSA9IF9jb21wdXRlWEludGVyY2VwdCh3LCBkZWdyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX2Jlemllcih3LCBkZWdyZWUsIDAuNSwgbGVmdCwgcmlnaHQpO1xyXG4gICAgbGVmdF9jb3VudCA9IF9maW5kUm9vdHMobGVmdCwgZGVncmVlLCBsZWZ0X3QsIGRlcHRoICsgMSk7XHJcbiAgICByaWdodF9jb3VudCA9IF9maW5kUm9vdHMocmlnaHQsIGRlZ3JlZSwgcmlnaHRfdCwgZGVwdGggKyAxKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVmdF9jb3VudDsgaSsrKSB0W2ldID0gbGVmdF90W2ldO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByaWdodF9jb3VudDsgaSsrKSB0W2kgKyBsZWZ0X2NvdW50XSA9IHJpZ2h0X3RbaV07XHJcbiAgICByZXR1cm4gKGxlZnRfY291bnQgKyByaWdodF9jb3VudCk7XHJcbn07XHJcbnZhciBfZ2V0Q3Jvc3NpbmdDb3VudCA9IGZ1bmN0aW9uIChjdXJ2ZSwgZGVncmVlKSB7XHJcbiAgICB2YXIgbl9jcm9zc2luZ3MgPSAwLCBzaWduLCBvbGRfc2lnbjtcclxuICAgIHNpZ24gPSBvbGRfc2lnbiA9IE1hdGguc2duKGN1cnZlWzBdLnkpO1xyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gZGVncmVlOyBpKyspIHtcclxuICAgICAgICBzaWduID0gTWF0aC5zZ24oY3VydmVbaV0ueSk7XHJcbiAgICAgICAgaWYgKHNpZ24gIT0gb2xkX3NpZ24pIG5fY3Jvc3NpbmdzKys7XHJcbiAgICAgICAgb2xkX3NpZ24gPSBzaWduO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5fY3Jvc3NpbmdzO1xyXG59O1xyXG52YXIgX2lzRmxhdEVub3VnaCA9IGZ1bmN0aW9uIChjdXJ2ZSwgZGVncmVlKSB7XHJcbiAgICB2YXIgZXJyb3IsXHJcbiAgICAgICAgaW50ZXJjZXB0XzEsIGludGVyY2VwdF8yLCBsZWZ0X2ludGVyY2VwdCwgcmlnaHRfaW50ZXJjZXB0LFxyXG4gICAgICAgIGEsIGIsIGMsIGRldCwgZEludiwgYTEsIGIxLCBjMSwgYTIsIGIyLCBjMjtcclxuICAgIGEgPSBjdXJ2ZVswXS55IC0gY3VydmVbZGVncmVlXS55O1xyXG4gICAgYiA9IGN1cnZlW2RlZ3JlZV0ueCAtIGN1cnZlWzBdLng7XHJcbiAgICBjID0gY3VydmVbMF0ueCAqIGN1cnZlW2RlZ3JlZV0ueSAtIGN1cnZlW2RlZ3JlZV0ueCAqIGN1cnZlWzBdLnk7XHJcblxyXG4gICAgdmFyIG1heF9kaXN0YW5jZV9hYm92ZSA9IG1heF9kaXN0YW5jZV9iZWxvdyA9IDAuMDtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGRlZ3JlZTsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gYSAqIGN1cnZlW2ldLnggKyBiICogY3VydmVbaV0ueSArIGM7XHJcbiAgICAgICAgaWYgKHZhbHVlID4gbWF4X2Rpc3RhbmNlX2Fib3ZlKVxyXG4gICAgICAgICAgICBtYXhfZGlzdGFuY2VfYWJvdmUgPSB2YWx1ZTtcclxuICAgICAgICBlbHNlIGlmICh2YWx1ZSA8IG1heF9kaXN0YW5jZV9iZWxvdylcclxuICAgICAgICAgICAgbWF4X2Rpc3RhbmNlX2JlbG93ID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgYTEgPSAwLjA7XHJcbiAgICBiMSA9IDEuMDtcclxuICAgIGMxID0gMC4wO1xyXG4gICAgYTIgPSBhO1xyXG4gICAgYjIgPSBiO1xyXG4gICAgYzIgPSBjIC0gbWF4X2Rpc3RhbmNlX2Fib3ZlO1xyXG4gICAgZGV0ID0gYTEgKiBiMiAtIGEyICogYjE7XHJcbiAgICBkSW52ID0gMS4wIC8gZGV0O1xyXG4gICAgaW50ZXJjZXB0XzEgPSAoYjEgKiBjMiAtIGIyICogYzEpICogZEludjtcclxuICAgIGEyID0gYTtcclxuICAgIGIyID0gYjtcclxuICAgIGMyID0gYyAtIG1heF9kaXN0YW5jZV9iZWxvdztcclxuICAgIGRldCA9IGExICogYjIgLSBhMiAqIGIxO1xyXG4gICAgZEludiA9IDEuMCAvIGRldDtcclxuICAgIGludGVyY2VwdF8yID0gKGIxICogYzIgLSBiMiAqIGMxKSAqIGRJbnY7XHJcbiAgICBsZWZ0X2ludGVyY2VwdCA9IE1hdGgubWluKGludGVyY2VwdF8xLCBpbnRlcmNlcHRfMik7XHJcbiAgICByaWdodF9pbnRlcmNlcHQgPSBNYXRoLm1heChpbnRlcmNlcHRfMSwgaW50ZXJjZXB0XzIpO1xyXG4gICAgZXJyb3IgPSByaWdodF9pbnRlcmNlcHQgLSBsZWZ0X2ludGVyY2VwdDtcclxuICAgIHJldHVybiAoZXJyb3IgPCBmbGF0bmVzc1RvbGVyYW5jZSkgPyAxIDogMDtcclxufTtcclxudmFyIF9jb21wdXRlWEludGVyY2VwdCA9IGZ1bmN0aW9uIChjdXJ2ZSwgZGVncmVlKSB7XHJcbiAgICB2YXIgWExLID0gMS4wLCBZTEsgPSAwLjAsXHJcbiAgICAgICAgWE5NID0gY3VydmVbZGVncmVlXS54IC0gY3VydmVbMF0ueCwgWU5NID0gY3VydmVbZGVncmVlXS55IC0gY3VydmVbMF0ueSxcclxuICAgICAgICBYTUsgPSBjdXJ2ZVswXS54IC0gMC4wLCBZTUsgPSBjdXJ2ZVswXS55IC0gMC4wLFxyXG4gICAgICAgIGRldCA9IFhOTSAqIFlMSyAtIFlOTSAqIFhMSywgZGV0SW52ID0gMS4wIC8gZGV0LFxyXG4gICAgICAgIFMgPSAoWE5NICogWU1LIC0gWU5NICogWE1LKSAqIGRldEludjtcclxuICAgIHJldHVybiAwLjAgKyBYTEsgKiBTO1xyXG59O1xyXG5cclxudmFyIF9iZXppZXIgPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSwgdCwgbGVmdCwgcmlnaHQpIHtcclxuICAgIHZhciB0ZW1wID0gW1tdXTtcclxuICAgIGZvciAodmFyIGogPSAwOyBqIDw9IGRlZ3JlZTsgaisrKSB0ZW1wWzBdW2pdID0gY3VydmVbal07XHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBkZWdyZWU7IGkrKykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDw9IGRlZ3JlZSAtIGk7IGorKykge1xyXG4gICAgICAgICAgICBpZiAoIXRlbXBbaV0pIHRlbXBbaV0gPSBbXTtcclxuICAgICAgICAgICAgaWYgKCF0ZW1wW2ldW2pdKSB0ZW1wW2ldW2pdID0ge307XHJcbiAgICAgICAgICAgIHRlbXBbaV1bal0ueCA9ICgxLjAgLSB0KSAqIHRlbXBbaSAtIDFdW2pdLnggKyB0ICogdGVtcFtpIC0gMV1baiArIDFdLng7XHJcbiAgICAgICAgICAgIHRlbXBbaV1bal0ueSA9ICgxLjAgLSB0KSAqIHRlbXBbaSAtIDFdW2pdLnkgKyB0ICogdGVtcFtpIC0gMV1baiArIDFdLnk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGxlZnQgIT0gbnVsbClcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDw9IGRlZ3JlZTsgaisrKSBsZWZ0W2pdID0gdGVtcFtqXVswXTtcclxuICAgIGlmIChyaWdodCAhPSBudWxsKVxyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPD0gZGVncmVlOyBqKyspIHJpZ2h0W2pdID0gdGVtcFtkZWdyZWUgLSBqXVtqXTtcclxuXHJcbiAgICByZXR1cm4gKHRlbXBbZGVncmVlXVswXSk7XHJcbn07XHJcblxyXG52YXIgX2N1cnZlRnVuY3Rpb25DYWNoZSA9IHt9O1xyXG52YXIgX2dldEN1cnZlRnVuY3Rpb25zID0gZnVuY3Rpb24gKG9yZGVyKSB7XHJcbiAgICB2YXIgZm5zID0gX2N1cnZlRnVuY3Rpb25DYWNoZVtvcmRlcl07XHJcbiAgICBpZiAoIWZucykge1xyXG4gICAgICAgIGZucyA9IFtdO1xyXG4gICAgICAgIHZhciBmX3Rlcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5wb3codCwgb3JkZXIpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbF90ZXJtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucG93KCgxIC0gdCksIG9yZGVyKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNfdGVybSA9IGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRfdGVybSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25lX21pbnVzX3RfdGVybSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxIC0gdDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF90ZXJtRnVuYyA9IGZ1bmN0aW9uICh0ZXJtcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVybXMubGVuZ3RoOyBpKyspIHAgPSBwICogdGVybXNbaV0odCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHA7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBmbnMucHVzaChuZXcgZl90ZXJtKCkpOyAgLy8gZmlyc3QgaXMgdCB0byB0aGUgcG93ZXIgb2YgdGhlIGN1cnZlIG9yZGVyXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBvcmRlcjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXJtcyA9IFtuZXcgY190ZXJtKG9yZGVyKV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgKG9yZGVyIC0gaSk7IGorKykgdGVybXMucHVzaChuZXcgdF90ZXJtKCkpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGk7IGorKykgdGVybXMucHVzaChuZXcgb25lX21pbnVzX3RfdGVybSgpKTtcclxuICAgICAgICAgICAgZm5zLnB1c2gobmV3IF90ZXJtRnVuYyh0ZXJtcykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmbnMucHVzaChuZXcgbF90ZXJtKCkpOyAgLy8gbGFzdCBpcyAoMS10KSB0byB0aGUgcG93ZXIgb2YgdGhlIGN1cnZlIG9yZGVyXHJcblxyXG4gICAgICAgIF9jdXJ2ZUZ1bmN0aW9uQ2FjaGVbb3JkZXJdID0gZm5zO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmbnM7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIGNhbGN1bGF0ZXMgYSBwb2ludCBvbiB0aGUgY3VydmUsIGZvciBhIEJlemllciBvZiBhcmJpdHJhcnkgb3JkZXIuXHJcbiAqIEBwYXJhbSBjdXJ2ZSBhbiBhcnJheSBvZiBjb250cm9sIHBvaW50cywgZWcgW3t4OjEwLHk6MjB9LCB7eDo1MCx5OjUwfSwge3g6MTAwLHk6MTAwfSwge3g6MTIwLHk6MTAwfV0uICBGb3IgYSBjdWJpYyBiZXppZXIgdGhpcyBzaG91bGQgaGF2ZSBmb3VyIHBvaW50cy5cclxuICogQHBhcmFtIGxvY2F0aW9uIGEgZGVjaW1hbCBpbmRpY2F0aW5nIHRoZSBkaXN0YW5jZSBhbG9uZyB0aGUgY3VydmUgdGhlIHBvaW50IHNob3VsZCBiZSBsb2NhdGVkIGF0LiAgdGhpcyBpcyB0aGUgZGlzdGFuY2UgYWxvbmcgdGhlIGN1cnZlIGFzIGl0IHRyYXZlbHMsIHRha2luZyB0aGUgd2F5IGl0IGJlbmRzIGludG8gYWNjb3VudC4gIHNob3VsZCBiZSBhIG51bWJlciBmcm9tIDAgdG8gMSwgaW5jbHVzaXZlLlxyXG4gKi9cclxudmFyIF9wb2ludE9uUGF0aCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24pIHtcclxuICAgIHZhciBjYyA9IF9nZXRDdXJ2ZUZ1bmN0aW9ucyhjdXJ2ZS5sZW5ndGggLSAxKSxcclxuICAgICAgICBfeCA9IDAsIF95ID0gMDtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VydmUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBfeCA9IF94ICsgKGN1cnZlW2ldLnggKiBjY1tpXShsb2NhdGlvbikpO1xyXG4gICAgICAgIF95ID0gX3kgKyAoY3VydmVbaV0ueSAqIGNjW2ldKGxvY2F0aW9uKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHt4OiBfeCwgeTogX3l9O1xyXG59O1xyXG5cclxudmFyIF9kaXN0ID0gZnVuY3Rpb24gKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMS54IC0gcDIueCwgMikgKyBNYXRoLnBvdyhwMS55IC0gcDIueSwgMikpO1xyXG59O1xyXG5cclxudmFyIF9pc1BvaW50ID0gZnVuY3Rpb24gKGN1cnZlKSB7XHJcbiAgICByZXR1cm4gY3VydmVbMF0ueCA9PSBjdXJ2ZVsxXS54ICYmIGN1cnZlWzBdLnkgPT0gY3VydmVbMV0ueTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBmaW5kcyB0aGUgcG9pbnQgdGhhdCBpcyAnZGlzdGFuY2UnIGFsb25nIHRoZSBwYXRoIGZyb20gJ2xvY2F0aW9uJy4gIHRoaXMgbWV0aG9kIHJldHVybnMgYm90aCB0aGUgeCx5IGxvY2F0aW9uIG9mIHRoZSBwb2ludCBhbmQgYWxzb1xyXG4gKiBpdHMgJ2xvY2F0aW9uJyAocHJvcG9ydGlvbiBvZiB0cmF2ZWwgYWxvbmcgdGhlIHBhdGgpOyB0aGUgbWV0aG9kIGJlbG93IC0gX3BvaW50QWxvbmdQYXRoRnJvbSAtIGNhbGxzIHRoaXMgbWV0aG9kIGFuZCBqdXN0IHJldHVybnMgdGhlXHJcbiAqIHBvaW50LlxyXG4gKi9cclxudmFyIF9wb2ludEFsb25nUGF0aCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKSB7XHJcblxyXG4gICAgaWYgKF9pc1BvaW50KGN1cnZlKSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHBvaW50OiBjdXJ2ZVswXSxcclxuICAgICAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJldiA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgbG9jYXRpb24pLFxyXG4gICAgICAgIHRhbGx5ID0gMCxcclxuICAgICAgICBjdXJMb2MgPSBsb2NhdGlvbixcclxuICAgICAgICBkaXJlY3Rpb24gPSBkaXN0YW5jZSA+IDAgPyAxIDogLTEsXHJcbiAgICAgICAgY3VyID0gbnVsbDtcclxuXHJcbiAgICB3aGlsZSAodGFsbHkgPCBNYXRoLmFicyhkaXN0YW5jZSkpIHtcclxuICAgICAgICBjdXJMb2MgKz0gKDAuMDA1ICogZGlyZWN0aW9uKTtcclxuICAgICAgICBjdXIgPSBfcG9pbnRPblBhdGgoY3VydmUsIGN1ckxvYyk7XHJcbiAgICAgICAgdGFsbHkgKz0gX2Rpc3QoY3VyLCBwcmV2KTtcclxuICAgICAgICBwcmV2ID0gY3VyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtwb2ludDogY3VyLCBsb2NhdGlvbjogY3VyTG9jfTtcclxufTtcclxuXHJcbnZhciBfbGVuZ3RoID0gZnVuY3Rpb24gKGN1cnZlKSB7XHJcbiAgICBpZiAoX2lzUG9pbnQoY3VydmUpKSByZXR1cm4gMDtcclxuXHJcbiAgICB2YXIgcHJldiA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgMCksXHJcbiAgICAgICAgdGFsbHkgPSAwLFxyXG4gICAgICAgIGN1ckxvYyA9IDAsXHJcbiAgICAgICAgZGlyZWN0aW9uID0gMSxcclxuICAgICAgICBjdXIgPSBudWxsO1xyXG5cclxuICAgIHdoaWxlIChjdXJMb2MgPCAxKSB7XHJcbiAgICAgICAgY3VyTG9jICs9ICgwLjAwNSAqIGRpcmVjdGlvbik7XHJcbiAgICAgICAgY3VyID0gX3BvaW50T25QYXRoKGN1cnZlLCBjdXJMb2MpO1xyXG4gICAgICAgIHRhbGx5ICs9IF9kaXN0KGN1ciwgcHJldik7XHJcbiAgICAgICAgcHJldiA9IGN1cjtcclxuICAgIH1cclxuICAgIHJldHVybiB0YWxseTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBmaW5kcyB0aGUgcG9pbnQgdGhhdCBpcyAnZGlzdGFuY2UnIGFsb25nIHRoZSBwYXRoIGZyb20gJ2xvY2F0aW9uJy5cclxuICovXHJcbnZhciBfcG9pbnRBbG9uZ1BhdGhGcm9tID0gZnVuY3Rpb24gKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpIHtcclxuICAgIHJldHVybiBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkucG9pbnQ7XHJcbn07XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIGxvY2F0aW9uIHRoYXQgaXMgJ2Rpc3RhbmNlJyBhbG9uZyB0aGUgcGF0aCBmcm9tICdsb2NhdGlvbicuXHJcbiAqL1xyXG52YXIgX2xvY2F0aW9uQWxvbmdQYXRoRnJvbSA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gX3BvaW50QWxvbmdQYXRoKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpLmxvY2F0aW9uO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHJldHVybnMgdGhlIGdyYWRpZW50IG9mIHRoZSBjdXJ2ZSBhdCB0aGUgZ2l2ZW4gbG9jYXRpb24sIHdoaWNoIGlzIGEgZGVjaW1hbCBiZXR3ZWVuIDAgYW5kIDEgaW5jbHVzaXZlLlxyXG4gKlxyXG4gKiB0aGFua3MgLy8gaHR0cDovL2JpbWl4dWFsLm9yZy9BbmltYXRpb25MaWJyYXJ5L2JlemllcnRhbmdlbnRzLmh0bWxcclxuICovXHJcbnZhciBfZ3JhZGllbnRBdFBvaW50ID0gZnVuY3Rpb24gKGN1cnZlLCBsb2NhdGlvbikge1xyXG4gICAgdmFyIHAxID0gX3BvaW50T25QYXRoKGN1cnZlLCBsb2NhdGlvbiksXHJcbiAgICAgICAgcDIgPSBfcG9pbnRPblBhdGgoY3VydmUuc2xpY2UoMCwgY3VydmUubGVuZ3RoIC0gMSksIGxvY2F0aW9uKSxcclxuICAgICAgICBkeSA9IHAyLnkgLSBwMS55LCBkeCA9IHAyLnggLSBwMS54O1xyXG4gICAgcmV0dXJuIGR5ID09IDAgPyBJbmZpbml0eSA6IE1hdGguYXRhbihkeSAvIGR4KTtcclxufTtcclxuXHJcbi8qKlxyXG4gcmV0dXJucyB0aGUgZ3JhZGllbnQgb2YgdGhlIGN1cnZlIGF0IHRoZSBwb2ludCB3aGljaCBpcyAnZGlzdGFuY2UnIGZyb20gdGhlIGdpdmVuIGxvY2F0aW9uLlxyXG4gaWYgdGhpcyBwb2ludCBpcyBncmVhdGVyIHRoYW4gbG9jYXRpb24gMSwgdGhlIGdyYWRpZW50IGF0IGxvY2F0aW9uIDEgaXMgcmV0dXJuZWQuXHJcbiBpZiB0aGlzIHBvaW50IGlzIGxlc3MgdGhhbiBsb2NhdGlvbiAwLCB0aGUgZ3JhZGllbnQgYXQgbG9jYXRpb24gMCBpcyByZXR1cm5lZC5cclxuICovXHJcbnZhciBfZ3JhZGllbnRBdFBvaW50QWxvbmdQYXRoRnJvbSA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKSB7XHJcbiAgICB2YXIgcCA9IF9wb2ludEFsb25nUGF0aChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKTtcclxuICAgIGlmIChwLmxvY2F0aW9uID4gMSkgcC5sb2NhdGlvbiA9IDE7XHJcbiAgICBpZiAocC5sb2NhdGlvbiA8IDApIHAubG9jYXRpb24gPSAwO1xyXG4gICAgcmV0dXJuIF9ncmFkaWVudEF0UG9pbnQoY3VydmUsIHAubG9jYXRpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGNhbGN1bGF0ZXMgYSBsaW5lIHRoYXQgaXMgJ2xlbmd0aCcgcGl4ZWxzIGxvbmcsIHBlcnBlbmRpY3VsYXIgdG8sIGFuZCBjZW50ZXJlZCBvbiwgdGhlIHBhdGggYXQgJ2Rpc3RhbmNlJyBwaXhlbHMgZnJvbSB0aGUgZ2l2ZW4gbG9jYXRpb24uXHJcbiAqIGlmIGRpc3RhbmNlIGlzIG5vdCBzdXBwbGllZCwgdGhlIHBlcnBlbmRpY3VsYXIgZm9yIHRoZSBnaXZlbiBsb2NhdGlvbiBpcyBjb21wdXRlZCAoaWUuIHdlIHNldCBkaXN0YW5jZSB0byB6ZXJvKS5cclxuICovXHJcbnZhciBfcGVycGVuZGljdWxhclRvUGF0aEF0ID0gZnVuY3Rpb24gKGN1cnZlLCBsb2NhdGlvbiwgbGVuZ3RoLCBkaXN0YW5jZSkge1xyXG4gICAgZGlzdGFuY2UgPSBkaXN0YW5jZSA9PSBudWxsID8gMCA6IGRpc3RhbmNlO1xyXG4gICAgdmFyIHAgPSBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSksXHJcbiAgICAgICAgbSA9IF9ncmFkaWVudEF0UG9pbnQoY3VydmUsIHAubG9jYXRpb24pLFxyXG4gICAgICAgIF90aGV0YTIgPSBNYXRoLmF0YW4oLTEgLyBtKSxcclxuICAgICAgICB5ID0gbGVuZ3RoIC8gMiAqIE1hdGguc2luKF90aGV0YTIpLFxyXG4gICAgICAgIHggPSBsZW5ndGggLyAyICogTWF0aC5jb3MoX3RoZXRhMik7XHJcbiAgICByZXR1cm4gW3t4OiBwLnBvaW50LnggKyB4LCB5OiBwLnBvaW50LnkgKyB5fSwge3g6IHAucG9pbnQueCAtIHgsIHk6IHAucG9pbnQueSAtIHl9XTtcclxufTtcclxuXHJcbnZhciBfY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyA9IGZ1bmN0aW9uKEspIHtcclxuICAgIHZhciByZXN1bHRQMSA9IFtdO1xyXG4gICAgdmFyIHJlc3VsdFAyID0gW107XHJcbiAgICB2YXIgbiA9IEsubGVuZ3RoLTE7XHJcblxyXG4gICAgLypyaHMgdmVjdG9yIGluaXQgbGVmdCBtb3N0IHNlZ21lbnQqL1xyXG4gICAgdmFyIGEgPSBbMF07XHJcbiAgICB2YXIgYiA9IFsyXTtcclxuICAgIHZhciBjID0gWzFdO1xyXG4gICAgdmFyIHIgPSBbS1swXSArIDIgKiBLWzFdXTtcclxuXHJcbiAgICAvKmludGVybmFsIHNlZ21lbnRzKi9cclxuICAgIGZvcihpID0gMTsgaSA8IG4gLSAxOyBpKyspIHtcclxuICAgICAgICBhW2ldID0gMTtcclxuICAgICAgICBiW2ldID0gNDtcclxuICAgICAgICBjW2ldID0gMTtcclxuICAgICAgICByW2ldID0gNCAqIEtbaV0gKyAyICogS1tpKzFdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qcmlnaHQgc2VnbWVudCovXHJcbiAgICBhW24tMV0gPSAyO1xyXG4gICAgYltuLTFdID0gNztcclxuICAgIGNbbi0xXSA9IDA7XHJcbiAgICByW24tMV0gPSA4ICogS1tuLTFdICsgS1tuXTtcclxuXHJcbiAgICAvKnNvbHZlcyBBeD1iIHdpdGggdGhlIFRob21hcyBhbGdvcml0aG0qL1xyXG4gICAgZm9yKGkgPSAxOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgbSA9IGFbaV0gLyBiW2ktMV07XHJcbiAgICAgICAgYltpXSA9IGJbaV0gLSBtICogY1tpIC0gMV07XHJcbiAgICAgICAgcltpXSA9IHJbaV0gLSBtICogcltpLTFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdFAxW24tMV0gPSByW24tMV0gLyBiW24tMV07XHJcbiAgICBmb3IgKGkgPSBuIC0gMjsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICByZXN1bHRQMVtpXSA9IChyW2ldIC0gY1tpXSAqIHJlc3VsdFAxW2kgKyAxXSkgLyBiW2ldO1xyXG4gICAgfVxyXG5cclxuICAgIC8qd2UgaGF2ZSBwMSwgbm93IGNvbXB1dGUgcDIqL1xyXG4gICAgZm9yIChpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcclxuICAgICAgICByZXN1bHRQMltpXSA9IDIgKiBLW2kgKyAxXSAtIHJlc3VsdFAxW2kgKyAxXTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHRQMltuLTFdID0gMC41ICogKEtbbl0gKyByZXN1bHRQMVtuLTFdKTtcclxuXHJcbiAgICByZXR1cm4ge3AxOnJlc3VsdFAxLCBwMjpyZXN1bHRQMn07XHJcbn07XHJcblxyXG4vKipcclxuICogTW92ZXMgYSBwb2ludCBhbG9uZyB0aGUgZ2l2ZW4gY3VydmVcclxuICogQHBhcmFtIGN1cnZlXHJcbiAqIEBwYXJhbSBkaXN0YW5jZVxyXG4gKiBAcmV0dXJucyB7Knx7eCwgeX19XHJcbiAqL1xyXG52YXIgbW92ZUFsb25nID0gZnVuY3Rpb24oY3VydmUsIGRpc3RhbmNlKSB7XHJcbiAgICAvLyBTb21laG93IHRoZSBwb2ludEFsb25nUGF0aCBjYWxjdWxhdGVzIGluIHRoZSB3cm9uZyBkaXJlY3Rpb24gc28gd2Ugc3dpdGNoIHRoZSBiYWhhdmlvdXIgYnkgc2V0dGluZ1xyXG4gICAgLy8gdGhlIGxvY2F0aW9uIHRvIDEgKGVuZCkgZm9yIHBvc2l0aXZlIGRpc3RhbmNlcy5cclxuICAgIC8vIGFuZCBuZWdvdGlhdGUgdGhlIGRpc3RhbmNlIHZhbHVlLlxyXG4gICAgdmFyIGxvY2F0aW9uID0gZGlzdGFuY2UgPiAwID8gMSA6IDA7XHJcbiAgICB2YXIgZGlzdGFuY2UgPSBkaXN0YW5jZSAqIC0xO1xyXG4gICAgcmV0dXJuIF9wb2ludEFsb25nUGF0aChjdXJ2ZSxsb2NhdGlvbiwgZGlzdGFuY2UpLnBvaW50O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuZWFyZXN0UG9pbnRPbkN1cnZlIDogX25lYXJlc3RQb2ludE9uQ3VydmUsXHJcbiAgICBjYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzIDogX2NhbGN1bGF0ZVNtb290aENvbnRyb2xQb2ludHMsXHJcbiAgICBtb3ZlQWxvbmcgOiBtb3ZlQWxvbmcsXHJcbiAgICBsZW5ndGggOiBfbGVuZ3RoXHJcbn1cclxuXHJcbiIsInZhciBvYmplY3QgPSByZXF1aXJlKCcuL29iamVjdCcpO1xyXG52YXIgYmV6aWVyID0gcmVxdWlyZSgnLi9iZXppZXInKTtcclxuXHJcbnZhciBjYWxjTGluZUludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKHBhMSwgcGEyLCBwYjEsIHBiMikge1xyXG4gICAgcmV0dXJuIG5ldyBMaW5lKHBhMSxwYTIpLmNhbGNMaW5lSW50ZXJjZXB0KG5ldyBMaW5lKHBiMSxwYjIpKTtcclxufTtcclxuXHJcbnZhciBQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBwID0gZ2V0UG9pbnQoeCx5KTtcclxuICAgIHRoaXMueCA9IHAueDtcclxuICAgIHRoaXMueSA9IHAueTtcclxufTtcclxuXHJcblBvaW50LnByb3RvdHlwZS5pc1dpdGhpbkludGVydmFsID0gZnVuY3Rpb24oc3RhcnQsIGVuZCwgdG9sZXJhbmNlKSB7XHJcbiAgICByZXR1cm4gaXNQb2ludEluSW50ZXJ2YWwodGhpcywgc3RhcnQsIGVuZCwgdG9sZXJhbmNlKTtcclxufTtcclxuXHJcblBvaW50LnByb3RvdHlwZS5pc1dpdGhpblhJbnRlcnZhbCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIF9pbkludGVydmFsKHRoaXMsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSwgJ3gnKTtcclxufTtcclxuXHJcblBvaW50LnByb3RvdHlwZS5pc1dpdGhpbllJbnRlcnZhbCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIF9pbkludGVydmFsKHRoaXMsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSwgJ3knKTtcclxufTs7XHJcblxyXG52YXIgaXNQb2ludEluSW50ZXJ2YWwgPSBmdW5jdGlvbihwb2ludCwgc3RhcnQsIGVuZCwgdG9sZXJhbmNlKSB7XHJcbiAgICByZXR1cm4gX2luSW50ZXJ2YWwocG9pbnQsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSwgJ3gnKSAmJiBfaXNQb2ludEluSW50ZXJ2YWwocG9pbnQsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSwgJ3knKTtcclxufTtcclxuXHJcbnZhciBfaW5JbnRlcnZhbCA9IGZ1bmN0aW9uKHAsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSwgZGltZW5zaW9uKSB7XHJcbiAgICB0b2xlcmFuY2UgPSB0b2xlcmFuY2UgfHwgMDtcclxuICAgIHZhciBib3VuZGFyeSA9IG1pbk1heChzdGFydFtkaW1lbnNpb25dLCBlbmRbZGltZW5zaW9uXSk7XHJcbiAgICBib3VuZGFyeS5taW4gLT0gdG9sZXJhbmNlO1xyXG4gICAgYm91bmRhcnkubWF4ICs9IHRvbGVyYW5jZTtcclxuICAgIHJldHVybiAocFtkaW1lbnNpb25dIDw9IGJvdW5kYXJ5Lm1heCAmJiBwW2RpbWVuc2lvbl0gPj0gYm91bmRhcnkubWluKTtcclxufTtcclxuXHJcbnZhciBtaW5NYXggPSBmdW5jdGlvbih2YWwxLCB2YWwyKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIG1pbiA6ICBNYXRoLm1pbih2YWwxLCB2YWwyKSxcclxuICAgICAgICBtYXggOiBNYXRoLm1heCh2YWwxLCB2YWwyKVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBMaW5lID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICAvL3kgPSBteCArIHRcclxuICAgIGlmKHAxLngpIHtcclxuICAgICAgICB0aGlzLm9wMSA9IHAxO1xyXG4gICAgICAgIHRoaXMub3AyID0gcDI7XHJcbiAgICAgICAgdGhpcy5wMSA9IChwMS54IDw9IHAyLngpPyBwMSA6IHAyO1xyXG4gICAgICAgIHRoaXMucDIgPSAocDEueCA+IHAyLngpPyBwMSA6IHAyO1xyXG4gICAgICAgIHRoaXMubSA9IHRoaXMuY2FsY0dyYWRpZW50KCk7XHJcbiAgICAgICAgdGhpcy50ID0gdGhpcy5jYWxjWUludGVyY2VwdCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm0gPSBwMTtcclxuICAgICAgICB0aGlzLnQgPSBwMjtcclxuICAgIH1cclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmNhbGNZSW50ZXJjZXB0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvLyB5ID0gbSAqIHggKyB0ID0+IHQgPSAtbXggKyB5XHJcbiAgICByZXR1cm4gKC0xICogdGhpcy5tICogdGhpcy5wMS54KSArIHRoaXMucDEueTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmdldE9ydGhvZ29uYWwgPSBmdW5jdGlvbihwKSB7XHJcbiAgICAvL1xyXG4gICAgdmFyIG5ld00gPSAtMSAvIHRoaXMubTtcclxuICAgIHZhciB0ID0gcC55IC0gKG5ld00gKiBwLngpO1xyXG4gICAgcmV0dXJuIG5ldyBMaW5lKG5ld00sdCk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjR3JhZGllbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBMaW5lLmNhbGNHcmFkaWVudCh0aGlzLnAxLCB0aGlzLnAyKTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmNhbGNOb3JtYWxpemVkTGluZVZlY3RvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIExpbmUuY2FsY05vcm1hbGl6ZWRMaW5lVmVjdG9yKHRoaXMucDEsIHRoaXMucDIpO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuaXNMdFIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLm9wMS54IDwgdGhpcy5vcDIueDtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmlzVHRCID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcDEueSA8IHRoaXMub3AyLnk7XHJcbn07XHJcblxyXG5cclxuTGluZS5jYWxjTm9ybWFsaXplZExpbmVWZWN0b3IgPSBmdW5jdGlvbihwMSwgcDIpIHtcclxuICAgIHZhciB2ZWN0b3IgPSB7XHJcbiAgICAgICAgeCA6IHAyLnggLSBwMS54LFxyXG4gICAgICAgIHkgOiBwMi55IC0gcDEueVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHZlY3Rvci54KnZlY3Rvci54ICsgdmVjdG9yLnkqdmVjdG9yLnkpO1xyXG5cclxuICAgIHZlY3Rvci54ID0gdmVjdG9yLnggLyBsZW5ndGg7XHJcbiAgICB2ZWN0b3IueSA9IHZlY3Rvci55IC8gbGVuZ3RoO1xyXG4gICAgcmV0dXJuIHZlY3RvcjtcclxufTtcclxuXHJcbi8qXHJcbiAqICBUT0RPOiB0aGlzIGlzIHdvcmtpbmcgaWYgeW91IHByb3ZpZGUgc3RhcnQvZW5kIGFuZCBkaXN0YW5jZSAobmVnYXRpdmUgb3IgcG9zaXRpdmUpIGJ1dCBub3QgdGVzdGVkIChhbmQgcHJlc3VtYWJseSBub3Qgd29ya2luZylcclxuICogIHdoZW4gZ2l2ZW4gc3RhcnQvZW5kIGRpc3QgYW5kIGRpcmVjdGlvbiBlLmcgbW92ZSBmcm9tIHN0YXJ0IHBvaW50IC0zMCBiYWNrLlxyXG4gKi9cclxuTGluZS5tb3ZlQWxvbmcgPSBmdW5jdGlvbihwMSxwMiwgZGlzdCwgZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgdmVjdG9yID0gTGluZS5jYWxjTm9ybWFsaXplZExpbmVWZWN0b3IocDEscDIpO1xyXG5cclxuICAgIC8vSWYgdGhlcmUgaXMgbm8gZGlyZWN0aW9uIGdpdmVuIHdlIGhhbmRsZSBuZWdhdGl2ZSBkaXN0YW5jZXMgYXMgZGlyZWN0aW9uIC0xIChmcm9tIGVuZCB0byBzdGFydClcclxuICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiB8fCAoZGlzdCA8IDApID8gLTEgOiAxO1xyXG5cclxuICAgIGlmKGRpcmVjdGlvbiA8IDEpIHtcclxuICAgICAgICBkaXN0ID0gTGluZS5jYWxjRGlzdGFuY2UocDEscDIpICsgZGlzdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiBwMS54ICsgdmVjdG9yLnggKiBkaXN0LFxyXG4gICAgICAgIHkgOiBwMS55ICsgdmVjdG9yLnkgKiBkaXN0XHJcbiAgICB9O1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oZGlzdCwgZGlyZWN0aW9uKSB7XHJcbiAgICAvL1RPRE86IG5vdGUgdGhpcyBpcyBqdXN0IHdvcmtpbmcgaWYgd2UgYXJlIGluaXRpYXRpbmcgdGhlIGxpbmUgd2l0aCB0d28gcG9pbnRzLi4uXHJcbiAgICByZXR1cm4gTGluZS5tb3ZlQWxvbmcodGhpcy5wMSwgdGhpcy5wMiwgZGlzdCwgZGlyZWN0aW9uKTtcclxufTtcclxuXHJcbkxpbmUuY2FsY0dyYWRpZW50ID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICByZXR1cm4gKHAyLnkgLSBwMS55KSAvIChwMi54IC0gcDEueCk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjRlggPSBmdW5jdGlvbih4KSB7XHJcbiAgICB2YXIgeSA9ICh0aGlzLm0pICogeCArIHRoaXMudDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHgsXHJcbiAgICAgICAgeSA6IHlcclxuICAgIH07XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjTWlkUG9pbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBMaW5lLmNhbGNNaWRQb2ludCh0aGlzLnAxLCB0aGlzLnAyKTtcclxufTtcclxuXHJcbkxpbmUuY2FsY01pZFBvaW50ID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiAocDEueCtwMi54KSAvIDIsXHJcbiAgICAgICAgeSA6IChwMS55K3AyLnkpIC8gMlxyXG4gICAgfTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmlzVmVydGljYWwgPSBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4gIWlzRmluaXRlKHRoaXMubSk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5pc0hvcml6b250YWwgPSBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5tID09PSAwO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY0xpbmVJbnRlcmNlcHQgPSBmdW5jdGlvbihvdGhlcikge1xyXG4gICAgLy9teCgxKSArIHQoMSkgPSBteCgyKSArdCgyKVxyXG4gICAgdmFyIG0gPSBvdGhlci5tICsgKC0xICogdGhpcy5tKTtcclxuICAgIHZhciB0ID0gdGhpcy50ICsgKC0xICogb3RoZXIudCk7XHJcbiAgICB2YXIgeCA9IChtICE9PSAwKSA/IHQgLyBtIDogdDtcclxuICAgIHJldHVybiB0aGlzLmNhbGNGWCh4KTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmdldE5lYXJlc3RQb2ludCA9IGZ1bmN0aW9uKHApIHtcclxuICAgIHJldHVybiBMaW5lLmdldE5lYXJlc3RQb2ludCh0aGlzLnAxLCB0aGlzLnAyLCBwKTtcclxufTtcclxuXHJcbkxpbmUuZ2V0TmVhcmVzdFBvaW50ID0gZnVuY3Rpb24oYSwgYiwgcCkge1xyXG4gICAgdmFyIEFQID0gW3AueCAtIGEueCwgcC55IC0gYS55XTsgLy8gdmVjdG9yIEEtPlBcclxuICAgIHZhciBBQiA9IFtiLnggLSBhLngsIGIueSAtIGEueV07IC8vIHZlY3RvciBBLT5CXHJcbiAgICB2YXIgbWFnbml0dWRlID0gQUJbMF0gKiBBQlswXSArIEFCWzFdICogQUJbMV0gLy9BQi5MZW5ndGhTcXVhcmVkXHJcblxyXG4gICAgdmFyIEFQX0RPVF9BQiA9IEFQWzBdICogQUJbMF0gKyBBUFsxXSAqIEFCWzFdO1xyXG5cclxuICAgIHZhciBkaXN0YW5jZSA9IEFQX0RPVF9BQiAvIG1hZ25pdHVkZTtcclxuXHJcbiAgICBpZihkaXN0YW5jZSA8IDApIHtcclxuICAgICAgICByZXR1cm4gYTtcclxuICAgIH0gZWxzZSBpZiAoZGlzdGFuY2UgPiAxKSB7XHJcbiAgICAgICAgcmV0dXJuIGI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IGEueCArIEFCWzBdICogZGlzdGFuY2UsXHJcbiAgICAgICAgICAgIHk6IGEueSArIEFCWzFdICogZGlzdGFuY2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5MaW5lLmNhbGNEaXN0YW5jZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdygocDIueSAtIHAxLnkpLDIpICsgTWF0aC5wb3coKHAyLnggLSBwMS54KSwyKSk7XHJcbn1cclxuXHJcbnZhciBTaW1wbGVWZWN0b3IgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxufTtcclxuXHJcblNpbXBsZVZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24odGhhdCkge1xyXG4gICAgcmV0dXJuIHRoaXMueCp0aGF0LnggKyB0aGlzLnkqdGhhdC55O1xyXG59O1xyXG5cclxuU2ltcGxlVmVjdG9yLmZyb21Qb2ludHMgPSBmdW5jdGlvbihwMSwgcDIpIHtcclxuICAgIHJldHVybiBuZXcgU2ltcGxlVmVjdG9yKFxyXG4gICAgICAgIHAyLnggLSBwMS54LFxyXG4gICAgICAgIHAyLnkgLSBwMS55XHJcbiAgICApO1xyXG59O1xyXG5cclxuU2ltcGxlVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKHRoYXQpIHtcclxuICAgIHJldHVybiBuZXcgU2ltcGxlVmVjdG9yKHRoaXMueCAtIHRoYXQueCwgdGhpcy55IC0gdGhhdC55KTtcclxufTtcclxuXHJcbnZhciBFbGxpcHNlID0gZnVuY3Rpb24oY3gsIGN5LCByeCwgcnkpIHtcclxuICAgIHN3aXRjaChhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICB0aGlzLmMgPSB7eDpjeCx5OmN5fTtcclxuICAgICAgICAgICAgdGhpcy5yeCA9IHJ4O1xyXG4gICAgICAgICAgICB0aGlzLnJ5ID0gcnk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgdGhpcy5jID0gY3g7XHJcbiAgICAgICAgICAgIHRoaXMucnggPSBjeTtcclxuICAgICAgICAgICAgdGhpcy5yeSA9IHJ4O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmNhbGNMaW5lSW50ZXJjZXB0ID0gZnVuY3Rpb24ocDEscDIpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgcDIgPSBwMS5wMjtcclxuICAgICAgICBwMSA9IHAxLnAxO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBvcmlnaW4gPSBuZXcgU2ltcGxlVmVjdG9yKHAxLngsIHAxLnkpO1xyXG4gICAgdmFyIGRpciA9IFNpbXBsZVZlY3Rvci5mcm9tUG9pbnRzKHAxLCBwMik7XHJcbiAgICB2YXIgY2VudGVyID0gbmV3IFNpbXBsZVZlY3Rvcih0aGlzLmMueCwgdGhpcy5jLnkpO1xyXG4gICAgdmFyIGRpZmYgPSBvcmlnaW4uc3VidHJhY3QoY2VudGVyKTtcclxuICAgIHZhciBtRGlyID0gbmV3IFNpbXBsZVZlY3RvcihkaXIueC8odGhpcy5yeCp0aGlzLnJ4KSwgIGRpci55Lyh0aGlzLnJ5KnRoaXMucnkpKTtcclxuICAgIHZhciBtRGlmZiA9IG5ldyBTaW1wbGVWZWN0b3IoZGlmZi54Lyh0aGlzLnJ4KnRoaXMucngpLCBkaWZmLnkvKHRoaXMucnkqdGhpcy5yeSkpO1xyXG5cclxuICAgIHZhciBhRGlmZiA9IGRpci5kb3QobURpcik7XHJcbiAgICB2YXIgYkRpZmYgPSBkaXIuZG90KG1EaWZmKTtcclxuICAgIHZhciBjRGlmZiA9IGRpZmYuZG90KG1EaWZmKSAtIDEuMDtcclxuICAgIHZhciBkRGlmZiA9IGJEaWZmKmJEaWZmIC0gYURpZmYqY0RpZmY7XHJcblxyXG4gICAgaWYgKGREaWZmID4gMCkge1xyXG4gICAgICAgIHZhciByb290ID0gTWF0aC5zcXJ0KGREaWZmKTtcclxuICAgICAgICB2YXIgdEEgID0gKC1iRGlmZiAtIHJvb3QpIC8gYURpZmY7XHJcbiAgICAgICAgdmFyIHRCICA9ICgtYkRpZmYgKyByb290KSAvIGFEaWZmO1xyXG5cclxuICAgICAgICBpZiAoISgodEEgPCAwIHx8IDEgPCB0QSkgJiYgKHRCIDwgMCB8fCAxIDwgdEIpKSkge1xyXG4gICAgICAgICAgICBpZiAoMCA8PSB0QSAmJiB0QSA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsZXJwKHAxLCBwMiwgdEEpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIDAgPD0gdEIgJiYgdEIgPD0gMSApIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxlcnAocDEsIHAyLCB0QikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgdCA9IC1iRGlmZi9hRGlmZjtcclxuICAgICAgICBpZiAoMCA8PSB0ICYmIHQgPD0gMSkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChsZXJwKHAxLiBhMiwgdCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUub3ZlcmxheXMgPSBmdW5jdGlvbihwKSB7XHJcbiAgICB2YXIgYnggPSBNYXRoLnBvdygocC54IC0gdGhpcy5jLngpLCAyKSAvIE1hdGgucG93KHRoaXMucngsIDIpO1xyXG4gICAgdmFyIGJ5ID0gTWF0aC5wb3coKHAueSAtIHRoaXMuYy55KSwgMikgLyBNYXRoLnBvdyh0aGlzLnJ5LCAyKTtcclxuICAgIHJldHVybiBieCArIGJ5IDw9IDFcclxufTtcclxuXHJcbnZhciBDaXJjbGUgPSBmdW5jdGlvbihjeCwgY3ksIHIpIHtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICB0aGlzLmMgPSBjeDtcclxuICAgICAgICB0aGlzLnIgPSBjeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5jID0ge3g6IGN4LCB5IDogY3l9O1xyXG4gICAgICAgIHRoaXMuciA9IHI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5DaXJjbGUucHJvdG90eXBlLm92ZXJsYXlzID0gZnVuY3Rpb24ocCkge1xyXG4gICAgdmFyIGJ4ID0gTWF0aC5wb3coKHAueCAtIHRoaXMuYy54KSwgMik7XHJcbiAgICB2YXIgYnkgPSBNYXRoLnBvdygocC55IC0gdGhpcy5jLnkpLCAyKTtcclxuICAgIHJldHVybiBieCArIGJ5IDwgTWF0aC5wb3codGhpcy5yLCAyKTtcclxufTtcclxuXHJcbkNpcmNsZS5wcm90b3R5cGUuY2FsY0xpbmVJbnRlcmNlcHQgPSBmdW5jdGlvbihwMSwgcDIpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgcDIgPSBwMS5wMjtcclxuICAgICAgICBwMSA9IHAxLnAxO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhID0gKHAyLnggLSBwMS54KSAqIChwMi54IC0gcDEueClcclxuICAgICAgICArIChwMi55IC0gcDEueSkgKiAocDIueSAtIHAxLnkpO1xyXG4gICAgdmFyIGIgID0gMiAqICgocDIueCAtIHAxLngpICogKHAxLnggLSB0aGlzLmMueClcclxuICAgICAgICArIChwMi55IC0gcDEueSkgKiAocDEueSAtIHRoaXMuYy55KSAgICk7XHJcbiAgICB2YXIgY2MgPSB0aGlzLmMueCp0aGlzLmMueCArIHRoaXMuYy55KnRoaXMuYy55ICsgcDEueCpwMS54ICsgcDEueSpwMS55IC1cclxuICAgICAgICAyICogKHRoaXMuYy54ICogcDEueCArIHRoaXMuYy55ICogcDEueSkgLSB0aGlzLnIqdGhpcy5yO1xyXG4gICAgdmFyIGRldGVyID0gYipiIC0gNCphKmNjO1xyXG5cclxuICAgIGlmKGRldGVyID4gMCkge1xyXG4gICAgICAgIHZhciByb290ICA9IE1hdGguc3FydChkZXRlcik7XHJcbiAgICAgICAgdmFyIHRBID0gKC1iICsgcm9vdCkgLyAoMiphKTtcclxuICAgICAgICB2YXIgdEIgPSAoLWIgLSByb290KSAvICgyKmEpO1xyXG5cclxuICAgICAgICBpZiAoISgodEEgPCAwIHx8IHRBID4gMSkgJiYgKHRCIDwgMCB8fCB0QiA+IDEpKSkge1xyXG4gICAgICAgICAgICBpZiAoMCA8PSB0QSAmJiB0QSA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsZXJwKHAxLCBwMiwgdEEpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKDAgPD0gdEIgJiYgdEIgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMSwgcDIsIHRCKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIGxlcnAgPSBmdW5jdGlvbihhLCBiLCB0KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiBhLnggKyAoYi54IC0gYS54KSAqIHQsXHJcbiAgICAgICAgeSA6IGEueSArIChiLnkgLSBhLnkpICogdFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBWZWN0b3IgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudmVjdG9ycyA9IFtdO1xyXG4gICAgdmFyIGN1cnJlbnRBcnI7XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzQXJyYXkoYXJndW1lbnRzW2ldKSkge1xyXG4gICAgICAgICAgICBpZihjdXJyZW50QXJyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZChjdXJyZW50QXJyKTtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRBcnIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZGQoYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdXJyZW50QXJyID0gY3VycmVudEFyciB8fCBbXTtcclxuICAgICAgICAgICAgY3VycmVudEFyci5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpZihjdXJyZW50QXJyKSB7XHJcbiAgICAgICAgdGhpcy5hZGQoY3VycmVudEFycik7XHJcbiAgICAgICAgZGVsZXRlIGN1cnJlbnRBcnI7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhIHZlY3RvciB2YWx1ZSBlaXRoZXIgYnkgcHJvdmlkaW5nIHNlcGVyYXRlZCBhcmd1bWVudHMgb3IgYW4gYXJyYXkgb2YgdmFsdWVzXHJcbiAqL1xyXG5WZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHZhbHVlO1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICB2YWx1ZSA9IFtdO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsdWUucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgdmFsdWUgPSBhcmd1bWVudHNbMF07XHJcbiAgICB9XHJcbiAgICB0aGlzLnZlY3RvcnMucHVzaCh2YWx1ZSk7XHJcbn07XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBwYXRoID0gb2JqZWN0LmlzQXJyYXkoYXJndW1lbnRzWzBdKSA/IGFyZ3VtZW50c1swXSA6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgcmV0dXJuIGdldFZlY3RvclZhbHVlKHRoaXMudmVjdG9ycywgcGF0aCk7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdnZXQgdmFsdWUgdmVjdG9yIGZhaWxlZCAtICcrdGhpcy52ZWN0b3JzKycgYXJnczogJythcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy52ZWN0b3JzID0gW107XHJcbn07XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcGF0aEFyciA9ICFvYmplY3QuaXNBcnJheShwYXRoQXJyKSA/IFtwYXRoQXJyXSA6IHBhdGhBcnI7XHJcbiAgICAgICAgdmFyIHBhcmVudFBhdGggPSBwYXRoQXJyLnNwbGljZSgwLCBwYXRoQXJyLmxlbmd0aCAtMSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZShwYXJlbnRQYXRoKVtwYXRoQXJyW3BhdGhBcnIubGVuZ3RoIC0xXV0gPSB2YWx1ZTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NldCB2YWx1ZSB2ZWN0b3IgZmFpbGVkIC0gJyt0aGlzLnZlY3RvcnMrJyBhcmdzOiAnK2FyZ3VtZW50cyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKHBhdGhBcnIsIHZhbHVlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHBhdGhBcnIgPSAhb2JqZWN0LmlzQXJyYXkocGF0aEFycikgPyBbcGF0aEFycl0gOiBwYXRoQXJyO1xyXG4gICAgICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aEFyci5zcGxpY2UoMCwgcGF0aEFyci5sZW5ndGggLTEpO1xyXG4gICAgICAgIHRoaXMudmFsdWUocGFyZW50UGF0aCkuc3BsaWNlKHBhdGhBcnJbcGF0aEFyci5sZW5ndGggLTFdLCAwLCB2YWx1ZSk7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdzZXQgdmFsdWUgdmVjdG9yIGZhaWxlZCAtICcrdGhpcy52ZWN0b3JzKycgYXJnczogJythcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnZlY3RvcnMubGVuZ3RoO1xyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHBhdGhBcnIpIHtcclxuICAgIHBhdGhBcnIgPSAhb2JqZWN0LmlzQXJyYXkocGF0aEFycikgPyBbcGF0aEFycl0gOiBwYXRoQXJyO1xyXG4gICAgdmFyIHBhcmVudFBhdGggPSBwYXRoQXJyLnNwbGljZSgwLCBwYXRoQXJyLmxlbmd0aCAtMSk7XHJcbiAgICB0aGlzLnZhbHVlKHBhcmVudFBhdGgpLnNwbGljZShwYXRoQXJyW3BhdGhBcnIubGVuZ3RoIC0xXSwgMSk7XHJcbn07XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnZlY3RvcnNbdGhpcy52ZWN0b3JzLmxlbmd0aCAtMV07XHJcbn07XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihoYW5kbGVyKSB7XHJcbiAgICBvYmplY3QuZWFjaCh0aGlzLnZlY3RvcnMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIGhhbmRsZXIoaW5kZXgsdmFsdWUpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogTm90ZSB0aGUgaW5kZXhlcyBjYW4gYmUgbmVnYXRpdmUgdG8gcmV0cmlldmUgdmFsdWVzIGZyb20gdGhlIGVuZCBvZiB0aGUgdmVjdG9yIGUuZy4gLTEgaXMgdGhlIGxhc3RcclxuICogQHBhcmFtIHZlY3RvckFyclxyXG4gKiBAcGFyYW0gYXJnc1xyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcbnZhciBnZXRWZWN0b3JWYWx1ZSA9IGZ1bmN0aW9uKHZlY3RvckFyciwgYXJncykge1xyXG4gICAgaWYoIWFyZ3MpIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yQXJyO1xyXG4gICAgfWVsc2UgaWYob2JqZWN0LmlzQXJyYXkoYXJncykpIHtcclxuICAgICAgICBzd2l0Y2goYXJncy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZlY3RvckFycjtcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdC52YWx1ZUJ5SW5kZXgodmVjdG9yQXJyLCBhcmdzWzBdKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGFyZ3NbMF07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0VmVjdG9yVmFsdWUodmVjdG9yQXJyW2luZGV4XSwgYXJncy5zcGxpY2UoMSkpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdC52YWx1ZUJ5SW5kZXgodmVjdG9yQXJyLCBhcmdzKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBzb3VyY2UgYW5kIHRhcmdldCB2YWx1ZSBpcyBsb3dlciB0aGFuIHRoZSBnaXZlbiByYW5nZSB2YWx1ZVxyXG4gKi9cclxudmFyIGNoZWNrUmFuZ2VEaWZmID0gZnVuY3Rpb24oc291cmNlLCB0YXJnZXQsIHJhbmdlKSB7XHJcbiAgICByZXR1cm4gaXNJbkRpZmZSYW5nZSh0YXJnZXQsIHNvdXJjZSwgcmFuZ2UpO1xyXG59O1xyXG5cclxudmFyIGlzSW5EaWZmUmFuZ2UgPSBmdW5jdGlvbihwMSwgcDIsIHJhbmdlKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMocDEgLSBwMikgPCByYW5nZTtcclxufTtcclxuXHJcbnZhciBnZXRQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZih4ICYmIG9iamVjdC5pc0RlZmluZWQoeC54KSAmJiBvYmplY3QuaXNEZWZpbmVkKHgueSkpIHtcclxuICAgICAgICByZXN1bHQgPSB4O1xyXG4gICAgfSBlbHNlIGlmKCFpc05hTih4KSAmJiAhaXNOYU4oeSkpIHtcclxuICAgICAgICByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHggOiB4LFxyXG4gICAgICAgICAgICB5IDogeVxyXG4gICAgICAgIH07XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzRGVmaW5lZCh4KSAmJiBvYmplY3QuaXNEZWZpbmVkKHkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gdG9Qb2ludCh4LHkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciB0b1BvaW50ID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB4ID0gKG9iamVjdC5pc1N0cmluZyh4KSkgPyBwYXJzZUZsb2F0KHgpIDogeDtcclxuICAgIHkgPSAob2JqZWN0LmlzU3RyaW5nKHkpKSA/IHBhcnNlRmxvYXQoeSkgOiB5O1xyXG5cclxuICAgIHJldHVybiB7eDp4LHk6eX07XHJcbn07XHJcblxyXG52YXIgdG9SYWRpYW5zID0gZnVuY3Rpb24gKGFuZ2xlKSB7XHJcbiAgICByZXR1cm4gYW5nbGUgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG52YXIgdG9EZWdyZWVzID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICAgIHJldHVybiBhbmdsZSAqICgxODAgLyBNYXRoLlBJKTtcclxufTtcclxuXHJcbnZhciByb3RhdGUgPSBmdW5jdGlvbihwLCByb3RDZW50ZXIsIGFuZ2xlKSB7XHJcbiAgICBpZihhbmdsZSA9PT0gMCB8fCAocC54ID09PSByb3RDZW50ZXIueCAmJiBwLnkgPT09IHJvdENlbnRlci55KSkge1xyXG4gICAgICAgIHJldHVybiBwO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByb3RhdGVkID0ge307XHJcbiAgICB2YXIgcmFkID0gdG9SYWRpYW5zKGFuZ2xlKTtcclxuICAgIHJvdGF0ZWQueCA9IChwLnggLSByb3RDZW50ZXIueCkgKiBNYXRoLmNvcyhyYWQpIC0gKHAueSAtIHJvdENlbnRlci55KSAqIE1hdGguc2luKHJhZCkgKyByb3RDZW50ZXIueDtcclxuICAgIHJvdGF0ZWQueSA9IChwLnkgLSByb3RDZW50ZXIueSkgKiBNYXRoLmNvcyhyYWQpICsgKHAueCAtIHJvdENlbnRlci54KSAqIE1hdGguc2luKHJhZCkgKyByb3RDZW50ZXIueTtcclxuICAgIHAueCA9IHJvdGF0ZWQueDtcclxuICAgIHAueSA9IHJvdGF0ZWQueTtcclxuICAgIHJldHVybiBwO1xyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2FsY0xpbmVJbnRlcnNlY3Rpb24gOiBjYWxjTGluZUludGVyc2VjdGlvbixcclxuICAgIExpbmUgOiBMaW5lLFxyXG4gICAgQ2lyY2xlIDogQ2lyY2xlLFxyXG4gICAgRWxsaXBzZSA6IEVsbGlwc2UsXHJcbiAgICBWZWN0b3IgOiBWZWN0b3IsXHJcbiAgICBQb2ludCA6IFBvaW50LFxyXG4gICAgaXNQb2ludEluSW50ZXJ2YWwgOiBpc1BvaW50SW5JbnRlcnZhbCxcclxuICAgIG1pbk1heCA6IG1pbk1heCxcclxuICAgIGNoZWNrUmFuZ2VEaWZmIDogY2hlY2tSYW5nZURpZmYsXHJcbiAgICBnZXRQb2ludCA6IGdldFBvaW50LFxyXG4gICAgYmV6aWVyIDogYmV6aWVyLFxyXG4gICAgdG9SYWRpYW5zIDogdG9SYWRpYW5zLFxyXG4gICAgdG9EZWdyZWVzIDogdG9EZWdyZWVzLFxyXG4gICAgcm90YXRlIDogcm90YXRlXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBlYWNoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJC5lYWNoKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBncmVwOiBmdW5jdGlvbihhcnIsIGZpbHRlciwgaW52ZXJ0KSB7XHJcbiAgICAgICAgcmV0dXJuICQuZ3JlcChhcnIsIGZpbHRlciwgaW52ZXJ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNPbmVPZjogZnVuY3Rpb24oc2VhcmNoKSB7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgZm9yKGkgPSAxO2kgPCBhcmd1bWVudHMubGVuZ3RoO2krKykge1xyXG4gICAgICAgICAgaWYoc2VhcmNoID09PSBhcmd1bWVudHNbaV0pIHtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gJC5pc0FycmF5KG9iaik7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXkgOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gJC5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFt2YWx1ZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUZyb21BcnJheTogZnVuY3Rpb24oYXJyLCBpdGVtKSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gYXJyLmluZGV4T2YoaXRlbSk7XHJcbiAgICAgICAgaWYoaW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2l6ZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgdmFyIHNpemUgPSAwLCBrZXk7XHJcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgc2l6ZSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2l6ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc29ydDogZnVuY3Rpb24ob2JqLCBzb3J0KSB7XHJcbiAgICAgICAgdmFyIGFycjtcclxuICAgICAgICBpZighb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5pc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgYXJyID0gb2JqO1xyXG4gICAgICAgIH0gZWxzZSBpZih0aGlzLmlzT2JqZWN0KG9iaikpIHtcclxuICAgICAgICAgICAgYXJyID0gJC5tYXAob2JqLCBmdW5jdGlvbiAoaW5kZXgsIHZhbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ialt2YWxdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIuc29ydChzb3J0KTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWVCeUluZGV4OiBmdW5jdGlvbihhcnIsIGluZGV4KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXRJbmRleChhcnIsaW5kZXgpO1xyXG4gICAgICAgIHJldHVybiBhcnJbaW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbmRleDogZnVuY3Rpb24oYXJyLCBpbmRleCkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBpbmRleDtcclxuICAgICAgICAvLyBmb3IgbmVnYXRpdmUgaW5kZXhlcyB3ZSByZXR1cm4gdmFsdWVzIGNvdW50ZWQgZnJvbSB0aGUgb3RoZXIgc2lkZSBzbyAtMSBpcyB0aGUgbGFzdCBpbmRleFxyXG4gICAgICAgIC8vIGlmIHRoZSBuZWdhdGl2ZSBpbmRleCBpcyBvdXQgb2YgcmFuZ2Ugd2UgcmV0dXJuIHRoZSBsYXN0IGluZGV4LlxyXG4gICAgICAgIGlmKGluZGV4IDwgMCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBhcnIubGVuZ3RoICsgaW5kZXg7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgPiBhcnIubGVuZ3RoIC0xIHx8IHJlc3VsdCA8IDApID8gYXJyLmxlbmd0aCAtMSA6IHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgaXNGdW5jdGlvbjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQuaXNQbGFpbk9iamVjdChvYmopO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0pRdWVyeTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iai5qcXVlcnk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzU3RyaW5nOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzTnVtYmVyOiBmdW5jdGlvbihuKSB7XHJcbiAgICAgICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Jvb2xlYW4nO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0RlZmluZWQ6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoYXQuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiAhPT0gJ3VuZGVmaW5lZCc7XHJcbiAgICB9LFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbih0YXJnZXQsIHRvTWVyZ2UpIHtcclxuICAgICAgICByZXR1cm4gJC5tZXJnZSh0YXJnZXQsIHRvTWVyZ2UpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgYWRkVmFsdWU6IGZ1bmN0aW9uKHRhcmdldCwgbmV3VmFsKSB7XHJcbiAgICAgICAgaWYoaXNBcnJheShuZXdWYWwpKSB7XHJcbiAgICAgICAgICAgIG1lcmdlKHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFyZ2V0LnB1c2gobmV3VmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24odGFyZ2V0LCBvYmoxLCBvYmoyKSB7XHJcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRhcmdldCxvYmoxLG9iajIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZUFycmF5OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gYXJyLnNsaWNlKDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZU9iamVjdDogZnVuY3Rpb24ob2xkT2JqZWN0LCBkZWVwKSB7XHJcbiAgICAgICAgZGVlcCA9IGRlZXAgfHwgZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKGRlZXAsIHt9LCBvbGRPYmplY3QpO1xyXG4gICAgfVxyXG4gICAgXHJcbn07IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4vb2JqZWN0Jyk7XHJcblxyXG5leHBvcnRzLmVuZHNXaXRoID0gZnVuY3Rpb24odmFsLCBzdWZmaXgpIHtcclxuICAgIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbCkgfHwgIW9iamVjdC5pc0RlZmluZWQoc3VmZml4KSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWwuaW5kZXhPZihzdWZmaXgsIHZhbC5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XHJcbn07XHJcblxyXG5leHBvcnRzLnN0YXJ0c1dpdGggPSBmdW5jdGlvbih2YWwsIHByZWZpeCkge1xyXG4gICAgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsKSB8fCAhb2JqZWN0LmlzRGVmaW5lZChwcmVmaXgpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbC5pbmRleE9mKHByZWZpeCkgPT09IDA7XHJcbn07IiwidmFyIHN0cmluZyA9IHJlcXVpcmUoJy4vc3RyaW5nJyk7XHJcblxyXG52YXIgc2VyaWFsaXplVG9TdHJpbmcgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICB2YXIgcyA9IG5ldyBYTUxTZXJpYWxpemVyKCk7XHJcbiAgICBub2RlID0gKG5vZGUualF1ZXJ5KSA/IG5vZGVbMF0gOiBub2RlO1xyXG4gICAgcmV0dXJuIHMuc2VyaWFsaXplVG9TdHJpbmcobm9kZSk7XHJcbn07XHJcblxyXG52YXIgcGFyc2VYTUwgPSBmdW5jdGlvbihzdHJEYXRhKSB7XHJcbiAgICByZXR1cm4gJC5wYXJzZVhNTChzdHJEYXRhKTtcclxufTtcclxuXHJcbnZhciBmb3JtYXQgPSBmdW5jdGlvbiAoeG1sKSB7XHJcbiAgICB2YXIgaW50ZW5kID0gLTE7XHJcbiAgICB2YXIgcmVzdWx0ID0gJyc7XHJcbiAgICB4bWwgPSB4bWwucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSxcIlwiKTtcclxuICAgIHZhciBsYXN0V2FzQ2xvc2UgPSBmYWxzZTtcclxuICAgIHZhciBsYXN0SGFkVGV4dCA9IGZhbHNlO1xyXG4gICAgJC5lYWNoKHhtbC5zcGxpdCgnPCcpLCBmdW5jdGlvbihpbmRleCwgbm9kZSkge1xyXG4gICAgICAgIG5vZGUgPSBub2RlLnRyaW0oKTtcclxuICAgICAgICBpZihub2RlKSB7XHJcbiAgICAgICAgICAgIGlmKG5vZGUuaW5kZXhPZignLycpICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZighbGFzdFdhc0Nsb3NlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5kKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGFzdEhhZFRleHQgPSAhc3RyaW5nLmVuZHNXaXRoKG5vZGUsICc+Jyk7XHJcbiAgICAgICAgICAgICAgICBsYXN0V2FzQ2xvc2UgPSBzdHJpbmcuZW5kc1dpdGgobm9kZSwgJy8+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZighbGFzdEhhZFRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0V2FzQ2xvc2UgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGludGVuZC0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGFzdEhhZFRleHQgPSAhc3RyaW5nLmVuZHNXaXRoKG5vZGUsICc+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gJyc7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW50ZW5kOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmcgKz0gJyAgJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHRleHQ7XHJcbiAgICAgICAgICAgIGlmKGxhc3RIYWRUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3BsaXR0ZWQgPSBub2RlLnNwbGl0KCc+Jyk7XHJcbiAgICAgICAgICAgICAgICBub2RlID0gc3BsaXR0ZWRbMF0gKyAnPic7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gc3BsaXR0ZWRbMV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0ICs9IHBhZGRpbmcgKyAnPCcrbm9kZSsnXFxyXFxuJztcclxuXHJcbiAgICAgICAgICAgIGlmKHRleHQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBwYWRkaW5nICsgJyAgJyArIHRleHQrJ1xcclxcbic7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXJpYWxpemVUb1N0cmluZyA6IHNlcmlhbGl6ZVRvU3RyaW5nLFxyXG4gICAgcGFyc2VYTUwgOiBwYXJzZVhNTCxcclxuICAgIGZvcm1hdDogZm9ybWF0XHJcbn07IiwiLyogQHByZXNlcnZlXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE0IFBldGthIEFudG9ub3ZcbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG4vKipcbiAqIGJsdWViaXJkIGJ1aWxkIHZlcnNpb24gMi45LjM0XG4gKiBGZWF0dXJlcyBlbmFibGVkOiBjb3JlLCByYWNlLCBjYWxsX2dldCwgZ2VuZXJhdG9ycywgbWFwLCBub2RlaWZ5LCBwcm9taXNpZnksIHByb3BzLCByZWR1Y2UsIHNldHRsZSwgc29tZSwgY2FuY2VsLCB1c2luZywgZmlsdGVyLCBhbnksIGVhY2gsIHRpbWVyc1xuKi9cbiFmdW5jdGlvbihlKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLlByb21pc2U9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIF9kZXJlcV89PVwiZnVuY3Rpb25cIiYmX2RlcmVxXztpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgX2RlcmVxXz09XCJmdW5jdGlvblwiJiZfZGVyZXFfO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIFNvbWVQcm9taXNlQXJyYXkgPSBQcm9taXNlLl9Tb21lUHJvbWlzZUFycmF5O1xuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgdmFyIHJldCA9IG5ldyBTb21lUHJvbWlzZUFycmF5KHByb21pc2VzKTtcbiAgICB2YXIgcHJvbWlzZSA9IHJldC5wcm9taXNlKCk7XG4gICAgcmV0LnNldEhvd01hbnkoMSk7XG4gICAgcmV0LnNldFVud3JhcCgpO1xuICAgIHJldC5pbml0KCk7XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UuYW55ID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIGFueShwcm9taXNlcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbn07XG5cbn0se31dLDI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZmlyc3RMaW5lRXJyb3I7XG50cnkge3Rocm93IG5ldyBFcnJvcigpOyB9IGNhdGNoIChlKSB7Zmlyc3RMaW5lRXJyb3IgPSBlO31cbnZhciBzY2hlZHVsZSA9IF9kZXJlcV8oXCIuL3NjaGVkdWxlLmpzXCIpO1xudmFyIFF1ZXVlID0gX2RlcmVxXyhcIi4vcXVldWUuanNcIik7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG5cbmZ1bmN0aW9uIEFzeW5jKCkge1xuICAgIHRoaXMuX2lzVGlja1VzZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9sYXRlUXVldWUgPSBuZXcgUXVldWUoMTYpO1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlID0gbmV3IFF1ZXVlKDE2KTtcbiAgICB0aGlzLl90cmFtcG9saW5lRW5hYmxlZCA9IHRydWU7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZHJhaW5RdWV1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuX2RyYWluUXVldWVzKCk7XG4gICAgfTtcbiAgICB0aGlzLl9zY2hlZHVsZSA9XG4gICAgICAgIHNjaGVkdWxlLmlzU3RhdGljID8gc2NoZWR1bGUodGhpcy5kcmFpblF1ZXVlcykgOiBzY2hlZHVsZTtcbn1cblxuQXN5bmMucHJvdG90eXBlLmRpc2FibGVUcmFtcG9saW5lSWZOZWNlc3NhcnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5oYXNEZXZUb29scykge1xuICAgICAgICB0aGlzLl90cmFtcG9saW5lRW5hYmxlZCA9IGZhbHNlO1xuICAgIH1cbn07XG5cbkFzeW5jLnByb3RvdHlwZS5lbmFibGVUcmFtcG9saW5lID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl90cmFtcG9saW5lRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl90cmFtcG9saW5lRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbkFzeW5jLnByb3RvdHlwZS5oYXZlSXRlbXNRdWV1ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vcm1hbFF1ZXVlLmxlbmd0aCgpID4gMDtcbn07XG5cbkFzeW5jLnByb3RvdHlwZS50aHJvd0xhdGVyID0gZnVuY3Rpb24oZm4sIGFyZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGFyZyA9IGZuO1xuICAgICAgICBmbiA9IGZ1bmN0aW9uICgpIHsgdGhyb3cgYXJnOyB9O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKGFyZyk7XG4gICAgICAgIH0sIDApO1xuICAgIH0gZWxzZSB0cnkge1xuICAgICAgICB0aGlzLl9zY2hlZHVsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKGFyZyk7XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYXN5bmMgc2NoZWR1bGVyIGF2YWlsYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL20zT1RYa1xcdTAwMGFcIik7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gQXN5bmNJbnZva2VMYXRlcihmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHRoaXMuX2xhdGVRdWV1ZS5wdXNoKGZuLCByZWNlaXZlciwgYXJnKTtcbiAgICB0aGlzLl9xdWV1ZVRpY2soKTtcbn1cblxuZnVuY3Rpb24gQXN5bmNJbnZva2UoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB0aGlzLl9ub3JtYWxRdWV1ZS5wdXNoKGZuLCByZWNlaXZlciwgYXJnKTtcbiAgICB0aGlzLl9xdWV1ZVRpY2soKTtcbn1cblxuZnVuY3Rpb24gQXN5bmNTZXR0bGVQcm9taXNlcyhwcm9taXNlKSB7XG4gICAgdGhpcy5fbm9ybWFsUXVldWUuX3B1c2hPbmUocHJvbWlzZSk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59XG5cbmlmICghdXRpbC5oYXNEZXZUb29scykge1xuICAgIEFzeW5jLnByb3RvdHlwZS5pbnZva2VMYXRlciA9IEFzeW5jSW52b2tlTGF0ZXI7XG4gICAgQXN5bmMucHJvdG90eXBlLmludm9rZSA9IEFzeW5jSW52b2tlO1xuICAgIEFzeW5jLnByb3RvdHlwZS5zZXR0bGVQcm9taXNlcyA9IEFzeW5jU2V0dGxlUHJvbWlzZXM7XG59IGVsc2Uge1xuICAgIGlmIChzY2hlZHVsZS5pc1N0YXRpYykge1xuICAgICAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uKGZuKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9O1xuICAgIH1cbiAgICBBc3luYy5wcm90b3R5cGUuaW52b2tlTGF0ZXIgPSBmdW5jdGlvbiAoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkKSB7XG4gICAgICAgICAgICBBc3luY0ludm9rZUxhdGVyLmNhbGwodGhpcywgZm4sIHJlY2VpdmVyLCBhcmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4uY2FsbChyZWNlaXZlciwgYXJnKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXN5bmMucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgICAgICBpZiAodGhpcy5fdHJhbXBvbGluZUVuYWJsZWQpIHtcbiAgICAgICAgICAgIEFzeW5jSW52b2tlLmNhbGwodGhpcywgZm4sIHJlY2VpdmVyLCBhcmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChyZWNlaXZlciwgYXJnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEFzeW5jLnByb3RvdHlwZS5zZXR0bGVQcm9taXNlcyA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkKSB7XG4gICAgICAgICAgICBBc3luY1NldHRsZVByb21pc2VzLmNhbGwodGhpcywgcHJvbWlzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9zZXR0bGVQcm9taXNlcygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5Bc3luYy5wcm90b3R5cGUuaW52b2tlRmlyc3QgPSBmdW5jdGlvbiAoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB0aGlzLl9ub3JtYWxRdWV1ZS51bnNoaWZ0KGZuLCByZWNlaXZlciwgYXJnKTtcbiAgICB0aGlzLl9xdWV1ZVRpY2soKTtcbn07XG5cbkFzeW5jLnByb3RvdHlwZS5fZHJhaW5RdWV1ZSA9IGZ1bmN0aW9uKHF1ZXVlKSB7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCgpID4gMCkge1xuICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGZuLl9zZXR0bGVQcm9taXNlcygpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlY2VpdmVyID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgdmFyIGFyZyA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGZuLmNhbGwocmVjZWl2ZXIsIGFyZyk7XG4gICAgfVxufTtcblxuQXN5bmMucHJvdG90eXBlLl9kcmFpblF1ZXVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kcmFpblF1ZXVlKHRoaXMuX25vcm1hbFF1ZXVlKTtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuX2RyYWluUXVldWUodGhpcy5fbGF0ZVF1ZXVlKTtcbn07XG5cbkFzeW5jLnByb3RvdHlwZS5fcXVldWVUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5faXNUaWNrVXNlZCkge1xuICAgICAgICB0aGlzLl9pc1RpY2tVc2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUodGhpcy5kcmFpblF1ZXVlcyk7XG4gICAgfVxufTtcblxuQXN5bmMucHJvdG90eXBlLl9yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pc1RpY2tVc2VkID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBBc3luYygpO1xubW9kdWxlLmV4cG9ydHMuZmlyc3RMaW5lRXJyb3IgPSBmaXJzdExpbmVFcnJvcjtcblxufSx7XCIuL3F1ZXVlLmpzXCI6MjgsXCIuL3NjaGVkdWxlLmpzXCI6MzEsXCIuL3V0aWwuanNcIjozOH1dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlKSB7XG52YXIgcmVqZWN0VGhpcyA9IGZ1bmN0aW9uKF8sIGUpIHtcbiAgICB0aGlzLl9yZWplY3QoZSk7XG59O1xuXG52YXIgdGFyZ2V0UmVqZWN0ZWQgPSBmdW5jdGlvbihlLCBjb250ZXh0KSB7XG4gICAgY29udGV4dC5wcm9taXNlUmVqZWN0aW9uUXVldWVkID0gdHJ1ZTtcbiAgICBjb250ZXh0LmJpbmRpbmdQcm9taXNlLl90aGVuKHJlamVjdFRoaXMsIHJlamVjdFRoaXMsIG51bGwsIHRoaXMsIGUpO1xufTtcblxudmFyIGJpbmRpbmdSZXNvbHZlZCA9IGZ1bmN0aW9uKHRoaXNBcmcsIGNvbnRleHQpIHtcbiAgICBpZiAodGhpcy5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZUNhbGxiYWNrKGNvbnRleHQudGFyZ2V0KTtcbiAgICB9XG59O1xuXG52YXIgYmluZGluZ1JlamVjdGVkID0gZnVuY3Rpb24oZSwgY29udGV4dCkge1xuICAgIGlmICghY29udGV4dC5wcm9taXNlUmVqZWN0aW9uUXVldWVkKSB0aGlzLl9yZWplY3QoZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKHRoaXNBcmcpIHtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh0aGlzQXJnKTtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHJldC5fcHJvcGFnYXRlRnJvbSh0aGlzLCAxKTtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0KCk7XG5cbiAgICByZXQuX3NldEJvdW5kVG8obWF5YmVQcm9taXNlKTtcbiAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHByb21pc2VSZWplY3Rpb25RdWV1ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHJvbWlzZTogcmV0LFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgICAgICBiaW5kaW5nUHJvbWlzZTogbWF5YmVQcm9taXNlXG4gICAgICAgIH07XG4gICAgICAgIHRhcmdldC5fdGhlbihJTlRFUk5BTCwgdGFyZ2V0UmVqZWN0ZWQsIHJldC5fcHJvZ3Jlc3MsIHJldCwgY29udGV4dCk7XG4gICAgICAgIG1heWJlUHJvbWlzZS5fdGhlbihcbiAgICAgICAgICAgIGJpbmRpbmdSZXNvbHZlZCwgYmluZGluZ1JlamVjdGVkLCByZXQuX3Byb2dyZXNzLCByZXQsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5fcmVzb2x2ZUNhbGxiYWNrKHRhcmdldCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Qm91bmRUbyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICBpZiAob2JqICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDEzMTA3MjtcbiAgICAgICAgdGhpcy5fYm91bmRUbyA9IG9iajtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH4xMzEwNzIpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAxMzEwNzIpID09PSAxMzEwNzI7XG59O1xuXG5Qcm9taXNlLmJpbmQgPSBmdW5jdGlvbiAodGhpc0FyZywgdmFsdWUpIHtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh0aGlzQXJnKTtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuXG4gICAgcmV0Ll9zZXRCb3VuZFRvKG1heWJlUHJvbWlzZSk7XG4gICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0Ll9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgICAgICB9LCByZXQuX3JlamVjdCwgcmV0Ll9wcm9ncmVzcywgcmV0LCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXQuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xufTtcblxufSx7fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBvbGQ7XG5pZiAodHlwZW9mIFByb21pc2UgIT09IFwidW5kZWZpbmVkXCIpIG9sZCA9IFByb21pc2U7XG5mdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgIHRyeSB7IGlmIChQcm9taXNlID09PSBibHVlYmlyZCkgUHJvbWlzZSA9IG9sZDsgfVxuICAgIGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBibHVlYmlyZDtcbn1cbnZhciBibHVlYmlyZCA9IF9kZXJlcV8oXCIuL3Byb21pc2UuanNcIikoKTtcbmJsdWViaXJkLm5vQ29uZmxpY3QgPSBub0NvbmZsaWN0O1xubW9kdWxlLmV4cG9ydHMgPSBibHVlYmlyZDtcblxufSx7XCIuL3Byb21pc2UuanNcIjoyM31dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY3IgPSBPYmplY3QuY3JlYXRlO1xuaWYgKGNyKSB7XG4gICAgdmFyIGNhbGxlckNhY2hlID0gY3IobnVsbCk7XG4gICAgdmFyIGdldHRlckNhY2hlID0gY3IobnVsbCk7XG4gICAgY2FsbGVyQ2FjaGVbXCIgc2l6ZVwiXSA9IGdldHRlckNhY2hlW1wiIHNpemVcIl0gPSAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBjYW5FdmFsdWF0ZSA9IHV0aWwuY2FuRXZhbHVhdGU7XG52YXIgaXNJZGVudGlmaWVyID0gdXRpbC5pc0lkZW50aWZpZXI7XG5cbnZhciBnZXRNZXRob2RDYWxsZXI7XG52YXIgZ2V0R2V0dGVyO1xuaWYgKCF0cnVlKSB7XG52YXIgbWFrZU1ldGhvZENhbGxlciA9IGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImVuc3VyZU1ldGhvZFwiLCBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmopIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAndXNlIHN0cmljdCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgbGVuID0gdGhpcy5sZW5ndGg7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBlbnN1cmVNZXRob2Qob2JqLCAnbWV0aG9kTmFtZScpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBzd2l0Y2gobGVuKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gb2JqLm1ldGhvZE5hbWUodGhpc1swXSk7ICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gb2JqLm1ldGhvZE5hbWUodGhpc1swXSwgdGhpc1sxXSk7ICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gb2JqLm1ldGhvZE5hbWUodGhpc1swXSwgdGhpc1sxXSwgdGhpc1syXSk7ICAgIFxcblxcXG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gb2JqLm1ldGhvZE5hbWUoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmoubWV0aG9kTmFtZS5hcHBseShvYmosIHRoaXMpOyAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIH07ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIFwiLnJlcGxhY2UoL21ldGhvZE5hbWUvZywgbWV0aG9kTmFtZSkpKGVuc3VyZU1ldGhvZCk7XG59O1xuXG52YXIgbWFrZUdldHRlciA9IGZ1bmN0aW9uIChwcm9wZXJ0eU5hbWUpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwib2JqXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgcmV0dXJuIG9iai5wcm9wZXJ0eU5hbWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgXCIucmVwbGFjZShcInByb3BlcnR5TmFtZVwiLCBwcm9wZXJ0eU5hbWUpKTtcbn07XG5cbnZhciBnZXRDb21waWxlZCA9IGZ1bmN0aW9uKG5hbWUsIGNvbXBpbGVyLCBjYWNoZSkge1xuICAgIHZhciByZXQgPSBjYWNoZVtuYW1lXTtcbiAgICBpZiAodHlwZW9mIHJldCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGlmICghaXNJZGVudGlmaWVyKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXQgPSBjb21waWxlcihuYW1lKTtcbiAgICAgICAgY2FjaGVbbmFtZV0gPSByZXQ7XG4gICAgICAgIGNhY2hlW1wiIHNpemVcIl0rKztcbiAgICAgICAgaWYgKGNhY2hlW1wiIHNpemVcIl0gPiA1MTIpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoY2FjaGUpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkgZGVsZXRlIGNhY2hlW2tleXNbaV1dO1xuICAgICAgICAgICAgY2FjaGVbXCIgc2l6ZVwiXSA9IGtleXMubGVuZ3RoIC0gMjU2O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5nZXRNZXRob2RDYWxsZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGdldENvbXBpbGVkKG5hbWUsIG1ha2VNZXRob2RDYWxsZXIsIGNhbGxlckNhY2hlKTtcbn07XG5cbmdldEdldHRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZ2V0Q29tcGlsZWQobmFtZSwgbWFrZUdldHRlciwgZ2V0dGVyQ2FjaGUpO1xufTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlTWV0aG9kKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgIHZhciBmbjtcbiAgICBpZiAob2JqICE9IG51bGwpIGZuID0gb2JqW21ldGhvZE5hbWVdO1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IFwiT2JqZWN0IFwiICsgdXRpbC5jbGFzc1N0cmluZyhvYmopICsgXCIgaGFzIG5vIG1ldGhvZCAnXCIgK1xuICAgICAgICAgICAgdXRpbC50b1N0cmluZyhtZXRob2ROYW1lKSArIFwiJ1wiO1xuICAgICAgICB0aHJvdyBuZXcgUHJvbWlzZS5UeXBlRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiBmbjtcbn1cblxuZnVuY3Rpb24gY2FsbGVyKG9iaikge1xuICAgIHZhciBtZXRob2ROYW1lID0gdGhpcy5wb3AoKTtcbiAgICB2YXIgZm4gPSBlbnN1cmVNZXRob2Qob2JqLCBtZXRob2ROYW1lKTtcbiAgICByZXR1cm4gZm4uYXBwbHkob2JqLCB0aGlzKTtcbn1cblByb21pc2UucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAobWV0aG9kTmFtZSkge1xuICAgIHZhciAkX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7dmFyIGFyZ3MgPSBuZXcgQXJyYXkoJF9sZW4gLSAxKTsgZm9yKHZhciAkX2kgPSAxOyAkX2kgPCAkX2xlbjsgKyskX2kpIHthcmdzWyRfaSAtIDFdID0gYXJndW1lbnRzWyRfaV07fVxuICAgIGlmICghdHJ1ZSkge1xuICAgICAgICBpZiAoY2FuRXZhbHVhdGUpIHtcbiAgICAgICAgICAgIHZhciBtYXliZUNhbGxlciA9IGdldE1ldGhvZENhbGxlcihtZXRob2ROYW1lKTtcbiAgICAgICAgICAgIGlmIChtYXliZUNhbGxlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICAgICAgICAgICAgICBtYXliZUNhbGxlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGFyZ3MsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXJncy5wdXNoKG1ldGhvZE5hbWUpO1xuICAgIHJldHVybiB0aGlzLl90aGVuKGNhbGxlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGFyZ3MsIHVuZGVmaW5lZCk7XG59O1xuXG5mdW5jdGlvbiBuYW1lZEdldHRlcihvYmopIHtcbiAgICByZXR1cm4gb2JqW3RoaXNdO1xufVxuZnVuY3Rpb24gaW5kZXhlZEdldHRlcihvYmopIHtcbiAgICB2YXIgaW5kZXggPSArdGhpcztcbiAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IE1hdGgubWF4KDAsIGluZGV4ICsgb2JqLmxlbmd0aCk7XG4gICAgcmV0dXJuIG9ialtpbmRleF07XG59XG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAocHJvcGVydHlOYW1lKSB7XG4gICAgdmFyIGlzSW5kZXggPSAodHlwZW9mIHByb3BlcnR5TmFtZSA9PT0gXCJudW1iZXJcIik7XG4gICAgdmFyIGdldHRlcjtcbiAgICBpZiAoIWlzSW5kZXgpIHtcbiAgICAgICAgaWYgKGNhbkV2YWx1YXRlKSB7XG4gICAgICAgICAgICB2YXIgbWF5YmVHZXR0ZXIgPSBnZXRHZXR0ZXIocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgIGdldHRlciA9IG1heWJlR2V0dGVyICE9PSBudWxsID8gbWF5YmVHZXR0ZXIgOiBuYW1lZEdldHRlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdldHRlciA9IG5hbWVkR2V0dGVyO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0dGVyID0gaW5kZXhlZEdldHRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4oZ2V0dGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcHJvcGVydHlOYW1lLCB1bmRlZmluZWQpO1xufTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG52YXIgZXJyb3JzID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgQ2FuY2VsbGF0aW9uRXJyb3IgPSBlcnJvcnMuQ2FuY2VsbGF0aW9uRXJyb3I7XG5cblByb21pc2UucHJvdG90eXBlLl9jYW5jZWwgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKCF0aGlzLmlzQ2FuY2VsbGFibGUoKSkgcmV0dXJuIHRoaXM7XG4gICAgdmFyIHBhcmVudDtcbiAgICB2YXIgcHJvbWlzZVRvUmVqZWN0ID0gdGhpcztcbiAgICB3aGlsZSAoKHBhcmVudCA9IHByb21pc2VUb1JlamVjdC5fY2FuY2VsbGF0aW9uUGFyZW50KSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIHBhcmVudC5pc0NhbmNlbGxhYmxlKCkpIHtcbiAgICAgICAgcHJvbWlzZVRvUmVqZWN0ID0gcGFyZW50O1xuICAgIH1cbiAgICB0aGlzLl91bnNldENhbmNlbGxhYmxlKCk7XG4gICAgcHJvbWlzZVRvUmVqZWN0Ll90YXJnZXQoKS5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCBmYWxzZSwgdHJ1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKCF0aGlzLmlzQ2FuY2VsbGFibGUoKSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHJlYXNvbiA9PT0gdW5kZWZpbmVkKSByZWFzb24gPSBuZXcgQ2FuY2VsbGF0aW9uRXJyb3IoKTtcbiAgICBhc3luYy5pbnZva2VMYXRlcih0aGlzLl9jYW5jZWwsIHRoaXMsIHJlYXNvbik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5jYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fY2FuY2VsbGFibGUoKSkgcmV0dXJuIHRoaXM7XG4gICAgYXN5bmMuZW5hYmxlVHJhbXBvbGluZSgpO1xuICAgIHRoaXMuX3NldENhbmNlbGxhYmxlKCk7XG4gICAgdGhpcy5fY2FuY2VsbGF0aW9uUGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudW5jYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmV0ID0gdGhpcy50aGVuKCk7XG4gICAgcmV0Ll91bnNldENhbmNlbGxhYmxlKCk7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZvcmsgPSBmdW5jdGlvbiAoZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcykge1xuICAgIHZhciByZXQgPSB0aGlzLl90aGVuKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuXG4gICAgcmV0Ll9zZXRDYW5jZWxsYWJsZSgpO1xuICAgIHJldC5fY2FuY2VsbGF0aW9uUGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXQ7XG59O1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vZXJyb3JzLmpzXCI6MTN9XSw3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGJsdWViaXJkRnJhbWVQYXR0ZXJuID1cbiAgICAvW1xcXFxcXC9dYmx1ZWJpcmRbXFxcXFxcL11qc1tcXFxcXFwvXShtYWlufGRlYnVnfHphbGdvfGluc3RydW1lbnRlZCkvO1xudmFyIHN0YWNrRnJhbWVQYXR0ZXJuID0gbnVsbDtcbnZhciBmb3JtYXRTdGFjayA9IG51bGw7XG52YXIgaW5kZW50U3RhY2tGcmFtZXMgPSBmYWxzZTtcbnZhciB3YXJuO1xuXG5mdW5jdGlvbiBDYXB0dXJlZFRyYWNlKHBhcmVudCkge1xuICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5fbGVuZ3RoID0gMSArIChwYXJlbnQgPT09IHVuZGVmaW5lZCA/IDAgOiBwYXJlbnQuX2xlbmd0aCk7XG4gICAgY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQ2FwdHVyZWRUcmFjZSk7XG4gICAgaWYgKGxlbmd0aCA+IDMyKSB0aGlzLnVuY3ljbGUoKTtcbn1cbnV0aWwuaW5oZXJpdHMoQ2FwdHVyZWRUcmFjZSwgRXJyb3IpO1xuXG5DYXB0dXJlZFRyYWNlLnByb3RvdHlwZS51bmN5Y2xlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuX2xlbmd0aDtcbiAgICBpZiAobGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgIHZhciBub2RlcyA9IFtdO1xuICAgIHZhciBzdGFja1RvSW5kZXggPSB7fTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBub2RlID0gdGhpczsgbm9kZSAhPT0gdW5kZWZpbmVkOyArK2kpIHtcbiAgICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX3BhcmVudDtcbiAgICB9XG4gICAgbGVuZ3RoID0gdGhpcy5fbGVuZ3RoID0gaTtcbiAgICBmb3IgKHZhciBpID0gbGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gbm9kZXNbaV0uc3RhY2s7XG4gICAgICAgIGlmIChzdGFja1RvSW5kZXhbc3RhY2tdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0YWNrVG9JbmRleFtzdGFja10gPSBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRTdGFjayA9IG5vZGVzW2ldLnN0YWNrO1xuICAgICAgICB2YXIgaW5kZXggPSBzdGFja1RvSW5kZXhbY3VycmVudFN0YWNrXTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQgJiYgaW5kZXggIT09IGkpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgICAgICBub2Rlc1tpbmRleCAtIDFdLl9wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbm9kZXNbaW5kZXggLSAxXS5fbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGVzW2ldLl9wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBub2Rlc1tpXS5fbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIHZhciBjeWNsZUVkZ2VOb2RlID0gaSA+IDAgPyBub2Rlc1tpIC0gMV0gOiB0aGlzO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fcGFyZW50ID0gbm9kZXNbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQudW5jeWNsZSgpO1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX2xlbmd0aCA9XG4gICAgICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX3BhcmVudC5fbGVuZ3RoICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX2xlbmd0aCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY3VycmVudENoaWxkTGVuZ3RoID0gY3ljbGVFZGdlTm9kZS5fbGVuZ3RoICsgMTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBpIC0gMjsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgICAgICAgICBub2Rlc1tqXS5fbGVuZ3RoID0gY3VycmVudENoaWxkTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDaGlsZExlbmd0aCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuQ2FwdHVyZWRUcmFjZS5wcm90b3R5cGUucGFyZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudDtcbn07XG5cbkNhcHR1cmVkVHJhY2UucHJvdG90eXBlLmhhc1BhcmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgIT09IHVuZGVmaW5lZDtcbn07XG5cbkNhcHR1cmVkVHJhY2UucHJvdG90eXBlLmF0dGFjaEV4dHJhVHJhY2UgPSBmdW5jdGlvbihlcnJvcikge1xuICAgIGlmIChlcnJvci5fX3N0YWNrQ2xlYW5lZF9fKSByZXR1cm47XG4gICAgdGhpcy51bmN5Y2xlKCk7XG4gICAgdmFyIHBhcnNlZCA9IENhcHR1cmVkVHJhY2UucGFyc2VTdGFja0FuZE1lc3NhZ2UoZXJyb3IpO1xuICAgIHZhciBtZXNzYWdlID0gcGFyc2VkLm1lc3NhZ2U7XG4gICAgdmFyIHN0YWNrcyA9IFtwYXJzZWQuc3RhY2tdO1xuXG4gICAgdmFyIHRyYWNlID0gdGhpcztcbiAgICB3aGlsZSAodHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdGFja3MucHVzaChjbGVhblN0YWNrKHRyYWNlLnN0YWNrLnNwbGl0KFwiXFxuXCIpKSk7XG4gICAgICAgIHRyYWNlID0gdHJhY2UuX3BhcmVudDtcbiAgICB9XG4gICAgcmVtb3ZlQ29tbW9uUm9vdHMoc3RhY2tzKTtcbiAgICByZW1vdmVEdXBsaWNhdGVPckVtcHR5SnVtcHMoc3RhY2tzKTtcbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKGVycm9yLCBcInN0YWNrXCIsIHJlY29uc3RydWN0U3RhY2sobWVzc2FnZSwgc3RhY2tzKSk7XG4gICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChlcnJvciwgXCJfX3N0YWNrQ2xlYW5lZF9fXCIsIHRydWUpO1xufTtcblxuZnVuY3Rpb24gcmVjb25zdHJ1Y3RTdGFjayhtZXNzYWdlLCBzdGFja3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrcy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICAgICAgc3RhY2tzW2ldLnB1c2goXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiKTtcbiAgICAgICAgc3RhY2tzW2ldID0gc3RhY2tzW2ldLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICAgIGlmIChpIDwgc3RhY2tzLmxlbmd0aCkge1xuICAgICAgICBzdGFja3NbaV0gPSBzdGFja3NbaV0uam9pbihcIlxcblwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2UgKyBcIlxcblwiICsgc3RhY2tzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUR1cGxpY2F0ZU9yRW1wdHlKdW1wcyhzdGFja3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoc3RhY2tzW2ldLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICAgICAgKChpICsgMSA8IHN0YWNrcy5sZW5ndGgpICYmIHN0YWNrc1tpXVswXSA9PT0gc3RhY2tzW2krMV1bMF0pKSB7XG4gICAgICAgICAgICBzdGFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVDb21tb25Sb290cyhzdGFja3MpIHtcbiAgICB2YXIgY3VycmVudCA9IHN0YWNrc1swXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHN0YWNrcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcHJldiA9IHN0YWNrc1tpXTtcbiAgICAgICAgdmFyIGN1cnJlbnRMYXN0SW5kZXggPSBjdXJyZW50Lmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBjdXJyZW50TGFzdExpbmUgPSBjdXJyZW50W2N1cnJlbnRMYXN0SW5kZXhdO1xuICAgICAgICB2YXIgY29tbW9uUm9vdE1lZXRQb2ludCA9IC0xO1xuXG4gICAgICAgIGZvciAodmFyIGogPSBwcmV2Lmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qKSB7XG4gICAgICAgICAgICBpZiAocHJldltqXSA9PT0gY3VycmVudExhc3RMaW5lKSB7XG4gICAgICAgICAgICAgICAgY29tbW9uUm9vdE1lZXRQb2ludCA9IGo7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBqID0gY29tbW9uUm9vdE1lZXRQb2ludDsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgICAgIHZhciBsaW5lID0gcHJldltqXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50W2N1cnJlbnRMYXN0SW5kZXhdID09PSBsaW5lKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudC5wb3AoKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50TGFzdEluZGV4LS07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSBwcmV2O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYW5TdGFjayhzdGFjaykge1xuICAgIHZhciByZXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gc3RhY2tbaV07XG4gICAgICAgIHZhciBpc1RyYWNlTGluZSA9IHN0YWNrRnJhbWVQYXR0ZXJuLnRlc3QobGluZSkgfHxcbiAgICAgICAgICAgIFwiICAgIChObyBzdGFjayB0cmFjZSlcIiA9PT0gbGluZTtcbiAgICAgICAgdmFyIGlzSW50ZXJuYWxGcmFtZSA9IGlzVHJhY2VMaW5lICYmIHNob3VsZElnbm9yZShsaW5lKTtcbiAgICAgICAgaWYgKGlzVHJhY2VMaW5lICYmICFpc0ludGVybmFsRnJhbWUpIHtcbiAgICAgICAgICAgIGlmIChpbmRlbnRTdGFja0ZyYW1lcyAmJiBsaW5lLmNoYXJBdCgwKSAhPT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICBsaW5lID0gXCIgICAgXCIgKyBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0LnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gc3RhY2tGcmFtZXNBc0FycmF5KGVycm9yKSB7XG4gICAgdmFyIHN0YWNrID0gZXJyb3Iuc3RhY2sucmVwbGFjZSgvXFxzKyQvZywgXCJcIikuc3BsaXQoXCJcXG5cIik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IHN0YWNrW2ldO1xuICAgICAgICBpZiAoXCIgICAgKE5vIHN0YWNrIHRyYWNlKVwiID09PSBsaW5lIHx8IHN0YWNrRnJhbWVQYXR0ZXJuLnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpID4gMCkge1xuICAgICAgICBzdGFjayA9IHN0YWNrLnNsaWNlKGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhY2s7XG59XG5cbkNhcHR1cmVkVHJhY2UucGFyc2VTdGFja0FuZE1lc3NhZ2UgPSBmdW5jdGlvbihlcnJvcikge1xuICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrO1xuICAgIHZhciBtZXNzYWdlID0gZXJyb3IudG9TdHJpbmcoKTtcbiAgICBzdGFjayA9IHR5cGVvZiBzdGFjayA9PT0gXCJzdHJpbmdcIiAmJiBzdGFjay5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzdGFja0ZyYW1lc0FzQXJyYXkoZXJyb3IpIDogW1wiICAgIChObyBzdGFjayB0cmFjZSlcIl07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhY2s6IGNsZWFuU3RhY2soc3RhY2spXG4gICAgfTtcbn07XG5cbkNhcHR1cmVkVHJhY2UuZm9ybWF0QW5kTG9nRXJyb3IgPSBmdW5jdGlvbihlcnJvciwgdGl0bGUpIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2U7XG4gICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGVycm9yID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrO1xuICAgICAgICAgICAgbWVzc2FnZSA9IHRpdGxlICsgZm9ybWF0U3RhY2soc3RhY2ssIGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0aXRsZSArIFN0cmluZyhlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB3YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHdhcm4obWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvbnNvbGUubG9nID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5DYXB0dXJlZFRyYWNlLnVuaGFuZGxlZFJlamVjdGlvbiA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICBDYXB0dXJlZFRyYWNlLmZvcm1hdEFuZExvZ0Vycm9yKHJlYXNvbiwgXCJeLS0tIFdpdGggYWRkaXRpb25hbCBzdGFjayB0cmFjZTogXCIpO1xufTtcblxuQ2FwdHVyZWRUcmFjZS5pc1N1cHBvcnRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdHlwZW9mIGNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCI7XG59O1xuXG5DYXB0dXJlZFRyYWNlLmZpcmVSZWplY3Rpb25FdmVudCA9XG5mdW5jdGlvbihuYW1lLCBsb2NhbEhhbmRsZXIsIHJlYXNvbiwgcHJvbWlzZSkge1xuICAgIHZhciBsb2NhbEV2ZW50RmlyZWQgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGxvY2FsSGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBsb2NhbEV2ZW50RmlyZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwicmVqZWN0aW9uSGFuZGxlZFwiKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxIYW5kbGVyKHByb21pc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhbEhhbmRsZXIocmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihlKTtcbiAgICB9XG5cbiAgICB2YXIgZ2xvYmFsRXZlbnRGaXJlZCA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIGdsb2JhbEV2ZW50RmlyZWQgPSBmaXJlR2xvYmFsRXZlbnQobmFtZSwgcmVhc29uLCBwcm9taXNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGdsb2JhbEV2ZW50RmlyZWQgPSB0cnVlO1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKGUpO1xuICAgIH1cblxuICAgIHZhciBkb21FdmVudEZpcmVkID0gZmFsc2U7XG4gICAgaWYgKGZpcmVEb21FdmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZG9tRXZlbnRGaXJlZCA9IGZpcmVEb21FdmVudChuYW1lLnRvTG93ZXJDYXNlKCksIHtcbiAgICAgICAgICAgICAgICByZWFzb246IHJlYXNvbixcbiAgICAgICAgICAgICAgICBwcm9taXNlOiBwcm9taXNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZG9tRXZlbnRGaXJlZCA9IHRydWU7XG4gICAgICAgICAgICBhc3luYy50aHJvd0xhdGVyKGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFnbG9iYWxFdmVudEZpcmVkICYmICFsb2NhbEV2ZW50RmlyZWQgJiYgIWRvbUV2ZW50RmlyZWQgJiZcbiAgICAgICAgbmFtZSA9PT0gXCJ1bmhhbmRsZWRSZWplY3Rpb25cIikge1xuICAgICAgICBDYXB0dXJlZFRyYWNlLmZvcm1hdEFuZExvZ0Vycm9yKHJlYXNvbiwgXCJVbmhhbmRsZWQgcmVqZWN0aW9uIFwiKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBmb3JtYXROb25FcnJvcihvYmopIHtcbiAgICB2YXIgc3RyO1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgc3RyID0gXCJbZnVuY3Rpb24gXCIgK1xuICAgICAgICAgICAgKG9iai5uYW1lIHx8IFwiYW5vbnltb3VzXCIpICtcbiAgICAgICAgICAgIFwiXVwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IG9iai50b1N0cmluZygpO1xuICAgICAgICB2YXIgcnVzZWxlc3NUb1N0cmluZyA9IC9cXFtvYmplY3QgW2EtekEtWjAtOSRfXStcXF0vO1xuICAgICAgICBpZiAocnVzZWxlc3NUb1N0cmluZy50ZXN0KHN0cikpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1N0ciA9IEpTT04uc3RyaW5naWZ5KG9iaik7XG4gICAgICAgICAgICAgICAgc3RyID0gbmV3U3RyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZSkge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0ci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHN0ciA9IFwiKGVtcHR5IGFycmF5KVwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoXCIoPFwiICsgc25pcChzdHIpICsgXCI+LCBubyBzdGFjayB0cmFjZSlcIik7XG59XG5cbmZ1bmN0aW9uIHNuaXAoc3RyKSB7XG4gICAgdmFyIG1heENoYXJzID0gNDE7XG4gICAgaWYgKHN0ci5sZW5ndGggPCBtYXhDaGFycykge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICByZXR1cm4gc3RyLnN1YnN0cigwLCBtYXhDaGFycyAtIDMpICsgXCIuLi5cIjtcbn1cblxudmFyIHNob3VsZElnbm9yZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH07XG52YXIgcGFyc2VMaW5lSW5mb1JlZ2V4ID0gL1tcXC88XFwoXShbXjpcXC9dKyk6KFxcZCspOig/OlxcZCspXFwpP1xccyokLztcbmZ1bmN0aW9uIHBhcnNlTGluZUluZm8obGluZSkge1xuICAgIHZhciBtYXRjaGVzID0gbGluZS5tYXRjaChwYXJzZUxpbmVJbmZvUmVnZXgpO1xuICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWxlTmFtZTogbWF0Y2hlc1sxXSxcbiAgICAgICAgICAgIGxpbmU6IHBhcnNlSW50KG1hdGNoZXNbMl0sIDEwKVxuICAgICAgICB9O1xuICAgIH1cbn1cbkNhcHR1cmVkVHJhY2Uuc2V0Qm91bmRzID0gZnVuY3Rpb24oZmlyc3RMaW5lRXJyb3IsIGxhc3RMaW5lRXJyb3IpIHtcbiAgICBpZiAoIUNhcHR1cmVkVHJhY2UuaXNTdXBwb3J0ZWQoKSkgcmV0dXJuO1xuICAgIHZhciBmaXJzdFN0YWNrTGluZXMgPSBmaXJzdExpbmVFcnJvci5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgbGFzdFN0YWNrTGluZXMgPSBsYXN0TGluZUVycm9yLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBmaXJzdEluZGV4ID0gLTE7XG4gICAgdmFyIGxhc3RJbmRleCA9IC0xO1xuICAgIHZhciBmaXJzdEZpbGVOYW1lO1xuICAgIHZhciBsYXN0RmlsZU5hbWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaXJzdFN0YWNrTGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHBhcnNlTGluZUluZm8oZmlyc3RTdGFja0xpbmVzW2ldKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgZmlyc3RGaWxlTmFtZSA9IHJlc3VsdC5maWxlTmFtZTtcbiAgICAgICAgICAgIGZpcnN0SW5kZXggPSByZXN1bHQubGluZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdFN0YWNrTGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHBhcnNlTGluZUluZm8obGFzdFN0YWNrTGluZXNbaV0pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICBsYXN0RmlsZU5hbWUgPSByZXN1bHQuZmlsZU5hbWU7XG4gICAgICAgICAgICBsYXN0SW5kZXggPSByZXN1bHQubGluZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChmaXJzdEluZGV4IDwgMCB8fCBsYXN0SW5kZXggPCAwIHx8ICFmaXJzdEZpbGVOYW1lIHx8ICFsYXN0RmlsZU5hbWUgfHxcbiAgICAgICAgZmlyc3RGaWxlTmFtZSAhPT0gbGFzdEZpbGVOYW1lIHx8IGZpcnN0SW5kZXggPj0gbGFzdEluZGV4KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzaG91bGRJZ25vcmUgPSBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIGlmIChibHVlYmlyZEZyYW1lUGF0dGVybi50ZXN0KGxpbmUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgdmFyIGluZm8gPSBwYXJzZUxpbmVJbmZvKGxpbmUpO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgaWYgKGluZm8uZmlsZU5hbWUgPT09IGZpcnN0RmlsZU5hbWUgJiZcbiAgICAgICAgICAgICAgICAoZmlyc3RJbmRleCA8PSBpbmZvLmxpbmUgJiYgaW5mby5saW5lIDw9IGxhc3RJbmRleCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbn07XG5cbnZhciBjYXB0dXJlU3RhY2tUcmFjZSA9IChmdW5jdGlvbiBzdGFja0RldGVjdGlvbigpIHtcbiAgICB2YXIgdjhzdGFja0ZyYW1lUGF0dGVybiA9IC9eXFxzKmF0XFxzKi87XG4gICAgdmFyIHY4c3RhY2tGb3JtYXR0ZXIgPSBmdW5jdGlvbihzdGFjaywgZXJyb3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdGFjayA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHN0YWNrO1xuXG4gICAgICAgIGlmIChlcnJvci5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdE5vbkVycm9yKGVycm9yKTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBFcnJvci5zdGFja1RyYWNlTGltaXQgPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgdHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ICsgNjtcbiAgICAgICAgc3RhY2tGcmFtZVBhdHRlcm4gPSB2OHN0YWNrRnJhbWVQYXR0ZXJuO1xuICAgICAgICBmb3JtYXRTdGFjayA9IHY4c3RhY2tGb3JtYXR0ZXI7XG4gICAgICAgIHZhciBjYXB0dXJlU3RhY2tUcmFjZSA9IEVycm9yLmNhcHR1cmVTdGFja1RyYWNlO1xuXG4gICAgICAgIHNob3VsZElnbm9yZSA9IGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBibHVlYmlyZEZyYW1lUGF0dGVybi50ZXN0KGxpbmUpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocmVjZWl2ZXIsIGlnbm9yZVVudGlsKSB7XG4gICAgICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQgKyA2O1xuICAgICAgICAgICAgY2FwdHVyZVN0YWNrVHJhY2UocmVjZWl2ZXIsIGlnbm9yZVVudGlsKTtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdCAtIDY7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcblxuICAgIGlmICh0eXBlb2YgZXJyLnN0YWNrID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgIGVyci5zdGFjay5zcGxpdChcIlxcblwiKVswXS5pbmRleE9mKFwic3RhY2tEZXRlY3Rpb25AXCIpID49IDApIHtcbiAgICAgICAgc3RhY2tGcmFtZVBhdHRlcm4gPSAvQC87XG4gICAgICAgIGZvcm1hdFN0YWNrID0gdjhzdGFja0Zvcm1hdHRlcjtcbiAgICAgICAgaW5kZW50U3RhY2tGcmFtZXMgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gY2FwdHVyZVN0YWNrVHJhY2Uobykge1xuICAgICAgICAgICAgby5zdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBoYXNTdGFja0FmdGVyVGhyb3c7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IEVycm9yKCk7IH1cbiAgICBjYXRjaChlKSB7XG4gICAgICAgIGhhc1N0YWNrQWZ0ZXJUaHJvdyA9IChcInN0YWNrXCIgaW4gZSk7XG4gICAgfVxuICAgIGlmICghKFwic3RhY2tcIiBpbiBlcnIpICYmIGhhc1N0YWNrQWZ0ZXJUaHJvdyAmJlxuICAgICAgICB0eXBlb2YgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHN0YWNrRnJhbWVQYXR0ZXJuID0gdjhzdGFja0ZyYW1lUGF0dGVybjtcbiAgICAgICAgZm9ybWF0U3RhY2sgPSB2OHN0YWNrRm9ybWF0dGVyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gY2FwdHVyZVN0YWNrVHJhY2Uobykge1xuICAgICAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ICsgNjtcbiAgICAgICAgICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcigpOyB9XG4gICAgICAgICAgICBjYXRjaChlKSB7IG8uc3RhY2sgPSBlLnN0YWNrOyB9XG4gICAgICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQgLSA2O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZvcm1hdFN0YWNrID0gZnVuY3Rpb24oc3RhY2ssIGVycm9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhY2sgPT09IFwic3RyaW5nXCIpIHJldHVybiBzdGFjaztcblxuICAgICAgICBpZiAoKHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGVycm9yID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICBlcnJvci5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdE5vbkVycm9yKGVycm9yKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG51bGw7XG5cbn0pKFtdKTtcblxudmFyIGZpcmVEb21FdmVudDtcbnZhciBmaXJlR2xvYmFsRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNOb2RlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihuYW1lLCByZWFzb24sIHByb21pc2UpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcInJlamVjdGlvbkhhbmRsZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmVtaXQobmFtZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmVtaXQobmFtZSwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY3VzdG9tRXZlbnRXb3JrcyA9IGZhbHNlO1xuICAgICAgICB2YXIgYW55RXZlbnRXb3JrcyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZXYgPSBuZXcgc2VsZi5DdXN0b21FdmVudChcInRlc3RcIik7XG4gICAgICAgICAgICBjdXN0b21FdmVudFdvcmtzID0gZXYgaW5zdGFuY2VvZiBDdXN0b21FdmVudDtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgaWYgKCFjdXN0b21FdmVudFdvcmtzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICAgICAgICAgICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KFwidGVzdGluZ3RoZWV2ZW50XCIsIGZhbHNlLCB0cnVlLCB7fSk7XG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBhbnlFdmVudFdvcmtzID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFueUV2ZW50V29ya3MpIHtcbiAgICAgICAgICAgIGZpcmVEb21FdmVudCA9IGZ1bmN0aW9uKHR5cGUsIGRldGFpbCkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudDtcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tRXZlbnRXb3Jrcykge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IG5ldyBzZWxmLkN1c3RvbUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZi5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCB0cnVlLCBkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBldmVudCA/ICFzZWxmLmRpc3BhdGNoRXZlbnQoZXZlbnQpIDogZmFsc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvV2luZG93TWV0aG9kTmFtZU1hcCA9IHt9O1xuICAgICAgICB0b1dpbmRvd01ldGhvZE5hbWVNYXBbXCJ1bmhhbmRsZWRSZWplY3Rpb25cIl0gPSAoXCJvblwiICtcbiAgICAgICAgICAgIFwidW5oYW5kbGVkUmVqZWN0aW9uXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHRvV2luZG93TWV0aG9kTmFtZU1hcFtcInJlamVjdGlvbkhhbmRsZWRcIl0gPSAoXCJvblwiICtcbiAgICAgICAgICAgIFwicmVqZWN0aW9uSGFuZGxlZFwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihuYW1lLCByZWFzb24sIHByb21pc2UpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2ROYW1lID0gdG9XaW5kb3dNZXRob2ROYW1lTWFwW25hbWVdO1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IHNlbGZbbWV0aG9kTmFtZV07XG4gICAgICAgICAgICBpZiAoIW1ldGhvZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwicmVqZWN0aW9uSGFuZGxlZFwiKSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwoc2VsZiwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHNlbGYsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICB9XG59KSgpO1xuXG5pZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGNvbnNvbGUud2FybiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHdhcm4gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgfTtcbiAgICBpZiAodXRpbC5pc05vZGUgJiYgcHJvY2Vzcy5zdGRlcnIuaXNUVFkpIHtcbiAgICAgICAgd2FybiA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKFwiXFx1MDAxYlszMW1cIiArIG1lc3NhZ2UgKyBcIlxcdTAwMWJbMzltXFxuXCIpO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoIXV0aWwuaXNOb2RlICYmIHR5cGVvZiAobmV3IEVycm9yKCkuc3RhY2spID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHdhcm4gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCIlY1wiICsgbWVzc2FnZSwgXCJjb2xvcjogcmVkXCIpO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxucmV0dXJuIENhcHR1cmVkVHJhY2U7XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi91dGlsLmpzXCI6Mzh9XSw4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihORVhUX0ZJTFRFUikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIGtleXMgPSBfZGVyZXFfKFwiLi9lczUuanNcIikua2V5cztcbnZhciBUeXBlRXJyb3IgPSBlcnJvcnMuVHlwZUVycm9yO1xuXG5mdW5jdGlvbiBDYXRjaEZpbHRlcihpbnN0YW5jZXMsIGNhbGxiYWNrLCBwcm9taXNlKSB7XG4gICAgdGhpcy5faW5zdGFuY2VzID0gaW5zdGFuY2VzO1xuICAgIHRoaXMuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgdGhpcy5fcHJvbWlzZSA9IHByb21pc2U7XG59XG5cbmZ1bmN0aW9uIHNhZmVQcmVkaWNhdGUocHJlZGljYXRlLCBlKSB7XG4gICAgdmFyIHNhZmVPYmplY3QgPSB7fTtcbiAgICB2YXIgcmV0ZmlsdGVyID0gdHJ5Q2F0Y2gocHJlZGljYXRlKS5jYWxsKHNhZmVPYmplY3QsIGUpO1xuXG4gICAgaWYgKHJldGZpbHRlciA9PT0gZXJyb3JPYmopIHJldHVybiByZXRmaWx0ZXI7XG5cbiAgICB2YXIgc2FmZUtleXMgPSBrZXlzKHNhZmVPYmplY3QpO1xuICAgIGlmIChzYWZlS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgZXJyb3JPYmouZSA9IG5ldyBUeXBlRXJyb3IoXCJDYXRjaCBmaWx0ZXIgbXVzdCBpbmhlcml0IGZyb20gRXJyb3Igb3IgYmUgYSBzaW1wbGUgcHJlZGljYXRlIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvbzg0bzY4XFx1MDAwYVwiKTtcbiAgICAgICAgcmV0dXJuIGVycm9yT2JqO1xuICAgIH1cbiAgICByZXR1cm4gcmV0ZmlsdGVyO1xufVxuXG5DYXRjaEZpbHRlci5wcm90b3R5cGUuZG9GaWx0ZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBjYiA9IHRoaXMuX2NhbGxiYWNrO1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZTtcbiAgICB2YXIgYm91bmRUbyA9IHByb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciBpdGVtID0gdGhpcy5faW5zdGFuY2VzW2ldO1xuICAgICAgICB2YXIgaXRlbUlzRXJyb3JUeXBlID0gaXRlbSA9PT0gRXJyb3IgfHxcbiAgICAgICAgICAgIChpdGVtICE9IG51bGwgJiYgaXRlbS5wcm90b3R5cGUgaW5zdGFuY2VvZiBFcnJvcik7XG5cbiAgICAgICAgaWYgKGl0ZW1Jc0Vycm9yVHlwZSAmJiBlIGluc3RhbmNlb2YgaXRlbSkge1xuICAgICAgICAgICAgdmFyIHJldCA9IHRyeUNhdGNoKGNiKS5jYWxsKGJvdW5kVG8sIGUpO1xuICAgICAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICBORVhUX0ZJTFRFUi5lID0gcmV0LmU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5FWFRfRklMVEVSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJmdW5jdGlvblwiICYmICFpdGVtSXNFcnJvclR5cGUpIHtcbiAgICAgICAgICAgIHZhciBzaG91bGRIYW5kbGUgPSBzYWZlUHJlZGljYXRlKGl0ZW0sIGUpO1xuICAgICAgICAgICAgaWYgKHNob3VsZEhhbmRsZSA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICBlID0gZXJyb3JPYmouZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hvdWxkSGFuZGxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHRyeUNhdGNoKGNiKS5jYWxsKGJvdW5kVG8sIGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIE5FWFRfRklMVEVSLmUgPSByZXQuZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5FWFRfRklMVEVSO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIE5FWFRfRklMVEVSLmUgPSBlO1xuICAgIHJldHVybiBORVhUX0ZJTFRFUjtcbn07XG5cbnJldHVybiBDYXRjaEZpbHRlcjtcbn07XG5cbn0se1wiLi9lcnJvcnMuanNcIjoxMyxcIi4vZXM1LmpzXCI6MTQsXCIuL3V0aWwuanNcIjozOH1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIENhcHR1cmVkVHJhY2UsIGlzRGVidWdnaW5nKSB7XG52YXIgY29udGV4dFN0YWNrID0gW107XG5mdW5jdGlvbiBDb250ZXh0KCkge1xuICAgIHRoaXMuX3RyYWNlID0gbmV3IENhcHR1cmVkVHJhY2UocGVla0NvbnRleHQoKSk7XG59XG5Db250ZXh0LnByb3RvdHlwZS5fcHVzaENvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFpc0RlYnVnZ2luZygpKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3RyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dFN0YWNrLnB1c2godGhpcy5fdHJhY2UpO1xuICAgIH1cbn07XG5cbkNvbnRleHQucHJvdG90eXBlLl9wb3BDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghaXNEZWJ1Z2dpbmcoKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl90cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHRTdGFjay5wb3AoKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVDb250ZXh0KCkge1xuICAgIGlmIChpc0RlYnVnZ2luZygpKSByZXR1cm4gbmV3IENvbnRleHQoKTtcbn1cblxuZnVuY3Rpb24gcGVla0NvbnRleHQoKSB7XG4gICAgdmFyIGxhc3RJbmRleCA9IGNvbnRleHRTdGFjay5sZW5ndGggLSAxO1xuICAgIGlmIChsYXN0SW5kZXggPj0gMCkge1xuICAgICAgICByZXR1cm4gY29udGV4dFN0YWNrW2xhc3RJbmRleF07XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cblByb21pc2UucHJvdG90eXBlLl9wZWVrQ29udGV4dCA9IHBlZWtDb250ZXh0O1xuUHJvbWlzZS5wcm90b3R5cGUuX3B1c2hDb250ZXh0ID0gQ29udGV4dC5wcm90b3R5cGUuX3B1c2hDb250ZXh0O1xuUHJvbWlzZS5wcm90b3R5cGUuX3BvcENvbnRleHQgPSBDb250ZXh0LnByb3RvdHlwZS5fcG9wQ29udGV4dDtcblxucmV0dXJuIGNyZWF0ZUNvbnRleHQ7XG59O1xuXG59LHt9XSwxMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgQ2FwdHVyZWRUcmFjZSkge1xudmFyIGdldERvbWFpbiA9IFByb21pc2UuX2dldERvbWFpbjtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIFdhcm5pbmcgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIikuV2FybmluZztcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBjYW5BdHRhY2hUcmFjZSA9IHV0aWwuY2FuQXR0YWNoVHJhY2U7XG52YXIgdW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZDtcbnZhciBwb3NzaWJseVVuaGFuZGxlZFJlamVjdGlvbjtcbnZhciBkZWJ1Z2dpbmcgPSBmYWxzZSB8fCAodXRpbC5pc05vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgKCEhcHJvY2Vzcy5lbnZbXCJCTFVFQklSRF9ERUJVR1wiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnZbXCJOT0RFX0VOVlwiXSA9PT0gXCJkZXZlbG9wbWVudFwiKSk7XG5cbmlmIChkZWJ1Z2dpbmcpIHtcbiAgICBhc3luYy5kaXNhYmxlVHJhbXBvbGluZUlmTmVjZXNzYXJ5KCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLl9pZ25vcmVSZWplY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxNjc3NzIxNjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9lbnN1cmVQb3NzaWJsZVJlamVjdGlvbkhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCh0aGlzLl9iaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMCkgcmV0dXJuO1xuICAgIHRoaXMuX3NldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgYXN5bmMuaW52b2tlTGF0ZXIodGhpcy5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uLCB0aGlzLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX25vdGlmeVVuaGFuZGxlZFJlamVjdGlvbklzSGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBDYXB0dXJlZFRyYWNlLmZpcmVSZWplY3Rpb25FdmVudChcInJlamVjdGlvbkhhbmRsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkLCB1bmRlZmluZWQsIHRoaXMpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX25vdGlmeVVuaGFuZGxlZFJlamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faXNSZWplY3Rpb25VbmhhbmRsZWQoKSkge1xuICAgICAgICB2YXIgcmVhc29uID0gdGhpcy5fZ2V0Q2FycmllZFN0YWNrVHJhY2UoKSB8fCB0aGlzLl9zZXR0bGVkVmFsdWU7XG4gICAgICAgIHRoaXMuX3NldFVuaGFuZGxlZFJlamVjdGlvbklzTm90aWZpZWQoKTtcbiAgICAgICAgQ2FwdHVyZWRUcmFjZS5maXJlUmVqZWN0aW9uRXZlbnQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zc2libHlVbmhhbmRsZWRSZWplY3Rpb24sIHJlYXNvbiwgdGhpcyk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFVuaGFuZGxlZFJlamVjdGlvbklzTm90aWZpZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDUyNDI4ODtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl91bnNldFVuaGFuZGxlZFJlamVjdGlvbklzTm90aWZpZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+NTI0Mjg4KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc1VuaGFuZGxlZFJlamVjdGlvbk5vdGlmaWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA1MjQyODgpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMjA5NzE1Mjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjIwOTcxNTIpO1xuICAgIGlmICh0aGlzLl9pc1VuaGFuZGxlZFJlamVjdGlvbk5vdGlmaWVkKCkpIHtcbiAgICAgICAgdGhpcy5fdW5zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkKCk7XG4gICAgICAgIHRoaXMuX25vdGlmeVVuaGFuZGxlZFJlamVjdGlvbklzSGFuZGxlZCgpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc1JlamVjdGlvblVuaGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMjA5NzE1MikgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldENhcnJpZWRTdGFja1RyYWNlID0gZnVuY3Rpb24gKGNhcHR1cmVkVHJhY2UpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMTA0ODU3NjtcbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gY2FwdHVyZWRUcmFjZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0NhcnJ5aW5nU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMTA0ODU3NikgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2dldENhcnJpZWRTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0NhcnJ5aW5nU3RhY2tUcmFjZSgpXG4gICAgICAgID8gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMFxuICAgICAgICA6IHVuZGVmaW5lZDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jYXB0dXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZGVidWdnaW5nKSB7XG4gICAgICAgIHRoaXMuX3RyYWNlID0gbmV3IENhcHR1cmVkVHJhY2UodGhpcy5fcGVla0NvbnRleHQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2F0dGFjaEV4dHJhVHJhY2UgPSBmdW5jdGlvbiAoZXJyb3IsIGlnbm9yZVNlbGYpIHtcbiAgICBpZiAoZGVidWdnaW5nICYmIGNhbkF0dGFjaFRyYWNlKGVycm9yKSkge1xuICAgICAgICB2YXIgdHJhY2UgPSB0aGlzLl90cmFjZTtcbiAgICAgICAgaWYgKHRyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpZ25vcmVTZWxmKSB0cmFjZSA9IHRyYWNlLl9wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRyYWNlLmF0dGFjaEV4dHJhVHJhY2UoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKCFlcnJvci5fX3N0YWNrQ2xlYW5lZF9fKSB7XG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gQ2FwdHVyZWRUcmFjZS5wYXJzZVN0YWNrQW5kTWVzc2FnZShlcnJvcik7XG4gICAgICAgICAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKGVycm9yLCBcInN0YWNrXCIsXG4gICAgICAgICAgICAgICAgcGFyc2VkLm1lc3NhZ2UgKyBcIlxcblwiICsgcGFyc2VkLnN0YWNrLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChlcnJvciwgXCJfX3N0YWNrQ2xlYW5lZF9fXCIsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3dhcm4gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIHdhcm5pbmcgPSBuZXcgV2FybmluZyhtZXNzYWdlKTtcbiAgICB2YXIgY3R4ID0gdGhpcy5fcGVla0NvbnRleHQoKTtcbiAgICBpZiAoY3R4KSB7XG4gICAgICAgIGN0eC5hdHRhY2hFeHRyYVRyYWNlKHdhcm5pbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSBDYXB0dXJlZFRyYWNlLnBhcnNlU3RhY2tBbmRNZXNzYWdlKHdhcm5pbmcpO1xuICAgICAgICB3YXJuaW5nLnN0YWNrID0gcGFyc2VkLm1lc3NhZ2UgKyBcIlxcblwiICsgcGFyc2VkLnN0YWNrLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICAgIENhcHR1cmVkVHJhY2UuZm9ybWF0QW5kTG9nRXJyb3Iod2FybmluZywgXCJcIik7XG59O1xuXG5Qcm9taXNlLm9uUG9zc2libHlVbmhhbmRsZWRSZWplY3Rpb24gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgZG9tYWluID0gZ2V0RG9tYWluKCk7XG4gICAgcG9zc2libHlVbmhhbmRsZWRSZWplY3Rpb24gPVxuICAgICAgICB0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIiA/IChkb21haW4gPT09IG51bGwgPyBmbiA6IGRvbWFpbi5iaW5kKGZuKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xufTtcblxuUHJvbWlzZS5vblVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgZG9tYWluID0gZ2V0RG9tYWluKCk7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZCA9XG4gICAgICAgIHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiID8gKGRvbWFpbiA9PT0gbnVsbCA/IGZuIDogZG9tYWluLmJpbmQoZm4pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG59O1xuXG5Qcm9taXNlLmxvbmdTdGFja1RyYWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXN5bmMuaGF2ZUl0ZW1zUXVldWVkKCkgJiZcbiAgICAgICAgZGVidWdnaW5nID09PSBmYWxzZVxuICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBlbmFibGUgbG9uZyBzdGFjayB0cmFjZXMgYWZ0ZXIgcHJvbWlzZXMgaGF2ZSBiZWVuIGNyZWF0ZWRcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9EVDFxeUdcXHUwMDBhXCIpO1xuICAgIH1cbiAgICBkZWJ1Z2dpbmcgPSBDYXB0dXJlZFRyYWNlLmlzU3VwcG9ydGVkKCk7XG4gICAgaWYgKGRlYnVnZ2luZykge1xuICAgICAgICBhc3luYy5kaXNhYmxlVHJhbXBvbGluZUlmTmVjZXNzYXJ5KCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5oYXNMb25nU3RhY2tUcmFjZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRlYnVnZ2luZyAmJiBDYXB0dXJlZFRyYWNlLmlzU3VwcG9ydGVkKCk7XG59O1xuXG5pZiAoIUNhcHR1cmVkVHJhY2UuaXNTdXBwb3J0ZWQoKSkge1xuICAgIFByb21pc2UubG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24oKXt9O1xuICAgIGRlYnVnZ2luZyA9IGZhbHNlO1xufVxuXG5yZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRlYnVnZ2luZztcbn07XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi9lcnJvcnMuanNcIjoxMyxcIi4vdXRpbC5qc1wiOjM4fV0sMTE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgaXNQcmltaXRpdmUgPSB1dGlsLmlzUHJpbWl0aXZlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciByZXR1cm5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG52YXIgdGhyb3dlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aHJvdyB0aGlzO1xufTtcbnZhciByZXR1cm5VbmRlZmluZWQgPSBmdW5jdGlvbigpIHt9O1xudmFyIHRocm93VW5kZWZpbmVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgdW5kZWZpbmVkO1xufTtcblxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbiAodmFsdWUsIGFjdGlvbikge1xuICAgIGlmIChhY3Rpb24gPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IHZhbHVlO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxuXG5Qcm9taXNlLnByb3RvdHlwZVtcInJldHVyblwiXSA9XG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmV0dXJuID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLnRoZW4ocmV0dXJuVW5kZWZpbmVkKTtcblxuICAgIGlmIChpc1ByaW1pdGl2ZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICB3cmFwcGVyKHZhbHVlLCAyKSxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90aGVuKHJldHVybmVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdmFsdWUsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZVtcInRocm93XCJdID1cblByb21pc2UucHJvdG90eXBlLnRoZW5UaHJvdyA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICBpZiAocmVhc29uID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLnRoZW4odGhyb3dVbmRlZmluZWQpO1xuXG4gICAgaWYgKGlzUHJpbWl0aXZlKHJlYXNvbikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICB3cmFwcGVyKHJlYXNvbiwgMSksXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWRcbiAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbih0aHJvd2VyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcmVhc29uLCB1bmRlZmluZWQpO1xufTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwxMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciBQcm9taXNlUmVkdWNlID0gUHJvbWlzZS5yZWR1Y2U7XG5cblByb21pc2UucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gUHJvbWlzZVJlZHVjZSh0aGlzLCBmbiwgbnVsbCwgSU5URVJOQUwpO1xufTtcblxuUHJvbWlzZS5lYWNoID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHByb21pc2VzLCBmbiwgbnVsbCwgSU5URVJOQUwpO1xufTtcbn07XG5cbn0se31dLDEzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIGVzNSA9IF9kZXJlcV8oXCIuL2VzNS5qc1wiKTtcbnZhciBPYmplY3RmcmVlemUgPSBlczUuZnJlZXplO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGluaGVyaXRzID0gdXRpbC5pbmhlcml0cztcbnZhciBub3RFbnVtZXJhYmxlUHJvcCA9IHV0aWwubm90RW51bWVyYWJsZVByb3A7XG5cbmZ1bmN0aW9uIHN1YkVycm9yKG5hbWVQcm9wZXJ0eSwgZGVmYXVsdE1lc3NhZ2UpIHtcbiAgICBmdW5jdGlvbiBTdWJFcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdWJFcnJvcikpIHJldHVybiBuZXcgU3ViRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgdHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIgPyBtZXNzYWdlIDogZGVmYXVsdE1lc3NhZ2UpO1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm5hbWVcIiwgbmFtZVByb3BlcnR5KTtcbiAgICAgICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVycm9yLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5oZXJpdHMoU3ViRXJyb3IsIEVycm9yKTtcbiAgICByZXR1cm4gU3ViRXJyb3I7XG59XG5cbnZhciBfVHlwZUVycm9yLCBfUmFuZ2VFcnJvcjtcbnZhciBXYXJuaW5nID0gc3ViRXJyb3IoXCJXYXJuaW5nXCIsIFwid2FybmluZ1wiKTtcbnZhciBDYW5jZWxsYXRpb25FcnJvciA9IHN1YkVycm9yKFwiQ2FuY2VsbGF0aW9uRXJyb3JcIiwgXCJjYW5jZWxsYXRpb24gZXJyb3JcIik7XG52YXIgVGltZW91dEVycm9yID0gc3ViRXJyb3IoXCJUaW1lb3V0RXJyb3JcIiwgXCJ0aW1lb3V0IGVycm9yXCIpO1xudmFyIEFnZ3JlZ2F0ZUVycm9yID0gc3ViRXJyb3IoXCJBZ2dyZWdhdGVFcnJvclwiLCBcImFnZ3JlZ2F0ZSBlcnJvclwiKTtcbnRyeSB7XG4gICAgX1R5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgICBfUmFuZ2VFcnJvciA9IFJhbmdlRXJyb3I7XG59IGNhdGNoKGUpIHtcbiAgICBfVHlwZUVycm9yID0gc3ViRXJyb3IoXCJUeXBlRXJyb3JcIiwgXCJ0eXBlIGVycm9yXCIpO1xuICAgIF9SYW5nZUVycm9yID0gc3ViRXJyb3IoXCJSYW5nZUVycm9yXCIsIFwicmFuZ2UgZXJyb3JcIik7XG59XG5cbnZhciBtZXRob2RzID0gKFwiam9pbiBwb3AgcHVzaCBzaGlmdCB1bnNoaWZ0IHNsaWNlIGZpbHRlciBmb3JFYWNoIHNvbWUgXCIgK1xuICAgIFwiZXZlcnkgbWFwIGluZGV4T2YgbGFzdEluZGV4T2YgcmVkdWNlIHJlZHVjZVJpZ2h0IHNvcnQgcmV2ZXJzZVwiKS5zcGxpdChcIiBcIik7XG5cbmZvciAodmFyIGkgPSAwOyBpIDwgbWV0aG9kcy5sZW5ndGg7ICsraSkge1xuICAgIGlmICh0eXBlb2YgQXJyYXkucHJvdG90eXBlW21ldGhvZHNbaV1dID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgQWdncmVnYXRlRXJyb3IucHJvdG90eXBlW21ldGhvZHNbaV1dID0gQXJyYXkucHJvdG90eXBlW21ldGhvZHNbaV1dO1xuICAgIH1cbn1cblxuZXM1LmRlZmluZVByb3BlcnR5KEFnZ3JlZ2F0ZUVycm9yLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgIHZhbHVlOiAwLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxufSk7XG5BZ2dyZWdhdGVFcnJvci5wcm90b3R5cGVbXCJpc09wZXJhdGlvbmFsXCJdID0gdHJ1ZTtcbnZhciBsZXZlbCA9IDA7XG5BZ2dyZWdhdGVFcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5kZW50ID0gQXJyYXkobGV2ZWwgKiA0ICsgMSkuam9pbihcIiBcIik7XG4gICAgdmFyIHJldCA9IFwiXFxuXCIgKyBpbmRlbnQgKyBcIkFnZ3JlZ2F0ZUVycm9yIG9mOlwiICsgXCJcXG5cIjtcbiAgICBsZXZlbCsrO1xuICAgIGluZGVudCA9IEFycmF5KGxldmVsICogNCArIDEpLmpvaW4oXCIgXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgc3RyID0gdGhpc1tpXSA9PT0gdGhpcyA/IFwiW0NpcmN1bGFyIEFnZ3JlZ2F0ZUVycm9yXVwiIDogdGhpc1tpXSArIFwiXCI7XG4gICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsaW5lcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgbGluZXNbal0gPSBpbmRlbnQgKyBsaW5lc1tqXTtcbiAgICAgICAgfVxuICAgICAgICBzdHIgPSBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgICAgICByZXQgKz0gc3RyICsgXCJcXG5cIjtcbiAgICB9XG4gICAgbGV2ZWwtLTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gT3BlcmF0aW9uYWxFcnJvcihtZXNzYWdlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE9wZXJhdGlvbmFsRXJyb3IpKVxuICAgICAgICByZXR1cm4gbmV3IE9wZXJhdGlvbmFsRXJyb3IobWVzc2FnZSk7XG4gICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJuYW1lXCIsIFwiT3BlcmF0aW9uYWxFcnJvclwiKTtcbiAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm1lc3NhZ2VcIiwgbWVzc2FnZSk7XG4gICAgdGhpcy5jYXVzZSA9IG1lc3NhZ2U7XG4gICAgdGhpc1tcImlzT3BlcmF0aW9uYWxcIl0gPSB0cnVlO1xuXG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm1lc3NhZ2VcIiwgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJzdGFja1wiLCBtZXNzYWdlLnN0YWNrKTtcbiAgICB9IGVsc2UgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIH1cblxufVxuaW5oZXJpdHMoT3BlcmF0aW9uYWxFcnJvciwgRXJyb3IpO1xuXG52YXIgZXJyb3JUeXBlcyA9IEVycm9yW1wiX19CbHVlYmlyZEVycm9yVHlwZXNfX1wiXTtcbmlmICghZXJyb3JUeXBlcykge1xuICAgIGVycm9yVHlwZXMgPSBPYmplY3RmcmVlemUoe1xuICAgICAgICBDYW5jZWxsYXRpb25FcnJvcjogQ2FuY2VsbGF0aW9uRXJyb3IsXG4gICAgICAgIFRpbWVvdXRFcnJvcjogVGltZW91dEVycm9yLFxuICAgICAgICBPcGVyYXRpb25hbEVycm9yOiBPcGVyYXRpb25hbEVycm9yLFxuICAgICAgICBSZWplY3Rpb25FcnJvcjogT3BlcmF0aW9uYWxFcnJvcixcbiAgICAgICAgQWdncmVnYXRlRXJyb3I6IEFnZ3JlZ2F0ZUVycm9yXG4gICAgfSk7XG4gICAgbm90RW51bWVyYWJsZVByb3AoRXJyb3IsIFwiX19CbHVlYmlyZEVycm9yVHlwZXNfX1wiLCBlcnJvclR5cGVzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRXJyb3I6IEVycm9yLFxuICAgIFR5cGVFcnJvcjogX1R5cGVFcnJvcixcbiAgICBSYW5nZUVycm9yOiBfUmFuZ2VFcnJvcixcbiAgICBDYW5jZWxsYXRpb25FcnJvcjogZXJyb3JUeXBlcy5DYW5jZWxsYXRpb25FcnJvcixcbiAgICBPcGVyYXRpb25hbEVycm9yOiBlcnJvclR5cGVzLk9wZXJhdGlvbmFsRXJyb3IsXG4gICAgVGltZW91dEVycm9yOiBlcnJvclR5cGVzLlRpbWVvdXRFcnJvcixcbiAgICBBZ2dyZWdhdGVFcnJvcjogZXJyb3JUeXBlcy5BZ2dyZWdhdGVFcnJvcixcbiAgICBXYXJuaW5nOiBXYXJuaW5nXG59O1xuXG59LHtcIi4vZXM1LmpzXCI6MTQsXCIuL3V0aWwuanNcIjozOH1dLDE0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbnZhciBpc0VTNSA9IChmdW5jdGlvbigpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHJldHVybiB0aGlzID09PSB1bmRlZmluZWQ7XG59KSgpO1xuXG5pZiAoaXNFUzUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgZnJlZXplOiBPYmplY3QuZnJlZXplLFxuICAgICAgICBkZWZpbmVQcm9wZXJ0eTogT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICAgICAgICBnZXREZXNjcmlwdG9yOiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgICAgICBrZXlzOiBPYmplY3Qua2V5cyxcbiAgICAgICAgbmFtZXM6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgICAgICBnZXRQcm90b3R5cGVPZjogT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5LFxuICAgICAgICBpc0VTNTogaXNFUzUsXG4gICAgICAgIHByb3BlcnR5SXNXcml0YWJsZTogZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wKTtcbiAgICAgICAgICAgIHJldHVybiAhISghZGVzY3JpcHRvciB8fCBkZXNjcmlwdG9yLndyaXRhYmxlIHx8IGRlc2NyaXB0b3Iuc2V0KTtcbiAgICAgICAgfVxuICAgIH07XG59IGVsc2Uge1xuICAgIHZhciBoYXMgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgc3RyID0ge30udG9TdHJpbmc7XG4gICAgdmFyIHByb3RvID0ge30uY29uc3RydWN0b3IucHJvdG90eXBlO1xuXG4gICAgdmFyIE9iamVjdEtleXMgPSBmdW5jdGlvbiAobykge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvKSB7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwobywga2V5KSkge1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEdldERlc2NyaXB0b3IgPSBmdW5jdGlvbihvLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIHt2YWx1ZTogb1trZXldfTtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdERlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gKG8sIGtleSwgZGVzYykge1xuICAgICAgICBvW2tleV0gPSBkZXNjLnZhbHVlO1xuICAgICAgICByZXR1cm4gbztcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEZyZWV6ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEdldFByb3RvdHlwZU9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdChvYmopLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBBcnJheUlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgaXNBcnJheTogQXJyYXlJc0FycmF5LFxuICAgICAgICBrZXlzOiBPYmplY3RLZXlzLFxuICAgICAgICBuYW1lczogT2JqZWN0S2V5cyxcbiAgICAgICAgZGVmaW5lUHJvcGVydHk6IE9iamVjdERlZmluZVByb3BlcnR5LFxuICAgICAgICBnZXREZXNjcmlwdG9yOiBPYmplY3RHZXREZXNjcmlwdG9yLFxuICAgICAgICBmcmVlemU6IE9iamVjdEZyZWV6ZSxcbiAgICAgICAgZ2V0UHJvdG90eXBlT2Y6IE9iamVjdEdldFByb3RvdHlwZU9mLFxuICAgICAgICBpc0VTNTogaXNFUzUsXG4gICAgICAgIHByb3BlcnR5SXNXcml0YWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbn0se31dLDE1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFByb21pc2VNYXAgPSBQcm9taXNlLm1hcDtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGZuLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIFByb21pc2VNYXAodGhpcywgZm4sIG9wdGlvbnMsIElOVEVSTkFMKTtcbn07XG5cblByb21pc2UuZmlsdGVyID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbiwgb3B0aW9ucykge1xuICAgIHJldHVybiBQcm9taXNlTWFwKHByb21pc2VzLCBmbiwgb3B0aW9ucywgSU5URVJOQUwpO1xufTtcbn07XG5cbn0se31dLDE2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBORVhUX0ZJTFRFUiwgdHJ5Q29udmVydFRvUHJvbWlzZSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGlzUHJpbWl0aXZlID0gdXRpbC5pc1ByaW1pdGl2ZTtcbnZhciB0aHJvd2VyID0gdXRpbC50aHJvd2VyO1xuXG5mdW5jdGlvbiByZXR1cm5UaGlzKCkge1xuICAgIHJldHVybiB0aGlzO1xufVxuZnVuY3Rpb24gdGhyb3dUaGlzKCkge1xuICAgIHRocm93IHRoaXM7XG59XG5mdW5jdGlvbiByZXR1cm4kKHIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiByO1xuICAgIH07XG59XG5mdW5jdGlvbiB0aHJvdyQocikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgcjtcbiAgICB9O1xufVxuZnVuY3Rpb24gcHJvbWlzZWRGaW5hbGx5KHJldCwgcmVhc29uT3JWYWx1ZSwgaXNGdWxmaWxsZWQpIHtcbiAgICB2YXIgdGhlbjtcbiAgICBpZiAoaXNQcmltaXRpdmUocmVhc29uT3JWYWx1ZSkpIHtcbiAgICAgICAgdGhlbiA9IGlzRnVsZmlsbGVkID8gcmV0dXJuJChyZWFzb25PclZhbHVlKSA6IHRocm93JChyZWFzb25PclZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGVuID0gaXNGdWxmaWxsZWQgPyByZXR1cm5UaGlzIDogdGhyb3dUaGlzO1xuICAgIH1cbiAgICByZXR1cm4gcmV0Ll90aGVuKHRoZW4sIHRocm93ZXIsIHVuZGVmaW5lZCwgcmVhc29uT3JWYWx1ZSwgdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gZmluYWxseUhhbmRsZXIocmVhc29uT3JWYWx1ZSkge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuICAgIHZhciBoYW5kbGVyID0gdGhpcy5oYW5kbGVyO1xuXG4gICAgdmFyIHJldCA9IHByb21pc2UuX2lzQm91bmQoKVxuICAgICAgICAgICAgICAgICAgICA/IGhhbmRsZXIuY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCkpXG4gICAgICAgICAgICAgICAgICAgIDogaGFuZGxlcigpO1xuXG4gICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJldCwgcHJvbWlzZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VkRmluYWxseShtYXliZVByb21pc2UsIHJlYXNvbk9yVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLmlzRnVsZmlsbGVkKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByb21pc2UuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIE5FWFRfRklMVEVSLmUgPSByZWFzb25PclZhbHVlO1xuICAgICAgICByZXR1cm4gTkVYVF9GSUxURVI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlYXNvbk9yVmFsdWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0YXBIYW5kbGVyKHZhbHVlKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLnByb21pc2U7XG4gICAgdmFyIGhhbmRsZXIgPSB0aGlzLmhhbmRsZXI7XG5cbiAgICB2YXIgcmV0ID0gcHJvbWlzZS5faXNCb3VuZCgpXG4gICAgICAgICAgICAgICAgICAgID8gaGFuZGxlci5jYWxsKHByb21pc2UuX2JvdW5kVmFsdWUoKSwgdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogaGFuZGxlcih2YWx1ZSk7XG5cbiAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmV0LCBwcm9taXNlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZWRGaW5hbGx5KG1heWJlUHJvbWlzZSwgdmFsdWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuX3Bhc3NUaHJvdWdoSGFuZGxlciA9IGZ1bmN0aW9uIChoYW5kbGVyLCBpc0ZpbmFsbHkpIHtcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRoaXMudGhlbigpO1xuXG4gICAgdmFyIHByb21pc2VBbmRIYW5kbGVyID0ge1xuICAgICAgICBwcm9taXNlOiB0aGlzLFxuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICAgICAgaXNGaW5hbGx5ID8gZmluYWxseUhhbmRsZXIgOiB0YXBIYW5kbGVyLFxuICAgICAgICAgICAgaXNGaW5hbGx5ID8gZmluYWxseUhhbmRsZXIgOiB1bmRlZmluZWQsIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHByb21pc2VBbmRIYW5kbGVyLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubGFzdGx5ID1cblByb21pc2UucHJvdG90eXBlW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Bhc3NUaHJvdWdoSGFuZGxlcihoYW5kbGVyLCB0cnVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRhcCA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Bhc3NUaHJvdWdoSGFuZGxlcihoYW5kbGVyLCBmYWxzZSk7XG59O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDE3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhcGlSZWplY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOVEVSTkFMLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlDb252ZXJ0VG9Qcm9taXNlKSB7XG52YXIgZXJyb3JzID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpO1xudmFyIFR5cGVFcnJvciA9IGVycm9ycy5UeXBlRXJyb3I7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciB5aWVsZEhhbmRsZXJzID0gW107XG5cbmZ1bmN0aW9uIHByb21pc2VGcm9tWWllbGRIYW5kbGVyKHZhbHVlLCB5aWVsZEhhbmRsZXJzLCB0cmFjZVBhcmVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeWllbGRIYW5kbGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICB0cmFjZVBhcmVudC5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKHlpZWxkSGFuZGxlcnNbaV0pKHZhbHVlKTtcbiAgICAgICAgdHJhY2VQYXJlbnQuX3BvcENvbnRleHQoKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgIHRyYWNlUGFyZW50Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICAgICAgdmFyIHJldCA9IFByb21pc2UucmVqZWN0KGVycm9yT2JqLmUpO1xuICAgICAgICAgICAgdHJhY2VQYXJlbnQuX3BvcENvbnRleHQoKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmVzdWx0LCB0cmFjZVBhcmVudCk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSByZXR1cm4gbWF5YmVQcm9taXNlO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gUHJvbWlzZVNwYXduKGdlbmVyYXRvckZ1bmN0aW9uLCByZWNlaXZlciwgeWllbGRIYW5kbGVyLCBzdGFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICBwcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHRoaXMuX3N0YWNrID0gc3RhY2s7XG4gICAgdGhpcy5fZ2VuZXJhdG9yRnVuY3Rpb24gPSBnZW5lcmF0b3JGdW5jdGlvbjtcbiAgICB0aGlzLl9yZWNlaXZlciA9IHJlY2VpdmVyO1xuICAgIHRoaXMuX2dlbmVyYXRvciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl95aWVsZEhhbmRsZXJzID0gdHlwZW9mIHlpZWxkSGFuZGxlciA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gW3lpZWxkSGFuZGxlcl0uY29uY2F0KHlpZWxkSGFuZGxlcnMpXG4gICAgICAgIDogeWllbGRIYW5kbGVycztcbn1cblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2dlbmVyYXRvciA9IHRoaXMuX2dlbmVyYXRvckZ1bmN0aW9uLmNhbGwodGhpcy5fcmVjZWl2ZXIpO1xuICAgIHRoaXMuX3JlY2VpdmVyID1cbiAgICAgICAgdGhpcy5fZ2VuZXJhdG9yRnVuY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fbmV4dCh1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fY29udGludWUgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgaWYgKHJlc3VsdCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2UuX3JlamVjdENhbGxiYWNrKHJlc3VsdC5lLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgIGlmIChyZXN1bHQuZG9uZSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHZhbHVlLCB0aGlzLl9wcm9taXNlKTtcbiAgICAgICAgaWYgKCEobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9XG4gICAgICAgICAgICAgICAgcHJvbWlzZUZyb21ZaWVsZEhhbmRsZXIobWF5YmVQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3lpZWxkSGFuZGxlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGhyb3coXG4gICAgICAgICAgICAgICAgICAgIG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkEgdmFsdWUgJXMgd2FzIHlpZWxkZWQgdGhhdCBjb3VsZCBub3QgYmUgdHJlYXRlZCBhcyBhIHByb21pc2VcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC80WTRwRGtcXHUwMDBhXFx1MDAwYVwiLnJlcGxhY2UoXCIlc1wiLCB2YWx1ZSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcm9tIGNvcm91dGluZTpcXHUwMDBhXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhY2suc3BsaXQoXCJcXG5cIikuc2xpY2UoMSwgLTcpLmpvaW4oXCJcXG5cIilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1heWJlUHJvbWlzZS5fdGhlbihcbiAgICAgICAgICAgIHRoaXMuX25leHQsXG4gICAgICAgICAgICB0aGlzLl90aHJvdyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBudWxsXG4gICAgICAgKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlU3Bhd24ucHJvdG90eXBlLl90aHJvdyA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB0aGlzLl9wcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKHJlYXNvbik7XG4gICAgdGhpcy5fcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2godGhpcy5fZ2VuZXJhdG9yW1widGhyb3dcIl0pXG4gICAgICAgIC5jYWxsKHRoaXMuX2dlbmVyYXRvciwgcmVhc29uKTtcbiAgICB0aGlzLl9wcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgdGhpcy5fY29udGludWUocmVzdWx0KTtcbn07XG5cblByb21pc2VTcGF3bi5wcm90b3R5cGUuX25leHQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaCh0aGlzLl9nZW5lcmF0b3IubmV4dCkuY2FsbCh0aGlzLl9nZW5lcmF0b3IsIHZhbHVlKTtcbiAgICB0aGlzLl9wcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgdGhpcy5fY29udGludWUocmVzdWx0KTtcbn07XG5cblByb21pc2UuY29yb3V0aW5lID0gZnVuY3Rpb24gKGdlbmVyYXRvckZ1bmN0aW9uLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBnZW5lcmF0b3JGdW5jdGlvbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJnZW5lcmF0b3JGdW5jdGlvbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC82VnFobTBcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgeWllbGRIYW5kbGVyID0gT2JqZWN0KG9wdGlvbnMpLnlpZWxkSGFuZGxlcjtcbiAgICB2YXIgUHJvbWlzZVNwYXduJCA9IFByb21pc2VTcGF3bjtcbiAgICB2YXIgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gZ2VuZXJhdG9yRnVuY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIHNwYXduID0gbmV3IFByb21pc2VTcGF3biQodW5kZWZpbmVkLCB1bmRlZmluZWQsIHlpZWxkSGFuZGxlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2spO1xuICAgICAgICBzcGF3bi5fZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICBzcGF3bi5fbmV4dCh1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gc3Bhd24ucHJvbWlzZSgpO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLmNvcm91dGluZS5hZGRZaWVsZEhhbmRsZXIgPSBmdW5jdGlvbihmbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgeWllbGRIYW5kbGVycy5wdXNoKGZuKTtcbn07XG5cblByb21pc2Uuc3Bhd24gPSBmdW5jdGlvbiAoZ2VuZXJhdG9yRnVuY3Rpb24pIHtcbiAgICBpZiAodHlwZW9mIGdlbmVyYXRvckZ1bmN0aW9uICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImdlbmVyYXRvckZ1bmN0aW9uIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzZWcWhtMFxcdTAwMGFcIik7XG4gICAgfVxuICAgIHZhciBzcGF3biA9IG5ldyBQcm9taXNlU3Bhd24oZ2VuZXJhdG9yRnVuY3Rpb24sIHRoaXMpO1xuICAgIHZhciByZXQgPSBzcGF3bi5wcm9taXNlKCk7XG4gICAgc3Bhd24uX3J1bihQcm9taXNlLnNwYXduKTtcbiAgICByZXR1cm4gcmV0O1xufTtcbn07XG5cbn0se1wiLi9lcnJvcnMuanNcIjoxMyxcIi4vdXRpbC5qc1wiOjM4fV0sMTg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXksIHRyeUNvbnZlcnRUb1Byb21pc2UsIElOVEVSTkFMKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgY2FuRXZhbHVhdGUgPSB1dGlsLmNhbkV2YWx1YXRlO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgcmVqZWN0O1xuXG5pZiAoIXRydWUpIHtcbmlmIChjYW5FdmFsdWF0ZSkge1xuICAgIHZhciB0aGVuQ2FsbGJhY2sgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJ2YWx1ZVwiLCBcImhvbGRlclwiLCBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGhvbGRlci5wSW5kZXggPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGhvbGRlci5jaGVja0Z1bGZpbGxtZW50KHRoaXMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIFwiLnJlcGxhY2UoL0luZGV4L2csIGkpKTtcbiAgICB9O1xuXG4gICAgdmFyIGNhbGxlciA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gY291bnQ7ICsraSkgdmFsdWVzLnB1c2goXCJob2xkZXIucFwiICsgaSk7XG4gICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJob2xkZXJcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBob2xkZXIuZm47ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodmFsdWVzKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBcIi5yZXBsYWNlKC92YWx1ZXMvZywgdmFsdWVzLmpvaW4oXCIsIFwiKSkpO1xuICAgIH07XG4gICAgdmFyIHRoZW5DYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgY2FsbGVycyA9IFt1bmRlZmluZWRdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IDU7ICsraSkge1xuICAgICAgICB0aGVuQ2FsbGJhY2tzLnB1c2godGhlbkNhbGxiYWNrKGkpKTtcbiAgICAgICAgY2FsbGVycy5wdXNoKGNhbGxlcihpKSk7XG4gICAgfVxuXG4gICAgdmFyIEhvbGRlciA9IGZ1bmN0aW9uKHRvdGFsLCBmbikge1xuICAgICAgICB0aGlzLnAxID0gdGhpcy5wMiA9IHRoaXMucDMgPSB0aGlzLnA0ID0gdGhpcy5wNSA9IG51bGw7XG4gICAgICAgIHRoaXMuZm4gPSBmbjtcbiAgICAgICAgdGhpcy50b3RhbCA9IHRvdGFsO1xuICAgICAgICB0aGlzLm5vdyA9IDA7XG4gICAgfTtcblxuICAgIEhvbGRlci5wcm90b3R5cGUuY2FsbGVycyA9IGNhbGxlcnM7XG4gICAgSG9sZGVyLnByb3RvdHlwZS5jaGVja0Z1bGZpbGxtZW50ID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICB2YXIgbm93ID0gdGhpcy5ub3c7XG4gICAgICAgIG5vdysrO1xuICAgICAgICB2YXIgdG90YWwgPSB0aGlzLnRvdGFsO1xuICAgICAgICBpZiAobm93ID49IHRvdGFsKSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuY2FsbGVyc1t0b3RhbF07XG4gICAgICAgICAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgICAgICAgICAgdmFyIHJldCA9IHRyeUNhdGNoKGhhbmRsZXIpKHRoaXMpO1xuICAgICAgICAgICAgcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXQuZSwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2socmV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm93ID0gbm93O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciByZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIHRoaXMuX3JlamVjdChyZWFzb24pO1xuICAgIH07XG59XG59XG5cblByb21pc2Uuam9pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdCA9IGFyZ3VtZW50cy5sZW5ndGggLSAxO1xuICAgIHZhciBmbjtcbiAgICBpZiAobGFzdCA+IDAgJiYgdHlwZW9mIGFyZ3VtZW50c1tsYXN0XSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZuID0gYXJndW1lbnRzW2xhc3RdO1xuICAgICAgICBpZiAoIXRydWUpIHtcbiAgICAgICAgICAgIGlmIChsYXN0IDwgNiAmJiBjYW5FdmFsdWF0ZSkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgICAgICAgICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgICAgICAgICAgICAgIHZhciBob2xkZXIgPSBuZXcgSG9sZGVyKGxhc3QsIGZuKTtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gdGhlbkNhbGxiYWNrcztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3Q7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShhcmd1bWVudHNbaV0sIHJldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX3RoZW4oY2FsbGJhY2tzW2ldLCByZWplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgcmV0LCBob2xkZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbChyZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl92YWx1ZSgpLCBob2xkZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQuX3JlamVjdChtYXliZVByb21pc2UuX3JlYXNvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5jYWxsKHJldCwgbWF5YmVQcm9taXNlLCBob2xkZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyICRfbGVuID0gYXJndW1lbnRzLmxlbmd0aDt2YXIgYXJncyA9IG5ldyBBcnJheSgkX2xlbik7IGZvcih2YXIgJF9pID0gMDsgJF9pIDwgJF9sZW47ICsrJF9pKSB7YXJnc1skX2ldID0gYXJndW1lbnRzWyRfaV07fVxuICAgIGlmIChmbikgYXJncy5wb3AoKTtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2VBcnJheShhcmdzKS5wcm9taXNlKCk7XG4gICAgcmV0dXJuIGZuICE9PSB1bmRlZmluZWQgPyByZXQuc3ByZWFkKGZuKSA6IHJldDtcbn07XG5cbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwxOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZUFycmF5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhcGlSZWplY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOVEVSTkFMKSB7XG52YXIgZ2V0RG9tYWluID0gUHJvbWlzZS5fZ2V0RG9tYWluO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciBQRU5ESU5HID0ge307XG52YXIgRU1QVFlfQVJSQVkgPSBbXTtcblxuZnVuY3Rpb24gTWFwcGluZ1Byb21pc2VBcnJheShwcm9taXNlcywgZm4sIGxpbWl0LCBfZmlsdGVyKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQocHJvbWlzZXMpO1xuICAgIHRoaXMuX3Byb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgdmFyIGRvbWFpbiA9IGdldERvbWFpbigpO1xuICAgIHRoaXMuX2NhbGxiYWNrID0gZG9tYWluID09PSBudWxsID8gZm4gOiBkb21haW4uYmluZChmbik7XG4gICAgdGhpcy5fcHJlc2VydmVkVmFsdWVzID0gX2ZpbHRlciA9PT0gSU5URVJOQUxcbiAgICAgICAgPyBuZXcgQXJyYXkodGhpcy5sZW5ndGgoKSlcbiAgICAgICAgOiBudWxsO1xuICAgIHRoaXMuX2xpbWl0ID0gbGltaXQ7XG4gICAgdGhpcy5faW5GbGlnaHQgPSAwO1xuICAgIHRoaXMuX3F1ZXVlID0gbGltaXQgPj0gMSA/IFtdIDogRU1QVFlfQVJSQVk7XG4gICAgYXN5bmMuaW52b2tlKGluaXQsIHRoaXMsIHVuZGVmaW5lZCk7XG59XG51dGlsLmluaGVyaXRzKE1hcHBpbmdQcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5mdW5jdGlvbiBpbml0KCkge3RoaXMuX2luaXQkKHVuZGVmaW5lZCwgLTIpO31cblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdmFyIHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICB2YXIgcHJlc2VydmVkVmFsdWVzID0gdGhpcy5fcHJlc2VydmVkVmFsdWVzO1xuICAgIHZhciBsaW1pdCA9IHRoaXMuX2xpbWl0O1xuICAgIGlmICh2YWx1ZXNbaW5kZXhdID09PSBQRU5ESU5HKSB7XG4gICAgICAgIHZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKGxpbWl0ID49IDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2luRmxpZ2h0LS07XG4gICAgICAgICAgICB0aGlzLl9kcmFpblF1ZXVlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNSZXNvbHZlZCgpKSByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobGltaXQgPj0gMSAmJiB0aGlzLl9pbkZsaWdodCA+PSBsaW1pdCkge1xuICAgICAgICAgICAgdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fcXVldWUucHVzaChpbmRleCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXNlcnZlZFZhbHVlcyAhPT0gbnVsbCkgcHJlc2VydmVkVmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuXG4gICAgICAgIHZhciBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrO1xuICAgICAgICB2YXIgcmVjZWl2ZXIgPSB0aGlzLl9wcm9taXNlLl9ib3VuZFZhbHVlKCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHZhciByZXQgPSB0cnlDYXRjaChjYWxsYmFjaykuY2FsbChyZWNlaXZlciwgdmFsdWUsIGluZGV4LCBsZW5ndGgpO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSByZXR1cm4gdGhpcy5fcmVqZWN0KHJldC5lKTtcblxuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHRoaXMuX3Byb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbWl0ID49IDEpIHRoaXMuX2luRmxpZ2h0Kys7XG4gICAgICAgICAgICAgICAgdmFsdWVzW2luZGV4XSA9IFBFTkRJTkc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlUHJvbWlzZS5fcHJveHlQcm9taXNlQXJyYXkodGhpcywgaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXQgPSBtYXliZVByb21pc2UuX3ZhbHVlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWplY3QobWF5YmVQcm9taXNlLl9yZWFzb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2luZGV4XSA9IHJldDtcbiAgICB9XG4gICAgdmFyIHRvdGFsUmVzb2x2ZWQgPSArK3RoaXMuX3RvdGFsUmVzb2x2ZWQ7XG4gICAgaWYgKHRvdGFsUmVzb2x2ZWQgPj0gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChwcmVzZXJ2ZWRWYWx1ZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbHRlcih2YWx1ZXMsIHByZXNlcnZlZFZhbHVlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHZhbHVlcyk7XG4gICAgICAgIH1cblxuICAgIH1cbn07XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9kcmFpblF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3F1ZXVlO1xuICAgIHZhciBsaW1pdCA9IHRoaXMuX2xpbWl0O1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDAgJiYgdGhpcy5faW5GbGlnaHQgPCBsaW1pdCkge1xuICAgICAgICBpZiAodGhpcy5faXNSZXNvbHZlZCgpKSByZXR1cm47XG4gICAgICAgIHZhciBpbmRleCA9IHF1ZXVlLnBvcCgpO1xuICAgICAgICB0aGlzLl9wcm9taXNlRnVsZmlsbGVkKHZhbHVlc1tpbmRleF0sIGluZGV4KTtcbiAgICB9XG59O1xuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZmlsdGVyID0gZnVuY3Rpb24gKGJvb2xlYW5zLCB2YWx1ZXMpIHtcbiAgICB2YXIgbGVuID0gdmFsdWVzLmxlbmd0aDtcbiAgICB2YXIgcmV0ID0gbmV3IEFycmF5KGxlbik7XG4gICAgdmFyIGogPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgaWYgKGJvb2xlYW5zW2ldKSByZXRbaisrXSA9IHZhbHVlc1tpXTtcbiAgICB9XG4gICAgcmV0Lmxlbmd0aCA9IGo7XG4gICAgdGhpcy5fcmVzb2x2ZShyZXQpO1xufTtcblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUucHJlc2VydmVkVmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXM7XG59O1xuXG5mdW5jdGlvbiBtYXAocHJvbWlzZXMsIGZuLCBvcHRpb25zLCBfZmlsdGVyKSB7XG4gICAgdmFyIGxpbWl0ID0gdHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIgJiYgb3B0aW9ucyAhPT0gbnVsbFxuICAgICAgICA/IG9wdGlvbnMuY29uY3VycmVuY3lcbiAgICAgICAgOiAwO1xuICAgIGxpbWl0ID0gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiICYmXG4gICAgICAgIGlzRmluaXRlKGxpbWl0KSAmJiBsaW1pdCA+PSAxID8gbGltaXQgOiAwO1xuICAgIHJldHVybiBuZXcgTWFwcGluZ1Byb21pc2VBcnJheShwcm9taXNlcywgZm4sIGxpbWl0LCBfZmlsdGVyKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGZuLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcblxuICAgIHJldHVybiBtYXAodGhpcywgZm4sIG9wdGlvbnMsIG51bGwpLnByb21pc2UoKTtcbn07XG5cblByb21pc2UubWFwID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbiwgb3B0aW9ucywgX2ZpbHRlcikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFwaVJlamVjdGlvbihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgcmV0dXJuIG1hcChwcm9taXNlcywgZm4sIG9wdGlvbnMsIF9maWx0ZXIpLnByb21pc2UoKTtcbn07XG5cblxufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vdXRpbC5qc1wiOjM4fV0sMjA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xuXG5Qcm9taXNlLm1ldGhvZCA9IGZ1bmN0aW9uIChmbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgUHJvbWlzZS5UeXBlRXJyb3IoXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgICAgIHJldC5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgdmFyIHZhbHVlID0gdHJ5Q2F0Y2goZm4pLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldC5fcG9wQ29udGV4dCgpO1xuICAgICAgICByZXQuX3Jlc29sdmVGcm9tU3luY1ZhbHVlKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5hdHRlbXB0ID0gUHJvbWlzZVtcInRyeVwiXSA9IGZ1bmN0aW9uIChmbiwgYXJncywgY3R4KSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICByZXQuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHZhbHVlID0gdXRpbC5pc0FycmF5KGFyZ3MpXG4gICAgICAgID8gdHJ5Q2F0Y2goZm4pLmFwcGx5KGN0eCwgYXJncylcbiAgICAgICAgOiB0cnlDYXRjaChmbikuY2FsbChjdHgsIGFyZ3MpO1xuICAgIHJldC5fcG9wQ29udGV4dCgpO1xuICAgIHJldC5fcmVzb2x2ZUZyb21TeW5jVmFsdWUodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVzb2x2ZUZyb21TeW5jVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHV0aWwuZXJyb3JPYmopIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0Q2FsbGJhY2sodmFsdWUuZSwgZmFsc2UsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSwgdHJ1ZSk7XG4gICAgfVxufTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwyMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcblxuZnVuY3Rpb24gc3ByZWFkQWRhcHRlcih2YWwsIG5vZGViYWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIGlmICghdXRpbC5pc0FycmF5KHZhbCkpIHJldHVybiBzdWNjZXNzQWRhcHRlci5jYWxsKHByb21pc2UsIHZhbCwgbm9kZWJhY2spO1xuICAgIHZhciByZXQgPVxuICAgICAgICB0cnlDYXRjaChub2RlYmFjaykuYXBwbHkocHJvbWlzZS5fYm91bmRWYWx1ZSgpLCBbbnVsbF0uY29uY2F0KHZhbCkpO1xuICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIocmV0LmUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3VjY2Vzc0FkYXB0ZXIodmFsLCBub2RlYmFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgcmVjZWl2ZXIgPSBwcm9taXNlLl9ib3VuZFZhbHVlKCk7XG4gICAgdmFyIHJldCA9IHZhbCA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdHJ5Q2F0Y2gobm9kZWJhY2spLmNhbGwocmVjZWl2ZXIsIG51bGwpXG4gICAgICAgIDogdHJ5Q2F0Y2gobm9kZWJhY2spLmNhbGwocmVjZWl2ZXIsIG51bGwsIHZhbCk7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihyZXQuZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZXJyb3JBZGFwdGVyKHJlYXNvbiwgbm9kZWJhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgaWYgKCFyZWFzb24pIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICB2YXIgbmV3UmVhc29uID0gdGFyZ2V0Ll9nZXRDYXJyaWVkU3RhY2tUcmFjZSgpO1xuICAgICAgICBuZXdSZWFzb24uY2F1c2UgPSByZWFzb247XG4gICAgICAgIHJlYXNvbiA9IG5ld1JlYXNvbjtcbiAgICB9XG4gICAgdmFyIHJldCA9IHRyeUNhdGNoKG5vZGViYWNrKS5jYWxsKHByb21pc2UuX2JvdW5kVmFsdWUoKSwgcmVhc29uKTtcbiAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKHJldC5lKTtcbiAgICB9XG59XG5cblByb21pc2UucHJvdG90eXBlLmFzQ2FsbGJhY2sgPVxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaywgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2Ygbm9kZWJhY2sgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBhZGFwdGVyID0gc3VjY2Vzc0FkYXB0ZXI7XG4gICAgICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgT2JqZWN0KG9wdGlvbnMpLnNwcmVhZCkge1xuICAgICAgICAgICAgYWRhcHRlciA9IHNwcmVhZEFkYXB0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdGhlbihcbiAgICAgICAgICAgIGFkYXB0ZXIsXG4gICAgICAgICAgICBlcnJvckFkYXB0ZXIsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgbm9kZWJhY2tcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xufTtcblxufSx7XCIuL2FzeW5jLmpzXCI6MixcIi4vdXRpbC5qc1wiOjM4fV0sMjI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIFByb21pc2VBcnJheSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3NlZCA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4odW5kZWZpbmVkLCB1bmRlZmluZWQsIGhhbmRsZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzc1ZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2lzRm9sbG93aW5nT3JGdWxmaWxsZWRPclJlamVjdGVkKCkpIHJldHVybjtcbiAgICB0aGlzLl90YXJnZXQoKS5fcHJvZ3Jlc3NVbmNoZWNrZWQocHJvZ3Jlc3NWYWx1ZSk7XG5cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9wcm9ncmVzc0hhbmRsZXJBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHJldHVybiBpbmRleCA9PT0gMFxuICAgICAgICA/IHRoaXMuX3Byb2dyZXNzSGFuZGxlcjBcbiAgICAgICAgOiB0aGlzWyhpbmRleCA8PCAyKSArIGluZGV4IC0gNSArIDJdO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2RvUHJvZ3Jlc3NXaXRoID0gZnVuY3Rpb24gKHByb2dyZXNzaW9uKSB7XG4gICAgdmFyIHByb2dyZXNzVmFsdWUgPSBwcm9ncmVzc2lvbi52YWx1ZTtcbiAgICB2YXIgaGFuZGxlciA9IHByb2dyZXNzaW9uLmhhbmRsZXI7XG4gICAgdmFyIHByb21pc2UgPSBwcm9ncmVzc2lvbi5wcm9taXNlO1xuICAgIHZhciByZWNlaXZlciA9IHByb2dyZXNzaW9uLnJlY2VpdmVyO1xuXG4gICAgdmFyIHJldCA9IHRyeUNhdGNoKGhhbmRsZXIpLmNhbGwocmVjZWl2ZXIsIHByb2dyZXNzVmFsdWUpO1xuICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIGlmIChyZXQuZSAhPSBudWxsICYmXG4gICAgICAgICAgICByZXQuZS5uYW1lICE9PSBcIlN0b3BQcm9ncmVzc1Byb3BhZ2F0aW9uXCIpIHtcbiAgICAgICAgICAgIHZhciB0cmFjZSA9IHV0aWwuY2FuQXR0YWNoVHJhY2UocmV0LmUpXG4gICAgICAgICAgICAgICAgPyByZXQuZSA6IG5ldyBFcnJvcih1dGlsLnRvU3RyaW5nKHJldC5lKSk7XG4gICAgICAgICAgICBwcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKHRyYWNlKTtcbiAgICAgICAgICAgIHByb21pc2UuX3Byb2dyZXNzKHJldC5lKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAocmV0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXQuX3RoZW4ocHJvbWlzZS5fcHJvZ3Jlc3MsIG51bGwsIG51bGwsIHByb21pc2UsIHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZS5fcHJvZ3Jlc3MocmV0KTtcbiAgICB9XG59O1xuXG5cblByb21pc2UucHJvdG90eXBlLl9wcm9ncmVzc1VuY2hlY2tlZCA9IGZ1bmN0aW9uIChwcm9ncmVzc1ZhbHVlKSB7XG4gICAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aCgpO1xuICAgIHZhciBwcm9ncmVzcyA9IHRoaXMuX3Byb2dyZXNzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLl9wcm9ncmVzc0hhbmRsZXJBdChpKTtcbiAgICAgICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlQXQoaSk7XG4gICAgICAgIGlmICghKHByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICAgICAgdmFyIHJlY2VpdmVyID0gdGhpcy5fcmVjZWl2ZXJBdChpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsKHJlY2VpdmVyLCBwcm9ncmVzc1ZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVjZWl2ZXIgaW5zdGFuY2VvZiBQcm9taXNlQXJyYXkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIXJlY2VpdmVyLl9pc1Jlc29sdmVkKCkpIHtcbiAgICAgICAgICAgICAgICByZWNlaXZlci5fcHJvbWlzZVByb2dyZXNzZWQocHJvZ3Jlc3NWYWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBhc3luYy5pbnZva2UodGhpcy5fZG9Qcm9ncmVzc1dpdGgsIHRoaXMsIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICAgICAgICAgIHByb21pc2U6IHByb21pc2UsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZXI6IHRoaXMuX3JlY2VpdmVyQXQoaSksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzVmFsdWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXN5bmMuaW52b2tlKHByb2dyZXNzLCBwcm9taXNlLCBwcm9ncmVzc1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi91dGlsLmpzXCI6Mzh9XSwyMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG52YXIgbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJjaXJjdWxhciBwcm9taXNlIHJlc29sdXRpb24gY2hhaW5cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9MaEZwbzBcXHUwMDBhXCIpO1xufTtcbnZhciByZWZsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlLlByb21pc2VJbnNwZWN0aW9uKHRoaXMuX3RhcmdldCgpKTtcbn07XG52YXIgYXBpUmVqZWN0aW9uID0gZnVuY3Rpb24obXNnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IobXNnKSk7XG59O1xuXG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG5cbnZhciBnZXREb21haW47XG5pZiAodXRpbC5pc05vZGUpIHtcbiAgICBnZXREb21haW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJldCA9IHByb2Nlc3MuZG9tYWluO1xuICAgICAgICBpZiAocmV0ID09PSB1bmRlZmluZWQpIHJldCA9IG51bGw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgZ2V0RG9tYWluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG59XG51dGlsLm5vdEVudW1lcmFibGVQcm9wKFByb21pc2UsIFwiX2dldERvbWFpblwiLCBnZXREb21haW4pO1xuXG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIik7XG52YXIgVHlwZUVycm9yID0gUHJvbWlzZS5UeXBlRXJyb3IgPSBlcnJvcnMuVHlwZUVycm9yO1xuUHJvbWlzZS5SYW5nZUVycm9yID0gZXJyb3JzLlJhbmdlRXJyb3I7XG5Qcm9taXNlLkNhbmNlbGxhdGlvbkVycm9yID0gZXJyb3JzLkNhbmNlbGxhdGlvbkVycm9yO1xuUHJvbWlzZS5UaW1lb3V0RXJyb3IgPSBlcnJvcnMuVGltZW91dEVycm9yO1xuUHJvbWlzZS5PcGVyYXRpb25hbEVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG5Qcm9taXNlLlJlamVjdGlvbkVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG5Qcm9taXNlLkFnZ3JlZ2F0ZUVycm9yID0gZXJyb3JzLkFnZ3JlZ2F0ZUVycm9yO1xudmFyIElOVEVSTkFMID0gZnVuY3Rpb24oKXt9O1xudmFyIEFQUExZID0ge307XG52YXIgTkVYVF9GSUxURVIgPSB7ZTogbnVsbH07XG52YXIgdHJ5Q29udmVydFRvUHJvbWlzZSA9IF9kZXJlcV8oXCIuL3RoZW5hYmxlcy5qc1wiKShQcm9taXNlLCBJTlRFUk5BTCk7XG52YXIgUHJvbWlzZUFycmF5ID1cbiAgICBfZGVyZXFfKFwiLi9wcm9taXNlX2FycmF5LmpzXCIpKFByb21pc2UsIElOVEVSTkFMLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKTtcbnZhciBDYXB0dXJlZFRyYWNlID0gX2RlcmVxXyhcIi4vY2FwdHVyZWRfdHJhY2UuanNcIikoKTtcbnZhciBpc0RlYnVnZ2luZyA9IF9kZXJlcV8oXCIuL2RlYnVnZ2FiaWxpdHkuanNcIikoUHJvbWlzZSwgQ2FwdHVyZWRUcmFjZSk7XG4gLypqc2hpbnQgdW51c2VkOmZhbHNlKi9cbnZhciBjcmVhdGVDb250ZXh0ID1cbiAgICBfZGVyZXFfKFwiLi9jb250ZXh0LmpzXCIpKFByb21pc2UsIENhcHR1cmVkVHJhY2UsIGlzRGVidWdnaW5nKTtcbnZhciBDYXRjaEZpbHRlciA9IF9kZXJlcV8oXCIuL2NhdGNoX2ZpbHRlci5qc1wiKShORVhUX0ZJTFRFUik7XG52YXIgUHJvbWlzZVJlc29sdmVyID0gX2RlcmVxXyhcIi4vcHJvbWlzZV9yZXNvbHZlci5qc1wiKTtcbnZhciBub2RlYmFja0ZvclByb21pc2UgPSBQcm9taXNlUmVzb2x2ZXIuX25vZGViYWNrRm9yUHJvbWlzZTtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xuZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidGhlIHByb21pc2UgY29uc3RydWN0b3IgcmVxdWlyZXMgYSByZXNvbHZlciBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL0VDMjJZblxcdTAwMGFcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yICE9PSBQcm9taXNlKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgaW52b2tlZCBkaXJlY3RseVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL0tzSWxnZVxcdTAwMGFcIik7XG4gICAgfVxuICAgIHRoaXMuX2JpdEZpZWxkID0gMDtcbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Byb2dyZXNzSGFuZGxlcjAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcHJvbWlzZTAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVjZWl2ZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3NldHRsZWRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAocmVzb2x2ZXIgIT09IElOVEVSTkFMKSB0aGlzLl9yZXNvbHZlRnJvbVJlc29sdmVyKHJlc29sdmVyKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuY2F1Z2h0ID0gUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChsZW4gPiAxKSB7XG4gICAgICAgIHZhciBjYXRjaEluc3RhbmNlcyA9IG5ldyBBcnJheShsZW4gLSAxKSxcbiAgICAgICAgICAgIGogPSAwLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuIC0gMTsgKytpKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY2F0Y2hJbnN0YW5jZXNbaisrXSA9IGl0ZW07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgICAgICAgICAgICAgbmV3IFR5cGVFcnJvcihcIkNhdGNoIGZpbHRlciBtdXN0IGluaGVyaXQgZnJvbSBFcnJvciBvciBiZSBhIHNpbXBsZSBwcmVkaWNhdGUgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9vODRvNjhcXHUwMDBhXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaEluc3RhbmNlcy5sZW5ndGggPSBqO1xuICAgICAgICBmbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgdmFyIGNhdGNoRmlsdGVyID0gbmV3IENhdGNoRmlsdGVyKGNhdGNoSW5zdGFuY2VzLCBmbiwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzLl90aGVuKHVuZGVmaW5lZCwgY2F0Y2hGaWx0ZXIuZG9GaWx0ZXIsIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNhdGNoRmlsdGVyLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbih1bmRlZmluZWQsIGZuLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnJlZmxlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4ocmVmbGVjdCwgcmVmbGVjdCwgdW5kZWZpbmVkLCB0aGlzLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzKSB7XG4gICAgaWYgKGlzRGVidWdnaW5nKCkgJiYgYXJndW1lbnRzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgdHlwZW9mIGRpZEZ1bGZpbGwgIT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICB0eXBlb2YgZGlkUmVqZWN0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIG1zZyA9IFwiLnRoZW4oKSBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGJ1dCB3YXMgcGFzc2VkOiBcIiArXG4gICAgICAgICAgICAgICAgdXRpbC5jbGFzc1N0cmluZyhkaWRGdWxmaWxsKTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBtc2cgKz0gXCIsIFwiICsgdXRpbC5jbGFzc1N0cmluZyhkaWRSZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3dhcm4obXNnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4oZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcyxcbiAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl90aGVuKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MsXG4gICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICBwcm9taXNlLl9zZXRJc0ZpbmFsKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZGlkRnVsZmlsbCwgZGlkUmVqZWN0KSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkuX3RoZW4oZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCB1bmRlZmluZWQsIEFQUExZLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNDYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNSZXNvbHZlZCgpICYmXG4gICAgICAgIHRoaXMuX2NhbmNlbGxhYmxlKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJldCA9IHtcbiAgICAgICAgaXNGdWxmaWxsZWQ6IGZhbHNlLFxuICAgICAgICBpc1JlamVjdGVkOiBmYWxzZSxcbiAgICAgICAgZnVsZmlsbG1lbnRWYWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICByZWplY3Rpb25SZWFzb246IHVuZGVmaW5lZFxuICAgIH07XG4gICAgaWYgKHRoaXMuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICByZXQuZnVsZmlsbG1lbnRWYWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICAgICAgcmV0LmlzRnVsZmlsbGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIHJldC5yZWplY3Rpb25SZWFzb24gPSB0aGlzLnJlYXNvbigpO1xuICAgICAgICByZXQuaXNSZWplY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlQXJyYXkodGhpcykucHJvbWlzZSgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5jYXVnaHQodXRpbC5vcmlnaW5hdGVzRnJvbVJlamVjdGlvbiwgZm4pO1xufTtcblxuUHJvbWlzZS5pcyA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICByZXR1cm4gdmFsIGluc3RhbmNlb2YgUHJvbWlzZTtcbn07XG5cblByb21pc2UuZnJvbU5vZGUgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKGZuKShub2RlYmFja0ZvclByb21pc2UocmV0KSk7XG4gICAgaWYgKHJlc3VsdCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgcmV0Ll9yZWplY3RDYWxsYmFjayhyZXN1bHQuZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZUFycmF5KHByb21pc2VzKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLmRlZmVyID0gUHJvbWlzZS5wZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZVJlc29sdmVyKHByb21pc2UpO1xufTtcblxuUHJvbWlzZS5jYXN0ID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXQgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKG9iaik7XG4gICAgaWYgKCEocmV0IGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgdmFyIHZhbCA9IHJldDtcbiAgICAgICAgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICByZXQuX2Z1bGZpbGxVbmNoZWNrZWQodmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucmVzb2x2ZSA9IFByb21pc2UuZnVsZmlsbGVkID0gUHJvbWlzZS5jYXN0O1xuXG5Qcm9taXNlLnJlamVjdCA9IFByb21pc2UucmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgcmV0Ll9yZWplY3RDYWxsYmFjayhyZWFzb24sIHRydWUpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnNldFNjaGVkdWxlciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB2YXIgcHJldiA9IGFzeW5jLl9zY2hlZHVsZTtcbiAgICBhc3luYy5fc2NoZWR1bGUgPSBmbjtcbiAgICByZXR1cm4gcHJldjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl90aGVuID0gZnVuY3Rpb24gKFxuICAgIGRpZEZ1bGZpbGwsXG4gICAgZGlkUmVqZWN0LFxuICAgIGRpZFByb2dyZXNzLFxuICAgIHJlY2VpdmVyLFxuICAgIGludGVybmFsRGF0YVxuKSB7XG4gICAgdmFyIGhhdmVJbnRlcm5hbERhdGEgPSBpbnRlcm5hbERhdGEgIT09IHVuZGVmaW5lZDtcbiAgICB2YXIgcmV0ID0gaGF2ZUludGVybmFsRGF0YSA/IGludGVybmFsRGF0YSA6IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcblxuICAgIGlmICghaGF2ZUludGVybmFsRGF0YSkge1xuICAgICAgICByZXQuX3Byb3BhZ2F0ZUZyb20odGhpcywgNCB8IDEpO1xuICAgICAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuICAgIGlmICh0YXJnZXQgIT09IHRoaXMpIHtcbiAgICAgICAgaWYgKHJlY2VpdmVyID09PSB1bmRlZmluZWQpIHJlY2VpdmVyID0gdGhpcy5fYm91bmRUbztcbiAgICAgICAgaWYgKCFoYXZlSW50ZXJuYWxEYXRhKSByZXQuX3NldElzTWlncmF0ZWQoKTtcbiAgICB9XG5cbiAgICB2YXIgY2FsbGJhY2tJbmRleCA9IHRhcmdldC5fYWRkQ2FsbGJhY2tzKGRpZEZ1bGZpbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWRSZWplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWRQcm9ncmVzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VpdmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RG9tYWluKCkpO1xuXG4gICAgaWYgKHRhcmdldC5faXNSZXNvbHZlZCgpICYmICF0YXJnZXQuX2lzU2V0dGxlUHJvbWlzZXNRdWV1ZWQoKSkge1xuICAgICAgICBhc3luYy5pbnZva2UoXG4gICAgICAgICAgICB0YXJnZXQuX3NldHRsZVByb21pc2VBdFBvc3RSZXNvbHV0aW9uLCB0YXJnZXQsIGNhbGxiYWNrSW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZUF0UG9zdFJlc29sdXRpb24gPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICBpZiAodGhpcy5faXNSZWplY3Rpb25VbmhhbmRsZWQoKSkgdGhpcy5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIHRoaXMuX3NldHRsZVByb21pc2VBdChpbmRleCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fbGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9iaXRGaWVsZCAmIDEzMTA3MTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0ZvbGxvd2luZ09yRnVsZmlsbGVkT3JSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgOTM5NTI0MDk2KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNGb2xsb3dpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDUzNjg3MDkxMikgPT09IDUzNjg3MDkxMjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSAodGhpcy5fYml0RmllbGQgJiAtMTMxMDcyKSB8XG4gICAgICAgIChsZW4gJiAxMzEwNzEpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldEZ1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMjY4NDM1NDU2O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFJlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxMzQyMTc3Mjg7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Rm9sbG93aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCA1MzY4NzA5MTI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0SXNGaW5hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMzM1NTQ0MzI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNGaW5hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMzM1NTQ0MzIpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNjcxMDg4NjQpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRDYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgNjcxMDg4NjQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRDYW5jZWxsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH42NzEwODg2NCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0SXNNaWdyYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgNDE5NDMwNDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl91bnNldElzTWlncmF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+NDE5NDMwNCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNNaWdyYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNDE5NDMwNCkgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlY2VpdmVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICB2YXIgcmV0ID0gaW5kZXggPT09IDBcbiAgICAgICAgPyB0aGlzLl9yZWNlaXZlcjBcbiAgICAgICAgOiB0aGlzW1xuICAgICAgICAgICAgaW5kZXggKiA1IC0gNSArIDRdO1xuICAgIGlmIChyZXQgPT09IHVuZGVmaW5lZCAmJiB0aGlzLl9pc0JvdW5kKCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kVmFsdWUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9wcm9taXNlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IDBcbiAgICAgICAgPyB0aGlzLl9wcm9taXNlMFxuICAgICAgICA6IHRoaXNbaW5kZXggKiA1IC0gNSArIDNdO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2Z1bGZpbGxtZW50SGFuZGxlckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ID09PSAwXG4gICAgICAgID8gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMFxuICAgICAgICA6IHRoaXNbaW5kZXggKiA1IC0gNSArIDBdO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlamVjdGlvbkhhbmRsZXJBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHJldHVybiBpbmRleCA9PT0gMFxuICAgICAgICA/IHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwXG4gICAgICAgIDogdGhpc1tpbmRleCAqIDUgLSA1ICsgMV07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fYm91bmRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXQgPSB0aGlzLl9ib3VuZFRvO1xuICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAocmV0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgaWYgKHJldC5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldC52YWx1ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fbWlncmF0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChmb2xsb3dlciwgaW5kZXgpIHtcbiAgICB2YXIgZnVsZmlsbCA9IGZvbGxvd2VyLl9mdWxmaWxsbWVudEhhbmRsZXJBdChpbmRleCk7XG4gICAgdmFyIHJlamVjdCA9IGZvbGxvd2VyLl9yZWplY3Rpb25IYW5kbGVyQXQoaW5kZXgpO1xuICAgIHZhciBwcm9ncmVzcyA9IGZvbGxvd2VyLl9wcm9ncmVzc0hhbmRsZXJBdChpbmRleCk7XG4gICAgdmFyIHByb21pc2UgPSBmb2xsb3dlci5fcHJvbWlzZUF0KGluZGV4KTtcbiAgICB2YXIgcmVjZWl2ZXIgPSBmb2xsb3dlci5fcmVjZWl2ZXJBdChpbmRleCk7XG4gICAgaWYgKHByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSBwcm9taXNlLl9zZXRJc01pZ3JhdGVkKCk7XG4gICAgdGhpcy5fYWRkQ2FsbGJhY2tzKGZ1bGZpbGwsIHJlamVjdCwgcHJvZ3Jlc3MsIHByb21pc2UsIHJlY2VpdmVyLCBudWxsKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9hZGRDYWxsYmFja3MgPSBmdW5jdGlvbiAoXG4gICAgZnVsZmlsbCxcbiAgICByZWplY3QsXG4gICAgcHJvZ3Jlc3MsXG4gICAgcHJvbWlzZSxcbiAgICByZWNlaXZlcixcbiAgICBkb21haW5cbikge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2xlbmd0aCgpO1xuXG4gICAgaWYgKGluZGV4ID49IDEzMTA3MSAtIDUpIHtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9zZXRMZW5ndGgoMCk7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3Byb21pc2UwID0gcHJvbWlzZTtcbiAgICAgICAgaWYgKHJlY2VpdmVyICE9PSB1bmRlZmluZWQpIHRoaXMuX3JlY2VpdmVyMCA9IHJlY2VpdmVyO1xuICAgICAgICBpZiAodHlwZW9mIGZ1bGZpbGwgPT09IFwiZnVuY3Rpb25cIiAmJiAhdGhpcy5faXNDYXJyeWluZ1N0YWNrVHJhY2UoKSkge1xuICAgICAgICAgICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMCA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gZnVsZmlsbCA6IGRvbWFpbi5iaW5kKGZ1bGZpbGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyByZWplY3QgOiBkb21haW4uYmluZChyZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcHJvZ3Jlc3MgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NIYW5kbGVyMCA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gcHJvZ3Jlc3MgOiBkb21haW4uYmluZChwcm9ncmVzcyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgYmFzZSA9IGluZGV4ICogNSAtIDU7XG4gICAgICAgIHRoaXNbYmFzZSArIDNdID0gcHJvbWlzZTtcbiAgICAgICAgdGhpc1tiYXNlICsgNF0gPSByZWNlaXZlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBmdWxmaWxsID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXNbYmFzZSArIDBdID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyBmdWxmaWxsIDogZG9tYWluLmJpbmQoZnVsZmlsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpc1tiYXNlICsgMV0gPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IHJlamVjdCA6IGRvbWFpbi5iaW5kKHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBwcm9ncmVzcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzW2Jhc2UgKyAyXSA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gcHJvZ3Jlc3MgOiBkb21haW4uYmluZChwcm9ncmVzcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fc2V0TGVuZ3RoKGluZGV4ICsgMSk7XG4gICAgcmV0dXJuIGluZGV4O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFByb3h5SGFuZGxlcnMgPSBmdW5jdGlvbiAocmVjZWl2ZXIsIHByb21pc2VTbG90VmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9sZW5ndGgoKTtcblxuICAgIGlmIChpbmRleCA+PSAxMzEwNzEgLSA1KSB7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fc2V0TGVuZ3RoKDApO1xuICAgIH1cbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgdGhpcy5fcHJvbWlzZTAgPSBwcm9taXNlU2xvdFZhbHVlO1xuICAgICAgICB0aGlzLl9yZWNlaXZlcjAgPSByZWNlaXZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgYmFzZSA9IGluZGV4ICogNSAtIDU7XG4gICAgICAgIHRoaXNbYmFzZSArIDNdID0gcHJvbWlzZVNsb3RWYWx1ZTtcbiAgICAgICAgdGhpc1tiYXNlICsgNF0gPSByZWNlaXZlcjtcbiAgICB9XG4gICAgdGhpcy5fc2V0TGVuZ3RoKGluZGV4ICsgMSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJveHlQcm9taXNlQXJyYXkgPSBmdW5jdGlvbiAocHJvbWlzZUFycmF5LCBpbmRleCkge1xuICAgIHRoaXMuX3NldFByb3h5SGFuZGxlcnMocHJvbWlzZUFycmF5LCBpbmRleCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVzb2x2ZUNhbGxiYWNrID0gZnVuY3Rpb24odmFsdWUsIHNob3VsZEJpbmQpIHtcbiAgICBpZiAodGhpcy5faXNGb2xsb3dpbmdPckZ1bGZpbGxlZE9yUmVqZWN0ZWQoKSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSA9PT0gdGhpcylcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdENhbGxiYWNrKG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKCksIGZhbHNlLCB0cnVlKTtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh2YWx1ZSwgdGhpcyk7XG4gICAgaWYgKCEobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHJldHVybiB0aGlzLl9mdWxmaWxsKHZhbHVlKTtcblxuICAgIHZhciBwcm9wYWdhdGlvbkZsYWdzID0gMSB8IChzaG91bGRCaW5kID8gNCA6IDApO1xuICAgIHRoaXMuX3Byb3BhZ2F0ZUZyb20obWF5YmVQcm9taXNlLCBwcm9wYWdhdGlvbkZsYWdzKTtcbiAgICB2YXIgcHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgaWYgKHByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgIHZhciBsZW4gPSB0aGlzLl9sZW5ndGgoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fbWlncmF0ZUNhbGxiYWNrcyh0aGlzLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXRGb2xsb3dpbmcoKTtcbiAgICAgICAgdGhpcy5fc2V0TGVuZ3RoKDApO1xuICAgICAgICB0aGlzLl9zZXRGb2xsb3dlZShwcm9taXNlKTtcbiAgICB9IGVsc2UgaWYgKHByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgdGhpcy5fZnVsZmlsbFVuY2hlY2tlZChwcm9taXNlLl92YWx1ZSgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yZWplY3RVbmNoZWNrZWQocHJvbWlzZS5fcmVhc29uKCksXG4gICAgICAgICAgICBwcm9taXNlLl9nZXRDYXJyaWVkU3RhY2tUcmFjZSgpKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0Q2FsbGJhY2sgPVxuZnVuY3Rpb24ocmVhc29uLCBzeW5jaHJvbm91cywgc2hvdWxkTm90TWFya09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbikge1xuICAgIGlmICghc2hvdWxkTm90TWFya09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbikge1xuICAgICAgICB1dGlsLm1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbihyZWFzb24pO1xuICAgIH1cbiAgICB2YXIgdHJhY2UgPSB1dGlsLmVuc3VyZUVycm9yT2JqZWN0KHJlYXNvbik7XG4gICAgdmFyIGhhc1N0YWNrID0gdHJhY2UgPT09IHJlYXNvbjtcbiAgICB0aGlzLl9hdHRhY2hFeHRyYVRyYWNlKHRyYWNlLCBzeW5jaHJvbm91cyA/IGhhc1N0YWNrIDogZmFsc2UpO1xuICAgIHRoaXMuX3JlamVjdChyZWFzb24sIGhhc1N0YWNrID8gdW5kZWZpbmVkIDogdHJhY2UpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Jlc29sdmVGcm9tUmVzb2x2ZXIgPSBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdGhpcy5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB0aGlzLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciBzeW5jaHJvbm91cyA9IHRydWU7XG4gICAgdmFyIHIgPSB0cnlDYXRjaChyZXNvbHZlcikoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHByb21pc2UgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZWFzb24sIHN5bmNocm9ub3VzKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfSk7XG4gICAgc3luY2hyb25vdXMgPSBmYWxzZTtcbiAgICB0aGlzLl9wb3BDb250ZXh0KCk7XG5cbiAgICBpZiAociAhPT0gdW5kZWZpbmVkICYmIHIgPT09IGVycm9yT2JqICYmIHByb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2soci5lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldHRsZVByb21pc2VGcm9tSGFuZGxlciA9IGZ1bmN0aW9uIChcbiAgICBoYW5kbGVyLCByZWNlaXZlciwgdmFsdWUsIHByb21pc2Vcbikge1xuICAgIGlmIChwcm9taXNlLl9pc1JlamVjdGVkKCkpIHJldHVybjtcbiAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciB4O1xuICAgIGlmIChyZWNlaXZlciA9PT0gQVBQTFkgJiYgIXRoaXMuX2lzUmVqZWN0ZWQoKSkge1xuICAgICAgICB4ID0gdHJ5Q2F0Y2goaGFuZGxlcikuYXBwbHkodGhpcy5fYm91bmRWYWx1ZSgpLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeCA9IHRyeUNhdGNoKGhhbmRsZXIpLmNhbGwocmVjZWl2ZXIsIHZhbHVlKTtcbiAgICB9XG4gICAgcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuXG4gICAgaWYgKHggPT09IGVycm9yT2JqIHx8IHggPT09IHByb21pc2UgfHwgeCA9PT0gTkVYVF9GSUxURVIpIHtcbiAgICAgICAgdmFyIGVyciA9IHggPT09IHByb21pc2UgPyBtYWtlU2VsZlJlc29sdXRpb25FcnJvcigpIDogeC5lO1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhlcnIsIGZhbHNlLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2soeCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3RhcmdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXQgPSB0aGlzO1xuICAgIHdoaWxlIChyZXQuX2lzRm9sbG93aW5nKCkpIHJldCA9IHJldC5fZm9sbG93ZWUoKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2ZvbGxvd2VlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldEZvbGxvd2VlID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID0gcHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jbGVhblZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fY2FuY2VsbGFibGUoKSkge1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25QYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb3BhZ2F0ZUZyb20gPSBmdW5jdGlvbiAocGFyZW50LCBmbGFncykge1xuICAgIGlmICgoZmxhZ3MgJiAxKSA+IDAgJiYgcGFyZW50Ll9jYW5jZWxsYWJsZSgpKSB7XG4gICAgICAgIHRoaXMuX3NldENhbmNlbGxhYmxlKCk7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvblBhcmVudCA9IHBhcmVudDtcbiAgICB9XG4gICAgaWYgKChmbGFncyAmIDQpID4gMCAmJiBwYXJlbnQuX2lzQm91bmQoKSkge1xuICAgICAgICB0aGlzLl9zZXRCb3VuZFRvKHBhcmVudC5fYm91bmRUbyk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2Z1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5faXNGb2xsb3dpbmdPckZ1bGZpbGxlZE9yUmVqZWN0ZWQoKSkgcmV0dXJuO1xuICAgIHRoaXMuX2Z1bGZpbGxVbmNoZWNrZWQodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24sIGNhcnJpZWRTdGFja1RyYWNlKSB7XG4gICAgaWYgKHRoaXMuX2lzRm9sbG93aW5nT3JGdWxmaWxsZWRPclJlamVjdGVkKCkpIHJldHVybjtcbiAgICB0aGlzLl9yZWplY3RVbmNoZWNrZWQocmVhc29uLCBjYXJyaWVkU3RhY2tUcmFjZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlQXQoaW5kZXgpO1xuICAgIHZhciBpc1Byb21pc2UgPSBwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZTtcblxuICAgIGlmIChpc1Byb21pc2UgJiYgcHJvbWlzZS5faXNNaWdyYXRlZCgpKSB7XG4gICAgICAgIHByb21pc2UuX3Vuc2V0SXNNaWdyYXRlZCgpO1xuICAgICAgICByZXR1cm4gYXN5bmMuaW52b2tlKHRoaXMuX3NldHRsZVByb21pc2VBdCwgdGhpcywgaW5kZXgpO1xuICAgIH1cbiAgICB2YXIgaGFuZGxlciA9IHRoaXMuX2lzRnVsZmlsbGVkKClcbiAgICAgICAgPyB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJBdChpbmRleClcbiAgICAgICAgOiB0aGlzLl9yZWplY3Rpb25IYW5kbGVyQXQoaW5kZXgpO1xuXG4gICAgdmFyIGNhcnJpZWRTdGFja1RyYWNlID1cbiAgICAgICAgdGhpcy5faXNDYXJyeWluZ1N0YWNrVHJhY2UoKSA/IHRoaXMuX2dldENhcnJpZWRTdGFja1RyYWNlKCkgOiB1bmRlZmluZWQ7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5fc2V0dGxlZFZhbHVlO1xuICAgIHZhciByZWNlaXZlciA9IHRoaXMuX3JlY2VpdmVyQXQoaW5kZXgpO1xuICAgIHRoaXMuX2NsZWFyQ2FsbGJhY2tEYXRhQXRJbmRleChpbmRleCk7XG5cbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBpZiAoIWlzUHJvbWlzZSkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR0bGVQcm9taXNlRnJvbUhhbmRsZXIoaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAocmVjZWl2ZXIgaW5zdGFuY2VvZiBQcm9taXNlQXJyYXkpIHtcbiAgICAgICAgaWYgKCFyZWNlaXZlci5faXNSZXNvbHZlZCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVyLl9wcm9taXNlRnVsZmlsbGVkKHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVyLl9wcm9taXNlUmVqZWN0ZWQodmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1Byb21pc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgIHByb21pc2UuX2Z1bGZpbGwodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0KHZhbHVlLCBjYXJyaWVkU3RhY2tUcmFjZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPj0gNCAmJiAoaW5kZXggJiAzMSkgPT09IDQpXG4gICAgICAgIGFzeW5jLmludm9rZUxhdGVyKHRoaXMuX3NldExlbmd0aCwgdGhpcywgMCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2xlYXJDYWxsYmFja0RhdGFBdEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0NhcnJ5aW5nU3RhY2tUcmFjZSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID1cbiAgICAgICAgdGhpcy5fcHJvZ3Jlc3NIYW5kbGVyMCA9XG4gICAgICAgIHRoaXMuX3JlY2VpdmVyMCA9XG4gICAgICAgIHRoaXMuX3Byb21pc2UwID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBiYXNlID0gaW5kZXggKiA1IC0gNTtcbiAgICAgICAgdGhpc1tiYXNlICsgM10gPVxuICAgICAgICB0aGlzW2Jhc2UgKyA0XSA9XG4gICAgICAgIHRoaXNbYmFzZSArIDBdID1cbiAgICAgICAgdGhpc1tiYXNlICsgMV0gPVxuICAgICAgICB0aGlzW2Jhc2UgKyAyXSA9IHVuZGVmaW5lZDtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNTZXR0bGVQcm9taXNlc1F1ZXVlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICZcbiAgICAgICAgICAgIC0xMDczNzQxODI0KSA9PT0gLTEwNzM3NDE4MjQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0U2V0dGxlUHJvbWlzZXNRdWV1ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IC0xMDczNzQxODI0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0U2V0dGxlUHJvbWlzZXNRdWV1ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+LTEwNzM3NDE4MjQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3F1ZXVlU2V0dGxlUHJvbWlzZXMgPSBmdW5jdGlvbigpIHtcbiAgICBhc3luYy5zZXR0bGVQcm9taXNlcyh0aGlzKTtcbiAgICB0aGlzLl9zZXRTZXR0bGVQcm9taXNlc1F1ZXVlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2Z1bGZpbGxVbmNoZWNrZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHRoaXMpIHtcbiAgICAgICAgdmFyIGVyciA9IG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV4dHJhVHJhY2UoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdFVuY2hlY2tlZChlcnIsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHRoaXMuX3NldEZ1bGZpbGxlZCgpO1xuICAgIHRoaXMuX3NldHRsZWRWYWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuX2NsZWFuVmFsdWVzKCk7XG5cbiAgICBpZiAodGhpcy5fbGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlU2V0dGxlUHJvbWlzZXMoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0VW5jaGVja2VkQ2hlY2tFcnJvciA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB2YXIgdHJhY2UgPSB1dGlsLmVuc3VyZUVycm9yT2JqZWN0KHJlYXNvbik7XG4gICAgdGhpcy5fcmVqZWN0VW5jaGVja2VkKHJlYXNvbiwgdHJhY2UgPT09IHJlYXNvbiA/IHVuZGVmaW5lZCA6IHRyYWNlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3RVbmNoZWNrZWQgPSBmdW5jdGlvbiAocmVhc29uLCB0cmFjZSkge1xuICAgIGlmIChyZWFzb24gPT09IHRoaXMpIHtcbiAgICAgICAgdmFyIGVyciA9IG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV4dHJhVHJhY2UoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdFVuY2hlY2tlZChlcnIpO1xuICAgIH1cbiAgICB0aGlzLl9zZXRSZWplY3RlZCgpO1xuICAgIHRoaXMuX3NldHRsZWRWYWx1ZSA9IHJlYXNvbjtcbiAgICB0aGlzLl9jbGVhblZhbHVlcygpO1xuXG4gICAgaWYgKHRoaXMuX2lzRmluYWwoKSkge1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChcInN0YWNrXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgIGFzeW5jLmludm9rZUZpcnN0KFxuICAgICAgICAgICAgICAgICAgICBDYXB0dXJlZFRyYWNlLnVuaGFuZGxlZFJlamVjdGlvbiwgdW5kZWZpbmVkLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0sIHRyYWNlID09PSB1bmRlZmluZWQgPyByZWFzb24gOiB0cmFjZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHJhY2UgIT09IHVuZGVmaW5lZCAmJiB0cmFjZSAhPT0gcmVhc29uKSB7XG4gICAgICAgIHRoaXMuX3NldENhcnJpZWRTdGFja1RyYWNlKHRyYWNlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlU2V0dGxlUHJvbWlzZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9lbnN1cmVQb3NzaWJsZVJlamVjdGlvbkhhbmRsZWQoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdW5zZXRTZXR0bGVQcm9taXNlc1F1ZXVlZCgpO1xuICAgIHZhciBsZW4gPSB0aGlzLl9sZW5ndGgoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuX3NldHRsZVByb21pc2VBdChpKTtcbiAgICB9XG59O1xuXG51dGlsLm5vdEVudW1lcmFibGVQcm9wKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgIFwiX21ha2VTZWxmUmVzb2x1dGlvbkVycm9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgIG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKTtcblxuX2RlcmVxXyhcIi4vcHJvZ3Jlc3MuanNcIikoUHJvbWlzZSwgUHJvbWlzZUFycmF5KTtcbl9kZXJlcV8oXCIuL21ldGhvZC5qc1wiKShQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKTtcbl9kZXJlcV8oXCIuL2JpbmQuanNcIikoUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UpO1xuX2RlcmVxXyhcIi4vZmluYWxseS5qc1wiKShQcm9taXNlLCBORVhUX0ZJTFRFUiwgdHJ5Q29udmVydFRvUHJvbWlzZSk7XG5fZGVyZXFfKFwiLi9kaXJlY3RfcmVzb2x2ZS5qc1wiKShQcm9taXNlKTtcbl9kZXJlcV8oXCIuL3N5bmNocm9ub3VzX2luc3BlY3Rpb24uanNcIikoUHJvbWlzZSk7XG5fZGVyZXFfKFwiLi9qb2luLmpzXCIpKFByb21pc2UsIFByb21pc2VBcnJheSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgSU5URVJOQUwpO1xuUHJvbWlzZS5Qcm9taXNlID0gUHJvbWlzZTtcbl9kZXJlcV8oJy4vbWFwLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsIElOVEVSTkFMKTtcbl9kZXJlcV8oJy4vY2FuY2VsLmpzJykoUHJvbWlzZSk7XG5fZGVyZXFfKCcuL3VzaW5nLmpzJykoUHJvbWlzZSwgYXBpUmVqZWN0aW9uLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBjcmVhdGVDb250ZXh0KTtcbl9kZXJlcV8oJy4vZ2VuZXJhdG9ycy5qcycpKFByb21pc2UsIGFwaVJlamVjdGlvbiwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UpO1xuX2RlcmVxXygnLi9ub2RlaWZ5LmpzJykoUHJvbWlzZSk7XG5fZGVyZXFfKCcuL2NhbGxfZ2V0LmpzJykoUHJvbWlzZSk7XG5fZGVyZXFfKCcuL3Byb3BzLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pO1xuX2RlcmVxXygnLi9yYWNlLmpzJykoUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbik7XG5fZGVyZXFfKCcuL3JlZHVjZS5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL3NldHRsZS5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSk7XG5fZGVyZXFfKCcuL3NvbWUuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbik7XG5fZGVyZXFfKCcuL3Byb21pc2lmeS5qcycpKFByb21pc2UsIElOVEVSTkFMKTtcbl9kZXJlcV8oJy4vYW55LmpzJykoUHJvbWlzZSk7XG5fZGVyZXFfKCcuL2VhY2guanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL3RpbWVycy5qcycpKFByb21pc2UsIElOVEVSTkFMKTtcbl9kZXJlcV8oJy4vZmlsdGVyLmpzJykoUHJvbWlzZSwgSU5URVJOQUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgdXRpbC50b0Zhc3RQcm9wZXJ0aWVzKFByb21pc2UpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIHV0aWwudG9GYXN0UHJvcGVydGllcyhQcm9taXNlLnByb3RvdHlwZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmdW5jdGlvbiBmaWxsVHlwZXModmFsdWUpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHZhciBwID0gbmV3IFByb21pc2UoSU5URVJOQUwpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fcmVqZWN0aW9uSGFuZGxlcjAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3Byb2dyZXNzSGFuZGxlcjAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9wcm9taXNlMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fcmVjZWl2ZXIwID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3NldHRsZWRWYWx1ZSA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAvLyBDb21wbGV0ZSBzbGFjayB0cmFja2luZywgb3B0IG91dCBvZiBmaWVsZC10eXBlIHRyYWNraW5nIGFuZCAgICAgICAgICAgXG4gICAgLy8gc3RhYmlsaXplIG1hcCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyh7YTogMX0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoe2I6IDJ9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHtjOiAzfSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcygxKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoZnVuY3Rpb24oKXt9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHVuZGVmaW5lZCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyhmYWxzZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMobmV3IFByb21pc2UoSU5URVJOQUwpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgQ2FwdHVyZWRUcmFjZS5zZXRCb3VuZHMoYXN5bmMuZmlyc3RMaW5lRXJyb3IsIHV0aWwubGFzdExpbmVFcnJvcik7ICAgICAgIFxuICAgIHJldHVybiBQcm9taXNlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxufTtcblxufSx7XCIuL2FueS5qc1wiOjEsXCIuL2FzeW5jLmpzXCI6MixcIi4vYmluZC5qc1wiOjMsXCIuL2NhbGxfZ2V0LmpzXCI6NSxcIi4vY2FuY2VsLmpzXCI6NixcIi4vY2FwdHVyZWRfdHJhY2UuanNcIjo3LFwiLi9jYXRjaF9maWx0ZXIuanNcIjo4LFwiLi9jb250ZXh0LmpzXCI6OSxcIi4vZGVidWdnYWJpbGl0eS5qc1wiOjEwLFwiLi9kaXJlY3RfcmVzb2x2ZS5qc1wiOjExLFwiLi9lYWNoLmpzXCI6MTIsXCIuL2Vycm9ycy5qc1wiOjEzLFwiLi9maWx0ZXIuanNcIjoxNSxcIi4vZmluYWxseS5qc1wiOjE2LFwiLi9nZW5lcmF0b3JzLmpzXCI6MTcsXCIuL2pvaW4uanNcIjoxOCxcIi4vbWFwLmpzXCI6MTksXCIuL21ldGhvZC5qc1wiOjIwLFwiLi9ub2RlaWZ5LmpzXCI6MjEsXCIuL3Byb2dyZXNzLmpzXCI6MjIsXCIuL3Byb21pc2VfYXJyYXkuanNcIjoyNCxcIi4vcHJvbWlzZV9yZXNvbHZlci5qc1wiOjI1LFwiLi9wcm9taXNpZnkuanNcIjoyNixcIi4vcHJvcHMuanNcIjoyNyxcIi4vcmFjZS5qc1wiOjI5LFwiLi9yZWR1Y2UuanNcIjozMCxcIi4vc2V0dGxlLmpzXCI6MzIsXCIuL3NvbWUuanNcIjozMyxcIi4vc3luY2hyb25vdXNfaW5zcGVjdGlvbi5qc1wiOjM0LFwiLi90aGVuYWJsZXMuanNcIjozNSxcIi4vdGltZXJzLmpzXCI6MzYsXCIuL3VzaW5nLmpzXCI6MzcsXCIuL3V0aWwuanNcIjozOH1dLDI0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSxcbiAgICBhcGlSZWplY3Rpb24pIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBpc0FycmF5ID0gdXRpbC5pc0FycmF5O1xuXG5mdW5jdGlvbiB0b1Jlc29sdXRpb25WYWx1ZSh2YWwpIHtcbiAgICBzd2l0Y2godmFsKSB7XG4gICAgY2FzZSAtMjogcmV0dXJuIFtdO1xuICAgIGNhc2UgLTM6IHJldHVybiB7fTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIFByb21pc2VBcnJheSh2YWx1ZXMpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgdmFyIHBhcmVudDtcbiAgICBpZiAodmFsdWVzIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICBwYXJlbnQgPSB2YWx1ZXM7XG4gICAgICAgIHByb21pc2UuX3Byb3BhZ2F0ZUZyb20ocGFyZW50LCAxIHwgNCk7XG4gICAgfVxuICAgIHRoaXMuX3ZhbHVlcyA9IHZhbHVlcztcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX3RvdGFsUmVzb2x2ZWQgPSAwO1xuICAgIHRoaXMuX2luaXQodW5kZWZpbmVkLCAtMik7XG59XG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIGluaXQoXywgcmVzb2x2ZVZhbHVlSWZFbXB0eSkge1xuICAgIHZhciB2YWx1ZXMgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXMuX3ZhbHVlcywgdGhpcy5fcHJvbWlzZSk7XG4gICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdmFsdWVzID0gdmFsdWVzLl90YXJnZXQoKTtcbiAgICAgICAgdGhpcy5fdmFsdWVzID0gdmFsdWVzO1xuICAgICAgICBpZiAodmFsdWVzLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuX3ZhbHVlKCk7XG4gICAgICAgICAgICBpZiAoIWlzQXJyYXkodmFsdWVzKSkge1xuICAgICAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgUHJvbWlzZS5UeXBlRXJyb3IoXCJleHBlY3RpbmcgYW4gYXJyYXksIGEgcHJvbWlzZSBvciBhIHRoZW5hYmxlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvczhNTWhjXFx1MDAwYVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9faGFyZFJlamVjdF9fKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlcy5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgIHZhbHVlcy5fdGhlbihcbiAgICAgICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgICAgIHRoaXMuX3JlamVjdCxcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICByZXNvbHZlVmFsdWVJZkVtcHR5XG4gICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QodmFsdWVzLl9yZWFzb24oKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc0FycmF5KHZhbHVlcykpIHtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcmVqZWN0KGFwaVJlamVjdGlvbihcImV4cGVjdGluZyBhbiBhcnJheSwgYSBwcm9taXNlIG9yIGEgdGhlbmFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zOE1NaGNcXHUwMDBhXCIpLl9yZWFzb24oKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBpZiAocmVzb2x2ZVZhbHVlSWZFbXB0eSA9PT0gLTUpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmVFbXB0eUFycmF5KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHRvUmVzb2x1dGlvblZhbHVlKHJlc29sdmVWYWx1ZUlmRW1wdHkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBsZW4gPSB0aGlzLmdldEFjdHVhbExlbmd0aCh2YWx1ZXMubGVuZ3RoKTtcbiAgICB0aGlzLl9sZW5ndGggPSBsZW47XG4gICAgdGhpcy5fdmFsdWVzID0gdGhpcy5zaG91bGRDb3B5VmFsdWVzKCkgPyBuZXcgQXJyYXkobGVuKSA6IHRoaXMuX3ZhbHVlcztcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgaXNSZXNvbHZlZCA9IHRoaXMuX2lzUmVzb2x2ZWQoKTtcbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodmFsdWVzW2ldLCBwcm9taXNlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZCkge1xuICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5faWdub3JlUmVqZWN0aW9ucygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9wcm94eVByb21pc2VBcnJheSh0aGlzLCBpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZChtYXliZVByb21pc2UuX3ZhbHVlKCksIGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlUmVqZWN0ZWQobWF5YmVQcm9taXNlLl9yZWFzb24oKSwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzUmVzb2x2ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb21pc2VGdWxmaWxsZWQobWF5YmVQcm9taXNlLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX2lzUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcyA9PT0gbnVsbDtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBudWxsO1xuICAgIHRoaXMuX3Byb21pc2UuX2Z1bGZpbGwodmFsdWUpO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fX2hhcmRSZWplY3RfXyA9XG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fdmFsdWVzID0gbnVsbDtcbiAgICB0aGlzLl9wcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZWFzb24sIGZhbHNlLCB0cnVlKTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VQcm9ncmVzc2VkID0gZnVuY3Rpb24gKHByb2dyZXNzVmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5fcHJvbWlzZS5fcHJvZ3Jlc3Moe1xuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIHZhbHVlOiBwcm9ncmVzc1ZhbHVlXG4gICAgfSk7XG59O1xuXG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IHRoaXMuX2xlbmd0aCkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgfVxufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVJlamVjdGVkID0gZnVuY3Rpb24gKHJlYXNvbiwgaW5kZXgpIHtcbiAgICB0aGlzLl90b3RhbFJlc29sdmVkKys7XG4gICAgdGhpcy5fcmVqZWN0KHJlYXNvbik7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLnNob3VsZENvcHlWYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLmdldEFjdHVhbExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcbiAgICByZXR1cm4gbGVuO1xufTtcblxucmV0dXJuIFByb21pc2VBcnJheTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwyNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBtYXliZVdyYXBBc0Vycm9yID0gdXRpbC5tYXliZVdyYXBBc0Vycm9yO1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKTtcbnZhciBUaW1lb3V0RXJyb3IgPSBlcnJvcnMuVGltZW91dEVycm9yO1xudmFyIE9wZXJhdGlvbmFsRXJyb3IgPSBlcnJvcnMuT3BlcmF0aW9uYWxFcnJvcjtcbnZhciBoYXZlR2V0dGVycyA9IHV0aWwuaGF2ZUdldHRlcnM7XG52YXIgZXM1ID0gX2RlcmVxXyhcIi4vZXM1LmpzXCIpO1xuXG5mdW5jdGlvbiBpc1VudHlwZWRFcnJvcihvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRXJyb3IgJiZcbiAgICAgICAgZXM1LmdldFByb3RvdHlwZU9mKG9iaikgPT09IEVycm9yLnByb3RvdHlwZTtcbn1cblxudmFyIHJFcnJvcktleSA9IC9eKD86bmFtZXxtZXNzYWdlfHN0YWNrfGNhdXNlKSQvO1xuZnVuY3Rpb24gd3JhcEFzT3BlcmF0aW9uYWxFcnJvcihvYmopIHtcbiAgICB2YXIgcmV0O1xuICAgIGlmIChpc1VudHlwZWRFcnJvcihvYmopKSB7XG4gICAgICAgIHJldCA9IG5ldyBPcGVyYXRpb25hbEVycm9yKG9iaik7XG4gICAgICAgIHJldC5uYW1lID0gb2JqLm5hbWU7XG4gICAgICAgIHJldC5tZXNzYWdlID0gb2JqLm1lc3NhZ2U7XG4gICAgICAgIHJldC5zdGFjayA9IG9iai5zdGFjaztcbiAgICAgICAgdmFyIGtleXMgPSBlczUua2V5cyhvYmopO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgICAgaWYgKCFyRXJyb3JLZXkudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICB1dGlsLm1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbihvYmopO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVyciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHByb21pc2UgPT09IG51bGwpIHJldHVybjtcblxuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlZCA9IHdyYXBBc09wZXJhdGlvbmFsRXJyb3IobWF5YmVXcmFwQXNFcnJvcihlcnIpKTtcbiAgICAgICAgICAgIHByb21pc2UuX2F0dGFjaEV4dHJhVHJhY2Uod3JhcHBlZCk7XG4gICAgICAgICAgICBwcm9taXNlLl9yZWplY3Qod3JhcHBlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHZhciAkX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7dmFyIGFyZ3MgPSBuZXcgQXJyYXkoJF9sZW4gLSAxKTsgZm9yKHZhciAkX2kgPSAxOyAkX2kgPCAkX2xlbjsgKyskX2kpIHthcmdzWyRfaSAtIDFdID0gYXJndW1lbnRzWyRfaV07fVxuICAgICAgICAgICAgcHJvbWlzZS5fZnVsZmlsbChhcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UuX2Z1bGZpbGwodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfTtcbn1cblxuXG52YXIgUHJvbWlzZVJlc29sdmVyO1xuaWYgKCFoYXZlR2V0dGVycykge1xuICAgIFByb21pc2VSZXNvbHZlciA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgIHRoaXMucHJvbWlzZSA9IHByb21pc2U7XG4gICAgICAgIHRoaXMuYXNDYWxsYmFjayA9IG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlKTtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IHRoaXMuYXNDYWxsYmFjaztcbiAgICB9O1xufVxuZWxzZSB7XG4gICAgUHJvbWlzZVJlc29sdmVyID0gZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgdGhpcy5wcm9taXNlID0gcHJvbWlzZTtcbiAgICB9O1xufVxuaWYgKGhhdmVHZXR0ZXJzKSB7XG4gICAgdmFyIHByb3AgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZWJhY2tGb3JQcm9taXNlKHRoaXMucHJvbWlzZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShQcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLCBcImFzQ2FsbGJhY2tcIiwgcHJvcCk7XG4gICAgZXM1LmRlZmluZVByb3BlcnR5KFByb21pc2VSZXNvbHZlci5wcm90b3R5cGUsIFwiY2FsbGJhY2tcIiwgcHJvcCk7XG59XG5cblByb21pc2VSZXNvbHZlci5fbm9kZWJhY2tGb3JQcm9taXNlID0gbm9kZWJhY2tGb3JQcm9taXNlO1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZVJlc29sdmVyXVwiO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5yZXNvbHZlID1cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlUmVzb2x2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbGxlZ2FsIGludm9jYXRpb24sIHJlc29sdmVyIHJlc29sdmUvcmVqZWN0IG11c3QgYmUgY2FsbGVkIHdpdGhpbiBhIHJlc29sdmVyIGNvbnRleHQuIENvbnNpZGVyIHVzaW5nIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGluc3RlYWQuXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvc2RrWEw5XFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdGhpcy5wcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2VSZXNvbHZlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgaW52b2NhdGlvbiwgcmVzb2x2ZXIgcmVzb2x2ZS9yZWplY3QgbXVzdCBiZSBjYWxsZWQgd2l0aGluIGEgcmVzb2x2ZXIgY29udGV4dC4gQ29uc2lkZXIgdXNpbmcgdGhlIHByb21pc2UgY29uc3RydWN0b3IgaW5zdGVhZC5cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zZGtYTDlcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB0aGlzLnByb21pc2UuX3JlamVjdENhbGxiYWNrKHJlYXNvbik7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2VSZXNvbHZlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgaW52b2NhdGlvbiwgcmVzb2x2ZXIgcmVzb2x2ZS9yZWplY3QgbXVzdCBiZSBjYWxsZWQgd2l0aGluIGEgcmVzb2x2ZXIgY29udGV4dC4gQ29uc2lkZXIgdXNpbmcgdGhlIHByb21pc2UgY29uc3RydWN0b3IgaW5zdGVhZC5cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zZGtYTDlcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB0aGlzLnByb21pc2UuX3Byb2dyZXNzKHZhbHVlKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKGVycikge1xuICAgIHRoaXMucHJvbWlzZS5jYW5jZWwoZXJyKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlamVjdChuZXcgVGltZW91dEVycm9yKFwidGltZW91dFwiKSk7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLmlzUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvbWlzZS5pc1Jlc29sdmVkKCk7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9taXNlLnRvSlNPTigpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlUmVzb2x2ZXI7XG5cbn0se1wiLi9lcnJvcnMuanNcIjoxMyxcIi4vZXM1LmpzXCI6MTQsXCIuL3V0aWwuanNcIjozOH1dLDI2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFRISVMgPSB7fTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBub2RlYmFja0ZvclByb21pc2UgPSBfZGVyZXFfKFwiLi9wcm9taXNlX3Jlc29sdmVyLmpzXCIpXG4gICAgLl9ub2RlYmFja0ZvclByb21pc2U7XG52YXIgd2l0aEFwcGVuZGVkID0gdXRpbC53aXRoQXBwZW5kZWQ7XG52YXIgbWF5YmVXcmFwQXNFcnJvciA9IHV0aWwubWF5YmVXcmFwQXNFcnJvcjtcbnZhciBjYW5FdmFsdWF0ZSA9IHV0aWwuY2FuRXZhbHVhdGU7XG52YXIgVHlwZUVycm9yID0gX2RlcmVxXyhcIi4vZXJyb3JzXCIpLlR5cGVFcnJvcjtcbnZhciBkZWZhdWx0U3VmZml4ID0gXCJBc3luY1wiO1xudmFyIGRlZmF1bHRQcm9taXNpZmllZCA9IHtfX2lzUHJvbWlzaWZpZWRfXzogdHJ1ZX07XG52YXIgbm9Db3B5UHJvcHMgPSBbXG4gICAgXCJhcml0eVwiLCAgICBcImxlbmd0aFwiLFxuICAgIFwibmFtZVwiLFxuICAgIFwiYXJndW1lbnRzXCIsXG4gICAgXCJjYWxsZXJcIixcbiAgICBcImNhbGxlZVwiLFxuICAgIFwicHJvdG90eXBlXCIsXG4gICAgXCJfX2lzUHJvbWlzaWZpZWRfX1wiXG5dO1xudmFyIG5vQ29weVByb3BzUGF0dGVybiA9IG5ldyBSZWdFeHAoXCJeKD86XCIgKyBub0NvcHlQcm9wcy5qb2luKFwifFwiKSArIFwiKSRcIik7XG5cbnZhciBkZWZhdWx0RmlsdGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB1dGlsLmlzSWRlbnRpZmllcihuYW1lKSAmJlxuICAgICAgICBuYW1lLmNoYXJBdCgwKSAhPT0gXCJfXCIgJiZcbiAgICAgICAgbmFtZSAhPT0gXCJjb25zdHJ1Y3RvclwiO1xufTtcblxuZnVuY3Rpb24gcHJvcHNGaWx0ZXIoa2V5KSB7XG4gICAgcmV0dXJuICFub0NvcHlQcm9wc1BhdHRlcm4udGVzdChrZXkpO1xufVxuXG5mdW5jdGlvbiBpc1Byb21pc2lmaWVkKGZuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGZuLl9faXNQcm9taXNpZmllZF9fID09PSB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNQcm9taXNpZmllZChvYmosIGtleSwgc3VmZml4KSB7XG4gICAgdmFyIHZhbCA9IHV0aWwuZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0KG9iaiwga2V5ICsgc3VmZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UHJvbWlzaWZpZWQpO1xuICAgIHJldHVybiB2YWwgPyBpc1Byb21pc2lmaWVkKHZhbCkgOiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGNoZWNrVmFsaWQocmV0LCBzdWZmaXgsIHN1ZmZpeFJlZ2V4cCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHZhciBrZXkgPSByZXRbaV07XG4gICAgICAgIGlmIChzdWZmaXhSZWdleHAudGVzdChrZXkpKSB7XG4gICAgICAgICAgICB2YXIga2V5V2l0aG91dEFzeW5jU3VmZml4ID0ga2V5LnJlcGxhY2Uoc3VmZml4UmVnZXhwLCBcIlwiKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmV0Lmxlbmd0aDsgaiArPSAyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJldFtqXSA9PT0ga2V5V2l0aG91dEFzeW5jU3VmZml4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcHJvbWlzaWZ5IGFuIEFQSSB0aGF0IGhhcyBub3JtYWwgbWV0aG9kcyB3aXRoICclcyctc3VmZml4XFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvaVdyWmJ3XFx1MDAwYVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShcIiVzXCIsIHN1ZmZpeCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJvbWlzaWZpYWJsZU1ldGhvZHMob2JqLCBzdWZmaXgsIHN1ZmZpeFJlZ2V4cCwgZmlsdGVyKSB7XG4gICAgdmFyIGtleXMgPSB1dGlsLmluaGVyaXRlZERhdGFLZXlzKG9iaik7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgdmFyIHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgIHZhciBwYXNzZXNEZWZhdWx0RmlsdGVyID0gZmlsdGVyID09PSBkZWZhdWx0RmlsdGVyXG4gICAgICAgICAgICA/IHRydWUgOiBkZWZhdWx0RmlsdGVyKGtleSwgdmFsdWUsIG9iaik7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgIWlzUHJvbWlzaWZpZWQodmFsdWUpICYmXG4gICAgICAgICAgICAhaGFzUHJvbWlzaWZpZWQob2JqLCBrZXksIHN1ZmZpeCkgJiZcbiAgICAgICAgICAgIGZpbHRlcihrZXksIHZhbHVlLCBvYmosIHBhc3Nlc0RlZmF1bHRGaWx0ZXIpKSB7XG4gICAgICAgICAgICByZXQucHVzaChrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGVja1ZhbGlkKHJldCwgc3VmZml4LCBzdWZmaXhSZWdleHApO1xuICAgIHJldHVybiByZXQ7XG59XG5cbnZhciBlc2NhcGVJZGVudFJlZ2V4ID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyRdKS8sIFwiXFxcXCRcIik7XG59O1xuXG52YXIgbWFrZU5vZGVQcm9taXNpZmllZEV2YWw7XG5pZiAoIXRydWUpIHtcbnZhciBzd2l0Y2hDYXNlQXJndW1lbnRPcmRlciA9IGZ1bmN0aW9uKGxpa2VseUFyZ3VtZW50Q291bnQpIHtcbiAgICB2YXIgcmV0ID0gW2xpa2VseUFyZ3VtZW50Q291bnRdO1xuICAgIHZhciBtaW4gPSBNYXRoLm1heCgwLCBsaWtlbHlBcmd1bWVudENvdW50IC0gMSAtIDMpO1xuICAgIGZvcih2YXIgaSA9IGxpa2VseUFyZ3VtZW50Q291bnQgLSAxOyBpID49IG1pbjsgLS1pKSB7XG4gICAgICAgIHJldC5wdXNoKGkpO1xuICAgIH1cbiAgICBmb3IodmFyIGkgPSBsaWtlbHlBcmd1bWVudENvdW50ICsgMTsgaSA8PSAzOyArK2kpIHtcbiAgICAgICAgcmV0LnB1c2goaSk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG52YXIgYXJndW1lbnRTZXF1ZW5jZSA9IGZ1bmN0aW9uKGFyZ3VtZW50Q291bnQpIHtcbiAgICByZXR1cm4gdXRpbC5maWxsZWRSYW5nZShhcmd1bWVudENvdW50LCBcIl9hcmdcIiwgXCJcIik7XG59O1xuXG52YXIgcGFyYW1ldGVyRGVjbGFyYXRpb24gPSBmdW5jdGlvbihwYXJhbWV0ZXJDb3VudCkge1xuICAgIHJldHVybiB1dGlsLmZpbGxlZFJhbmdlKFxuICAgICAgICBNYXRoLm1heChwYXJhbWV0ZXJDb3VudCwgMyksIFwiX2FyZ1wiLCBcIlwiKTtcbn07XG5cbnZhciBwYXJhbWV0ZXJDb3VudCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbi5sZW5ndGggPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KE1hdGgubWluKGZuLmxlbmd0aCwgMTAyMyArIDEpLCAwKTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59O1xuXG5tYWtlTm9kZVByb21pc2lmaWVkRXZhbCA9XG5mdW5jdGlvbihjYWxsYmFjaywgcmVjZWl2ZXIsIG9yaWdpbmFsTmFtZSwgZm4pIHtcbiAgICB2YXIgbmV3UGFyYW1ldGVyQ291bnQgPSBNYXRoLm1heCgwLCBwYXJhbWV0ZXJDb3VudChmbikgLSAxKTtcbiAgICB2YXIgYXJndW1lbnRPcmRlciA9IHN3aXRjaENhc2VBcmd1bWVudE9yZGVyKG5ld1BhcmFtZXRlckNvdW50KTtcbiAgICB2YXIgc2hvdWxkUHJveHlUaGlzID0gdHlwZW9mIGNhbGxiYWNrID09PSBcInN0cmluZ1wiIHx8IHJlY2VpdmVyID09PSBUSElTO1xuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVDYWxsRm9yQXJndW1lbnRDb3VudChjb3VudCkge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50U2VxdWVuY2UoY291bnQpLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgdmFyIGNvbW1hID0gY291bnQgPiAwID8gXCIsIFwiIDogXCJcIjtcbiAgICAgICAgdmFyIHJldDtcbiAgICAgICAgaWYgKHNob3VsZFByb3h5VGhpcykge1xuICAgICAgICAgICAgcmV0ID0gXCJyZXQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHt7YXJnc319LCBub2RlYmFjayk7IGJyZWFrO1xcblwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gcmVjZWl2ZXIgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgID8gXCJyZXQgPSBjYWxsYmFjayh7e2FyZ3N9fSwgbm9kZWJhY2spOyBicmVhaztcXG5cIlxuICAgICAgICAgICAgICAgIDogXCJyZXQgPSBjYWxsYmFjay5jYWxsKHJlY2VpdmVyLCB7e2FyZ3N9fSwgbm9kZWJhY2spOyBicmVhaztcXG5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0LnJlcGxhY2UoXCJ7e2FyZ3N9fVwiLCBhcmdzKS5yZXBsYWNlKFwiLCBcIiwgY29tbWEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlQXJndW1lbnRTd2l0Y2hDYXNlKCkge1xuICAgICAgICB2YXIgcmV0ID0gXCJcIjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudE9yZGVyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXQgKz0gXCJjYXNlIFwiICsgYXJndW1lbnRPcmRlcltpXSArXCI6XCIgK1xuICAgICAgICAgICAgICAgIGdlbmVyYXRlQ2FsbEZvckFyZ3VtZW50Q291bnQoYXJndW1lbnRPcmRlcltpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXQgKz0gXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGxlbiArIDEpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBpID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGFyZ3NbaV0gPSBub2RlYmFjazsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIFtDb2RlRm9yQ2FsbF0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGJyZWFrOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgXCIucmVwbGFjZShcIltDb2RlRm9yQ2FsbF1cIiwgKHNob3VsZFByb3h5VGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFwicmV0ID0gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XFxuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInJldCA9IGNhbGxiYWNrLmFwcGx5KHJlY2VpdmVyLCBhcmdzKTtcXG5cIikpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHZhciBnZXRGdW5jdGlvbkNvZGUgPSB0eXBlb2YgY2FsbGJhY2sgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoXCJ0aGlzICE9IG51bGwgPyB0aGlzWydcIitjYWxsYmFjaytcIiddIDogZm5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcImZuXCI7XG5cbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwiUHJvbWlzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJmblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWNlaXZlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ3aXRoQXBwZW5kZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibWF5YmVXcmFwQXNFcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJub2RlYmFja0ZvclByb21pc2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHJ5Q2F0Y2hcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZXJyb3JPYmpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibm90RW51bWVyYWJsZVByb3BcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSU5URVJOQUxcIixcIid1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgdmFyIHJldCA9IGZ1bmN0aW9uIChQYXJhbWV0ZXJzKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBub2RlYmFjayA9IG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlKTsgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciByZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IHRyeUNhdGNoKFtHZXRGdW5jdGlvbkNvZGVdKTsgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHN3aXRjaChsZW4pIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBbQ29kZUZvclN3aXRjaENhc2VdICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhtYXliZVdyYXBBc0Vycm9yKHJldC5lKSwgdHJ1ZSwgdHJ1ZSk7XFxuXFxcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AocmV0LCAnX19pc1Byb21pc2lmaWVkX18nLCB0cnVlKTsgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgcmV0dXJuIHJldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgXCJcbiAgICAgICAgLnJlcGxhY2UoXCJQYXJhbWV0ZXJzXCIsIHBhcmFtZXRlckRlY2xhcmF0aW9uKG5ld1BhcmFtZXRlckNvdW50KSlcbiAgICAgICAgLnJlcGxhY2UoXCJbQ29kZUZvclN3aXRjaENhc2VdXCIsIGdlbmVyYXRlQXJndW1lbnRTd2l0Y2hDYXNlKCkpXG4gICAgICAgIC5yZXBsYWNlKFwiW0dldEZ1bmN0aW9uQ29kZV1cIiwgZ2V0RnVuY3Rpb25Db2RlKSkoXG4gICAgICAgICAgICBQcm9taXNlLFxuICAgICAgICAgICAgZm4sXG4gICAgICAgICAgICByZWNlaXZlcixcbiAgICAgICAgICAgIHdpdGhBcHBlbmRlZCxcbiAgICAgICAgICAgIG1heWJlV3JhcEFzRXJyb3IsXG4gICAgICAgICAgICBub2RlYmFja0ZvclByb21pc2UsXG4gICAgICAgICAgICB1dGlsLnRyeUNhdGNoLFxuICAgICAgICAgICAgdXRpbC5lcnJvck9iaixcbiAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AsXG4gICAgICAgICAgICBJTlRFUk5BTFxuICAgICAgICApO1xufTtcbn1cblxuZnVuY3Rpb24gbWFrZU5vZGVQcm9taXNpZmllZENsb3N1cmUoY2FsbGJhY2ssIHJlY2VpdmVyLCBfLCBmbikge1xuICAgIHZhciBkZWZhdWx0VGhpcyA9IChmdW5jdGlvbigpIHtyZXR1cm4gdGhpczt9KSgpO1xuICAgIHZhciBtZXRob2QgPSBjYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBjYWxsYmFjayA9IGZuO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwcm9taXNpZmllZCgpIHtcbiAgICAgICAgdmFyIF9yZWNlaXZlciA9IHJlY2VpdmVyO1xuICAgICAgICBpZiAocmVjZWl2ZXIgPT09IFRISVMpIF9yZWNlaXZlciA9IHRoaXM7XG4gICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICBwcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgICAgICB2YXIgY2IgPSB0eXBlb2YgbWV0aG9kID09PSBcInN0cmluZ1wiICYmIHRoaXMgIT09IGRlZmF1bHRUaGlzXG4gICAgICAgICAgICA/IHRoaXNbbWV0aG9kXSA6IGNhbGxiYWNrO1xuICAgICAgICB2YXIgZm4gPSBub2RlYmFja0ZvclByb21pc2UocHJvbWlzZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYi5hcHBseShfcmVjZWl2ZXIsIHdpdGhBcHBlbmRlZChhcmd1bWVudHMsIGZuKSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2sobWF5YmVXcmFwQXNFcnJvcihlKSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AocHJvbWlzaWZpZWQsIFwiX19pc1Byb21pc2lmaWVkX19cIiwgdHJ1ZSk7XG4gICAgcmV0dXJuIHByb21pc2lmaWVkO1xufVxuXG52YXIgbWFrZU5vZGVQcm9taXNpZmllZCA9IGNhbkV2YWx1YXRlXG4gICAgPyBtYWtlTm9kZVByb21pc2lmaWVkRXZhbFxuICAgIDogbWFrZU5vZGVQcm9taXNpZmllZENsb3N1cmU7XG5cbmZ1bmN0aW9uIHByb21pc2lmeUFsbChvYmosIHN1ZmZpeCwgZmlsdGVyLCBwcm9taXNpZmllcikge1xuICAgIHZhciBzdWZmaXhSZWdleHAgPSBuZXcgUmVnRXhwKGVzY2FwZUlkZW50UmVnZXgoc3VmZml4KSArIFwiJFwiKTtcbiAgICB2YXIgbWV0aG9kcyA9XG4gICAgICAgIHByb21pc2lmaWFibGVNZXRob2RzKG9iaiwgc3VmZml4LCBzdWZmaXhSZWdleHAsIGZpbHRlcik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWV0aG9kcy5sZW5ndGg7IGkgPCBsZW47IGkrPSAyKSB7XG4gICAgICAgIHZhciBrZXkgPSBtZXRob2RzW2ldO1xuICAgICAgICB2YXIgZm4gPSBtZXRob2RzW2krMV07XG4gICAgICAgIHZhciBwcm9taXNpZmllZEtleSA9IGtleSArIHN1ZmZpeDtcbiAgICAgICAgb2JqW3Byb21pc2lmaWVkS2V5XSA9IHByb21pc2lmaWVyID09PSBtYWtlTm9kZVByb21pc2lmaWVkXG4gICAgICAgICAgICAgICAgPyBtYWtlTm9kZVByb21pc2lmaWVkKGtleSwgVEhJUywga2V5LCBmbiwgc3VmZml4KVxuICAgICAgICAgICAgICAgIDogcHJvbWlzaWZpZXIoZm4sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFrZU5vZGVQcm9taXNpZmllZChrZXksIFRISVMsIGtleSwgZm4sIHN1ZmZpeCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIHV0aWwudG9GYXN0UHJvcGVydGllcyhvYmopO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIHByb21pc2lmeShjYWxsYmFjaywgcmVjZWl2ZXIpIHtcbiAgICByZXR1cm4gbWFrZU5vZGVQcm9taXNpZmllZChjYWxsYmFjaywgcmVjZWl2ZXIsIHVuZGVmaW5lZCwgY2FsbGJhY2spO1xufVxuXG5Qcm9taXNlLnByb21pc2lmeSA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgfVxuICAgIGlmIChpc1Byb21pc2lmaWVkKGZuKSkge1xuICAgICAgICByZXR1cm4gZm47XG4gICAgfVxuICAgIHZhciByZXQgPSBwcm9taXNpZnkoZm4sIGFyZ3VtZW50cy5sZW5ndGggPCAyID8gVEhJUyA6IHJlY2VpdmVyKTtcbiAgICB1dGlsLmNvcHlEZXNjcmlwdG9ycyhmbiwgcmV0LCBwcm9wc0ZpbHRlcik7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvbWlzaWZ5QWxsID0gZnVuY3Rpb24gKHRhcmdldCwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidGhlIHRhcmdldCBvZiBwcm9taXNpZnlBbGwgbXVzdCBiZSBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzlJVGxWMFxcdTAwMGFcIik7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBPYmplY3Qob3B0aW9ucyk7XG4gICAgdmFyIHN1ZmZpeCA9IG9wdGlvbnMuc3VmZml4O1xuICAgIGlmICh0eXBlb2Ygc3VmZml4ICE9PSBcInN0cmluZ1wiKSBzdWZmaXggPSBkZWZhdWx0U3VmZml4O1xuICAgIHZhciBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICBpZiAodHlwZW9mIGZpbHRlciAhPT0gXCJmdW5jdGlvblwiKSBmaWx0ZXIgPSBkZWZhdWx0RmlsdGVyO1xuICAgIHZhciBwcm9taXNpZmllciA9IG9wdGlvbnMucHJvbWlzaWZpZXI7XG4gICAgaWYgKHR5cGVvZiBwcm9taXNpZmllciAhPT0gXCJmdW5jdGlvblwiKSBwcm9taXNpZmllciA9IG1ha2VOb2RlUHJvbWlzaWZpZWQ7XG5cbiAgICBpZiAoIXV0aWwuaXNJZGVudGlmaWVyKHN1ZmZpeCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJzdWZmaXggbXVzdCBiZSBhIHZhbGlkIGlkZW50aWZpZXJcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC84RlpvNVZcXHUwMDBhXCIpO1xuICAgIH1cblxuICAgIHZhciBrZXlzID0gdXRpbC5pbmhlcml0ZWREYXRhS2V5cyh0YXJnZXQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXRba2V5c1tpXV07XG4gICAgICAgIGlmIChrZXlzW2ldICE9PSBcImNvbnN0cnVjdG9yXCIgJiZcbiAgICAgICAgICAgIHV0aWwuaXNDbGFzcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHByb21pc2lmeUFsbCh2YWx1ZS5wcm90b3R5cGUsIHN1ZmZpeCwgZmlsdGVyLCBwcm9taXNpZmllcik7XG4gICAgICAgICAgICBwcm9taXNpZnlBbGwodmFsdWUsIHN1ZmZpeCwgZmlsdGVyLCBwcm9taXNpZmllcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzaWZ5QWxsKHRhcmdldCwgc3VmZml4LCBmaWx0ZXIsIHByb21pc2lmaWVyKTtcbn07XG59O1xuXG5cbn0se1wiLi9lcnJvcnNcIjoxMyxcIi4vcHJvbWlzZV9yZXNvbHZlci5qc1wiOjI1LFwiLi91dGlsLmpzXCI6Mzh9XSwyNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXG4gICAgUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBpc09iamVjdCA9IHV0aWwuaXNPYmplY3Q7XG52YXIgZXM1ID0gX2RlcmVxXyhcIi4vZXM1LmpzXCIpO1xuXG5mdW5jdGlvbiBQcm9wZXJ0aWVzUHJvbWlzZUFycmF5KG9iaikge1xuICAgIHZhciBrZXlzID0gZXM1LmtleXMob2JqKTtcbiAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW4gKiAyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5XTtcbiAgICAgICAgdmFsdWVzW2kgKyBsZW5dID0ga2V5O1xuICAgIH1cbiAgICB0aGlzLmNvbnN0cnVjdG9yJCh2YWx1ZXMpO1xufVxudXRpbC5pbmhlcml0cyhQcm9wZXJ0aWVzUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pbml0JCh1bmRlZmluZWQsIC0zKSA7XG59O1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgdmFyIHRvdGFsUmVzb2x2ZWQgPSArK3RoaXMuX3RvdGFsUmVzb2x2ZWQ7XG4gICAgaWYgKHRvdGFsUmVzb2x2ZWQgPj0gdGhpcy5fbGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSB7fTtcbiAgICAgICAgdmFyIGtleU9mZnNldCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aCgpOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHZhbFt0aGlzLl92YWx1ZXNbaSArIGtleU9mZnNldF1dID0gdGhpcy5fdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jlc29sdmUodmFsKTtcbiAgICB9XG59O1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVByb2dyZXNzZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5fcHJvbWlzZS5fcHJvZ3Jlc3Moe1xuICAgICAgICBrZXk6IHRoaXMuX3ZhbHVlc1tpbmRleCArIHRoaXMubGVuZ3RoKCldLFxuICAgICAgICB2YWx1ZTogdmFsdWVcbiAgICB9KTtcbn07XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLnNob3VsZENvcHlWYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuZ2V0QWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHJldHVybiBsZW4gPj4gMTtcbn07XG5cbmZ1bmN0aW9uIHByb3BzKHByb21pc2VzKSB7XG4gICAgdmFyIHJldDtcbiAgICB2YXIgY2FzdFZhbHVlID0gdHJ5Q29udmVydFRvUHJvbWlzZShwcm9taXNlcyk7XG5cbiAgICBpZiAoIWlzT2JqZWN0KGNhc3RWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImNhbm5vdCBhd2FpdCBwcm9wZXJ0aWVzIG9mIGEgbm9uLW9iamVjdFxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL09zRktDOFxcdTAwMGFcIik7XG4gICAgfSBlbHNlIGlmIChjYXN0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldCA9IGNhc3RWYWx1ZS5fdGhlbihcbiAgICAgICAgICAgIFByb21pc2UucHJvcHMsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0ID0gbmV3IFByb3BlcnRpZXNQcm9taXNlQXJyYXkoY2FzdFZhbHVlKS5wcm9taXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKGNhc3RWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0Ll9wcm9wYWdhdGVGcm9tKGNhc3RWYWx1ZSwgNCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb3BzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwcm9wcyh0aGlzKTtcbn07XG5cblByb21pc2UucHJvcHMgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gcHJvcHMocHJvbWlzZXMpO1xufTtcbn07XG5cbn0se1wiLi9lczUuanNcIjoxNCxcIi4vdXRpbC5qc1wiOjM4fV0sMjg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBhcnJheU1vdmUoc3JjLCBzcmNJbmRleCwgZHN0LCBkc3RJbmRleCwgbGVuKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW47ICsraikge1xuICAgICAgICBkc3RbaiArIGRzdEluZGV4XSA9IHNyY1tqICsgc3JjSW5kZXhdO1xuICAgICAgICBzcmNbaiArIHNyY0luZGV4XSA9IHZvaWQgMDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIFF1ZXVlKGNhcGFjaXR5KSB7XG4gICAgdGhpcy5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX2Zyb250ID0gMDtcbn1cblxuUXVldWUucHJvdG90eXBlLl93aWxsQmVPdmVyQ2FwYWNpdHkgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICAgIHJldHVybiB0aGlzLl9jYXBhY2l0eSA8IHNpemU7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX3B1c2hPbmUgPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdGhpcy5fY2hlY2tDYXBhY2l0eShsZW5ndGggKyAxKTtcbiAgICB2YXIgaSA9ICh0aGlzLl9mcm9udCArIGxlbmd0aCkgJiAodGhpcy5fY2FwYWNpdHkgLSAxKTtcbiAgICB0aGlzW2ldID0gYXJnO1xuICAgIHRoaXMuX2xlbmd0aCA9IGxlbmd0aCArIDE7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX3Vuc2hpZnRPbmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBjYXBhY2l0eSA9IHRoaXMuX2NhcGFjaXR5O1xuICAgIHRoaXMuX2NoZWNrQ2FwYWNpdHkodGhpcy5sZW5ndGgoKSArIDEpO1xuICAgIHZhciBmcm9udCA9IHRoaXMuX2Zyb250O1xuICAgIHZhciBpID0gKCgoKCBmcm9udCAtIDEgKSAmXG4gICAgICAgICAgICAgICAgICAgICggY2FwYWNpdHkgLSAxKSApIF4gY2FwYWNpdHkgKSAtIGNhcGFjaXR5ICk7XG4gICAgdGhpc1tpXSA9IHZhbHVlO1xuICAgIHRoaXMuX2Zyb250ID0gaTtcbiAgICB0aGlzLl9sZW5ndGggPSB0aGlzLmxlbmd0aCgpICsgMTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24oZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB0aGlzLl91bnNoaWZ0T25lKGFyZyk7XG4gICAgdGhpcy5fdW5zaGlmdE9uZShyZWNlaXZlcik7XG4gICAgdGhpcy5fdW5zaGlmdE9uZShmbik7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpICsgMztcbiAgICBpZiAodGhpcy5fd2lsbEJlT3ZlckNhcGFjaXR5KGxlbmd0aCkpIHtcbiAgICAgICAgdGhpcy5fcHVzaE9uZShmbik7XG4gICAgICAgIHRoaXMuX3B1c2hPbmUocmVjZWl2ZXIpO1xuICAgICAgICB0aGlzLl9wdXNoT25lKGFyZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGogPSB0aGlzLl9mcm9udCArIGxlbmd0aCAtIDM7XG4gICAgdGhpcy5fY2hlY2tDYXBhY2l0eShsZW5ndGgpO1xuICAgIHZhciB3cmFwTWFzayA9IHRoaXMuX2NhcGFjaXR5IC0gMTtcbiAgICB0aGlzWyhqICsgMCkgJiB3cmFwTWFza10gPSBmbjtcbiAgICB0aGlzWyhqICsgMSkgJiB3cmFwTWFza10gPSByZWNlaXZlcjtcbiAgICB0aGlzWyhqICsgMikgJiB3cmFwTWFza10gPSBhcmc7XG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuZ3RoO1xufTtcblxuUXVldWUucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmcm9udCA9IHRoaXMuX2Zyb250LFxuICAgICAgICByZXQgPSB0aGlzW2Zyb250XTtcblxuICAgIHRoaXNbZnJvbnRdID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2Zyb250ID0gKGZyb250ICsgMSkgJiAodGhpcy5fY2FwYWNpdHkgLSAxKTtcbiAgICB0aGlzLl9sZW5ndGgtLTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUXVldWUucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xufTtcblxuUXVldWUucHJvdG90eXBlLl9jaGVja0NhcGFjaXR5ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICBpZiAodGhpcy5fY2FwYWNpdHkgPCBzaXplKSB7XG4gICAgICAgIHRoaXMuX3Jlc2l6ZVRvKHRoaXMuX2NhcGFjaXR5IDw8IDEpO1xuICAgIH1cbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fcmVzaXplVG8gPSBmdW5jdGlvbiAoY2FwYWNpdHkpIHtcbiAgICB2YXIgb2xkQ2FwYWNpdHkgPSB0aGlzLl9jYXBhY2l0eTtcbiAgICB0aGlzLl9jYXBhY2l0eSA9IGNhcGFjaXR5O1xuICAgIHZhciBmcm9udCA9IHRoaXMuX2Zyb250O1xuICAgIHZhciBsZW5ndGggPSB0aGlzLl9sZW5ndGg7XG4gICAgdmFyIG1vdmVJdGVtc0NvdW50ID0gKGZyb250ICsgbGVuZ3RoKSAmIChvbGRDYXBhY2l0eSAtIDEpO1xuICAgIGFycmF5TW92ZSh0aGlzLCAwLCB0aGlzLCBvbGRDYXBhY2l0eSwgbW92ZUl0ZW1zQ291bnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWV1ZTtcblxufSx7fV0sMjk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFxuICAgIFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pIHtcbnZhciBpc0FycmF5ID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKS5pc0FycmF5O1xuXG52YXIgcmFjZUxhdGVyID0gZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgICAgIHJldHVybiByYWNlKGFycmF5LCBwcm9taXNlKTtcbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIHJhY2UocHJvbWlzZXMsIHBhcmVudCkge1xuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHByb21pc2VzKTtcblxuICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiByYWNlTGF0ZXIobWF5YmVQcm9taXNlKTtcbiAgICB9IGVsc2UgaWYgKCFpc0FycmF5KHByb21pc2VzKSkge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGFuIGFycmF5LCBhIHByb21pc2Ugb3IgYSB0aGVuYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3M4TU1oY1xcdTAwMGFcIik7XG4gICAgfVxuXG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0Ll9wcm9wYWdhdGVGcm9tKHBhcmVudCwgNCB8IDEpO1xuICAgIH1cbiAgICB2YXIgZnVsZmlsbCA9IHJldC5fZnVsZmlsbDtcbiAgICB2YXIgcmVqZWN0ID0gcmV0Ll9yZWplY3Q7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb21pc2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciB2YWwgPSBwcm9taXNlc1tpXTtcblxuICAgICAgICBpZiAodmFsID09PSB1bmRlZmluZWQgJiYgIShpIGluIHByb21pc2VzKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBQcm9taXNlLmNhc3QodmFsKS5fdGhlbihmdWxmaWxsLCByZWplY3QsIHVuZGVmaW5lZCwgcmV0LCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHJhY2UocHJvbWlzZXMsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByYWNlKHRoaXMsIHVuZGVmaW5lZCk7XG59O1xuXG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMzA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2VBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXBpUmVqZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlDb252ZXJ0VG9Qcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBJTlRFUk5BTCkge1xudmFyIGdldERvbWFpbiA9IFByb21pc2UuX2dldERvbWFpbjtcbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG5mdW5jdGlvbiBSZWR1Y3Rpb25Qcm9taXNlQXJyYXkocHJvbWlzZXMsIGZuLCBhY2N1bSwgX2VhY2gpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJChwcm9taXNlcyk7XG4gICAgdGhpcy5fcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXMgPSBfZWFjaCA9PT0gSU5URVJOQUwgPyBbXSA6IG51bGw7XG4gICAgdGhpcy5femVyb3RoSXNBY2N1bSA9IChhY2N1bSA9PT0gdW5kZWZpbmVkKTtcbiAgICB0aGlzLl9nb3RBY2N1bSA9IGZhbHNlO1xuICAgIHRoaXMuX3JlZHVjaW5nSW5kZXggPSAodGhpcy5femVyb3RoSXNBY2N1bSA/IDEgOiAwKTtcbiAgICB0aGlzLl92YWx1ZXNQaGFzZSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShhY2N1bSwgdGhpcy5fcHJvbWlzZSk7XG4gICAgdmFyIHJlamVjdGVkID0gZmFsc2U7XG4gICAgdmFyIGlzUHJvbWlzZSA9IG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2U7XG4gICAgaWYgKGlzUHJvbWlzZSkge1xuICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9wcm94eVByb21pc2VBcnJheSh0aGlzLCAtMSk7XG4gICAgICAgIH0gZWxzZSBpZiAobWF5YmVQcm9taXNlLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICBhY2N1bSA9IG1heWJlUHJvbWlzZS5fdmFsdWUoKTtcbiAgICAgICAgICAgIHRoaXMuX2dvdEFjY3VtID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlamVjdChtYXliZVByb21pc2UuX3JlYXNvbigpKTtcbiAgICAgICAgICAgIHJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIShpc1Byb21pc2UgfHwgdGhpcy5femVyb3RoSXNBY2N1bSkpIHRoaXMuX2dvdEFjY3VtID0gdHJ1ZTtcbiAgICB2YXIgZG9tYWluID0gZ2V0RG9tYWluKCk7XG4gICAgdGhpcy5fY2FsbGJhY2sgPSBkb21haW4gPT09IG51bGwgPyBmbiA6IGRvbWFpbi5iaW5kKGZuKTtcbiAgICB0aGlzLl9hY2N1bSA9IGFjY3VtO1xuICAgIGlmICghcmVqZWN0ZWQpIGFzeW5jLmludm9rZShpbml0LCB0aGlzLCB1bmRlZmluZWQpO1xufVxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLl9pbml0JCh1bmRlZmluZWQsIC01KTtcbn1cbnV0aWwuaW5oZXJpdHMoUmVkdWN0aW9uUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5SZWR1Y3Rpb25Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge307XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc29sdmVFbXB0eUFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9nb3RBY2N1bSB8fCB0aGlzLl96ZXJvdGhJc0FjY3VtKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUodGhpcy5fcHJlc2VydmVkVmFsdWVzICE9PSBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFtdIDogdGhpcy5fYWNjdW0pO1xuICAgIH1cbn07XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdmFyIHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICB2YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdmFyIHByZXNlcnZlZFZhbHVlcyA9IHRoaXMuX3ByZXNlcnZlZFZhbHVlcztcbiAgICB2YXIgaXNFYWNoID0gcHJlc2VydmVkVmFsdWVzICE9PSBudWxsO1xuICAgIHZhciBnb3RBY2N1bSA9IHRoaXMuX2dvdEFjY3VtO1xuICAgIHZhciB2YWx1ZXNQaGFzZSA9IHRoaXMuX3ZhbHVlc1BoYXNlO1xuICAgIHZhciB2YWx1ZXNQaGFzZUluZGV4O1xuICAgIGlmICghdmFsdWVzUGhhc2UpIHtcbiAgICAgICAgdmFsdWVzUGhhc2UgPSB0aGlzLl92YWx1ZXNQaGFzZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgICAgICBmb3IgKHZhbHVlc1BoYXNlSW5kZXg9MDsgdmFsdWVzUGhhc2VJbmRleDxsZW5ndGg7ICsrdmFsdWVzUGhhc2VJbmRleCkge1xuICAgICAgICAgICAgdmFsdWVzUGhhc2VbdmFsdWVzUGhhc2VJbmRleF0gPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhbHVlc1BoYXNlSW5kZXggPSB2YWx1ZXNQaGFzZVtpbmRleF07XG5cbiAgICBpZiAoaW5kZXggPT09IDAgJiYgdGhpcy5femVyb3RoSXNBY2N1bSkge1xuICAgICAgICB0aGlzLl9hY2N1bSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9nb3RBY2N1bSA9IGdvdEFjY3VtID0gdHJ1ZTtcbiAgICAgICAgdmFsdWVzUGhhc2VbaW5kZXhdID0gKCh2YWx1ZXNQaGFzZUluZGV4ID09PSAwKVxuICAgICAgICAgICAgPyAxIDogMik7XG4gICAgfSBlbHNlIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5fYWNjdW0gPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fZ290QWNjdW0gPSBnb3RBY2N1bSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHZhbHVlc1BoYXNlSW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIHZhbHVlc1BoYXNlW2luZGV4XSA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZXNQaGFzZVtpbmRleF0gPSAyO1xuICAgICAgICAgICAgdGhpcy5fYWNjdW0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWdvdEFjY3VtKSByZXR1cm47XG5cbiAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9jYWxsYmFjaztcbiAgICB2YXIgcmVjZWl2ZXIgPSB0aGlzLl9wcm9taXNlLl9ib3VuZFZhbHVlKCk7XG4gICAgdmFyIHJldDtcblxuICAgIGZvciAodmFyIGkgPSB0aGlzLl9yZWR1Y2luZ0luZGV4OyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFsdWVzUGhhc2VJbmRleCA9IHZhbHVlc1BoYXNlW2ldO1xuICAgICAgICBpZiAodmFsdWVzUGhhc2VJbmRleCA9PT0gMikge1xuICAgICAgICAgICAgdGhpcy5fcmVkdWNpbmdJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlc1BoYXNlSW5kZXggIT09IDEpIHJldHVybjtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIGlmIChpc0VhY2gpIHtcbiAgICAgICAgICAgIHByZXNlcnZlZFZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIHJldCA9IHRyeUNhdGNoKGNhbGxiYWNrKS5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgaSwgbGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHRyeUNhdGNoKGNhbGxiYWNrKVxuICAgICAgICAgICAgICAgIC5jYWxsKHJlY2VpdmVyLCB0aGlzLl9hY2N1bSwgdmFsdWUsIGksIGxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuXG4gICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSByZXR1cm4gdGhpcy5fcmVqZWN0KHJldC5lKTtcblxuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHRoaXMuX3Byb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzUGhhc2VbaV0gPSA0O1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXliZVByb21pc2UuX3Byb3h5UHJvbWlzZUFycmF5KHRoaXMsIGkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXQgPSBtYXliZVByb21pc2UuX3ZhbHVlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWplY3QobWF5YmVQcm9taXNlLl9yZWFzb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZWR1Y2luZ0luZGV4ID0gaSArIDE7XG4gICAgICAgIHRoaXMuX2FjY3VtID0gcmV0O1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmUoaXNFYWNoID8gcHJlc2VydmVkVmFsdWVzIDogdGhpcy5fYWNjdW0pO1xufTtcblxuZnVuY3Rpb24gcmVkdWNlKHByb21pc2VzLCBmbiwgaW5pdGlhbFZhbHVlLCBfZWFjaCkge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFwaVJlamVjdGlvbihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgdmFyIGFycmF5ID0gbmV3IFJlZHVjdGlvblByb21pc2VBcnJheShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpO1xuICAgIHJldHVybiBhcnJheS5wcm9taXNlKCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgcmV0dXJuIHJlZHVjZSh0aGlzLCBmbiwgaW5pdGlhbFZhbHVlLCBudWxsKTtcbn07XG5cblByb21pc2UucmVkdWNlID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbiwgaW5pdGlhbFZhbHVlLCBfZWFjaCkge1xuICAgIHJldHVybiByZWR1Y2UocHJvbWlzZXMsIGZuLCBpbml0aWFsVmFsdWUsIF9lYWNoKTtcbn07XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi91dGlsLmpzXCI6Mzh9XSwzMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBzY2hlZHVsZTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBub0FzeW5jU2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYXN5bmMgc2NoZWR1bGVyIGF2YWlsYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL20zT1RYa1xcdTAwMGFcIik7XG59O1xuaWYgKHV0aWwuaXNOb2RlICYmIHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdmFyIEdsb2JhbFNldEltbWVkaWF0ZSA9IGdsb2JhbC5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIFByb2Nlc3NOZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgc2NoZWR1bGUgPSB1dGlsLmlzUmVjZW50Tm9kZVxuICAgICAgICAgICAgICAgID8gZnVuY3Rpb24oZm4pIHsgR2xvYmFsU2V0SW1tZWRpYXRlLmNhbGwoZ2xvYmFsLCBmbik7IH1cbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKGZuKSB7IFByb2Nlc3NOZXh0VGljay5jYWxsKHByb2Nlc3MsIGZuKTsgfTtcbn0gZWxzZSBpZiAoKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyICE9PSBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICEodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvciAmJlxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvci5zdGFuZGFsb25lKSkge1xuICAgIHNjaGVkdWxlID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZuKTtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkaXYsIHthdHRyaWJ1dGVzOiB0cnVlfSk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHsgZGl2LmNsYXNzTGlzdC50b2dnbGUoXCJmb29cIik7IH07XG4gICAgfTtcbiAgICBzY2hlZHVsZS5pc1N0YXRpYyA9IHRydWU7XG59IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBzZXRJbW1lZGlhdGUoZm4pO1xuICAgIH07XG59IGVsc2UgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgc2NoZWR1bGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgc2NoZWR1bGUgPSBub0FzeW5jU2NoZWR1bGVyO1xufVxubW9kdWxlLmV4cG9ydHMgPSBzY2hlZHVsZTtcblxufSx7XCIuL3V0aWxcIjozOH1dLDMyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuICAgIGZ1bmN0aW9uKFByb21pc2UsIFByb21pc2VBcnJheSkge1xudmFyIFByb21pc2VJbnNwZWN0aW9uID0gUHJvbWlzZS5Qcm9taXNlSW5zcGVjdGlvbjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcblxuZnVuY3Rpb24gU2V0dGxlZFByb21pc2VBcnJheSh2YWx1ZXMpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJCh2YWx1ZXMpO1xufVxudXRpbC5pbmhlcml0cyhTZXR0bGVkUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5TZXR0bGVkUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVJlc29sdmVkID0gZnVuY3Rpb24gKGluZGV4LCBpbnNwZWN0aW9uKSB7XG4gICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IGluc3BlY3Rpb247XG4gICAgdmFyIHRvdGFsUmVzb2x2ZWQgPSArK3RoaXMuX3RvdGFsUmVzb2x2ZWQ7XG4gICAgaWYgKHRvdGFsUmVzb2x2ZWQgPj0gdGhpcy5fbGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUodGhpcy5fdmFsdWVzKTtcbiAgICB9XG59O1xuXG5TZXR0bGVkUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2VJbnNwZWN0aW9uKCk7XG4gICAgcmV0Ll9iaXRGaWVsZCA9IDI2ODQzNTQ1NjtcbiAgICByZXQuX3NldHRsZWRWYWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuX3Byb21pc2VSZXNvbHZlZChpbmRleCwgcmV0KTtcbn07XG5TZXR0bGVkUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVJlamVjdGVkID0gZnVuY3Rpb24gKHJlYXNvbiwgaW5kZXgpIHtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2VJbnNwZWN0aW9uKCk7XG4gICAgcmV0Ll9iaXRGaWVsZCA9IDEzNDIxNzcyODtcbiAgICByZXQuX3NldHRsZWRWYWx1ZSA9IHJlYXNvbjtcbiAgICB0aGlzLl9wcm9taXNlUmVzb2x2ZWQoaW5kZXgsIHJldCk7XG59O1xuXG5Qcm9taXNlLnNldHRsZSA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBuZXcgU2V0dGxlZFByb21pc2VBcnJheShwcm9taXNlcykucHJvbWlzZSgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0dGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgU2V0dGxlZFByb21pc2VBcnJheSh0aGlzKS5wcm9taXNlKCk7XG59O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDMzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24oUHJvbWlzZSwgUHJvbWlzZUFycmF5LCBhcGlSZWplY3Rpb24pIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBSYW5nZUVycm9yID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpLlJhbmdlRXJyb3I7XG52YXIgQWdncmVnYXRlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIikuQWdncmVnYXRlRXJyb3I7XG52YXIgaXNBcnJheSA9IHV0aWwuaXNBcnJheTtcblxuXG5mdW5jdGlvbiBTb21lUHJvbWlzZUFycmF5KHZhbHVlcykge1xuICAgIHRoaXMuY29uc3RydWN0b3IkKHZhbHVlcyk7XG4gICAgdGhpcy5faG93TWFueSA9IDA7XG4gICAgdGhpcy5fdW53cmFwID0gZmFsc2U7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcbn1cbnV0aWwuaW5oZXJpdHMoU29tZVByb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9ob3dNYW55ID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUoW10pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2luaXQkKHVuZGVmaW5lZCwgLTUpO1xuICAgIHZhciBpc0FycmF5UmVzb2x2ZWQgPSBpc0FycmF5KHRoaXMuX3ZhbHVlcyk7XG4gICAgaWYgKCF0aGlzLl9pc1Jlc29sdmVkKCkgJiZcbiAgICAgICAgaXNBcnJheVJlc29sdmVkICYmXG4gICAgICAgIHRoaXMuX2hvd01hbnkgPiB0aGlzLl9jYW5Qb3NzaWJseUZ1bGZpbGwoKSkge1xuICAgICAgICB0aGlzLl9yZWplY3QodGhpcy5fZ2V0UmFuZ2VFcnJvcih0aGlzLmxlbmd0aCgpKSk7XG4gICAgfVxufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5faW5pdCgpO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuc2V0VW53cmFwID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3Vud3JhcCA9IHRydWU7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5ob3dNYW55ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9ob3dNYW55O1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuc2V0SG93TWFueSA9IGZ1bmN0aW9uIChjb3VudCkge1xuICAgIHRoaXMuX2hvd01hbnkgPSBjb3VudDtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fYWRkRnVsZmlsbGVkKHZhbHVlKTtcbiAgICBpZiAodGhpcy5fZnVsZmlsbGVkKCkgPT09IHRoaXMuaG93TWFueSgpKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlcy5sZW5ndGggPSB0aGlzLmhvd01hbnkoKTtcbiAgICAgICAgaWYgKHRoaXMuaG93TWFueSgpID09PSAxICYmIHRoaXMuX3Vud3JhcCkge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl92YWx1ZXNbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl92YWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VSZWplY3RlZCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB0aGlzLl9hZGRSZWplY3RlZChyZWFzb24pO1xuICAgIGlmICh0aGlzLmhvd01hbnkoKSA+IHRoaXMuX2NhblBvc3NpYmx5RnVsZmlsbCgpKSB7XG4gICAgICAgIHZhciBlID0gbmV3IEFnZ3JlZ2F0ZUVycm9yKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxlbmd0aCgpOyBpIDwgdGhpcy5fdmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBlLnB1c2godGhpcy5fdmFsdWVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWplY3QoZSk7XG4gICAgfVxufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdG90YWxSZXNvbHZlZDtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aCAtIHRoaXMubGVuZ3RoKCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fYWRkUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fdmFsdWVzLnB1c2gocmVhc29uKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9hZGRGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5fdG90YWxSZXNvbHZlZCsrXSA9IHZhbHVlO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2NhblBvc3NpYmx5RnVsZmlsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5sZW5ndGgoKSAtIHRoaXMuX3JlamVjdGVkKCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZ2V0UmFuZ2VFcnJvciA9IGZ1bmN0aW9uIChjb3VudCkge1xuICAgIHZhciBtZXNzYWdlID0gXCJJbnB1dCBhcnJheSBtdXN0IGNvbnRhaW4gYXQgbGVhc3QgXCIgK1xuICAgICAgICAgICAgdGhpcy5faG93TWFueSArIFwiIGl0ZW1zIGJ1dCBjb250YWlucyBvbmx5IFwiICsgY291bnQgKyBcIiBpdGVtc1wiO1xuICAgIHJldHVybiBuZXcgUmFuZ2VFcnJvcihtZXNzYWdlKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZXNvbHZlRW1wdHlBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZWplY3QodGhpcy5fZ2V0UmFuZ2VFcnJvcigwKSk7XG59O1xuXG5mdW5jdGlvbiBzb21lKHByb21pc2VzLCBob3dNYW55KSB7XG4gICAgaWYgKChob3dNYW55IHwgMCkgIT09IGhvd01hbnkgfHwgaG93TWFueSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImV4cGVjdGluZyBhIHBvc2l0aXZlIGludGVnZXJcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC8xd0FtSHhcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gbmV3IFNvbWVQcm9taXNlQXJyYXkocHJvbWlzZXMpO1xuICAgIHZhciBwcm9taXNlID0gcmV0LnByb21pc2UoKTtcbiAgICByZXQuc2V0SG93TWFueShob3dNYW55KTtcbiAgICByZXQuaW5pdCgpO1xuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnNvbWUgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGhvd01hbnkpIHtcbiAgICByZXR1cm4gc29tZShwcm9taXNlcywgaG93TWFueSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGhvd01hbnkpIHtcbiAgICByZXR1cm4gc29tZSh0aGlzLCBob3dNYW55KTtcbn07XG5cblByb21pc2UuX1NvbWVQcm9taXNlQXJyYXkgPSBTb21lUHJvbWlzZUFycmF5O1xufTtcblxufSx7XCIuL2Vycm9ycy5qc1wiOjEzLFwiLi91dGlsLmpzXCI6Mzh9XSwzNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xuZnVuY3Rpb24gUHJvbWlzZUluc3BlY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmIChwcm9taXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvbWlzZSA9IHByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHByb21pc2UuX2JpdEZpZWxkO1xuICAgICAgICB0aGlzLl9zZXR0bGVkVmFsdWUgPSBwcm9taXNlLl9zZXR0bGVkVmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IDA7XG4gICAgICAgIHRoaXMuX3NldHRsZWRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2Fubm90IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBvZiBhIG5vbi1mdWxmaWxsZWQgcHJvbWlzZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL2hjMURMalxcdTAwMGFcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkVmFsdWU7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuZXJyb3IgPVxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLnJlYXNvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgZ2V0IHJlamVjdGlvbiByZWFzb24gb2YgYSBub24tcmVqZWN0ZWQgcHJvbWlzZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL2hQdWl3QlxcdTAwMGFcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkVmFsdWU7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPVxuUHJvbWlzZS5wcm90b3R5cGUuX2lzRnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAyNjg0MzU0NTYpID4gMDtcbn07XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5pc1JlamVjdGVkID1cblByb21pc2UucHJvdG90eXBlLl9pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAxMzQyMTc3MjgpID4gMDtcbn07XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5pc1BlbmRpbmcgPVxuUHJvbWlzZS5wcm90b3R5cGUuX2lzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNDAyNjUzMTg0KSA9PT0gMDtcbn07XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5pc1Jlc29sdmVkID1cblByb21pc2UucHJvdG90eXBlLl9pc1Jlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA0MDI2NTMxODQpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl90YXJnZXQoKS5faXNQZW5kaW5nKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldCgpLl9pc1JlamVjdGVkKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl90YXJnZXQoKS5faXNGdWxmaWxsZWQoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVzb2x2ZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0KCkuX2lzUmVzb2x2ZWQoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl92YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkVmFsdWU7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVhc29uID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkVmFsdWU7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXQoKTtcbiAgICBpZiAoIXRhcmdldC5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgZ2V0IGZ1bGZpbGxtZW50IHZhbHVlIG9mIGEgbm9uLWZ1bGZpbGxlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvaGMxRExqXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldC5fc2V0dGxlZFZhbHVlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucmVhc29uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuICAgIGlmICghdGFyZ2V0LmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2Fubm90IGdldCByZWplY3Rpb24gcmVhc29uIG9mIGEgbm9uLXJlamVjdGVkIHByb21pc2VcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9oUHVpd0JcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB0YXJnZXQuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICByZXR1cm4gdGFyZ2V0Ll9zZXR0bGVkVmFsdWU7XG59O1xuXG5cblByb21pc2UuUHJvbWlzZUluc3BlY3Rpb24gPSBQcm9taXNlSW5zcGVjdGlvbjtcbn07XG5cbn0se31dLDM1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciBpc09iamVjdCA9IHV0aWwuaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIHRyeUNvbnZlcnRUb1Byb21pc2Uob2JqLCBjb250ZXh0KSB7XG4gICAgaWYgKGlzT2JqZWN0KG9iaikpIHtcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNBbnlCbHVlYmlyZFByb21pc2Uob2JqKSkge1xuICAgICAgICAgICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgICAgIG9iai5fdGhlbihcbiAgICAgICAgICAgICAgICByZXQuX2Z1bGZpbGxVbmNoZWNrZWQsXG4gICAgICAgICAgICAgICAgcmV0Ll9yZWplY3RVbmNoZWNrZWRDaGVja0Vycm9yLFxuICAgICAgICAgICAgICAgIHJldC5fcHJvZ3Jlc3NVbmNoZWNrZWQsXG4gICAgICAgICAgICAgICAgcmV0LFxuICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aGVuID0gdXRpbC50cnlDYXRjaChnZXRUaGVuKShvYmopO1xuICAgICAgICBpZiAodGhlbiA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICAgICAgdmFyIHJldCA9IFByb21pc2UucmVqZWN0KHRoZW4uZSk7XG4gICAgICAgICAgICBpZiAoY29udGV4dCkgY29udGV4dC5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9UaGVuYWJsZShvYmosIHRoZW4sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIGdldFRoZW4ob2JqKSB7XG4gICAgcmV0dXJuIG9iai50aGVuO1xufVxuXG52YXIgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gaXNBbnlCbHVlYmlyZFByb21pc2Uob2JqKSB7XG4gICAgcmV0dXJuIGhhc1Byb3AuY2FsbChvYmosIFwiX3Byb21pc2UwXCIpO1xufVxuXG5mdW5jdGlvbiBkb1RoZW5hYmxlKHgsIHRoZW4sIGNvbnRleHQpIHtcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICB2YXIgcmV0ID0gcHJvbWlzZTtcbiAgICBpZiAoY29udGV4dCkgY29udGV4dC5fcHVzaENvbnRleHQoKTtcbiAgICBwcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wb3BDb250ZXh0KCk7XG4gICAgdmFyIHN5bmNocm9ub3VzID0gdHJ1ZTtcbiAgICB2YXIgcmVzdWx0ID0gdXRpbC50cnlDYXRjaCh0aGVuKS5jYWxsKHgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUZyb21UaGVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3RGcm9tVGhlbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NGcm9tVGhlbmFibGUpO1xuICAgIHN5bmNocm9ub3VzID0gZmFsc2U7XG4gICAgaWYgKHByb21pc2UgJiYgcmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXN1bHQuZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmVGcm9tVGhlbmFibGUodmFsdWUpIHtcbiAgICAgICAgaWYgKCFwcm9taXNlKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlamVjdEZyb21UaGVuYWJsZShyZWFzb24pIHtcbiAgICAgICAgaWYgKCFwcm9taXNlKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgc3luY2hyb25vdXMsIHRydWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9ncmVzc0Zyb21UaGVuYWJsZSh2YWx1ZSkge1xuICAgICAgICBpZiAoIXByb21pc2UpIHJldHVybjtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9taXNlLl9wcm9ncmVzcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9wcm9ncmVzcyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxucmV0dXJuIHRyeUNvbnZlcnRUb1Byb21pc2U7XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMzY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgVGltZW91dEVycm9yID0gUHJvbWlzZS5UaW1lb3V0RXJyb3I7XG5cbnZhciBhZnRlclRpbWVvdXQgPSBmdW5jdGlvbiAocHJvbWlzZSwgbWVzc2FnZSkge1xuICAgIGlmICghcHJvbWlzZS5pc1BlbmRpbmcoKSkgcmV0dXJuO1xuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBtZXNzYWdlID0gXCJvcGVyYXRpb24gdGltZWQgb3V0XCI7XG4gICAgfVxuICAgIHZhciBlcnIgPSBuZXcgVGltZW91dEVycm9yKG1lc3NhZ2UpO1xuICAgIHV0aWwubWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKGVycik7XG4gICAgcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZShlcnIpO1xuICAgIHByb21pc2UuX2NhbmNlbChlcnIpO1xufTtcblxudmFyIGFmdGVyVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkgeyByZXR1cm4gZGVsYXkoK3RoaXMpLnRoZW5SZXR1cm4odmFsdWUpOyB9O1xudmFyIGRlbGF5ID0gUHJvbWlzZS5kZWxheSA9IGZ1bmN0aW9uICh2YWx1ZSwgbXMpIHtcbiAgICBpZiAobXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtcyA9IHZhbHVlO1xuICAgICAgICB2YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgcmV0Ll9mdWxmaWxsKCk7IH0sIG1zKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgbXMgPSArbXM7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkuX3RoZW4oYWZ0ZXJWYWx1ZSwgbnVsbCwgbnVsbCwgbXMsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uIChtcykge1xuICAgIHJldHVybiBkZWxheSh0aGlzLCBtcyk7XG59O1xuXG5mdW5jdGlvbiBzdWNjZXNzQ2xlYXIodmFsdWUpIHtcbiAgICB2YXIgaGFuZGxlID0gdGhpcztcbiAgICBpZiAoaGFuZGxlIGluc3RhbmNlb2YgTnVtYmVyKSBoYW5kbGUgPSAraGFuZGxlO1xuICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZmFpbHVyZUNsZWFyKHJlYXNvbikge1xuICAgIHZhciBoYW5kbGUgPSB0aGlzO1xuICAgIGlmIChoYW5kbGUgaW5zdGFuY2VvZiBOdW1iZXIpIGhhbmRsZSA9ICtoYW5kbGU7XG4gICAgY2xlYXJUaW1lb3V0KGhhbmRsZSk7XG4gICAgdGhyb3cgcmVhc29uO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKG1zLCBtZXNzYWdlKSB7XG4gICAgbXMgPSArbXM7XG4gICAgdmFyIHJldCA9IHRoaXMudGhlbigpLmNhbmNlbGxhYmxlKCk7XG4gICAgcmV0Ll9jYW5jZWxsYXRpb25QYXJlbnQgPSB0aGlzO1xuICAgIHZhciBoYW5kbGUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIHRpbWVvdXRUaW1lb3V0KCkge1xuICAgICAgICBhZnRlclRpbWVvdXQocmV0LCBtZXNzYWdlKTtcbiAgICB9LCBtcyk7XG4gICAgcmV0dXJuIHJldC5fdGhlbihzdWNjZXNzQ2xlYXIsIGZhaWx1cmVDbGVhciwgdW5kZWZpbmVkLCBoYW5kbGUsIHVuZGVmaW5lZCk7XG59O1xuXG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMzc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChQcm9taXNlLCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgY3JlYXRlQ29udGV4dCkge1xuICAgIHZhciBUeXBlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIikuVHlwZUVycm9yO1xuICAgIHZhciBpbmhlcml0cyA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIikuaW5oZXJpdHM7XG4gICAgdmFyIFByb21pc2VJbnNwZWN0aW9uID0gUHJvbWlzZS5Qcm9taXNlSW5zcGVjdGlvbjtcblxuICAgIGZ1bmN0aW9uIGluc3BlY3Rpb25NYXBwZXIoaW5zcGVjdGlvbnMpIHtcbiAgICAgICAgdmFyIGxlbiA9IGluc3BlY3Rpb25zLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgdmFyIGluc3BlY3Rpb24gPSBpbnNwZWN0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChpbnNwZWN0aW9uLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChpbnNwZWN0aW9uLmVycm9yKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5zcGVjdGlvbnNbaV0gPSBpbnNwZWN0aW9uLl9zZXR0bGVkVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3BlY3Rpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRocm93ZXIoZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dGhyb3cgZTt9LCAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYXN0UHJlc2VydmluZ0Rpc3Bvc2FibGUodGhlbmFibGUpIHtcbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodGhlbmFibGUpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlICE9PSB0aGVuYWJsZSAmJlxuICAgICAgICAgICAgdHlwZW9mIHRoZW5hYmxlLl9pc0Rpc3Bvc2FibGUgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgdHlwZW9mIHRoZW5hYmxlLl9nZXREaXNwb3NlciA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICB0aGVuYWJsZS5faXNEaXNwb3NhYmxlKCkpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fc2V0RGlzcG9zYWJsZSh0aGVuYWJsZS5fZ2V0RGlzcG9zZXIoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1heWJlUHJvbWlzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZShyZXNvdXJjZXMsIGluc3BlY3Rpb24pIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGVuID0gcmVzb3VyY2VzLmxlbmd0aDtcbiAgICAgICAgdmFyIHJldCA9IFByb21pc2UuZGVmZXIoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0b3IoKSB7XG4gICAgICAgICAgICBpZiAoaSA+PSBsZW4pIHJldHVybiByZXQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IGNhc3RQcmVzZXJ2aW5nRGlzcG9zYWJsZShyZXNvdXJjZXNbaSsrXSk7XG4gICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSAmJlxuICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5faXNEaXNwb3NhYmxlKCkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9nZXREaXNwb3NlcigpLnRyeURpc3Bvc2UoaW5zcGVjdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMucHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhyb3dlcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlUHJvbWlzZS5fdGhlbihpdGVyYXRvciwgdGhyb3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdG9yKCk7XG4gICAgICAgIHJldHVybiByZXQucHJvbWlzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwb3NlclN1Y2Nlc3ModmFsdWUpIHtcbiAgICAgICAgdmFyIGluc3BlY3Rpb24gPSBuZXcgUHJvbWlzZUluc3BlY3Rpb24oKTtcbiAgICAgICAgaW5zcGVjdGlvbi5fc2V0dGxlZFZhbHVlID0gdmFsdWU7XG4gICAgICAgIGluc3BlY3Rpb24uX2JpdEZpZWxkID0gMjY4NDM1NDU2O1xuICAgICAgICByZXR1cm4gZGlzcG9zZSh0aGlzLCBpbnNwZWN0aW9uKS50aGVuUmV0dXJuKHZhbHVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwb3NlckZhaWwocmVhc29uKSB7XG4gICAgICAgIHZhciBpbnNwZWN0aW9uID0gbmV3IFByb21pc2VJbnNwZWN0aW9uKCk7XG4gICAgICAgIGluc3BlY3Rpb24uX3NldHRsZWRWYWx1ZSA9IHJlYXNvbjtcbiAgICAgICAgaW5zcGVjdGlvbi5fYml0RmllbGQgPSAxMzQyMTc3Mjg7XG4gICAgICAgIHJldHVybiBkaXNwb3NlKHRoaXMsIGluc3BlY3Rpb24pLnRoZW5UaHJvdyhyZWFzb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIERpc3Bvc2VyKGRhdGEsIHByb21pc2UsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuX3Byb21pc2UgPSBwcm9taXNlO1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUuZGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfTtcblxuICAgIERpc3Bvc2VyLnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9O1xuXG4gICAgRGlzcG9zZXIucHJvdG90eXBlLnJlc291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9taXNlKCkuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZSgpLnZhbHVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIERpc3Bvc2VyLnByb3RvdHlwZS50cnlEaXNwb3NlID0gZnVuY3Rpb24oaW5zcGVjdGlvbikge1xuICAgICAgICB2YXIgcmVzb3VyY2UgPSB0aGlzLnJlc291cmNlKCk7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcy5fY29udGV4dDtcbiAgICAgICAgaWYgKGNvbnRleHQgIT09IHVuZGVmaW5lZCkgY29udGV4dC5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgdmFyIHJldCA9IHJlc291cmNlICE9PSBudWxsXG4gICAgICAgICAgICA/IHRoaXMuZG9EaXNwb3NlKHJlc291cmNlLCBpbnNwZWN0aW9uKSA6IG51bGw7XG4gICAgICAgIGlmIChjb250ZXh0ICE9PSB1bmRlZmluZWQpIGNvbnRleHQuX3BvcENvbnRleHQoKTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fdW5zZXREaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBudWxsO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5pc0Rpc3Bvc2VyID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIChkICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgZC5yZXNvdXJjZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIGQudHJ5RGlzcG9zZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gRnVuY3Rpb25EaXNwb3NlcihmbiwgcHJvbWlzZSwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yJChmbiwgcHJvbWlzZSwgY29udGV4dCk7XG4gICAgfVxuICAgIGluaGVyaXRzKEZ1bmN0aW9uRGlzcG9zZXIsIERpc3Bvc2VyKTtcblxuICAgIEZ1bmN0aW9uRGlzcG9zZXIucHJvdG90eXBlLmRvRGlzcG9zZSA9IGZ1bmN0aW9uIChyZXNvdXJjZSwgaW5zcGVjdGlvbikge1xuICAgICAgICB2YXIgZm4gPSB0aGlzLmRhdGEoKTtcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwocmVzb3VyY2UsIHJlc291cmNlLCBpbnNwZWN0aW9uKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbWF5YmVVbndyYXBEaXNwb3Nlcih2YWx1ZSkge1xuICAgICAgICBpZiAoRGlzcG9zZXIuaXNEaXNwb3Nlcih2YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzb3VyY2VzW3RoaXMuaW5kZXhdLl9zZXREaXNwb3NhYmxlKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIFByb21pc2UudXNpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBpZiAobGVuIDwgMikgcmV0dXJuIGFwaVJlamVjdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieW91IG11c3QgcGFzcyBhdCBsZWFzdCAyIGFyZ3VtZW50cyB0byBQcm9taXNlLnVzaW5nXCIpO1xuICAgICAgICB2YXIgZm4gPSBhcmd1bWVudHNbbGVuIC0gMV07XG4gICAgICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFwaVJlamVjdGlvbihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgICAgIGxlbi0tO1xuICAgICAgICB2YXIgcmVzb3VyY2VzID0gbmV3IEFycmF5KGxlbik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChEaXNwb3Nlci5pc0Rpc3Bvc2VyKHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgIHZhciBkaXNwb3NlciA9IHJlc291cmNlO1xuICAgICAgICAgICAgICAgIHJlc291cmNlID0gcmVzb3VyY2UucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgIHJlc291cmNlLl9zZXREaXNwb3NhYmxlKGRpc3Bvc2VyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlID1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fdGhlbihtYXliZVVud3JhcERpc3Bvc2VyLCBudWxsLCBudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiByZXNvdXJjZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGlcbiAgICAgICAgICAgICAgICAgICAgfSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvdXJjZXNbaV0gPSByZXNvdXJjZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm9taXNlID0gUHJvbWlzZS5zZXR0bGUocmVzb3VyY2VzKVxuICAgICAgICAgICAgLnRoZW4oaW5zcGVjdGlvbk1hcHBlcilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHZhbHMpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgICAgICAgICAgICAgIHZhciByZXQ7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gZm4uYXBwbHkodW5kZWZpbmVkLCB2YWxzKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLl90aGVuKFxuICAgICAgICAgICAgICAgIGRpc3Bvc2VyU3VjY2VzcywgZGlzcG9zZXJGYWlsLCB1bmRlZmluZWQsIHJlc291cmNlcywgdW5kZWZpbmVkKTtcbiAgICAgICAgcmVzb3VyY2VzLnByb21pc2UgPSBwcm9taXNlO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX3NldERpc3Bvc2FibGUgPSBmdW5jdGlvbiAoZGlzcG9zZXIpIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDI2MjE0NDtcbiAgICAgICAgdGhpcy5fZGlzcG9zZXIgPSBkaXNwb3NlcjtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX2lzRGlzcG9zYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDI2MjE0NCkgPiAwO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5fZ2V0RGlzcG9zZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kaXNwb3NlcjtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0RGlzcG9zYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+MjYyMTQ0KTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZXIgPSB1bmRlZmluZWQ7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLmRpc3Bvc2VyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbkRpc3Bvc2VyKGZuLCB0aGlzLCBjcmVhdGVDb250ZXh0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICB9O1xuXG59O1xuXG59LHtcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL3V0aWwuanNcIjozOH1dLDM4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIGVzNSA9IF9kZXJlcV8oXCIuL2VzNS5qc1wiKTtcbnZhciBjYW5FdmFsdWF0ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgPT0gXCJ1bmRlZmluZWRcIjtcbnZhciBoYXZlR2V0dGVycyA9IChmdW5jdGlvbigpe1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBvID0ge307XG4gICAgICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShvLCBcImZcIiwge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gby5mID09PSAzO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG59KSgpO1xuXG52YXIgZXJyb3JPYmogPSB7ZToge319O1xudmFyIHRyeUNhdGNoVGFyZ2V0O1xuZnVuY3Rpb24gdHJ5Q2F0Y2hlcigpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdHJ5Q2F0Y2hUYXJnZXQ7XG4gICAgICAgIHRyeUNhdGNoVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3JPYmouZSA9IGU7XG4gICAgICAgIHJldHVybiBlcnJvck9iajtcbiAgICB9XG59XG5mdW5jdGlvbiB0cnlDYXRjaChmbikge1xuICAgIHRyeUNhdGNoVGFyZ2V0ID0gZm47XG4gICAgcmV0dXJuIHRyeUNhdGNoZXI7XG59XG5cbnZhciBpbmhlcml0cyA9IGZ1bmN0aW9uKENoaWxkLCBQYXJlbnQpIHtcbiAgICB2YXIgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gICAgZnVuY3Rpb24gVCgpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciA9IENoaWxkO1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yJCA9IFBhcmVudDtcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIFBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGlmIChoYXNQcm9wLmNhbGwoUGFyZW50LnByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSAmJlxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZS5jaGFyQXQocHJvcGVydHlOYW1lLmxlbmd0aC0xKSAhPT0gXCIkXCJcbiAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWUgKyBcIiRcIl0gPSBQYXJlbnQucHJvdG90eXBlW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgVC5wcm90b3R5cGUgPSBQYXJlbnQucHJvdG90eXBlO1xuICAgIENoaWxkLnByb3RvdHlwZSA9IG5ldyBUKCk7XG4gICAgcmV0dXJuIENoaWxkLnByb3RvdHlwZTtcbn07XG5cblxuZnVuY3Rpb24gaXNQcmltaXRpdmUodmFsKSB7XG4gICAgcmV0dXJuIHZhbCA9PSBudWxsIHx8IHZhbCA9PT0gdHJ1ZSB8fCB2YWwgPT09IGZhbHNlIHx8XG4gICAgICAgIHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIjtcblxufVxuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiAhaXNQcmltaXRpdmUodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBtYXliZVdyYXBBc0Vycm9yKG1heWJlRXJyb3IpIHtcbiAgICBpZiAoIWlzUHJpbWl0aXZlKG1heWJlRXJyb3IpKSByZXR1cm4gbWF5YmVFcnJvcjtcblxuICAgIHJldHVybiBuZXcgRXJyb3Ioc2FmZVRvU3RyaW5nKG1heWJlRXJyb3IpKTtcbn1cblxuZnVuY3Rpb24gd2l0aEFwcGVuZGVkKHRhcmdldCwgYXBwZW5kZWUpIHtcbiAgICB2YXIgbGVuID0gdGFyZ2V0Lmxlbmd0aDtcbiAgICB2YXIgcmV0ID0gbmV3IEFycmF5KGxlbiArIDEpO1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICByZXRbaV0gPSB0YXJnZXRbaV07XG4gICAgfVxuICAgIHJldFtpXSA9IGFwcGVuZGVlO1xuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIGdldERhdGFQcm9wZXJ0eU9yRGVmYXVsdChvYmosIGtleSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKGVzNS5pc0VTNSkge1xuICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuXG4gICAgICAgIGlmIChkZXNjICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBkZXNjLmdldCA9PSBudWxsICYmIGRlc2Muc2V0ID09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgPyBkZXNjLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIDogZGVmYXVsdFZhbHVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpID8gb2JqW2tleV0gOiB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RFbnVtZXJhYmxlUHJvcChvYmosIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKGlzUHJpbWl0aXZlKG9iaikpIHJldHVybiBvYmo7XG4gICAgdmFyIGRlc2NyaXB0b3IgPSB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9O1xuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIGRlc2NyaXB0b3IpO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIHRocm93ZXIocikge1xuICAgIHRocm93IHI7XG59XG5cbnZhciBpbmhlcml0ZWREYXRhS2V5cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgZXhjbHVkZWRQcm90b3R5cGVzID0gW1xuICAgICAgICBBcnJheS5wcm90b3R5cGUsXG4gICAgICAgIE9iamVjdC5wcm90b3R5cGUsXG4gICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZVxuICAgIF07XG5cbiAgICB2YXIgaXNFeGNsdWRlZFByb3RvID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZWRQcm90b3R5cGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZWRQcm90b3R5cGVzW2ldID09PSB2YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGlmIChlczUuaXNFUzUpIHtcbiAgICAgICAgdmFyIGdldEtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgdmFyIHZpc2l0ZWRLZXlzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICAgIHdoaWxlIChvYmogIT0gbnVsbCAmJiAhaXNFeGNsdWRlZFByb3RvKG9iaikpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5cztcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBrZXlzID0gZ2V0S2V5cyhvYmopO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmlzaXRlZEtleXNba2V5XSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0ZWRLZXlzW2tleV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzYyAhPSBudWxsICYmIGRlc2MuZ2V0ID09IG51bGwgJiYgZGVzYy5zZXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmogPSBlczUuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgaWYgKGlzRXhjbHVkZWRQcm90byhvYmopKSByZXR1cm4gW107XG4gICAgICAgICAgICB2YXIgcmV0ID0gW107XG5cbiAgICAgICAgICAgIC8qanNoaW50IGZvcmluOmZhbHNlICovXG4gICAgICAgICAgICBlbnVtZXJhdGlvbjogZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNQcm9wLmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlZFByb3RvdHlwZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNQcm9wLmNhbGwoZXhjbHVkZWRQcm90b3R5cGVzW2ldLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgZW51bWVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9O1xuICAgIH1cblxufSkoKTtcblxudmFyIHRoaXNBc3NpZ25tZW50UGF0dGVybiA9IC90aGlzXFxzKlxcLlxccypcXFMrXFxzKj0vO1xuZnVuY3Rpb24gaXNDbGFzcyhmbikge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBlczUubmFtZXMoZm4ucHJvdG90eXBlKTtcblxuICAgICAgICAgICAgdmFyIGhhc01ldGhvZHMgPSBlczUuaXNFUzUgJiYga2V5cy5sZW5ndGggPiAxO1xuICAgICAgICAgICAgdmFyIGhhc01ldGhvZHNPdGhlclRoYW5Db25zdHJ1Y3RvciA9IGtleXMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICEoa2V5cy5sZW5ndGggPT09IDEgJiYga2V5c1swXSA9PT0gXCJjb25zdHJ1Y3RvclwiKTtcbiAgICAgICAgICAgIHZhciBoYXNUaGlzQXNzaWdubWVudEFuZFN0YXRpY01ldGhvZHMgPVxuICAgICAgICAgICAgICAgIHRoaXNBc3NpZ25tZW50UGF0dGVybi50ZXN0KGZuICsgXCJcIikgJiYgZXM1Lm5hbWVzKGZuKS5sZW5ndGggPiAwO1xuXG4gICAgICAgICAgICBpZiAoaGFzTWV0aG9kcyB8fCBoYXNNZXRob2RzT3RoZXJUaGFuQ29uc3RydWN0b3IgfHxcbiAgICAgICAgICAgICAgICBoYXNUaGlzQXNzaWdubWVudEFuZFN0YXRpY01ldGhvZHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b0Zhc3RQcm9wZXJ0aWVzKG9iaikge1xuICAgIC8qanNoaW50IC1XMDI3LC1XMDU1LC1XMDMxKi9cbiAgICBmdW5jdGlvbiBmKCkge31cbiAgICBmLnByb3RvdHlwZSA9IG9iajtcbiAgICB2YXIgbCA9IDg7XG4gICAgd2hpbGUgKGwtLSkgbmV3IGYoKTtcbiAgICByZXR1cm4gb2JqO1xuICAgIGV2YWwob2JqKTtcbn1cblxudmFyIHJpZGVudCA9IC9eW2EteiRfXVthLXokXzAtOV0qJC9pO1xuZnVuY3Rpb24gaXNJZGVudGlmaWVyKHN0cikge1xuICAgIHJldHVybiByaWRlbnQudGVzdChzdHIpO1xufVxuXG5mdW5jdGlvbiBmaWxsZWRSYW5nZShjb3VudCwgcHJlZml4LCBzdWZmaXgpIHtcbiAgICB2YXIgcmV0ID0gbmV3IEFycmF5KGNvdW50KTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICByZXRbaV0gPSBwcmVmaXggKyBpICsgc3VmZml4O1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBzYWZlVG9TdHJpbmcob2JqKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG9iaiArIFwiXCI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gXCJbbm8gc3RyaW5nIHJlcHJlc2VudGF0aW9uXVwiO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKGUpIHtcbiAgICB0cnkge1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcChlLCBcImlzT3BlcmF0aW9uYWxcIiwgdHJ1ZSk7XG4gICAgfVxuICAgIGNhdGNoKGlnbm9yZSkge31cbn1cblxuZnVuY3Rpb24gb3JpZ2luYXRlc0Zyb21SZWplY3Rpb24oZSkge1xuICAgIGlmIChlID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKChlIGluc3RhbmNlb2YgRXJyb3JbXCJfX0JsdWViaXJkRXJyb3JUeXBlc19fXCJdLk9wZXJhdGlvbmFsRXJyb3IpIHx8XG4gICAgICAgIGVbXCJpc09wZXJhdGlvbmFsXCJdID09PSB0cnVlKTtcbn1cblxuZnVuY3Rpb24gY2FuQXR0YWNoVHJhY2Uob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEVycm9yICYmIGVzNS5wcm9wZXJ0eUlzV3JpdGFibGUob2JqLCBcInN0YWNrXCIpO1xufVxuXG52YXIgZW5zdXJlRXJyb3JPYmplY3QgPSAoZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoXCJzdGFja1wiIGluIG5ldyBFcnJvcigpKSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjYW5BdHRhY2hUcmFjZSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIHRyeSB7dGhyb3cgbmV3IEVycm9yKHNhZmVUb1N0cmluZyh2YWx1ZSkpO31cbiAgICAgICAgICAgIGNhdGNoKGVycikge3JldHVybiBlcnI7fVxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGNhbkF0dGFjaFRyYWNlKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihzYWZlVG9TdHJpbmcodmFsdWUpKTtcbiAgICAgICAgfTtcbiAgICB9XG59KSgpO1xuXG5mdW5jdGlvbiBjbGFzc1N0cmluZyhvYmopIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbChvYmopO1xufVxuXG5mdW5jdGlvbiBjb3B5RGVzY3JpcHRvcnMoZnJvbSwgdG8sIGZpbHRlcikge1xuICAgIHZhciBrZXlzID0gZXM1Lm5hbWVzKGZyb20pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKGZpbHRlcihrZXkpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGVzNS5kZWZpbmVQcm9wZXJ0eSh0bywga2V5LCBlczUuZ2V0RGVzY3JpcHRvcihmcm9tLCBrZXkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIHJldCA9IHtcbiAgICBpc0NsYXNzOiBpc0NsYXNzLFxuICAgIGlzSWRlbnRpZmllcjogaXNJZGVudGlmaWVyLFxuICAgIGluaGVyaXRlZERhdGFLZXlzOiBpbmhlcml0ZWREYXRhS2V5cyxcbiAgICBnZXREYXRhUHJvcGVydHlPckRlZmF1bHQ6IGdldERhdGFQcm9wZXJ0eU9yRGVmYXVsdCxcbiAgICB0aHJvd2VyOiB0aHJvd2VyLFxuICAgIGlzQXJyYXk6IGVzNS5pc0FycmF5LFxuICAgIGhhdmVHZXR0ZXJzOiBoYXZlR2V0dGVycyxcbiAgICBub3RFbnVtZXJhYmxlUHJvcDogbm90RW51bWVyYWJsZVByb3AsXG4gICAgaXNQcmltaXRpdmU6IGlzUHJpbWl0aXZlLFxuICAgIGlzT2JqZWN0OiBpc09iamVjdCxcbiAgICBjYW5FdmFsdWF0ZTogY2FuRXZhbHVhdGUsXG4gICAgZXJyb3JPYmo6IGVycm9yT2JqLFxuICAgIHRyeUNhdGNoOiB0cnlDYXRjaCxcbiAgICBpbmhlcml0czogaW5oZXJpdHMsXG4gICAgd2l0aEFwcGVuZGVkOiB3aXRoQXBwZW5kZWQsXG4gICAgbWF5YmVXcmFwQXNFcnJvcjogbWF5YmVXcmFwQXNFcnJvcixcbiAgICB0b0Zhc3RQcm9wZXJ0aWVzOiB0b0Zhc3RQcm9wZXJ0aWVzLFxuICAgIGZpbGxlZFJhbmdlOiBmaWxsZWRSYW5nZSxcbiAgICB0b1N0cmluZzogc2FmZVRvU3RyaW5nLFxuICAgIGNhbkF0dGFjaFRyYWNlOiBjYW5BdHRhY2hUcmFjZSxcbiAgICBlbnN1cmVFcnJvck9iamVjdDogZW5zdXJlRXJyb3JPYmplY3QsXG4gICAgb3JpZ2luYXRlc0Zyb21SZWplY3Rpb246IG9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uLFxuICAgIG1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbjogbWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uLFxuICAgIGNsYXNzU3RyaW5nOiBjbGFzc1N0cmluZyxcbiAgICBjb3B5RGVzY3JpcHRvcnM6IGNvcHlEZXNjcmlwdG9ycyxcbiAgICBoYXNEZXZUb29sczogdHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUgJiZcbiAgICAgICAgICAgICAgICAgdHlwZW9mIGNocm9tZS5sb2FkVGltZXMgPT09IFwiZnVuY3Rpb25cIixcbiAgICBpc05vZGU6IHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIGNsYXNzU3RyaW5nKHByb2Nlc3MpLnRvTG93ZXJDYXNlKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiXG59O1xucmV0LmlzUmVjZW50Tm9kZSA9IHJldC5pc05vZGUgJiYgKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ZXJzaW9uID0gcHJvY2Vzcy52ZXJzaW9ucy5ub2RlLnNwbGl0KFwiLlwiKS5tYXAoTnVtYmVyKTtcbiAgICByZXR1cm4gKHZlcnNpb25bMF0gPT09IDAgJiYgdmVyc2lvblsxXSA+IDEwKSB8fCAodmVyc2lvblswXSA+IDApO1xufSkoKTtcblxuaWYgKHJldC5pc05vZGUpIHJldC50b0Zhc3RQcm9wZXJ0aWVzKHByb2Nlc3MpO1xuXG50cnkge3Rocm93IG5ldyBFcnJvcigpOyB9IGNhdGNoIChlKSB7cmV0Lmxhc3RMaW5lRXJyb3IgPSBlO31cbm1vZHVsZS5leHBvcnRzID0gcmV0O1xuXG59LHtcIi4vZXM1LmpzXCI6MTR9XX0se30sWzRdKSg0KVxufSk7ICAgICAgICAgICAgICAgICAgICA7aWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdyAhPT0gbnVsbCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuUCA9IHdpbmRvdy5Qcm9taXNlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgJiYgc2VsZiAhPT0gbnVsbCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5QID0gc2VsZi5Qcm9taXNlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
