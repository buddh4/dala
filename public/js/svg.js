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
}

SubEvent.prototype.getSubType = function(type) {
    return this.context+':'+type;
}

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

var moveDown = function(node) {
    var $node = getJQueryNode(node);
    $node.before($node.next());
};

var moveUp = function(node) {
    var $node = getJQueryNode(node);
    $node.after($node.prev());
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

SVGElement.prototype.firstChild = function() {
    return $.qCache().svg(this.$().children().first());
};

SVGElement.prototype.down = function() {
    dom.moveDown(this.instance());
};

SVGElement.prototype.up = function() {
    dom.moveUp(this.instance());
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
}

SVGElement.prototype.toString = function() {
    return util.xml.serializeToString(this.instance());
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

/**
 * This function creates an SVGElement out of the given id selector element.
 * @param selector
 * @returns {SVGElement|exports|module.exports}
 */
SVG.get = function(selector) {
    if(selector.SVGElement) {
        return selector;
    }

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
            return SVG._svgInstance($node, svgInstance);
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
var queryCache = require('../core/cache');

$.fn.svg = function(selector) {
    if(selector && selector.SVGElement) {
        return selector;
    }else if(selector) {
        return $(selector).svg();
    }

    if(!this.length) {
        return;
    } else if(this.length === 1) {
        return SVG.get(this);
    } else if(this.length > 1) {
        var result =  [];
        this.each(function() {
            result.push(SVG.get(this));
        })
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

},{"../core/cache":2,"../svg/svg":20}],28:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LnN2Zy5qcyIsImNsaWVudC9jb3JlL2NhY2hlLmpzIiwiY2xpZW50L2NvcmUvY29uZmlnLmpzIiwiY2xpZW50L2NvcmUvZXZlbnQuanMiLCJjbGllbnQvY29yZS9zdWJFdmVudC5qcyIsImNsaWVudC9kb20vZG9tLmpzIiwiY2xpZW50L2RvbS9kb21FbGVtZW50LmpzIiwiY2xpZW50L2RvbS9ldmVudGFibGVOb2RlLmpzIiwiY2xpZW50L3N2Zy9TVkdFbGVtZW50LmpzIiwiY2xpZW50L3N2Zy9jaXJjbGUuanMiLCJjbGllbnQvc3ZnL2RyYWdnYWJsZS5qcyIsImNsaWVudC9zdmcvZWxlbWVudHMuanMiLCJjbGllbnQvc3ZnL2VsbGlwc2UuanMiLCJjbGllbnQvc3ZnL2dyb3VwLmpzIiwiY2xpZW50L3N2Zy9oZWxwZXIuanMiLCJjbGllbnQvc3ZnL3BhdGguanMiLCJjbGllbnQvc3ZnL3BhdGhEYXRhLmpzIiwiY2xpZW50L3N2Zy9yZWN0LmpzIiwiY2xpZW50L3N2Zy9zdHlsZS5qcyIsImNsaWVudC9zdmcvc3ZnLmpzIiwiY2xpZW50L3N2Zy9zdmdSb290LmpzIiwiY2xpZW50L3N2Zy9zdmdTaGFwZS5qcyIsImNsaWVudC9zdmcvdGV4dC5qcyIsImNsaWVudC9zdmcvdHJhbnNmb3JtLmpzIiwiY2xpZW50L3N2Zy90c3Bhbi5qcyIsImNsaWVudC91aS9qcXVlcnlQbHVnaW5zLmpzIiwiY2xpZW50L3V0aWwvVXRpbC5qcyIsImNsaWVudC91dGlsL2FwcC5qcyIsImNsaWVudC91dGlsL2Jlemllci5qcyIsImNsaWVudC91dGlsL21hdGguanMiLCJjbGllbnQvdXRpbC9vYmplY3QuanMiLCJjbGllbnQvdXRpbC9zdHJpbmcuanMiLCJjbGllbnQvdXRpbC94bWwuanMiLCJub2RlX21vZHVsZXMvYmx1ZWJpcmQvanMvYnJvd3Nlci9ibHVlYmlyZC5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3h2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vdWkvanF1ZXJ5UGx1Z2lucycpO1xucmVxdWlyZSgnLi9zdmcvZHJhZ2dhYmxlJyk7XG5cbmlmKCF3aW5kb3cuZGFsYSkge1xuICAgIGRhbGEgPSB7fTtcbn1cblxuaWYoIXdpbmRvdy5kYWxhLlNWRykge1xuICAgIHdpbmRvdy5kYWxhLlNWRyA9IHJlcXVpcmUoJy4vc3ZnL3N2ZycpO1xufVxuXG4iLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20nKTtcclxudmFyIHN0cmluZyA9IHJlcXVpcmUoJy4uL3V0aWwvc3RyaW5nJyk7XHJcblxyXG52YXIgQ2FjaGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucXVlcnlDYWNoZSA9IHt9O1xyXG4gICAgdGhpcy5zdmdDYWNoZSA9IHt9O1xyXG59O1xyXG5cclxuQ2FjaGUucHJvdG90eXBlLmNsZWFyQnlTdWZmaXggPSBmdW5jdGlvbihzdWZmaXgpIHtcclxuICAgIGZvcihrZXkgaW4gdGhpcy5xdWVyeUNhY2hlKSB7XHJcbiAgICAgICAgaWYodGhpcy5xdWVyeUNhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgc3RyaW5nLmVuZHNXaXRoKGtleSwgc3VmZml4KSkge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5xdWVyeUNhY2hlW2tleV07XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmb3Ioa2V5IGluIHRoaXMuc3ZnQ2FjaGUpIHtcclxuICAgICAgICBpZih0aGlzLnN2Z0NhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgc3RyaW5nLmVuZHNXaXRoKGtleSwgc3VmZml4KSkge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdmdDYWNoZVtrZXldO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn07XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuJCA9IGZ1bmN0aW9uKG9iaiwgcHJldmVudENhY2hlKSB7XHJcbiAgICBpZighb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMucXVlcnlDYWNoZVtvYmpdKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlDYWNoZVtvYmpdO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0Q2FjaGVTZXR0aW5ncyhvYmosIHRoaXMucXVlcnlDYWNoZSk7XHJcbiAgICByZXR1cm4gdGhpcy5jYWNoZUNoZWNrKHNldHRpbmdzLmtleSwgc2V0dGluZ3MuJG5vZGUsIHRoaXMucXVlcnlDYWNoZSwgcHJldmVudENhY2hlKTtcclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS5zdmcgPSBmdW5jdGlvbihvYmosIHByZXZlbnRDYWNoZSkge1xyXG4gICAgaWYoIW9iaikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLnN2Z0NhY2hlW29ial0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdmdDYWNoZVtvYmpdO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0Q2FjaGVTZXR0aW5ncyhvYmosIHRoaXMuc3ZnQ2FjaGUpO1xyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVDaGVjayhzZXR0aW5ncy5rZXksICQuc3ZnKHNldHRpbmdzLiRub2RlKSwgdGhpcy5zdmdDYWNoZSwgcHJldmVudENhY2hlKTtcclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS5nZXRDYWNoZVNldHRpbmdzID0gZnVuY3Rpb24ob2JqLCBjYWNoZSkge1xyXG4gICAgdmFyIHNldHRpbmdzID0ge307XHJcblxyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKG9iaikpe1xyXG4gICAgICAgIHNldHRpbmdzLiRub2RlID0gdGhpcy5xdWVyeUNhY2hlW29ial0gfHwgJChvYmopO1xyXG4gICAgICAgIHNldHRpbmdzLmtleSA9IG9iajtcclxuICAgIH0gZWxzZSBpZihvYmoualF1ZXJ5KSB7XHJcbiAgICAgICAgc2V0dGluZ3MuJG5vZGUgPSBvYmo7XHJcbiAgICAgICAgc2V0dGluZ3Mua2V5ID0gZG9tLmdldElkU2VsZWN0b3Iob2JqLmF0dHIoJ2lkJykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MuJG5vZGUgPSAkKG9iaik7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmtleSA9IGRvbS5nZXRJZFNlbGVjdG9yKHNldHRpbmdzLiRub2RlLmF0dHIoJ2lkJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzZXR0aW5ncztcclxufVxyXG5cclxuQ2FjaGUucHJvdG90eXBlLmNhY2hlQ2hlY2sgPSBmdW5jdGlvbihrZXksIG9iaiwgY2FjaGUsIHByZXZlbnRDYWNoZSkge1xyXG4gICAgcHJldmVudENhY2hlID0gcHJldmVudENhY2hlIHx8IGZhbHNlO1xyXG4gICAgaWYoa2V5ICYmIG9iaikge1xyXG4gICAgICAgIHJldHVybiAoIXByZXZlbnRDYWNoZSkgPyBjYWNoZVtrZXldID0gb2JqIDogb2JqO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG59XHJcblxyXG5DYWNoZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcob2JqKSkge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLnF1ZXJ5Q2FjaGVbb2JqXTtcclxuICAgIH1cclxufTtcclxuXHJcbkNhY2hlLnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuIG9iamVjdC5pc0RlZmluZWQocXVlcnlDYWNoW3NlbGVjdG9yXSk7XHJcbn07XHJcblxyXG5DYWNoZS5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IENhY2hlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDYWNoZSgpOyIsInZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG5cclxudmFyIHZhbHVlcyA9IHt9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB2YWwgOiBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwpIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGtleSkpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlc1trZXldO1xyXG4gICAgICAgICAgICByZXR1cm4gKG9iamVjdC5pc0RlZmluZWQocmVzdWx0KSkgPyByZXN1bHQgOiBkZWZhdWx0VmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaXMgOiBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWwoa2V5LGRlZmF1bHRWYWwpID09PSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWJ1ZyA6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0Jvb2xlYW4odmFsKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFZhbCgnZGVidWcnLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy52YWwoJ2RlYnVnJywgZmFsc2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWwgOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzRGVmaW5lZChrZXkpICYmIG9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhbChrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVwbGFjZUNvbmZpZ1ZhbHVlcyA6IGZ1bmN0aW9uKHRleHQsIGNvbmZpZykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0ZXh0O1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGNvbmZpZywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVnRXhwID0gbmV3IFJlZ0V4cChcIntcIiArIGtleSArIFwifVwiLCBcImdcIik7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKHJlZ0V4cCwgdmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07IiwidmFyIGV2ZW50cyA9IHt9O1xyXG5cclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb3JlL2NvbmZpZycpO1xyXG52YXIgU3ViRXZlbnQgPSByZXF1aXJlKCcuL3N1YkV2ZW50Jyk7XHJcblxyXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XHJcblxyXG52YXIgaGFzSGFuZGxlciA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiBldmVudHNbdHlwZV07XHJcbn07XHJcblxyXG5tb3VzZSA9IHt9O1xyXG5cclxuJChkb2N1bWVudCkub24oICdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBtb3VzZSA9IGU7XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbW91c2UgOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbW91c2U7XHJcbiAgICB9LFxyXG4gICAgbGlzdGVuOiAgZnVuY3Rpb24odHlwZSwgaGFuZGxlciwgbW9kdWxlKSB7XHJcbiAgICAgICAgaWYoIW9iamVjdC5pc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBldmVudENvbmZpZyA9IHtcclxuICAgICAgICAgICAgaGFuZGxlciA6IGhhbmRsZXIsXHJcbiAgICAgICAgICAgIG1vZHVsZSA6IG1vZHVsZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmKCFldmVudHNbdHlwZV0pIHtcclxuICAgICAgICAgICAgZXZlbnRzW3R5cGVdID0gW2V2ZW50Q29uZmlnXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBldmVudHNbdHlwZV0ucHVzaChldmVudENvbmZpZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB1bmxpc3RlbjogZnVuY3Rpb24odHlwZSwgZnVuYykge1xyXG4gICAgICAgIGlmKGV2ZW50c1t0eXBlXSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBldmVudHNbdHlwZV0uaW5kZXhPZihmdW5jKTtcclxuICAgICAgICAgICAgaWYoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRzW3R5cGVdLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHN1YjogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU3ViRXZlbnQoY29udGV4dCwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbW1hbmQ6IGZ1bmN0aW9uKGNvbW1hbmQsIGV4ZWN1dGUpIHtcclxuICAgICAgICBpZihleGVjdXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcignY29tbWFuZF9leGVjdXRlJywgY29tbWFuZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21tYW5kX2FkZCcsIGNvbW1hbmQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24odHlwZSwgZGF0YSwgcm9vdEV2dCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBldmVudCA9IHJvb3RFdnQgfHwge307XHJcblxyXG4gICAgICAgICAgICBldmVudC5kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgZXZlbnQudHlwZSA9IHR5cGU7XHJcblxyXG4gICAgICAgICAgICBpZihoYXNIYW5kbGVyKGV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlckFyciA9IGV2ZW50c1tldmVudC50eXBlXTtcclxuICAgICAgICAgICAgICAgIG9iamVjdC5lYWNoKGhhbmRsZXJBcnIsIGZ1bmN0aW9uKGluZGV4LCBldmVudENvbmZpZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gZXZlbnRDb25maWcuaGFuZGxlcjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZSA9IGV2ZW50Q29uZmlnLm1vZHVsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZXZlbnRDb25maWcubW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwoZXZlbnRDb25maWcubW9kdWxlLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RUZXh0ID0gKG1vZHVsZSAmJiBtb2R1bGUuY29uc3RydWN0b3IgJiYgbW9kdWxlLmNvbnN0cnVjdG9yLm5hbWUpP21vZHVsZS5jb25zdHJ1Y3Rvci5uYW1lOid1bmtub3duJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobW9kVGV4dCA9PT0gJ3Vua25vd24nICYmIGNvbmZpZy5kZWJ1ZygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFdmVudCBoYW5kbGVyIGVycm9yIC0gbW9kdWxlOiAnK21vZFRleHQrJyBldmVudDogJytldmVudC50eXBlLCBoYW5kbGVyLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXZlbnQgaGFuZGxlciBlcnJvciAtIG1vZHVsZTogJyttb2RUZXh0KycgZXZlbnQ6ICcrZXZlbnQudHlwZSwgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2Vycm9yJywgJ0FuIGVycm9yIG9jY3VyZWQgd2hpbGUgZXhlY3V0aW5nIHRoZSBsYXN0IGFjdGlvbiAhJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vV2UganVzdCByZXNvbHZlIGluIGFsbCBjYXNlcyBzaW5jZSB0aGUgY2FsbGVyIG9mIHRyaWdnZXIgc2hvdWxkIHJlbWFpbiBpbmRlcGVuZGVudCBvZiBoYW5kbGVyIG1vZHVsZXNcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbjogZnVuY3Rpb24obm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgJChub2RlKS5vbihldmVudCxzZWxlY3RvcixkYXRhLCBoYW5kbGVyKTtcclxuICAgIH0sXHJcblxyXG4gICAgb2ZmOiBmdW5jdGlvbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGhhbmRsZXIpIHtcclxuICAgICAgICAkKG5vZGUpLm9mZihldmVudCwgc2VsZWN0b3IsIGhhbmRsZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbmNlOiBmdW5jdGlvbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpIHtcclxuICAgICAgICAkKG5vZGUpLm9uZShldmVudCxzZWxlY3RvcixkYXRhLCBoYW5kbGVyKTtcclxuICAgIH0sXHJcblxyXG4gICAgdHJpZ2dlckRvbTogZnVuY3Rpb24obm9kZSwgZXZlbnQpIHtcclxuICAgICAgICQobm9kZSkudHJpZ2dlcihldmVudCk7XHJcbiAgICB9XHJcbn07IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcblxyXG52YXIgU3ViRXZlbnQgPSBmdW5jdGlvbihjb250ZXh0LCBldmVudCkge1xyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMuZXZlbnQgPSBldmVudDtcclxufVxyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLmdldFN1YlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0Kyc6Jyt0eXBlO1xyXG59XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlciwgbW9kdWxlKSB7XHJcbiAgICAvL1RPRE86IGltcGxlbWVudCBidWJibGVcclxuICAgIHRoaXMuZXZlbnQubGlzdGVuKHRoaXMuZ2V0U3ViVHlwZSh0eXBlKSwgaGFuZGxlciwgbW9kdWxlKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS51bmxpc3RlbiA9IGZ1bmN0aW9uKHR5cGUsIGZ1bmMpIHtcclxuICAgIHRoaXMuZXZlbnQudW5saXN0ZW4odGhpcy5nZXRTdWJUeXBlKHR5cGUpLCBmdW5jKTtcclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24odHlwZSwgZGF0YSwgcm9vdEV2dCwgcHJldmVudEJ1YmJsZSkge1xyXG4gICAgdGhpcy5ldmVudC50cmlnZ2VyKHRoaXMuZ2V0U3ViVHlwZSh0eXBlKSwgZGF0YSwgcm9vdEV2dCk7XHJcbiAgICBpZighcHJldmVudEJ1YmJsZSkge1xyXG4gICAgICAgIHRoaXMuZXZlbnQudHJpZ2dlcih0eXBlLCBkYXRhLCByb290RXZ0KTtcclxuICAgIH1cclxufTtcclxuXHJcblN1YkV2ZW50LnByb3RvdHlwZS5jb21tYW5kID0gZnVuY3Rpb24oY29tbWFuZCwgZXhlY3V0ZSkge1xyXG4gICAgdGhpcy5ldmVudC5jb21tYW5kKGNvbW1hbmQsIGV4ZWN1dGUpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBkYXRhLCBoYW5kbGVyKSB7XHJcbiAgICB0aGlzLmV2ZW50Lm9uKG5vZGUsIGV2ZW50LCBzZWxlY3RvciwgZGF0YSwgaGFuZGxlcik7XHJcbn07XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24obm9kZSwgZXZlbnQsIHNlbGVjdG9yLCBoYW5kbGVyKSB7XHJcbiAgICB0aGlzLmV2ZW50Lm9mZihub2RlLCBldmVudCwgc2VsZWN0b3IsIGhhbmRsZXIpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpIHtcclxuICAgIHRoaXMuZXZlbnQub25jZShub2RlLCBldmVudCwgc2VsZWN0b3IsIGRhdGEsIGhhbmRsZXIpO1xyXG59O1xyXG5cclxuU3ViRXZlbnQucHJvdG90eXBlLnRyaWdnZXJEb20gPSBmdW5jdGlvbihub2RlLCBldmVudCkge1xyXG4gICAgdGhpcy5ldmVudC50cmlnZ2VyRG9tKG5vZGUsZXZlbnQpO1xyXG59XHJcblxyXG5TdWJFdmVudC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgcmV0dXJuIG5ldyBTdWJFdmVudChjb250ZXh0LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdWJFdmVudDsiLCJ2YXIgeG1sID0gcmVxdWlyZSgnLi4vdXRpbC94bWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcblxyXG52YXIgZWxlbWVudENhY2hlID0ge307XHJcblxyXG52YXIgY3JlYXRlID0gZnVuY3Rpb24oZWxlbWVudCwgYXR0cmlidXRlcywgdGV4dCkge1xyXG4gICAgdmFyICRlbGVtZW50ID0gJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQpKTtcclxuXHJcbiAgICBpZihhdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgJC5lYWNoKGF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodGV4dCkge1xyXG4gICAgICAgICRlbGVtZW50LnRleHQodGV4dCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJGVsZW1lbnQ7XHJcbn07XHJcblxyXG52YXIgcXVlcnkgPSBmdW5jdGlvbihzZWxlY3RvciwgY2FjaGUpIHtcclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZihjYWNoZSkge1xyXG4gICAgICAgIHJlc3VsdCA9ICQucUNhY2hlKHNlbGVjdG9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gJChzZWxlY3Rvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIGdldEpRdWVyeU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICBpZighbm9kZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIFRoZSBub2RlIGlzIGVpdGhlciBhIGRvbSBub2RlIG9yIGEgc2VsZWN0b3JcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhub2RlKSkge1xyXG4gICAgICAgIHJldHVybiBxdWVyeShub2RlKTtcclxuICAgIH0gZWxzZSBpZihub2RlLmdldEF0dHJpYnV0ZSl7XHJcbiAgICAgICAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgaWYoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQucUNhY2hlKCcjJytub2RlLmdldEF0dHJpYnV0ZSgnaWQnKSwgdHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuICQobm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmKG5vZGUualF1ZXJ5KSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGUuZy4gZG9jdW1lbnQsIHdpbmRvdy4uLlxyXG4gICAgICAgIHJldHVybiAkKG5vZGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIG1vdmVEb3duID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgdmFyICRub2RlID0gZ2V0SlF1ZXJ5Tm9kZShub2RlKTtcclxuICAgICRub2RlLmJlZm9yZSgkbm9kZS5uZXh0KCkpO1xyXG59O1xyXG5cclxudmFyIG1vdmVVcCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHZhciAkbm9kZSA9IGdldEpRdWVyeU5vZGUobm9kZSk7XHJcbiAgICAkbm9kZS5hZnRlcigkbm9kZS5wcmV2KCkpO1xyXG59O1xyXG5cclxudmFyIGluc2VydEFmdGVySW5kZXggPSBmdW5jdGlvbihub2RlLCBpbmRleCkge1xyXG4gICAgdmFyICRub2RlID0gZ2V0SlF1ZXJ5Tm9kZShub2RlKTtcclxuICAgICRub2RlLnBhcmVudCgpLmNoaWxkcmVuKCkuZXEoaW5kZXgpLmFmdGVyKCRub2RlKTtcclxufTtcclxuXHJcbnZhciBpbnNlcnRTVkdBZnRlciA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZWxlbWVudCwgdGV4dCwgaW5zZXJ0QWZ0ZXIpIHtcclxuICAgIHRleHQgPSB0ZXh0IHx8IGVsZW1lbnQudGV4dDtcclxuICAgIGRlbGV0ZSBlbGVtZW50LnRleHQ7XHJcbiAgICByZXR1cm4gYWRkU1ZHRWxlbWVudChjb250YWluZXIsZWxlbWVudCx0ZXh0LGluc2VydEFmdGVyKTtcclxufTtcclxuXHJcbnZhciBwcmVwZW5kU1ZHRWxlbWVudCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZWxlbWVudCwgdGV4dCkge1xyXG4gICAgdGV4dCA9IHRleHQgfHwgZWxlbWVudC50ZXh0O1xyXG4gICAgZGVsZXRlIGVsZW1lbnQudGV4dDtcclxuICAgIHJldHVybiBhZGRTVkdFbGVtZW50KGNvbnRhaW5lcixlbGVtZW50LHRydWUsdGV4dCk7XHJcbn07XHJcblxyXG52YXIgYXBwZW5kU1ZHRWxlbWVudCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZWxlbWVudCwgdGV4dCkge1xyXG4gICAgdGV4dCA9IHRleHQgfHwgZWxlbWVudC50ZXh0O1xyXG4gICAgZGVsZXRlIGVsZW1lbnQudGV4dDtcclxuICAgIHJldHVybiBhZGRTVkdFbGVtZW50KGNvbnRhaW5lcixlbGVtZW50LGZhbHNlLHRleHQpO1xyXG59O1xyXG5cclxudmFyIHByZXBlbmRUb1Jvb3QgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBpZighZWxlbWVudC5yb290Lmhhc0NoaWxkTm9kZXMoKSkge1xyXG4gICAgICAgIGVsZW1lbnQuaW5zdGFuY2UoZWxlbWVudC5yb290LmFwcGVuZENoaWxkKGVsZW1lbnQuaW5zdGFuY2UoKSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtZW50Lmluc3RhbmNlKGVsZW1lbnQucm9vdC5pbnNlcnRCZWZvcmUoZWxlbWVudC5pbnN0YW5jZSgpLCBlbGVtZW50LnJvb3QuY2hpbGROb2Rlc1swXSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGFkZFNWR0VsZW1lbnQgPSBmdW5jdGlvbihjb250YWluZXIsIGVsZW1lbnQsIHByZXBlbmQsIHRleHQsIGluc2VydEFmdGVyKSB7XHJcbiAgICBwcmVwZW5kID0gKG9iamVjdC5pc0RlZmluZWQocHJlcGVuZCkpPyBwcmVwZW5kIDogZmFsc2U7XHJcbiAgICAvLyBJZiBvbmx5IHRoZSBjb250YWluZXIgaXMgZ2l2ZW4gd2UgYXNzdW1lIGl0cyBhbiBTVkdFbGVtZW50IG9iamVjdCB3aXRoIGNvbnRhaW5lZCByb290IG5vZGVcclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQoY29udGFpbmVyKSAmJiAhb2JqZWN0LmlzRGVmaW5lZChlbGVtZW50KSkge1xyXG4gICAgICAgIGVsZW1lbnQgPSBjb250YWluZXI7XHJcbiAgICAgICAgY29udGFpbmVyID0gY29udGFpbmVyLmdldFJvb3ROb2RlKCk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGNvbnRhaW5lcikpIHtcclxuICAgICAgICBjb250YWluZXIgPSBxdWVyeShjb250YWluZXIpWzBdO1xyXG4gICAgfSBlbHNlIGlmKGNvbnRhaW5lci5pbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5pbnN0YW5jZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBpbnN0YW5jZTtcclxuXHJcbiAgICBpZighZWxlbWVudC5pbnN0YW5jZSB8fCAhb2JqZWN0LmlzRGVmaW5lZChlbGVtZW50Lmluc3RhbmNlKCkpKSB7XHJcbiAgICAgICAgaW5zdGFuY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBlbGVtZW50LnRhZ05hbWUpO1xyXG4gICAgICAgICQuZWFjaChlbGVtZW50LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaW5zdGFuY2Uuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGluc3RhbmNlID0gZWxlbWVudC5pbnN0YW5jZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodGV4dCkpIHtcclxuICAgICAgICB2YXIgdHh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xyXG4gICAgICAgIGluc3RhbmNlLmFwcGVuZENoaWxkKHR4dE5vZGUpO1xyXG4gICAgfVxyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChpbnNlcnRBZnRlcikpIHtcclxuICAgICAgICAvL2lmIHRoZSBwYXJlbnRzIGxhc3RjaGlsZCBpcyB0aGUgdGFyZ2V0RWxlbWVudC4uLlxyXG4gICAgICAgIGlmKGNvbnRhaW5lci5sYXN0Y2hpbGQgPT0gaW5zZXJ0QWZ0ZXIpIHtcclxuICAgICAgICAgICAgLy9hZGQgdGhlIG5ld0VsZW1lbnQgYWZ0ZXIgdGhlIHRhcmdldCBlbGVtZW50LlxyXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5zdGFuY2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGVsc2UgdGhlIHRhcmdldCBoYXMgc2libGluZ3MsIGluc2VydCB0aGUgbmV3IGVsZW1lbnQgYmV0d2VlbiB0aGUgdGFyZ2V0IGFuZCBpdCdzIG5leHQgc2libGluZy5cclxuICAgICAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShpbnN0YW5jZSwgaW5zZXJ0QWZ0ZXIubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZighcHJlcGVuZCB8fCAhY29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSApIHtcclxuICAgICAgICBpbnN0YW5jZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnN0YW5jZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGluc3RhbmNlID0gY29udGFpbmVyLmluc2VydEJlZm9yZShpbnN0YW5jZSxjb250YWluZXIuY2hpbGROb2Rlc1swXSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYob2JqZWN0LmlzRnVuY3Rpb24oZWxlbWVudC5pbnN0YW5jZSkpIHtcclxuICAgICAgICBlbGVtZW50Lmluc3RhbmNlKGluc3RhbmNlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbWVudC5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVtZW50O1xyXG59O1xyXG5cclxudmFyIGltcG9ydFNWRyA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgc3ZnWE1MLCBwcmVwZW5kKSB7XHJcbiAgICB2YXIgJHN2Z1hNTCwgbmFtZSwgYXR0cmlidXRlcztcclxuXHJcbiAgICBpZihzdmdYTUwuanF1ZXJ5KSB7XHJcbiAgICAgICAgJHN2Z1hNTCA9IHN2Z1hNTDtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNTdHJpbmcoc3ZnWE1MKSkge1xyXG4gICAgICAgICRzdmdYTUwgPSAkKHBhcnNlWE1MKHN2Z1hNTC50cmltKCkpKTtcclxuICAgICAgICAkc3ZnWE1MID0gJCgkc3ZnWE1MLmdldCgwKS5kb2N1bWVudEVsZW1lbnQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAkc3ZnWE1MID0gJChzdmdYTUwpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCRzdmdYTUwubm9kZU5hbWUpIHtcclxuICAgICAgICBuYW1lID0gJHN2Z1hNTC5ub2RlTmFtZTtcclxuICAgICAgICBhdHRyaWJ1dGVzID0gZ2V0QXR0cmlidXRlcygkc3ZnWE1MKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9ICRzdmdYTUwuZ2V0KDApLnRhZ05hbWU7XHJcbiAgICAgICAgYXR0cmlidXRlcyA9IGdldEF0dHJpYnV0ZXMoJHN2Z1hNTC5nZXQoMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vV2UgY3JlYXRlIGEgZHVtbXkgZWxlbWVudCBvYmplY3RcclxuICAgIHZhciBlbGVtZW50ID0ge1xyXG4gICAgICAgIHRhZ05hbWUgOiBuYW1lLFxyXG4gICAgICAgIGF0dHJpYnV0ZXMgOiBhdHRyaWJ1dGVzLFxyXG4gICAgICAgIGluc3RhbmNlIDogZnVuY3Rpb24oaW5zdCkge1xyXG4gICAgICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGluc3QpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlRWxlbWVudCA9IGluc3Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZUVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmKCFwcmVwZW5kKSB7XHJcbiAgICAgICAgYXBwZW5kU1ZHRWxlbWVudChjb250YWluZXIsIGVsZW1lbnQsIF9nZXRDaGlsZFRleHQoJHN2Z1hNTCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwcmVwZW5kU1ZHRWxlbWVudChjb250YWluZXIsIGVsZW1lbnQsIF9nZXRDaGlsZFRleHQoJHN2Z1hNTCkpO1xyXG4gICAgfVxyXG5cclxuICAgICRzdmdYTUwuY2hpbGRyZW4oKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBjaGlsZCkge1xyXG4gICAgICAgIGltcG9ydFNWRyhlbGVtZW50Lmluc3RhbmNlKCksIGNoaWxkKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBlbGVtZW50Lmluc3RhbmNlKCk7XHJcbn07XHJcblxyXG52YXIgX2dldENoaWxkVGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmKCFub2RlLmpxdWVyeSkge1xyXG4gICAgICAgIG5vZGUgPSAkKG5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjaGlsZFRleHQgPSBub2RlLmNvbnRlbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZVR5cGUgPT09IDM7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKGNoaWxkVGV4dCkgJiYgY2hpbGRUZXh0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICByZXR1cm4gY2hpbGRUZXh0WzBdLm5vZGVWYWx1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgJChub2RlLmF0dHJpYnV0ZXMpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVzdWx0W3RoaXMubm9kZU5hbWVdID0gdGhpcy52YWx1ZTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBmaW5kSW5jbHVkZVNlbGYgPSBmdW5jdGlvbihub2RlLCBzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuICQobm9kZSkuZmluZChzZWxlY3RvcikuYW5kU2VsZigpLmZpbHRlcihzZWxlY3RvcikuZ2V0KDApO1xyXG59O1xyXG5cclxudmFyIHBhcnNlTm9kZVhNTCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmKCFub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQucGFyc2VYTUwoJChub2RlKS50ZXh0KCkpO1xyXG59O1xyXG5cclxudmFyIHBhcnNlWE1MID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4geG1sLnBhcnNlWE1MKHN0cik7XHJcbn07XHJcblxyXG52YXIgcGFyc2VOb2RlSlNPTiA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHJldHVybiAkLnBhcnNlSlNPTigkKG5vZGUpLnRleHQoKSk7XHJcbn07XHJcblxyXG52YXIgZ2V0UmF3SWQgPSBmdW5jdGlvbihpZFNlbGVjdG9yKSB7XHJcbiAgICBpZighb2JqZWN0LmlzU3RyaW5nKGlkU2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGlkU2VsZWN0b3IuY2hhckF0KDApID09PSAnIycpIHtcclxuICAgICAgICByZXR1cm4gaWRTZWxlY3Rvci5zdWJzdHJpbmcoMSwgaWRTZWxlY3Rvci5sZW5ndGgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaWRTZWxlY3RvcjtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRJZFNlbGVjdG9yID0gZnVuY3Rpb24ocmF3SWQpIHtcclxuICAgIGlmKCFvYmplY3QuaXNTdHJpbmcocmF3SWQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyYXdJZC5jaGFyQXQoMCkgIT09ICcjJykge1xyXG4gICAgICAgIHJldHVybiAnIycgKyByYXdJZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHJhd0lkO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhcHBlbmRTVkdFbGVtZW50IDogYXBwZW5kU1ZHRWxlbWVudCxcclxuICAgIHByZXBlbmRTVkdFbGVtZW50IDogcHJlcGVuZFNWR0VsZW1lbnQsXHJcbiAgICBpbnNlcnRTVkdBZnRlciA6IGluc2VydFNWR0FmdGVyLFxyXG4gICAgaW5zZXJ0QWZ0ZXJJbmRleCA6IGluc2VydEFmdGVySW5kZXgsXHJcbiAgICBjcmVhdGUgOiBjcmVhdGUsXHJcbiAgICBwcmVwZW5kVG9Sb290IDogcHJlcGVuZFRvUm9vdCxcclxuICAgIGltcG9ydFNWRyA6IGltcG9ydFNWRyxcclxuICAgIG1vdmVEb3duIDogbW92ZURvd24sXHJcbiAgICBtb3ZlVXAgOiBtb3ZlVXAsXHJcbiAgICBmaW5kSW5jbHVkZVNlbGYgOiBmaW5kSW5jbHVkZVNlbGYsXHJcbiAgICBwYXJzZU5vZGVYTUwgOiBwYXJzZU5vZGVYTUwsXHJcbiAgICBwYXJzZU5vZGVKU09OIDogcGFyc2VOb2RlSlNPTixcclxuICAgIGdldEF0dHJpYnV0ZXMgOiBnZXRBdHRyaWJ1dGVzLFxyXG4gICAgZ2V0UmF3SWQgOiBnZXRSYXdJZCxcclxuICAgIGdldElkU2VsZWN0b3I6IGdldElkU2VsZWN0b3JcclxufTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gdXRpbC5vYmplY3Q7XHJcbnZhciBkb20gPSB1dGlsLmRvbTtcclxuXHJcbnZhciBFdmVudGFibGUgPSByZXF1aXJlKCcuL2V2ZW50YWJsZU5vZGUnKTtcclxuXHJcbnZhciBFbGVtZW50ID0gZnVuY3Rpb24odGFnTmFtZSwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlU2V0dGVyID0gYXR0cmlidXRlU2V0dGVyIHx8IHt9O1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XHJcblxyXG4gICAgaWYob2JqZWN0LmlzT2JqZWN0KHRhZ05hbWUpKSB7XHJcbiAgICAgICAgY2ZnID0gdGFnTmFtZTtcclxuICAgICAgICB0YWdOYW1lID0gY2ZnLnRhZ05hbWU7XHJcbiAgICAgICAgZGVsZXRlIGNmZy50YWdOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWU7XHJcblxyXG4gICAgaWYob2JqZWN0LmlzT2JqZWN0KGNmZykpIHtcclxuICAgICAgICBpZihjZmcuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNmZy5jaGlsZHJlbjtcclxuICAgICAgICAgICAgZGVsZXRlIGNmZy5jaGlsZHJlbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2luZ2xlID0gY2ZnLnNpbmdsZSB8fCBmYWxzZTtcclxuICAgICAgICBkZWxldGUgY2ZnLnNpbmdsZTtcclxuXHJcbiAgICAgICAgLy9XZSBhc3N1bWUgYWxsIHJlbWFpbmluZyBjZmcgZW50cmllcyBhcmUgYXR0cmlidXRlc1xyXG4gICAgICAgIGZvcih2YXIgYXR0cmlidXRlS2V5IGluIGNmZykge1xyXG4gICAgICAgICAgICBpZihjZmcuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlS2V5KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGF0dHJpYnV0ZUtleSwgY2ZnW2F0dHJpYnV0ZUtleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vU2VlIGV2ZW50YWJsZVxyXG4gICAgdGhpcy5ldmVudEJhc2UgPSB0aGlzO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhFbGVtZW50LCBFdmVudGFibGUpO1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuaW5zdGFuY2UgPSBmdW5jdGlvbihpbnN0YW5jZSkge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZChpbnN0YW5jZSkpIHtcclxuICAgICAgICB0aGlzLmRvbUluc3RhbmNlID0gaW5zdGFuY2U7XHJcbiAgICAgICAgdGhpcy50YWdOYW1lID0gaW5zdGFuY2UudGFnTmFtZTtcclxuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKGluc3RhbmNlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tSW5zdGFuY2U7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogTG9hZHMgYWxsIGF0dHJpYnV0ZXMgZnJvbSB0aGUgZG9tIGluc3RhbmNlIGludG8gb3VyIGF0dHJpYnV0ZSBhcnJheSBleGNlcHQgYWxyZWFkeSBleGlzdGluZyBhdHRyaWJ1dGVzLlxyXG4gKiBAcGFyYW0gaW5zdGFuY2VcclxuICovXHJcbkVsZW1lbnQucHJvdG90eXBlLmxvYWRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oaW5zdGFuY2UpIHtcclxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlcyB8fCB7fTtcclxuICAgIHZhciBhdHRyaWJ1dGVzID0gZG9tLmdldEF0dHJpYnV0ZXMoaW5zdGFuY2UpO1xyXG4gICAgZm9yKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xyXG4gICAgICAgIGlmKGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAhdGhpcy5hdHRyaWJ1dGVzW2tleV0pIHtcclxuICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGVtZW50LnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKG5ld0lkKSB7XHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcobmV3SWQpKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKCdpZCcsbmV3SWQpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyKCdpZCcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBmb3IoYXR0cmlidXRlS2V5IGluIHRoaXMuYXR0cmlidXRlU2V0dGVyKSB7XHJcbiAgICAgICAgaWYodGhpcy5hdHRyaWJ1dGVTZXR0ZXIuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlS2V5KSkge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZShhdHRyaWJ1dGVLZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLnVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdGhpcy5fc2V0QXR0cmlidXRlKGtleSwgdGhpcy5hdHRyaWJ1dGVzW2tleV0pO1xyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuX3NldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIHByZXZEb21TZXQpIHtcclxuICAgIC8vIElmIGZpcnN0IGFyZyBpcyBvYmplY3QgaGFuZGxlIGl0cyBwcm9wZXJ0aWVzIGFzIGF0dHJpYnV0ZXNcclxuICAgIGlmKG9iamVjdC5pc09iamVjdChrZXkpKSB7XHJcbiAgICAgICAgZm9yKHZhciBhdHRyaWJ1dGUgaW4ga2V5KSB7XHJcbiAgICAgICAgICAgIGlmKG9iamVjdC5pc0RlZmluZWQoYXR0cmlidXRlKSAmJiBrZXkuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwga2V5W2F0dHJpYnV0ZV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gU29tZSBlbGVtZW50dHlwZXMgY2FuIHRyYW5zZm9ybSBzcGVjaWZpYyB0eXBlcyBvZiBhdHRyaWJ1dGVzIHRvIHNwZWNpYWwgb2JqZWN0c1xyXG4gICAgICAgIC8vIHdoaWNoIGFyZSBhYmxlIHRvIHJlbmRlciBhbmQgc2V0IHRoZSB2YWx1ZXMgaW4gYSBzcGVjaWFsIHdheS5cclxuICAgICAgICBpZighdGhpcy5oYXNDbGFzcygnbm9QYXJzZScpICYmIG9iamVjdC5pc1N0cmluZyh2YWx1ZSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZVNldHRlcltrZXldKSkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuYXR0cmlidXRlU2V0dGVyW2tleV0odmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBKdXN0IHRyYW5zZm9ybSBzdHJpbmdsaXRzIHZhbHVlcyB0byBhcnJheXMgaW4gY2FzZSBpdHMgYSBzdHJpbmcgbGlzdFxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1trZXldID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIERpcmVjdGx5IHNldCBpdCB0byB0aGUgU1ZHIGluc3RhbmNlIGlmIGFscmVhZHkgcmVuZGVyZWRcclxuICAgICAgICBpZih0aGlzLmRvbUluc3RhbmNlICYmICFwcmV2RG9tU2V0KSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBFbGVtZW50LmdldEF0dHJpYnV0ZVN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9tSW5zdGFuY2Uuc2V0QXR0cmlidXRlKGtleSx2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24oc2VhcmNoQ2xhc3MpIHtcclxuICAgIGlmKHRoaXMuZG9tSW5zdGFuY2UpIHtcclxuICAgICAgICAvL0pxdWVyeSBoYXNjbGFzcyBkb2VzIG5vdCB3b3JrIHdpdGggc3ZnIGVsZW1lbnRzXHJcbiAgICAgICAgdmFyIGVsZW1lbnRDbGFzcyA9ICcgJysgdGhpcy5hdHRyKCdjbGFzcycpKycgJztcclxuICAgICAgICByZXR1cm4gZWxlbWVudENsYXNzLmluZGV4T2YoJyAnK3NlYXJjaENsYXNzKycgJykgPiAtMTtcclxuICAgIH1cclxufTtcclxuXHJcbkVsZW1lbnQucHJvdG90eXBlLiQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgaWYoIXRoaXMuJGRvbUluc3RhbmNlICYmIHRoaXMuZG9tSW5zdGFuY2UpIHtcclxuICAgICAgICB0aGlzLiRkb21JbnN0YW5jZSA9ICQodGhpcy5kb21JbnN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChzZWxlY3RvcikgPyB0aGlzLiRkb21JbnN0YW5jZS5maW5kKHNlbGVjdG9yKSA6IHRoaXMuJGRvbUluc3RhbmNlO1xyXG59O1xyXG5cclxuRWxlbWVudC5nZXRBdHRyaWJ1dGVTdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIGlmKCFvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuXHJcbiAgICBpZihvYmplY3QuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBvYmplY3QuZWFjaCh2YWx1ZSwgZnVuY3Rpb24oaW5kZXgsIHBhcnQpIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9ICgrK2luZGV4ID09PSB2YWx1ZS5sZW5ndGgpID8gcGFydCA6IHBhcnQrJyAnO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbkVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWVGcm9tU3RyaW5nTGlzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcodmFsdWUpICYmIHZhbHVlLmluZGV4T2YoJyAnKSA+IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlLnNwbGl0KC9bXFxzXSsvKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuYXR0ck51bWJlciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHZhciB2YWwgPSB1dGlsLmFwcC5wYXJzZU51bWJlclN0cmluZyh0aGlzLmF0dHIoa2V5LCB2YWx1ZSkpO1xyXG4gICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkgPyB0aGlzIDogdmFsO1xyXG59O1xyXG5cclxuRWxlbWVudC5wcm90b3R5cGUuYXR0ciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgb2JqZWN0LmlzRGVmaW5lZChhcmd1bWVudHNbMV0pKSB7XHJcbiAgICAgICAgLy9UT0RPOiBpbXBsZW1lbnQgZm9yIG1vciB0aGFudCAyXHJcbiAgICAgICAgdmFyIG9iaiA9IHt9O1xyXG4gICAgICAgIG9ialthcmd1bWVudHNbMF1dID0gYXJndW1lbnRzWzFdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIob2JqKTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNTdHJpbmcoYXR0cmlidXRlKSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXTtcclxuICAgICAgICBpZighcmVzdWx0ICYmIHRoaXMuaW5zdGFuY2UoKSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA9ICB0aGlzLiQoKS5hdHRyKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICBFbGVtZW50O1xyXG4iLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvcmUvY29uZmlnJyk7XHJcblxyXG52YXIgRXZlbnRhYmxlID0gZnVuY3Rpb24oZXZlbnRCYXNlKSB7XHJcbiAgICB0aGlzLmV2ZW50QmFzZSA9IGV2ZW50QmFzZTtcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIHByZXZEb21FdmVudCkge1xyXG4gICAgYXJncyA9IGFyZ3MgfHwgdGhpcztcclxuICAgIHRoaXMuZXhlY3V0ZUFkZGl0aW9uKGZ1bmMsIGFyZ3MpO1xyXG4gICAgaWYodGhpcy5leGVjdXRlVGVtcGxhdGVIb29rKSB7XHJcbiAgICAgICAgdGhpcy5leGVjdXRlVGVtcGxhdGVIb29rKGZ1bmMsIGFyZ3MpO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5ldmVudEJhc2UgJiYgIXByZXZEb21FdmVudCkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihmdW5jLCBhcmdzKTtcclxuICAgIH1cclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUuZXhlY3V0ZUFkZGl0aW9uID0gZnVuY3Rpb24oZnVuYywgYXJncykge1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy5hZGRpdGlvbnMsIGZ1bmN0aW9uKGtleSwgYWRkaXRpb24pIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKGFkZGl0aW9uKSAmJiBvYmplY3QuaXNGdW5jdGlvbihhZGRpdGlvbltmdW5jXSkpIHtcclxuICAgICAgICAgICAgYWRkaXRpb25bZnVuY10uYXBwbHkoYWRkaXRpb24sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS5vbmUgPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vbmUoZXZ0LCB0aGlzLndyYXAoZXZ0LCBoYW5kbGVyKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkV2ZW50YWJsZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldnQsIGhhbmRsZXIpIHtcclxuICAgIGlmKCF0aGlzLmV2ZW50QmFzZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRCYXNlLiQoKS5vbihldnQsIHRoaXMud3JhcChldnQsIGhhbmRsZXIpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBoYW5kbGVyKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYodGhhdC5pc0V4ZWN1dGlvbkFsbG93ZWQoZXZlbnRUeXBlKSkge1xyXG4gICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLmlzRXhlY3V0aW9uQWxsb3dlZCA9IGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xyXG4gICAgaWYoY29uZmlnLmlzKCdldmVudHNfcmVzdHJpY3RlZCcsIGZhbHNlKSAmJiAhdGhpcy5leGNsdWRlRXZlbnRSZXN0cmljdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRXZlbnRhYmxlLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oZXZ0LCBhcmdzKSB7XHJcbiAgICBpZighdGhpcy5ldmVudEJhc2UpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50QmFzZS4kKCkudHJpZ2dlcihldnQsIGFyZ3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5FdmVudGFibGUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2dCwgaGFuZGxlcikge1xyXG4gICAgaWYoIXRoaXMuZXZlbnRCYXNlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudEJhc2UuJCgpLm9mZihldnQsIGhhbmRsZXIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFdmVudGFibGU7IiwidmFyIERvbUVsZW1lbnQgPSByZXF1aXJlKCcuLi9kb20vZG9tRWxlbWVudCcpO1xyXG52YXIgU3R5bGUgPSByZXF1aXJlKCcuL3N0eWxlJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBkb20gPSB1dGlsLmRvbTtcclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG5cclxuLypcclxuICogQ29uc3RydWN0b3IgZm9yIFNWRyBFbGVtZW50c1xyXG4gKlxyXG4gKiBAcGFyYW0ge3R5cGV9IG5hbWUgdGhlIGVsZW1lbnQgTmFtZSBlLmcuIHJlY3QsIGNpcmNsZSwgcGF0aC4uLlxyXG4gKiBAcGFyYW0ge3R5cGV9IGNmZyBhdHRyaWJ1dGVzIGFuZCBhZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb25zXHJcbiAqIEBwYXJhbSB7dHlwZX0gYXR0cmlidXRlU2V0dGVyIHlvdSBjYW4gYWRkIGFkZGl0aW9uYWwgYXR0cmlidXRlIHNldHRlclxyXG4gKiBmb3Igc3BlY2lhbCBhdHRyaWJ1dGVzIGRlZmF1bHQgYXR0cmlidXRlIHNldHRlciBnaXZlbiBieSB0aGlzIGltcGVsZW1lbnRhdGlvblxyXG4gKiBhcmUgdHJhbnNmb3JtIGFuZCBzdHlsZSBzZXR0ZXJcclxuICovXHJcbnZhciBTVkdFbGVtZW50ID0gZnVuY3Rpb24obmFtZSwgc3ZnLCBjZmcsIGF0dHJpYnV0ZVNldHRlcikge1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIgPSBhdHRyaWJ1dGVTZXR0ZXIgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlci5zdHlsZSA9IHRoaXMuc3R5bGVBdHRyaWJ1dGVTZXR0ZXI7XHJcbiAgICB0aGlzLlNWR0VsZW1lbnQgPSB0cnVlO1xyXG5cclxuICAgIC8vIElmIGZpcnN0IGF0dHJpYnV0ZSBpcyBub3QgYSBzdHJpbmcgd2UgYXNzdW1lIGEgc3ZnIG5vZGUgY29uc3RydWN0b3IgY2FsbC5cclxuICAgIGlmKCFvYmplY3QuaXNTdHJpbmcobmFtZSkpIHtcclxuICAgICAgICB0aGlzLmluc3RhbmNlKG5hbWUpO1xyXG4gICAgICAgIGNmZyA9IGRvbS5nZXRBdHRyaWJ1dGVzKG5hbWUpO1xyXG4gICAgICAgIG5hbWUgPSBuYW1lLnRhZ05hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdmcgPSBzdmc7XHJcbiAgICB0aGlzLnJvb3QgPSBzdmcucm9vdCB8fCB0aGlzO1xyXG4gICAgRG9tRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUsIGNmZywgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdFbGVtZW50LCBEb21FbGVtZW50KTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnN0eWxlQXR0cmlidXRlU2V0dGVyID0gZnVuY3Rpb24odHJuYXNmb3JtYXRpb25TdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgU3R5bGUodHJuYXNmb3JtYXRpb25TdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZ2V0Um9vdE5vZGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnJvb3QuaW5zdGFuY2UoKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmdldFNWR1Jvb3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnJvb3Q7XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgb2JqZWN0LmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRoYXQuYXBwZW5kKHZhbCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9IGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJlc3VsdCA9ICB1dGlsLmRvbS5hcHBlbmRTVkdFbGVtZW50KHRoaXMuaW5zdGFuY2UoKSwgZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUucHJlcGVuZCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBvYmplY3QuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKGluZGV4LCB2YWwpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godGhhdC5wcmVwZW5kKHZhbCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9IGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJlc3VsdCA9ICB1dGlsLmRvbS5wcmVwZW5kU1ZHRWxlbWVudCh0aGlzLmluc3RhbmNlKCksIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLiQoKS5yZW1vdmUoKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuc3ZnLmdldCh0aGlzLiQoKS5maW5kKHNlbGVjdG9yKSk7XHJcbiAgICByZXR1cm4gdXRpbC5vYmplY3QuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0IDogW3Jlc3VsdF07XHJcbn07XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS5maXJzdENoaWxkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5xQ2FjaGUoKS5zdmcodGhpcy4kKCkuY2hpbGRyZW4oKS5maXJzdCgpKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmRvd24gPSBmdW5jdGlvbigpIHtcclxuICAgIGRvbS5tb3ZlRG93bih0aGlzLmluc3RhbmNlKCkpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUudXAgPSBmdW5jdGlvbigpIHtcclxuICAgIGRvbS5tb3ZlVXAodGhpcy5pbnN0YW5jZSgpKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmJhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgIGRvbS5wcmVwZW5kVG9Sb290KHRoaXMpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU1ZHIFN0eWxlc1xyXG4gKi9cclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpICYmIG9iamVjdC5pc1N0cmluZyhrZXkpICYmIGtleS5pbmRleE9mKCc6JykgPD0gMFxyXG4gICAgICAgICYmIG9iamVjdC5pc0RlZmluZWQodGhpcy5hdHRyaWJ1dGVzLnN0eWxlKSkge1xyXG4gICAgICAgIC8vR0VUVEVSIENBTExcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnN0eWxlLmdldChrZXkpO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy5zdHlsZSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3R5bGUgPSBuZXcgU3R5bGUoa2V5LCB2YWx1ZSk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3R5bGUuc2V0KGtleSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZGFsYSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2RhbGE6JytrZXksIHZhbHVlKTtcclxufTtcclxuXHJcblNWR0VsZW1lbnQucHJvdG90eXBlLmdldEJCb3ggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlKCkuZ2V0QkJveCgpO1xyXG59O1xyXG5cclxuU1ZHRWxlbWVudC5wcm90b3R5cGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZSgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG59XHJcblxyXG5TVkdFbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHV0aWwueG1sLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuaW5zdGFuY2UoKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR0VsZW1lbnQ7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHRWxsaXBzZSA9IHJlcXVpcmUoJy4vZWxsaXBzZScpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHQ2lyY2xlID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdjaXJjbGUnLCBzdmdSb290LCBjZmcpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdDaXJjbGUsIFNWR0VsbGlwc2UpO1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHZhciBzY2FsZSA9IChub1NjYWxlKSA/IDEgOiB0aGlzLnNjYWxlKClbMV07XHJcbiAgICBpZigoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdyJykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyJykgKyAodGhpcy5zdHJva2VXaWR0aCgpIC8gMikpICogc2NhbGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0ck51bWJlcigncicsIHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdiA9IHZhbHVlIC8gMjtcclxuICAgIHRoaXMuY3kodikuY3godikucih2KTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmhlaWdodCh2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdDaXJjbGUucHJvdG90eXBlLnJ4ID0gZnVuY3Rpb24odmFsdWUsIG5vU2NhbGUpIHtcclxuICAgIHJldHVybiB0aGlzLnIodmFsdWUsIG5vU2NhbGUpO1xyXG59O1xyXG5cclxuU1ZHQ2lyY2xlLnByb3RvdHlwZS5yeSA9IGZ1bmN0aW9uKHZhbHVlLCBub1NjYWxlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yKHZhbHVlLCBub1NjYWxlKTtcclxufTtcclxuXHJcblNWR0NpcmNsZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkNpcmNsZSh0aGlzLmdldENlbnRlcigpLCB0aGlzLnIoKSkub3ZlcmxheXMocG9zaXRpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdDaXJjbGU7IiwidmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgZXZlbnQgPSByZXF1aXJlKCcuLi9jb3JlL2V2ZW50Jyk7XHJcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb3JlL2NvbmZpZycpO1xyXG5cclxudmFyIG9iamVjdCA9IHV0aWwub2JqZWN0O1xyXG52YXIgZG9tID0gdXRpbC5kb207XHJcblxyXG52YXIgU2hpZnREcmFnID0gZnVuY3Rpb24oY2ZnKSB7XHJcbiAgICB0aGlzLmNmZyA9IGNmZztcclxuICAgIGlmKCFjZmcucmVzdHJpY3Rpb25YICYmICFjZmcucmVzdHJpY3Rpb25ZKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgdGhpcy54U2hpZnQgPSB7XHJcbiAgICAgICAgc2hpZnRBbGlnbiA6IDAsXHJcbiAgICAgICAgdW5zaGlmdEFsaWduIDogMFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnlTaGlmdCA9IHtcclxuICAgICAgICBzaGlmdEFsaWduIDogMCxcclxuICAgICAgICB1bnNoaWZ0QWxpZ24gOiAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU2hpZnREcmFnLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gJ2Rpc2FibGVkJztcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHN3aXRjaCh0aGlzLnN0YXRlKSB7XHJcbiAgICAgICAgY2FzZSAnaW5pdCcgOlxyXG4gICAgICAgICAgICB0aGlzLnhTaGlmdC5zaGlmdEFsaWduICs9IGR4O1xyXG4gICAgICAgICAgICB0aGlzLnlTaGlmdC5zaGlmdEFsaWduICs9IGR5O1xyXG5cclxuICAgICAgICAgICAgaWYodGhpcy5jaGVja1NoaWZ0SG9vayhldnQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZihNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IE1hdGguYWJzKHRoaXMueVNoaWZ0LnNoaWZ0QWxpZ24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSBmdW5jdGlvbihldnQsIGR4ICxkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5zaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ3NoaWZ0ZWRYJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdGlvblggPSBmdW5jdGlvbihldnQsIGR4ICwgZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuc2hpZnRSZXN0cmljdGlvbih0aGF0LnhTaGlmdCwgZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdzaGlmdGVkWSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2hpZnRlZFgnOlxyXG4gICAgICAgICAgICBpZighZXZ0LnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0aW9uWSA9IGZ1bmN0aW9uKGV2dCwgZHgsIGR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQudW5TaGlmdFJlc3RyaWN0aW9uKHRoYXQueVNoaWZ0LCBkeSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9ICdpbml0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzaGlmdGVkWSc6XHJcbiAgICAgICAgICAgIGlmKCFldnQuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdHJpY3Rpb25YID0gZnVuY3Rpb24oZXZ0LCBkeCAsZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC51blNoaWZ0UmVzdHJpY3Rpb24odGhhdC54U2hpZnQsIGR4KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gJ2luaXQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuc2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9VcGRhdGUgc2hpZnRlZCBkXHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduICs9IGQ7XHJcbiAgICAvL0FsaWduIHNoaWZ0IGRyYWcgYmFjayB0byB0aGUgc3RhcnQgcG9zaXRpb25cclxuICAgIHZhciByZXN1bHQgPSAoTWF0aC5hYnMoc2hpZnREYXRhLnNoaWZ0QWxpZ24pID4gMCkgPyBzaGlmdERhdGEuc2hpZnRBbGlnbiAqIC0xIDogMDtcclxuICAgIHNoaWZ0RGF0YS5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLnVuU2hpZnRSZXN0cmljdGlvbiA9IGZ1bmN0aW9uKHNoaWZ0RGF0YSwgZCkge1xyXG4gICAgLy9BbGlnbiBzaGlmdCBkcmFnIGJhY2sgdG8gdGhlIHN0YXJ0IHBvc2l0aW9uXHJcbiAgICB2YXIgcmVzdWx0ID0gc2hpZnREYXRhLnVuc2hpZnRBbGlnbiArIGQ7XHJcbiAgICBzaGlmdERhdGEudW5zaGlmdEFsaWduID0gMDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmNoZWNrU2hpZnRIb29rID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICByZXR1cm4gZXZ0LnNoaWZ0S2V5ICYmIChNYXRoLmFicyh0aGlzLnhTaGlmdC5zaGlmdEFsaWduKSA+IDQgfHwgTWF0aC5hYnModGhpcy55U2hpZnQuc2hpZnRBbGlnbikgPiA0KTtcclxufTtcclxuXHJcbi8vVE9ETzogdGhpcyB3b3VsZCBiZSBtb3JlIGVsZWdhbnQgdG8gdXNlIHRoZSBhbGlnbm1lbnQgYWxpZ24gY2VudGVyIHRvIGNlbnRlci54IGlmIGNoZWNrU2hpZnRIb29rXHJcblxyXG5TaGlmdERyYWcucHJvdG90eXBlLmdldFJlc3RyaWN0aW9uWCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY2ZnLnJlc3RyaWN0aW9uWCB8fCB0aGlzLnJlc3RyaWN0aW9uWDtcclxufTtcclxuXHJcblNoaWZ0RHJhZy5wcm90b3R5cGUuZ2V0UmVzdHJpY3Rpb25ZID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jZmcucmVzdHJpY3Rpb25ZIHx8IHRoaXMucmVzdHJpY3Rpb25ZO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmRyYWdnYWJsZSA9IGZ1bmN0aW9uKGNmZywgZHJhZ0VsZW1lbnQpIHtcclxuICAgIHZhciBjZmcgPSBjZmcgfHwge307XHJcblxyXG5cclxuXHJcbiAgICBpZihkcmFnRWxlbWVudCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50ID0gdGhpcy5zdmcuZ2V0KGRyYWdFbGVtZW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZHJhZ0VsZW1lbnQgPSB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICB2YXIgZHJhZ01vdmUgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBpZihldnQucHJldmVudERlZmF1bHQpIHtcclxuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB0aGF0LmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhY3R1YWxkeCA9IChvYmplY3QuaXNEZWZpbmVkKGV2dC5keCkpID8gZXZ0LmR4IDogZXZ0LmNsaWVudFggLSB0aGF0LmRyYWdDdXJyZW50WDtcclxuICAgICAgICB2YXIgYWN0dWFsZHkgPSAob2JqZWN0LmlzRGVmaW5lZChldnQuZHkpKSA/IGV2dC5keSA6IGV2dC5jbGllbnRZIC0gdGhhdC5kcmFnQ3VycmVudFk7XHJcblxyXG4gICAgICAgIC8vIERSQUcgQkVGT1JFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ0JlZm9yZU1vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdCZWZvcmVNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGFjdHVhbGR4LCBhY3R1YWxkeV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRFJBRyBBTElHTk1FTlRcclxuICAgICAgICBpZihjZmcuZHJhZ0FsaWdubWVudCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgYWxpZ25tZW50ID0gY2ZnLmRyYWdBbGlnbm1lbnQuY2hlY2soYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgYWN0dWFsZHggPSBhbGlnbm1lbnQuZHg7XHJcbiAgICAgICAgICAgIGFjdHVhbGR5ID0gYWxpZ25tZW50LmR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9DaGVjayBmb3Igc2hpZnREcmFnIHJlc3RyaWN0aW9uLCBzaGlmdERyYWcgd2lsbCBvbmx5IGhvb2sgdXAgaWYgbm8gb3RoZXIgcmVzdHJpY3Rpb24gaXMgc2V0LlxyXG4gICAgICAgIC8vU2hpZnRkcmFnIGlzIG5vdCBnaXZlbiBmb3IgdHJpZ2dlcmRyYWdzXHJcbiAgICAgICAgaWYodGhhdC5zaGlmdERyYWcgJiYgIWV2dC50cmlnZ2VyRXZlbnQpIHtcclxuICAgICAgICAgICAgdGhhdC5zaGlmdERyYWcudXBkYXRlKGV2dCwgYWN0dWFsZHgsIGFjdHVhbGR5KTtcclxuICAgICAgICAgICAgdmFyIHJlc3RyaWN0aW9uWCA9IHRoYXQuc2hpZnREcmFnLmdldFJlc3RyaWN0aW9uWCgpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdHJpY3Rpb25ZID0gdGhhdC5zaGlmdERyYWcuZ2V0UmVzdHJpY3Rpb25ZKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIFJFU1RSSUNUSU9OXHJcbiAgICAgICAgdmFyIGR4ID0gKHJlc3RyaWN0aW9uWCAmJiAhZXZ0LnRyaWdnZXJFdmVudCkgPyByZXN0cmljdGlvblguYXBwbHkodGhhdCwgW2V2dCwgYWN0dWFsZHgsIGFjdHVhbGR5XSkgOiBhY3R1YWxkeDtcclxuICAgICAgICB2YXIgZHkgPSAocmVzdHJpY3Rpb25ZICYmICFldnQudHJpZ2dlckV2ZW50KSA/IHJlc3RyaWN0aW9uWS5hcHBseSh0aGF0LCBbZXZ0LCBhY3R1YWxkeCwgYWN0dWFsZHldKSA6IGFjdHVhbGR5O1xyXG5cclxuICAgICAgICAvL1RPRE86IHNvbWVob3cgdGhlIHNjYWxlIHNob3VsZCBiZSBkZXRlcm1pbmVkIGluIGEgbW9yZSBlbGVnYW50IHdheSBwZXJoYXBzIHN0b3JlIGl0IGluIHN2ZyBpbnN0YW5jZS4uLlxyXG4gICAgICAgIGlmKGNmZy5nZXRTY2FsZSAmJiAhZXZ0LnRyaWdnZXJFdmVudCkge1xyXG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBjZmcuZ2V0U2NhbGUoKTtcclxuICAgICAgICAgICAgZHggLz0gc2NhbGU7XHJcbiAgICAgICAgICAgIGR5IC89IHNjYWxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRVhFQ1VURSBEUkFHXHJcbiAgICAgICAgaWYoZHggIT09IDAgfHwgZHkgIT09IDApIHtcclxuICAgICAgICAgICAgdGhhdC5tb3ZlKGR4LCBkeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBjdXJyZW50IG1vdXNlIHBvc2l0aW9uXHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFggPSBldnREYXRhLmNsaWVudFg7XHJcbiAgICAgICAgdGhhdC5kcmFnQ3VycmVudFkgPSBldnREYXRhLmNsaWVudFk7XHJcblxyXG4gICAgICAgIHRoYXQuZHhTdW0gKz0gZHg7XHJcbiAgICAgICAgdGhhdC5keVN1bSArPSBkeTtcclxuXHJcbiAgICAgICAgLy8gRFJBRyBNT1ZFIEhPT0tcclxuICAgICAgICBpZihjZmcuZHJhZ01vdmUpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdNb3ZlLmFwcGx5KHRoYXQsIFtldnQsIGR4LCBkeV0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRyYWdFbmQgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL1R1cm4gb2ZmIGRyYWcgZXZlbnRzXHJcbiAgICAgICAgdGhhdC5nZXRTVkdSb290KCkub2ZmKCdtb3VzZW1vdmUnKTtcclxuICAgICAgICBldmVudC5vZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcblxyXG4gICAgICAgIGlmKGNmZy5kcmFnQWxpZ25tZW50KSB7XHJcbiAgICAgICAgICAgIGNmZy5kcmFnQWxpZ25tZW50LnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRyYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAkKCdib2R5JykuY3NzKCdjdXJzb3InLCdkZWZhdWx0Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEUkFHIEVORCBIT09LXHJcbiAgICAgICAgaWYoY2ZnLmRyYWdFbmQpIHtcclxuICAgICAgICAgICAgY2ZnLmRyYWdFbmQuYXBwbHkodGhhdCwgW2V2dF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhhdC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdhbGwnKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYoZHJhZ0VsZW1lbnQpIHtcclxuICAgICAgICB2YXIgbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgaWYoZS5jdHJsS2V5IHx8ICF0aGF0LmlzVmlzaWJsZSgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAvLyBXZSBzdG9wIHRoZSBldmVudCBwcm9wYWdhdGlvbiB0byBwcmV2ZW50IHRoZSBkb2N1bWVudCBtb3VzZWRvd24gaGFuZGxlciB0byBmaXJlXHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBpbml0RHJhZ1ZhbHVlcyh0aGF0LCBlLCBjZmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gRFJBRyBTVEFSVCBIT09LXHJcbiAgICAgICAgICAgIGlmKGNmZy5kcmFnU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIGNmZy5kcmFnU3RhcnQuYXBwbHkodGhhdCwgW2VdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoY2ZnLmN1cnNvcikge1xyXG4gICAgICAgICAgICAgICAgJCgnYm9keScpLmNzcygnY3Vyc29yJywgY2ZnLmN1cnNvcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGV2ZW50Lm9uKHRoYXQuZ2V0Um9vdE5vZGUoKSwgJ21vdXNlbW92ZScsIGRyYWdNb3ZlKTtcclxuICAgICAgICAgICAgZXZlbnQub24oZG9jdW1lbnQsICdtb3VzZXVwJywgZHJhZ0VuZCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYoY2ZnLm9uY2UpIHtcclxuICAgICAgICAgICAgZHJhZ0VsZW1lbnQub24oJ21vdXNlZG93bicsIG1vdXNlRG93bkhhbmRsZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRyYWdFbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBtb3VzZURvd25IYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9TaW11bGF0ZXMgYW4gZHJhZyBzdGFydCBldmVudFxyXG4gICAgdGhpcy5pbml0RHJhZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRyYWdFbGVtZW50LnRyaWdnZXIoJ21vdXNlZG93bicpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL0ZvciBtYW51YWwgZHJhZ2dpbmcgYSBzdmcgZWxlbWVudCB0aGUgdHJpZ2dlckV2ZW50IGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBldmVudCB3YXMgdHJpZ2dlcmVkIG1hbnVhbGx5XHJcbiAgICAvL1NlZSBTZWxlY3Rpb25tYW5hZ2VyIHNldE5vZGVTZWxlY3Rpb24gZHJhZ01vdmUgaGFuZGxlclxyXG4gICAgdGhpcy50cmlnZ2VyRHJhZyA9IGZ1bmN0aW9uKGR4LCBkeSkge1xyXG4gICAgICAgIGRyYWdNb3ZlLmFwcGx5KHRoaXMsW3tkeDpkeCwgZHk6ZHksIHRyaWdnZXJFdmVudDp0cnVlfV0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbnZhciBpbml0RHJhZ1ZhbHVlcyA9IGZ1bmN0aW9uKHRoYXQsIGV2dCwgY2ZnKSB7XHJcbiAgICB0aGF0LmR4U3VtID0gMDtcclxuICAgIHRoYXQuZHlTdW0gPSAwO1xyXG4gICAgdGhhdC5zaGlmdERyYWcgPSBuZXcgU2hpZnREcmFnKGNmZyk7XHJcbiAgICB2YXIgZXZ0RGF0YSA9IGdldE1vdXNlRXZlbnREYXRhKGV2dCk7XHJcbiAgICB0aGF0LmRyYWdDdXJyZW50WCA9IGV2dERhdGEuY2xpZW50WDtcclxuICAgIHRoYXQuZHJhZ0N1cnJlbnRZID0gZXZ0RGF0YS5jbGllbnRZO1xyXG5cclxuICAgIHRoYXQuZHJhZyA9IHRydWU7XHJcbn07XHJcblxyXG52YXIgZ2V0TW91c2VFdmVudERhdGEgPSBmdW5jdGlvbihldnQpIHtcclxuICAgIGlmKCFldnQuY2xpZW50WCkge1xyXG4gICAgICAgIHJldHVybiBldmVudC5tb3VzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGV2dDtcclxufTsiLCJ2YXIgc2hhcGVzID0ge31cclxuc2hhcGVzLnN2ZyA9IHNoYXBlcy5TdmcgPSByZXF1aXJlKCcuL3N2Z1Jvb3QnKTtcclxuc2hhcGVzLmNpcmNsZSA9IHNoYXBlcy5DaXJjbGUgPSByZXF1aXJlKCcuL2NpcmNsZScpO1xyXG5zaGFwZXMuZWxsaXBzZSA9IHNoYXBlcy5FbGxpcHNlID0gcmVxdWlyZSgnLi9lbGxpcHNlJyk7XHJcbnNoYXBlcy50ZXh0ID0gc2hhcGVzLlRleHQgPSByZXF1aXJlKCcuL3RleHQnKTtcclxuc2hhcGVzLnRzcGFuID0gc2hhcGVzLlRTcGFuID0gcmVxdWlyZSgnLi90c3BhbicpO1xyXG5zaGFwZXMucGF0aCA9IHNoYXBlcy5QYXRoID0gcmVxdWlyZSgnLi9wYXRoJyk7XHJcbnNoYXBlcy5yZWN0ID0gc2hhcGVzLlJlY3QgPSByZXF1aXJlKCcuL3JlY3QnKTtcclxuc2hhcGVzLmcgPSBzaGFwZXMuR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gc2hhcGVzOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcblxyXG52YXIgU1ZHRWxsaXBzZSA9IGZ1bmN0aW9uKHN2Z1Jvb3QsIGNmZykge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAnZWxsaXBzZScsIHN2Z1Jvb3QsIGNmZyk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR0VsbGlwc2UsIFNWR1NoYXBlKTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLnggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN4KCkgLSB0aGlzLnJ4KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yeShmYWxzZSwgdHJ1ZSkgKiAyO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAvL1doZW4gc2V0dGluZyB0aGUgaGVpZ2h0IG9mIGFuIGVsbGlwc2Ugd2UgbW92ZSB0aGUgY2VudGVyIHRvIG5vdCBjaGFuZ2UgdGhlIHgveVxyXG4gICAgdmFyIHYgPSB2YWx1ZSAvIDI7XHJcbiAgICB0aGlzLmN5KHYpLnJ5KHYpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnJ4KGZhbHNlLCB0cnVlKSAqIDI7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5fc2V0V2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgLy9XaGVuIHNldHRpbmcgdGhlIGhlaWdodCBvZiBhbiBlbGxpcHNlIHdlIG1vdmUgdGhlIGNlbnRlciB0byBub3QgY2hhbmdlIHRoZSB4L3lcclxuICAgIHZhciB2ID0gdmFsdWUgLyAyO1xyXG4gICAgdGhpcy5jeCh2KS5yeCh2KTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLl9nZXRYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jeCgpIC0gdGhpcy5yeCgpO1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmN5KCkgLSB0aGlzLnJ5KCk7XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRoaXMuY3goKSxcclxuICAgICAgICB5IDogdGhpcy5jeSgpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUuYm90dG9tWSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY3koKSArIHRoaXMucnkoKTtcclxufTtcclxuXHJcblNWR0VsbGlwc2UucHJvdG90eXBlLmN4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCF2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZWRYKHRoaXMuYXR0ck51bWJlcignY3gnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYXR0cignY3gnLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdFbGxpcHNlLnByb3RvdHlwZS5jeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGVkWSh0aGlzLmF0dHJOdW1iZXIoJ2N5JykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ2N5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnggPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVswXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J4JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeCcpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J4JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUucnkgPSBmdW5jdGlvbih2YWx1ZSwgbm9TY2FsZSkge1xyXG4gICAgdmFyIHNjYWxlID0gKG5vU2NhbGUpID8gMSA6IHRoaXMuc2NhbGUoKVsxXTtcclxuICAgIGlmKCghb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgb2JqZWN0LmlzQm9vbGVhbih2YWx1ZSkgJiYgIXZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3J5JykgKiBzY2FsZTtcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNCb29sZWFuKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hdHRyTnVtYmVyKCdyeScpICsgKHRoaXMuc3Ryb2tlV2lkdGgoKSAvIDIpKSAqIHNjYWxlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHJOdW1iZXIoJ3J5JywgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHRWxsaXBzZS5wcm90b3R5cGUub3ZlcmxheUNoZWNrID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5tYXRoLkVsbGlwc2UodGhpcy5nZXRDZW50ZXIoKSwgdGhpcy5yeCgpLCB0aGlzLnJ5KCkpLm92ZXJsYXlzKHBvc2l0aW9uKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHRWxsaXBzZTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG5cclxudmFyIFNWR0dyb3VwID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdnJywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHR3JvdXAsIFNWR1NoYXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1ZHR3JvdXA7IiwidmFyIEhlbHBlciA9IGZ1bmN0aW9uKHN2Zykge1xyXG4gICAgdGhpcy5zdmcgPSBzdmc7XHJcbiAgICB0aGlzLnBvaW50cyA9IHt9O1xyXG59O1xyXG5cclxuSGVscGVyLnByb3RvdHlwZS5wb2ludCA9IGZ1bmN0aW9uKGlkLCBwLCBjb2xvciwgcHJldlRleHQpIHtcclxuICAgIGNvbG9yID0gY29sb3IgfHwgJ3JlZCc7XHJcbiAgICB2YXIgdGV4dCA9IGlkKycoeDonK3AueCArICcgeTonK3AueSsnKSc7XHJcbiAgICBpZighdGhpcy5wb2ludHNbaWRdKSB7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5zdmcuY2lyY2xlKHtcclxuICAgICAgICAgICAgcjoyLFxyXG4gICAgICAgICAgICBzdHlsZTonZmlsbDonK2NvbG9yXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnN2Zy50ZXh0KHRleHQpLmZpbGwoY29sb3IpO1xyXG4gICAgICAgIHZhciBncm91cCA9IHRoaXMuc3ZnLmcoe2lkOidoZWxwZXJfJytpZH0sIHQsIHBvaW50KTtcclxuICAgICAgICB0aGlzLnBvaW50c1tpZF0gPSB7XHJcbiAgICAgICAgICAgIGdyb3VwIDogZ3JvdXAsXHJcbiAgICAgICAgICAgIHRleHQgOiB0LFxyXG4gICAgICAgICAgICBwb2ludCA6IHBvaW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihwcmV2VGV4dCkge1xyXG4gICAgICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wb2ludHNbaWRdLnBvaW50Lm1vdmVUbyhwKTtcclxuICAgIHRoaXMucG9pbnRzW2lkXS50ZXh0LiQoKS50ZXh0KHRleHQpO1xyXG4gICAgdGhpcy5wb2ludHNbaWRdLnRleHQubW92ZVRvKHApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIZWxwZXI7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgU1ZHU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnZhciBQYXRoRGF0YSA9IHJlcXVpcmUoJy4vcGF0aERhdGEnKTtcclxuXHJcbnZhciBTVkdQYXRoID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlciA9IHsgZCA6IFNWR1BhdGgucGF0aERhdGFBdHRyaWJ1dGVTZXR0ZXJ9O1xyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAncGF0aCcsIHN2Z1Jvb3QsIGNmZywgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdQYXRoLCBTVkdTaGFwZSk7XHJcblxyXG5TVkdQYXRoLnBhdGhEYXRhQXR0cmlidXRlU2V0dGVyID0gZnVuY3Rpb24ocGF0aERhdGFTdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgUGF0aERhdGEocGF0aERhdGFTdHJpbmcpO1xyXG59O1xyXG5cclxuU1ZHUGF0aC5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZCgpLmdldFgoKTtcclxufTtcclxuXHJcblNWR1BhdGgucHJvdG90eXBlLnkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmQoKS5nZXRZKCk7XHJcbn07XHJcblxyXG5TVkdQYXRoLnByb3RvdHlwZS5kID0gZnVuY3Rpb24ocGF0aERhdGEpIHtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhwYXRoRGF0YSkpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuZCA9IG5ldyBQYXRoRGF0YShwYXRoRGF0YSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ2QnKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSBpZihvYmplY3QuaXNEZWZpbmVkKHBhdGhEYXRhKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gcGF0aERhdGFcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgnZCcpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIGlmKCFvYmplY3QuaXNEZWZpbmVkKHRoaXMuYXR0cmlidXRlcy5kKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5kID0gbmV3IFBhdGhEYXRhKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1BhdGg7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi91dGlsL21hdGgnKS5WZWN0b3I7XHJcbnZhciBtYXRoID0gcmVxdWlyZSgnLi4vdXRpbC9tYXRoJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL3V0aWwvdXRpbFwiKTtcclxuXHJcbnZhciBBYnN0cmFjdFBhdGhEYXRhVHlwZSA9IGZ1bmN0aW9uKHR5cGUsIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLnZlY3RvciA9IG5ldyBWZWN0b3IoKTtcclxuICAgIHRoaXMudmVjdG9yLmFkZCh0eXBlKTtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldEFic29sdXRlID0gZnVuY3Rpb24oYWJzb2x1dGUpIHtcclxuICAgIHRoaXMuYWJzb2x1dGUgPSBhYnNvbHV0ZSB8fCB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0VHlwZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHR5cGUgPSB0aGlzLnZhbHVlKDAsMCk7XHJcbiAgICByZXR1cm4gdGhpcy5hYnNvbHV0ZSA/IHR5cGUudG9VcHBlckNhc2UoKSA6IHR5cGUudG9Mb3dlckNhc2UoKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmVjdG9yLnZhbHVlKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59O1xyXG5cclxuQWJzdHJhY3RQYXRoRGF0YVR5cGUucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnZlY3Rvci5zZXRWYWx1ZShwYXRoQXJyLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24ocGF0aEFyciwgdmFsdWVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3Iuc2V0VmFsdWUocGF0aEFyciwgdmFsdWVzKTtcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5pcyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKS50b1VwcGVyQ2FzZSgpID09PSB0eXBlLnRvVXBwZXJDYXNlKCk7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUudG8gPSBmdW5jdGlvbihwYXRoQXJyLCB2YWx1ZXMpIHtcclxuICAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcbkFic3RyYWN0UGF0aERhdGFUeXBlLnByb3RvdHlwZS5wb2ludFRvU3RyaW5nID0gZnVuY3Rpb24ocCkge1xyXG4gICAgcmV0dXJuIHAueCArICcsJyArIHAueSsnICc7XHJcbn07XHJcblxyXG5BYnN0cmFjdFBhdGhEYXRhVHlwZS5wcm90b3R5cGUuZ2V0T3JTZXQgPSBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZShpbmRleCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZWN0b3IgPSBbWydsJ10sIHt4OngsIHk6eX1dXHJcbiAqL1xyXG52YXIgTGluZVRvID0gZnVuY3Rpb24ocCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ2wnLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhMaW5lVG8sIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG8gPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUueCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMudmFsdWUoMSkueCA9IHZhbHVlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZSgxKS54O1xyXG59O1xyXG5cclxuTGluZVRvLnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSgxKS55ID0gdmFsdWVcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnZhbHVlKDEpLnk7XHJcbn07XHJcblxyXG5MaW5lVG8ucHJvdG90eXBlLm1vdmVBbG9uZyA9IGZ1bmN0aW9uKGZyb20sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gbWF0aC5MaW5lLm1vdmVBbG9uZyhmcm9tLCB0aGlzLnRvKCksIGRpc3RhbmNlKTtcclxufTtcclxuXHJcbkxpbmVUby5wcm90b3R5cGUuZ2V0TmVhcmVzdFBvaW50ID0gZnVuY3Rpb24oZnJvbSwgcG9zaXRpb24pIHtcclxuICAgIHJldHVybiBtYXRoLkxpbmUuZ2V0TmVhcmVzdFBvaW50KGZyb20sIHRoaXMudG8oKSwgcG9zaXRpb24pO1xyXG59O1xyXG5cclxudmFyIFFCZXppZXIgPSBmdW5jdGlvbihjb250cm9sUCwgdG9QLCBhYnNvbHV0ZSkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAncScsIGFic29sdXRlKTtcclxuICAgIHRoaXMuY29udHJvbChjb250cm9sUCk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFFCZXppZXIsIEFic3RyYWN0UGF0aERhdGFUeXBlKTtcclxuXHJcblFCZXppZXIucHJvdG90eXBlLnRvID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDEscCk7XHJcbn07XHJcblxyXG5RQmV6aWVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHlwZSgpK3RoaXMucG9pbnRUb1N0cmluZyh0aGlzLmNvbnRyb2woKSkrdGhpcy5wb2ludFRvU3RyaW5nKHRoaXMudG8oKSk7XHJcbn07XHJcblxyXG52YXIgQ0JlemllciA9IGZ1bmN0aW9uKGNvbnRyb2xQMSwgY29udHJvbFAyLCB0b1AsIGFic29sdXRlKSB7XHJcbiAgICBBYnN0cmFjdFBhdGhEYXRhVHlwZS5jYWxsKHRoaXMsICdjJywgYWJzb2x1dGUpO1xyXG4gICAgdGhpcy5jb250cm9sMShjb250cm9sUDEpO1xyXG4gICAgdGhpcy5jb250cm9sMihjb250cm9sUDIpO1xyXG4gICAgdGhpcy50byh0b1ApO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDQmV6aWVyLCBBYnN0cmFjdFBhdGhEYXRhVHlwZSk7XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sMSh4LHkpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuY29udHJvbDEgPSBmdW5jdGlvbih4LHkpIHtcclxuICAgIHZhciBwID0gbWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3JTZXQoMSxwKTtcclxufTtcclxuXHJcbkNCZXppZXIucHJvdG90eXBlLmNvbnRyb2wyID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHJldHVybiB0aGlzLmdldE9yU2V0KDIscCk7XHJcbn07XHJcblxyXG5DQmV6aWVyLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgdmFyIHAgPSBtYXRoLmdldFBvaW50KHgseSk7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRPclNldCgzLHApO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFR5cGUoKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMSgpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy5jb250cm9sMigpKSt0aGlzLnBvaW50VG9TdHJpbmcodGhpcy50bygpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIHRoZSBuZWFyZXN0IHBvaW50IG9mIHRoZSBiZXppZXIgY3VydmUgdG8gdGhlIGdpdmVuIHBvc2l0aW9uLiBzaW5jZSB0aGUgQ0JlemllciBkb2VzIG5vdCBrbm93IGl0cyBzdGFydFxyXG4gKiBwb2ludCwgd2UgaGF2ZSB0byBwcm92aWRlIHRoZSBmcm9tIHBvc2l0aW9uIGFzIHdlbGwgYXMgdGhlIHNlYXJjaCBiYXNlIHBvc2l0aW9uLlxyXG4gKiBAcGFyYW0gZnJvbVxyXG4gKiBAcGFyYW0gcG9zaXRpb25cclxuICogQHJldHVybnMge3twb2ludCwgbG9jYXRpb259fCp9XHJcbiAqL1xyXG5DQmV6aWVyLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihmcm9tLCBwb3NpdGlvbikge1xyXG4gICAgcmV0dXJuIG1hdGguYmV6aWVyLm5lYXJlc3RQb2ludE9uQ3VydmUocG9zaXRpb24sIHRoaXMuZ2V0Q3VydmUoZnJvbSkpLnBvaW50O1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oZnJvbSwgZGlzdGFuY2UpIHtcclxuICAgIHJldHVybiBtYXRoLmJlemllci5tb3ZlQWxvbmcodGhpcy5nZXRDdXJ2ZShmcm9tKSwgZGlzdGFuY2UpO1xyXG59O1xyXG5cclxuQ0Jlemllci5wcm90b3R5cGUuZ2V0Q3VydmUgPSBmdW5jdGlvbihmcm9tKSB7XHJcbiAgICByZXR1cm4gW2Zyb20sIHRoaXMuY29udHJvbDEoKSwgdGhpcy5jb250cm9sMigpLCB0aGlzLnRvKCldO1xyXG59O1xyXG5cclxudmFyIE1vdmVUbyA9IGZ1bmN0aW9uKHRvUCwgYWJzb2x1dGUpIHtcclxuICAgIEFic3RyYWN0UGF0aERhdGFUeXBlLmNhbGwodGhpcywgJ20nLCBhYnNvbHV0ZSk7XHJcbiAgICB0aGlzLnRvKHRvUCk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKE1vdmVUbywgTGluZVRvKTtcclxuXHJcbnZhciBDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgQWJzdHJhY3RQYXRoRGF0YVR5cGUuY2FsbCh0aGlzLCAneicpO1xyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhDb21wbGV0ZSwgQWJzdHJhY3RQYXRoRGF0YVR5cGUpO1xyXG5cclxuQ29tcGxldGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUeXBlKCk7XHJcbn07XHJcblxyXG52YXIgcGF0aFR5cGUgPSB7XHJcbiAgICB6IDogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgQ29tcGxldGUoKSB9LFxyXG4gICAgbSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IE1vdmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgbCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IExpbmVUbyhhcmd1bWVudHNbMF0pOyB9LFxyXG4gICAgcSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IFFCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pOyB9LFxyXG4gICAgYyA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IENCZXppZXIoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sICBhcmd1bWVudHNbMl0pOyB9XHJcbn07XHJcblxyXG52YXIgUGF0aERhdGEgPSBmdW5jdGlvbihkZWYpIHtcclxuICAgIHRoaXMuZGF0YSA9IG5ldyBWZWN0b3IoKTtcclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyhkZWYpKSB7XHJcbiAgICAgICAgdGhpcy5sb2FkRnJvbVN0cmluZyhkZWYpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxvYWRGcm9tU3RyaW5nID0gZnVuY3Rpb24oc3RyVmFsKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvLydNMTAwLDEwMCBRMjAwLDIwMCAzMDAsMzAwJyAtLT4gWydNMTAwLDEwMCAnLCAnUTIwMCwyMDAgMzAwLDMwMCddXHJcbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBzdHJWYWwuc3BsaXQoLyg/PVtNbUxsSGhWdkNjU3NRcVR0QWFael0rKS8pO1xyXG4gICAgLy9FYWNoIGRUeXBlXHJcbiAgICAkLmVhY2goZGVmaW5pdGlvbnMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciB0eXBlID0gdmFsdWUuY2hhckF0KDApO1xyXG4gICAgICAgIC8vJ1EyMDAsMjAwIDMwMCwzMDAgLT4gWycyMDAsMjAwJywgJzMwMCwzMDAnXVxyXG4gICAgICAgIHZhciB2YWx1ZXMgPSB2YWx1ZS5zdWJzdHJpbmcoMSx2YWx1ZS5sZW5ndGgpLnRyaW0oKS5zcGxpdCgnICcpO1xyXG4gICAgICAgIC8vWycyMDAsMjAwJywgJzMwMCwzMDAnXSAtPiBbe3g6MjAwLCB5OjIwMH0sIHt4OjMwMCwgeTozMDB9XVxyXG4gICAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgICAkLmVhY2godmFsdWVzLCBmdW5jdGlvbihpLCBjb29yZCkge1xyXG4gICAgICAgICAgICB2YXIgY29vcmRWYWxzID0gY29vcmQuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgcG9pbnRzLnB1c2gobWF0aC5nZXRQb2ludChwYXJzZUZsb2F0KGNvb3JkVmFsc1swXSksIHBhcnNlRmxvYXQoY29vcmRWYWxzWzFdKSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQuZGF0YS5hZGQocGF0aFR5cGVbdHlwZS50b0xvd2VyQ2FzZSgpXS5hcHBseSh1bmRlZmluZWQsIHBvaW50cykuc2V0QWJzb2x1dGUoKHR5cGUgPT0gdHlwZS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDb3JuZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgeE1pbiwgeE1heCwgeU1pbiwgeU1heDtcclxuICAgIHhNaW4gPSB5TWluID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgeE1heCA9IHlNYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcblxyXG4gICAgdGhpcy5kYXRhLmVhY2goZnVuY3Rpb24oaW5kZXgsIHBhdGhQYXJ0KSB7XHJcbiAgICAgICAgaWYocGF0aFBhcnQueCAmJiBwYXRoUGFydC55KSB7XHJcbiAgICAgICAgICAgIHhNaW4gPSAoeE1pbiA+IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWluO1xyXG4gICAgICAgICAgICB5TWluID0gKHlNaW4gPiBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1pbjtcclxuXHJcbiAgICAgICAgICAgIHhNYXggPSAoeE1heCA8IHBhdGhQYXJ0LngoKSkgPyBwYXRoUGFydC54KCkgOiB4TWF4O1xyXG4gICAgICAgICAgICB5TWF4ID0gKHlNYXggPCBwYXRoUGFydC55KCkpID8gcGF0aFBhcnQueSgpIDogeU1heDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1pbn0sXHJcbiAgICAgICAge3g6eE1heCwgeTp5TWlufSxcclxuICAgICAgICB7eDp4TWF4LCB5OnlNYXh9LFxyXG4gICAgICAgIHt4OnhNaW4sIHk6eU1heH1cclxuICAgIF07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzBdLnk7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUucG9seW5vbXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBpZih2YWx1ZS50bykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZS50bygpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuc1xyXG4gKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0UGF0aFBhcnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgLy9XZSBzdGFydCBhdCBpbmRleCAxIGJlY2F1c2UgdGhlIDAgaW5kZXggb2YgdGhlIHZlY3RvciBjb250YWlucyB0aGUgcGF0aHBhcnQgdHlwZVxyXG4gICAgZm9yKHZhciBpID0gMTsgaSA8PSB0aGlzLmxlbmd0aCgpIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5nZXRQYXRoUGFydChpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoUGFydCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICB2YXIgcGF0aFBhcnQgPSB0aGlzLnZhbHVlKGluZGV4KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnQ6IHRoaXMudmFsdWUoaW5kZXggLSAxKS50bygpLFxyXG4gICAgICAgIGVuZDogcGF0aFBhcnQudG8oKSxcclxuICAgICAgICB2YWx1ZTogcGF0aFBhcnRcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUubW92ZUFsb25nID0gZnVuY3Rpb24oaW5kZXgsIGRpc3RhbmNlLCBkaXJlY3Rpb24pIHtcclxuICAgIHZhciBwYXRoUGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGF0aFBhcnQudmFsdWUubW92ZUFsb25nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGhQYXJ0LnZhbHVlLm1vdmVBbG9uZyhwYXRoUGFydC5zdGFydCwgZGlzdGFuY2UsIGRpcmVjdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBtYXRoLkxpbmUubW92ZUFsb25nKHBhdGhQYXJ0LnN0YXJ0LCBwYXRoUGFydC5lbmQsIGRpc3RhbmNlLCBkaXJlY3Rpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHJvdWdoIGNlbnRlciBvZiB0aGUgcGF0aCBieSBjYWxjdWxhdGluZyB0aGUgdG90YWwgbGVuZ3RoIG9mIHRoZSBwYXRocGFydHMgKGFzIGRpcmVjdCBsaW5lcykgYW5kIG1vdmluZ1xyXG4gKiBhbG9uZyB0aG9zZSBsaW5lcyB0byB0aGUgY2VudGVyICh0b3RhbCBsZW5ndGggLyAyKS4gTm90ZSB3aXRoIHRoaXMgbWV0aG9kIHdlIGp1c3QgZ2V0IGEgZXhhY3QgcmVzdWx0IGZvciBzaW1wbGVcclxuICogbGluZSBwYXRocy4gSWYgdGhlIGNhbGN1bGF0ZWQgY2VudGVyIHBvc2l0aW9uIGlzIHdpdGhpbiBhIGN1YmljIGJlemllciBwYXRoIHBhcnQsIHdlIHJldHVybiB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICogdG8gdGhlIGNhbGN1bGF0ZWQgY2VudGVyLlxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHREID0gdGhpcy5nZXREaXN0YW5jZSgpIC8gMjtcclxuICAgIHZhciBjdXJyZW50RCA9IDA7XHJcbiAgICB2YXIgY2VudGVyO1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy5nZXRQYXRoUGFydHMoKSwgZnVuY3Rpb24oaW5kZXgsIHBhcnQpIHtcclxuICAgICAgICB2YXIgbGluZUQgPSBtYXRoLkxpbmUuY2FsY0Rpc3RhbmNlKHBhcnQuc3RhcnQsIHBhcnQuZW5kKTtcclxuICAgICAgICB2YXIgbmV4dEQgPSBjdXJyZW50RCArIGxpbmVEO1xyXG4gICAgICAgIGlmKG5leHREID4gcmVzdWx0RCkge1xyXG4gICAgICAgICAgICB2YXIgZGlmZkQgPSAgcmVzdWx0RCAtIGN1cnJlbnREO1xyXG4gICAgICAgICAgICBjZW50ZXIgPSBtYXRoLkxpbmUubW92ZUFsb25nKHBhcnQuc3RhcnQsIHBhcnQuZW5kLCBkaWZmRCk7XHJcblxyXG4gICAgICAgICAgICAvL0lmIHdlIGhhdmUgYSBjdWJpYyBiZXppZXIgcGF0aCBwYXJ0IHdlIGNhbGN1bGF0ZSB0aGUgbmVhcmVzdCBwb2ludCBvbiB0aGUgY3VydmVcclxuICAgICAgICAgICAgaWYocGFydC52YWx1ZS5pcygnYycpKSB7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXIgPSBwYXJ0LnZhbHVlLmdldE5lYXJlc3RQb2ludChwYXJ0LnN0YXJ0LCBjZW50ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VycmVudEQgPSBuZXh0RDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNlbnRlcjtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXREaXN0YW5jZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGRpc3RhbmNlID0gMDtcclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgZGlzdGFuY2UgKz0gbWF0aC5MaW5lLmNhbGNEaXN0YW5jZShwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBkaXN0YW5jZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBc3N1bWluZyB0aGVyZSBhcmUgb25seSEgY3ViaWMgYmV6aWVyIGN1cnZlZCBwYXRoIHBhcnRzIHRoaXMgZnVuY3Rpb24gcmVjYWxjdWxhdGVzIGFsbCBjb250cm9sIHBvaW50cyBvZiB0aGUgY3VydmVzXHJcbiAqIHRvIHNtb290aGVuIHRoZSBlbnRpcmUgcGF0aC5cclxuICpcclxuICogQHBhcmFtIHBvbHlub21zXHJcbiAqL1xyXG5QYXRoRGF0YS5wcm90b3R5cGUuc21vb3RoZW4gPSBmdW5jdGlvbihwb2x5bm9tcykge1xyXG4gICAgaWYoIXBvbHlub21zKSB7XHJcbiAgICAgICAgcG9seW5vbXMgPSB0aGlzLnBvbHlub21zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHggPSBbXTtcclxuICAgIHZhciB5ID0gW107XHJcblxyXG4gICAgb2JqZWN0LmVhY2gocG9seW5vbXMsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIHhbaW5kZXhdID0gdmFsdWUueDtcclxuICAgICAgICB5W2luZGV4XSA9IHZhbHVlLnk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcHggPSBtYXRoLmJlemllci5jYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzKHgpO1xyXG4gICAgdmFyIHB5ID0gbWF0aC5iZXppZXIuY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyh5KTtcclxuXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBvYmplY3QuZWFjaChweC5wMSwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhhdC52YWx1ZShpbmRleCArIDEpLmNvbnRyb2wxKHB4LnAxW2luZGV4XSwgcHkucDFbaW5kZXhdKTtcclxuICAgICAgICB0aGF0LnZhbHVlKGluZGV4ICsgMSkuY29udHJvbDIocHgucDJbaW5kZXhdLCBweS5wMltpbmRleF0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRMaW5lQnlQYXRoSW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdmFyIHAxID0gdGhpcy52YWx1ZShpbmRleCAtIDEpLnRvKCk7XHJcbiAgICB2YXIgcDIgPSB0aGlzLnZhbHVlKGluZGV4KS50bygpO1xyXG4gICAgcmV0dXJuIG5ldyBtYXRoLkxpbmUocDEsIHAyKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihwb2ludCkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbihwb2ludCk7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuZ2V0UGF0aFBhcnQoaW5kZXgpO1xyXG4gICAgaWYocGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQpIHtcclxuICAgICAgICByZXR1cm4gcGFydC52YWx1ZS5nZXROZWFyZXN0UG9pbnQocGFydC5zdGFydCwgcG9pbnQpO1xyXG4gICAgfTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRQYXRoSW5kZXhGb3JQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvaW50KSB7XHJcblxyXG4gICAgaWYodGhpcy5sZW5ndGgoKSA9PT0gMikge1xyXG4gICAgICAgIC8vSWYgdGhlcmUgaXMganVzdCB0aGUgc3RhcnQgYW5kIGVuZCBkb2NraW5nIHdlIGtub3cgdGhlIG5ldyBpbmRleFxyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBkb2NraW5nSW5kZXggPSAxO1xyXG4gICAgdmFyIGNhbmRpZGF0ZSA9IFsxLE51bWJlci5QT1NJVElWRV9JTkZJTklUWSBdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZ2V0UGF0aFBhcnRzKCksIGZ1bmN0aW9uKGluZGV4LCBwYXJ0KSB7XHJcbiAgICAgICAgLy9Tb3J0IG91dCBwYXRocGFydHMgd2hpY2ggYXJlIG5vdCB3aXRoaW4gdGhlIGJvdW5kYXJ5IG9mIHN0YXJ0L2VuZCBwb2ludHMgd2l0aCBhIGxpdHRsZSB0b2xlcmFuY2Ugb2YgMTBweFxyXG4gICAgICAgIHZhciBwID0gbmV3IHV0aWwubWF0aC5Qb2ludChwb2ludCk7XHJcbiAgICAgICAgaWYocC5pc1dpdGhpblhJbnRlcnZhbChwYXJ0LnN0YXJ0LCBwYXJ0LmVuZCwgMTApKSB7XHJcbiAgICAgICAgICAgIHZhciBkO1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IG5ldyBtYXRoLkxpbmUocGFydC5zdGFydCwgcGFydC5lbmQpO1xyXG5cclxuICAgICAgICAgICAgaWYoIWxpbmUuaXNWZXJ0aWNhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICBkID0gTWF0aC5hYnMobGluZS5jYWxjRlgocG9pbnQueCkueSAtIHBvaW50LnkpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihwLmlzV2l0aGluWUludGVydmFsKHBhcnQuc3RhcnQsIHBhcnQuZW5kKSkge1xyXG4gICAgICAgICAgICAgICAgLy9TaW5jZSB0aGUgcG9pbnQgaXMgd2l0aGluIHggKHdpdGggdG9sZXJhbmNlKSBhbmQgeSBpbnRlcnZhbCB3ZSBjYWxjdWxhdGUgdGhlIHggZGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLmFicyhwYXJ0LnN0YXJ0LnggLSBwLngpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FuZGlkYXRlID09PSB1bmRlZmluZWQgfHwgY2FuZGlkYXRlWzFdID4gZCkge1xyXG4gICAgICAgICAgICAgICAgLy9UaGUgcGF0aFBhcnRpbmRleCBpcyB0aGUgYXJyYXlpbmRleCArIDEgc2luY2Ugd2UgdXNlIHRoZSBlbmQgaW5kZXggb2YgdGhlIHBhdGggYXMgaWRlbnRpdHlcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVswXSA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVsxXSA9IGQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY2FuZGlkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZVswXTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldEdyYWRpZW4gPSBmdW5jdGlvbih4LHkpIHtcclxuIHZhciBwb3NpdGlvbiA9IHV0aWwubWF0aC5nZXRQb2ludCh4LHkpO1xyXG4gdmFyIGluZGV4ID0gdGhpcy50cmFuc2l0aW9uLmdldEtub2JJbmRleEZvclBvaW50KHBvc2l0aW9uKTtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuIExpbmVQYXRoTWFuYWdlci5wcm90b3R5cGUuZ2V0R3JhZGllbnRCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuIHZhciBwMSA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCkucG9zaXRpb24oKTtcclxuIHZhciBwMiA9IHRoaXMuZGF0YS5nZXREb2NraW5nQnlJbmRleChpbmRleCArIDEpLnBvc2l0aW9uKCk7XHJcbiByZXR1cm4gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KHAxLCBwMik7XHJcbiB9O1xyXG5cclxuXHJcbiBMaW5lUGF0aE1hbmFnZXIucHJvdG90eXBlLmdldFZlY3RvckJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCwgZnJvbUVuZCkge1xyXG4gdmFyIHAxLCBwMjtcclxuIGlmKGZyb21FbmQpIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4ICsgMSkucG9zaXRpb24oKTtcclxuIHAyID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUVuZEluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gfSBlbHNlIHtcclxuIHAxID0gdGhpcy5kYXRhLmdldERvY2tpbmdCeUluZGV4KGluZGV4KS5wb3NpdGlvbigpO1xyXG4gcDIgPSB0aGlzLmRhdGEuZ2V0RG9ja2luZ0J5SW5kZXgoaW5kZXggKyAxKS5wb3NpdGlvbigpO1xyXG4gfVxyXG4gcmV0dXJuIHV0aWwubWF0aC5MaW5lLmNhbGNOb3JtYWxpemVkTGluZVZlY3RvcihwMSwgcDIpO1xyXG4gfTtcclxuICovXHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMF0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5nZXRSaWdodFggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVycygpWzFdLng7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZ2V0Qm90dG9tWSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb3JuZXJzKClbMl0ueTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmRhdGEuY2xlYXIoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGgoKTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlKGluZGV4KTtcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5sYXN0SW5kZXhPZlR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICB2YXIgaTtcclxuICAgIGZvcihpID0gdGhpcy5sZW5ndGgoKSAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZShpKTtcclxuICAgICAgICBpZih2YWx1ZS5pcyh0eXBlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gLTE7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUudmFsdWVzQnlUeXBlID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgIG9iamVjdC5lYWNoKHRoaXMuZGF0YS52ZWN0b3JzLCBmdW5jdGlvbihpLCB2YWx1ZSkge1xyXG4gICAgICAgaWYodmFsdWUuaXModHlwZSkpIHtcclxuICAgICAgICAgICByZXN1bHQucHVzaCh7aW5kZXg6aSwgdmFsdWU6dmFsdWV9KTtcclxuICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihwLCBhYnNvbHV0ZSkge1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlKDApLnRvKCk7XHJcbiAgICB9IGVsc2UgaWYodGhpcy5sZW5ndGgoKSA+IDApIHtcclxuICAgICAgICB0aGlzLnZhbHVlKDApLnRvKHApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuc2V0VmFsdWUoMCwgbmV3IE1vdmVUbyhwLCBhYnNvbHV0ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sYXN0KCkudG8odmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmxhc3QoKS50bygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IHJlZmFjdG9yIHRvIHNldFRvXHJcbiAqIEBwYXJhbSBpbmRleFxyXG4gKiBAcGFyYW0gdmFsdWVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLnNldFRvID0gZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmRhdGEudmFsdWUoaW5kZXgpLnRvKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnJlbW92ZVBhdGggPSBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZShpbmRleCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ29tcGxldGUoKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5saW5lID0gZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgcCA9IG1hdGguZ2V0UG9pbnQoeCx5KTtcclxuICAgIHRoaXMuZGF0YS5hZGQobmV3IExpbmVUbyhwLCB0cnVlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5jQmV6aWVyID0gZnVuY3Rpb24oYzEsIGMyLCB0bykge1xyXG4gICAgdGhpcy5kYXRhLmFkZChuZXcgQ0JlemllcihjMSxjMiwgdG8sIHRydWUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE86IExpbmUgdG9cclxuICogQHBhcmFtIGluZGV4XHJcbiAqIEBwYXJhbSB2YWx1ZVxyXG4gKiBAcGFyYW0gYWJzb2x1dGVcclxuICogQHJldHVybnMge1BhdGhEYXRhfVxyXG4gKi9cclxuUGF0aERhdGEucHJvdG90eXBlLmluc2VydExpbmUgPSBmdW5jdGlvbihpbmRleCwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgTGluZVRvKHRvLGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5xQmV6aWVyID0gZnVuY3Rpb24oY29udHJvbFAsdG9QKSB7XHJcbiAgICB0aGlzLmRhdGEuYWRkKG5ldyBRQmV6aWVyKGNvbnRyb2xQLHRvUCwgdHJ1ZSkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5QYXRoRGF0YS5wcm90b3R5cGUuaW5zZXJ0UUJlemllciA9IGZ1bmN0aW9uKGluZGV4LGMsIHRvLCBhYnNvbHV0ZSkge1xyXG4gICAgdGhpcy5kYXRhLmluc2VydChpbmRleCwgbmV3IFFCZXppZXIoYywgdG8sIGFic29sdXRlKSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblBhdGhEYXRhLnByb3RvdHlwZS5pbnNlcnRDQmV6aWVyID0gZnVuY3Rpb24oaW5kZXgsIGMxLCBjMiwgdG8sIGFic29sdXRlKSB7XHJcbiAgICB0aGlzLmRhdGEuaW5zZXJ0KGluZGV4LCBuZXcgQ0JlemllcihjMSxjMiwgdG8sYWJzb2x1dGUpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUGF0aERhdGEucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gJyc7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmRhdGEuZWFjaChmdW5jdGlvbihpbmRleCwgcGF0aFBhcnQpIHtcclxuICAgICAgIHJlc3VsdCArPSBwYXRoUGFydC50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0LnRyaW0oKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aERhdGE7IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBTVkdTaGFwZSA9IHJlcXVpcmUoJy4vc3ZnU2hhcGUnKTtcclxuXHJcbnZhciBTVkdSZWN0ID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnKSB7XHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICdyZWN0Jywgc3ZnUm9vdCwgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHUmVjdCwgU1ZHU2hhcGUpO1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3knKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldFggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHJOdW1iZXIoJ3gnKSB8fCAwO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX2dldEhlaWdodCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdoZWlnaHQnKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9zZXRIZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdGhpcy5hdHRyKCdoZWlnaHQnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLl9nZXRXaWR0aCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCd3aWR0aCcpO1xyXG59O1xyXG5cclxuU1ZHUmVjdC5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHRoaXMuYXR0cignd2lkdGgnLHZhbHVlKTtcclxufTtcclxuXHJcblNWR1JlY3QucHJvdG90eXBlLm92ZXJsYXlDaGVjayA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICByZXR1cm4gcG9zaXRpb24ueCA+PSB0aGlzLngoKSAmJiBwb3NpdGlvbi54IDw9IHRoaXMuZ2V0UmlnaHRYKClcclxuICAgICAgICAmJiBwb3NpdGlvbi55ID49IHRoaXMueSgpICYmIHBvc2l0aW9uLnkgPD0gdGhpcy5nZXRCb3R0b21ZKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWR1JlY3Q7IiwidmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBzdHJpbmcgPSByZXF1aXJlKCcuLi91dGlsL3N0cmluZycpO1xyXG5cclxudmFyIFJFR0VYUF9QUk9QRVJUWV9TVUZGSVggPSAnOlthLXpBLVowLTkjLFxcLl0qKDt8JCknO1xyXG5cclxudmFyIFN0eWxlID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgIW9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IGtleTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXQoa2V5LHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBpZihvYmplY3QuaXNPYmplY3Qoa2V5KSkge1xyXG4gICAgICAgIG9iamVjdC5lYWNoKGtleSwgZnVuY3Rpb24ob2JqS2V5LCB2YWwpIHtcclxuICAgICAgICAgICAgaWYoa2V5Lmhhc093blByb3BlcnR5KG9iaktleSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KG9iaktleSx2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkgJiYgb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpIHtcclxuICAgICAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh0aGlzLnZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmFsdWUuaW5kZXhPZihrZXkrJzonKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKGtleStSRUdFWFBfUFJPUEVSVFlfU1VGRklYLCAnZ2knKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUucmVwbGFjZShyZWdFeHAsIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSArPSAoIXN0cmluZy5lbmRzV2l0aCh0aGlzLnZhbHVlLCc7JykgJiYgdGhpcy52YWx1ZS5sZW5ndGggPiAwKSA/ICc7JyArIHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKSA6IHRoaXMuY3JlYXRlVmFsdWVTdHJpbmcoa2V5LHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYob2JqZWN0LmlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0ga2V5O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU3R5bGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdmFyIHJlZ0V4cCA9IG5ldyBSZWdFeHAoa2V5K1JFR0VYUF9QUk9QRVJUWV9TVUZGSVgsICdnaScpO1xyXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMudmFsdWUubWF0Y2gocmVnRXhwKTtcclxuICAgIGlmKG9iamVjdC5pc0FycmF5KHJlc3VsdCkpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHRbMF07XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gdmFsdWUuc3BsaXQoJzonKTtcclxuICAgICAgICBpZihzcGxpdHRlZC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzcGxpdHRlZFsxXTtcclxuICAgICAgICAgICAgcmV0dXJuIChzdHJpbmcuZW5kc1dpdGgocmVzdWx0LCAnOycpKT8gcmVzdWx0LnN1YnN0cmluZygwLHJlc3VsdC5sZW5ndGggLTEpIDogcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS5jcmVhdGVWYWx1ZVN0cmluZyA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHJldHVybiBrZXkrJzonK3ZhbHVlKyc7JztcclxufTtcclxuXHJcblN0eWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlO1xyXG4iLCIvKipcclxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgZnVuY3Rpb25hbGl0eSBmb3IgY3JlYXRpbmcgYW5kIGFjY2Vzc2luZyBTVkcgZWxlbWVudHMuXHJcbiAqIEFsbCBTVkcgZWxlbWVudHMgY3JlYXRlZCB3aXRoIHRoaXMgbW9kdWxlIGNhbiBiZSBhY2Nlc3NlZCBieSBJRCB0aHJvdWdoIHRoZSBpbnN0YW5jZSBvYmplY3QuXHJcbiAqXHJcbiAqIEFuIFNWRyBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGlzIG1vZHVsZSBjYW4gYmUgc2VwZXJhdGVkIGludG8gbXVsdGlwbGUgcGFydHMgd2hpY2ggY2FuIGJlIG1hbmFnZWQgc3BlcmF0bHkuXHJcbiAqIFRoZSAncm9vdCcgcGFydCB3aWxsIGJlIGNyZWF0ZWQgYnkgZGVmYXVsdC4gV2hlbiBjcmVhdGluZyBhIG5ldyBzdmcgcGFydCB5b3UgY2FuIHNldCBpdCBhcyBkZWZhdWx0IHBhcnQsIHNvIGFsbCBhY3Rpb25zXHJcbiAqIGxpa2UgaW5zZXJ0aW9ucyB3aWxsIGJlIGV4ZWN1dGVkIG9uIHRoZSBkZWZhdWx0IHBhcnQgaWYgdGhlcmUgaXMgbm8gb3RoZXIgcGFydCBhcyBhcmd1bWVudC5cclxuICovXHJcbnZhciBTVkdHZW5lcmljU2hhcGUgPSByZXF1aXJlKCcuL3N2Z1NoYXBlJyk7XHJcbnJlcXVpcmUoJy4vZHJhZ2dhYmxlJyk7XHJcbnZhciBzaGFwZXMgPSByZXF1aXJlKCcuL2VsZW1lbnRzJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyk7XHJcblxyXG52YXIgZG9tID0gdXRpbC5kb207XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxudmFyIEhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyJyk7XHJcblxyXG52YXIgTkFNRVNQQUNFX1NWRyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcbnZhciBOQU1FU1BBQ0VfWExJTksgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XHJcblxyXG52YXIgaW5zdGFuY2VzID0ge307XHJcblxyXG4vKipcclxuICogVGhlIGNvbnN0cnVjdG9yIGluaXRpYWxpemVzIGEgbmV3IFNWRyBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gY29udGFpbmVySWQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBhY2NlcHRzIHRoZSBjb250YWluZXJJZCBlaXRoZXIgYXMgc2VsZWN0b3IgJyNjb250YWluZXJJZCcgb3IgYXMgaWQgc3RyaW5nICdjb250YWluZXJJZCcuXHJcbiAqXHJcbiAqIFRoZSBpZCBvZiB0aGUgbncgU1ZHIGVsZW1lbnQgd2lsbCBiZSB0aGUgY29udGFpbmVySWQgd2l0aCB0aGUgc3VmZml4ICdfc3ZnJyAtPiAnY29udGFpbmVySWRfc3ZnJy5cclxuICpcclxuICogQXR0cmlidXRlcyBvZiB0aGUgbmV3IFNWRyBlbGVtbnQgY2FuIGJlIHNldCB0aHJvdWdoIHRoZSBjb25zdHJ1Y3RvciBhcmd1bWVudCAnY2ZnJy5cclxuICpcclxuICogVGhlIFNWRyBjYW4gYmUgc2VwZXJhdGVkIGluIG11bHRpcGxlIHBhcnRzIHNvIHlvdSBjYW4gZWFzaWx5IGFwcGVuZCBlbGVtZW50cyB0byB0aGUgZGlmZmVyZW50IHBhcnQuXHJcbiAqIFRoZSBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgJ3Jvb3QnIHBhcnQgYXMgZGVmYXVsdC5cclxuICpcclxuICogQHBhcmFtIGNvbnRhaW5lcklkXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgU1ZHID0gZnVuY3Rpb24oY29udGFpbmVySWQsIGNmZykge1xyXG4gICAgaWYoISh0aGlzIGluc3RhbmNlb2YgU1ZHKSkge1xyXG4gICAgICAgIHJldHVybiBTVkcuZ2V0KGNvbnRhaW5lcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBjZmcgPSBjZmcgfHwge307XHJcblxyXG4gICAgLy9HZXQgaWQgZnJvbSBzZWxlY3RvciBpZiBpdHMgYW4gc2VsZWN0b3JcclxuICAgIHRoaXMuY29udGFpbmVySWQgPSBkb20uZ2V0UmF3SWQoY29udGFpbmVySWQpO1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJC5xQ2FjaGUoJyMnK3RoaXMuY29udGFpbmVySWQpLmdldCgwKTtcclxuXHJcbiAgICBpZighdGhpcy4kY29udGFpbmVyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQXR0ZW1wdCB0byBpbml0aWF0ZSBzdmcgc3RhZ2UgZm9yIGludmFsaWQgY29udGFpbmVySWQ6ICcrdGhpcy5jb250YWluZXJJZCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ZnSWQgPSB0aGlzLmNvbnRhaW5lcklkKydfc3ZnJztcclxuXHJcbiAgICAvLyBDcmVhdGUgU1ZHIHJvb3QgZWxlbWVudCB3aXRoIGdpdmVuIHNldHRpbmdzLlxyXG4gICAgdGhpcy5yb290ID0gbmV3IHNoYXBlcy5TdmcodGhpcywge2lkIDogdGhpcy5zdmdJZH0pO1xyXG5cclxuICAgIGNmZy5oZWlnaHQgPSBjZmcuaGVpZ2h0IHx8ICcxMDAlJztcclxuICAgIGNmZy53aWR0aCA9IGNmZy53aWR0aCAgfHwgJzEwMCUnO1xyXG5cclxuICAgIC8vIFNldCBjZmcgdmFsdWVzIGFzIHN2ZyByb290IGF0dHJpYnV0ZXNcclxuICAgIHRoaXMucm9vdC5hdHRyKGNmZyk7XHJcblxyXG4gICAgLy8gQXBwZW5kIHRoZSBzdmcgcm9vdCBlbGVtZW50IHRvIHRoZSBjb250YWluZXJub2RlXHJcbiAgICBkb20uYXBwZW5kU1ZHRWxlbWVudCh0aGlzLiRjb250YWluZXIsIHRoaXMucm9vdCk7XHJcblxyXG4gICAgLy8gVGhlIHJvb3QgcGFydCBpcyB0aGUgc3ZnIGVsZW1lbnQgaXRzZWxmXHJcbiAgICB0aGlzLnN2Z1BhcnRzID0geydyb290Jzp0aGlzLnJvb3R9O1xyXG4gICAgdGhpcy5kZWZhdWx0UGFydCA9IHRoaXMucm9vdDtcclxuXHJcbiAgICBpbnN0YW5jZXNbdGhpcy5zdmdJZF0gPSB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHN2ZyByb290IGRvbU5vZGUuXHJcbiAqIEByZXR1cm5zIHsqfSBzdmcgcm9vdCBkb21Ob2RlXHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKHRoaXMucm9vdCkgPyB0aGlzLnJvb3QuaW5zdGFuY2UoKSA6IHVuZGVmaW5lZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgY2FjaGVkIGpRdWVyeSBvYmplY3Qgb2YgdGhlIHJvb3Qgbm9kZS5cclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLiQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLnFDYWNoZSgnIycrdGhpcy5zdmdJZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB1c2VkIGZvciBpbXBvcnRpbmcgZGlhZ3JhbXMgaW50byB0aGUgc3ZnIGluc3RhbmNlLlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5zZXRSb290ID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdmFyIG5ld0lkID0gZG9tLmdldEF0dHJpYnV0ZXMoZWxlbWVudClbJ2lkJ107XHJcbiAgICB0aGlzLnJvb3QuaW5zdGFuY2UoZWxlbWVudCk7XHJcbiAgICB0aGlzLnJvb3QuYXR0cih7aWQgOiBuZXdJZH0pO1xyXG4gICAgaW5zdGFuY2VzW25ld0lkXSA9IHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgcm9vdCBlbGVtZW50IGFzIFNWR0VsZW1lbnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5nZXRSb290ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgZGVmYXVsdFBhcnRcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c3wqfSBjdXJyZW50IGRlZmF1bHRQYXJ0XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmdldERlZmF1bHRQYXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0UGFydDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgbmV3IHN2ZyBwYXJ0IHdoaWNoIGlzIHJlcHJlc2VudGVkIGJ5IGEgbmV3IGdyb3VwIHdpdGhpbiB0aGUgcm9vdC5cclxuICogVGhlIHBhcnQgaWQgaXMgY29tcG9zaXRlIG9mIHRoZSBzdmcgcm9vdCBpZCBhbmQgdGhlIHBhcnRJZC5cclxuICogQnkgc2V0dGluZyB0aGUgaXNEZWZhdWx0IGFyZ3VtZW50IGFzIHRydWUgdGhlIG5ldyBwYXJ0IHdpbGwgYmUgc2V0IGFzIGRlZmF1bHQgcGFydC5cclxuICogQHBhcmFtIHBhcnRJZFxyXG4gKiBAcGFyYW0gaXNEZWZhdWx0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5jcmVhdGVQYXJ0ID0gZnVuY3Rpb24ocGFydElkLCBpc0RlZmF1bHQpIHtcclxuICAgIC8vTmV3IHBhcnRzIGFyZSBhbHdheXMgYWRkZWQgdG8gdGhlIHJvb3QgcGFydFxyXG4gICAgdGhpcy5zdmdQYXJ0c1twYXJ0SWRdID0gdGhpcy5nKHtpZDogdGhpcy5zdmdJZCsnXycrcGFydElkLCBwYXJlbnRQYXJ0OiAncm9vdCd9KTtcclxuICAgIGlmKGlzRGVmYXVsdCkge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRJZF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5zdmdQYXJ0c1twYXJ0SWRdO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5wYXJ0ID0gZnVuY3Rpb24oaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnN2Z1BhcnRzW2lkXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIHN2ZyBlbGVtZW50IHRvIHRoZSBnaXZlbiBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5hZGRUb1BhcnQgPSBmdW5jdGlvbihwYXJ0LCBlbGVtZW50KSB7XHJcbiAgICB0aGlzLmFkZFRvR3JvdXAodGhpcy5zdmdQYXJ0c1twYXJ0XSwgZWxlbWVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZCB0byBhcHBlbmQgb3IgcHJlcGVuZCBlbGVtZW50cyB3aXRoIHRleHQgdG8gdGhlIHN2ZyByb290LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Sb290ID0gZnVuY3Rpb24oZWxlbWVudCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQodGhpcy5nZXRSb290KCksIGVsZW1lbnQsIHRleHQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gYXBwZW5kL3ByZXBlbmQgZWxlbWVudHMgd2l0aCB0ZXh0IHRvIGEgZ2l2ZW4gKG9yIGRlZmF1bHQpIHN2ZyBwYXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0gZWxlbWVudFxyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcGFyYW0gcHJlcGVuZFxyXG4gKiBAcGFyYW0gdGV4dFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZWxlbWVudCwgcGFydCwgcHJlcGVuZCwgdGV4dCkge1xyXG4gICAgcGFydCA9IHBhcnQgfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgZWxlbWVudC5wYXJlbnQgPSBwYXJ0O1xyXG4gICAgaWYocHJlcGVuZCkge1xyXG4gICAgICAgIHJldHVybiBkb20ucHJlcGVuZFNWR0VsZW1lbnQocGFydCwgZWxlbWVudCwgdGV4dCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBkb20uYXBwZW5kU1ZHRWxlbWVudChwYXJ0LCBlbGVtZW50LCB0ZXh0KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBvcnRzIGFuIHhtbCBkb2N1bWVudCB0byB0aGUgZ2l2ZW4gc3ZnIHBhcnQuXHJcbiAqIEBwYXJhbSBlbGVtZW50WE1MXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihzdmdTdHIsIHBhcnQsIHByZXBlbmQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiBTVkcuZ2V0KGRvbS5pbXBvcnRTVkcocGFydCwgc3ZnU3RyLCBwcmVwZW5kKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFJlY3Qgd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5SZWN0KHRoaXMsIGNmZyksIHBhcnQpO1xyXG59O1xyXG5cclxuU1ZHLnByb3RvdHlwZS5oZWxwZXIgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIGlmKCF0aGlzLl9oZWxwZXIpIHtcclxuICAgICAgICB0aGlzLl9oZWxwZXIgPSBuZXcgSGVscGVyKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2hlbHBlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgVGV4dCB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLnRleHQgPSBmdW5jdGlvbih0ZXh0LCBjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLlRleHQodGhpcywgY2ZnKSwgcGFydCwgZmFsc2UpLmNvbnRlbnQodGV4dCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLnRzcGFuID0gZnVuY3Rpb24odGV4dCwgY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5UU3Bhbih0aGlzLCBjZmcpLCBwYXJ0LCBmYWxzZSkuY29udGVudCh0ZXh0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuZCByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBzdmcgQ2lyY2xlIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuY2lyY2xlID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICBwYXJ0ID0gdGhpcy5zdmdQYXJ0c1twYXJ0XSB8fCB0aGlzLmdldERlZmF1bHRQYXJ0KCk7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQobmV3IHNoYXBlcy5DaXJjbGUodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIENpcmNsZSB3aXRoIHRoZSBnaXZlbiBzZXR0aW5ncyB0byB0aGUgZ2l2ZW4gKG9yIGRlZmF1bHQpIHBhcnQuXHJcbiAqIEBwYXJhbSBjZmdcclxuICogQHBhcmFtIHBhcnRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5TVkcucHJvdG90eXBlLmVsbGlwc2UgPSBmdW5jdGlvbihjZmcsIHBhcnQpIHtcclxuICAgIHBhcnQgPSB0aGlzLnN2Z1BhcnRzW3BhcnRdIHx8IHRoaXMuZ2V0RGVmYXVsdFBhcnQoKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChuZXcgc2hhcGVzLkVsbGlwc2UodGhpcywgY2ZnKSwgcGFydCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIEdyb3VwIHdpdGggdGhlIGdpdmVuIHNldHRpbmdzIHRvIHRoZSBnaXZlbiAob3IgZGVmYXVsdCkgcGFydC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuZyA9IGZ1bmN0aW9uKGNmZykge1xyXG4gICAgdmFyIGNmZyA9IGNmZyB8fHt9O1xyXG5cclxuICAgIHZhciBwYXJlbnRQYXJ0ID0gdGhpcy5zdmdQYXJ0c1tjZmcucGFyZW50UGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG5cclxuICAgIGRlbGV0ZSBjZmcucGFydDtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB0aGlzLmFkZChuZXcgc2hhcGVzLkdyb3VwKHRoaXMsIGNmZyksIHBhcmVudFBhcnQpO1xyXG5cclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMTtpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRUb0dyb3VwOiAnK2dyb3VwLmF0dHIoJ2lkJykrJyAtICcrIGFyZ3VtZW50c1tpXS5hdHRyKCdpZCcpKTtcclxuICAgICAgICAgICAgZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3JvdXA7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmRzIGFuIHN2ZyBlbGVtZW50IG90IHRoZSBnaXZlbiBncm91cC5cclxuICogQHBhcmFtIGNmZ1xyXG4gKiBAcGFyYW0gcGFydFxyXG4gKiBAcmV0dXJucyB7Kn1cclxuICovXHJcblNWRy5wcm90b3R5cGUuYWRkVG9Hcm91cCA9IGZ1bmN0aW9uKGdyb3VwLCBlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYob2JqZWN0LmlzQXJyYXkoZWxlbWVudCkpIHtcclxuICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBvYmplY3QuZWFjaChlbGVtZW50LCBmdW5jdGlvbihpbmRleCwgdmFsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRvbS5hcHBlbmRTVkdFbGVtZW50KGdyb3VwLmluc3RhbmNlKCksIGVsZW1lbnQpKTtcclxuICAgICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZG9tLmFwcGVuZFNWR0VsZW1lbnQoZ3JvdXAuaW5zdGFuY2UoKSwgZWxlbWVudCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbmQgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgc3ZnIFBhdGggd2l0aCB0aGUgZ2l2ZW4gc2V0dGluZ3MgdG8gdGhlIGdpdmVuIChvciBkZWZhdWx0KSBwYXJ0LlxyXG4gKiBAcGFyYW0gY2ZnXHJcbiAqIEBwYXJhbSBwYXJ0XHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHLnByb3RvdHlwZS5wYXRoID0gZnVuY3Rpb24oY2ZnLCBwYXJ0KSB7XHJcbiAgICB2YXIgcGFydCA9IHRoaXMuc3ZnUGFydHNbcGFydF0gfHwgdGhpcy5nZXREZWZhdWx0UGFydCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKG5ldyBzaGFwZXMuUGF0aCh0aGlzLCBjZmcpLCBwYXJ0KTtcclxufTtcclxuXHJcblNWRy5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcclxuICAgICQodGhpcy5yb290Lmluc3RhbmNlKCkpLmVtcHR5KCk7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmFzU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290LnRvU3RyaW5nKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBjcmVhdGVzIGFuIFNWR0VsZW1lbnQgb3V0IG9mIHRoZSBnaXZlbiBpZCBzZWxlY3RvciBlbGVtZW50LlxyXG4gKiBAcGFyYW0gc2VsZWN0b3JcclxuICogQHJldHVybnMge1NWR0VsZW1lbnR8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c31cclxuICovXHJcblNWRy5nZXQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgaWYoc2VsZWN0b3IuU1ZHRWxlbWVudCkge1xyXG4gICAgICAgIHJldHVybiBzZWxlY3RvcjtcclxuICAgIH1cclxuXHJcbiAgICBpZihvYmplY3QuaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgJG5vZGUgPSAkKGRvbS5nZXRJZFNlbGVjdG9yKHNlbGVjdG9yKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgICRub2RlID0gJChzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoISRub2RlLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybignY2FsbCBTVkcuZ2V0IG9uIGEgbm9uIGV4aXN0aW5nIG5vZGU6ICcrc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH0gZWxzZSBpZigkbm9kZS5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgLy9SZXR1cm4gbGlzdCBvZiBTVkdFbGVtZW50c1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICAkbm9kZS5lYWNoKGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChTVkcuZ2V0KHRoaXMpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL1JldHVybiBzaW5nbGUgU1ZnRWxlbWVudFxyXG4gICAgICAgIHZhciAkc3ZnUm9vdE5vZGUgPSAkKCRub2RlLmdldCgwKS5vd25lclNWR0VsZW1lbnQpO1xyXG4gICAgICAgIGlmKCRzdmdSb290Tm9kZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHN2Z0luc3RhbmNlID0gaW5zdGFuY2VzWyRzdmdSb290Tm9kZS5hdHRyKCdpZCcpXTtcclxuICAgICAgICAgICAgcmV0dXJuIFNWRy5fc3ZnSW5zdGFuY2UoJG5vZGUsIHN2Z0luc3RhbmNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NhbGwgU1ZHLmdldCBvbiBub2RlIHdpdGggbm8gc3ZnIHJvb3QnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkcuX3N2Z0luc3RhbmNlID0gZnVuY3Rpb24oJG5vZGUsIHN2Zykge1xyXG4gICAgdmFyIFNWR1NoYXBlID0gU1ZHLmdldFNoYXBlQnlOYW1lKCRub2RlLmdldCgwKS5ub2RlTmFtZSk7XHJcbiAgICByZXR1cm4gKFNWR1NoYXBlKSA/IG5ldyBTVkdTaGFwZShzdmcpLmluc3RhbmNlKCRub2RlLmdldCgwKSkgOiBuZXcgU1ZHR2VuZXJpY1NoYXBlKCRub2RlLmdldCgwKSwgc3ZnKTtcclxufTtcclxuXHJcblNWRy5nZXRTaGFwZUJ5TmFtZSA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHZhciByZXN1bHQgPSBzaGFwZXNbdHlwZS50b0xvd2VyQ2FzZSgpXTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5TVkcucHJvdG90eXBlLmdldCA9IFNWRy5nZXQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNWRztcclxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3V0aWwnKTtcclxudmFyIG9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0Jyk7XHJcbnZhciBTVkdFbGVtZW50ID0gcmVxdWlyZSgnLi9zdmdFbGVtZW50Jyk7XHJcblxyXG52YXIgTkFNRVNQQUNFX1NWRyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcbnZhciBOQU1FU1BBQ0VfWExJTksgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XHJcbnZhciBTVkdfVkVSU0lPTiA9ICcxLjEnO1xyXG5cclxudmFyIFNWR1Jvb3QgPSBmdW5jdGlvbihzdmcsIGNmZykge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgY2ZnWyd4bWxucyddID0gTkFNRVNQQUNFX1NWRztcclxuICAgIGNmZ1sneG1sbnM6eGxpbmsnXSA9IE5BTUVTUEFDRV9YTElOSztcclxuICAgIGNmZ1sndmVyc2lvbiddID0gU1ZHX1ZFUlNJT047XHJcbiAgICBTVkdFbGVtZW50LmNhbGwodGhpcywgJ3N2ZycsIHN2ZywgY2ZnKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHUm9vdCwgU1ZHRWxlbWVudCk7XHJcblxyXG5TVkdSb290LnByb3RvdHlwZS54ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiAodmFsdWUpID8gdGhpcy5hdHRyTnVtYmVyKCd4JywgdmFsdWUpIDogdGhpcy5hdHRyTnVtYmVyKCd4JykgfHwgMCA7XHJcbn07XHJcblxyXG5TVkdSb290LnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiAodmFsdWUpID8gdGhpcy5hdHRyTnVtYmVyKCd5JywgdmFsdWUpIDogdGhpcy5hdHRyTnVtYmVyKCd5JykgfHwgMCA7XHJcbn07XHJcblxyXG5TVkdSb290LnByb3RvdHlwZS5nZXRDZW50ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogdGhpcy54KCkgKyBNYXRoLmZsb29yKHRoaXMud2lkdGgoKSAvIDIpLFxyXG4gICAgICAgIHk6IHRoaXMueSgpICsgTWF0aC5mbG9vcih0aGlzLmhlaWdodCgpIC8gMilcclxuICAgIH07XHJcbn07XHJcblxyXG5TVkdSb290LnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoIXZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgpLmhlaWdodCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ2hlaWdodCcsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1Jvb3QucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCF2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiQoKS53aWR0aCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ3dpZHRoJywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdSb290OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdCcpO1xyXG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0nKTtcclxuXHJcbnZhciBTVkdFbGVtZW50ID0gcmVxdWlyZSgnLi9TVkdFbGVtZW50Jyk7XHJcblxyXG52YXIgU1ZHU2hhcGUgPSBmdW5jdGlvbihuYW1lLCBzdmdSb290LCBjZmcsIGF0dHJpYnV0ZVNldHRlcikge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgdGhpcy5hdHRyaWJ1dGVTZXR0ZXIgPSBhdHRyaWJ1dGVTZXR0ZXIgfHwge307XHJcbiAgICB0aGlzLmF0dHJpYnV0ZVNldHRlci50cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybWF0aW9uQXR0cmlidXRlU2V0dGVyO1xyXG4gICAgU1ZHRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUsIHN2Z1Jvb3QsIGNmZywgYXR0cmlidXRlU2V0dGVyKTtcclxufTtcclxuXHJcbnV0aWwuaW5oZXJpdHMoU1ZHU2hhcGUsIFNWR0VsZW1lbnQpO1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zZm9ybWF0aW9uQXR0cmlidXRlU2V0dGVyID0gZnVuY3Rpb24odHJuYXNmb3JtYXRpb25TdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtKHRybmFzZm9ybWF0aW9uU3RyaW5nKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1hdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYoIXRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybSgpO1xyXG4gICAgfSBlbHNlIGlmKG9iamVjdC5pc1N0cmluZyh0aGlzLmF0dHJpYnV0ZXMudHJhbnNmb3JtKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy50cmFuc2Zvcm07XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudHJhbnNmb3JtZWRYID0gZnVuY3Rpb24ocHgpIHtcclxuICAgIHJldHVybiB0aGlzLnNjYWxlZFgodGhpcy50cmFuc2xhdGVkWChweCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zZm9ybWVkWSA9IGZ1bmN0aW9uKHB4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5zY2FsZWRZKHRoaXMudHJhbnNsYXRlZFkocHgpKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5zY2FsZWRYID0gZnVuY3Rpb24ocHgpIHtcclxuICAgIHJldHVybiBweCAqIHRoaXMuc2NhbGUoKVswXVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnNjYWxlZFkgPSBmdW5jdGlvbihweSkge1xyXG4gICAgcmV0dXJuIHB5ICogdGhpcy5zY2FsZSgpWzFdXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5nZXRUcmFuc2Zvcm1hdGlvbigpLnJvdGF0ZSh2YWwpO1xyXG5cclxuICAgIGlmKHJlc3VsdCBpbnN0YW5jZW9mIFRyYW5zZm9ybSkge1xyXG4gICAgICAgIC8vIFRoZSBzY2FsZSBzZXR0ZXIgcmV0dXJucyB0aGUgVHJhbnNmb3JtIGl0c2VsZiBvYmplY3Qgc28gd2UgcmVzZXQgdGhlIHNjYWxlXHJcbiAgICAgICAgLy8gdHJhbnNmb3JtIGF0dHJpYnV0ZSBpbiBkb20gKHNldHRlciB3YXMgY2FsbGVkKVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKCd0cmFuc2Zvcm0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gVGhlIGdldHRlciBqdXN0IHJldHVybnMgdGhlIHgseSB2YWx1ZXMgb2YgdGhlIHRyYW5zbGF0ZSB0cmFuc2Zvcm1hdGlvblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzeCwgc3kpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkuc2NhbGUoc3gsIHN5KTtcclxuXHJcbiAgICBpZihyZXN1bHQgaW5zdGFuY2VvZiBUcmFuc2Zvcm0pIHtcclxuICAgICAgICAvLyBUaGUgc2NhbGUgc2V0dGVyIHJldHVybnMgdGhlIFRyYW5zZm9ybSBpdHNlbGYgb2JqZWN0IHNvIHdlIHJlc2V0IHRoZSBzY2FsZVxyXG4gICAgICAgIC8vIHRyYW5zZm9ybSBhdHRyaWJ1dGUgaW4gZG9tIChzZXR0ZXIgd2FzIGNhbGxlZClcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSgndHJhbnNmb3JtJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFRoZSBnZXR0ZXIganVzdCByZXR1cm5zIHRoZSB4LHkgdmFsdWVzIG9mIHRoZSB0cmFuc2xhdGUgdHJhbnNmb3JtYXRpb25cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkudHJhbnNsYXRlKHgseSk7XHJcblxyXG4gICAgaWYocmVzdWx0IGluc3RhbmNlb2YgVHJhbnNmb3JtKSB7XHJcbiAgICAgICAgLy8gVGhlIHRybmFzbGF0ZSBzZXR0ZXIgcmV0dXJucyB0aGUgVHJhbnNmb3JtIG9iamVjdCBzbyB3ZSByZXNldCB0aGVcclxuICAgICAgICAvLyB0cmFuc2Zvcm0gYXR0cmlidXRlIGluIGRvbSAoc2V0dGVyIHdhcyBjYWxsZWQpXHJcbiAgICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoJ3RyYW5zZm9ybScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBUaGUgZ2V0dGVyIGp1c3QgcmV0dXJucyB0aGUgeCx5IHZhbHVlcyBvZiB0aGUgdHJhbnNsYXRlIHRyYW5zZm9ybWF0aW9uXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50cmFuc2xhdGVkID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkudHJhbnNsYXRlKCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB0cmFuc2xhdGUueCArIHBvc2l0aW9uLngsXHJcbiAgICAgICAgeSA6IHRyYW5zbGF0ZS55ICsgcG9zaXRpb24ueVxyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRyYW5zbGF0ZWRYID0gZnVuY3Rpb24ocHgpIHtcclxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uKCkudHJhbnNsYXRlKCk7XHJcbiAgICBweCA9IChvYmplY3QuaXNEZWZpbmVkKHB4KSkgPyBweCA6IDA7XHJcbiAgICByZXR1cm4gdHJhbnNsYXRlLnggKyBweDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS50cmFuc2xhdGVkWSA9IGZ1bmN0aW9uKHB5KSB7XHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy5nZXRUcmFuc2Zvcm1hdGlvbigpLnRyYW5zbGF0ZSgpO1xyXG4gICAgcHkgPSAob2JqZWN0LmlzRGVmaW5lZChweSkpID8gcHkgOiAwO1xyXG4gICAgcmV0dXJuIHRyYW5zbGF0ZS55ICsgcHk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuaGFzVHJhbnNmb3JtYXRpb24gPSBmdW5jdGlvbih0cmFuc2Zvcm1hdGlvbikge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZXMudHJhbnNmb3JtKSkge1xyXG4gICAgICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZCh0aGlzLmF0dHJpYnV0ZXMudHJhbnNmb3JtW3RyYW5zZm9ybWF0aW9uXSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gICAgcmV0dXJuIHRoaXMuc3R5bGUoJ2ZpbGwnLCBjb2xvcik7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuZmlsbE9wYWNpdHkgPSBmdW5jdGlvbihvcGFjaXR5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdHlsZSgnZmlsbC1vcGFjaXR5Jywgb3BhY2l0eSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuICAgIHJldHVybiB0aGlzLnN0eWxlKCdzdHJva2Utb3BhY2l0eScsIG9wYWNpdHkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnN0cm9rZSA9IGZ1bmN0aW9uKGNvbG9yLCB3aWR0aCkge1xyXG4gICAgaWYod2lkdGgpIHtcclxuICAgICAgICB0aGlzLnN0cm9rZVdpZHRoKHdpZHRoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnN0eWxlKCdzdHJva2UnLCBjb2xvcik7XHJcblxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnN0cm9rZURhc2hhcnJheSA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIGlmKCF0eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGUoJ3N0cm9rZS1kYXNoYXJyYXknKTtcclxuICAgIH1cclxuICAgIGlmKG9iamVjdC5pc1N0cmluZyh0eXBlKSkge1xyXG4gICAgICAgIHRoaXMuc3R5bGUoJ3N0cm9rZS1kYXNoYXJyYXknLCB0eXBlKTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnN0cm9rZURhc2hUeXBlID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYoIXR5cGUpIHtcclxuICAgICAgICBzd2l0Y2godGhpcy5zdHJva2VEYXNoYXJyYXkoKSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiNSw1XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgY2FzZSBcIjEwLDEwXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgY2FzZSBcIjIwLDEwLDUsNSw1LDEwXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnMSc6XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Ryb2tlRGFzaGFycmF5KFwiNSw1XCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJzInOlxyXG4gICAgICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cm9rZURhc2hhcnJheShcIjEwLDEwXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJzMnOlxyXG4gICAgICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cm9rZURhc2hhcnJheShcIjIwLDEwLDUsNSw1LDEwXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cm9rZURhc2hhcnJheShcIm5vbmVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuc3Ryb2tlV2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgcmV0dXJuIHV0aWwuYXBwLnBhcnNlTnVtYmVyU3RyaW5nKHRoaXMuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIHdpZHRoKSkgfHwgMDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAoIXRoaXMuZmlsbE9wYWNpdHkoKSB8fCB0aGlzLmZpbGxPcGFjaXR5KCkgPiAwKVxyXG4gICAgICAgICYmICghdGhpcy5zdHJva2VPcGFjaXR5KCkgfHwgdGhpcy5zdHJva2VPcGFjaXR5KCkgPiAwKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmZpbGxPcGFjaXR5KDApO1xyXG4gICAgdGhpcy5zdHJva2VPcGFjaXR5KDApO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihvcGFjaXR5KSB7XHJcbiAgICBvcGFjaXR5ID0gb3BhY2l0eSB8fCAxO1xyXG4gICAgdGhpcy5maWxsT3BhY2l0eShvcGFjaXR5KTtcclxuICAgIHRoaXMuc3Ryb2tlT3BhY2l0eShvcGFjaXR5KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIHRoZSBsb2NhdGlvbiBvZiBhIGdpdmVuIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBzdmcgZWxlbWVudC5cclxuICogICAgICBfdF9cclxuICogICAgfFxcICAgL3xcclxuICogIGwgfCAgYyAgfCByXHJcbiAqICAgIHwvX19fXFx8XHJcbiAqICAgICAgIGJcclxuICogQHBhcmFtIG5vZGVcclxuICogQHBhcmFtIHBvc2l0aW9uXHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldFJlbGF0aXZlTG9jYXRpb24gPSBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgLy9GaXJzdCB3ZSBjaGVjayBpZiB0aGUgcG9pbnQgbGllcyBkaXJlY3Qgb24gdGhlIGJvdW5kYXJ5XHJcbiAgICBpZihwb3NpdGlvbi54ID09PSB0aGlzLngoKSkge1xyXG4gICAgICAgIHJldHVybiAnbGVmdCc7XHJcbiAgICB9IGVsc2UgaWYocG9zaXRpb24ueSA9PT0gdGhpcy55KCkpIHtcclxuICAgICAgICByZXR1cm4gJ3RvcCc7XHJcbiAgICB9IGVsc2UgaWYocG9zaXRpb24ueCA9PT0gdGhpcy5nZXRSaWdodFgoKSkge1xyXG4gICAgICAgIHJldHVybiAncmlnaHQnO1xyXG4gICAgfSBlbHNlIGlmKHBvc2l0aW9uLnkgPT09IHRoaXMuZ2V0Qm90dG9tWSgpKSB7XHJcbiAgICAgICAgcmV0dXJuICdib3R0b20nO1xyXG4gICAgfVxyXG5cclxuICAgIC8vSWYgaXRzIG5vdCBvbiB0aGUgYm91bmRhcnkgd2UgY2hlY2sgdGhlIGxvY2F0aW9uIGJ5IG1lYW5zIG9mIHRoZSBsaW5lIGdyYWRpZW50XHJcbiAgICB2YXIgY2VudGVyID0gdGhpcy5nZXRDZW50ZXIoKTtcclxuICAgIHZhciBnID0gdXRpbC5tYXRoLkxpbmUuY2FsY0dyYWRpZW50KGNlbnRlciwgcG9zaXRpb24pO1xyXG4gICAgaWYocG9zaXRpb24ueSA8IGNlbnRlci55KSB7IC8vcG9zaXRpb24gb3ZlciBlbGVtZW50Y2VudGVyXHJcbiAgICAgICAgaWYgKHBvc2l0aW9uLnggPj0gY2VudGVyLngpIHsgLy9wb3NpdGlvbiByaWdodCAob3IgZXEpIG9mIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICAgICAgcmV0dXJuIChnID4gLTEpID8gJ3JpZ2h0JyA6ICd0b3AnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZyA8IDEpIHsvL3Bvc2l0aW9uIGxlZnQgYW5kIG92ZXIgb2YgZWxlbWVudGNlbnRlclxyXG4gICAgICAgICAgICByZXR1cm4gKGcgPCAxKSA/ICdsZWZ0JyA6ICd0b3AnO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZihwb3NpdGlvbi54ID49IGNlbnRlci54KSB7IC8vcG9zaXRpb24gdW5kZXIgKG9yIGVxKSBhbmQgcmlnaHQgKG9yIGVxKSBvZiBlbGVtZW50Y2VudGVyXHJcbiAgICAgICAgcmV0dXJuIChnIDwgMSkgPyAncmlnaHQnIDogJ2JvdHRvbSc7XHJcbiAgICB9IGVsc2UgeyAvL3Bvc2l0aW9uIHVuZGVyIGFuZCBsZWZ0IG9mIGVsZW1lbnRjZW50ZXJcclxuICAgICAgICByZXR1cm4gKGcgPCAtMSkgPyAnYm90dG9tJyA6ICdsZWZ0JztcclxuICAgIH1cclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS54ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuICh3aXRoU3Ryb2tlKSA/IHRoaXMudHJhbnNsYXRlZFgodGhpcy5fZ2V0WCgpKSAtIHRoaXMuc2NhbGVkWCh0aGlzLnN0cm9rZVdpZHRoKCkpIC8gMiA6IHRoaXMudHJhbnNsYXRlZFgodGhpcy5fZ2V0WCgpKTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fZ2V0WCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUueSA9IGZ1bmN0aW9uKHdpdGhTdHJva2UpIHtcclxuICAgIHJldHVybiAod2l0aFN0cm9rZSkgPyB0aGlzLnRyYW5zbGF0ZWRZKHRoaXMuX2dldFkoKSkgLSB0aGlzLnNjYWxlZFkodGhpcy5zdHJva2VXaWR0aCgpKSAvIDIgOiB0aGlzLnRyYW5zbGF0ZWRZKHRoaXMuX2dldFkoKSk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuX2dldFkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC54KHdpdGhTdHJva2UpLFxyXG4gICAgICAgIHkgOiB0aGF0Lnkod2l0aFN0cm9rZSlcclxuICAgIH07XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUudG9wTGVmdCA9IGZ1bmN0aW9uKHdpdGhTdHJva2UpIHtcclxuICAgIHJldHVybiB0aGlzLnBvc2l0aW9uKHdpdGhTdHJva2UpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLnRvcFJpZ2h0ID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogdGhhdC5nZXRSaWdodFgod2l0aFN0cm9rZSksXHJcbiAgICAgICAgeSA6IHRoYXQueSh3aXRoU3Ryb2tlKVxyXG4gICAgfTtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5ib3R0b21SaWdodCA9IGZ1bmN0aW9uKHdpdGhTdHJva2UpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRoYXQuZ2V0UmlnaHRYKHdpdGhTdHJva2UpLFxyXG4gICAgICAgIHkgOiB0aGF0LmdldEJvdHRvbVkod2l0aFN0cm9rZSlcclxuICAgIH07XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuYm90dG9tTGVmdCA9IGZ1bmN0aW9uKHdpdGhTdHJva2UpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeCA6IHRoYXQueCh3aXRoU3Ryb2tlKSxcclxuICAgICAgICB5IDogdGhhdC5nZXRCb3R0b21ZKHdpdGhTdHJva2UpXHJcbiAgICB9O1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldENlbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGMgPSB7XHJcbiAgICAgICAgeDogdGhpcy54KCkgKyBNYXRoLmZsb29yKHRoaXMud2lkdGgoKSAvIDIpLFxyXG4gICAgICAgIHk6IHRoaXMueSgpICsgTWF0aC5mbG9vcih0aGlzLmhlaWdodCgpIC8gMilcclxuICAgIH07XHJcbiAgICByZXR1cm4gdXRpbC5tYXRoLnJvdGF0ZShjLCB0aGlzLnBvc2l0aW9uKCksIHRoaXMucm90YXRlKCkpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLm92ZXJsYXlzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBvYmplY3QuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKGluZGV4LCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmKHRoYXQub3ZlcmxheUNoZWNrKHBvc2l0aW9uKSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vVE8gYnJlYWsgdGhlIGVhY2ggbG9vcFxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy9jb25zb2xlLmxvZygncmVzdWx0OicrcmVzdWx0KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBpcyBhIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gZm9yIGNoZWNraW5nIGlmIGEgZ2l2ZW4gcG9zaXRpb24gbGllcyB3aXRoaW4gdGhlIHN2Z0VsZW1lbnQuXHJcbiAqIFRoaXMgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IHNoYXBlcyBsaWtlIGNpcmNsZXMgYW5kIGVsbGlwc2UuLlxyXG4gKi9cclxuU1ZHU2hhcGUucHJvdG90eXBlLm92ZXJsYXlDaGVjayA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICByZXR1cm4gcG9zaXRpb24ueCA+PSB0aGlzLngoKSAmJiBwb3NpdGlvbi54IDw9IHRoaXMuZ2V0UmlnaHRYKClcclxuICAgICAgICAmJiBwb3NpdGlvbi55ID49IHRoaXMueSgpICYmIHBvc2l0aW9uLnkgPD0gdGhpcy5nZXRCb3R0b21ZKCk7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKGR4LCBkeSkge1xyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMudHJhbnNsYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0ZSh0cmFuc2xhdGUueCArIGR4LCB0cmFuc2xhdGUueSArIGR5KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLm1vdmVUbyA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBwID0gdXRpbC5tYXRoLmdldFBvaW50KHgseSk7XHJcblxyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMudHJhbnNsYXRlKCk7XHJcbiAgICBpZih0aGlzLngoKSAhPT0gcC54IHx8IHRoaXMueSgpICE9PSBwLnkpIHtcclxuICAgICAgICAvL1RPRE86IHRoaXMgZG9lcyBub3QgY29uc2lkZXIgeC95IGF0dHJpYnV0ZSBzZXR0aW5nc1xyXG4gICAgICAgIHRoaXMudHJhbnNsYXRlKHApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUubW92ZVggPSBmdW5jdGlvbih4KSB7XHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIGlmKHRyYW5zbGF0ZS54ICE9PSB4KSB7XHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGUoeCwgdHJhbnNsYXRlLnkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUubW92ZVkgPSBmdW5jdGlvbih5KSB7XHJcbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy50cmFuc2xhdGUoKTtcclxuICAgIGlmKHRyYW5zbGF0ZS55ICE9PSB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRlKHRyYW5zbGF0ZS54LCB5KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5vdGU6IHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBnZXRCQm94IGRpZmZlcnMgYmV0d2VlbiBicm93c2VycyBzb21lIGFkZCB0aGUgc3Jva2Utd2lkdGggYW5kIHNvbWUgZG8gbm90IGFkZCBzdHJva2Utd2lkdGhcclxuICovXHJcblNWR1NoYXBlLnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoKG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmIHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlZFkodGhpcy5fZ2V0SGVpZ2h0KCkpICsgdGhpcy5zY2FsZWRZKHRoaXMuc3Ryb2tlV2lkdGgoKSk7XHJcbiAgICB9IGVsc2UgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsdWUpIHx8IChvYmplY3QuaXNCb29sZWFuKHZhbHVlKSAmJiAhdmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGVkWSh0aGlzLl9nZXRIZWlnaHQoKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldEhlaWdodCh2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuX2dldEhlaWdodCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QkJveCgpLmhlaWdodDtcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5fc2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL0FCU1RSQUNUXHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYoKG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmIHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlZFgodGhpcy5fZ2V0V2lkdGgoKSkgKyB0aGlzLnNjYWxlZFgodGhpcy5zdHJva2VXaWR0aCgpKTtcclxuICAgIH0gZWxzZSBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkgfHwgKG9iamVjdC5pc0Jvb2xlYW4odmFsdWUpICYmICF2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY2FsZWRYKHRoaXMuX2dldFdpZHRoKCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLl9zZXRXaWR0aCh2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuX2dldFdpZHRoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCQm94KCkud2lkdGg7XHJcbn07XHJcblxyXG5TVkdTaGFwZS5wcm90b3R5cGUuX3NldFdpZHRoID0gZnVuY3Rpb24oKSB7XHJcbiAgIC8vQUJTVFJBQ1RcclxufTtcclxuXHJcblNWR1NoYXBlLnByb3RvdHlwZS5nZXRCb3R0b21ZID0gZnVuY3Rpb24od2l0aFN0cm9rZSkge1xyXG4gICAgcmV0dXJuIHRoaXMueSh3aXRoU3Ryb2tlKSArIHRoaXMuaGVpZ2h0KHdpdGhTdHJva2UpO1xyXG59O1xyXG5cclxuU1ZHU2hhcGUucHJvdG90eXBlLmdldFJpZ2h0WCA9IGZ1bmN0aW9uKHdpdGhTdHJva2UpIHtcclxuICAgIHJldHVybiB0aGlzLngod2l0aFN0cm9rZSkgKyB0aGlzLndpZHRoKHdpdGhTdHJva2UpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdTaGFwZTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG5cclxudmFyIERFRkFVTFRfRk9OVF9TSVpFID0gMTE7XHJcbnZhciBERUZBVUxUX0ZPTlRfRkFNSUxZID0gXCJIZWx2ZXRpY2FcIjsgLy9WZXJkYW5hLCBBcmlhbCwgc2Fucy1zZXJpZiA/XHJcbnZhciBERUZBVUxUX1RFWFRfQU5DSE9SID0gXCJzdGFydFwiO1xyXG52YXIgREVGQVVMVF9ET01JTkFOVF9CQVNFTElORSA9IFwiaGFuZ2luZ1wiO1xyXG5cclxudmFyIERFRkFVTFRfU1BBTl9QQURESU5HID0gMDtcclxuXHJcbnZhciBTVkdUZXh0ID0gZnVuY3Rpb24oc3ZnUm9vdCwgY2ZnLCBhdHRyaWJ1dGVTZXR0ZXIpIHtcclxuICAgIGNmZyA9IGNmZyB8fCB7fTtcclxuICAgIGNmZ1snZm9udC1mYW1pbHknXSA9IGNmZ1snZm9udC1zaXplJ10gfHwgREVGQVVMVF9GT05UX0ZBTUlMWTtcclxuICAgIGNmZ1snZm9udC1zaXplJ10gPSBjZmdbJ2ZvbnQtc2l6ZSddIHx8IERFRkFVTFRfRk9OVF9TSVpFO1xyXG4gICAgY2ZnWyd0ZXh0LWFuY2hvciddID0gY2ZnWyd0ZXh0LWFuY2hvciddIHx8IERFRkFVTFRfVEVYVF9BTkNIT1I7XHJcbiAgICBjZmdbJ2RvbWluYW50LWJhc2VsaW5lJ10gPSBjZmdbJ2RvbWluYW50LWJhc2VsaW5lJ10gfHwgREVGQVVMVF9ET01JTkFOVF9CQVNFTElORTtcclxuXHJcbiAgICB0aGlzLnNwYW5QYWRkaW5nID0gY2ZnWydwYWRkaW5nJ10gfHwgREVGQVVMVF9TUEFOX1BBRERJTkc7XHJcblxyXG4gICAgU1ZHU2hhcGUuY2FsbCh0aGlzLCAndGV4dCcsIHN2Z1Jvb3QsIGNmZywgYXR0cmlidXRlU2V0dGVyKTtcclxuICAgIC8vVE9ETzogU3BhbiAvIG11bHRpIGxpbmUgdGV4dFxyXG59O1xyXG5cclxudXRpbC5pbmhlcml0cyhTVkdUZXh0LCBTVkdTaGFwZSk7XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5wYWRkaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgdGhpcy5zcGFuUGFkZGluZyA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuc2V0U3BhbkF0dHIoJ3gnLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5QYWRkaW5nO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZm9udEZhbWlseSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdmb250LWZhbWlseScsIHZhbHVlKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmZvbnRTaXplID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciByZXN1bHQgPSB0aGlzLmF0dHJOdW1iZXIoJ2ZvbnQtc2l6ZScsIHZhbHVlKTtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTcGFuQXR0cignZHknLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5zZXRTcGFuQXR0ciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgIHRoaXMuJCgpLmNoaWxkcmVuKCd0c3BhbicpLmF0dHIoa2V5LCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIChvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSkgPyB0aGlzLmF0dHJOdW1iZXIoJ3gnLCB2YWx1ZSkgOiB0aGlzLnRyYW5zbGF0ZWRYKHRoaXMuYXR0ck51bWJlcigneCcsIHZhbHVlKSkgfHwgMCA7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS55ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiAob2JqZWN0LmlzRGVmaW5lZCh2YWx1ZSkpID8gdGhpcy5hdHRyTnVtYmVyKCd5JywgdmFsdWUpIDogdGhpcy50cmFuc2xhdGVkWSh0aGlzLmF0dHJOdW1iZXIoJ3knLCB2YWx1ZSkpIHx8IDAgO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuZHggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0ck51bWJlcignZHgnLCB2YWx1ZSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5keSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyTnVtYmVyKCdkeScsIHZhbHVlKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbihkeCwgZHkpIHtcclxuICAgIFNWR1RleHQuc3VwZXJfLnByb3RvdHlwZS5tb3ZlLmFwcGx5KHRoaXMsIFtkeCwgZHldKTtcclxuICAgIHRoaXMuYWxpZ25CYWNrZ3JvdW5kKCk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICBTVkdUZXh0LnN1cGVyXy5wcm90b3R5cGUubW92ZVRvLmFwcGx5KHRoaXMsIFt4LCB5XSk7XHJcbiAgICB0aGlzLmFsaWduQmFja2dyb3VuZCgpO1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuY29udGVudCA9IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgIGlmKCF0ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHZhciBoZWlnaHQ7XHJcbiAgICB0aGlzLiQoKS5lbXB0eSgpO1xyXG4gICAgJC5lYWNoKHRleHQuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBpZihvYmplY3QuaXNEZWZpbmVkKHZhbHVlKSAmJiB2YWx1ZS50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgdFNwYW4gPSB0aGF0LnN2Zy50c3Bhbih2YWx1ZSkueCh0aGF0LnNwYW5QYWRkaW5nKTtcclxuICAgICAgICAgICAgdGhhdC5hcHBlbmQodFNwYW4pO1xyXG4gICAgICAgICAgICBpZihpbmRleCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRTcGFuLmR5KGhlaWdodCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSB0U3Bhbi5oZWlnaHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5nZXRUZXh0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gJyc7XHJcbiAgICB2YXIgJGNoaWxkcmVuID0gdGhpcy4kKCkuY2hpbGRyZW4oJ3RzcGFuJyk7XHJcbiAgICAkY2hpbGRyZW4uZWFjaChmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICByZXN1bHQgKz0gJCh0aGlzKS50ZXh0KCk7XHJcbiAgICAgICAgaWYoaW5kZXggIT0gJGNoaWxkcmVuLmxlbmd0aCAtMSkge1xyXG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuc3dpdGNoQW5jaG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICBzd2l0Y2godGhpcy5hbmNob3IoKSkge1xyXG4gICAgICAgIGNhc2UgJ3N0YXJ0JzpcclxuICAgICAgICAgICAgdGhpcy5lbmQoKTtcclxuICAgICAgICBjYXNlICdlbmQnOlxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5nZXRFeHRlbnRPZkNoYXIgPSBmdW5jdGlvbihjaGFyTnVtKSB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZSgpLmdldEV4dGVudE9mQ2hhcihjaGFyTnVtKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmdldENoYXJIZWlnaHQgPSBmdW5jdGlvbihjaGFyTnVtKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRFeHRlbnRPZkNoYXIoY2hhck51bSkuaGVpZ2h0O1xyXG59O1xyXG5cclxuU1ZHVGV4dC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmFuY2hvcignc3RhcnQnKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYW5jaG9yKCdlbmQnKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLm1pZGRsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYW5jaG9yKCdtaWRkbGUnKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLmFuY2hvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCd0ZXh0LWFuY2hvcicsIHZhbHVlKTtcclxufTtcclxuXHJcblNWR1RleHQucHJvdG90eXBlLnRTcGFuID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgIHJldHVybiB0aGlzLnN2Zy5nZXQodGhpcy4kKCkuY2hpbGRyZW4oJ3RzcGFuJykuZ2V0KGluZGV4KSk7XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5oYW5naW5nID0gZnVuY3Rpb24oaGFuZ2luZykge1xyXG4gICAgdmFyIGhhbmdpbmcgPSBvYmplY3QuaXNEZWZpbmVkKGhhbmdpbmcpID8gaGFuZ2luZyA6IHRydWU7XHJcbiAgICB2YXIgdmFsdWUgPSBoYW5naW5nID8gJ2hhbmdpbmcnIDogJ2Jhc2VsaW5lJztcclxuICAgIHRoaXMuYXR0cignZG9taW5hbnQtYmFzZWxpbmUnLCB2YWx1ZSk7XHJcbiAgICB2YXIgZmlyc3RTcGFuID0gdGhpcy50U3BhbigwKTtcclxuICAgIHZhciBkeSA9IChoYW5naW5nKSA/IDAgOiBmaXJzdFNwYW4uaGVpZ2h0KCkgKyB0aGlzLmdldEJCb3goKS55O1xyXG4gICAgZmlyc3RTcGFuLmR5KGR5KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5vdGU6IHRoZSBiYWNrZ3JvdW5kIHdvbid0IGFsaWduIHdoZW4gdGhlIHRleHQgaXMgZHJhZ2dlZC4gUGVyaGFwcyBhZGQgZHJhZyBob29rXHJcbiAqIEBwYXJhbSBjb2xvclxyXG4gKi9cclxuU1ZHVGV4dC5wcm90b3R5cGUuYmFja2dyb3VuZCA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgICB2YXIgc3ZnQmFja2dyb3VuZCA9IHRoaXMuZ2V0QmFja2dyb3VuZCgpO1xyXG4gICAgaWYoY29sb3IpIHtcclxuICAgICAgICBpZighc3ZnQmFja2dyb3VuZCkge1xyXG4gICAgICAgICAgICBzdmdCYWNrZ3JvdW5kID0gdGhpcy5zdmcucmVjdCh7J2NsYXNzJzondGV4dEJhY2tncm91bmQnfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN2Z0JhY2tncm91bmQuZmlsbChjb2xvcik7XHJcbiAgICAgICAgc3ZnQmFja2dyb3VuZC4kKCkuYWZ0ZXIodGhpcy4kKCkpO1xyXG4gICAgICAgIHRoaXMuYWxpZ25CYWNrZ3JvdW5kKCk7XHJcbiAgICB9IGVsc2UgaWYoc3ZnQmFja2dyb3VuZCkge1xyXG4gICAgICAgIHN2Z0JhY2tncm91bmQuZmlsbCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogIFRPRE86IHByb2JhYmx5IGp1c3Qgd29ya3MgZm9yIGhhbmdpbmcgdGV4dHMgYmVjYXVzZSBvZiB0aGUgb2Zmc2V0Li4uXHJcbiAqL1xyXG5TVkdUZXh0LnByb3RvdHlwZS5hbGlnbkJhY2tncm91bmQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzdmdCYWNrZ3JvdW5kID0gdGhpcy5nZXRCYWNrZ3JvdW5kKCk7XHJcbiAgICBpZihzdmdCYWNrZ3JvdW5kKSB7XHJcbiAgICAgICAgdmFyIGJnSGVpZ2h0ID0gdGhpcy5oZWlnaHQoKSArIHRoaXMuZ2V0QkJveCgpLnk7IC8vcmVtb3ZlIHRleHQgb2Zmc2V0XHJcbiAgICAgICAgc3ZnQmFja2dyb3VuZC5oZWlnaHQoYmdIZWlnaHQpLndpZHRoKHRoaXMud2lkdGgoKSkudHJhbnNsYXRlKHRoaXMueCgpLCB0aGlzLnkoKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5nZXRCYWNrZ3JvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZih0aGlzLmJhY2tncm91bmRTVkcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5iYWNrZ3JvdW5kU1ZHO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBwcmV2ID0gdGhpcy4kKCkucHJldigpO1xyXG4gICAgaWYocHJldi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdmFyIHN2Z0JhY2sgPSB0aGlzLnN2Zy5nZXQocHJldik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2dyb3VuZFNWRyA9IChzdmdCYWNrLmhhc0NsYXNzKCd0ZXh0QmFja2dyb3VuZCcpKSA/IHN2Z0JhY2sgOiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUZXh0LnByb3RvdHlwZS5kb21pbmFudEJhc2VsaW5lID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2RvbWluYW50LWJhc2VsaW5lJywgdmFsdWUpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdUZXh0OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC91dGlsJyk7XHJcbnZhciBvYmplY3QgPSB1dGlsLm9iamVjdDtcclxudmFyIERvbUVsZW1lbnQgPSByZXF1aXJlKCcuLi9kb20vZG9tRWxlbWVudCcpO1xyXG5cclxudmFyIFRyYW5zZm9ybSA9IGZ1bmN0aW9uKGRlZikge1xyXG4gICAgaWYodHlwZW9mIGRlZiAhPT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICAgICAgaWYob2JqZWN0LmlzU3RyaW5nKGRlZikpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXREZWZpbml0aW9uRnJvbVN0cmluZyhkZWYpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IGRlZjtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IHt9O1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXREZWZpbml0aW9uRnJvbVN0cmluZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZighdGhpcy5kZWZpbml0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXh0cmFjdCAndHJhbnNsYXRlKDIwMCAyMDApIHJvdGF0ZSg0NSA1MCA1MCknIHRvIFwidHJhbnNsYXRlXCIgXCIyMDAgMjAwXCIgXCIgcm90YXRlXCIgXCI0NSA1MCA1MFwiIFwiXCJcclxuICAgIHZhciB0cmFuc2Zvcm1hdGlvbnMgPSB2YWx1ZS5zcGxpdCgvW1xcKFxcKV0rLyk7XHJcbiAgICBmb3IodmFyIGkgPSAwO2kgPCB0cmFuc2Zvcm1hdGlvbnMubGVuZ3RoOyBpICs9IDIpIHtcclxuICAgICAgICB2YXIgdHJhbnNmb3JtYXRpb24gPSB0cmFuc2Zvcm1hdGlvbnNbaV0udHJpbSgpO1xyXG4gICAgICAgIGlmKHRyYW5zZm9ybWF0aW9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IERvbUVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWVGcm9tU3RyaW5nTGlzdCh0cmFuc2Zvcm1hdGlvbnNbaSsxXSk7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHByZWZlciBmbG9hdCB2YWx1ZXMgZm9yIGNhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlc1tqXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbal0gPSBwYXJzZUZsb2F0KHZhbHVlc1tqXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uW3RyYW5zZm9ybWF0aW9uXSA9IHZhbHVlcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICBmb3IodmFyIGtleSBpbiB0aGlzLmRlZmluaXRpb24pIHtcclxuICAgICAgICBpZih0aGlzLmRlZmluaXRpb24uaGFzT3duUHJvcGVydHkoKGtleSkpKSB7XHJcbiAgICAgICAgICAgIC8vIGZpcnN0IHdlIGFzc2FtYmxlIGFsbCB0cmFuc2Zvcm1hdGlvbnMgaW4gYW4gYXJyYXkgWyd0cmFuc2xhdGUoMzApJywncm90YXRlKDQ1IDUwIDUwKSddXHJcbiAgICAgICAgICAgIHZhciBzaW5nbGVUcmFuc2Zvcm1hdGlvbiA9IGtleSsnKCcrRG9tRWxlbWVudC5nZXRBdHRyaWJ1dGVTdHJpbmcodGhpcy5kZWZpbml0aW9uW2tleV0pKycpJztcclxuICAgICAgICAgICAgdmFsdWVzLnB1c2goc2luZ2xlVHJhbnNmb3JtYXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIG1lcmdlIHRoZSB0cmFuc2Zvcm1hdGlvbnMgdG8gb25lIGF0dHJpYnV0ZXN0cmluZ1xyXG4gICAgdmFyIHZhbHVlU3RyID0gRG9tRWxlbWVudC5nZXRBdHRyaWJ1dGVTdHJpbmcodmFsdWVzKTtcclxuXHJcbiAgICBpZih2YWx1ZVN0ci5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlU3RyO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGFueSB0cmFuc29ybWF0aW9ucyBzZXQgd2UganVzdCByZXR1cm4gYW4gZW1wdHkgc3RyaW5nXHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5oYXNUcmFuc2Zvcm1hdGlvbiA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgcmV0dXJuICh0eXBlb2YgdGhpcy5kZWZpbml0aW9uW2tleV0gIT09ICd1bmRlZmluZWQnKTtcclxufTtcclxuXHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgaWYob2JqZWN0LmlzRGVmaW5lZCh2YWwpKSB7XHJcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uLnJvdGF0ZSA9IHZhbDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbi5yb3RhdGUgfHwgMDtcclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzeCwgc3kpIHtcclxuICAgIHN5ID0gc3kgfHwgc3g7XHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHN4KSkge1xyXG4gICAgICAgIGlmKCF0aGlzLmRlZmluaXRpb24uc2NhbGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnNjYWxlID0gW3N4LCBzeV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnNjYWxlWzBdID0gc3g7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbi5zY2FsZVsxXSA9IHN5O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuZGVmaW5pdGlvbi5zY2FsZTtcclxuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW3Jlc3VsdFswXSwgcmVzdWx0WzBdXTtcclxuICAgICAgICB9IGVsc2UgaWYocmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHRbMF0sIHJlc3VsdFsxXV1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gWzEsMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgaWYoaW5kZXggPCAyICYmIHRoaXMuZGVmaW5pdGlvbi5zY2FsZSkge1xyXG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbi5zY2FsZVtpbmRleF0gPSB2YWx1ZTtcclxuICAgIH1cclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHAgPSB1dGlsLm1hdGguZ2V0UG9pbnQoeCx5KTtcclxuXHJcbiAgICBpZihvYmplY3QuaXNEZWZpbmVkKHApKSB7XHJcbiAgICAgICAgaWYoIXRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZSA9IFtwLngsIHAueV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZVswXSA9IHAueDtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLnRyYW5zbGF0ZVsxXSA9IHAueTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmKHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHggOiB0aGlzLmRlZmluaXRpb24udHJhbnNsYXRlWzBdLFxyXG4gICAgICAgICAgICAgICAgeSA6IHRoaXMuZGVmaW5pdGlvbi50cmFuc2xhdGVbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeCA6IDAsXHJcbiAgICAgICAgICAgICAgICB5IDogMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbCcpO1xyXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QnKTtcclxudmFyIFNWR1NoYXBlID0gcmVxdWlyZSgnLi9zdmdTaGFwZScpO1xyXG52YXIgU1ZHVGV4dCA9IHJlcXVpcmUoJy4vdGV4dCcpO1xyXG5cclxudmFyIERFRkFVTFRfRE9NSU5BTlRfQkFTRUxJTkUgPSAnaW5oZXJpdCdcclxuXHJcbnZhciBTVkdUU3BhbiA9IGZ1bmN0aW9uKHN2Z1Jvb3QsIGNmZykge1xyXG4gICAgY2ZnID0gY2ZnIHx8IHt9O1xyXG4gICAgY2ZnWydkb21pbmFudC1iYXNlbGluZSddID0gY2ZnWydkb21pbmFudC1iYXNlbGluZSddIHx8IERFRkFVTFRfRE9NSU5BTlRfQkFTRUxJTkU7XHJcbiAgICBTVkdTaGFwZS5jYWxsKHRoaXMsICd0c3BhbicsIHN2Z1Jvb3QsIGNmZyk7XHJcbn07XHJcblxyXG51dGlsLmluaGVyaXRzKFNWR1RTcGFuLCBTVkdUZXh0KTtcclxuXHJcblNWR1RTcGFuLnByb3RvdHlwZS5jb250ZW50ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy4kKCkudGV4dCh2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiQoKS50ZXh0KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TVkdUU3Bhbi5wcm90b3R5cGUuZ2V0QkJveCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9zb21lIGJyb3dzZXIgKGUuZy4gZmlyZWZveCkgZG9lcyBub3QgaW1wbGVtZW50IHRoZSBnZXRCQm94IGZvciB0c3BhbiBlbGVtZW50cy5cclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVkdUU3BhbjsiLCJ2YXIgU1ZHID0gcmVxdWlyZSgnLi4vc3ZnL3N2ZycpO1xyXG52YXIgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NvcmUvY2FjaGUnKTtcclxuXHJcbiQuZm4uc3ZnID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIGlmKHNlbGVjdG9yICYmIHNlbGVjdG9yLlNWR0VsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gc2VsZWN0b3I7XHJcbiAgICB9ZWxzZSBpZihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiAkKHNlbGVjdG9yKS5zdmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZighdGhpcy5sZW5ndGgpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9IGVsc2UgaWYodGhpcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gU1ZHLmdldCh0aGlzKTtcclxuICAgIH0gZWxzZSBpZih0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gIFtdO1xyXG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goU1ZHLmdldCh0aGlzKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5zdmcgPSAkLmZuLnN2ZztcclxuXHJcbiQucUNhY2hlID0gZnVuY3Rpb24oc2VsZWN0b3IsIHByZXZlbnRDYWNoZSkge1xyXG4gICAgaWYoc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS4kKHNlbGVjdG9yLCBwcmV2ZW50Q2FjaGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZTtcclxuICAgIH1cclxufTtcclxuXHJcbiQucVVuY2FjaGUgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgcmV0dXJuIHF1ZXJ5Q2FjaGUucmVtb3ZlKHNlbGVjdG9yKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgcHJvYmxlbSB3aXRoIHVpLXNlbGVjdG1lbnUgaXMgdGhhdCBpdCBjYXVzZXMgYSBzZWNvbmQga2V5ZG93biB0cmlnZ2VyIGV2ZW50IHdoZW4gZm9jdXNlZC5cclxuICogU28gZ2xvYmFsIGtleWRvd24gZXZlbnRzIGFyZSB0cmlnZ2VyZWQgdHdpY2hlIGxpa2UgZG8vdW5kbyBpZiBmb2N1c2VkLiBUaGUgZm9sbG93aW5nIGV2ZW50XHJcbiAqIHByZXZlbnRzIHRoZSBwcm9wYWdhdGlvbiBpZiB0aGUgY29udHJvbCBrZXkgaXMgcHJlc3NlZC5cclxuICovXHJcbiQoZG9jdW1lbnQsICcudWktc2VsZWN0bWVudS1idXR0b24nKS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgaWYoZXZ0LmN0cmxLZXkpIHtcclxuICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJC5mbi5ncm93bCA9IGZ1bmN0aW9uKHBhcmFtcykge1xyXG4gICAgdmFyICRyb290ID0gdGhpcztcclxuXHJcbiAgICAvLyB0b29sdGlwIGNvbnRlbnQgYW5kIHN0eWxpbmdcclxuICAgIHZhciAkY29udGVudCA9ICQoXHJcbiAgICAgICAgJzxhIGNsYXNzPVwiaWNvbi1jbG9zZVwiIGhyZWY9XCIjXCI+PC9hPicrXHJcbiAgICAgICAgJzxoMSBzdHlsZT1cImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxMnB0OyBmb250LXdlaWdodDogYm9sZDsgcGFkZGluZy1ib3R0b206IDVweDtcIj4nICsgcGFyYW1zLnRpdGxlICsgJzwvaDE+JyArXHJcbiAgICAgICAgJzxwIHN0eWxlPVwibWFyZ2luOiAwOyBwYWRkaW5nOiA1cHggMCA1cHggMDsgZm9udC1zaXplOiAxMHB0O1wiPicgKyBwYXJhbXMudGV4dCArICc8L3A+Jyk7XHJcblxyXG4gICAgLy8gYWRkICdDbG9zZScgYnV0dG9uIGZ1bmN0aW9uYWxpdHlcclxuICAgIHZhciAkY2xvc2UgPSAkKCRjb250ZW50WzBdKTtcclxuICAgICRjbG9zZS5jbGljayhmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgJHJvb3QudWl0b29sdGlwKCdjbG9zZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gcHJldmVudCBzdGFuZGFyZCB0b29sdGlwIGZyb20gY2xvc2luZ1xyXG4gICAgJHJvb3QuYmluZCgnZm9jdXNvdXQgbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG5cclxuICAgIC8vIGJ1aWxkIHRvb2x0aXBcclxuICAgICRyb290LnVpdG9vbHRpcCh7XHJcbiAgICAgICAgY29udGVudDogZnVuY3Rpb24oKSB7IHJldHVybiAkY29udGVudDsgfSxcclxuICAgICAgICBpdGVtczogJHJvb3Quc2VsZWN0b3IsXHJcbiAgICAgICAgdG9vbHRpcENsYXNzOiAnZ3Jvd2wgJyArIHBhcmFtcy5ncm93bENsYXNzLFxyXG4gICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgIG15OiAncmlnaHQgdG9wJyxcclxuICAgICAgICAgICAgYXQ6ICdyaWdodC0xMCB0b3ArMTAnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcclxuICAgICAgICAgICAgJHJvb3QudWl0b29sdGlwKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkudWl0b29sdGlwKCdvcGVuJyk7XHJcblxyXG4gICAgaWYocGFyYW1zLmNsb3NlQWZ0ZXIpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ICRyb290LnVpdG9vbHRpcCgnY2xvc2UnKTsgfSwgcGFyYW1zLmNsb3NlQWZ0ZXIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuaWYoJC51aSkge1xyXG4gICAgJC53aWRnZXQoIFwiY3VzdG9tLmljb25zZWxlY3RtZW51XCIsICQudWkuc2VsZWN0bWVudSwge1xyXG4gICAgICAgIF9yZW5kZXJJdGVtOiBmdW5jdGlvbiggdWwsIGl0ZW0gKSB7XHJcbiAgICAgICAgICAgIHZhciBsaSA9ICQoIFwiPGxpPlwiLCB7IHRleHQ6IGl0ZW0ubGFiZWwgfSApO1xyXG4gICAgICAgICAgICBpZiAoIGl0ZW0uZGlzYWJsZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBsaS5hZGRDbGFzcyggXCJ1aS1zdGF0ZS1kaXNhYmxlZFwiICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJCggXCI8c3Bhbj5cIiwge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IGl0ZW0uZWxlbWVudC5hdHRyKCBcImRhdGEtc3R5bGVcIiApLFxyXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcInVpLWljb24gXCIgKyBpdGVtLmVsZW1lbnQuYXR0ciggXCJkYXRhLWNsYXNzXCIgKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZFRvKCBsaSApO1xyXG4gICAgICAgICAgICByZXR1cm4gbGkuYXBwZW5kVG8oIHVsICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwidmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb2JqZWN0OiByZXF1aXJlKCcuL29iamVjdCcpLFxyXG4gICAgc3RyaW5nOiByZXF1aXJlKCcuL3N0cmluZycpLFxyXG4gICAgZG9tOiByZXF1aXJlKCcuLy4uL2RvbS9kb20nKSxcclxuICAgIGFwcDogcmVxdWlyZSgnLi9hcHAnKSxcclxuICAgIG1hdGg6IHJlcXVpcmUoJy4vbWF0aCcpLFxyXG4gICAgeG1sIDogcmVxdWlyZSgnLi94bWwnKSxcclxuICAgIGluaGVyaXRzOiB1dGlsLmluaGVyaXRzXHJcbn0iLCIvKipcclxuICogVGhpcyBtb2R1bGUgc2VydmVzIGFzIGFuIHdyYXBwZXIgZm9yIGRvbSBtYW5pcHVsYXRpb24gZnVuY3Rpb25hbGl0eS4gSXQgaXNcclxuICogaGlnaGx5IHByZWZlcmVkIHRvIHVzZSB0aGlzIG1vZHVsZSBpbnN0ZWFkIG9mIGpxdWVyeSBkaXJlY3RseSB3aXRoaW4gb3RoZXJcclxuICogbW9kdWxlcy5cclxuICovXHJcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuL29iamVjdCcpO1xyXG5cclxudmFyIHBhcnNlRmVhdHVyZVN0cmluZ3MgPSBmdW5jdGlvbih2YWx1ZSwgZGVmYXVsdFZhbCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgnICcpO1xyXG4gICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCBmZWF0dXJlKSB7XHJcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IHBhcnNlRmVhdHVyZVN0cmluZyhmZWF0dXJlLCBkZWZhdWx0VmFsKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBwYXJzZSBhIGZlYXR1cmVzdGlucmcgaW4gdGhlIGZvcm0gb2ZcclxuICogICdmZWF0dXJlbmFtZSgzMCwzMCknIG9yICdmZWF0dXJlbmFtZSgzMC40KSBvciBmZWF0dXJlbmFtZVxyXG4gKlxyXG4gKiBUaGUgcmVzdWx0IGlzIHdvdWxkIGJlXHJcbiAqICAgICAgeyB0eXBlIDogJ2ZlYXR1cmVuYW1lJywgdmFsdWUgOiBbMzAsMzBdIH1cclxuICogICAgICB7IHR5cGUgOiAnZmVhdHVyZW5hbWUnLCB2YWx1ZSA6IDMwLjQgfVxyXG4gKiAgICAgIHsgdHlwZSA6ICdmZWF0dXJlbmFtZScsIHZhbHVlIDogdW5kZWZpbmVkIH1cclxuICogQHBhcmFtIHt0eXBlfSBmZWF0dXJlXHJcbiAqIEByZXR1cm5zIHtBcHBfTDYucGFyc2VGZWF0dXJlU3RyaW5nLnJlc3VsdH1cclxuICovXHJcbnZhciBwYXJzZUZlYXR1cmVTdHJpbmcgPSBmdW5jdGlvbihmZWF0dXJlLCBkZWZhdWx0VmFsKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZihmZWF0dXJlLmluZGV4T2YoJygnKSA+IC0xKSB7XHJcbiAgICAgICAgdmFyIHNwbGl0dGVkID0gZmVhdHVyZS5zcGxpdCgnKCcpO1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0dGVkWzFdLnN1YnN0cmluZygwLCBzcGxpdHRlZFsxXS5pbmRleE9mKCcpJykpO1xyXG5cclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKCcsJykgPiAtMSkgeyAvLyBtdWx0aXBsZSBhcmdzXHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCB2KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZVtpbmRleF0gPSBwYXJzZU51bWJlclN0cmluZyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gc2luZ2xlIGFyZ1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlTnVtYmVyU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0LnR5cGUgPSBzcGxpdHRlZFswXTtcclxuICAgICAgICByZXN1bHQudmFsdWUgPSB2YWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0LnR5cGUgPSBmZWF0dXJlO1xyXG4gICAgICAgIHJlc3VsdC52YWx1ZSA9IGRlZmF1bHRWYWw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIHBhcnNlTnVtYmVyU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmKCFvYmplY3QuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ3V0IHVuaXRzIDEuMmVtIC0+IDEuMlxyXG4gICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgvKD89W2EteixBLVpdKykvKVswXTtcclxuXHJcbiAgICBpZighaXNOYU4odmFsdWUpKSB7XHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZignLicpID4gLTEpIHsgLy9mbG9hdFxyXG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vaW50XHJcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBjcmVhdGVGZWF0dXJlU3RyaW5nID0gZnVuY3Rpb24oZmVhdHVyZSwgdmFsdWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBmZWF0dXJlO1xyXG5cclxuICAgIGlmKG9iamVjdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9ICcoJztcclxuICAgICAgICBpZihvYmplY3QuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgb2JqZWN0LmVhY2godmFsdWUsIGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IChpbmRleCAhPT0gMCkgPyAnLCcrdmFsdWUgOiB2YWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgKz0gJyknO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBpc01pbkRpc3QgPSBmdW5jdGlvbihmcm9tLCB0bywgbWluRGlzdCkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKHRvLnggLSBmcm9tLngpID4gbWluRGlzdCB8fCBNYXRoLmFicyh0by55IC0gZnJvbS55KSA+IG1pbkRpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlRmVhdHVyZVN0cmluZzpwYXJzZUZlYXR1cmVTdHJpbmcsXHJcbiAgICBjcmVhdGVGZWF0dXJlU3RyaW5nOmNyZWF0ZUZlYXR1cmVTdHJpbmcsXHJcbiAgICBwYXJzZUZlYXR1cmVTdHJpbmdzOnBhcnNlRmVhdHVyZVN0cmluZ3MsXHJcbiAgICBwYXJzZU51bWJlclN0cmluZyA6IHBhcnNlTnVtYmVyU3RyaW5nLFxyXG4gICAgaXNNaW5EaXN0IDogaXNNaW5EaXN0XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBtb3N0IEJlemllciBoZWxwdGVyIGZ1bmN0aW9ucyBhcmUgdGFrZW4gZnJvbSBqc0JlemllciBsaWJyYXJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9qc3BsdW1iL2pzQmV6aWVyL2Jsb2IvbWFzdGVyL2pzLzAuNi9qc0Jlemllci0wLjYuanNcclxuICogY2hlY2sgL2xpYnMvanNCZXppZXIuanMgZm9yIG1vcmUgZnVuY3Rpb25zIGlmIHJlcXVpcmVkLlxyXG4gKlxyXG4gKlxyXG4gKi9cclxuXHJcbmlmICh0eXBlb2YgTWF0aC5zZ24gPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgTWF0aC5zZ24gPSBmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgIHJldHVybiB4ID09IDAgPyAwIDogeCA+IDAgPyAxIDogLTE7XHJcbiAgICB9O1xyXG59XHJcblxyXG52YXIgVmVjdG9ycyA9IHtcclxuICAgICAgICBzdWJ0cmFjdDogZnVuY3Rpb24gKHYxLCB2Mikge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IHYxLnggLSB2Mi54LCB5OiB2MS55IC0gdjIueX07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkb3RQcm9kdWN0OiBmdW5jdGlvbiAodjEsIHYyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAodjEueCAqIHYyLngpICsgKHYxLnkgKiB2Mi55KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNxdWFyZTogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguc3FydCgodi54ICogdi54KSArICh2LnkgKiB2LnkpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNjYWxlOiBmdW5jdGlvbiAodiwgcykge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IHYueCAqIHMsIHk6IHYueSAqIHN9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgbWF4UmVjdXJzaW9uID0gNjQsXHJcbiAgICBmbGF0bmVzc1RvbGVyYW5jZSA9IE1hdGgucG93KDIuMCwgLW1heFJlY3Vyc2lvbiAtIDEpO1xyXG5cclxuLyoqXHJcbiAqIGZpbmRzIHRoZSBuZWFyZXN0IHBvaW50IG9uIHRoZSBjdXJ2ZSB0byB0aGUgZ2l2ZW4gcG9pbnQuXHJcbiAqL1xyXG52YXIgX25lYXJlc3RQb2ludE9uQ3VydmUgPSBmdW5jdGlvbiAocG9pbnQsIGN1cnZlKSB7XHJcbiAgICB2YXIgdGQgPSBfZGlzdGFuY2VGcm9tQ3VydmUocG9pbnQsIGN1cnZlKTtcclxuICAgIHJldHVybiB7cG9pbnQ6IF9iZXppZXIoY3VydmUsIGN1cnZlLmxlbmd0aCAtIDEsIHRkLmxvY2F0aW9uLCBudWxsLCBudWxsKSwgbG9jYXRpb246IHRkLmxvY2F0aW9ufTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSB0aGF0IHRoZSBwb2ludCBsaWVzIGZyb20gdGhlIGN1cnZlLlxyXG4gKlxyXG4gKiBAcGFyYW0gcG9pbnQgYSBwb2ludCBpbiB0aGUgZm9ybSB7eDo1NjcsIHk6MzM0Mn1cclxuICogQHBhcmFtIGN1cnZlIGEgQmV6aWVyIGN1cnZlIGluIHRoZSBmb3JtIFt7eDouLi4sIHk6Li4ufSwge3g6Li4uLCB5Oi4uLn0sIHt4Oi4uLiwgeTouLi59LCB7eDouLi4sIHk6Li4ufV0uICBub3RlIHRoYXQgdGhpcyBpcyBjdXJyZW50bHlcclxuICogaGFyZGNvZGVkIHRvIGFzc3VtZSBjdWJpeiBiZXppZXJzLCBidXQgd291bGQgYmUgYmV0dGVyIG9mZiBzdXBwb3J0aW5nIGFueSBkZWdyZWUuXHJcbiAqIEByZXR1cm4gYSBKUyBvYmplY3QgbGl0ZXJhbCBjb250YWluaW5nIGxvY2F0aW9uIGFuZCBkaXN0YW5jZSwgZm9yIGV4YW1wbGU6IHtsb2NhdGlvbjowLjM1LCBkaXN0YW5jZToxMH0uICBMb2NhdGlvbiBpcyBhbmFsb2dvdXMgdG8gdGhlIGxvY2F0aW9uXHJcbiAqIGFyZ3VtZW50IHlvdSBwYXNzIHRvIHRoZSBwb2ludE9uUGF0aCBmdW5jdGlvbjogaXQgaXMgYSByYXRpbyBvZiBkaXN0YW5jZSB0cmF2ZWxsZWQgYWxvbmcgdGhlIGN1cnZlLiAgRGlzdGFuY2UgaXMgdGhlIGRpc3RhbmNlIGluIHBpeGVscyBmcm9tXHJcbiAqIHRoZSBwb2ludCB0byB0aGUgY3VydmUuXHJcbiAqL1xyXG52YXIgX2Rpc3RhbmNlRnJvbUN1cnZlID0gZnVuY3Rpb24gKHBvaW50LCBjdXJ2ZSkge1xyXG4gICAgdmFyIGNhbmRpZGF0ZXMgPSBbXSxcclxuICAgICAgICB3ID0gX2NvbnZlcnRUb0Jlemllcihwb2ludCwgY3VydmUpLFxyXG4gICAgICAgIGRlZ3JlZSA9IGN1cnZlLmxlbmd0aCAtIDEsIGhpZ2hlckRlZ3JlZSA9ICgyICogZGVncmVlKSAtIDEsXHJcbiAgICAgICAgbnVtU29sdXRpb25zID0gX2ZpbmRSb290cyh3LCBoaWdoZXJEZWdyZWUsIGNhbmRpZGF0ZXMsIDApLFxyXG4gICAgICAgIHYgPSBWZWN0b3JzLnN1YnRyYWN0KHBvaW50LCBjdXJ2ZVswXSksIGRpc3QgPSBWZWN0b3JzLnNxdWFyZSh2KSwgdCA9IDAuMDtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVNvbHV0aW9uczsgaSsrKSB7XHJcbiAgICAgICAgdiA9IFZlY3RvcnMuc3VidHJhY3QocG9pbnQsIF9iZXppZXIoY3VydmUsIGRlZ3JlZSwgY2FuZGlkYXRlc1tpXSwgbnVsbCwgbnVsbCkpO1xyXG4gICAgICAgIHZhciBuZXdEaXN0ID0gVmVjdG9ycy5zcXVhcmUodik7XHJcbiAgICAgICAgaWYgKG5ld0Rpc3QgPCBkaXN0KSB7XHJcbiAgICAgICAgICAgIGRpc3QgPSBuZXdEaXN0O1xyXG4gICAgICAgICAgICB0ID0gY2FuZGlkYXRlc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2ID0gVmVjdG9ycy5zdWJ0cmFjdChwb2ludCwgY3VydmVbZGVncmVlXSk7XHJcbiAgICBuZXdEaXN0ID0gVmVjdG9ycy5zcXVhcmUodik7XHJcbiAgICBpZiAobmV3RGlzdCA8IGRpc3QpIHtcclxuICAgICAgICBkaXN0ID0gbmV3RGlzdDtcclxuICAgICAgICB0ID0gMS4wO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtsb2NhdGlvbjogdCwgZGlzdGFuY2U6IGRpc3R9O1xyXG59O1xyXG5cclxudmFyIF9jb252ZXJ0VG9CZXppZXIgPSBmdW5jdGlvbiAocG9pbnQsIGN1cnZlKSB7XHJcbiAgICB2YXIgZGVncmVlID0gY3VydmUubGVuZ3RoIC0gMSwgaGlnaGVyRGVncmVlID0gKDIgKiBkZWdyZWUpIC0gMSxcclxuICAgICAgICBjID0gW10sIGQgPSBbXSwgY2RUYWJsZSA9IFtdLCB3ID0gW10sXHJcbiAgICAgICAgeiA9IFtbMS4wLCAwLjYsIDAuMywgMC4xXSwgWzAuNCwgMC42LCAwLjYsIDAuNF0sIFswLjEsIDAuMywgMC42LCAxLjBdXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBkZWdyZWU7IGkrKykgY1tpXSA9IFZlY3RvcnMuc3VidHJhY3QoY3VydmVbaV0sIHBvaW50KTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGRlZ3JlZSAtIDE7IGkrKykge1xyXG4gICAgICAgIGRbaV0gPSBWZWN0b3JzLnN1YnRyYWN0KGN1cnZlW2kgKyAxXSwgY3VydmVbaV0pO1xyXG4gICAgICAgIGRbaV0gPSBWZWN0b3JzLnNjYWxlKGRbaV0sIDMuMCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciByb3cgPSAwOyByb3cgPD0gZGVncmVlIC0gMTsgcm93KyspIHtcclxuICAgICAgICBmb3IgKHZhciBjb2x1bW4gPSAwOyBjb2x1bW4gPD0gZGVncmVlOyBjb2x1bW4rKykge1xyXG4gICAgICAgICAgICBpZiAoIWNkVGFibGVbcm93XSkgY2RUYWJsZVtyb3ddID0gW107XHJcbiAgICAgICAgICAgIGNkVGFibGVbcm93XVtjb2x1bW5dID0gVmVjdG9ycy5kb3RQcm9kdWN0KGRbcm93XSwgY1tjb2x1bW5dKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmb3IgKGkgPSAwOyBpIDw9IGhpZ2hlckRlZ3JlZTsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCF3W2ldKSB3W2ldID0gW107XHJcbiAgICAgICAgd1tpXS55ID0gMC4wO1xyXG4gICAgICAgIHdbaV0ueCA9IHBhcnNlRmxvYXQoaSkgLyBoaWdoZXJEZWdyZWU7XHJcbiAgICB9XHJcbiAgICB2YXIgbiA9IGRlZ3JlZSwgbSA9IGRlZ3JlZSAtIDE7XHJcbiAgICBmb3IgKHZhciBrID0gMDsgayA8PSBuICsgbTsgaysrKSB7XHJcbiAgICAgICAgdmFyIGxiID0gTWF0aC5tYXgoMCwgayAtIG0pLFxyXG4gICAgICAgICAgICB1YiA9IE1hdGgubWluKGssIG4pO1xyXG4gICAgICAgIGZvciAoaSA9IGxiOyBpIDw9IHViOyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGsgLSBpO1xyXG4gICAgICAgICAgICB3W2kgKyBqXS55ICs9IGNkVGFibGVbal1baV0gKiB6W2pdW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB3O1xyXG59O1xyXG4vKipcclxuICogY291bnRzIGhvdyBtYW55IHJvb3RzIHRoZXJlIGFyZS5cclxuICovXHJcbnZhciBfZmluZFJvb3RzID0gZnVuY3Rpb24gKHcsIGRlZ3JlZSwgdCwgZGVwdGgpIHtcclxuICAgIHZhciBsZWZ0ID0gW10sIHJpZ2h0ID0gW10sXHJcbiAgICAgICAgbGVmdF9jb3VudCwgcmlnaHRfY291bnQsXHJcbiAgICAgICAgbGVmdF90ID0gW10sIHJpZ2h0X3QgPSBbXTtcclxuXHJcbiAgICBzd2l0Y2ggKF9nZXRDcm9zc2luZ0NvdW50KHcsIGRlZ3JlZSkpIHtcclxuICAgICAgICBjYXNlIDAgOlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgMSA6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZGVwdGggPj0gbWF4UmVjdXJzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0WzBdID0gKHdbMF0ueCArIHdbZGVncmVlXS54KSAvIDIuMDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChfaXNGbGF0RW5vdWdoKHcsIGRlZ3JlZSkpIHtcclxuICAgICAgICAgICAgICAgIHRbMF0gPSBfY29tcHV0ZVhJbnRlcmNlcHQodywgZGVncmVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9iZXppZXIodywgZGVncmVlLCAwLjUsIGxlZnQsIHJpZ2h0KTtcclxuICAgIGxlZnRfY291bnQgPSBfZmluZFJvb3RzKGxlZnQsIGRlZ3JlZSwgbGVmdF90LCBkZXB0aCArIDEpO1xyXG4gICAgcmlnaHRfY291bnQgPSBfZmluZFJvb3RzKHJpZ2h0LCBkZWdyZWUsIHJpZ2h0X3QsIGRlcHRoICsgMSk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlZnRfY291bnQ7IGkrKykgdFtpXSA9IGxlZnRfdFtpXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmlnaHRfY291bnQ7IGkrKykgdFtpICsgbGVmdF9jb3VudF0gPSByaWdodF90W2ldO1xyXG4gICAgcmV0dXJuIChsZWZ0X2NvdW50ICsgcmlnaHRfY291bnQpO1xyXG59O1xyXG52YXIgX2dldENyb3NzaW5nQ291bnQgPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIG5fY3Jvc3NpbmdzID0gMCwgc2lnbiwgb2xkX3NpZ247XHJcbiAgICBzaWduID0gb2xkX3NpZ24gPSBNYXRoLnNnbihjdXJ2ZVswXS55KTtcclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGRlZ3JlZTsgaSsrKSB7XHJcbiAgICAgICAgc2lnbiA9IE1hdGguc2duKGN1cnZlW2ldLnkpO1xyXG4gICAgICAgIGlmIChzaWduICE9IG9sZF9zaWduKSBuX2Nyb3NzaW5ncysrO1xyXG4gICAgICAgIG9sZF9zaWduID0gc2lnbjtcclxuICAgIH1cclxuICAgIHJldHVybiBuX2Nyb3NzaW5ncztcclxufTtcclxudmFyIF9pc0ZsYXRFbm91Z2ggPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIGVycm9yLFxyXG4gICAgICAgIGludGVyY2VwdF8xLCBpbnRlcmNlcHRfMiwgbGVmdF9pbnRlcmNlcHQsIHJpZ2h0X2ludGVyY2VwdCxcclxuICAgICAgICBhLCBiLCBjLCBkZXQsIGRJbnYsIGExLCBiMSwgYzEsIGEyLCBiMiwgYzI7XHJcbiAgICBhID0gY3VydmVbMF0ueSAtIGN1cnZlW2RlZ3JlZV0ueTtcclxuICAgIGIgPSBjdXJ2ZVtkZWdyZWVdLnggLSBjdXJ2ZVswXS54O1xyXG4gICAgYyA9IGN1cnZlWzBdLnggKiBjdXJ2ZVtkZWdyZWVdLnkgLSBjdXJ2ZVtkZWdyZWVdLnggKiBjdXJ2ZVswXS55O1xyXG5cclxuICAgIHZhciBtYXhfZGlzdGFuY2VfYWJvdmUgPSBtYXhfZGlzdGFuY2VfYmVsb3cgPSAwLjA7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkZWdyZWU7IGkrKykge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IGEgKiBjdXJ2ZVtpXS54ICsgYiAqIGN1cnZlW2ldLnkgKyBjO1xyXG4gICAgICAgIGlmICh2YWx1ZSA+IG1heF9kaXN0YW5jZV9hYm92ZSlcclxuICAgICAgICAgICAgbWF4X2Rpc3RhbmNlX2Fib3ZlID0gdmFsdWU7XHJcbiAgICAgICAgZWxzZSBpZiAodmFsdWUgPCBtYXhfZGlzdGFuY2VfYmVsb3cpXHJcbiAgICAgICAgICAgIG1heF9kaXN0YW5jZV9iZWxvdyA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGExID0gMC4wO1xyXG4gICAgYjEgPSAxLjA7XHJcbiAgICBjMSA9IDAuMDtcclxuICAgIGEyID0gYTtcclxuICAgIGIyID0gYjtcclxuICAgIGMyID0gYyAtIG1heF9kaXN0YW5jZV9hYm92ZTtcclxuICAgIGRldCA9IGExICogYjIgLSBhMiAqIGIxO1xyXG4gICAgZEludiA9IDEuMCAvIGRldDtcclxuICAgIGludGVyY2VwdF8xID0gKGIxICogYzIgLSBiMiAqIGMxKSAqIGRJbnY7XHJcbiAgICBhMiA9IGE7XHJcbiAgICBiMiA9IGI7XHJcbiAgICBjMiA9IGMgLSBtYXhfZGlzdGFuY2VfYmVsb3c7XHJcbiAgICBkZXQgPSBhMSAqIGIyIC0gYTIgKiBiMTtcclxuICAgIGRJbnYgPSAxLjAgLyBkZXQ7XHJcbiAgICBpbnRlcmNlcHRfMiA9IChiMSAqIGMyIC0gYjIgKiBjMSkgKiBkSW52O1xyXG4gICAgbGVmdF9pbnRlcmNlcHQgPSBNYXRoLm1pbihpbnRlcmNlcHRfMSwgaW50ZXJjZXB0XzIpO1xyXG4gICAgcmlnaHRfaW50ZXJjZXB0ID0gTWF0aC5tYXgoaW50ZXJjZXB0XzEsIGludGVyY2VwdF8yKTtcclxuICAgIGVycm9yID0gcmlnaHRfaW50ZXJjZXB0IC0gbGVmdF9pbnRlcmNlcHQ7XHJcbiAgICByZXR1cm4gKGVycm9yIDwgZmxhdG5lc3NUb2xlcmFuY2UpID8gMSA6IDA7XHJcbn07XHJcbnZhciBfY29tcHV0ZVhJbnRlcmNlcHQgPSBmdW5jdGlvbiAoY3VydmUsIGRlZ3JlZSkge1xyXG4gICAgdmFyIFhMSyA9IDEuMCwgWUxLID0gMC4wLFxyXG4gICAgICAgIFhOTSA9IGN1cnZlW2RlZ3JlZV0ueCAtIGN1cnZlWzBdLngsIFlOTSA9IGN1cnZlW2RlZ3JlZV0ueSAtIGN1cnZlWzBdLnksXHJcbiAgICAgICAgWE1LID0gY3VydmVbMF0ueCAtIDAuMCwgWU1LID0gY3VydmVbMF0ueSAtIDAuMCxcclxuICAgICAgICBkZXQgPSBYTk0gKiBZTEsgLSBZTk0gKiBYTEssIGRldEludiA9IDEuMCAvIGRldCxcclxuICAgICAgICBTID0gKFhOTSAqIFlNSyAtIFlOTSAqIFhNSykgKiBkZXRJbnY7XHJcbiAgICByZXR1cm4gMC4wICsgWExLICogUztcclxufTtcclxuXHJcbnZhciBfYmV6aWVyID0gZnVuY3Rpb24gKGN1cnZlLCBkZWdyZWUsIHQsIGxlZnQsIHJpZ2h0KSB7XHJcbiAgICB2YXIgdGVtcCA9IFtbXV07XHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8PSBkZWdyZWU7IGorKykgdGVtcFswXVtqXSA9IGN1cnZlW2pdO1xyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gZGVncmVlOyBpKyspIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8PSBkZWdyZWUgLSBpOyBqKyspIHtcclxuICAgICAgICAgICAgaWYgKCF0ZW1wW2ldKSB0ZW1wW2ldID0gW107XHJcbiAgICAgICAgICAgIGlmICghdGVtcFtpXVtqXSkgdGVtcFtpXVtqXSA9IHt9O1xyXG4gICAgICAgICAgICB0ZW1wW2ldW2pdLnggPSAoMS4wIC0gdCkgKiB0ZW1wW2kgLSAxXVtqXS54ICsgdCAqIHRlbXBbaSAtIDFdW2ogKyAxXS54O1xyXG4gICAgICAgICAgICB0ZW1wW2ldW2pdLnkgPSAoMS4wIC0gdCkgKiB0ZW1wW2kgLSAxXVtqXS55ICsgdCAqIHRlbXBbaSAtIDFdW2ogKyAxXS55O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChsZWZ0ICE9IG51bGwpXHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8PSBkZWdyZWU7IGorKykgbGVmdFtqXSA9IHRlbXBbal1bMF07XHJcbiAgICBpZiAocmlnaHQgIT0gbnVsbClcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDw9IGRlZ3JlZTsgaisrKSByaWdodFtqXSA9IHRlbXBbZGVncmVlIC0gal1bal07XHJcblxyXG4gICAgcmV0dXJuICh0ZW1wW2RlZ3JlZV1bMF0pO1xyXG59O1xyXG5cclxudmFyIF9jdXJ2ZUZ1bmN0aW9uQ2FjaGUgPSB7fTtcclxudmFyIF9nZXRDdXJ2ZUZ1bmN0aW9ucyA9IGZ1bmN0aW9uIChvcmRlcikge1xyXG4gICAgdmFyIGZucyA9IF9jdXJ2ZUZ1bmN0aW9uQ2FjaGVbb3JkZXJdO1xyXG4gICAgaWYgKCFmbnMpIHtcclxuICAgICAgICBmbnMgPSBbXTtcclxuICAgICAgICB2YXIgZl90ZXJtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucG93KHQsIG9yZGVyKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxfdGVybSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnBvdygoMSAtIHQpLCBvcmRlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjX3Rlcm0gPSBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0X3Rlcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uZV9taW51c190X3Rlcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMSAtIHQ7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBfdGVybUZ1bmMgPSBmdW5jdGlvbiAodGVybXMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gMTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlcm1zLmxlbmd0aDsgaSsrKSBwID0gcCAqIHRlcm1zW2ldKHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZm5zLnB1c2gobmV3IGZfdGVybSgpKTsgIC8vIGZpcnN0IGlzIHQgdG8gdGhlIHBvd2VyIG9mIHRoZSBjdXJ2ZSBvcmRlclxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgb3JkZXI7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGVybXMgPSBbbmV3IGNfdGVybShvcmRlcildO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IChvcmRlciAtIGkpOyBqKyspIHRlcm1zLnB1c2gobmV3IHRfdGVybSgpKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpOyBqKyspIHRlcm1zLnB1c2gobmV3IG9uZV9taW51c190X3Rlcm0oKSk7XHJcbiAgICAgICAgICAgIGZucy5wdXNoKG5ldyBfdGVybUZ1bmModGVybXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm5zLnB1c2gobmV3IGxfdGVybSgpKTsgIC8vIGxhc3QgaXMgKDEtdCkgdG8gdGhlIHBvd2VyIG9mIHRoZSBjdXJ2ZSBvcmRlclxyXG5cclxuICAgICAgICBfY3VydmVGdW5jdGlvbkNhY2hlW29yZGVyXSA9IGZucztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZm5zO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIGEgcG9pbnQgb24gdGhlIGN1cnZlLCBmb3IgYSBCZXppZXIgb2YgYXJiaXRyYXJ5IG9yZGVyLlxyXG4gKiBAcGFyYW0gY3VydmUgYW4gYXJyYXkgb2YgY29udHJvbCBwb2ludHMsIGVnIFt7eDoxMCx5OjIwfSwge3g6NTAseTo1MH0sIHt4OjEwMCx5OjEwMH0sIHt4OjEyMCx5OjEwMH1dLiAgRm9yIGEgY3ViaWMgYmV6aWVyIHRoaXMgc2hvdWxkIGhhdmUgZm91ciBwb2ludHMuXHJcbiAqIEBwYXJhbSBsb2NhdGlvbiBhIGRlY2ltYWwgaW5kaWNhdGluZyB0aGUgZGlzdGFuY2UgYWxvbmcgdGhlIGN1cnZlIHRoZSBwb2ludCBzaG91bGQgYmUgbG9jYXRlZCBhdC4gIHRoaXMgaXMgdGhlIGRpc3RhbmNlIGFsb25nIHRoZSBjdXJ2ZSBhcyBpdCB0cmF2ZWxzLCB0YWtpbmcgdGhlIHdheSBpdCBiZW5kcyBpbnRvIGFjY291bnQuICBzaG91bGQgYmUgYSBudW1iZXIgZnJvbSAwIHRvIDEsIGluY2x1c2l2ZS5cclxuICovXHJcbnZhciBfcG9pbnRPblBhdGggPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uKSB7XHJcbiAgICB2YXIgY2MgPSBfZ2V0Q3VydmVGdW5jdGlvbnMoY3VydmUubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgX3ggPSAwLCBfeSA9IDA7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnZlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgX3ggPSBfeCArIChjdXJ2ZVtpXS54ICogY2NbaV0obG9jYXRpb24pKTtcclxuICAgICAgICBfeSA9IF95ICsgKGN1cnZlW2ldLnkgKiBjY1tpXShsb2NhdGlvbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7eDogX3gsIHk6IF95fTtcclxufTtcclxuXHJcbnZhciBfZGlzdCA9IGZ1bmN0aW9uIChwMSwgcDIpIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDEueCAtIHAyLngsIDIpICsgTWF0aC5wb3cocDEueSAtIHAyLnksIDIpKTtcclxufTtcclxuXHJcbnZhciBfaXNQb2ludCA9IGZ1bmN0aW9uIChjdXJ2ZSkge1xyXG4gICAgcmV0dXJuIGN1cnZlWzBdLnggPT0gY3VydmVbMV0ueCAmJiBjdXJ2ZVswXS55ID09IGN1cnZlWzFdLnk7XHJcbn07XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIHBvaW50IHRoYXQgaXMgJ2Rpc3RhbmNlJyBhbG9uZyB0aGUgcGF0aCBmcm9tICdsb2NhdGlvbicuICB0aGlzIG1ldGhvZCByZXR1cm5zIGJvdGggdGhlIHgseSBsb2NhdGlvbiBvZiB0aGUgcG9pbnQgYW5kIGFsc29cclxuICogaXRzICdsb2NhdGlvbicgKHByb3BvcnRpb24gb2YgdHJhdmVsIGFsb25nIHRoZSBwYXRoKTsgdGhlIG1ldGhvZCBiZWxvdyAtIF9wb2ludEFsb25nUGF0aEZyb20gLSBjYWxscyB0aGlzIG1ldGhvZCBhbmQganVzdCByZXR1cm5zIHRoZVxyXG4gKiBwb2ludC5cclxuICovXHJcbnZhciBfcG9pbnRBbG9uZ1BhdGggPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG5cclxuICAgIGlmIChfaXNQb2ludChjdXJ2ZSkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBwb2ludDogY3VydmVbMF0sXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByZXYgPSBfcG9pbnRPblBhdGgoY3VydmUsIGxvY2F0aW9uKSxcclxuICAgICAgICB0YWxseSA9IDAsXHJcbiAgICAgICAgY3VyTG9jID0gbG9jYXRpb24sXHJcbiAgICAgICAgZGlyZWN0aW9uID0gZGlzdGFuY2UgPiAwID8gMSA6IC0xLFxyXG4gICAgICAgIGN1ciA9IG51bGw7XHJcblxyXG4gICAgd2hpbGUgKHRhbGx5IDwgTWF0aC5hYnMoZGlzdGFuY2UpKSB7XHJcbiAgICAgICAgY3VyTG9jICs9ICgwLjAwNSAqIGRpcmVjdGlvbik7XHJcbiAgICAgICAgY3VyID0gX3BvaW50T25QYXRoKGN1cnZlLCBjdXJMb2MpO1xyXG4gICAgICAgIHRhbGx5ICs9IF9kaXN0KGN1ciwgcHJldik7XHJcbiAgICAgICAgcHJldiA9IGN1cjtcclxuICAgIH1cclxuICAgIHJldHVybiB7cG9pbnQ6IGN1ciwgbG9jYXRpb246IGN1ckxvY307XHJcbn07XHJcblxyXG52YXIgX2xlbmd0aCA9IGZ1bmN0aW9uIChjdXJ2ZSkge1xyXG4gICAgaWYgKF9pc1BvaW50KGN1cnZlKSkgcmV0dXJuIDA7XHJcblxyXG4gICAgdmFyIHByZXYgPSBfcG9pbnRPblBhdGgoY3VydmUsIDApLFxyXG4gICAgICAgIHRhbGx5ID0gMCxcclxuICAgICAgICBjdXJMb2MgPSAwLFxyXG4gICAgICAgIGRpcmVjdGlvbiA9IDEsXHJcbiAgICAgICAgY3VyID0gbnVsbDtcclxuXHJcbiAgICB3aGlsZSAoY3VyTG9jIDwgMSkge1xyXG4gICAgICAgIGN1ckxvYyArPSAoMC4wMDUgKiBkaXJlY3Rpb24pO1xyXG4gICAgICAgIGN1ciA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgY3VyTG9jKTtcclxuICAgICAgICB0YWxseSArPSBfZGlzdChjdXIsIHByZXYpO1xyXG4gICAgICAgIHByZXYgPSBjdXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGFsbHk7XHJcbn07XHJcblxyXG4vKipcclxuICogZmluZHMgdGhlIHBvaW50IHRoYXQgaXMgJ2Rpc3RhbmNlJyBhbG9uZyB0aGUgcGF0aCBmcm9tICdsb2NhdGlvbicuXHJcbiAqL1xyXG52YXIgX3BvaW50QWxvbmdQYXRoRnJvbSA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gX3BvaW50QWxvbmdQYXRoKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpLnBvaW50O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIGZpbmRzIHRoZSBsb2NhdGlvbiB0aGF0IGlzICdkaXN0YW5jZScgYWxvbmcgdGhlIHBhdGggZnJvbSAnbG9jYXRpb24nLlxyXG4gKi9cclxudmFyIF9sb2NhdGlvbkFsb25nUGF0aEZyb20gPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG4gICAgcmV0dXJuIF9wb2ludEFsb25nUGF0aChjdXJ2ZSwgbG9jYXRpb24sIGRpc3RhbmNlKS5sb2NhdGlvbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiByZXR1cm5zIHRoZSBncmFkaWVudCBvZiB0aGUgY3VydmUgYXQgdGhlIGdpdmVuIGxvY2F0aW9uLCB3aGljaCBpcyBhIGRlY2ltYWwgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZS5cclxuICpcclxuICogdGhhbmtzIC8vIGh0dHA6Ly9iaW1peHVhbC5vcmcvQW5pbWF0aW9uTGlicmFyeS9iZXppZXJ0YW5nZW50cy5odG1sXHJcbiAqL1xyXG52YXIgX2dyYWRpZW50QXRQb2ludCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24pIHtcclxuICAgIHZhciBwMSA9IF9wb2ludE9uUGF0aChjdXJ2ZSwgbG9jYXRpb24pLFxyXG4gICAgICAgIHAyID0gX3BvaW50T25QYXRoKGN1cnZlLnNsaWNlKDAsIGN1cnZlLmxlbmd0aCAtIDEpLCBsb2NhdGlvbiksXHJcbiAgICAgICAgZHkgPSBwMi55IC0gcDEueSwgZHggPSBwMi54IC0gcDEueDtcclxuICAgIHJldHVybiBkeSA9PSAwID8gSW5maW5pdHkgOiBNYXRoLmF0YW4oZHkgLyBkeCk7XHJcbn07XHJcblxyXG4vKipcclxuIHJldHVybnMgdGhlIGdyYWRpZW50IG9mIHRoZSBjdXJ2ZSBhdCB0aGUgcG9pbnQgd2hpY2ggaXMgJ2Rpc3RhbmNlJyBmcm9tIHRoZSBnaXZlbiBsb2NhdGlvbi5cclxuIGlmIHRoaXMgcG9pbnQgaXMgZ3JlYXRlciB0aGFuIGxvY2F0aW9uIDEsIHRoZSBncmFkaWVudCBhdCBsb2NhdGlvbiAxIGlzIHJldHVybmVkLlxyXG4gaWYgdGhpcyBwb2ludCBpcyBsZXNzIHRoYW4gbG9jYXRpb24gMCwgdGhlIGdyYWRpZW50IGF0IGxvY2F0aW9uIDAgaXMgcmV0dXJuZWQuXHJcbiAqL1xyXG52YXIgX2dyYWRpZW50QXRQb2ludEFsb25nUGF0aEZyb20gPSBmdW5jdGlvbiAoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSkge1xyXG4gICAgdmFyIHAgPSBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsIGxvY2F0aW9uLCBkaXN0YW5jZSk7XHJcbiAgICBpZiAocC5sb2NhdGlvbiA+IDEpIHAubG9jYXRpb24gPSAxO1xyXG4gICAgaWYgKHAubG9jYXRpb24gPCAwKSBwLmxvY2F0aW9uID0gMDtcclxuICAgIHJldHVybiBfZ3JhZGllbnRBdFBvaW50KGN1cnZlLCBwLmxvY2F0aW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBjYWxjdWxhdGVzIGEgbGluZSB0aGF0IGlzICdsZW5ndGgnIHBpeGVscyBsb25nLCBwZXJwZW5kaWN1bGFyIHRvLCBhbmQgY2VudGVyZWQgb24sIHRoZSBwYXRoIGF0ICdkaXN0YW5jZScgcGl4ZWxzIGZyb20gdGhlIGdpdmVuIGxvY2F0aW9uLlxyXG4gKiBpZiBkaXN0YW5jZSBpcyBub3Qgc3VwcGxpZWQsIHRoZSBwZXJwZW5kaWN1bGFyIGZvciB0aGUgZ2l2ZW4gbG9jYXRpb24gaXMgY29tcHV0ZWQgKGllLiB3ZSBzZXQgZGlzdGFuY2UgdG8gemVybykuXHJcbiAqL1xyXG52YXIgX3BlcnBlbmRpY3VsYXJUb1BhdGhBdCA9IGZ1bmN0aW9uIChjdXJ2ZSwgbG9jYXRpb24sIGxlbmd0aCwgZGlzdGFuY2UpIHtcclxuICAgIGRpc3RhbmNlID0gZGlzdGFuY2UgPT0gbnVsbCA/IDAgOiBkaXN0YW5jZTtcclxuICAgIHZhciBwID0gX3BvaW50QWxvbmdQYXRoKGN1cnZlLCBsb2NhdGlvbiwgZGlzdGFuY2UpLFxyXG4gICAgICAgIG0gPSBfZ3JhZGllbnRBdFBvaW50KGN1cnZlLCBwLmxvY2F0aW9uKSxcclxuICAgICAgICBfdGhldGEyID0gTWF0aC5hdGFuKC0xIC8gbSksXHJcbiAgICAgICAgeSA9IGxlbmd0aCAvIDIgKiBNYXRoLnNpbihfdGhldGEyKSxcclxuICAgICAgICB4ID0gbGVuZ3RoIC8gMiAqIE1hdGguY29zKF90aGV0YTIpO1xyXG4gICAgcmV0dXJuIFt7eDogcC5wb2ludC54ICsgeCwgeTogcC5wb2ludC55ICsgeX0sIHt4OiBwLnBvaW50LnggLSB4LCB5OiBwLnBvaW50LnkgLSB5fV07XHJcbn07XHJcblxyXG52YXIgX2NhbGN1bGF0ZVNtb290aENvbnRyb2xQb2ludHMgPSBmdW5jdGlvbihLKSB7XHJcbiAgICB2YXIgcmVzdWx0UDEgPSBbXTtcclxuICAgIHZhciByZXN1bHRQMiA9IFtdO1xyXG4gICAgdmFyIG4gPSBLLmxlbmd0aC0xO1xyXG5cclxuICAgIC8qcmhzIHZlY3RvciBpbml0IGxlZnQgbW9zdCBzZWdtZW50Ki9cclxuICAgIHZhciBhID0gWzBdO1xyXG4gICAgdmFyIGIgPSBbMl07XHJcbiAgICB2YXIgYyA9IFsxXTtcclxuICAgIHZhciByID0gW0tbMF0gKyAyICogS1sxXV07XHJcblxyXG4gICAgLyppbnRlcm5hbCBzZWdtZW50cyovXHJcbiAgICBmb3IoaSA9IDE7IGkgPCBuIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgYVtpXSA9IDE7XHJcbiAgICAgICAgYltpXSA9IDQ7XHJcbiAgICAgICAgY1tpXSA9IDE7XHJcbiAgICAgICAgcltpXSA9IDQgKiBLW2ldICsgMiAqIEtbaSsxXTtcclxuICAgIH1cclxuXHJcbiAgICAvKnJpZ2h0IHNlZ21lbnQqL1xyXG4gICAgYVtuLTFdID0gMjtcclxuICAgIGJbbi0xXSA9IDc7XHJcbiAgICBjW24tMV0gPSAwO1xyXG4gICAgcltuLTFdID0gOCAqIEtbbi0xXSArIEtbbl07XHJcblxyXG4gICAgLypzb2x2ZXMgQXg9YiB3aXRoIHRoZSBUaG9tYXMgYWxnb3JpdGhtKi9cclxuICAgIGZvcihpID0gMTsgaSA8IG47IGkrKykge1xyXG4gICAgICAgIG0gPSBhW2ldIC8gYltpLTFdO1xyXG4gICAgICAgIGJbaV0gPSBiW2ldIC0gbSAqIGNbaSAtIDFdO1xyXG4gICAgICAgIHJbaV0gPSByW2ldIC0gbSAqIHJbaS0xXTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHRQMVtuLTFdID0gcltuLTFdIC8gYltuLTFdO1xyXG4gICAgZm9yIChpID0gbiAtIDI7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgcmVzdWx0UDFbaV0gPSAocltpXSAtIGNbaV0gKiByZXN1bHRQMVtpICsgMV0pIC8gYltpXTtcclxuICAgIH1cclxuXHJcbiAgICAvKndlIGhhdmUgcDEsIG5vdyBjb21wdXRlIHAyKi9cclxuICAgIGZvciAoaSA9IDA7IGkgPCBuIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgcmVzdWx0UDJbaV0gPSAyICogS1tpICsgMV0gLSByZXN1bHRQMVtpICsgMV07XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdWx0UDJbbi0xXSA9IDAuNSAqIChLW25dICsgcmVzdWx0UDFbbi0xXSk7XHJcblxyXG4gICAgcmV0dXJuIHtwMTpyZXN1bHRQMSwgcDI6cmVzdWx0UDJ9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1vdmVzIGEgcG9pbnQgYWxvbmcgdGhlIGdpdmVuIGN1cnZlXHJcbiAqIEBwYXJhbSBjdXJ2ZVxyXG4gKiBAcGFyYW0gZGlzdGFuY2VcclxuICogQHJldHVybnMgeyp8e3gsIHl9fVxyXG4gKi9cclxudmFyIG1vdmVBbG9uZyA9IGZ1bmN0aW9uKGN1cnZlLCBkaXN0YW5jZSkge1xyXG4gICAgLy8gU29tZWhvdyB0aGUgcG9pbnRBbG9uZ1BhdGggY2FsY3VsYXRlcyBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIHNvIHdlIHN3aXRjaCB0aGUgYmFoYXZpb3VyIGJ5IHNldHRpbmdcclxuICAgIC8vIHRoZSBsb2NhdGlvbiB0byAxIChlbmQpIGZvciBwb3NpdGl2ZSBkaXN0YW5jZXMuXHJcbiAgICAvLyBhbmQgbmVnb3RpYXRlIHRoZSBkaXN0YW5jZSB2YWx1ZS5cclxuICAgIHZhciBsb2NhdGlvbiA9IGRpc3RhbmNlID4gMCA/IDEgOiAwO1xyXG4gICAgdmFyIGRpc3RhbmNlID0gZGlzdGFuY2UgKiAtMTtcclxuICAgIHJldHVybiBfcG9pbnRBbG9uZ1BhdGgoY3VydmUsbG9jYXRpb24sIGRpc3RhbmNlKS5wb2ludDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbmVhcmVzdFBvaW50T25DdXJ2ZSA6IF9uZWFyZXN0UG9pbnRPbkN1cnZlLFxyXG4gICAgY2FsY3VsYXRlU21vb3RoQ29udHJvbFBvaW50cyA6IF9jYWxjdWxhdGVTbW9vdGhDb250cm9sUG9pbnRzLFxyXG4gICAgbW92ZUFsb25nIDogbW92ZUFsb25nLFxyXG4gICAgbGVuZ3RoIDogX2xlbmd0aFxyXG59XHJcblxyXG4iLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi9vYmplY3QnKTtcclxudmFyIGJlemllciA9IHJlcXVpcmUoJy4vYmV6aWVyJyk7XHJcblxyXG52YXIgY2FsY0xpbmVJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihwYTEsIHBhMiwgcGIxLCBwYjIpIHtcclxuICAgIHJldHVybiBuZXcgTGluZShwYTEscGEyKS5jYWxjTGluZUludGVyY2VwdChuZXcgTGluZShwYjEscGIyKSk7XHJcbn07XHJcblxyXG52YXIgUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcCA9IGdldFBvaW50KHgseSk7XHJcbiAgICB0aGlzLnggPSBwLng7XHJcbiAgICB0aGlzLnkgPSBwLnk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5JbnRlcnZhbCA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIGlzUG9pbnRJbkludGVydmFsKHRoaXMsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5YSW50ZXJ2YWwgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0b2xlcmFuY2UpIHtcclxuICAgIHJldHVybiBfaW5JbnRlcnZhbCh0aGlzLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd4Jyk7XHJcbn07XHJcblxyXG5Qb2ludC5wcm90b3R5cGUuaXNXaXRoaW5ZSW50ZXJ2YWwgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0b2xlcmFuY2UpIHtcclxuICAgIHJldHVybiBfaW5JbnRlcnZhbCh0aGlzLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd5Jyk7XHJcbn07O1xyXG5cclxudmFyIGlzUG9pbnRJbkludGVydmFsID0gZnVuY3Rpb24ocG9pbnQsIHN0YXJ0LCBlbmQsIHRvbGVyYW5jZSkge1xyXG4gICAgcmV0dXJuIF9pbkludGVydmFsKHBvaW50LCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd4JykgJiYgX2lzUG9pbnRJbkludGVydmFsKHBvaW50LCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsICd5Jyk7XHJcbn07XHJcblxyXG52YXIgX2luSW50ZXJ2YWwgPSBmdW5jdGlvbihwLCBzdGFydCwgZW5kLCB0b2xlcmFuY2UsIGRpbWVuc2lvbikge1xyXG4gICAgdG9sZXJhbmNlID0gdG9sZXJhbmNlIHx8IDA7XHJcbiAgICB2YXIgYm91bmRhcnkgPSBtaW5NYXgoc3RhcnRbZGltZW5zaW9uXSwgZW5kW2RpbWVuc2lvbl0pO1xyXG4gICAgYm91bmRhcnkubWluIC09IHRvbGVyYW5jZTtcclxuICAgIGJvdW5kYXJ5Lm1heCArPSB0b2xlcmFuY2U7XHJcbiAgICByZXR1cm4gKHBbZGltZW5zaW9uXSA8PSBib3VuZGFyeS5tYXggJiYgcFtkaW1lbnNpb25dID49IGJvdW5kYXJ5Lm1pbik7XHJcbn07XHJcblxyXG52YXIgbWluTWF4ID0gZnVuY3Rpb24odmFsMSwgdmFsMikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBtaW4gOiAgTWF0aC5taW4odmFsMSwgdmFsMiksXHJcbiAgICAgICAgbWF4IDogTWF0aC5tYXgodmFsMSwgdmFsMilcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgTGluZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgLy95ID0gbXggKyB0XHJcbiAgICBpZihwMS54KSB7XHJcbiAgICAgICAgdGhpcy5vcDEgPSBwMTtcclxuICAgICAgICB0aGlzLm9wMiA9IHAyO1xyXG4gICAgICAgIHRoaXMucDEgPSAocDEueCA8PSBwMi54KT8gcDEgOiBwMjtcclxuICAgICAgICB0aGlzLnAyID0gKHAxLnggPiBwMi54KT8gcDEgOiBwMjtcclxuICAgICAgICB0aGlzLm0gPSB0aGlzLmNhbGNHcmFkaWVudCgpO1xyXG4gICAgICAgIHRoaXMudCA9IHRoaXMuY2FsY1lJbnRlcmNlcHQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tID0gcDE7XHJcbiAgICAgICAgdGhpcy50ID0gcDI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjWUludGVyY2VwdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8geSA9IG0gKiB4ICsgdCA9PiB0ID0gLW14ICsgeVxyXG4gICAgcmV0dXJuICgtMSAqIHRoaXMubSAqIHRoaXMucDEueCkgKyB0aGlzLnAxLnk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5nZXRPcnRob2dvbmFsID0gZnVuY3Rpb24ocCkge1xyXG4gICAgLy9cclxuICAgIHZhciBuZXdNID0gLTEgLyB0aGlzLm07XHJcbiAgICB2YXIgdCA9IHAueSAtIChuZXdNICogcC54KTtcclxuICAgIHJldHVybiBuZXcgTGluZShuZXdNLHQpO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY0dyYWRpZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gTGluZS5jYWxjR3JhZGllbnQodGhpcy5wMSwgdGhpcy5wMik7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5jYWxjTm9ybWFsaXplZExpbmVWZWN0b3IgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBMaW5lLmNhbGNOb3JtYWxpemVkTGluZVZlY3Rvcih0aGlzLnAxLCB0aGlzLnAyKTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmlzTHRSID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcDEueCA8IHRoaXMub3AyLng7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5pc1R0QiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3AxLnkgPCB0aGlzLm9wMi55O1xyXG59O1xyXG5cclxuXHJcbkxpbmUuY2FsY05vcm1hbGl6ZWRMaW5lVmVjdG9yID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICB2YXIgdmVjdG9yID0ge1xyXG4gICAgICAgIHggOiBwMi54IC0gcDEueCxcclxuICAgICAgICB5IDogcDIueSAtIHAxLnlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh2ZWN0b3IueCp2ZWN0b3IueCArIHZlY3Rvci55KnZlY3Rvci55KTtcclxuXHJcbiAgICB2ZWN0b3IueCA9IHZlY3Rvci54IC8gbGVuZ3RoO1xyXG4gICAgdmVjdG9yLnkgPSB2ZWN0b3IueSAvIGxlbmd0aDtcclxuICAgIHJldHVybiB2ZWN0b3I7XHJcbn07XHJcblxyXG4vKlxyXG4gKiAgVE9ETzogdGhpcyBpcyB3b3JraW5nIGlmIHlvdSBwcm92aWRlIHN0YXJ0L2VuZCBhbmQgZGlzdGFuY2UgKG5lZ2F0aXZlIG9yIHBvc2l0aXZlKSBidXQgbm90IHRlc3RlZCAoYW5kIHByZXN1bWFibHkgbm90IHdvcmtpbmcpXHJcbiAqICB3aGVuIGdpdmVuIHN0YXJ0L2VuZCBkaXN0IGFuZCBkaXJlY3Rpb24gZS5nIG1vdmUgZnJvbSBzdGFydCBwb2ludCAtMzAgYmFjay5cclxuICovXHJcbkxpbmUubW92ZUFsb25nID0gZnVuY3Rpb24ocDEscDIsIGRpc3QsIGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHZlY3RvciA9IExpbmUuY2FsY05vcm1hbGl6ZWRMaW5lVmVjdG9yKHAxLHAyKTtcclxuXHJcbiAgICAvL0lmIHRoZXJlIGlzIG5vIGRpcmVjdGlvbiBnaXZlbiB3ZSBoYW5kbGUgbmVnYXRpdmUgZGlzdGFuY2VzIGFzIGRpcmVjdGlvbiAtMSAoZnJvbSBlbmQgdG8gc3RhcnQpXHJcbiAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24gfHwgKGRpc3QgPCAwKSA/IC0xIDogMTtcclxuXHJcbiAgICBpZihkaXJlY3Rpb24gPCAxKSB7XHJcbiAgICAgICAgZGlzdCA9IExpbmUuY2FsY0Rpc3RhbmNlKHAxLHAyKSArIGRpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogcDEueCArIHZlY3Rvci54ICogZGlzdCxcclxuICAgICAgICB5IDogcDEueSArIHZlY3Rvci55ICogZGlzdFxyXG4gICAgfTtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLm1vdmVBbG9uZyA9IGZ1bmN0aW9uKGRpc3QsIGRpcmVjdGlvbikge1xyXG4gICAgLy9UT0RPOiBub3RlIHRoaXMgaXMganVzdCB3b3JraW5nIGlmIHdlIGFyZSBpbml0aWF0aW5nIHRoZSBsaW5lIHdpdGggdHdvIHBvaW50cy4uLlxyXG4gICAgcmV0dXJuIExpbmUubW92ZUFsb25nKHRoaXMucDEsIHRoaXMucDIsIGRpc3QsIGRpcmVjdGlvbik7XHJcbn07XHJcblxyXG5MaW5lLmNhbGNHcmFkaWVudCA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIChwMi55IC0gcDEueSkgLyAocDIueCAtIHAxLngpO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY0ZYID0gZnVuY3Rpb24oeCkge1xyXG4gICAgdmFyIHkgPSAodGhpcy5tKSAqIHggKyB0aGlzLnQ7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHggOiB4LFxyXG4gICAgICAgIHkgOiB5XHJcbiAgICB9O1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuY2FsY01pZFBvaW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gTGluZS5jYWxjTWlkUG9pbnQodGhpcy5wMSwgdGhpcy5wMik7XHJcbn07XHJcblxyXG5MaW5lLmNhbGNNaWRQb2ludCA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogKHAxLngrcDIueCkgLyAyLFxyXG4gICAgICAgIHkgOiAocDEueStwMi55KSAvIDJcclxuICAgIH07XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5pc1ZlcnRpY2FsID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuICFpc0Zpbml0ZSh0aGlzLm0pO1xyXG59O1xyXG5cclxuTGluZS5wcm90b3R5cGUuaXNIb3Jpem9udGFsID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIHRoaXMubSA9PT0gMDtcclxufTtcclxuXHJcbkxpbmUucHJvdG90eXBlLmNhbGNMaW5lSW50ZXJjZXB0ID0gZnVuY3Rpb24ob3RoZXIpIHtcclxuICAgIC8vbXgoMSkgKyB0KDEpID0gbXgoMikgK3QoMilcclxuICAgIHZhciBtID0gb3RoZXIubSArICgtMSAqIHRoaXMubSk7XHJcbiAgICB2YXIgdCA9IHRoaXMudCArICgtMSAqIG90aGVyLnQpO1xyXG4gICAgdmFyIHggPSAobSAhPT0gMCkgPyB0IC8gbSA6IHQ7XHJcbiAgICByZXR1cm4gdGhpcy5jYWxjRlgoeCk7XHJcbn07XHJcblxyXG5MaW5lLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnQgPSBmdW5jdGlvbihwKSB7XHJcbiAgICByZXR1cm4gTGluZS5nZXROZWFyZXN0UG9pbnQodGhpcy5wMSwgdGhpcy5wMiwgcCk7XHJcbn07XHJcblxyXG5MaW5lLmdldE5lYXJlc3RQb2ludCA9IGZ1bmN0aW9uKGEsIGIsIHApIHtcclxuICAgIHZhciBBUCA9IFtwLnggLSBhLngsIHAueSAtIGEueV07IC8vIHZlY3RvciBBLT5QXHJcbiAgICB2YXIgQUIgPSBbYi54IC0gYS54LCBiLnkgLSBhLnldOyAvLyB2ZWN0b3IgQS0+QlxyXG4gICAgdmFyIG1hZ25pdHVkZSA9IEFCWzBdICogQUJbMF0gKyBBQlsxXSAqIEFCWzFdIC8vQUIuTGVuZ3RoU3F1YXJlZFxyXG5cclxuICAgIHZhciBBUF9ET1RfQUIgPSBBUFswXSAqIEFCWzBdICsgQVBbMV0gKiBBQlsxXTtcclxuXHJcbiAgICB2YXIgZGlzdGFuY2UgPSBBUF9ET1RfQUIgLyBtYWduaXR1ZGU7XHJcblxyXG4gICAgaWYoZGlzdGFuY2UgPCAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGE7XHJcbiAgICB9IGVsc2UgaWYgKGRpc3RhbmNlID4gMSkge1xyXG4gICAgICAgIHJldHVybiBiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBhLnggKyBBQlswXSAqIGRpc3RhbmNlLFxyXG4gICAgICAgICAgICB5OiBhLnkgKyBBQlsxXSAqIGRpc3RhbmNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuTGluZS5jYWxjRGlzdGFuY2UgPSBmdW5jdGlvbihwMSwgcDIpIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coKHAyLnkgLSBwMS55KSwyKSArIE1hdGgucG93KChwMi54IC0gcDEueCksMikpO1xyXG59XHJcblxyXG52YXIgU2ltcGxlVmVjdG9yID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbn07XHJcblxyXG5TaW1wbGVWZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHRoYXQpIHtcclxuICAgIHJldHVybiB0aGlzLngqdGhhdC54ICsgdGhpcy55KnRoYXQueTtcclxufTtcclxuXHJcblNpbXBsZVZlY3Rvci5mcm9tUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICByZXR1cm4gbmV3IFNpbXBsZVZlY3RvcihcclxuICAgICAgICBwMi54IC0gcDEueCxcclxuICAgICAgICBwMi55IC0gcDEueVxyXG4gICAgKTtcclxufTtcclxuXHJcblNpbXBsZVZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih0aGF0KSB7XHJcbiAgICByZXR1cm4gbmV3IFNpbXBsZVZlY3Rvcih0aGlzLnggLSB0aGF0LngsIHRoaXMueSAtIHRoYXQueSk7XHJcbn07XHJcblxyXG52YXIgRWxsaXBzZSA9IGZ1bmN0aW9uKGN4LCBjeSwgcngsIHJ5KSB7XHJcbiAgICBzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgdGhpcy5jID0ge3g6Y3gseTpjeX07XHJcbiAgICAgICAgICAgIHRoaXMucnggPSByeDtcclxuICAgICAgICAgICAgdGhpcy5yeSA9IHJ5O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIHRoaXMuYyA9IGN4O1xyXG4gICAgICAgICAgICB0aGlzLnJ4ID0gY3k7XHJcbiAgICAgICAgICAgIHRoaXMucnkgPSByeDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5jYWxjTGluZUludGVyY2VwdCA9IGZ1bmN0aW9uKHAxLHAyKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHAyID0gcDEucDI7XHJcbiAgICAgICAgcDEgPSBwMS5wMTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb3JpZ2luID0gbmV3IFNpbXBsZVZlY3RvcihwMS54LCBwMS55KTtcclxuICAgIHZhciBkaXIgPSBTaW1wbGVWZWN0b3IuZnJvbVBvaW50cyhwMSwgcDIpO1xyXG4gICAgdmFyIGNlbnRlciA9IG5ldyBTaW1wbGVWZWN0b3IodGhpcy5jLngsIHRoaXMuYy55KTtcclxuICAgIHZhciBkaWZmID0gb3JpZ2luLnN1YnRyYWN0KGNlbnRlcik7XHJcbiAgICB2YXIgbURpciA9IG5ldyBTaW1wbGVWZWN0b3IoZGlyLngvKHRoaXMucngqdGhpcy5yeCksICBkaXIueS8odGhpcy5yeSp0aGlzLnJ5KSk7XHJcbiAgICB2YXIgbURpZmYgPSBuZXcgU2ltcGxlVmVjdG9yKGRpZmYueC8odGhpcy5yeCp0aGlzLnJ4KSwgZGlmZi55Lyh0aGlzLnJ5KnRoaXMucnkpKTtcclxuXHJcbiAgICB2YXIgYURpZmYgPSBkaXIuZG90KG1EaXIpO1xyXG4gICAgdmFyIGJEaWZmID0gZGlyLmRvdChtRGlmZik7XHJcbiAgICB2YXIgY0RpZmYgPSBkaWZmLmRvdChtRGlmZikgLSAxLjA7XHJcbiAgICB2YXIgZERpZmYgPSBiRGlmZipiRGlmZiAtIGFEaWZmKmNEaWZmO1xyXG5cclxuICAgIGlmIChkRGlmZiA+IDApIHtcclxuICAgICAgICB2YXIgcm9vdCA9IE1hdGguc3FydChkRGlmZik7XHJcbiAgICAgICAgdmFyIHRBICA9ICgtYkRpZmYgLSByb290KSAvIGFEaWZmO1xyXG4gICAgICAgIHZhciB0QiAgPSAoLWJEaWZmICsgcm9vdCkgLyBhRGlmZjtcclxuXHJcbiAgICAgICAgaWYgKCEoKHRBIDwgMCB8fCAxIDwgdEEpICYmICh0QiA8IDAgfHwgMSA8IHRCKSkpIHtcclxuICAgICAgICAgICAgaWYgKDAgPD0gdEEgJiYgdEEgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMSwgcDIsIHRBKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCAwIDw9IHRCICYmIHRCIDw9IDEgKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsZXJwKHAxLCBwMiwgdEIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHQgPSAtYkRpZmYvYURpZmY7XHJcbiAgICAgICAgaWYgKDAgPD0gdCAmJiB0IDw9IDEpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMS4gYTIsIHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLm92ZXJsYXlzID0gZnVuY3Rpb24ocCkge1xyXG4gICAgdmFyIGJ4ID0gTWF0aC5wb3coKHAueCAtIHRoaXMuYy54KSwgMikgLyBNYXRoLnBvdyh0aGlzLnJ4LCAyKTtcclxuICAgIHZhciBieSA9IE1hdGgucG93KChwLnkgLSB0aGlzLmMueSksIDIpIC8gTWF0aC5wb3codGhpcy5yeSwgMik7XHJcbiAgICByZXR1cm4gYnggKyBieSA8PSAxXHJcbn07XHJcblxyXG52YXIgQ2lyY2xlID0gZnVuY3Rpb24oY3gsIGN5LCByKSB7XHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgdGhpcy5jID0gY3g7XHJcbiAgICAgICAgdGhpcy5yID0gY3k7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYyA9IHt4OiBjeCwgeSA6IGN5fTtcclxuICAgICAgICB0aGlzLnIgPSByO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQ2lyY2xlLnByb3RvdHlwZS5vdmVybGF5cyA9IGZ1bmN0aW9uKHApIHtcclxuICAgIHZhciBieCA9IE1hdGgucG93KChwLnggLSB0aGlzLmMueCksIDIpO1xyXG4gICAgdmFyIGJ5ID0gTWF0aC5wb3coKHAueSAtIHRoaXMuYy55KSwgMik7XHJcbiAgICByZXR1cm4gYnggKyBieSA8IE1hdGgucG93KHRoaXMuciwgMik7XHJcbn07XHJcblxyXG5DaXJjbGUucHJvdG90eXBlLmNhbGNMaW5lSW50ZXJjZXB0ID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHAyID0gcDEucDI7XHJcbiAgICAgICAgcDEgPSBwMS5wMTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYSA9IChwMi54IC0gcDEueCkgKiAocDIueCAtIHAxLngpXHJcbiAgICAgICAgKyAocDIueSAtIHAxLnkpICogKHAyLnkgLSBwMS55KTtcclxuICAgIHZhciBiICA9IDIgKiAoKHAyLnggLSBwMS54KSAqIChwMS54IC0gdGhpcy5jLngpXHJcbiAgICAgICAgKyAocDIueSAtIHAxLnkpICogKHAxLnkgLSB0aGlzLmMueSkgICApO1xyXG4gICAgdmFyIGNjID0gdGhpcy5jLngqdGhpcy5jLnggKyB0aGlzLmMueSp0aGlzLmMueSArIHAxLngqcDEueCArIHAxLnkqcDEueSAtXHJcbiAgICAgICAgMiAqICh0aGlzLmMueCAqIHAxLnggKyB0aGlzLmMueSAqIHAxLnkpIC0gdGhpcy5yKnRoaXMucjtcclxuICAgIHZhciBkZXRlciA9IGIqYiAtIDQqYSpjYztcclxuXHJcbiAgICBpZihkZXRlciA+IDApIHtcclxuICAgICAgICB2YXIgcm9vdCAgPSBNYXRoLnNxcnQoZGV0ZXIpO1xyXG4gICAgICAgIHZhciB0QSA9ICgtYiArIHJvb3QpIC8gKDIqYSk7XHJcbiAgICAgICAgdmFyIHRCID0gKC1iIC0gcm9vdCkgLyAoMiphKTtcclxuXHJcbiAgICAgICAgaWYgKCEoKHRBIDwgMCB8fCB0QSA+IDEpICYmICh0QiA8IDAgfHwgdEIgPiAxKSkpIHtcclxuICAgICAgICAgICAgaWYgKDAgPD0gdEEgJiYgdEEgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVycChwMSwgcDIsIHRBKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICgwIDw9IHRCICYmIHRCIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxlcnAocDEsIHAyLCB0QikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBsZXJwID0gZnVuY3Rpb24oYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4IDogYS54ICsgKGIueCAtIGEueCkgKiB0LFxyXG4gICAgICAgIHkgOiBhLnkgKyAoYi55IC0gYS55KSAqIHRcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgVmVjdG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnZlY3RvcnMgPSBbXTtcclxuICAgIHZhciBjdXJyZW50QXJyO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKG9iamVjdC5pc0FycmF5KGFyZ3VtZW50c1tpXSkpIHtcclxuICAgICAgICAgICAgaWYoY3VycmVudEFycikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGQoY3VycmVudEFycik7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50QXJyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3VycmVudEFyciA9IGN1cnJlbnRBcnIgfHwgW107XHJcbiAgICAgICAgICAgIGN1cnJlbnRBcnIucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYoY3VycmVudEFycikge1xyXG4gICAgICAgIHRoaXMuYWRkKGN1cnJlbnRBcnIpO1xyXG4gICAgICAgIGRlbGV0ZSBjdXJyZW50QXJyO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB2ZWN0b3IgdmFsdWUgZWl0aGVyIGJ5IHByb3ZpZGluZyBzZXBlcmF0ZWQgYXJndW1lbnRzIG9yIGFuIGFycmF5IG9mIHZhbHVlc1xyXG4gKi9cclxuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciB2YWx1ZTtcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgdmFsdWUgPSBbXTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlLnB1c2goYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHZhbHVlID0gYXJndW1lbnRzWzBdO1xyXG4gICAgfVxyXG4gICAgdGhpcy52ZWN0b3JzLnB1c2godmFsdWUpO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcGF0aCA9IG9iamVjdC5pc0FycmF5KGFyZ3VtZW50c1swXSkgPyBhcmd1bWVudHNbMF0gOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG4gICAgICAgIHJldHVybiBnZXRWZWN0b3JWYWx1ZSh0aGlzLnZlY3RvcnMsIHBhdGgpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignZ2V0IHZhbHVlIHZlY3RvciBmYWlsZWQgLSAnK3RoaXMudmVjdG9ycysnIGFyZ3M6ICcrYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcblZlY3Rvci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudmVjdG9ycyA9IFtdO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHBhdGhBcnIsIHZhbHVlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHBhdGhBcnIgPSAhb2JqZWN0LmlzQXJyYXkocGF0aEFycikgPyBbcGF0aEFycl0gOiBwYXRoQXJyO1xyXG4gICAgICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aEFyci5zcGxpY2UoMCwgcGF0aEFyci5sZW5ndGggLTEpO1xyXG4gICAgICAgIHRoaXMudmFsdWUocGFyZW50UGF0aClbcGF0aEFycltwYXRoQXJyLmxlbmd0aCAtMV1dID0gdmFsdWU7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdzZXQgdmFsdWUgdmVjdG9yIGZhaWxlZCAtICcrdGhpcy52ZWN0b3JzKycgYXJnczogJythcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihwYXRoQXJyLCB2YWx1ZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBwYXRoQXJyID0gIW9iamVjdC5pc0FycmF5KHBhdGhBcnIpID8gW3BhdGhBcnJdIDogcGF0aEFycjtcclxuICAgICAgICB2YXIgcGFyZW50UGF0aCA9IHBhdGhBcnIuc3BsaWNlKDAsIHBhdGhBcnIubGVuZ3RoIC0xKTtcclxuICAgICAgICB0aGlzLnZhbHVlKHBhcmVudFBhdGgpLnNwbGljZShwYXRoQXJyW3BhdGhBcnIubGVuZ3RoIC0xXSwgMCwgdmFsdWUpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignc2V0IHZhbHVlIHZlY3RvciBmYWlsZWQgLSAnK3RoaXMudmVjdG9ycysnIGFyZ3M6ICcrYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcblZlY3Rvci5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3JzLmxlbmd0aDtcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihwYXRoQXJyKSB7XHJcbiAgICBwYXRoQXJyID0gIW9iamVjdC5pc0FycmF5KHBhdGhBcnIpID8gW3BhdGhBcnJdIDogcGF0aEFycjtcclxuICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aEFyci5zcGxpY2UoMCwgcGF0aEFyci5sZW5ndGggLTEpO1xyXG4gICAgdGhpcy52YWx1ZShwYXJlbnRQYXRoKS5zcGxpY2UocGF0aEFycltwYXRoQXJyLmxlbmd0aCAtMV0sIDEpO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52ZWN0b3JzW3RoaXMudmVjdG9ycy5sZW5ndGggLTFdO1xyXG59O1xyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24oaGFuZGxlcikge1xyXG4gICAgb2JqZWN0LmVhY2godGhpcy52ZWN0b3JzLCBmdW5jdGlvbihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBoYW5kbGVyKGluZGV4LHZhbHVlKTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5vdGUgdGhlIGluZGV4ZXMgY2FuIGJlIG5lZ2F0aXZlIHRvIHJldHJpZXZlIHZhbHVlcyBmcm9tIHRoZSBlbmQgb2YgdGhlIHZlY3RvciBlLmcuIC0xIGlzIHRoZSBsYXN0XHJcbiAqIEBwYXJhbSB2ZWN0b3JBcnJcclxuICogQHBhcmFtIGFyZ3NcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG52YXIgZ2V0VmVjdG9yVmFsdWUgPSBmdW5jdGlvbih2ZWN0b3JBcnIsIGFyZ3MpIHtcclxuICAgIGlmKCFhcmdzKSB7XHJcbiAgICAgICAgcmV0dXJuIHZlY3RvckFycjtcclxuICAgIH1lbHNlIGlmKG9iamVjdC5pc0FycmF5KGFyZ3MpKSB7XHJcbiAgICAgICAgc3dpdGNoKGFyZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB2ZWN0b3JBcnI7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3QudmFsdWVCeUluZGV4KHZlY3RvckFyciwgYXJnc1swXSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFZlY3RvclZhbHVlKHZlY3RvckFycltpbmRleF0sIGFyZ3Muc3BsaWNlKDEpKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBvYmplY3QudmFsdWVCeUluZGV4KHZlY3RvckFyciwgYXJncyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gc291cmNlIGFuZCB0YXJnZXQgdmFsdWUgaXMgbG93ZXIgdGhhbiB0aGUgZ2l2ZW4gcmFuZ2UgdmFsdWVcclxuICovXHJcbnZhciBjaGVja1JhbmdlRGlmZiA9IGZ1bmN0aW9uKHNvdXJjZSwgdGFyZ2V0LCByYW5nZSkge1xyXG4gICAgcmV0dXJuIGlzSW5EaWZmUmFuZ2UodGFyZ2V0LCBzb3VyY2UsIHJhbmdlKTtcclxufTtcclxuXHJcbnZhciBpc0luRGlmZlJhbmdlID0gZnVuY3Rpb24ocDEsIHAyLCByYW5nZSkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKHAxIC0gcDIpIDwgcmFuZ2U7XHJcbn07XHJcblxyXG52YXIgZ2V0UG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYoeCAmJiBvYmplY3QuaXNEZWZpbmVkKHgueCkgJiYgb2JqZWN0LmlzRGVmaW5lZCh4LnkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0geDtcclxuICAgIH0gZWxzZSBpZighaXNOYU4oeCkgJiYgIWlzTmFOKHkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICB4IDogeCxcclxuICAgICAgICAgICAgeSA6IHlcclxuICAgICAgICB9O1xyXG4gICAgfSBlbHNlIGlmKG9iamVjdC5pc0RlZmluZWQoeCkgJiYgb2JqZWN0LmlzRGVmaW5lZCh5KSkge1xyXG4gICAgICAgIHJlc3VsdCA9IHRvUG9pbnQoeCx5KTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgdG9Qb2ludCA9IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgeCA9IChvYmplY3QuaXNTdHJpbmcoeCkpID8gcGFyc2VGbG9hdCh4KSA6IHg7XHJcbiAgICB5ID0gKG9iamVjdC5pc1N0cmluZyh5KSkgPyBwYXJzZUZsb2F0KHkpIDogeTtcclxuXHJcbiAgICByZXR1cm4ge3g6eCx5Onl9O1xyXG59O1xyXG5cclxudmFyIHRvUmFkaWFucyA9IGZ1bmN0aW9uIChhbmdsZSkge1xyXG4gICAgcmV0dXJuIGFuZ2xlICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxudmFyIHRvRGVncmVlcyA9IGZ1bmN0aW9uKGFuZ2xlKSB7XHJcbiAgICByZXR1cm4gYW5nbGUgKiAoMTgwIC8gTWF0aC5QSSk7XHJcbn07XHJcblxyXG52YXIgcm90YXRlID0gZnVuY3Rpb24ocCwgcm90Q2VudGVyLCBhbmdsZSkge1xyXG4gICAgaWYoYW5nbGUgPT09IDAgfHwgKHAueCA9PT0gcm90Q2VudGVyLnggJiYgcC55ID09PSByb3RDZW50ZXIueSkpIHtcclxuICAgICAgICByZXR1cm4gcDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcm90YXRlZCA9IHt9O1xyXG4gICAgdmFyIHJhZCA9IHRvUmFkaWFucyhhbmdsZSk7XHJcbiAgICByb3RhdGVkLnggPSAocC54IC0gcm90Q2VudGVyLngpICogTWF0aC5jb3MocmFkKSAtIChwLnkgLSByb3RDZW50ZXIueSkgKiBNYXRoLnNpbihyYWQpICsgcm90Q2VudGVyLng7XHJcbiAgICByb3RhdGVkLnkgPSAocC55IC0gcm90Q2VudGVyLnkpICogTWF0aC5jb3MocmFkKSArIChwLnggLSByb3RDZW50ZXIueCkgKiBNYXRoLnNpbihyYWQpICsgcm90Q2VudGVyLnk7XHJcbiAgICBwLnggPSByb3RhdGVkLng7XHJcbiAgICBwLnkgPSByb3RhdGVkLnk7XHJcbiAgICByZXR1cm4gcDtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNhbGNMaW5lSW50ZXJzZWN0aW9uIDogY2FsY0xpbmVJbnRlcnNlY3Rpb24sXHJcbiAgICBMaW5lIDogTGluZSxcclxuICAgIENpcmNsZSA6IENpcmNsZSxcclxuICAgIEVsbGlwc2UgOiBFbGxpcHNlLFxyXG4gICAgVmVjdG9yIDogVmVjdG9yLFxyXG4gICAgUG9pbnQgOiBQb2ludCxcclxuICAgIGlzUG9pbnRJbkludGVydmFsIDogaXNQb2ludEluSW50ZXJ2YWwsXHJcbiAgICBtaW5NYXggOiBtaW5NYXgsXHJcbiAgICBjaGVja1JhbmdlRGlmZiA6IGNoZWNrUmFuZ2VEaWZmLFxyXG4gICAgZ2V0UG9pbnQgOiBnZXRQb2ludCxcclxuICAgIGJlemllciA6IGJlemllcixcclxuICAgIHRvUmFkaWFucyA6IHRvUmFkaWFucyxcclxuICAgIHRvRGVncmVlcyA6IHRvRGVncmVlcyxcclxuICAgIHJvdGF0ZSA6IHJvdGF0ZVxyXG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZWFjaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICQuZWFjaChhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ3JlcDogZnVuY3Rpb24oYXJyLCBmaWx0ZXIsIGludmVydCkge1xyXG4gICAgICAgIHJldHVybiAkLmdyZXAoYXJyLCBmaWx0ZXIsIGludmVydCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzT25lT2Y6IGZ1bmN0aW9uKHNlYXJjaCkge1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIGZvcihpID0gMTtpIDwgYXJndW1lbnRzLmxlbmd0aDtpKyspIHtcclxuICAgICAgICAgIGlmKHNlYXJjaCA9PT0gYXJndW1lbnRzW2ldKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNBcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQuaXNBcnJheShvYmopO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5IDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbdmFsdWVdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVGcm9tQXJyYXk6IGZ1bmN0aW9uKGFyciwgaXRlbSkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IGFyci5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIGlmKGluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKG9iaiwgc29ydCkge1xyXG4gICAgICAgIHZhciBhcnI7XHJcbiAgICAgICAgaWYoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG9iajtcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgICAgIGFyciA9ICQubWFwKG9iaiwgZnVuY3Rpb24gKGluZGV4LCB2YWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyLnNvcnQoc29ydCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbHVlQnlJbmRleDogZnVuY3Rpb24oYXJyLCBpbmRleCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoYXJyLGluZGV4KTtcclxuICAgICAgICByZXR1cm4gYXJyW2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5kZXg6IGZ1bmN0aW9uKGFyciwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gaW5kZXg7XHJcbiAgICAgICAgLy8gZm9yIG5lZ2F0aXZlIGluZGV4ZXMgd2UgcmV0dXJuIHZhbHVlcyBjb3VudGVkIGZyb20gdGhlIG90aGVyIHNpZGUgc28gLTEgaXMgdGhlIGxhc3QgaW5kZXhcclxuICAgICAgICAvLyBpZiB0aGUgbmVnYXRpdmUgaW5kZXggaXMgb3V0IG9mIHJhbmdlIHdlIHJldHVybiB0aGUgbGFzdCBpbmRleC5cclxuICAgICAgICBpZihpbmRleCA8IDApIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gYXJyLmxlbmd0aCArIGluZGV4O1xyXG4gICAgICAgICAgICByZXN1bHQgPSAocmVzdWx0ID4gYXJyLmxlbmd0aCAtMSB8fCByZXN1bHQgPCAwKSA/IGFyci5sZW5ndGggLTEgOiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzRnVuY3Rpb246IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcclxuICAgIH0sXHJcblxyXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiAkLmlzUGxhaW5PYmplY3Qob2JqKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNKUXVlcnk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiBvYmouanF1ZXJ5O1xyXG4gICAgfSxcclxuXHJcbiAgICBpc1N0cmluZzogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdzdHJpbmcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0Jvb2xlYW46IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnYm9vbGVhbic7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzRGVmaW5lZDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhhdC5pc0RlZmluZWQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqICE9PSAndW5kZWZpbmVkJztcclxuICAgIH0sXHJcblxyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKHRhcmdldCwgdG9NZXJnZSkge1xyXG4gICAgICAgIHJldHVybiAkLm1lcmdlKHRhcmdldCwgdG9NZXJnZSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBhZGRWYWx1ZTogZnVuY3Rpb24odGFyZ2V0LCBuZXdWYWwpIHtcclxuICAgICAgICBpZihpc0FycmF5KG5ld1ZhbCkpIHtcclxuICAgICAgICAgICAgbWVyZ2UodGFyZ2V0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YXJnZXQucHVzaChuZXdWYWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbih0YXJnZXQsIG9iajEsIG9iajIpIHtcclxuICAgICAgICByZXR1cm4gJC5leHRlbmQodGFyZ2V0LG9iajEsb2JqMik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lQXJyYXk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBhcnIuc2xpY2UoMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lT2JqZWN0OiBmdW5jdGlvbihvbGRPYmplY3QsIGRlZXApIHtcclxuICAgICAgICBkZWVwID0gZGVlcCB8fCBmYWxzZTtcclxuICAgICAgICByZXR1cm4gJC5leHRlbmQoZGVlcCwge30sIG9sZE9iamVjdCk7XHJcbiAgICB9XHJcbiAgICBcclxufTsiLCJ2YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi9vYmplY3QnKTtcclxuXHJcbmV4cG9ydHMuZW5kc1dpdGggPSBmdW5jdGlvbih2YWwsIHN1ZmZpeCkge1xyXG4gICAgaWYoIW9iamVjdC5pc0RlZmluZWQodmFsKSB8fCAhb2JqZWN0LmlzRGVmaW5lZChzdWZmaXgpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbC5pbmRleE9mKHN1ZmZpeCwgdmFsLmxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgpICE9PSAtMTtcclxufTtcclxuXHJcbmV4cG9ydHMuc3RhcnRzV2l0aCA9IGZ1bmN0aW9uKHZhbCwgcHJlZml4KSB7XHJcbiAgICBpZighb2JqZWN0LmlzRGVmaW5lZCh2YWwpIHx8ICFvYmplY3QuaXNEZWZpbmVkKHByZWZpeCkpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsLmluZGV4T2YocHJlZml4KSA9PT0gMDtcclxufTsiLCJ2YXIgc3RyaW5nID0gcmVxdWlyZSgnLi9zdHJpbmcnKTtcclxuXHJcbnZhciBzZXJpYWxpemVUb1N0cmluZyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHZhciBzID0gbmV3IFhNTFNlcmlhbGl6ZXIoKTtcclxuICAgIG5vZGUgPSAobm9kZS5qUXVlcnkpID8gbm9kZVswXSA6IG5vZGU7XHJcbiAgICByZXR1cm4gcy5zZXJpYWxpemVUb1N0cmluZyhub2RlKTtcclxufTtcclxuXHJcbnZhciBwYXJzZVhNTCA9IGZ1bmN0aW9uKHN0ckRhdGEpIHtcclxuICAgIHJldHVybiAkLnBhcnNlWE1MKHN0ckRhdGEpO1xyXG59O1xyXG5cclxudmFyIGZvcm1hdCA9IGZ1bmN0aW9uICh4bWwpIHtcclxuICAgIHZhciBpbnRlbmQgPSAtMTtcclxuICAgIHZhciByZXN1bHQgPSAnJztcclxuICAgIHhtbCA9IHhtbC5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLFwiXCIpO1xyXG4gICAgdmFyIGxhc3RXYXNDbG9zZSA9IGZhbHNlO1xyXG4gICAgdmFyIGxhc3RIYWRUZXh0ID0gZmFsc2U7XHJcbiAgICAkLmVhY2goeG1sLnNwbGl0KCc8JyksIGZ1bmN0aW9uKGluZGV4LCBub2RlKSB7XHJcbiAgICAgICAgbm9kZSA9IG5vZGUudHJpbSgpO1xyXG4gICAgICAgIGlmKG5vZGUpIHtcclxuICAgICAgICAgICAgaWYobm9kZS5pbmRleE9mKCcvJykgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmKCFsYXN0V2FzQ2xvc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnRlbmQrKztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsYXN0SGFkVGV4dCA9ICFzdHJpbmcuZW5kc1dpdGgobm9kZSwgJz4nKTtcclxuICAgICAgICAgICAgICAgIGxhc3RXYXNDbG9zZSA9IHN0cmluZy5lbmRzV2l0aChub2RlLCAnLz4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKCFsYXN0SGFkVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RXYXNDbG9zZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5kLS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsYXN0SGFkVGV4dCA9ICFzdHJpbmcuZW5kc1dpdGgobm9kZSwgJz4nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhZGRpbmcgPSAnJztcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnRlbmQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcGFkZGluZyArPSAnICAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgdGV4dDtcclxuICAgICAgICAgICAgaWYobGFzdEhhZFRleHQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzcGxpdHRlZCA9IG5vZGUuc3BsaXQoJz4nKTtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSBzcGxpdHRlZFswXSArICc+JztcclxuICAgICAgICAgICAgICAgIHRleHQgPSBzcGxpdHRlZFsxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQgKz0gcGFkZGluZyArICc8Jytub2RlKydcXHJcXG4nO1xyXG5cclxuICAgICAgICAgICAgaWYodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHBhZGRpbmcgKyAnICAnICsgdGV4dCsnXFxyXFxuJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlcmlhbGl6ZVRvU3RyaW5nIDogc2VyaWFsaXplVG9TdHJpbmcsXHJcbiAgICBwYXJzZVhNTCA6IHBhcnNlWE1MLFxyXG4gICAgZm9ybWF0OiBmb3JtYXRcclxufTsiLCIvKiBAcHJlc2VydmVcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgUGV0a2EgQW50b25vdlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICogXG4gKi9cbi8qKlxuICogYmx1ZWJpcmQgYnVpbGQgdmVyc2lvbiAyLjkuMzRcbiAqIEZlYXR1cmVzIGVuYWJsZWQ6IGNvcmUsIHJhY2UsIGNhbGxfZ2V0LCBnZW5lcmF0b3JzLCBtYXAsIG5vZGVpZnksIHByb21pc2lmeSwgcHJvcHMsIHJlZHVjZSwgc2V0dGxlLCBzb21lLCBjYW5jZWwsIHVzaW5nLCBmaWx0ZXIsIGFueSwgZWFjaCwgdGltZXJzXG4qL1xuIWZ1bmN0aW9uKGUpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sZSk7ZWxzZXt2YXIgZjtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P2Y9d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Zj1nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJihmPXNlbGYpLGYuUHJvbWlzZT1lKCl9fShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgX2RlcmVxXz09XCJmdW5jdGlvblwiJiZfZGVyZXFfO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiBfZGVyZXFfPT1cImZ1bmN0aW9uXCImJl9kZXJlcV87Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG52YXIgU29tZVByb21pc2VBcnJheSA9IFByb21pc2UuX1NvbWVQcm9taXNlQXJyYXk7XG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICB2YXIgcmV0ID0gbmV3IFNvbWVQcm9taXNlQXJyYXkocHJvbWlzZXMpO1xuICAgIHZhciBwcm9taXNlID0gcmV0LnByb21pc2UoKTtcbiAgICByZXQuc2V0SG93TWFueSgxKTtcbiAgICByZXQuc2V0VW53cmFwKCk7XG4gICAgcmV0LmluaXQoKTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5hbnkgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gYW55KHByb21pc2VzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmFueSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYW55KHRoaXMpO1xufTtcblxufTtcblxufSx7fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBmaXJzdExpbmVFcnJvcjtcbnRyeSB7dGhyb3cgbmV3IEVycm9yKCk7IH0gY2F0Y2ggKGUpIHtmaXJzdExpbmVFcnJvciA9IGU7fVxudmFyIHNjaGVkdWxlID0gX2RlcmVxXyhcIi4vc2NoZWR1bGUuanNcIik7XG52YXIgUXVldWUgPSBfZGVyZXFfKFwiLi9xdWV1ZS5qc1wiKTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcblxuZnVuY3Rpb24gQXN5bmMoKSB7XG4gICAgdGhpcy5faXNUaWNrVXNlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2xhdGVRdWV1ZSA9IG5ldyBRdWV1ZSgxNik7XG4gICAgdGhpcy5fbm9ybWFsUXVldWUgPSBuZXcgUXVldWUoMTYpO1xuICAgIHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkID0gdHJ1ZTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5kcmFpblF1ZXVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5fZHJhaW5RdWV1ZXMoKTtcbiAgICB9O1xuICAgIHRoaXMuX3NjaGVkdWxlID1cbiAgICAgICAgc2NoZWR1bGUuaXNTdGF0aWMgPyBzY2hlZHVsZSh0aGlzLmRyYWluUXVldWVzKSA6IHNjaGVkdWxlO1xufVxuXG5Bc3luYy5wcm90b3R5cGUuZGlzYWJsZVRyYW1wb2xpbmVJZk5lY2Vzc2FyeSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmhhc0RldlRvb2xzKSB7XG4gICAgICAgIHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkID0gZmFsc2U7XG4gICAgfVxufTtcblxuQXN5bmMucHJvdG90eXBlLmVuYWJsZVRyYW1wb2xpbmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuX3RyYW1wb2xpbmVFbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX3RyYW1wb2xpbmVFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxuQXN5bmMucHJvdG90eXBlLmhhdmVJdGVtc1F1ZXVlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsUXVldWUubGVuZ3RoKCkgPiAwO1xufTtcblxuQXN5bmMucHJvdG90eXBlLnRocm93TGF0ZXIgPSBmdW5jdGlvbihmbiwgYXJnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgYXJnID0gZm47XG4gICAgICAgIGZuID0gZnVuY3Rpb24gKCkgeyB0aHJvdyBhcmc7IH07XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oYXJnKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfSBlbHNlIHRyeSB7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oYXJnKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhc3luYyBzY2hlZHVsZXIgYXZhaWxhYmxlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvbTNPVFhrXFx1MDAwYVwiKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBBc3luY0ludm9rZUxhdGVyKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdGhpcy5fbGF0ZVF1ZXVlLnB1c2goZm4sIHJlY2VpdmVyLCBhcmcpO1xuICAgIHRoaXMuX3F1ZXVlVGljaygpO1xufVxuXG5mdW5jdGlvbiBBc3luY0ludm9rZShmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlLnB1c2goZm4sIHJlY2VpdmVyLCBhcmcpO1xuICAgIHRoaXMuX3F1ZXVlVGljaygpO1xufVxuXG5mdW5jdGlvbiBBc3luY1NldHRsZVByb21pc2VzKHByb21pc2UpIHtcbiAgICB0aGlzLl9ub3JtYWxRdWV1ZS5fcHVzaE9uZShwcm9taXNlKTtcbiAgICB0aGlzLl9xdWV1ZVRpY2soKTtcbn1cblxuaWYgKCF1dGlsLmhhc0RldlRvb2xzKSB7XG4gICAgQXN5bmMucHJvdG90eXBlLmludm9rZUxhdGVyID0gQXN5bmNJbnZva2VMYXRlcjtcbiAgICBBc3luYy5wcm90b3R5cGUuaW52b2tlID0gQXN5bmNJbnZva2U7XG4gICAgQXN5bmMucHJvdG90eXBlLnNldHRsZVByb21pc2VzID0gQXN5bmNTZXR0bGVQcm9taXNlcztcbn0gZWxzZSB7XG4gICAgaWYgKHNjaGVkdWxlLmlzU3RhdGljKSB7XG4gICAgICAgIHNjaGVkdWxlID0gZnVuY3Rpb24oZm4pIHsgc2V0VGltZW91dChmbiwgMCk7IH07XG4gICAgfVxuICAgIEFzeW5jLnByb3RvdHlwZS5pbnZva2VMYXRlciA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgICAgICBpZiAodGhpcy5fdHJhbXBvbGluZUVuYWJsZWQpIHtcbiAgICAgICAgICAgIEFzeW5jSW52b2tlTGF0ZXIuY2FsbCh0aGlzLCBmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmbi5jYWxsKHJlY2VpdmVyLCBhcmcpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBBc3luYy5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgICAgIGlmICh0aGlzLl90cmFtcG9saW5lRW5hYmxlZCkge1xuICAgICAgICAgICAgQXN5bmNJbnZva2UuY2FsbCh0aGlzLCBmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKHJlY2VpdmVyLCBhcmcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQXN5bmMucHJvdG90eXBlLnNldHRsZVByb21pc2VzID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICBpZiAodGhpcy5fdHJhbXBvbGluZUVuYWJsZWQpIHtcbiAgICAgICAgICAgIEFzeW5jU2V0dGxlUHJvbWlzZXMuY2FsbCh0aGlzLCBwcm9taXNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHByb21pc2UuX3NldHRsZVByb21pc2VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbkFzeW5jLnByb3RvdHlwZS5pbnZva2VGaXJzdCA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlLnVuc2hpZnQoZm4sIHJlY2VpdmVyLCBhcmcpO1xuICAgIHRoaXMuX3F1ZXVlVGljaygpO1xufTtcblxuQXN5bmMucHJvdG90eXBlLl9kcmFpblF1ZXVlID0gZnVuY3Rpb24ocXVldWUpIHtcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgZm4uX3NldHRsZVByb21pc2VzKCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVjZWl2ZXIgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICB2YXIgYXJnID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgZm4uY2FsbChyZWNlaXZlciwgYXJnKTtcbiAgICB9XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuX2RyYWluUXVldWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RyYWluUXVldWUodGhpcy5fbm9ybWFsUXVldWUpO1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5fZHJhaW5RdWV1ZSh0aGlzLl9sYXRlUXVldWUpO1xufTtcblxuQXN5bmMucHJvdG90eXBlLl9xdWV1ZVRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9pc1RpY2tVc2VkKSB7XG4gICAgICAgIHRoaXMuX2lzVGlja1VzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zY2hlZHVsZSh0aGlzLmRyYWluUXVldWVzKTtcbiAgICB9XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuX3Jlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2lzVGlja1VzZWQgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEFzeW5jKCk7XG5tb2R1bGUuZXhwb3J0cy5maXJzdExpbmVFcnJvciA9IGZpcnN0TGluZUVycm9yO1xuXG59LHtcIi4vcXVldWUuanNcIjoyOCxcIi4vc2NoZWR1bGUuanNcIjozMSxcIi4vdXRpbC5qc1wiOjM4fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UpIHtcbnZhciByZWplY3RUaGlzID0gZnVuY3Rpb24oXywgZSkge1xuICAgIHRoaXMuX3JlamVjdChlKTtcbn07XG5cbnZhciB0YXJnZXRSZWplY3RlZCA9IGZ1bmN0aW9uKGUsIGNvbnRleHQpIHtcbiAgICBjb250ZXh0LnByb21pc2VSZWplY3Rpb25RdWV1ZWQgPSB0cnVlO1xuICAgIGNvbnRleHQuYmluZGluZ1Byb21pc2UuX3RoZW4ocmVqZWN0VGhpcywgcmVqZWN0VGhpcywgbnVsbCwgdGhpcywgZSk7XG59O1xuXG52YXIgYmluZGluZ1Jlc29sdmVkID0gZnVuY3Rpb24odGhpc0FyZywgY29udGV4dCkge1xuICAgIGlmICh0aGlzLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlQ2FsbGJhY2soY29udGV4dC50YXJnZXQpO1xuICAgIH1cbn07XG5cbnZhciBiaW5kaW5nUmVqZWN0ZWQgPSBmdW5jdGlvbihlLCBjb250ZXh0KSB7XG4gICAgaWYgKCFjb250ZXh0LnByb21pc2VSZWplY3Rpb25RdWV1ZWQpIHRoaXMuX3JlamVjdChlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAodGhpc0FyZykge1xuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXNBcmcpO1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0Ll9wcm9wYWdhdGVGcm9tKHRoaXMsIDEpO1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXQoKTtcblxuICAgIHJldC5fc2V0Qm91bmRUbyhtYXliZVByb21pc2UpO1xuICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcHJvbWlzZVJlamVjdGlvblF1ZXVlZDogZmFsc2UsXG4gICAgICAgICAgICBwcm9taXNlOiByZXQsXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgICAgIGJpbmRpbmdQcm9taXNlOiBtYXliZVByb21pc2VcbiAgICAgICAgfTtcbiAgICAgICAgdGFyZ2V0Ll90aGVuKElOVEVSTkFMLCB0YXJnZXRSZWplY3RlZCwgcmV0Ll9wcm9ncmVzcywgcmV0LCBjb250ZXh0KTtcbiAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKFxuICAgICAgICAgICAgYmluZGluZ1Jlc29sdmVkLCBiaW5kaW5nUmVqZWN0ZWQsIHJldC5fcHJvZ3Jlc3MsIHJldCwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0Ll9yZXNvbHZlQ2FsbGJhY2sodGFyZ2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRCb3VuZFRvID0gZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmogIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMTMxMDcyO1xuICAgICAgICB0aGlzLl9ib3VuZFRvID0gb2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjEzMTA3Mik7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDEzMTA3MikgPT09IDEzMTA3Mjtcbn07XG5cblByb21pc2UuYmluZCA9IGZ1bmN0aW9uICh0aGlzQXJnLCB2YWx1ZSkge1xuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXNBcmcpO1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG5cbiAgICByZXQuX3NldEJvdW5kVG8obWF5YmVQcm9taXNlKTtcbiAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICBtYXliZVByb21pc2UuX3RoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXQuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIH0sIHJldC5fcmVqZWN0LCByZXQuX3Byb2dyZXNzLCByZXQsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG59O1xuXG59LHt9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIG9sZDtcbmlmICh0eXBlb2YgUHJvbWlzZSAhPT0gXCJ1bmRlZmluZWRcIikgb2xkID0gUHJvbWlzZTtcbmZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgdHJ5IHsgaWYgKFByb21pc2UgPT09IGJsdWViaXJkKSBQcm9taXNlID0gb2xkOyB9XG4gICAgY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGJsdWViaXJkO1xufVxudmFyIGJsdWViaXJkID0gX2RlcmVxXyhcIi4vcHJvbWlzZS5qc1wiKSgpO1xuYmx1ZWJpcmQubm9Db25mbGljdCA9IG5vQ29uZmxpY3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGJsdWViaXJkO1xuXG59LHtcIi4vcHJvbWlzZS5qc1wiOjIzfV0sNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBjciA9IE9iamVjdC5jcmVhdGU7XG5pZiAoY3IpIHtcbiAgICB2YXIgY2FsbGVyQ2FjaGUgPSBjcihudWxsKTtcbiAgICB2YXIgZ2V0dGVyQ2FjaGUgPSBjcihudWxsKTtcbiAgICBjYWxsZXJDYWNoZVtcIiBzaXplXCJdID0gZ2V0dGVyQ2FjaGVbXCIgc2l6ZVwiXSA9IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGNhbkV2YWx1YXRlID0gdXRpbC5jYW5FdmFsdWF0ZTtcbnZhciBpc0lkZW50aWZpZXIgPSB1dGlsLmlzSWRlbnRpZmllcjtcblxudmFyIGdldE1ldGhvZENhbGxlcjtcbnZhciBnZXRHZXR0ZXI7XG5pZiAoIXRydWUpIHtcbnZhciBtYWtlTWV0aG9kQ2FsbGVyID0gZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwiZW5zdXJlTWV0aG9kXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLmxlbmd0aDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGVuc3VyZU1ldGhvZChvYmosICdtZXRob2ROYW1lJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHN3aXRjaChsZW4pIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdKTsgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdLCB0aGlzWzFdKTsgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDM6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdLCB0aGlzWzFdLCB0aGlzWzJdKTsgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDA6IHJldHVybiBvYmoubWV0aG9kTmFtZSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iai5tZXRob2ROYW1lLmFwcGx5KG9iaiwgdGhpcyk7ICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgXCIucmVwbGFjZSgvbWV0aG9kTmFtZS9nLCBtZXRob2ROYW1lKSkoZW5zdXJlTWV0aG9kKTtcbn07XG5cbnZhciBtYWtlR2V0dGVyID0gZnVuY3Rpb24gKHByb3BlcnR5TmFtZSkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJvYmpcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICByZXR1cm4gb2JqLnByb3BlcnR5TmFtZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIi5yZXBsYWNlKFwicHJvcGVydHlOYW1lXCIsIHByb3BlcnR5TmFtZSkpO1xufTtcblxudmFyIGdldENvbXBpbGVkID0gZnVuY3Rpb24obmFtZSwgY29tcGlsZXIsIGNhY2hlKSB7XG4gICAgdmFyIHJldCA9IGNhY2hlW25hbWVdO1xuICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgaWYgKCFpc0lkZW50aWZpZXIobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IGNvbXBpbGVyKG5hbWUpO1xuICAgICAgICBjYWNoZVtuYW1lXSA9IHJldDtcbiAgICAgICAgY2FjaGVbXCIgc2l6ZVwiXSsrO1xuICAgICAgICBpZiAoY2FjaGVbXCIgc2l6ZVwiXSA+IDUxMikge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSBkZWxldGUgY2FjaGVba2V5c1tpXV07XG4gICAgICAgICAgICBjYWNoZVtcIiBzaXplXCJdID0ga2V5cy5sZW5ndGggLSAyNTY7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmdldE1ldGhvZENhbGxlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZ2V0Q29tcGlsZWQobmFtZSwgbWFrZU1ldGhvZENhbGxlciwgY2FsbGVyQ2FjaGUpO1xufTtcblxuZ2V0R2V0dGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBnZXRDb21waWxlZChuYW1lLCBtYWtlR2V0dGVyLCBnZXR0ZXJDYWNoZSk7XG59O1xufVxuXG5mdW5jdGlvbiBlbnN1cmVNZXRob2Qob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgdmFyIGZuO1xuICAgIGlmIChvYmogIT0gbnVsbCkgZm4gPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gXCJPYmplY3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKG9iaikgKyBcIiBoYXMgbm8gbWV0aG9kICdcIiArXG4gICAgICAgICAgICB1dGlsLnRvU3RyaW5nKG1ldGhvZE5hbWUpICsgXCInXCI7XG4gICAgICAgIHRocm93IG5ldyBQcm9taXNlLlR5cGVFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZuO1xufVxuXG5mdW5jdGlvbiBjYWxsZXIob2JqKSB7XG4gICAgdmFyIG1ldGhvZE5hbWUgPSB0aGlzLnBvcCgpO1xuICAgIHZhciBmbiA9IGVuc3VyZU1ldGhvZChvYmosIG1ldGhvZE5hbWUpO1xuICAgIHJldHVybiBmbi5hcHBseShvYmosIHRoaXMpO1xufVxuUHJvbWlzZS5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAgdmFyICRfbGVuID0gYXJndW1lbnRzLmxlbmd0aDt2YXIgYXJncyA9IG5ldyBBcnJheSgkX2xlbiAtIDEpOyBmb3IodmFyICRfaSA9IDE7ICRfaSA8ICRfbGVuOyArKyRfaSkge2FyZ3NbJF9pIC0gMV0gPSBhcmd1bWVudHNbJF9pXTt9XG4gICAgaWYgKCF0cnVlKSB7XG4gICAgICAgIGlmIChjYW5FdmFsdWF0ZSkge1xuICAgICAgICAgICAgdmFyIG1heWJlQ2FsbGVyID0gZ2V0TWV0aG9kQ2FsbGVyKG1ldGhvZE5hbWUpO1xuICAgICAgICAgICAgaWYgKG1heWJlQ2FsbGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICAgICAgICAgIG1heWJlQ2FsbGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgYXJncywgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhcmdzLnB1c2gobWV0aG9kTmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4oY2FsbGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgYXJncywgdW5kZWZpbmVkKTtcbn07XG5cbmZ1bmN0aW9uIG5hbWVkR2V0dGVyKG9iaikge1xuICAgIHJldHVybiBvYmpbdGhpc107XG59XG5mdW5jdGlvbiBpbmRleGVkR2V0dGVyKG9iaikge1xuICAgIHZhciBpbmRleCA9ICt0aGlzO1xuICAgIGlmIChpbmRleCA8IDApIGluZGV4ID0gTWF0aC5tYXgoMCwgaW5kZXggKyBvYmoubGVuZ3RoKTtcbiAgICByZXR1cm4gb2JqW2luZGV4XTtcbn1cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgaXNJbmRleCA9ICh0eXBlb2YgcHJvcGVydHlOYW1lID09PSBcIm51bWJlclwiKTtcbiAgICB2YXIgZ2V0dGVyO1xuICAgIGlmICghaXNJbmRleCkge1xuICAgICAgICBpZiAoY2FuRXZhbHVhdGUpIHtcbiAgICAgICAgICAgIHZhciBtYXliZUdldHRlciA9IGdldEdldHRlcihwcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgZ2V0dGVyID0gbWF5YmVHZXR0ZXIgIT09IG51bGwgPyBtYXliZUdldHRlciA6IG5hbWVkR2V0dGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2V0dGVyID0gbmFtZWRHZXR0ZXI7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBnZXR0ZXIgPSBpbmRleGVkR2V0dGVyO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbihnZXR0ZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBwcm9wZXJ0eU5hbWUsIHVuZGVmaW5lZCk7XG59O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIik7XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciBDYW5jZWxsYXRpb25FcnJvciA9IGVycm9ycy5DYW5jZWxsYXRpb25FcnJvcjtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NhbmNlbCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICBpZiAoIXRoaXMuaXNDYW5jZWxsYWJsZSgpKSByZXR1cm4gdGhpcztcbiAgICB2YXIgcGFyZW50O1xuICAgIHZhciBwcm9taXNlVG9SZWplY3QgPSB0aGlzO1xuICAgIHdoaWxlICgocGFyZW50ID0gcHJvbWlzZVRvUmVqZWN0Ll9jYW5jZWxsYXRpb25QYXJlbnQpICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgcGFyZW50LmlzQ2FuY2VsbGFibGUoKSkge1xuICAgICAgICBwcm9taXNlVG9SZWplY3QgPSBwYXJlbnQ7XG4gICAgfVxuICAgIHRoaXMuX3Vuc2V0Q2FuY2VsbGFibGUoKTtcbiAgICBwcm9taXNlVG9SZWplY3QuX3RhcmdldCgpLl9yZWplY3RDYWxsYmFjayhyZWFzb24sIGZhbHNlLCB0cnVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICBpZiAoIXRoaXMuaXNDYW5jZWxsYWJsZSgpKSByZXR1cm4gdGhpcztcbiAgICBpZiAocmVhc29uID09PSB1bmRlZmluZWQpIHJlYXNvbiA9IG5ldyBDYW5jZWxsYXRpb25FcnJvcigpO1xuICAgIGFzeW5jLmludm9rZUxhdGVyKHRoaXMuX2NhbmNlbCwgdGhpcywgcmVhc29uKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblByb21pc2UucHJvdG90eXBlLmNhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9jYW5jZWxsYWJsZSgpKSByZXR1cm4gdGhpcztcbiAgICBhc3luYy5lbmFibGVUcmFtcG9saW5lKCk7XG4gICAgdGhpcy5fc2V0Q2FuY2VsbGFibGUoKTtcbiAgICB0aGlzLl9jYW5jZWxsYXRpb25QYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS51bmNhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXQgPSB0aGlzLnRoZW4oKTtcbiAgICByZXQuX3Vuc2V0Q2FuY2VsbGFibGUoKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZm9yayA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzKSB7XG4gICAgdmFyIHJldCA9IHRoaXMuX3RoZW4oZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG5cbiAgICByZXQuX3NldENhbmNlbGxhYmxlKCk7XG4gICAgcmV0Ll9jYW5jZWxsYXRpb25QYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJldDtcbn07XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi9lcnJvcnMuanNcIjoxM31dLDc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgYmx1ZWJpcmRGcmFtZVBhdHRlcm4gPVxuICAgIC9bXFxcXFxcL11ibHVlYmlyZFtcXFxcXFwvXWpzW1xcXFxcXC9dKG1haW58ZGVidWd8emFsZ298aW5zdHJ1bWVudGVkKS87XG52YXIgc3RhY2tGcmFtZVBhdHRlcm4gPSBudWxsO1xudmFyIGZvcm1hdFN0YWNrID0gbnVsbDtcbnZhciBpbmRlbnRTdGFja0ZyYW1lcyA9IGZhbHNlO1xudmFyIHdhcm47XG5cbmZ1bmN0aW9uIENhcHR1cmVkVHJhY2UocGFyZW50KSB7XG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIHZhciBsZW5ndGggPSB0aGlzLl9sZW5ndGggPSAxICsgKHBhcmVudCA9PT0gdW5kZWZpbmVkID8gMCA6IHBhcmVudC5fbGVuZ3RoKTtcbiAgICBjYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDYXB0dXJlZFRyYWNlKTtcbiAgICBpZiAobGVuZ3RoID4gMzIpIHRoaXMudW5jeWNsZSgpO1xufVxudXRpbC5pbmhlcml0cyhDYXB0dXJlZFRyYWNlLCBFcnJvcik7XG5cbkNhcHR1cmVkVHJhY2UucHJvdG90eXBlLnVuY3ljbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5fbGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPCAyKSByZXR1cm47XG4gICAgdmFyIG5vZGVzID0gW107XG4gICAgdmFyIHN0YWNrVG9JbmRleCA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIG5vZGUgPSB0aGlzOyBub2RlICE9PSB1bmRlZmluZWQ7ICsraSkge1xuICAgICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlID0gbm9kZS5fcGFyZW50O1xuICAgIH1cbiAgICBsZW5ndGggPSB0aGlzLl9sZW5ndGggPSBpO1xuICAgIGZvciAodmFyIGkgPSBsZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgc3RhY2sgPSBub2Rlc1tpXS5zdGFjaztcbiAgICAgICAgaWYgKHN0YWNrVG9JbmRleFtzdGFja10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3RhY2tUb0luZGV4W3N0YWNrXSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY3VycmVudFN0YWNrID0gbm9kZXNbaV0uc3RhY2s7XG4gICAgICAgIHZhciBpbmRleCA9IHN0YWNrVG9JbmRleFtjdXJyZW50U3RhY2tdO1xuICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCAmJiBpbmRleCAhPT0gaSkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgICAgIG5vZGVzW2luZGV4IC0gMV0uX3BhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBub2Rlc1tpbmRleCAtIDFdLl9sZW5ndGggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZXNbaV0uX3BhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG5vZGVzW2ldLl9sZW5ndGggPSAxO1xuICAgICAgICAgICAgdmFyIGN5Y2xlRWRnZU5vZGUgPSBpID4gMCA/IG5vZGVzW2kgLSAxXSA6IHRoaXM7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQgPSBub2Rlc1tpbmRleCArIDFdO1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX3BhcmVudC51bmN5Y2xlKCk7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fbGVuZ3RoID1cbiAgICAgICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fcGFyZW50Ll9sZW5ndGggKyAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdXJyZW50Q2hpbGRMZW5ndGggPSBjeWNsZUVkZ2VOb2RlLl9sZW5ndGggKyAxO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgLSAyOyBqID49IDA7IC0taikge1xuICAgICAgICAgICAgICAgIG5vZGVzW2pdLl9sZW5ndGggPSBjdXJyZW50Q2hpbGRMZW5ndGg7XG4gICAgICAgICAgICAgICAgY3VycmVudENoaWxkTGVuZ3RoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5DYXB0dXJlZFRyYWNlLnByb3RvdHlwZS5wYXJlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xufTtcblxuQ2FwdHVyZWRUcmFjZS5wcm90b3R5cGUuaGFzUGFyZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudCAhPT0gdW5kZWZpbmVkO1xufTtcblxuQ2FwdHVyZWRUcmFjZS5wcm90b3R5cGUuYXR0YWNoRXh0cmFUcmFjZSA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLl9fc3RhY2tDbGVhbmVkX18pIHJldHVybjtcbiAgICB0aGlzLnVuY3ljbGUoKTtcbiAgICB2YXIgcGFyc2VkID0gQ2FwdHVyZWRUcmFjZS5wYXJzZVN0YWNrQW5kTWVzc2FnZShlcnJvcik7XG4gICAgdmFyIG1lc3NhZ2UgPSBwYXJzZWQubWVzc2FnZTtcbiAgICB2YXIgc3RhY2tzID0gW3BhcnNlZC5zdGFja107XG5cbiAgICB2YXIgdHJhY2UgPSB0aGlzO1xuICAgIHdoaWxlICh0cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN0YWNrcy5wdXNoKGNsZWFuU3RhY2sodHJhY2Uuc3RhY2suc3BsaXQoXCJcXG5cIikpKTtcbiAgICAgICAgdHJhY2UgPSB0cmFjZS5fcGFyZW50O1xuICAgIH1cbiAgICByZW1vdmVDb21tb25Sb290cyhzdGFja3MpO1xuICAgIHJlbW92ZUR1cGxpY2F0ZU9yRW1wdHlKdW1wcyhzdGFja3MpO1xuICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwic3RhY2tcIiwgcmVjb25zdHJ1Y3RTdGFjayhtZXNzYWdlLCBzdGFja3MpKTtcbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKGVycm9yLCBcIl9fc3RhY2tDbGVhbmVkX19cIiwgdHJ1ZSk7XG59O1xuXG5mdW5jdGlvbiByZWNvbnN0cnVjdFN0YWNrKG1lc3NhZ2UsIHN0YWNrcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2tzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgICAgICBzdGFja3NbaV0ucHVzaChcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCIpO1xuICAgICAgICBzdGFja3NbaV0gPSBzdGFja3NbaV0uam9pbihcIlxcblwiKTtcbiAgICB9XG4gICAgaWYgKGkgPCBzdGFja3MubGVuZ3RoKSB7XG4gICAgICAgIHN0YWNrc1tpXSA9IHN0YWNrc1tpXS5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZSArIFwiXFxuXCIgKyBzdGFja3Muam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRHVwbGljYXRlT3JFbXB0eUp1bXBzKHN0YWNrcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChzdGFja3NbaV0ubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgICAoKGkgKyAxIDwgc3RhY2tzLmxlbmd0aCkgJiYgc3RhY2tzW2ldWzBdID09PSBzdGFja3NbaSsxXVswXSkpIHtcbiAgICAgICAgICAgIHN0YWNrcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNvbW1vblJvb3RzKHN0YWNrcykge1xuICAgIHZhciBjdXJyZW50ID0gc3RhY2tzWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc3RhY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBwcmV2ID0gc3RhY2tzW2ldO1xuICAgICAgICB2YXIgY3VycmVudExhc3RJbmRleCA9IGN1cnJlbnQubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIGN1cnJlbnRMYXN0TGluZSA9IGN1cnJlbnRbY3VycmVudExhc3RJbmRleF07XG4gICAgICAgIHZhciBjb21tb25Sb290TWVldFBvaW50ID0gLTE7XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IHByZXYubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgICAgIGlmIChwcmV2W2pdID09PSBjdXJyZW50TGFzdExpbmUpIHtcbiAgICAgICAgICAgICAgICBjb21tb25Sb290TWVldFBvaW50ID0gajtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSBjb21tb25Sb290TWVldFBvaW50OyBqID49IDA7IC0taikge1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBwcmV2W2pdO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRbY3VycmVudExhc3RJbmRleF0gPT09IGxpbmUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50LnBvcCgpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRMYXN0SW5kZXgtLTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudCA9IHByZXY7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhblN0YWNrKHN0YWNrKSB7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBzdGFja1tpXTtcbiAgICAgICAgdmFyIGlzVHJhY2VMaW5lID0gc3RhY2tGcmFtZVBhdHRlcm4udGVzdChsaW5lKSB8fFxuICAgICAgICAgICAgXCIgICAgKE5vIHN0YWNrIHRyYWNlKVwiID09PSBsaW5lO1xuICAgICAgICB2YXIgaXNJbnRlcm5hbEZyYW1lID0gaXNUcmFjZUxpbmUgJiYgc2hvdWxkSWdub3JlKGxpbmUpO1xuICAgICAgICBpZiAoaXNUcmFjZUxpbmUgJiYgIWlzSW50ZXJuYWxGcmFtZSkge1xuICAgICAgICAgICAgaWYgKGluZGVudFN0YWNrRnJhbWVzICYmIGxpbmUuY2hhckF0KDApICE9PSBcIiBcIikge1xuICAgICAgICAgICAgICAgIGxpbmUgPSBcIiAgICBcIiArIGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXQucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBzdGFja0ZyYW1lc0FzQXJyYXkoZXJyb3IpIHtcbiAgICB2YXIgc3RhY2sgPSBlcnJvci5zdGFjay5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKS5zcGxpdChcIlxcblwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gc3RhY2tbaV07XG4gICAgICAgIGlmIChcIiAgICAoTm8gc3RhY2sgdHJhY2UpXCIgPT09IGxpbmUgfHwgc3RhY2tGcmFtZVBhdHRlcm4udGVzdChsaW5lKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIHN0YWNrID0gc3RhY2suc2xpY2UoaSk7XG4gICAgfVxuICAgIHJldHVybiBzdGFjaztcbn1cblxuQ2FwdHVyZWRUcmFjZS5wYXJzZVN0YWNrQW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgdmFyIHN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgdmFyIG1lc3NhZ2UgPSBlcnJvci50b1N0cmluZygpO1xuICAgIHN0YWNrID0gdHlwZW9mIHN0YWNrID09PSBcInN0cmluZ1wiICYmIHN0YWNrLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHN0YWNrRnJhbWVzQXNBcnJheShlcnJvcikgOiBbXCIgICAgKE5vIHN0YWNrIHRyYWNlKVwiXTtcbiAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzdGFjazogY2xlYW5TdGFjayhzdGFjaylcbiAgICB9O1xufTtcblxuQ2FwdHVyZWRUcmFjZS5mb3JtYXRBbmRMb2dFcnJvciA9IGZ1bmN0aW9uKGVycm9yLCB0aXRsZSkge1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB2YXIgbWVzc2FnZTtcbiAgICAgICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgZXJyb3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIHN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgICAgICAgICBtZXNzYWdlID0gdGl0bGUgKyBmb3JtYXRTdGFjayhzdGFjaywgZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSA9IHRpdGxlICsgU3RyaW5nKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHdhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgd2FybihtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29uc29sZS5sb2cgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUubG9nID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkNhcHR1cmVkVHJhY2UudW5oYW5kbGVkUmVqZWN0aW9uID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIENhcHR1cmVkVHJhY2UuZm9ybWF0QW5kTG9nRXJyb3IocmVhc29uLCBcIl4tLS0gV2l0aCBhZGRpdGlvbmFsIHN0YWNrIHRyYWNlOiBcIik7XG59O1xuXG5DYXB0dXJlZFRyYWNlLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0eXBlb2YgY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIjtcbn07XG5cbkNhcHR1cmVkVHJhY2UuZmlyZVJlamVjdGlvbkV2ZW50ID1cbmZ1bmN0aW9uKG5hbWUsIGxvY2FsSGFuZGxlciwgcmVhc29uLCBwcm9taXNlKSB7XG4gICAgdmFyIGxvY2FsRXZlbnRGaXJlZCA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxIYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGxvY2FsRXZlbnRGaXJlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJyZWplY3Rpb25IYW5kbGVkXCIpIHtcbiAgICAgICAgICAgICAgICBsb2NhbEhhbmRsZXIocHJvbWlzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvY2FsSGFuZGxlcihyZWFzb24sIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKGUpO1xuICAgIH1cblxuICAgIHZhciBnbG9iYWxFdmVudEZpcmVkID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZ2xvYmFsRXZlbnRGaXJlZCA9IGZpcmVHbG9iYWxFdmVudChuYW1lLCByZWFzb24sIHByb21pc2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZ2xvYmFsRXZlbnRGaXJlZCA9IHRydWU7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIoZSk7XG4gICAgfVxuXG4gICAgdmFyIGRvbUV2ZW50RmlyZWQgPSBmYWxzZTtcbiAgICBpZiAoZmlyZURvbUV2ZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkb21FdmVudEZpcmVkID0gZmlyZURvbUV2ZW50KG5hbWUudG9Mb3dlckNhc2UoKSwge1xuICAgICAgICAgICAgICAgIHJlYXNvbjogcmVhc29uLFxuICAgICAgICAgICAgICAgIHByb21pc2U6IHByb21pc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkb21FdmVudEZpcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGFzeW5jLnRocm93TGF0ZXIoZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWdsb2JhbEV2ZW50RmlyZWQgJiYgIWxvY2FsRXZlbnRGaXJlZCAmJiAhZG9tRXZlbnRGaXJlZCAmJlxuICAgICAgICBuYW1lID09PSBcInVuaGFuZGxlZFJlamVjdGlvblwiKSB7XG4gICAgICAgIENhcHR1cmVkVHJhY2UuZm9ybWF0QW5kTG9nRXJyb3IocmVhc29uLCBcIlVuaGFuZGxlZCByZWplY3Rpb24gXCIpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGZvcm1hdE5vbkVycm9yKG9iaikge1xuICAgIHZhciBzdHI7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBzdHIgPSBcIltmdW5jdGlvbiBcIiArXG4gICAgICAgICAgICAob2JqLm5hbWUgfHwgXCJhbm9ueW1vdXNcIikgK1xuICAgICAgICAgICAgXCJdXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gb2JqLnRvU3RyaW5nKCk7XG4gICAgICAgIHZhciBydXNlbGVzc1RvU3RyaW5nID0gL1xcW29iamVjdCBbYS16QS1aMC05JF9dK1xcXS87XG4gICAgICAgIGlmIChydXNlbGVzc1RvU3RyaW5nLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3U3RyID0gSlNPTi5zdHJpbmdpZnkob2JqKTtcbiAgICAgICAgICAgICAgICBzdHIgPSBuZXdTdHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlKSB7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgc3RyID0gXCIoZW1wdHkgYXJyYXkpXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChcIig8XCIgKyBzbmlwKHN0cikgKyBcIj4sIG5vIHN0YWNrIHRyYWNlKVwiKTtcbn1cblxuZnVuY3Rpb24gc25pcChzdHIpIHtcbiAgICB2YXIgbWF4Q2hhcnMgPSA0MTtcbiAgICBpZiAoc3RyLmxlbmd0aCA8IG1heENoYXJzKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIHJldHVybiBzdHIuc3Vic3RyKDAsIG1heENoYXJzIC0gMykgKyBcIi4uLlwiO1xufVxuXG52YXIgc2hvdWxkSWdub3JlID0gZnVuY3Rpb24oKSB7IHJldHVybiBmYWxzZTsgfTtcbnZhciBwYXJzZUxpbmVJbmZvUmVnZXggPSAvW1xcLzxcXChdKFteOlxcL10rKTooXFxkKyk6KD86XFxkKylcXCk/XFxzKiQvO1xuZnVuY3Rpb24gcGFyc2VMaW5lSW5mbyhsaW5lKSB7XG4gICAgdmFyIG1hdGNoZXMgPSBsaW5lLm1hdGNoKHBhcnNlTGluZUluZm9SZWdleCk7XG4gICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbGVOYW1lOiBtYXRjaGVzWzFdLFxuICAgICAgICAgICAgbGluZTogcGFyc2VJbnQobWF0Y2hlc1syXSwgMTApXG4gICAgICAgIH07XG4gICAgfVxufVxuQ2FwdHVyZWRUcmFjZS5zZXRCb3VuZHMgPSBmdW5jdGlvbihmaXJzdExpbmVFcnJvciwgbGFzdExpbmVFcnJvcikge1xuICAgIGlmICghQ2FwdHVyZWRUcmFjZS5pc1N1cHBvcnRlZCgpKSByZXR1cm47XG4gICAgdmFyIGZpcnN0U3RhY2tMaW5lcyA9IGZpcnN0TGluZUVycm9yLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBsYXN0U3RhY2tMaW5lcyA9IGxhc3RMaW5lRXJyb3Iuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGZpcnN0SW5kZXggPSAtMTtcbiAgICB2YXIgbGFzdEluZGV4ID0gLTE7XG4gICAgdmFyIGZpcnN0RmlsZU5hbWU7XG4gICAgdmFyIGxhc3RGaWxlTmFtZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpcnN0U3RhY2tMaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcGFyc2VMaW5lSW5mbyhmaXJzdFN0YWNrTGluZXNbaV0pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICBmaXJzdEZpbGVOYW1lID0gcmVzdWx0LmZpbGVOYW1lO1xuICAgICAgICAgICAgZmlyc3RJbmRleCA9IHJlc3VsdC5saW5lO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0U3RhY2tMaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcGFyc2VMaW5lSW5mbyhsYXN0U3RhY2tMaW5lc1tpXSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGxhc3RGaWxlTmFtZSA9IHJlc3VsdC5maWxlTmFtZTtcbiAgICAgICAgICAgIGxhc3RJbmRleCA9IHJlc3VsdC5saW5lO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZpcnN0SW5kZXggPCAwIHx8IGxhc3RJbmRleCA8IDAgfHwgIWZpcnN0RmlsZU5hbWUgfHwgIWxhc3RGaWxlTmFtZSB8fFxuICAgICAgICBmaXJzdEZpbGVOYW1lICE9PSBsYXN0RmlsZU5hbWUgfHwgZmlyc3RJbmRleCA+PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNob3VsZElnbm9yZSA9IGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgaWYgKGJsdWViaXJkRnJhbWVQYXR0ZXJuLnRlc3QobGluZSkpIHJldHVybiB0cnVlO1xuICAgICAgICB2YXIgaW5mbyA9IHBhcnNlTGluZUluZm8obGluZSk7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5maWxlTmFtZSA9PT0gZmlyc3RGaWxlTmFtZSAmJlxuICAgICAgICAgICAgICAgIChmaXJzdEluZGV4IDw9IGluZm8ubGluZSAmJiBpbmZvLmxpbmUgPD0gbGFzdEluZGV4KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufTtcblxudmFyIGNhcHR1cmVTdGFja1RyYWNlID0gKGZ1bmN0aW9uIHN0YWNrRGV0ZWN0aW9uKCkge1xuICAgIHZhciB2OHN0YWNrRnJhbWVQYXR0ZXJuID0gL15cXHMqYXRcXHMqLztcbiAgICB2YXIgdjhzdGFja0Zvcm1hdHRlciA9IGZ1bmN0aW9uKHN0YWNrLCBlcnJvcikge1xuICAgICAgICBpZiAodHlwZW9mIHN0YWNrID09PSBcInN0cmluZ1wiKSByZXR1cm4gc3RhY2s7XG5cbiAgICAgICAgaWYgKGVycm9yLm5hbWUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3IudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybWF0Tm9uRXJyb3IoZXJyb3IpO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICB0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQgKyA2O1xuICAgICAgICBzdGFja0ZyYW1lUGF0dGVybiA9IHY4c3RhY2tGcmFtZVBhdHRlcm47XG4gICAgICAgIGZvcm1hdFN0YWNrID0gdjhzdGFja0Zvcm1hdHRlcjtcbiAgICAgICAgdmFyIGNhcHR1cmVTdGFja1RyYWNlID0gRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2U7XG5cbiAgICAgICAgc2hvdWxkSWdub3JlID0gZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuIGJsdWViaXJkRnJhbWVQYXR0ZXJuLnRlc3QobGluZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihyZWNlaXZlciwgaWdub3JlVW50aWwpIHtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdCArIDY7XG4gICAgICAgICAgICBjYXB0dXJlU3RhY2tUcmFjZShyZWNlaXZlciwgaWdub3JlVW50aWwpO1xuICAgICAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0IC0gNjtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuXG4gICAgaWYgKHR5cGVvZiBlcnIuc3RhY2sgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgZXJyLnN0YWNrLnNwbGl0KFwiXFxuXCIpWzBdLmluZGV4T2YoXCJzdGFja0RldGVjdGlvbkBcIikgPj0gMCkge1xuICAgICAgICBzdGFja0ZyYW1lUGF0dGVybiA9IC9ALztcbiAgICAgICAgZm9ybWF0U3RhY2sgPSB2OHN0YWNrRm9ybWF0dGVyO1xuICAgICAgICBpbmRlbnRTdGFja0ZyYW1lcyA9IHRydWU7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBjYXB0dXJlU3RhY2tUcmFjZShvKSB7XG4gICAgICAgICAgICBvLnN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGhhc1N0YWNrQWZ0ZXJUaHJvdztcbiAgICB0cnkgeyB0aHJvdyBuZXcgRXJyb3IoKTsgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgICAgaGFzU3RhY2tBZnRlclRocm93ID0gKFwic3RhY2tcIiBpbiBlKTtcbiAgICB9XG4gICAgaWYgKCEoXCJzdGFja1wiIGluIGVycikgJiYgaGFzU3RhY2tBZnRlclRocm93ICYmXG4gICAgICAgIHR5cGVvZiBFcnJvci5zdGFja1RyYWNlTGltaXQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgc3RhY2tGcmFtZVBhdHRlcm4gPSB2OHN0YWNrRnJhbWVQYXR0ZXJuO1xuICAgICAgICBmb3JtYXRTdGFjayA9IHY4c3RhY2tGb3JtYXR0ZXI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBjYXB0dXJlU3RhY2tUcmFjZShvKSB7XG4gICAgICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQgKyA2O1xuICAgICAgICAgICAgdHJ5IHsgdGhyb3cgbmV3IEVycm9yKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgby5zdGFjayA9IGUuc3RhY2s7IH1cbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdCAtIDY7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZm9ybWF0U3RhY2sgPSBmdW5jdGlvbihzdGFjaywgZXJyb3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdGFjayA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHN0YWNrO1xuXG4gICAgICAgIGlmICgodHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiIHx8XG4gICAgICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwiZnVuY3Rpb25cIikgJiZcbiAgICAgICAgICAgIGVycm9yLm5hbWUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3IudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybWF0Tm9uRXJyb3IoZXJyb3IpO1xuICAgIH07XG5cbiAgICByZXR1cm4gbnVsbDtcblxufSkoW10pO1xuXG52YXIgZmlyZURvbUV2ZW50O1xudmFyIGZpcmVHbG9iYWxFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc05vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUsIHJlYXNvbiwgcHJvbWlzZSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwicmVqZWN0aW9uSGFuZGxlZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZW1pdChuYW1lLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZW1pdChuYW1lLCByZWFzb24sIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjdXN0b21FdmVudFdvcmtzID0gZmFsc2U7XG4gICAgICAgIHZhciBhbnlFdmVudFdvcmtzID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBldiA9IG5ldyBzZWxmLkN1c3RvbUV2ZW50KFwidGVzdFwiKTtcbiAgICAgICAgICAgIGN1c3RvbUV2ZW50V29ya3MgPSBldiBpbnN0YW5jZW9mIEN1c3RvbUV2ZW50O1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICBpZiAoIWN1c3RvbUV2ZW50V29ya3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgICAgICAgICAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQoXCJ0ZXN0aW5ndGhlZXZlbnRcIiwgZmFsc2UsIHRydWUsIHt9KTtcbiAgICAgICAgICAgICAgICBzZWxmLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGFueUV2ZW50V29ya3MgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYW55RXZlbnRXb3Jrcykge1xuICAgICAgICAgICAgZmlyZURvbUV2ZW50ID0gZnVuY3Rpb24odHlwZSwgZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50O1xuICAgICAgICAgICAgICAgIGlmIChjdXN0b21FdmVudFdvcmtzKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gbmV3IHNlbGYuQ3VzdG9tRXZlbnQodHlwZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBkZXRhaWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxmLmRpc3BhdGNoRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQodHlwZSwgZmFsc2UsIHRydWUsIGRldGFpbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50ID8gIXNlbGYuZGlzcGF0Y2hFdmVudChldmVudCkgOiBmYWxzZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9XaW5kb3dNZXRob2ROYW1lTWFwID0ge307XG4gICAgICAgIHRvV2luZG93TWV0aG9kTmFtZU1hcFtcInVuaGFuZGxlZFJlamVjdGlvblwiXSA9IChcIm9uXCIgK1xuICAgICAgICAgICAgXCJ1bmhhbmRsZWRSZWplY3Rpb25cIikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdG9XaW5kb3dNZXRob2ROYW1lTWFwW1wicmVqZWN0aW9uSGFuZGxlZFwiXSA9IChcIm9uXCIgK1xuICAgICAgICAgICAgXCJyZWplY3Rpb25IYW5kbGVkXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUsIHJlYXNvbiwgcHJvbWlzZSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSB0b1dpbmRvd01ldGhvZE5hbWVNYXBbbmFtZV07XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gc2VsZlttZXRob2ROYW1lXTtcbiAgICAgICAgICAgIGlmICghbWV0aG9kKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJyZWplY3Rpb25IYW5kbGVkXCIpIHtcbiAgICAgICAgICAgICAgICBtZXRob2QuY2FsbChzZWxmLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwoc2VsZiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7XG5cbmlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgY29uc29sZS53YXJuICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgd2FybiA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICB9O1xuICAgIGlmICh1dGlsLmlzTm9kZSAmJiBwcm9jZXNzLnN0ZGVyci5pc1RUWSkge1xuICAgICAgICB3YXJuID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUoXCJcXHUwMDFiWzMxbVwiICsgbWVzc2FnZSArIFwiXFx1MDAxYlszOW1cXG5cIik7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICghdXRpbC5pc05vZGUgJiYgdHlwZW9mIChuZXcgRXJyb3IoKS5zdGFjaykgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgd2FybiA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIiVjXCIgKyBtZXNzYWdlLCBcImNvbG9yOiByZWRcIik7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5yZXR1cm4gQ2FwdHVyZWRUcmFjZTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL3V0aWwuanNcIjozOH1dLDg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5FWFRfRklMVEVSKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgZXJyb3JzID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIga2V5cyA9IF9kZXJlcV8oXCIuL2VzNS5qc1wiKS5rZXlzO1xudmFyIFR5cGVFcnJvciA9IGVycm9ycy5UeXBlRXJyb3I7XG5cbmZ1bmN0aW9uIENhdGNoRmlsdGVyKGluc3RhbmNlcywgY2FsbGJhY2ssIHByb21pc2UpIHtcbiAgICB0aGlzLl9pbnN0YW5jZXMgPSBpbnN0YW5jZXM7XG4gICAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLl9wcm9taXNlID0gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gc2FmZVByZWRpY2F0ZShwcmVkaWNhdGUsIGUpIHtcbiAgICB2YXIgc2FmZU9iamVjdCA9IHt9O1xuICAgIHZhciByZXRmaWx0ZXIgPSB0cnlDYXRjaChwcmVkaWNhdGUpLmNhbGwoc2FmZU9iamVjdCwgZSk7XG5cbiAgICBpZiAocmV0ZmlsdGVyID09PSBlcnJvck9iaikgcmV0dXJuIHJldGZpbHRlcjtcblxuICAgIHZhciBzYWZlS2V5cyA9IGtleXMoc2FmZU9iamVjdCk7XG4gICAgaWYgKHNhZmVLZXlzLmxlbmd0aCkge1xuICAgICAgICBlcnJvck9iai5lID0gbmV3IFR5cGVFcnJvcihcIkNhdGNoIGZpbHRlciBtdXN0IGluaGVyaXQgZnJvbSBFcnJvciBvciBiZSBhIHNpbXBsZSBwcmVkaWNhdGUgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9vODRvNjhcXHUwMDBhXCIpO1xuICAgICAgICByZXR1cm4gZXJyb3JPYmo7XG4gICAgfVxuICAgIHJldHVybiByZXRmaWx0ZXI7XG59XG5cbkNhdGNoRmlsdGVyLnByb3RvdHlwZS5kb0ZpbHRlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGNiID0gdGhpcy5fY2FsbGJhY2s7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlO1xuICAgIHZhciBib3VuZFRvID0gcHJvbWlzZS5fYm91bmRWYWx1ZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9pbnN0YW5jZXNbaV07XG4gICAgICAgIHZhciBpdGVtSXNFcnJvclR5cGUgPSBpdGVtID09PSBFcnJvciB8fFxuICAgICAgICAgICAgKGl0ZW0gIT0gbnVsbCAmJiBpdGVtLnByb3RvdHlwZSBpbnN0YW5jZW9mIEVycm9yKTtcblxuICAgICAgICBpZiAoaXRlbUlzRXJyb3JUeXBlICYmIGUgaW5zdGFuY2VvZiBpdGVtKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2goY2IpLmNhbGwoYm91bmRUbywgZSk7XG4gICAgICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgICAgIE5FWFRfRklMVEVSLmUgPSByZXQuZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTkVYVF9GSUxURVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSBcImZ1bmN0aW9uXCIgJiYgIWl0ZW1Jc0Vycm9yVHlwZSkge1xuICAgICAgICAgICAgdmFyIHNob3VsZEhhbmRsZSA9IHNhZmVQcmVkaWNhdGUoaXRlbSwgZSk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkSGFuZGxlID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgICAgIGUgPSBlcnJvck9iai5lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzaG91bGRIYW5kbGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2goY2IpLmNhbGwoYm91bmRUbywgZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgTkVYVF9GSUxURVIuZSA9IHJldC5lO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTkVYVF9GSUxURVI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgTkVYVF9GSUxURVIuZSA9IGU7XG4gICAgcmV0dXJuIE5FWFRfRklMVEVSO1xufTtcblxucmV0dXJuIENhdGNoRmlsdGVyO1xufTtcblxufSx7XCIuL2Vycm9ycy5qc1wiOjEzLFwiLi9lczUuanNcIjoxNCxcIi4vdXRpbC5qc1wiOjM4fV0sOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgQ2FwdHVyZWRUcmFjZSwgaXNEZWJ1Z2dpbmcpIHtcbnZhciBjb250ZXh0U3RhY2sgPSBbXTtcbmZ1bmN0aW9uIENvbnRleHQoKSB7XG4gICAgdGhpcy5fdHJhY2UgPSBuZXcgQ2FwdHVyZWRUcmFjZShwZWVrQ29udGV4dCgpKTtcbn1cbkNvbnRleHQucHJvdG90eXBlLl9wdXNoQ29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWlzRGVidWdnaW5nKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fdHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0U3RhY2sucHVzaCh0aGlzLl90cmFjZSk7XG4gICAgfVxufTtcblxuQ29udGV4dC5wcm90b3R5cGUuX3BvcENvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFpc0RlYnVnZ2luZygpKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3RyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dFN0YWNrLnBvcCgpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRleHQoKSB7XG4gICAgaWYgKGlzRGVidWdnaW5nKCkpIHJldHVybiBuZXcgQ29udGV4dCgpO1xufVxuXG5mdW5jdGlvbiBwZWVrQ29udGV4dCgpIHtcbiAgICB2YXIgbGFzdEluZGV4ID0gY29udGV4dFN0YWNrLmxlbmd0aCAtIDE7XG4gICAgaWYgKGxhc3RJbmRleCA+PSAwKSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0U3RhY2tbbGFzdEluZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuX3BlZWtDb250ZXh0ID0gcGVla0NvbnRleHQ7XG5Qcm9taXNlLnByb3RvdHlwZS5fcHVzaENvbnRleHQgPSBDb250ZXh0LnByb3RvdHlwZS5fcHVzaENvbnRleHQ7XG5Qcm9taXNlLnByb3RvdHlwZS5fcG9wQ29udGV4dCA9IENvbnRleHQucHJvdG90eXBlLl9wb3BDb250ZXh0O1xuXG5yZXR1cm4gY3JlYXRlQ29udGV4dDtcbn07XG5cbn0se31dLDEwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBDYXB0dXJlZFRyYWNlKSB7XG52YXIgZ2V0RG9tYWluID0gUHJvbWlzZS5fZ2V0RG9tYWluO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgV2FybmluZyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKS5XYXJuaW5nO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGNhbkF0dGFjaFRyYWNlID0gdXRpbC5jYW5BdHRhY2hUcmFjZTtcbnZhciB1bmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkO1xudmFyIHBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uO1xudmFyIGRlYnVnZ2luZyA9IGZhbHNlIHx8ICh1dGlsLmlzTm9kZSAmJlxuICAgICAgICAgICAgICAgICAgICAoISFwcm9jZXNzLmVudltcIkJMVUVCSVJEX0RFQlVHXCJdIHx8XG4gICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudltcIk5PREVfRU5WXCJdID09PSBcImRldmVsb3BtZW50XCIpKTtcblxuaWYgKGRlYnVnZ2luZykge1xuICAgIGFzeW5jLmRpc2FibGVUcmFtcG9saW5lSWZOZWNlc3NhcnkoKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuX2lnbm9yZVJlamVjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDE2Nzc3MjE2O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2Vuc3VyZVBvc3NpYmxlUmVqZWN0aW9uSGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoKHRoaXMuX2JpdEZpZWxkICYgMTY3NzcyMTYpICE9PSAwKSByZXR1cm47XG4gICAgdGhpcy5fc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICBhc3luYy5pbnZva2VMYXRlcih0aGlzLl9ub3RpZnlVbmhhbmRsZWRSZWplY3Rpb24sIHRoaXMsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uSXNIYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIENhcHR1cmVkVHJhY2UuZmlyZVJlamVjdGlvbkV2ZW50KFwicmVqZWN0aW9uSGFuZGxlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQsIHVuZGVmaW5lZCwgdGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9pc1JlamVjdGlvblVuaGFuZGxlZCgpKSB7XG4gICAgICAgIHZhciByZWFzb24gPSB0aGlzLl9nZXRDYXJyaWVkU3RhY2tUcmFjZSgpIHx8IHRoaXMuX3NldHRsZWRWYWx1ZTtcbiAgICAgICAgdGhpcy5fc2V0VW5oYW5kbGVkUmVqZWN0aW9uSXNOb3RpZmllZCgpO1xuICAgICAgICBDYXB0dXJlZFRyYWNlLmZpcmVSZWplY3Rpb25FdmVudChcInVuaGFuZGxlZFJlamVjdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJseVVuaGFuZGxlZFJlamVjdGlvbiwgcmVhc29uLCB0aGlzKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0VW5oYW5kbGVkUmVqZWN0aW9uSXNOb3RpZmllZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgNTI0Mjg4O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0VW5oYW5kbGVkUmVqZWN0aW9uSXNOb3RpZmllZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH41MjQyODgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzVW5oYW5kbGVkUmVqZWN0aW9uTm90aWZpZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDUyNDI4OCkgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFJlamVjdGlvbklzVW5oYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAyMDk3MTUyO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+MjA5NzE1Mik7XG4gICAgaWYgKHRoaXMuX2lzVW5oYW5kbGVkUmVqZWN0aW9uTm90aWZpZWQoKSkge1xuICAgICAgICB0aGlzLl91bnNldFVuaGFuZGxlZFJlamVjdGlvbklzTm90aWZpZWQoKTtcbiAgICAgICAgdGhpcy5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uSXNIYW5kbGVkKCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzUmVqZWN0aW9uVW5oYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAyMDk3MTUyKSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Q2FycmllZFN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoY2FwdHVyZWRUcmFjZSkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxMDQ4NTc2O1xuICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPSBjYXB0dXJlZFRyYWNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzQ2FycnlpbmdTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAxMDQ4NTc2KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZ2V0Q2FycmllZFN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2FycnlpbmdTdGFja1RyYWNlKClcbiAgICAgICAgPyB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwXG4gICAgICAgIDogdW5kZWZpbmVkO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NhcHR1cmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChkZWJ1Z2dpbmcpIHtcbiAgICAgICAgdGhpcy5fdHJhY2UgPSBuZXcgQ2FwdHVyZWRUcmFjZSh0aGlzLl9wZWVrQ29udGV4dCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fYXR0YWNoRXh0cmFUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgaWdub3JlU2VsZikge1xuICAgIGlmIChkZWJ1Z2dpbmcgJiYgY2FuQXR0YWNoVHJhY2UoZXJyb3IpKSB7XG4gICAgICAgIHZhciB0cmFjZSA9IHRoaXMuX3RyYWNlO1xuICAgICAgICBpZiAodHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlnbm9yZVNlbGYpIHRyYWNlID0gdHJhY2UuX3BhcmVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdHJhY2UuYXR0YWNoRXh0cmFUcmFjZShlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoIWVycm9yLl9fc3RhY2tDbGVhbmVkX18pIHtcbiAgICAgICAgICAgIHZhciBwYXJzZWQgPSBDYXB0dXJlZFRyYWNlLnBhcnNlU3RhY2tBbmRNZXNzYWdlKGVycm9yKTtcbiAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwic3RhY2tcIixcbiAgICAgICAgICAgICAgICBwYXJzZWQubWVzc2FnZSArIFwiXFxuXCIgKyBwYXJzZWQuc3RhY2suam9pbihcIlxcblwiKSk7XG4gICAgICAgICAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKGVycm9yLCBcIl9fc3RhY2tDbGVhbmVkX19cIiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fd2FybiA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgd2FybmluZyA9IG5ldyBXYXJuaW5nKG1lc3NhZ2UpO1xuICAgIHZhciBjdHggPSB0aGlzLl9wZWVrQ29udGV4dCgpO1xuICAgIGlmIChjdHgpIHtcbiAgICAgICAgY3R4LmF0dGFjaEV4dHJhVHJhY2Uod2FybmluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IENhcHR1cmVkVHJhY2UucGFyc2VTdGFja0FuZE1lc3NhZ2Uod2FybmluZyk7XG4gICAgICAgIHdhcm5pbmcuc3RhY2sgPSBwYXJzZWQubWVzc2FnZSArIFwiXFxuXCIgKyBwYXJzZWQuc3RhY2suam9pbihcIlxcblwiKTtcbiAgICB9XG4gICAgQ2FwdHVyZWRUcmFjZS5mb3JtYXRBbmRMb2dFcnJvcih3YXJuaW5nLCBcIlwiKTtcbn07XG5cblByb21pc2Uub25Qb3NzaWJseVVuaGFuZGxlZFJlamVjdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBkb21haW4gPSBnZXREb21haW4oKTtcbiAgICBwb3NzaWJseVVuaGFuZGxlZFJlamVjdGlvbiA9XG4gICAgICAgIHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiID8gKGRvbWFpbiA9PT0gbnVsbCA/IGZuIDogZG9tYWluLmJpbmQoZm4pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG59O1xuXG5Qcm9taXNlLm9uVW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBkb21haW4gPSBnZXREb21haW4oKTtcbiAgICB1bmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkID1cbiAgICAgICAgdHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIgPyAoZG9tYWluID09PSBudWxsID8gZm4gOiBkb21haW4uYmluZChmbikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbn07XG5cblByb21pc2UubG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChhc3luYy5oYXZlSXRlbXNRdWV1ZWQoKSAmJlxuICAgICAgICBkZWJ1Z2dpbmcgPT09IGZhbHNlXG4gICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGVuYWJsZSBsb25nIHN0YWNrIHRyYWNlcyBhZnRlciBwcm9taXNlcyBoYXZlIGJlZW4gY3JlYXRlZFxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL0RUMXF5R1xcdTAwMGFcIik7XG4gICAgfVxuICAgIGRlYnVnZ2luZyA9IENhcHR1cmVkVHJhY2UuaXNTdXBwb3J0ZWQoKTtcbiAgICBpZiAoZGVidWdnaW5nKSB7XG4gICAgICAgIGFzeW5jLmRpc2FibGVUcmFtcG9saW5lSWZOZWNlc3NhcnkoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLmhhc0xvbmdTdGFja1RyYWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZGVidWdnaW5nICYmIENhcHR1cmVkVHJhY2UuaXNTdXBwb3J0ZWQoKTtcbn07XG5cbmlmICghQ2FwdHVyZWRUcmFjZS5pc1N1cHBvcnRlZCgpKSB7XG4gICAgUHJvbWlzZS5sb25nU3RhY2tUcmFjZXMgPSBmdW5jdGlvbigpe307XG4gICAgZGVidWdnaW5nID0gZmFsc2U7XG59XG5cbnJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGVidWdnaW5nO1xufTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL2Vycm9ycy5qc1wiOjEzLFwiLi91dGlsLmpzXCI6Mzh9XSwxMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBpc1ByaW1pdGl2ZSA9IHV0aWwuaXNQcmltaXRpdmU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIHJldHVybmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbnZhciB0aHJvd2VyID0gZnVuY3Rpb24gKCkge1xuICAgIHRocm93IHRoaXM7XG59O1xudmFyIHJldHVyblVuZGVmaW5lZCA9IGZ1bmN0aW9uKCkge307XG52YXIgdGhyb3dVbmRlZmluZWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyB1bmRlZmluZWQ7XG59O1xuXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uICh2YWx1ZSwgYWN0aW9uKSB7XG4gICAgaWYgKGFjdGlvbiA9PT0gMSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgdmFsdWU7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5cblByb21pc2UucHJvdG90eXBlW1wicmV0dXJuXCJdID1cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXR1cm4gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMudGhlbihyZXR1cm5VbmRlZmluZWQpO1xuXG4gICAgaWYgKGlzUHJpbWl0aXZlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgIHdyYXBwZXIodmFsdWUsIDIpLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4ocmV0dXJuZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2YWx1ZSwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlW1widGhyb3dcIl0gPVxuUHJvbWlzZS5wcm90b3R5cGUudGhlblRocm93ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmIChyZWFzb24gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMudGhlbih0aHJvd1VuZGVmaW5lZCk7XG5cbiAgICBpZiAoaXNQcmltaXRpdmUocmVhc29uKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgIHdyYXBwZXIocmVhc29uLCAxKSxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90aGVuKHRocm93ZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCByZWFzb24sIHVuZGVmaW5lZCk7XG59O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDEyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFByb21pc2VSZWR1Y2UgPSBQcm9taXNlLnJlZHVjZTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZWFjaCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHRoaXMsIGZuLCBudWxsLCBJTlRFUk5BTCk7XG59O1xuXG5Qcm9taXNlLmVhY2ggPSBmdW5jdGlvbiAocHJvbWlzZXMsIGZuKSB7XG4gICAgcmV0dXJuIFByb21pc2VSZWR1Y2UocHJvbWlzZXMsIGZuLCBudWxsLCBJTlRFUk5BTCk7XG59O1xufTtcblxufSx7fV0sMTM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZXM1ID0gX2RlcmVxXyhcIi4vZXM1LmpzXCIpO1xudmFyIE9iamVjdGZyZWV6ZSA9IGVzNS5mcmVlemU7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgaW5oZXJpdHMgPSB1dGlsLmluaGVyaXRzO1xudmFyIG5vdEVudW1lcmFibGVQcm9wID0gdXRpbC5ub3RFbnVtZXJhYmxlUHJvcDtcblxuZnVuY3Rpb24gc3ViRXJyb3IobmFtZVByb3BlcnR5LCBkZWZhdWx0TWVzc2FnZSkge1xuICAgIGZ1bmN0aW9uIFN1YkVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN1YkVycm9yKSkgcmV0dXJuIG5ldyBTdWJFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICB0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIiA/IG1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZSk7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibmFtZVwiLCBuYW1lUHJvcGVydHkpO1xuICAgICAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXJyb3IuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbmhlcml0cyhTdWJFcnJvciwgRXJyb3IpO1xuICAgIHJldHVybiBTdWJFcnJvcjtcbn1cblxudmFyIF9UeXBlRXJyb3IsIF9SYW5nZUVycm9yO1xudmFyIFdhcm5pbmcgPSBzdWJFcnJvcihcIldhcm5pbmdcIiwgXCJ3YXJuaW5nXCIpO1xudmFyIENhbmNlbGxhdGlvbkVycm9yID0gc3ViRXJyb3IoXCJDYW5jZWxsYXRpb25FcnJvclwiLCBcImNhbmNlbGxhdGlvbiBlcnJvclwiKTtcbnZhciBUaW1lb3V0RXJyb3IgPSBzdWJFcnJvcihcIlRpbWVvdXRFcnJvclwiLCBcInRpbWVvdXQgZXJyb3JcIik7XG52YXIgQWdncmVnYXRlRXJyb3IgPSBzdWJFcnJvcihcIkFnZ3JlZ2F0ZUVycm9yXCIsIFwiYWdncmVnYXRlIGVycm9yXCIpO1xudHJ5IHtcbiAgICBfVHlwZUVycm9yID0gVHlwZUVycm9yO1xuICAgIF9SYW5nZUVycm9yID0gUmFuZ2VFcnJvcjtcbn0gY2F0Y2goZSkge1xuICAgIF9UeXBlRXJyb3IgPSBzdWJFcnJvcihcIlR5cGVFcnJvclwiLCBcInR5cGUgZXJyb3JcIik7XG4gICAgX1JhbmdlRXJyb3IgPSBzdWJFcnJvcihcIlJhbmdlRXJyb3JcIiwgXCJyYW5nZSBlcnJvclwiKTtcbn1cblxudmFyIG1ldGhvZHMgPSAoXCJqb2luIHBvcCBwdXNoIHNoaWZ0IHVuc2hpZnQgc2xpY2UgZmlsdGVyIGZvckVhY2ggc29tZSBcIiArXG4gICAgXCJldmVyeSBtYXAgaW5kZXhPZiBsYXN0SW5kZXhPZiByZWR1Y2UgcmVkdWNlUmlnaHQgc29ydCByZXZlcnNlXCIpLnNwbGl0KFwiIFwiKTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKHR5cGVvZiBBcnJheS5wcm90b3R5cGVbbWV0aG9kc1tpXV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBBZ2dyZWdhdGVFcnJvci5wcm90b3R5cGVbbWV0aG9kc1tpXV0gPSBBcnJheS5wcm90b3R5cGVbbWV0aG9kc1tpXV07XG4gICAgfVxufVxuXG5lczUuZGVmaW5lUHJvcGVydHkoQWdncmVnYXRlRXJyb3IucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XG4gICAgdmFsdWU6IDAsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG59KTtcbkFnZ3JlZ2F0ZUVycm9yLnByb3RvdHlwZVtcImlzT3BlcmF0aW9uYWxcIl0gPSB0cnVlO1xudmFyIGxldmVsID0gMDtcbkFnZ3JlZ2F0ZUVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbmRlbnQgPSBBcnJheShsZXZlbCAqIDQgKyAxKS5qb2luKFwiIFwiKTtcbiAgICB2YXIgcmV0ID0gXCJcXG5cIiArIGluZGVudCArIFwiQWdncmVnYXRlRXJyb3Igb2Y6XCIgKyBcIlxcblwiO1xuICAgIGxldmVsKys7XG4gICAgaW5kZW50ID0gQXJyYXkobGV2ZWwgKiA0ICsgMSkuam9pbihcIiBcIik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBzdHIgPSB0aGlzW2ldID09PSB0aGlzID8gXCJbQ2lyY3VsYXIgQWdncmVnYXRlRXJyb3JdXCIgOiB0aGlzW2ldICsgXCJcIjtcbiAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBsaW5lc1tqXSA9IGluZGVudCArIGxpbmVzW2pdO1xuICAgICAgICB9XG4gICAgICAgIHN0ciA9IGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gICAgICAgIHJldCArPSBzdHIgKyBcIlxcblwiO1xuICAgIH1cbiAgICBsZXZlbC0tO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBPcGVyYXRpb25hbEVycm9yKG1lc3NhZ2UpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgT3BlcmF0aW9uYWxFcnJvcikpXG4gICAgICAgIHJldHVybiBuZXcgT3BlcmF0aW9uYWxFcnJvcihtZXNzYWdlKTtcbiAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm5hbWVcIiwgXCJPcGVyYXRpb25hbEVycm9yXCIpO1xuICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibWVzc2FnZVwiLCBtZXNzYWdlKTtcbiAgICB0aGlzLmNhdXNlID0gbWVzc2FnZTtcbiAgICB0aGlzW1wiaXNPcGVyYXRpb25hbFwiXSA9IHRydWU7XG5cbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibWVzc2FnZVwiLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcInN0YWNrXCIsIG1lc3NhZ2Uuc3RhY2spO1xuICAgIH0gZWxzZSBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgfVxuXG59XG5pbmhlcml0cyhPcGVyYXRpb25hbEVycm9yLCBFcnJvcik7XG5cbnZhciBlcnJvclR5cGVzID0gRXJyb3JbXCJfX0JsdWViaXJkRXJyb3JUeXBlc19fXCJdO1xuaWYgKCFlcnJvclR5cGVzKSB7XG4gICAgZXJyb3JUeXBlcyA9IE9iamVjdGZyZWV6ZSh7XG4gICAgICAgIENhbmNlbGxhdGlvbkVycm9yOiBDYW5jZWxsYXRpb25FcnJvcixcbiAgICAgICAgVGltZW91dEVycm9yOiBUaW1lb3V0RXJyb3IsXG4gICAgICAgIE9wZXJhdGlvbmFsRXJyb3I6IE9wZXJhdGlvbmFsRXJyb3IsXG4gICAgICAgIFJlamVjdGlvbkVycm9yOiBPcGVyYXRpb25hbEVycm9yLFxuICAgICAgICBBZ2dyZWdhdGVFcnJvcjogQWdncmVnYXRlRXJyb3JcbiAgICB9KTtcbiAgICBub3RFbnVtZXJhYmxlUHJvcChFcnJvciwgXCJfX0JsdWViaXJkRXJyb3JUeXBlc19fXCIsIGVycm9yVHlwZXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFcnJvcjogRXJyb3IsXG4gICAgVHlwZUVycm9yOiBfVHlwZUVycm9yLFxuICAgIFJhbmdlRXJyb3I6IF9SYW5nZUVycm9yLFxuICAgIENhbmNlbGxhdGlvbkVycm9yOiBlcnJvclR5cGVzLkNhbmNlbGxhdGlvbkVycm9yLFxuICAgIE9wZXJhdGlvbmFsRXJyb3I6IGVycm9yVHlwZXMuT3BlcmF0aW9uYWxFcnJvcixcbiAgICBUaW1lb3V0RXJyb3I6IGVycm9yVHlwZXMuVGltZW91dEVycm9yLFxuICAgIEFnZ3JlZ2F0ZUVycm9yOiBlcnJvclR5cGVzLkFnZ3JlZ2F0ZUVycm9yLFxuICAgIFdhcm5pbmc6IFdhcm5pbmdcbn07XG5cbn0se1wiLi9lczUuanNcIjoxNCxcIi4vdXRpbC5qc1wiOjM4fV0sMTQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xudmFyIGlzRVM1ID0gKGZ1bmN0aW9uKCl7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgcmV0dXJuIHRoaXMgPT09IHVuZGVmaW5lZDtcbn0pKCk7XG5cbmlmIChpc0VTNSkge1xuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBmcmVlemU6IE9iamVjdC5mcmVlemUsXG4gICAgICAgIGRlZmluZVByb3BlcnR5OiBPYmplY3QuZGVmaW5lUHJvcGVydHksXG4gICAgICAgIGdldERlc2NyaXB0b3I6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICAgIGtleXM6IE9iamVjdC5rZXlzLFxuICAgICAgICBuYW1lczogT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMsXG4gICAgICAgIGdldFByb3RvdHlwZU9mOiBPYmplY3QuZ2V0UHJvdG90eXBlT2YsXG4gICAgICAgIGlzQXJyYXk6IEFycmF5LmlzQXJyYXksXG4gICAgICAgIGlzRVM1OiBpc0VTNSxcbiAgICAgICAgcHJvcGVydHlJc1dyaXRhYmxlOiBmdW5jdGlvbihvYmosIHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIHByb3ApO1xuICAgICAgICAgICAgcmV0dXJuICEhKCFkZXNjcmlwdG9yIHx8IGRlc2NyaXB0b3Iud3JpdGFibGUgfHwgZGVzY3JpcHRvci5zZXQpO1xuICAgICAgICB9XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgdmFyIGhhcyA9IHt9Lmhhc093blByb3BlcnR5O1xuICAgIHZhciBzdHIgPSB7fS50b1N0cmluZztcbiAgICB2YXIgcHJvdG8gPSB7fS5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG5cbiAgICB2YXIgT2JqZWN0S2V5cyA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG8pIHtcbiAgICAgICAgICAgIGlmIChoYXMuY2FsbChvLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICB2YXIgT2JqZWN0R2V0RGVzY3JpcHRvciA9IGZ1bmN0aW9uKG8sIGtleSkge1xuICAgICAgICByZXR1cm4ge3ZhbHVlOiBvW2tleV19O1xuICAgIH07XG5cbiAgICB2YXIgT2JqZWN0RGVmaW5lUHJvcGVydHkgPSBmdW5jdGlvbiAobywga2V5LCBkZXNjKSB7XG4gICAgICAgIG9ba2V5XSA9IGRlc2MudmFsdWU7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH07XG5cbiAgICB2YXIgT2JqZWN0RnJlZXplID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH07XG5cbiAgICB2YXIgT2JqZWN0R2V0UHJvdG90eXBlT2YgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0KG9iaikuY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIEFycmF5SXNBcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBzdHIuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBpc0FycmF5OiBBcnJheUlzQXJyYXksXG4gICAgICAgIGtleXM6IE9iamVjdEtleXMsXG4gICAgICAgIG5hbWVzOiBPYmplY3RLZXlzLFxuICAgICAgICBkZWZpbmVQcm9wZXJ0eTogT2JqZWN0RGVmaW5lUHJvcGVydHksXG4gICAgICAgIGdldERlc2NyaXB0b3I6IE9iamVjdEdldERlc2NyaXB0b3IsXG4gICAgICAgIGZyZWV6ZTogT2JqZWN0RnJlZXplLFxuICAgICAgICBnZXRQcm90b3R5cGVPZjogT2JqZWN0R2V0UHJvdG90eXBlT2YsXG4gICAgICAgIGlzRVM1OiBpc0VTNSxcbiAgICAgICAgcHJvcGVydHlJc1dyaXRhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxufSx7fV0sMTU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMKSB7XG52YXIgUHJvbWlzZU1hcCA9IFByb21pc2UubWFwO1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoZm4sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gUHJvbWlzZU1hcCh0aGlzLCBmbiwgb3B0aW9ucywgSU5URVJOQUwpO1xufTtcblxuUHJvbWlzZS5maWx0ZXIgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGZuLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIFByb21pc2VNYXAocHJvbWlzZXMsIGZuLCBvcHRpb25zLCBJTlRFUk5BTCk7XG59O1xufTtcblxufSx7fV0sMTY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIE5FWFRfRklMVEVSLCB0cnlDb252ZXJ0VG9Qcm9taXNlKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgaXNQcmltaXRpdmUgPSB1dGlsLmlzUHJpbWl0aXZlO1xudmFyIHRocm93ZXIgPSB1dGlsLnRocm93ZXI7XG5cbmZ1bmN0aW9uIHJldHVyblRoaXMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiB0aHJvd1RoaXMoKSB7XG4gICAgdGhyb3cgdGhpcztcbn1cbmZ1bmN0aW9uIHJldHVybiQocikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRocm93JChyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyByO1xuICAgIH07XG59XG5mdW5jdGlvbiBwcm9taXNlZEZpbmFsbHkocmV0LCByZWFzb25PclZhbHVlLCBpc0Z1bGZpbGxlZCkge1xuICAgIHZhciB0aGVuO1xuICAgIGlmIChpc1ByaW1pdGl2ZShyZWFzb25PclZhbHVlKSkge1xuICAgICAgICB0aGVuID0gaXNGdWxmaWxsZWQgPyByZXR1cm4kKHJlYXNvbk9yVmFsdWUpIDogdGhyb3ckKHJlYXNvbk9yVmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoZW4gPSBpc0Z1bGZpbGxlZCA/IHJldHVyblRoaXMgOiB0aHJvd1RoaXM7XG4gICAgfVxuICAgIHJldHVybiByZXQuX3RoZW4odGhlbiwgdGhyb3dlciwgdW5kZWZpbmVkLCByZWFzb25PclZhbHVlLCB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBmaW5hbGx5SGFuZGxlcihyZWFzb25PclZhbHVlKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLnByb21pc2U7XG4gICAgdmFyIGhhbmRsZXIgPSB0aGlzLmhhbmRsZXI7XG5cbiAgICB2YXIgcmV0ID0gcHJvbWlzZS5faXNCb3VuZCgpXG4gICAgICAgICAgICAgICAgICAgID8gaGFuZGxlci5jYWxsKHByb21pc2UuX2JvdW5kVmFsdWUoKSlcbiAgICAgICAgICAgICAgICAgICAgOiBoYW5kbGVyKCk7XG5cbiAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocmV0LCBwcm9taXNlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZWRGaW5hbGx5KG1heWJlUHJvbWlzZSwgcmVhc29uT3JWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UuaXNGdWxmaWxsZWQoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZS5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgTkVYVF9GSUxURVIuZSA9IHJlYXNvbk9yVmFsdWU7XG4gICAgICAgIHJldHVybiBORVhUX0ZJTFRFUjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVhc29uT3JWYWx1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRhcEhhbmRsZXIodmFsdWUpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcbiAgICB2YXIgaGFuZGxlciA9IHRoaXMuaGFuZGxlcjtcblxuICAgIHZhciByZXQgPSBwcm9taXNlLl9pc0JvdW5kKClcbiAgICAgICAgICAgICAgICAgICAgPyBoYW5kbGVyLmNhbGwocHJvbWlzZS5fYm91bmRWYWx1ZSgpLCB2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiBoYW5kbGVyKHZhbHVlKTtcblxuICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHByb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlZEZpbmFsbHkobWF5YmVQcm9taXNlLCB2YWx1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5fcGFzc1Rocm91Z2hIYW5kbGVyID0gZnVuY3Rpb24gKGhhbmRsZXIsIGlzRmluYWxseSkge1xuICAgIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdGhpcy50aGVuKCk7XG5cbiAgICB2YXIgcHJvbWlzZUFuZEhhbmRsZXIgPSB7XG4gICAgICAgIHByb21pc2U6IHRoaXMsXG4gICAgICAgIGhhbmRsZXI6IGhhbmRsZXJcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICBpc0ZpbmFsbHkgPyBmaW5hbGx5SGFuZGxlciA6IHRhcEhhbmRsZXIsXG4gICAgICAgICAgICBpc0ZpbmFsbHkgPyBmaW5hbGx5SGFuZGxlciA6IHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgcHJvbWlzZUFuZEhhbmRsZXIsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5sYXN0bHkgPVxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFzc1Rocm91Z2hIYW5kbGVyKGhhbmRsZXIsIHRydWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFzc1Rocm91Z2hIYW5kbGVyKGhhbmRsZXIsIGZhbHNlKTtcbn07XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMTc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwaVJlamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSU5URVJOQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUNvbnZlcnRUb1Byb21pc2UpIHtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIik7XG52YXIgVHlwZUVycm9yID0gZXJyb3JzLlR5cGVFcnJvcjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIHlpZWxkSGFuZGxlcnMgPSBbXTtcblxuZnVuY3Rpb24gcHJvbWlzZUZyb21ZaWVsZEhhbmRsZXIodmFsdWUsIHlpZWxkSGFuZGxlcnMsIHRyYWNlUGFyZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB5aWVsZEhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHRyYWNlUGFyZW50Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2goeWllbGRIYW5kbGVyc1tpXSkodmFsdWUpO1xuICAgICAgICB0cmFjZVBhcmVudC5fcG9wQ29udGV4dCgpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgdHJhY2VQYXJlbnQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgICAgICB2YXIgcmV0ID0gUHJvbWlzZS5yZWplY3QoZXJyb3JPYmouZSk7XG4gICAgICAgICAgICB0cmFjZVBhcmVudC5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXN1bHQsIHRyYWNlUGFyZW50KTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiBtYXliZVByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBQcm9taXNlU3Bhd24oZ2VuZXJhdG9yRnVuY3Rpb24sIHJlY2VpdmVyLCB5aWVsZEhhbmRsZXIsIHN0YWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgdGhpcy5fc3RhY2sgPSBzdGFjaztcbiAgICB0aGlzLl9nZW5lcmF0b3JGdW5jdGlvbiA9IGdlbmVyYXRvckZ1bmN0aW9uO1xuICAgIHRoaXMuX3JlY2VpdmVyID0gcmVjZWl2ZXI7XG4gICAgdGhpcy5fZ2VuZXJhdG9yID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3lpZWxkSGFuZGxlcnMgPSB0eXBlb2YgeWllbGRIYW5kbGVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBbeWllbGRIYW5kbGVyXS5jb25jYXQoeWllbGRIYW5kbGVycylcbiAgICAgICAgOiB5aWVsZEhhbmRsZXJzO1xufVxuXG5Qcm9taXNlU3Bhd24ucHJvdG90eXBlLnByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG59O1xuXG5Qcm9taXNlU3Bhd24ucHJvdG90eXBlLl9ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZ2VuZXJhdG9yID0gdGhpcy5fZ2VuZXJhdG9yRnVuY3Rpb24uY2FsbCh0aGlzLl9yZWNlaXZlcik7XG4gICAgdGhpcy5fcmVjZWl2ZXIgPVxuICAgICAgICB0aGlzLl9nZW5lcmF0b3JGdW5jdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9uZXh0KHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlU3Bhd24ucHJvdG90eXBlLl9jb250aW51ZSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBpZiAocmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVzdWx0LmUsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWUgPSByZXN1bHQudmFsdWU7XG4gICAgaWYgKHJlc3VsdC5kb25lID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodmFsdWUsIHRoaXMuX3Byb21pc2UpO1xuICAgICAgICBpZiAoIShtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID1cbiAgICAgICAgICAgICAgICBwcm9taXNlRnJvbVlpZWxkSGFuZGxlcihtYXliZVByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5feWllbGRIYW5kbGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlKTtcbiAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90aHJvdyhcbiAgICAgICAgICAgICAgICAgICAgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQSB2YWx1ZSAlcyB3YXMgeWllbGRlZCB0aGF0IGNvdWxkIG5vdCBiZSB0cmVhdGVkIGFzIGEgcHJvbWlzZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzRZNHBEa1xcdTAwMGFcXHUwMDBhXCIucmVwbGFjZShcIiVzXCIsIHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkZyb20gY29yb3V0aW5lOlxcdTAwMGFcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFjay5zcGxpdChcIlxcblwiKS5zbGljZSgxLCAtNykuam9pbihcIlxcblwiKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKFxuICAgICAgICAgICAgdGhpcy5fbmV4dCxcbiAgICAgICAgICAgIHRoaXMuX3Rocm93LFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIG51bGxcbiAgICAgICApO1xuICAgIH1cbn07XG5cblByb21pc2VTcGF3bi5wcm90b3R5cGUuX3Rocm93ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHRoaXMuX3Byb21pc2UuX2F0dGFjaEV4dHJhVHJhY2UocmVhc29uKTtcbiAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaCh0aGlzLl9nZW5lcmF0b3JbXCJ0aHJvd1wiXSlcbiAgICAgICAgLmNhbGwodGhpcy5fZ2VuZXJhdG9yLCByZWFzb24pO1xuICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB0aGlzLl9jb250aW51ZShyZXN1bHQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fbmV4dCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKHRoaXMuX2dlbmVyYXRvci5uZXh0KS5jYWxsKHRoaXMuX2dlbmVyYXRvciwgdmFsdWUpO1xuICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB0aGlzLl9jb250aW51ZShyZXN1bHQpO1xufTtcblxuUHJvbWlzZS5jb3JvdXRpbmUgPSBmdW5jdGlvbiAoZ2VuZXJhdG9yRnVuY3Rpb24sIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGdlbmVyYXRvckZ1bmN0aW9uICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImdlbmVyYXRvckZ1bmN0aW9uIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzZWcWhtMFxcdTAwMGFcIik7XG4gICAgfVxuICAgIHZhciB5aWVsZEhhbmRsZXIgPSBPYmplY3Qob3B0aW9ucykueWllbGRIYW5kbGVyO1xuICAgIHZhciBQcm9taXNlU3Bhd24kID0gUHJvbWlzZVNwYXduO1xuICAgIHZhciBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBnZW5lcmF0b3JGdW5jdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgc3Bhd24gPSBuZXcgUHJvbWlzZVNwYXduJCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgeWllbGRIYW5kbGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjayk7XG4gICAgICAgIHNwYXduLl9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgIHNwYXduLl9uZXh0KHVuZGVmaW5lZCk7XG4gICAgICAgIHJldHVybiBzcGF3bi5wcm9taXNlKCk7XG4gICAgfTtcbn07XG5cblByb21pc2UuY29yb3V0aW5lLmFkZFlpZWxkSGFuZGxlciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB5aWVsZEhhbmRsZXJzLnB1c2goZm4pO1xufTtcblxuUHJvbWlzZS5zcGF3biA9IGZ1bmN0aW9uIChnZW5lcmF0b3JGdW5jdGlvbikge1xuICAgIGlmICh0eXBlb2YgZ2VuZXJhdG9yRnVuY3Rpb24gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZ2VuZXJhdG9yRnVuY3Rpb24gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvNlZxaG0wXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdmFyIHNwYXduID0gbmV3IFByb21pc2VTcGF3bihnZW5lcmF0b3JGdW5jdGlvbiwgdGhpcyk7XG4gICAgdmFyIHJldCA9IHNwYXduLnByb21pc2UoKTtcbiAgICBzcGF3bi5fcnVuKFByb21pc2Uuc3Bhd24pO1xuICAgIHJldHVybiByZXQ7XG59O1xufTtcblxufSx7XCIuL2Vycm9ycy5qc1wiOjEzLFwiLi91dGlsLmpzXCI6Mzh9XSwxODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uKFByb21pc2UsIFByb21pc2VBcnJheSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBjYW5FdmFsdWF0ZSA9IHV0aWwuY2FuRXZhbHVhdGU7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciByZWplY3Q7XG5cbmlmICghdHJ1ZSkge1xuaWYgKGNhbkV2YWx1YXRlKSB7XG4gICAgdmFyIHRoZW5DYWxsYmFjayA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcInZhbHVlXCIsIFwiaG9sZGVyXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaG9sZGVyLnBJbmRleCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaG9sZGVyLmNoZWNrRnVsZmlsbG1lbnQodGhpcyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgXCIucmVwbGFjZSgvSW5kZXgvZywgaSkpO1xuICAgIH07XG5cbiAgICB2YXIgY2FsbGVyID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBjb3VudDsgKytpKSB2YWx1ZXMucHVzaChcImhvbGRlci5wXCIgKyBpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImhvbGRlclwiLCBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGhvbGRlci5mbjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh2YWx1ZXMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIFwiLnJlcGxhY2UoL3ZhbHVlcy9nLCB2YWx1ZXMuam9pbihcIiwgXCIpKSk7XG4gICAgfTtcbiAgICB2YXIgdGhlbkNhbGxiYWNrcyA9IFtdO1xuICAgIHZhciBjYWxsZXJzID0gW3VuZGVmaW5lZF07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gNTsgKytpKSB7XG4gICAgICAgIHRoZW5DYWxsYmFja3MucHVzaCh0aGVuQ2FsbGJhY2soaSkpO1xuICAgICAgICBjYWxsZXJzLnB1c2goY2FsbGVyKGkpKTtcbiAgICB9XG5cbiAgICB2YXIgSG9sZGVyID0gZnVuY3Rpb24odG90YWwsIGZuKSB7XG4gICAgICAgIHRoaXMucDEgPSB0aGlzLnAyID0gdGhpcy5wMyA9IHRoaXMucDQgPSB0aGlzLnA1ID0gbnVsbDtcbiAgICAgICAgdGhpcy5mbiA9IGZuO1xuICAgICAgICB0aGlzLnRvdGFsID0gdG90YWw7XG4gICAgICAgIHRoaXMubm93ID0gMDtcbiAgICB9O1xuXG4gICAgSG9sZGVyLnByb3RvdHlwZS5jYWxsZXJzID0gY2FsbGVycztcbiAgICBIb2xkZXIucHJvdG90eXBlLmNoZWNrRnVsZmlsbG1lbnQgPSBmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIHZhciBub3cgPSB0aGlzLm5vdztcbiAgICAgICAgbm93Kys7XG4gICAgICAgIHZhciB0b3RhbCA9IHRoaXMudG90YWw7XG4gICAgICAgIGlmIChub3cgPj0gdG90YWwpIHtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5jYWxsZXJzW3RvdGFsXTtcbiAgICAgICAgICAgIHByb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgICAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2goaGFuZGxlcikodGhpcyk7XG4gICAgICAgICAgICBwcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgICAgICAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHJldC5lLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb21pc2UuX3Jlc29sdmVDYWxsYmFjayhyZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ub3cgPSBub3c7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0KHJlYXNvbik7XG4gICAgfTtcbn1cbn1cblxuUHJvbWlzZS5qb2luID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXN0ID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7XG4gICAgdmFyIGZuO1xuICAgIGlmIChsYXN0ID4gMCAmJiB0eXBlb2YgYXJndW1lbnRzW2xhc3RdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZm4gPSBhcmd1bWVudHNbbGFzdF07XG4gICAgICAgIGlmICghdHJ1ZSkge1xuICAgICAgICAgICAgaWYgKGxhc3QgPCA2ICYmIGNhbkV2YWx1YXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgICAgICAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGhvbGRlciA9IG5ldyBIb2xkZXIobGFzdCwgZm4pO1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSB0aGVuQ2FsbGJhY2tzO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKGFyZ3VtZW50c1tpXSwgcmV0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fdGhlbihjYWxsYmFja3NbaV0sIHJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCByZXQsIGhvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5jYWxsKHJldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX3ZhbHVlKCksIGhvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5fcmVqZWN0KG1heWJlUHJvbWlzZS5fcmVhc29uKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldLmNhbGwocmV0LCBtYXliZVByb21pc2UsIGhvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgJF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoO3ZhciBhcmdzID0gbmV3IEFycmF5KCRfbGVuKTsgZm9yKHZhciAkX2kgPSAwOyAkX2kgPCAkX2xlbjsgKyskX2kpIHthcmdzWyRfaV0gPSBhcmd1bWVudHNbJF9pXTt9XG4gICAgaWYgKGZuKSBhcmdzLnBvcCgpO1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZUFycmF5KGFyZ3MpLnByb21pc2UoKTtcbiAgICByZXR1cm4gZm4gIT09IHVuZGVmaW5lZCA/IHJldC5zcHJlYWQoZm4pIDogcmV0O1xufTtcblxufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDE5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlQXJyYXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwaVJlamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSU5URVJOQUwpIHtcbnZhciBnZXREb21haW4gPSBQcm9taXNlLl9nZXREb21haW47XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIFBFTkRJTkcgPSB7fTtcbnZhciBFTVBUWV9BUlJBWSA9IFtdO1xuXG5mdW5jdGlvbiBNYXBwaW5nUHJvbWlzZUFycmF5KHByb21pc2VzLCBmbiwgbGltaXQsIF9maWx0ZXIpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJChwcm9taXNlcyk7XG4gICAgdGhpcy5fcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB2YXIgZG9tYWluID0gZ2V0RG9tYWluKCk7XG4gICAgdGhpcy5fY2FsbGJhY2sgPSBkb21haW4gPT09IG51bGwgPyBmbiA6IGRvbWFpbi5iaW5kKGZuKTtcbiAgICB0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXMgPSBfZmlsdGVyID09PSBJTlRFUk5BTFxuICAgICAgICA/IG5ldyBBcnJheSh0aGlzLmxlbmd0aCgpKVxuICAgICAgICA6IG51bGw7XG4gICAgdGhpcy5fbGltaXQgPSBsaW1pdDtcbiAgICB0aGlzLl9pbkZsaWdodCA9IDA7XG4gICAgdGhpcy5fcXVldWUgPSBsaW1pdCA+PSAxID8gW10gOiBFTVBUWV9BUlJBWTtcbiAgICBhc3luYy5pbnZva2UoaW5pdCwgdGhpcywgdW5kZWZpbmVkKTtcbn1cbnV0aWwuaW5oZXJpdHMoTWFwcGluZ1Byb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcbmZ1bmN0aW9uIGluaXQoKSB7dGhpcy5faW5pdCQodW5kZWZpbmVkLCAtMik7fVxuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgIHZhciBwcmVzZXJ2ZWRWYWx1ZXMgPSB0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXM7XG4gICAgdmFyIGxpbWl0ID0gdGhpcy5fbGltaXQ7XG4gICAgaWYgKHZhbHVlc1tpbmRleF0gPT09IFBFTkRJTkcpIHtcbiAgICAgICAgdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICBpZiAobGltaXQgPj0gMSkge1xuICAgICAgICAgICAgdGhpcy5faW5GbGlnaHQtLTtcbiAgICAgICAgICAgIHRoaXMuX2RyYWluUXVldWUoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1Jlc29sdmVkKCkpIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChsaW1pdCA+PSAxICYmIHRoaXMuX2luRmxpZ2h0ID49IGxpbWl0KSB7XG4gICAgICAgICAgICB2YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKGluZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlc2VydmVkVmFsdWVzICE9PSBudWxsKSBwcmVzZXJ2ZWRWYWx1ZXNbaW5kZXhdID0gdmFsdWU7XG5cbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdGhpcy5fY2FsbGJhY2s7XG4gICAgICAgIHZhciByZWNlaXZlciA9IHRoaXMuX3Byb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgdmFyIHJldCA9IHRyeUNhdGNoKGNhbGxiYWNrKS5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgaW5kZXgsIGxlbmd0aCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHJldHVybiB0aGlzLl9yZWplY3QocmV0LmUpO1xuXG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJldCwgdGhpcy5fcHJvbWlzZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAobGltaXQgPj0gMSkgdGhpcy5faW5GbGlnaHQrKztcbiAgICAgICAgICAgICAgICB2YWx1ZXNbaW5kZXhdID0gUEVORElORztcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVQcm9taXNlLl9wcm94eVByb21pc2VBcnJheSh0aGlzLCBpbmRleCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldCA9IG1heWJlUHJvbWlzZS5fdmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdChtYXliZVByb21pc2UuX3JlYXNvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXNbaW5kZXhdID0gcmV0O1xuICAgIH1cbiAgICB2YXIgdG90YWxSZXNvbHZlZCA9ICsrdGhpcy5fdG90YWxSZXNvbHZlZDtcbiAgICBpZiAodG90YWxSZXNvbHZlZCA+PSBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHByZXNlcnZlZFZhbHVlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fZmlsdGVyKHZhbHVlcywgcHJlc2VydmVkVmFsdWVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUodmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgfVxufTtcblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUuX2RyYWluUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHF1ZXVlID0gdGhpcy5fcXVldWU7XG4gICAgdmFyIGxpbWl0ID0gdGhpcy5fbGltaXQ7XG4gICAgdmFyIHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCAmJiB0aGlzLl9pbkZsaWdodCA8IGxpbWl0KSB7XG4gICAgICAgIGlmICh0aGlzLl9pc1Jlc29sdmVkKCkpIHJldHVybjtcbiAgICAgICAgdmFyIGluZGV4ID0gcXVldWUucG9wKCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2VGdWxmaWxsZWQodmFsdWVzW2luZGV4XSwgaW5kZXgpO1xuICAgIH1cbn07XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9maWx0ZXIgPSBmdW5jdGlvbiAoYm9vbGVhbnMsIHZhbHVlcykge1xuICAgIHZhciBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHZhciByZXQgPSBuZXcgQXJyYXkobGVuKTtcbiAgICB2YXIgaiA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICBpZiAoYm9vbGVhbnNbaV0pIHJldFtqKytdID0gdmFsdWVzW2ldO1xuICAgIH1cbiAgICByZXQubGVuZ3RoID0gajtcbiAgICB0aGlzLl9yZXNvbHZlKHJldCk7XG59O1xuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5wcmVzZXJ2ZWRWYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZXNlcnZlZFZhbHVlcztcbn07XG5cbmZ1bmN0aW9uIG1hcChwcm9taXNlcywgZm4sIG9wdGlvbnMsIF9maWx0ZXIpIHtcbiAgICB2YXIgbGltaXQgPSB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJvYmplY3RcIiAmJiBvcHRpb25zICE9PSBudWxsXG4gICAgICAgID8gb3B0aW9ucy5jb25jdXJyZW5jeVxuICAgICAgICA6IDA7XG4gICAgbGltaXQgPSB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgaXNGaW5pdGUobGltaXQpICYmIGxpbWl0ID49IDEgPyBsaW1pdCA6IDA7XG4gICAgcmV0dXJuIG5ldyBNYXBwaW5nUHJvbWlzZUFycmF5KHByb21pc2VzLCBmbiwgbGltaXQsIF9maWx0ZXIpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoZm4sIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhcGlSZWplY3Rpb24oXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuXG4gICAgcmV0dXJuIG1hcCh0aGlzLCBmbiwgb3B0aW9ucywgbnVsbCkucHJvbWlzZSgpO1xufTtcblxuUHJvbWlzZS5tYXAgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGZuLCBvcHRpb25zLCBfZmlsdGVyKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICByZXR1cm4gbWFwKHByb21pc2VzLCBmbiwgb3B0aW9ucywgX2ZpbHRlcikucHJvbWlzZSgpO1xufTtcblxuXG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi91dGlsLmpzXCI6Mzh9XSwyMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG5cblByb21pc2UubWV0aG9kID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBQcm9taXNlLlR5cGVFcnJvcihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgcmV0Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0cnlDYXRjaChmbikuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgIHJldC5fcmVzb2x2ZUZyb21TeW5jVmFsdWUodmFsdWUpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG59O1xuXG5Qcm9taXNlLmF0dGVtcHQgPSBQcm9taXNlW1widHJ5XCJdID0gZnVuY3Rpb24gKGZuLCBhcmdzLCBjdHgpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImZuIG11c3QgYmUgYSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzkxNmxKSlxcdTAwMGFcIik7XG4gICAgfVxuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHJldC5fcHVzaENvbnRleHQoKTtcbiAgICB2YXIgdmFsdWUgPSB1dGlsLmlzQXJyYXkoYXJncylcbiAgICAgICAgPyB0cnlDYXRjaChmbikuYXBwbHkoY3R4LCBhcmdzKVxuICAgICAgICA6IHRyeUNhdGNoKGZuKS5jYWxsKGN0eCwgYXJncyk7XG4gICAgcmV0Ll9wb3BDb250ZXh0KCk7XG4gICAgcmV0Ll9yZXNvbHZlRnJvbVN5bmNWYWx1ZSh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXNvbHZlRnJvbVN5bmNWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdXRpbC5lcnJvck9iaikge1xuICAgICAgICB0aGlzLl9yZWplY3RDYWxsYmFjayh2YWx1ZS5lLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlLCB0cnVlKTtcbiAgICB9XG59O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDIxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xuXG5mdW5jdGlvbiBzcHJlYWRBZGFwdGVyKHZhbCwgbm9kZWJhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgaWYgKCF1dGlsLmlzQXJyYXkodmFsKSkgcmV0dXJuIHN1Y2Nlc3NBZGFwdGVyLmNhbGwocHJvbWlzZSwgdmFsLCBub2RlYmFjayk7XG4gICAgdmFyIHJldCA9XG4gICAgICAgIHRyeUNhdGNoKG5vZGViYWNrKS5hcHBseShwcm9taXNlLl9ib3VuZFZhbHVlKCksIFtudWxsXS5jb25jYXQodmFsKSk7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihyZXQuZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdWNjZXNzQWRhcHRlcih2YWwsIG5vZGViYWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciByZWNlaXZlciA9IHByb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICB2YXIgcmV0ID0gdmFsID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0cnlDYXRjaChub2RlYmFjaykuY2FsbChyZWNlaXZlciwgbnVsbClcbiAgICAgICAgOiB0cnlDYXRjaChub2RlYmFjaykuY2FsbChyZWNlaXZlciwgbnVsbCwgdmFsKTtcbiAgICBpZiAocmV0ID09PSBlcnJvck9iaikge1xuICAgICAgICBhc3luYy50aHJvd0xhdGVyKHJldC5lKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlcnJvckFkYXB0ZXIocmVhc29uLCBub2RlYmFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICBpZiAoIXJlYXNvbikge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gcHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgIHZhciBuZXdSZWFzb24gPSB0YXJnZXQuX2dldENhcnJpZWRTdGFja1RyYWNlKCk7XG4gICAgICAgIG5ld1JlYXNvbi5jYXVzZSA9IHJlYXNvbjtcbiAgICAgICAgcmVhc29uID0gbmV3UmVhc29uO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2gobm9kZWJhY2spLmNhbGwocHJvbWlzZS5fYm91bmRWYWx1ZSgpLCByZWFzb24pO1xuICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIocmV0LmUpO1xuICAgIH1cbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYXNDYWxsYmFjayA9XG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlYmFjayA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIGFkYXB0ZXIgPSBzdWNjZXNzQWRhcHRlcjtcbiAgICAgICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBPYmplY3Qob3B0aW9ucykuc3ByZWFkKSB7XG4gICAgICAgICAgICBhZGFwdGVyID0gc3ByZWFkQWRhcHRlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl90aGVuKFxuICAgICAgICAgICAgYWRhcHRlcixcbiAgICAgICAgICAgIGVycm9yQWRhcHRlcixcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBub2RlYmFja1xuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG59O1xuXG59LHtcIi4vYXN5bmMuanNcIjoyLFwiLi91dGlsLmpzXCI6Mzh9XSwyMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgUHJvbWlzZUFycmF5KSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgYXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luYy5qc1wiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzc2VkID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fdGhlbih1bmRlZmluZWQsIHVuZGVmaW5lZCwgaGFuZGxlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzVmFsdWUpIHtcbiAgICBpZiAodGhpcy5faXNGb2xsb3dpbmdPckZ1bGZpbGxlZE9yUmVqZWN0ZWQoKSkgcmV0dXJuO1xuICAgIHRoaXMuX3RhcmdldCgpLl9wcm9ncmVzc1VuY2hlY2tlZChwcm9ncmVzc1ZhbHVlKTtcblxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb2dyZXNzSGFuZGxlckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ID09PSAwXG4gICAgICAgID8gdGhpcy5fcHJvZ3Jlc3NIYW5kbGVyMFxuICAgICAgICA6IHRoaXNbKGluZGV4IDw8IDIpICsgaW5kZXggLSA1ICsgMl07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZG9Qcm9ncmVzc1dpdGggPSBmdW5jdGlvbiAocHJvZ3Jlc3Npb24pIHtcbiAgICB2YXIgcHJvZ3Jlc3NWYWx1ZSA9IHByb2dyZXNzaW9uLnZhbHVlO1xuICAgIHZhciBoYW5kbGVyID0gcHJvZ3Jlc3Npb24uaGFuZGxlcjtcbiAgICB2YXIgcHJvbWlzZSA9IHByb2dyZXNzaW9uLnByb21pc2U7XG4gICAgdmFyIHJlY2VpdmVyID0gcHJvZ3Jlc3Npb24ucmVjZWl2ZXI7XG5cbiAgICB2YXIgcmV0ID0gdHJ5Q2F0Y2goaGFuZGxlcikuY2FsbChyZWNlaXZlciwgcHJvZ3Jlc3NWYWx1ZSk7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgaWYgKHJldC5lICE9IG51bGwgJiZcbiAgICAgICAgICAgIHJldC5lLm5hbWUgIT09IFwiU3RvcFByb2dyZXNzUHJvcGFnYXRpb25cIikge1xuICAgICAgICAgICAgdmFyIHRyYWNlID0gdXRpbC5jYW5BdHRhY2hUcmFjZShyZXQuZSlcbiAgICAgICAgICAgICAgICA/IHJldC5lIDogbmV3IEVycm9yKHV0aWwudG9TdHJpbmcocmV0LmUpKTtcbiAgICAgICAgICAgIHByb21pc2UuX2F0dGFjaEV4dHJhVHJhY2UodHJhY2UpO1xuICAgICAgICAgICAgcHJvbWlzZS5fcHJvZ3Jlc3MocmV0LmUpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldC5fdGhlbihwcm9taXNlLl9wcm9ncmVzcywgbnVsbCwgbnVsbCwgcHJvbWlzZSwgdW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9taXNlLl9wcm9ncmVzcyhyZXQpO1xuICAgIH1cbn07XG5cblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb2dyZXNzVW5jaGVja2VkID0gZnVuY3Rpb24gKHByb2dyZXNzVmFsdWUpIHtcbiAgICB2YXIgbGVuID0gdGhpcy5fbGVuZ3RoKCk7XG4gICAgdmFyIHByb2dyZXNzID0gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuX3Byb2dyZXNzSGFuZGxlckF0KGkpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2VBdChpKTtcbiAgICAgICAgaWYgKCEocHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgICAgICAgICB2YXIgcmVjZWl2ZXIgPSB0aGlzLl9yZWNlaXZlckF0KGkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwocmVjZWl2ZXIsIHByb2dyZXNzVmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWNlaXZlciBpbnN0YW5jZW9mIFByb21pc2VBcnJheSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAhcmVjZWl2ZXIuX2lzUmVzb2x2ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVyLl9wcm9taXNlUHJvZ3Jlc3NlZChwcm9ncmVzc1ZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGFzeW5jLmludm9rZSh0aGlzLl9kb1Byb2dyZXNzV2l0aCwgdGhpcywge1xuICAgICAgICAgICAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgICAgICAgICAgICAgcHJvbWlzZTogcHJvbWlzZSxcbiAgICAgICAgICAgICAgICByZWNlaXZlcjogdGhpcy5fcmVjZWl2ZXJBdChpKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NWYWx1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhc3luYy5pbnZva2UocHJvZ3Jlc3MsIHByb21pc2UsIHByb2dyZXNzVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL3V0aWwuanNcIjozOH1dLDIzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbnZhciBtYWtlU2VsZlJlc29sdXRpb25FcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihcImNpcmN1bGFyIHByb21pc2UgcmVzb2x1dGlvbiBjaGFpblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL0xoRnBvMFxcdTAwMGFcIik7XG59O1xudmFyIHJlZmxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UuUHJvbWlzZUluc3BlY3Rpb24odGhpcy5fdGFyZ2V0KCkpO1xufTtcbnZhciBhcGlSZWplY3Rpb24gPSBmdW5jdGlvbihtc2cpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihtc2cpKTtcbn07XG5cbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcblxudmFyIGdldERvbWFpbjtcbmlmICh1dGlsLmlzTm9kZSkge1xuICAgIGdldERvbWFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmV0ID0gcHJvY2Vzcy5kb21haW47XG4gICAgICAgIGlmIChyZXQgPT09IHVuZGVmaW5lZCkgcmV0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xufSBlbHNlIHtcbiAgICBnZXREb21haW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbn1cbnV0aWwubm90RW51bWVyYWJsZVByb3AoUHJvbWlzZSwgXCJfZ2V0RG9tYWluXCIsIGdldERvbWFpbik7XG5cbnZhciBhc3luYyA9IF9kZXJlcV8oXCIuL2FzeW5jLmpzXCIpO1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKTtcbnZhciBUeXBlRXJyb3IgPSBQcm9taXNlLlR5cGVFcnJvciA9IGVycm9ycy5UeXBlRXJyb3I7XG5Qcm9taXNlLlJhbmdlRXJyb3IgPSBlcnJvcnMuUmFuZ2VFcnJvcjtcblByb21pc2UuQ2FuY2VsbGF0aW9uRXJyb3IgPSBlcnJvcnMuQ2FuY2VsbGF0aW9uRXJyb3I7XG5Qcm9taXNlLlRpbWVvdXRFcnJvciA9IGVycm9ycy5UaW1lb3V0RXJyb3I7XG5Qcm9taXNlLk9wZXJhdGlvbmFsRXJyb3IgPSBlcnJvcnMuT3BlcmF0aW9uYWxFcnJvcjtcblByb21pc2UuUmVqZWN0aW9uRXJyb3IgPSBlcnJvcnMuT3BlcmF0aW9uYWxFcnJvcjtcblByb21pc2UuQWdncmVnYXRlRXJyb3IgPSBlcnJvcnMuQWdncmVnYXRlRXJyb3I7XG52YXIgSU5URVJOQUwgPSBmdW5jdGlvbigpe307XG52YXIgQVBQTFkgPSB7fTtcbnZhciBORVhUX0ZJTFRFUiA9IHtlOiBudWxsfTtcbnZhciB0cnlDb252ZXJ0VG9Qcm9taXNlID0gX2RlcmVxXyhcIi4vdGhlbmFibGVzLmpzXCIpKFByb21pc2UsIElOVEVSTkFMKTtcbnZhciBQcm9taXNlQXJyYXkgPVxuICAgIF9kZXJlcV8oXCIuL3Byb21pc2VfYXJyYXkuanNcIikoUHJvbWlzZSwgSU5URVJOQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pO1xudmFyIENhcHR1cmVkVHJhY2UgPSBfZGVyZXFfKFwiLi9jYXB0dXJlZF90cmFjZS5qc1wiKSgpO1xudmFyIGlzRGVidWdnaW5nID0gX2RlcmVxXyhcIi4vZGVidWdnYWJpbGl0eS5qc1wiKShQcm9taXNlLCBDYXB0dXJlZFRyYWNlKTtcbiAvKmpzaGludCB1bnVzZWQ6ZmFsc2UqL1xudmFyIGNyZWF0ZUNvbnRleHQgPVxuICAgIF9kZXJlcV8oXCIuL2NvbnRleHQuanNcIikoUHJvbWlzZSwgQ2FwdHVyZWRUcmFjZSwgaXNEZWJ1Z2dpbmcpO1xudmFyIENhdGNoRmlsdGVyID0gX2RlcmVxXyhcIi4vY2F0Y2hfZmlsdGVyLmpzXCIpKE5FWFRfRklMVEVSKTtcbnZhciBQcm9taXNlUmVzb2x2ZXIgPSBfZGVyZXFfKFwiLi9wcm9taXNlX3Jlc29sdmVyLmpzXCIpO1xudmFyIG5vZGViYWNrRm9yUHJvbWlzZSA9IFByb21pc2VSZXNvbHZlci5fbm9kZWJhY2tGb3JQcm9taXNlO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG5mdW5jdGlvbiBQcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIHJlc29sdmVyIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvRUMyMlluXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IgIT09IFByb21pc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBpbnZva2VkIGRpcmVjdGx5XFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvS3NJbGdlXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdGhpcy5fYml0RmllbGQgPSAwO1xuICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcHJvZ3Jlc3NIYW5kbGVyMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9wcm9taXNlMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZWNlaXZlcjAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2V0dGxlZFZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGlmIChyZXNvbHZlciAhPT0gSU5URVJOQUwpIHRoaXMuX3Jlc29sdmVGcm9tUmVzb2x2ZXIocmVzb2x2ZXIpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5jYXVnaHQgPSBQcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbiA+IDEpIHtcbiAgICAgICAgdmFyIGNhdGNoSW5zdGFuY2VzID0gbmV3IEFycmF5KGxlbiAtIDEpLFxuICAgICAgICAgICAgaiA9IDAsIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW4gLSAxOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBjYXRjaEluc3RhbmNlc1tqKytdID0gaXRlbTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICAgICAgICAgICAgICBuZXcgVHlwZUVycm9yKFwiQ2F0Y2ggZmlsdGVyIG11c3QgaW5oZXJpdCBmcm9tIEVycm9yIG9yIGJlIGEgc2ltcGxlIHByZWRpY2F0ZSBmdW5jdGlvblxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL284NG82OFxcdTAwMGFcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoSW5zdGFuY2VzLmxlbmd0aCA9IGo7XG4gICAgICAgIGZuID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB2YXIgY2F0Y2hGaWx0ZXIgPSBuZXcgQ2F0Y2hGaWx0ZXIoY2F0Y2hJbnN0YW5jZXMsIGZuLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RoZW4odW5kZWZpbmVkLCBjYXRjaEZpbHRlci5kb0ZpbHRlciwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgY2F0Y2hGaWx0ZXIsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90aGVuKHVuZGVmaW5lZCwgZm4sIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucmVmbGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGhlbihyZWZsZWN0LCByZWZsZWN0LCB1bmRlZmluZWQsIHRoaXMsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MpIHtcbiAgICBpZiAoaXNEZWJ1Z2dpbmcoKSAmJiBhcmd1bWVudHMubGVuZ3RoID4gMCAmJlxuICAgICAgICB0eXBlb2YgZGlkRnVsZmlsbCAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIHR5cGVvZiBkaWRSZWplY3QgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgbXNnID0gXCIudGhlbigpIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYnV0IHdhcyBwYXNzZWQ6IFwiICtcbiAgICAgICAgICAgICAgICB1dGlsLmNsYXNzU3RyaW5nKGRpZEZ1bGZpbGwpO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIG1zZyArPSBcIiwgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGRpZFJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fd2Fybihtc2cpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbihkaWRGdWxmaWxsLCBkaWRSZWplY3QsIGRpZFByb2dyZXNzLFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKGRpZEZ1bGZpbGwsIGRpZFJlamVjdCwgZGlkUHJvZ3Jlc3MpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3RoZW4oZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCBkaWRQcm9ncmVzcyxcbiAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIHByb21pc2UuX3NldElzRmluYWwoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS5fdGhlbihkaWRGdWxmaWxsLCBkaWRSZWplY3QsIHVuZGVmaW5lZCwgQVBQTFksIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0NhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAhdGhpcy5pc1Jlc29sdmVkKCkgJiZcbiAgICAgICAgdGhpcy5fY2FuY2VsbGFibGUoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmV0ID0ge1xuICAgICAgICBpc0Z1bGZpbGxlZDogZmFsc2UsXG4gICAgICAgIGlzUmVqZWN0ZWQ6IGZhbHNlLFxuICAgICAgICBmdWxmaWxsbWVudFZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHJlamVjdGlvblJlYXNvbjogdW5kZWZpbmVkXG4gICAgfTtcbiAgICBpZiAodGhpcy5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgIHJldC5mdWxmaWxsbWVudFZhbHVlID0gdGhpcy52YWx1ZSgpO1xuICAgICAgICByZXQuaXNGdWxmaWxsZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgcmV0LnJlamVjdGlvblJlYXNvbiA9IHRoaXMucmVhc29uKCk7XG4gICAgICAgIHJldC5pc1JlamVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2VBcnJheSh0aGlzKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiB0aGlzLmNhdWdodCh1dGlsLm9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uLCBmbik7XG59O1xuXG5Qcm9taXNlLmlzID0gZnVuY3Rpb24gKHZhbCkge1xuICAgIHJldHVybiB2YWwgaW5zdGFuY2VvZiBQcm9taXNlO1xufTtcblxuUHJvbWlzZS5mcm9tTm9kZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2goZm4pKG5vZGViYWNrRm9yUHJvbWlzZShyZXQpKTtcbiAgICBpZiAocmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICByZXQuX3JlamVjdENhbGxiYWNrKHJlc3VsdC5lLCB0cnVlLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlQXJyYXkocHJvbWlzZXMpLnByb21pc2UoKTtcbn07XG5cblByb21pc2UuZGVmZXIgPSBQcm9taXNlLnBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlUmVzb2x2ZXIocHJvbWlzZSk7XG59O1xuXG5Qcm9taXNlLmNhc3QgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJldCA9IHRyeUNvbnZlcnRUb1Byb21pc2Uob2JqKTtcbiAgICBpZiAoIShyZXQgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICB2YXIgdmFsID0gcmV0O1xuICAgICAgICByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHJldC5fZnVsZmlsbFVuY2hlY2tlZCh2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5yZXNvbHZlID0gUHJvbWlzZS5mdWxmaWxsZWQgPSBQcm9taXNlLmNhc3Q7XG5cblByb21pc2UucmVqZWN0ID0gUHJvbWlzZS5yZWplY3RlZCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICByZXQuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgdHJ1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2Uuc2V0U2NoZWR1bGVyID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJmbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC85MTZsSkpcXHUwMDBhXCIpO1xuICAgIHZhciBwcmV2ID0gYXN5bmMuX3NjaGVkdWxlO1xuICAgIGFzeW5jLl9zY2hlZHVsZSA9IGZuO1xuICAgIHJldHVybiBwcmV2O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3RoZW4gPSBmdW5jdGlvbiAoXG4gICAgZGlkRnVsZmlsbCxcbiAgICBkaWRSZWplY3QsXG4gICAgZGlkUHJvZ3Jlc3MsXG4gICAgcmVjZWl2ZXIsXG4gICAgaW50ZXJuYWxEYXRhXG4pIHtcbiAgICB2YXIgaGF2ZUludGVybmFsRGF0YSA9IGludGVybmFsRGF0YSAhPT0gdW5kZWZpbmVkO1xuICAgIHZhciByZXQgPSBoYXZlSW50ZXJuYWxEYXRhID8gaW50ZXJuYWxEYXRhIDogbmV3IFByb21pc2UoSU5URVJOQUwpO1xuXG4gICAgaWYgKCFoYXZlSW50ZXJuYWxEYXRhKSB7XG4gICAgICAgIHJldC5fcHJvcGFnYXRlRnJvbSh0aGlzLCA0IHwgMSk7XG4gICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0KCk7XG4gICAgaWYgKHRhcmdldCAhPT0gdGhpcykge1xuICAgICAgICBpZiAocmVjZWl2ZXIgPT09IHVuZGVmaW5lZCkgcmVjZWl2ZXIgPSB0aGlzLl9ib3VuZFRvO1xuICAgICAgICBpZiAoIWhhdmVJbnRlcm5hbERhdGEpIHJldC5fc2V0SXNNaWdyYXRlZCgpO1xuICAgIH1cblxuICAgIHZhciBjYWxsYmFja0luZGV4ID0gdGFyZ2V0Ll9hZGRDYWxsYmFja3MoZGlkRnVsZmlsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZFJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZFByb2dyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjZWl2ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREb21haW4oKSk7XG5cbiAgICBpZiAodGFyZ2V0Ll9pc1Jlc29sdmVkKCkgJiYgIXRhcmdldC5faXNTZXR0bGVQcm9taXNlc1F1ZXVlZCgpKSB7XG4gICAgICAgIGFzeW5jLmludm9rZShcbiAgICAgICAgICAgIHRhcmdldC5fc2V0dGxlUHJvbWlzZUF0UG9zdFJlc29sdXRpb24sIHRhcmdldCwgY2FsbGJhY2tJbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlQXRQb3N0UmVzb2x1dGlvbiA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmICh0aGlzLl9pc1JlamVjdGlvblVuaGFuZGxlZCgpKSB0aGlzLl91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgdGhpcy5fc2V0dGxlUHJvbWlzZUF0KGluZGV4KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JpdEZpZWxkICYgMTMxMDcxO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzRm9sbG93aW5nT3JGdWxmaWxsZWRPclJlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA5Mzk1MjQwOTYpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0ZvbGxvd2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgNTM2ODcwOTEyKSA9PT0gNTM2ODcwOTEyO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9ICh0aGlzLl9iaXRGaWVsZCAmIC0xMzEwNzIpIHxcbiAgICAgICAgKGxlbiAmIDEzMTA3MSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0RnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAyNjg0MzU0NTY7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0UmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDEzNDIxNzcyODtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRGb2xsb3dpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDUzNjg3MDkxMjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRJc0ZpbmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAzMzU1NDQzMjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0ZpbmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAzMzU1NDQzMikgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA2NzEwODg2NCkgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldENhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCA2NzEwODg2NDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl91bnNldENhbmNlbGxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjY3MTA4ODY0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRJc01pZ3JhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCA0MTk0MzA0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Vuc2V0SXNNaWdyYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH40MTk0MzA0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc01pZ3JhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA0MTk0MzA0KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVjZWl2ZXJBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHZhciByZXQgPSBpbmRleCA9PT0gMFxuICAgICAgICA/IHRoaXMuX3JlY2VpdmVyMFxuICAgICAgICA6IHRoaXNbXG4gICAgICAgICAgICBpbmRleCAqIDUgLSA1ICsgNF07XG4gICAgaWYgKHJldCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX2lzQm91bmQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmRWYWx1ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb21pc2VBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHJldHVybiBpbmRleCA9PT0gMFxuICAgICAgICA/IHRoaXMuX3Byb21pc2UwXG4gICAgICAgIDogdGhpc1tpbmRleCAqIDUgLSA1ICsgM107XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZnVsZmlsbG1lbnRIYW5kbGVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IDBcbiAgICAgICAgPyB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwXG4gICAgICAgIDogdGhpc1tpbmRleCAqIDUgLSA1ICsgMF07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0aW9uSGFuZGxlckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ID09PSAwXG4gICAgICAgID8gdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjBcbiAgICAgICAgOiB0aGlzW2luZGV4ICogNSAtIDUgKyAxXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9ib3VuZFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJldCA9IHRoaXMuX2JvdW5kVG87XG4gICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBpZiAocmV0LmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0LnZhbHVlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9taWdyYXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGZvbGxvd2VyLCBpbmRleCkge1xuICAgIHZhciBmdWxmaWxsID0gZm9sbG93ZXIuX2Z1bGZpbGxtZW50SGFuZGxlckF0KGluZGV4KTtcbiAgICB2YXIgcmVqZWN0ID0gZm9sbG93ZXIuX3JlamVjdGlvbkhhbmRsZXJBdChpbmRleCk7XG4gICAgdmFyIHByb2dyZXNzID0gZm9sbG93ZXIuX3Byb2dyZXNzSGFuZGxlckF0KGluZGV4KTtcbiAgICB2YXIgcHJvbWlzZSA9IGZvbGxvd2VyLl9wcm9taXNlQXQoaW5kZXgpO1xuICAgIHZhciByZWNlaXZlciA9IGZvbGxvd2VyLl9yZWNlaXZlckF0KGluZGV4KTtcbiAgICBpZiAocHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHByb21pc2UuX3NldElzTWlncmF0ZWQoKTtcbiAgICB0aGlzLl9hZGRDYWxsYmFja3MoZnVsZmlsbCwgcmVqZWN0LCBwcm9ncmVzcywgcHJvbWlzZSwgcmVjZWl2ZXIsIG51bGwpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2FkZENhbGxiYWNrcyA9IGZ1bmN0aW9uIChcbiAgICBmdWxmaWxsLFxuICAgIHJlamVjdCxcbiAgICBwcm9ncmVzcyxcbiAgICBwcm9taXNlLFxuICAgIHJlY2VpdmVyLFxuICAgIGRvbWFpblxuKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fbGVuZ3RoKCk7XG5cbiAgICBpZiAoaW5kZXggPj0gMTMxMDcxIC0gNSkge1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NldExlbmd0aCgwKTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgdGhpcy5fcHJvbWlzZTAgPSBwcm9taXNlO1xuICAgICAgICBpZiAocmVjZWl2ZXIgIT09IHVuZGVmaW5lZCkgdGhpcy5fcmVjZWl2ZXIwID0gcmVjZWl2ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgZnVsZmlsbCA9PT0gXCJmdW5jdGlvblwiICYmICF0aGlzLl9pc0NhcnJ5aW5nU3RhY2tUcmFjZSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyBmdWxmaWxsIDogZG9tYWluLmJpbmQoZnVsZmlsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjAgPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IHJlamVjdCA6IGRvbWFpbi5iaW5kKHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBwcm9ncmVzcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzc0hhbmRsZXIwID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyBwcm9ncmVzcyA6IGRvbWFpbi5iaW5kKHByb2dyZXNzKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBiYXNlID0gaW5kZXggKiA1IC0gNTtcbiAgICAgICAgdGhpc1tiYXNlICsgM10gPSBwcm9taXNlO1xuICAgICAgICB0aGlzW2Jhc2UgKyA0XSA9IHJlY2VpdmVyO1xuICAgICAgICBpZiAodHlwZW9mIGZ1bGZpbGwgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpc1tiYXNlICsgMF0gPVxuICAgICAgICAgICAgICAgIGRvbWFpbiA9PT0gbnVsbCA/IGZ1bGZpbGwgOiBkb21haW4uYmluZChmdWxmaWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJlamVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzW2Jhc2UgKyAxXSA9XG4gICAgICAgICAgICAgICAgZG9tYWluID09PSBudWxsID8gcmVqZWN0IDogZG9tYWluLmJpbmQocmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHByb2dyZXNzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXNbYmFzZSArIDJdID1cbiAgICAgICAgICAgICAgICBkb21haW4gPT09IG51bGwgPyBwcm9ncmVzcyA6IGRvbWFpbi5iaW5kKHByb2dyZXNzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zZXRMZW5ndGgoaW5kZXggKyAxKTtcbiAgICByZXR1cm4gaW5kZXg7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0UHJveHlIYW5kbGVycyA9IGZ1bmN0aW9uIChyZWNlaXZlciwgcHJvbWlzZVNsb3RWYWx1ZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2xlbmd0aCgpO1xuXG4gICAgaWYgKGluZGV4ID49IDEzMTA3MSAtIDUpIHtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9zZXRMZW5ndGgoMCk7XG4gICAgfVxuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICB0aGlzLl9wcm9taXNlMCA9IHByb21pc2VTbG90VmFsdWU7XG4gICAgICAgIHRoaXMuX3JlY2VpdmVyMCA9IHJlY2VpdmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBiYXNlID0gaW5kZXggKiA1IC0gNTtcbiAgICAgICAgdGhpc1tiYXNlICsgM10gPSBwcm9taXNlU2xvdFZhbHVlO1xuICAgICAgICB0aGlzW2Jhc2UgKyA0XSA9IHJlY2VpdmVyO1xuICAgIH1cbiAgICB0aGlzLl9zZXRMZW5ndGgoaW5kZXggKyAxKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9wcm94eVByb21pc2VBcnJheSA9IGZ1bmN0aW9uIChwcm9taXNlQXJyYXksIGluZGV4KSB7XG4gICAgdGhpcy5fc2V0UHJveHlIYW5kbGVycyhwcm9taXNlQXJyYXksIGluZGV4KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXNvbHZlQ2FsbGJhY2sgPSBmdW5jdGlvbih2YWx1ZSwgc2hvdWxkQmluZCkge1xuICAgIGlmICh0aGlzLl9pc0ZvbGxvd2luZ09yRnVsZmlsbGVkT3JSZWplY3RlZCgpKSByZXR1cm47XG4gICAgaWYgKHZhbHVlID09PSB0aGlzKVxuICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0Q2FsbGJhY2sobWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IoKSwgZmFsc2UsIHRydWUpO1xuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHZhbHVlLCB0aGlzKTtcbiAgICBpZiAoIShtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSkgcmV0dXJuIHRoaXMuX2Z1bGZpbGwodmFsdWUpO1xuXG4gICAgdmFyIHByb3BhZ2F0aW9uRmxhZ3MgPSAxIHwgKHNob3VsZEJpbmQgPyA0IDogMCk7XG4gICAgdGhpcy5fcHJvcGFnYXRlRnJvbShtYXliZVByb21pc2UsIHByb3BhZ2F0aW9uRmxhZ3MpO1xuICAgIHZhciBwcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICBpZiAocHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9taWdyYXRlQ2FsbGJhY2tzKHRoaXMsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NldEZvbGxvd2luZygpO1xuICAgICAgICB0aGlzLl9zZXRMZW5ndGgoMCk7XG4gICAgICAgIHRoaXMuX3NldEZvbGxvd2VlKHByb21pc2UpO1xuICAgIH0gZWxzZSBpZiAocHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICB0aGlzLl9mdWxmaWxsVW5jaGVja2VkKHByb21pc2UuX3ZhbHVlKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3JlamVjdFVuY2hlY2tlZChwcm9taXNlLl9yZWFzb24oKSxcbiAgICAgICAgICAgIHByb21pc2UuX2dldENhcnJpZWRTdGFja1RyYWNlKCkpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3RDYWxsYmFjayA9XG5mdW5jdGlvbihyZWFzb24sIHN5bmNocm9ub3VzLCBzaG91bGROb3RNYXJrT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKSB7XG4gICAgaWYgKCFzaG91bGROb3RNYXJrT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKSB7XG4gICAgICAgIHV0aWwubWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKHJlYXNvbik7XG4gICAgfVxuICAgIHZhciB0cmFjZSA9IHV0aWwuZW5zdXJlRXJyb3JPYmplY3QocmVhc29uKTtcbiAgICB2YXIgaGFzU3RhY2sgPSB0cmFjZSA9PT0gcmVhc29uO1xuICAgIHRoaXMuX2F0dGFjaEV4dHJhVHJhY2UodHJhY2UsIHN5bmNocm9ub3VzID8gaGFzU3RhY2sgOiBmYWxzZSk7XG4gICAgdGhpcy5fcmVqZWN0KHJlYXNvbiwgaGFzU3RhY2sgPyB1bmRlZmluZWQgOiB0cmFjZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVzb2x2ZUZyb21SZXNvbHZlciA9IGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB0aGlzLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHRoaXMuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHN5bmNocm9ub3VzID0gdHJ1ZTtcbiAgICB2YXIgciA9IHRyeUNhdGNoKHJlc29sdmVyKShmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChwcm9taXNlID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgc3luY2hyb25vdXMpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9KTtcbiAgICBzeW5jaHJvbm91cyA9IGZhbHNlO1xuICAgIHRoaXMuX3BvcENvbnRleHQoKTtcblxuICAgIGlmIChyICE9PSB1bmRlZmluZWQgJiYgciA9PT0gZXJyb3JPYmogJiYgcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyLmUsIHRydWUsIHRydWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZUZyb21IYW5kbGVyID0gZnVuY3Rpb24gKFxuICAgIGhhbmRsZXIsIHJlY2VpdmVyLCB2YWx1ZSwgcHJvbWlzZVxuKSB7XG4gICAgaWYgKHByb21pc2UuX2lzUmVqZWN0ZWQoKSkgcmV0dXJuO1xuICAgIHByb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHg7XG4gICAgaWYgKHJlY2VpdmVyID09PSBBUFBMWSAmJiAhdGhpcy5faXNSZWplY3RlZCgpKSB7XG4gICAgICAgIHggPSB0cnlDYXRjaChoYW5kbGVyKS5hcHBseSh0aGlzLl9ib3VuZFZhbHVlKCksIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB4ID0gdHJ5Q2F0Y2goaGFuZGxlcikuY2FsbChyZWNlaXZlciwgdmFsdWUpO1xuICAgIH1cbiAgICBwcm9taXNlLl9wb3BDb250ZXh0KCk7XG5cbiAgICBpZiAoeCA9PT0gZXJyb3JPYmogfHwgeCA9PT0gcHJvbWlzZSB8fCB4ID09PSBORVhUX0ZJTFRFUikge1xuICAgICAgICB2YXIgZXJyID0geCA9PT0gcHJvbWlzZSA/IG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKCkgOiB4LmU7XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKGVyciwgZmFsc2UsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHByb21pc2UuX3Jlc29sdmVDYWxsYmFjayh4KTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdGFyZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJldCA9IHRoaXM7XG4gICAgd2hpbGUgKHJldC5faXNGb2xsb3dpbmcoKSkgcmV0ID0gcmV0Ll9mb2xsb3dlZSgpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZm9sbG93ZWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Rm9sbG93ZWUgPSBmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjAgPSBwcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NsZWFuVmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9jYW5jZWxsYWJsZSgpKSB7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvblBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvcGFnYXRlRnJvbSA9IGZ1bmN0aW9uIChwYXJlbnQsIGZsYWdzKSB7XG4gICAgaWYgKChmbGFncyAmIDEpID4gMCAmJiBwYXJlbnQuX2NhbmNlbGxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5fc2V0Q2FuY2VsbGFibGUoKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uUGFyZW50ID0gcGFyZW50O1xuICAgIH1cbiAgICBpZiAoKGZsYWdzICYgNCkgPiAwICYmIHBhcmVudC5faXNCb3VuZCgpKSB7XG4gICAgICAgIHRoaXMuX3NldEJvdW5kVG8ocGFyZW50Ll9ib3VuZFRvKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9pc0ZvbGxvd2luZ09yRnVsZmlsbGVkT3JSZWplY3RlZCgpKSByZXR1cm47XG4gICAgdGhpcy5fZnVsZmlsbFVuY2hlY2tlZCh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbiwgY2FycmllZFN0YWNrVHJhY2UpIHtcbiAgICBpZiAodGhpcy5faXNGb2xsb3dpbmdPckZ1bGZpbGxlZE9yUmVqZWN0ZWQoKSkgcmV0dXJuO1xuICAgIHRoaXMuX3JlamVjdFVuY2hlY2tlZChyZWFzb24sIGNhcnJpZWRTdGFja1RyYWNlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2VBdChpbmRleCk7XG4gICAgdmFyIGlzUHJvbWlzZSA9IHByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlO1xuXG4gICAgaWYgKGlzUHJvbWlzZSAmJiBwcm9taXNlLl9pc01pZ3JhdGVkKCkpIHtcbiAgICAgICAgcHJvbWlzZS5fdW5zZXRJc01pZ3JhdGVkKCk7XG4gICAgICAgIHJldHVybiBhc3luYy5pbnZva2UodGhpcy5fc2V0dGxlUHJvbWlzZUF0LCB0aGlzLCBpbmRleCk7XG4gICAgfVxuICAgIHZhciBoYW5kbGVyID0gdGhpcy5faXNGdWxmaWxsZWQoKVxuICAgICAgICA/IHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlckF0KGluZGV4KVxuICAgICAgICA6IHRoaXMuX3JlamVjdGlvbkhhbmRsZXJBdChpbmRleCk7XG5cbiAgICB2YXIgY2FycmllZFN0YWNrVHJhY2UgPVxuICAgICAgICB0aGlzLl9pc0NhcnJ5aW5nU3RhY2tUcmFjZSgpID8gdGhpcy5fZ2V0Q2FycmllZFN0YWNrVHJhY2UoKSA6IHVuZGVmaW5lZDtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLl9zZXR0bGVkVmFsdWU7XG4gICAgdmFyIHJlY2VpdmVyID0gdGhpcy5fcmVjZWl2ZXJBdChpbmRleCk7XG4gICAgdGhpcy5fY2xlYXJDYWxsYmFja0RhdGFBdEluZGV4KGluZGV4KTtcblxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGlmICghaXNQcm9taXNlKSB7XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwocmVjZWl2ZXIsIHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldHRsZVByb21pc2VGcm9tSGFuZGxlcihoYW5kbGVyLCByZWNlaXZlciwgdmFsdWUsIHByb21pc2UpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChyZWNlaXZlciBpbnN0YW5jZW9mIFByb21pc2VBcnJheSkge1xuICAgICAgICBpZiAoIXJlY2VpdmVyLl9pc1Jlc29sdmVkKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIuX3Byb21pc2VGdWxmaWxsZWQodmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIuX3Byb21pc2VSZWplY3RlZCh2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUHJvbWlzZSkge1xuICAgICAgICBpZiAodGhpcy5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fZnVsZmlsbCh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlLl9yZWplY3QodmFsdWUsIGNhcnJpZWRTdGFja1RyYWNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbmRleCA+PSA0ICYmIChpbmRleCAmIDMxKSA9PT0gNClcbiAgICAgICAgYXN5bmMuaW52b2tlTGF0ZXIodGhpcy5fc2V0TGVuZ3RoLCB0aGlzLCAwKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jbGVhckNhbGxiYWNrRGF0YUF0SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQ2FycnlpbmdTdGFja1RyYWNlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjAgPVxuICAgICAgICB0aGlzLl9wcm9ncmVzc0hhbmRsZXIwID1cbiAgICAgICAgdGhpcy5fcmVjZWl2ZXIwID1cbiAgICAgICAgdGhpcy5fcHJvbWlzZTAgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGJhc2UgPSBpbmRleCAqIDUgLSA1O1xuICAgICAgICB0aGlzW2Jhc2UgKyAzXSA9XG4gICAgICAgIHRoaXNbYmFzZSArIDRdID1cbiAgICAgICAgdGhpc1tiYXNlICsgMF0gPVxuICAgICAgICB0aGlzW2Jhc2UgKyAxXSA9XG4gICAgICAgIHRoaXNbYmFzZSArIDJdID0gdW5kZWZpbmVkO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc1NldHRsZVByb21pc2VzUXVldWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJlxuICAgICAgICAgICAgLTEwNzM3NDE4MjQpID09PSAtMTA3Mzc0MTgyNDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRTZXR0bGVQcm9taXNlc1F1ZXVlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgLTEwNzM3NDE4MjQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRTZXR0bGVQcm9taXNlc1F1ZXVlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH4tMTA3Mzc0MTgyNCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcXVldWVTZXR0bGVQcm9taXNlcyA9IGZ1bmN0aW9uKCkge1xuICAgIGFzeW5jLnNldHRsZVByb21pc2VzKHRoaXMpO1xuICAgIHRoaXMuX3NldFNldHRsZVByb21pc2VzUXVldWVkKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZnVsZmlsbFVuY2hlY2tlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdGhpcykge1xuICAgICAgICB2YXIgZXJyID0gbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IoKTtcbiAgICAgICAgdGhpcy5fYXR0YWNoRXh0cmFUcmFjZShlcnIpO1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0VW5jaGVja2VkKGVyciwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgdGhpcy5fc2V0RnVsZmlsbGVkKCk7XG4gICAgdGhpcy5fc2V0dGxlZFZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fY2xlYW5WYWx1ZXMoKTtcblxuICAgIGlmICh0aGlzLl9sZW5ndGgoKSA+IDApIHtcbiAgICAgICAgdGhpcy5fcXVldWVTZXR0bGVQcm9taXNlcygpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3RVbmNoZWNrZWRDaGVja0Vycm9yID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHZhciB0cmFjZSA9IHV0aWwuZW5zdXJlRXJyb3JPYmplY3QocmVhc29uKTtcbiAgICB0aGlzLl9yZWplY3RVbmNoZWNrZWQocmVhc29uLCB0cmFjZSA9PT0gcmVhc29uID8gdW5kZWZpbmVkIDogdHJhY2UpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3JlamVjdFVuY2hlY2tlZCA9IGZ1bmN0aW9uIChyZWFzb24sIHRyYWNlKSB7XG4gICAgaWYgKHJlYXNvbiA9PT0gdGhpcykge1xuICAgICAgICB2YXIgZXJyID0gbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IoKTtcbiAgICAgICAgdGhpcy5fYXR0YWNoRXh0cmFUcmFjZShlcnIpO1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0VW5jaGVja2VkKGVycik7XG4gICAgfVxuICAgIHRoaXMuX3NldFJlamVjdGVkKCk7XG4gICAgdGhpcy5fc2V0dGxlZFZhbHVlID0gcmVhc29uO1xuICAgIHRoaXMuX2NsZWFuVmFsdWVzKCk7XG5cbiAgICBpZiAodGhpcy5faXNGaW5hbCgpKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKFwic3RhY2tcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgYXN5bmMuaW52b2tlRmlyc3QoXG4gICAgICAgICAgICAgICAgICAgIENhcHR1cmVkVHJhY2UudW5oYW5kbGVkUmVqZWN0aW9uLCB1bmRlZmluZWQsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSwgdHJhY2UgPT09IHVuZGVmaW5lZCA/IHJlYXNvbiA6IHRyYWNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0cmFjZSAhPT0gdW5kZWZpbmVkICYmIHRyYWNlICE9PSByZWFzb24pIHtcbiAgICAgICAgdGhpcy5fc2V0Q2FycmllZFN0YWNrVHJhY2UodHJhY2UpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9sZW5ndGgoKSA+IDApIHtcbiAgICAgICAgdGhpcy5fcXVldWVTZXR0bGVQcm9taXNlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Vuc3VyZVBvc3NpYmxlUmVqZWN0aW9uSGFuZGxlZCgpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl91bnNldFNldHRsZVByb21pc2VzUXVldWVkKCk7XG4gICAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdGhpcy5fc2V0dGxlUHJvbWlzZUF0KGkpO1xuICAgIH1cbn07XG5cbnV0aWwubm90RW51bWVyYWJsZVByb3AoUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgXCJfbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IpO1xuXG5fZGVyZXFfKFwiLi9wcm9ncmVzcy5qc1wiKShQcm9taXNlLCBQcm9taXNlQXJyYXkpO1xuX2RlcmVxXyhcIi4vbWV0aG9kLmpzXCIpKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pO1xuX2RlcmVxXyhcIi4vYmluZC5qc1wiKShQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSk7XG5fZGVyZXFfKFwiLi9maW5hbGx5LmpzXCIpKFByb21pc2UsIE5FWFRfRklMVEVSLCB0cnlDb252ZXJ0VG9Qcm9taXNlKTtcbl9kZXJlcV8oXCIuL2RpcmVjdF9yZXNvbHZlLmpzXCIpKFByb21pc2UpO1xuX2RlcmVxXyhcIi4vc3luY2hyb25vdXNfaW5zcGVjdGlvbi5qc1wiKShQcm9taXNlKTtcbl9kZXJlcV8oXCIuL2pvaW4uanNcIikoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCk7XG5Qcm9taXNlLlByb21pc2UgPSBQcm9taXNlO1xuX2RlcmVxXygnLi9tYXAuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbiwgdHJ5Q29udmVydFRvUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi9jYW5jZWwuanMnKShQcm9taXNlKTtcbl9kZXJlcV8oJy4vdXNpbmcuanMnKShQcm9taXNlLCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsIGNyZWF0ZUNvbnRleHQpO1xuX2RlcmVxXygnLi9nZW5lcmF0b3JzLmpzJykoUHJvbWlzZSwgYXBpUmVqZWN0aW9uLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSk7XG5fZGVyZXFfKCcuL25vZGVpZnkuanMnKShQcm9taXNlKTtcbl9kZXJlcV8oJy4vY2FsbF9nZXQuanMnKShQcm9taXNlKTtcbl9kZXJlcV8oJy4vcHJvcHMuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbik7XG5fZGVyZXFfKCcuL3JhY2UuanMnKShQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKTtcbl9kZXJlcV8oJy4vcmVkdWNlLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsIElOVEVSTkFMKTtcbl9kZXJlcV8oJy4vc2V0dGxlLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5KTtcbl9kZXJlcV8oJy4vc29tZS5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uKTtcbl9kZXJlcV8oJy4vcHJvbWlzaWZ5LmpzJykoUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi9hbnkuanMnKShQcm9taXNlKTtcbl9kZXJlcV8oJy4vZWFjaC5qcycpKFByb21pc2UsIElOVEVSTkFMKTtcbl9kZXJlcV8oJy4vdGltZXJzLmpzJykoUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi9maWx0ZXIuanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICB1dGlsLnRvRmFzdFByb3BlcnRpZXMoUHJvbWlzZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgdXRpbC50b0Zhc3RQcm9wZXJ0aWVzKFByb21pc2UucHJvdG90eXBlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZ1bmN0aW9uIGZpbGxUeXBlcyh2YWx1ZSkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9yZWplY3Rpb25IYW5kbGVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fcHJvZ3Jlc3NIYW5kbGVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3Byb21pc2UwID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9yZWNlaXZlcjAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fc2V0dGxlZFZhbHVlID0gdmFsdWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIC8vIENvbXBsZXRlIHNsYWNrIHRyYWNraW5nLCBvcHQgb3V0IG9mIGZpZWxkLXR5cGUgdHJhY2tpbmcgYW5kICAgICAgICAgICBcbiAgICAvLyBzdGFiaWxpemUgbWFwICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHthOiAxfSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyh7YjogMn0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoe2M6IDN9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKDEpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyhmdW5jdGlvbigpe30pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXModW5kZWZpbmVkKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKGZhbHNlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyhuZXcgUHJvbWlzZShJTlRFUk5BTCkpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBDYXB0dXJlZFRyYWNlLnNldEJvdW5kcyhhc3luYy5maXJzdExpbmVFcnJvciwgdXRpbC5sYXN0TGluZUVycm9yKTsgICAgICAgXG4gICAgcmV0dXJuIFByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXG59O1xuXG59LHtcIi4vYW55LmpzXCI6MSxcIi4vYXN5bmMuanNcIjoyLFwiLi9iaW5kLmpzXCI6MyxcIi4vY2FsbF9nZXQuanNcIjo1LFwiLi9jYW5jZWwuanNcIjo2LFwiLi9jYXB0dXJlZF90cmFjZS5qc1wiOjcsXCIuL2NhdGNoX2ZpbHRlci5qc1wiOjgsXCIuL2NvbnRleHQuanNcIjo5LFwiLi9kZWJ1Z2dhYmlsaXR5LmpzXCI6MTAsXCIuL2RpcmVjdF9yZXNvbHZlLmpzXCI6MTEsXCIuL2VhY2guanNcIjoxMixcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL2ZpbHRlci5qc1wiOjE1LFwiLi9maW5hbGx5LmpzXCI6MTYsXCIuL2dlbmVyYXRvcnMuanNcIjoxNyxcIi4vam9pbi5qc1wiOjE4LFwiLi9tYXAuanNcIjoxOSxcIi4vbWV0aG9kLmpzXCI6MjAsXCIuL25vZGVpZnkuanNcIjoyMSxcIi4vcHJvZ3Jlc3MuanNcIjoyMixcIi4vcHJvbWlzZV9hcnJheS5qc1wiOjI0LFwiLi9wcm9taXNlX3Jlc29sdmVyLmpzXCI6MjUsXCIuL3Byb21pc2lmeS5qc1wiOjI2LFwiLi9wcm9wcy5qc1wiOjI3LFwiLi9yYWNlLmpzXCI6MjksXCIuL3JlZHVjZS5qc1wiOjMwLFwiLi9zZXR0bGUuanNcIjozMixcIi4vc29tZS5qc1wiOjMzLFwiLi9zeW5jaHJvbm91c19pbnNwZWN0aW9uLmpzXCI6MzQsXCIuL3RoZW5hYmxlcy5qc1wiOjM1LFwiLi90aW1lcnMuanNcIjozNixcIi4vdXNpbmcuanNcIjozNyxcIi4vdXRpbC5qc1wiOjM4fV0sMjQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLFxuICAgIGFwaVJlamVjdGlvbikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGlzQXJyYXkgPSB1dGlsLmlzQXJyYXk7XG5cbmZ1bmN0aW9uIHRvUmVzb2x1dGlvblZhbHVlKHZhbCkge1xuICAgIHN3aXRjaCh2YWwpIHtcbiAgICBjYXNlIC0yOiByZXR1cm4gW107XG4gICAgY2FzZSAtMzogcmV0dXJuIHt9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gUHJvbWlzZUFycmF5KHZhbHVlcykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICB2YXIgcGFyZW50O1xuICAgIGlmICh2YWx1ZXMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHBhcmVudCA9IHZhbHVlcztcbiAgICAgICAgcHJvbWlzZS5fcHJvcGFnYXRlRnJvbShwYXJlbnQsIDEgfCA0KTtcbiAgICB9XG4gICAgdGhpcy5fdmFsdWVzID0gdmFsdWVzO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdG90YWxSZXNvbHZlZCA9IDA7XG4gICAgdGhpcy5faW5pdCh1bmRlZmluZWQsIC0yKTtcbn1cblByb21pc2VBcnJheS5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLnByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gaW5pdChfLCByZXNvbHZlVmFsdWVJZkVtcHR5KSB7XG4gICAgdmFyIHZhbHVlcyA9IHRyeUNvbnZlcnRUb1Byb21pc2UodGhpcy5fdmFsdWVzLCB0aGlzLl9wcm9taXNlKTtcbiAgICBpZiAodmFsdWVzIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuX3RhcmdldCgpO1xuICAgICAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG4gICAgICAgIGlmICh2YWx1ZXMuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHZhbHVlcy5fdmFsdWUoKTtcbiAgICAgICAgICAgIGlmICghaXNBcnJheSh2YWx1ZXMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBQcm9taXNlLlR5cGVFcnJvcihcImV4cGVjdGluZyBhbiBhcnJheSwgYSBwcm9taXNlIG9yIGEgdGhlbmFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zOE1NaGNcXHUwMDBhXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19oYXJkUmVqZWN0X18oZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVzLl9pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgdmFsdWVzLl90aGVuKFxuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVqZWN0LFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIHJlc29sdmVWYWx1ZUlmRW1wdHlcbiAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlamVjdCh2YWx1ZXMuX3JlYXNvbigpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzQXJyYXkodmFsdWVzKSkge1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9yZWplY3QoYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGFuIGFycmF5LCBhIHByb21pc2Ugb3IgYSB0aGVuYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3M4TU1oY1xcdTAwMGFcIikuX3JlYXNvbigpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmIChyZXNvbHZlVmFsdWVJZkVtcHR5ID09PSAtNSkge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZUVtcHR5QXJyYXkoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUodG9SZXNvbHV0aW9uVmFsdWUocmVzb2x2ZVZhbHVlSWZFbXB0eSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGxlbiA9IHRoaXMuZ2V0QWN0dWFsTGVuZ3RoKHZhbHVlcy5sZW5ndGgpO1xuICAgIHRoaXMuX2xlbmd0aCA9IGxlbjtcbiAgICB0aGlzLl92YWx1ZXMgPSB0aGlzLnNob3VsZENvcHlWYWx1ZXMoKSA/IG5ldyBBcnJheShsZW4pIDogdGhpcy5fdmFsdWVzO1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciBpc1Jlc29sdmVkID0gdGhpcy5faXNSZXNvbHZlZCgpO1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh2YWx1ZXNbaV0sIHByb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9pZ25vcmVSZWplY3Rpb25zKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX3Byb3h5UHJvbWlzZUFycmF5KHRoaXMsIGkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlRnVsZmlsbGVkKG1heWJlUHJvbWlzZS5fdmFsdWUoKSwgaSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb21pc2VSZWplY3RlZChtYXliZVByb21pc2UuX3JlYXNvbigpLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaXNSZXNvbHZlZCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZChtYXliZVByb21pc2UsIGkpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faXNSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzID09PSBudWxsO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX3ZhbHVlcyA9IG51bGw7XG4gICAgdGhpcy5fcHJvbWlzZS5fZnVsZmlsbCh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9faGFyZFJlamVjdF9fID1cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3JlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBudWxsO1xuICAgIHRoaXMuX3Byb21pc2UuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgZmFsc2UsIHRydWUpO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVByb2dyZXNzZWQgPSBmdW5jdGlvbiAocHJvZ3Jlc3NWYWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLl9wcm9taXNlLl9wcm9ncmVzcyh7XG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgdmFsdWU6IHByb2dyZXNzVmFsdWVcbiAgICB9KTtcbn07XG5cblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgdmFyIHRvdGFsUmVzb2x2ZWQgPSArK3RoaXMuX3RvdGFsUmVzb2x2ZWQ7XG4gICAgaWYgKHRvdGFsUmVzb2x2ZWQgPj0gdGhpcy5fbGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUodGhpcy5fdmFsdWVzKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uLCBpbmRleCkge1xuICAgIHRoaXMuX3RvdGFsUmVzb2x2ZWQrKztcbiAgICB0aGlzLl9yZWplY3QocmVhc29uKTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuc2hvdWxkQ29weVZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuZ2V0QWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHJldHVybiBsZW47XG59O1xuXG5yZXR1cm4gUHJvbWlzZUFycmF5O1xufTtcblxufSx7XCIuL3V0aWwuanNcIjozOH1dLDI1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIG1heWJlV3JhcEFzRXJyb3IgPSB1dGlsLm1heWJlV3JhcEFzRXJyb3I7XG52YXIgZXJyb3JzID0gX2RlcmVxXyhcIi4vZXJyb3JzLmpzXCIpO1xudmFyIFRpbWVvdXRFcnJvciA9IGVycm9ycy5UaW1lb3V0RXJyb3I7XG52YXIgT3BlcmF0aW9uYWxFcnJvciA9IGVycm9ycy5PcGVyYXRpb25hbEVycm9yO1xudmFyIGhhdmVHZXR0ZXJzID0gdXRpbC5oYXZlR2V0dGVycztcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczUuanNcIik7XG5cbmZ1bmN0aW9uIGlzVW50eXBlZEVycm9yKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBFcnJvciAmJlxuICAgICAgICBlczUuZ2V0UHJvdG90eXBlT2Yob2JqKSA9PT0gRXJyb3IucHJvdG90eXBlO1xufVxuXG52YXIgckVycm9yS2V5ID0gL14oPzpuYW1lfG1lc3NhZ2V8c3RhY2t8Y2F1c2UpJC87XG5mdW5jdGlvbiB3cmFwQXNPcGVyYXRpb25hbEVycm9yKG9iaikge1xuICAgIHZhciByZXQ7XG4gICAgaWYgKGlzVW50eXBlZEVycm9yKG9iaikpIHtcbiAgICAgICAgcmV0ID0gbmV3IE9wZXJhdGlvbmFsRXJyb3Iob2JqKTtcbiAgICAgICAgcmV0Lm5hbWUgPSBvYmoubmFtZTtcbiAgICAgICAgcmV0Lm1lc3NhZ2UgPSBvYmoubWVzc2FnZTtcbiAgICAgICAgcmV0LnN0YWNrID0gb2JqLnN0YWNrO1xuICAgICAgICB2YXIga2V5cyA9IGVzNS5rZXlzKG9iaik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICBpZiAoIXJFcnJvcktleS50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHV0aWwubWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gbm9kZWJhY2tGb3JQcm9taXNlKHByb21pc2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyLCB2YWx1ZSkge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHZhciB3cmFwcGVkID0gd3JhcEFzT3BlcmF0aW9uYWxFcnJvcihtYXliZVdyYXBBc0Vycm9yKGVycikpO1xuICAgICAgICAgICAgcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZSh3cmFwcGVkKTtcbiAgICAgICAgICAgIHByb21pc2UuX3JlamVjdCh3cmFwcGVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgdmFyICRfbGVuID0gYXJndW1lbnRzLmxlbmd0aDt2YXIgYXJncyA9IG5ldyBBcnJheSgkX2xlbiAtIDEpOyBmb3IodmFyICRfaSA9IDE7ICRfaSA8ICRfbGVuOyArKyRfaSkge2FyZ3NbJF9pIC0gMV0gPSBhcmd1bWVudHNbJF9pXTt9XG4gICAgICAgICAgICBwcm9taXNlLl9mdWxmaWxsKGFyZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZS5fZnVsZmlsbCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9O1xufVxuXG5cbnZhciBQcm9taXNlUmVzb2x2ZXI7XG5pZiAoIWhhdmVHZXR0ZXJzKSB7XG4gICAgUHJvbWlzZVJlc29sdmVyID0gZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgdGhpcy5wcm9taXNlID0gcHJvbWlzZTtcbiAgICAgICAgdGhpcy5hc0NhbGxiYWNrID0gbm9kZWJhY2tGb3JQcm9taXNlKHByb21pc2UpO1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gdGhpcy5hc0NhbGxiYWNrO1xuICAgIH07XG59XG5lbHNlIHtcbiAgICBQcm9taXNlUmVzb2x2ZXIgPSBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xuICAgIH07XG59XG5pZiAoaGF2ZUdldHRlcnMpIHtcbiAgICB2YXIgcHJvcCA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlYmFja0ZvclByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZXM1LmRlZmluZVByb3BlcnR5KFByb21pc2VSZXNvbHZlci5wcm90b3R5cGUsIFwiYXNDYWxsYmFja1wiLCBwcm9wKTtcbiAgICBlczUuZGVmaW5lUHJvcGVydHkoUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZSwgXCJjYWxsYmFja1wiLCBwcm9wKTtcbn1cblxuUHJvbWlzZVJlc29sdmVyLl9ub2RlYmFja0ZvclByb21pc2UgPSBub2RlYmFja0ZvclByb21pc2U7XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlUmVzb2x2ZXJdXCI7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnJlc29sdmUgPVxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2VSZXNvbHZlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgaW52b2NhdGlvbiwgcmVzb2x2ZXIgcmVzb2x2ZS9yZWplY3QgbXVzdCBiZSBjYWxsZWQgd2l0aGluIGEgcmVzb2x2ZXIgY29udGV4dC4gQ29uc2lkZXIgdXNpbmcgdGhlIHByb21pc2UgY29uc3RydWN0b3IgaW5zdGVhZC5cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9zZGtYTDlcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB0aGlzLnByb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlUmVzb2x2ZXIucHJvdG90eXBlLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZVJlc29sdmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBpbnZvY2F0aW9uLCByZXNvbHZlciByZXNvbHZlL3JlamVjdCBtdXN0IGJlIGNhbGxlZCB3aXRoaW4gYSByZXNvbHZlciBjb250ZXh0LiBDb25zaWRlciB1c2luZyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpbnN0ZWFkLlxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3Nka1hMOVxcdTAwMGFcIik7XG4gICAgfVxuICAgIHRoaXMucHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVhc29uKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZVJlc29sdmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBpbnZvY2F0aW9uLCByZXNvbHZlciByZXNvbHZlL3JlamVjdCBtdXN0IGJlIGNhbGxlZCB3aXRoaW4gYSByZXNvbHZlciBjb250ZXh0LiBDb25zaWRlciB1c2luZyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpbnN0ZWFkLlxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL3Nka1hMOVxcdTAwMGFcIik7XG4gICAgfVxuICAgIHRoaXMucHJvbWlzZS5fcHJvZ3Jlc3ModmFsdWUpO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgdGhpcy5wcm9taXNlLmNhbmNlbChlcnIpO1xufTtcblxuUHJvbWlzZVJlc29sdmVyLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVqZWN0KG5ldyBUaW1lb3V0RXJyb3IoXCJ0aW1lb3V0XCIpKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUuaXNSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9taXNlLmlzUmVzb2x2ZWQoKTtcbn07XG5cblByb21pc2VSZXNvbHZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb21pc2UudG9KU09OKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VSZXNvbHZlcjtcblxufSx7XCIuL2Vycm9ycy5qc1wiOjEzLFwiLi9lczUuanNcIjoxNCxcIi4vdXRpbC5qc1wiOjM4fV0sMjY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMKSB7XG52YXIgVEhJUyA9IHt9O1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIG5vZGViYWNrRm9yUHJvbWlzZSA9IF9kZXJlcV8oXCIuL3Byb21pc2VfcmVzb2x2ZXIuanNcIilcbiAgICAuX25vZGViYWNrRm9yUHJvbWlzZTtcbnZhciB3aXRoQXBwZW5kZWQgPSB1dGlsLndpdGhBcHBlbmRlZDtcbnZhciBtYXliZVdyYXBBc0Vycm9yID0gdXRpbC5tYXliZVdyYXBBc0Vycm9yO1xudmFyIGNhbkV2YWx1YXRlID0gdXRpbC5jYW5FdmFsdWF0ZTtcbnZhciBUeXBlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIikuVHlwZUVycm9yO1xudmFyIGRlZmF1bHRTdWZmaXggPSBcIkFzeW5jXCI7XG52YXIgZGVmYXVsdFByb21pc2lmaWVkID0ge19faXNQcm9taXNpZmllZF9fOiB0cnVlfTtcbnZhciBub0NvcHlQcm9wcyA9IFtcbiAgICBcImFyaXR5XCIsICAgIFwibGVuZ3RoXCIsXG4gICAgXCJuYW1lXCIsXG4gICAgXCJhcmd1bWVudHNcIixcbiAgICBcImNhbGxlclwiLFxuICAgIFwiY2FsbGVlXCIsXG4gICAgXCJwcm90b3R5cGVcIixcbiAgICBcIl9faXNQcm9taXNpZmllZF9fXCJcbl07XG52YXIgbm9Db3B5UHJvcHNQYXR0ZXJuID0gbmV3IFJlZ0V4cChcIl4oPzpcIiArIG5vQ29weVByb3BzLmpvaW4oXCJ8XCIpICsgXCIpJFwiKTtcblxudmFyIGRlZmF1bHRGaWx0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHV0aWwuaXNJZGVudGlmaWVyKG5hbWUpICYmXG4gICAgICAgIG5hbWUuY2hhckF0KDApICE9PSBcIl9cIiAmJlxuICAgICAgICBuYW1lICE9PSBcImNvbnN0cnVjdG9yXCI7XG59O1xuXG5mdW5jdGlvbiBwcm9wc0ZpbHRlcihrZXkpIHtcbiAgICByZXR1cm4gIW5vQ29weVByb3BzUGF0dGVybi50ZXN0KGtleSk7XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzaWZpZWQoZm4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZm4uX19pc1Byb21pc2lmaWVkX18gPT09IHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc1Byb21pc2lmaWVkKG9iaiwga2V5LCBzdWZmaXgpIHtcbiAgICB2YXIgdmFsID0gdXRpbC5nZXREYXRhUHJvcGVydHlPckRlZmF1bHQob2JqLCBrZXkgKyBzdWZmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRQcm9taXNpZmllZCk7XG4gICAgcmV0dXJuIHZhbCA/IGlzUHJvbWlzaWZpZWQodmFsKSA6IGZhbHNlO1xufVxuZnVuY3Rpb24gY2hlY2tWYWxpZChyZXQsIHN1ZmZpeCwgc3VmZml4UmVnZXhwKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgdmFyIGtleSA9IHJldFtpXTtcbiAgICAgICAgaWYgKHN1ZmZpeFJlZ2V4cC50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgIHZhciBrZXlXaXRob3V0QXN5bmNTdWZmaXggPSBrZXkucmVwbGFjZShzdWZmaXhSZWdleHAsIFwiXCIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZXQubGVuZ3RoOyBqICs9IDIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmV0W2pdID09PSBrZXlXaXRob3V0QXN5bmNTdWZmaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBwcm9taXNpZnkgYW4gQVBJIHRoYXQgaGFzIG5vcm1hbCBtZXRob2RzIHdpdGggJyVzJy1zdWZmaXhcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9pV3JaYndcXHUwMDBhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwiJXNcIiwgc3VmZml4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcm9taXNpZmlhYmxlTWV0aG9kcyhvYmosIHN1ZmZpeCwgc3VmZml4UmVnZXhwLCBmaWx0ZXIpIHtcbiAgICB2YXIga2V5cyA9IHV0aWwuaW5oZXJpdGVkRGF0YUtleXMob2JqKTtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgdmFyIHBhc3Nlc0RlZmF1bHRGaWx0ZXIgPSBmaWx0ZXIgPT09IGRlZmF1bHRGaWx0ZXJcbiAgICAgICAgICAgID8gdHJ1ZSA6IGRlZmF1bHRGaWx0ZXIoa2V5LCB2YWx1ZSwgb2JqKTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhaXNQcm9taXNpZmllZCh2YWx1ZSkgJiZcbiAgICAgICAgICAgICFoYXNQcm9taXNpZmllZChvYmosIGtleSwgc3VmZml4KSAmJlxuICAgICAgICAgICAgZmlsdGVyKGtleSwgdmFsdWUsIG9iaiwgcGFzc2VzRGVmYXVsdEZpbHRlcikpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoZWNrVmFsaWQocmV0LCBzdWZmaXgsIHN1ZmZpeFJlZ2V4cCk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxudmFyIGVzY2FwZUlkZW50UmVnZXggPSBmdW5jdGlvbihzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbJF0pLywgXCJcXFxcJFwiKTtcbn07XG5cbnZhciBtYWtlTm9kZVByb21pc2lmaWVkRXZhbDtcbmlmICghdHJ1ZSkge1xudmFyIHN3aXRjaENhc2VBcmd1bWVudE9yZGVyID0gZnVuY3Rpb24obGlrZWx5QXJndW1lbnRDb3VudCkge1xuICAgIHZhciByZXQgPSBbbGlrZWx5QXJndW1lbnRDb3VudF07XG4gICAgdmFyIG1pbiA9IE1hdGgubWF4KDAsIGxpa2VseUFyZ3VtZW50Q291bnQgLSAxIC0gMyk7XG4gICAgZm9yKHZhciBpID0gbGlrZWx5QXJndW1lbnRDb3VudCAtIDE7IGkgPj0gbWluOyAtLWkpIHtcbiAgICAgICAgcmV0LnB1c2goaSk7XG4gICAgfVxuICAgIGZvcih2YXIgaSA9IGxpa2VseUFyZ3VtZW50Q291bnQgKyAxOyBpIDw9IDM7ICsraSkge1xuICAgICAgICByZXQucHVzaChpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbnZhciBhcmd1bWVudFNlcXVlbmNlID0gZnVuY3Rpb24oYXJndW1lbnRDb3VudCkge1xuICAgIHJldHVybiB1dGlsLmZpbGxlZFJhbmdlKGFyZ3VtZW50Q291bnQsIFwiX2FyZ1wiLCBcIlwiKTtcbn07XG5cbnZhciBwYXJhbWV0ZXJEZWNsYXJhdGlvbiA9IGZ1bmN0aW9uKHBhcmFtZXRlckNvdW50KSB7XG4gICAgcmV0dXJuIHV0aWwuZmlsbGVkUmFuZ2UoXG4gICAgICAgIE1hdGgubWF4KHBhcmFtZXRlckNvdW50LCAzKSwgXCJfYXJnXCIsIFwiXCIpO1xufTtcblxudmFyIHBhcmFtZXRlckNvdW50ID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoTWF0aC5taW4oZm4ubGVuZ3RoLCAxMDIzICsgMSksIDApO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn07XG5cbm1ha2VOb2RlUHJvbWlzaWZpZWRFdmFsID1cbmZ1bmN0aW9uKGNhbGxiYWNrLCByZWNlaXZlciwgb3JpZ2luYWxOYW1lLCBmbikge1xuICAgIHZhciBuZXdQYXJhbWV0ZXJDb3VudCA9IE1hdGgubWF4KDAsIHBhcmFtZXRlckNvdW50KGZuKSAtIDEpO1xuICAgIHZhciBhcmd1bWVudE9yZGVyID0gc3dpdGNoQ2FzZUFyZ3VtZW50T3JkZXIobmV3UGFyYW1ldGVyQ291bnQpO1xuICAgIHZhciBzaG91bGRQcm94eVRoaXMgPSB0eXBlb2YgY2FsbGJhY2sgPT09IFwic3RyaW5nXCIgfHwgcmVjZWl2ZXIgPT09IFRISVM7XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUNhbGxGb3JBcmd1bWVudENvdW50KGNvdW50KSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRTZXF1ZW5jZShjb3VudCkuam9pbihcIiwgXCIpO1xuICAgICAgICB2YXIgY29tbWEgPSBjb3VudCA+IDAgPyBcIiwgXCIgOiBcIlwiO1xuICAgICAgICB2YXIgcmV0O1xuICAgICAgICBpZiAoc2hvdWxkUHJveHlUaGlzKSB7XG4gICAgICAgICAgICByZXQgPSBcInJldCA9IGNhbGxiYWNrLmNhbGwodGhpcywge3thcmdzfX0sIG5vZGViYWNrKTsgYnJlYWs7XFxuXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZWNlaXZlciA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgPyBcInJldCA9IGNhbGxiYWNrKHt7YXJnc319LCBub2RlYmFjayk7IGJyZWFrO1xcblwiXG4gICAgICAgICAgICAgICAgOiBcInJldCA9IGNhbGxiYWNrLmNhbGwocmVjZWl2ZXIsIHt7YXJnc319LCBub2RlYmFjayk7IGJyZWFrO1xcblwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQucmVwbGFjZShcInt7YXJnc319XCIsIGFyZ3MpLnJlcGxhY2UoXCIsIFwiLCBjb21tYSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVBcmd1bWVudFN3aXRjaENhc2UoKSB7XG4gICAgICAgIHZhciByZXQgPSBcIlwiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50T3JkZXIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJldCArPSBcImNhc2UgXCIgKyBhcmd1bWVudE9yZGVyW2ldICtcIjpcIiArXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVDYWxsRm9yQXJndW1lbnRDb3VudChhcmd1bWVudE9yZGVyW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldCArPSBcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkobGVuICsgMSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGkgPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgYXJnc1tpXSA9IG5vZGViYWNrOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgW0NvZGVGb3JDYWxsXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgYnJlYWs7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIi5yZXBsYWNlKFwiW0NvZGVGb3JDYWxsXVwiLCAoc2hvdWxkUHJveHlUaGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJyZXQgPSBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcXG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwicmV0ID0gY2FsbGJhY2suYXBwbHkocmVjZWl2ZXIsIGFyZ3MpO1xcblwiKSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgdmFyIGdldEZ1bmN0aW9uQ29kZSA9IHR5cGVvZiBjYWxsYmFjayA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IChcInRoaXMgIT0gbnVsbCA/IHRoaXNbJ1wiK2NhbGxiYWNrK1wiJ10gOiBmblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwiZm5cIjtcblxuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJQcm9taXNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlY2VpdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpdGhBcHBlbmRlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJtYXliZVdyYXBBc0Vycm9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm5vZGViYWNrRm9yUHJvbWlzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0cnlDYXRjaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJlcnJvck9ialwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJub3RFbnVtZXJhYmxlUHJvcFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJJTlRFUk5BTFwiLFwiJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICB2YXIgcmV0ID0gZnVuY3Rpb24gKFBhcmFtZXRlcnMpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIG5vZGViYWNrID0gbm9kZWJhY2tGb3JQcm9taXNlKHByb21pc2UpOyAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIHJldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gdHJ5Q2F0Y2goW0dldEZ1bmN0aW9uQ29kZV0pOyAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgc3dpdGNoKGxlbikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIFtDb2RlRm9yU3dpdGNoQ2FzZV0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKG1heWJlV3JhcEFzRXJyb3IocmV0LmUpLCB0cnVlLCB0cnVlKTtcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICB9OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcChyZXQsICdfX2lzUHJvbWlzaWZpZWRfXycsIHRydWUpOyAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICByZXR1cm4gcmV0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIlxuICAgICAgICAucmVwbGFjZShcIlBhcmFtZXRlcnNcIiwgcGFyYW1ldGVyRGVjbGFyYXRpb24obmV3UGFyYW1ldGVyQ291bnQpKVxuICAgICAgICAucmVwbGFjZShcIltDb2RlRm9yU3dpdGNoQ2FzZV1cIiwgZ2VuZXJhdGVBcmd1bWVudFN3aXRjaENhc2UoKSlcbiAgICAgICAgLnJlcGxhY2UoXCJbR2V0RnVuY3Rpb25Db2RlXVwiLCBnZXRGdW5jdGlvbkNvZGUpKShcbiAgICAgICAgICAgIFByb21pc2UsXG4gICAgICAgICAgICBmbixcbiAgICAgICAgICAgIHJlY2VpdmVyLFxuICAgICAgICAgICAgd2l0aEFwcGVuZGVkLFxuICAgICAgICAgICAgbWF5YmVXcmFwQXNFcnJvcixcbiAgICAgICAgICAgIG5vZGViYWNrRm9yUHJvbWlzZSxcbiAgICAgICAgICAgIHV0aWwudHJ5Q2F0Y2gsXG4gICAgICAgICAgICB1dGlsLmVycm9yT2JqLFxuICAgICAgICAgICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcCxcbiAgICAgICAgICAgIElOVEVSTkFMXG4gICAgICAgICk7XG59O1xufVxuXG5mdW5jdGlvbiBtYWtlTm9kZVByb21pc2lmaWVkQ2xvc3VyZShjYWxsYmFjaywgcmVjZWl2ZXIsIF8sIGZuKSB7XG4gICAgdmFyIGRlZmF1bHRUaGlzID0gKGZ1bmN0aW9uKCkge3JldHVybiB0aGlzO30pKCk7XG4gICAgdmFyIG1ldGhvZCA9IGNhbGxiYWNrO1xuICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGNhbGxiYWNrID0gZm47XG4gICAgfVxuICAgIGZ1bmN0aW9uIHByb21pc2lmaWVkKCkge1xuICAgICAgICB2YXIgX3JlY2VpdmVyID0gcmVjZWl2ZXI7XG4gICAgICAgIGlmIChyZWNlaXZlciA9PT0gVEhJUykgX3JlY2VpdmVyID0gdGhpcztcbiAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgICAgIHZhciBjYiA9IHR5cGVvZiBtZXRob2QgPT09IFwic3RyaW5nXCIgJiYgdGhpcyAhPT0gZGVmYXVsdFRoaXNcbiAgICAgICAgICAgID8gdGhpc1ttZXRob2RdIDogY2FsbGJhY2s7XG4gICAgICAgIHZhciBmbiA9IG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNiLmFwcGx5KF9yZWNlaXZlciwgd2l0aEFwcGVuZGVkKGFyZ3VtZW50cywgZm4pKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhtYXliZVdyYXBBc0Vycm9yKGUpLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChwcm9taXNpZmllZCwgXCJfX2lzUHJvbWlzaWZpZWRfX1wiLCB0cnVlKTtcbiAgICByZXR1cm4gcHJvbWlzaWZpZWQ7XG59XG5cbnZhciBtYWtlTm9kZVByb21pc2lmaWVkID0gY2FuRXZhbHVhdGVcbiAgICA/IG1ha2VOb2RlUHJvbWlzaWZpZWRFdmFsXG4gICAgOiBtYWtlTm9kZVByb21pc2lmaWVkQ2xvc3VyZTtcblxuZnVuY3Rpb24gcHJvbWlzaWZ5QWxsKG9iaiwgc3VmZml4LCBmaWx0ZXIsIHByb21pc2lmaWVyKSB7XG4gICAgdmFyIHN1ZmZpeFJlZ2V4cCA9IG5ldyBSZWdFeHAoZXNjYXBlSWRlbnRSZWdleChzdWZmaXgpICsgXCIkXCIpO1xuICAgIHZhciBtZXRob2RzID1cbiAgICAgICAgcHJvbWlzaWZpYWJsZU1ldGhvZHMob2JqLCBzdWZmaXgsIHN1ZmZpeFJlZ2V4cCwgZmlsdGVyKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBtZXRob2RzLmxlbmd0aDsgaSA8IGxlbjsgaSs9IDIpIHtcbiAgICAgICAgdmFyIGtleSA9IG1ldGhvZHNbaV07XG4gICAgICAgIHZhciBmbiA9IG1ldGhvZHNbaSsxXTtcbiAgICAgICAgdmFyIHByb21pc2lmaWVkS2V5ID0ga2V5ICsgc3VmZml4O1xuICAgICAgICBvYmpbcHJvbWlzaWZpZWRLZXldID0gcHJvbWlzaWZpZXIgPT09IG1ha2VOb2RlUHJvbWlzaWZpZWRcbiAgICAgICAgICAgICAgICA/IG1ha2VOb2RlUHJvbWlzaWZpZWQoa2V5LCBUSElTLCBrZXksIGZuLCBzdWZmaXgpXG4gICAgICAgICAgICAgICAgOiBwcm9taXNpZmllcihmbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWtlTm9kZVByb21pc2lmaWVkKGtleSwgVEhJUywga2V5LCBmbiwgc3VmZml4KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgdXRpbC50b0Zhc3RQcm9wZXJ0aWVzKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gcHJvbWlzaWZ5KGNhbGxiYWNrLCByZWNlaXZlcikge1xuICAgIHJldHVybiBtYWtlTm9kZVByb21pc2lmaWVkKGNhbGxiYWNrLCByZWNlaXZlciwgdW5kZWZpbmVkLCBjYWxsYmFjayk7XG59XG5cblByb21pc2UucHJvbWlzaWZ5ID0gZnVuY3Rpb24gKGZuLCByZWNlaXZlcikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgaWYgKGlzUHJvbWlzaWZpZWQoZm4pKSB7XG4gICAgICAgIHJldHVybiBmbjtcbiAgICB9XG4gICAgdmFyIHJldCA9IHByb21pc2lmeShmbiwgYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBUSElTIDogcmVjZWl2ZXIpO1xuICAgIHV0aWwuY29weURlc2NyaXB0b3JzKGZuLCByZXQsIHByb3BzRmlsdGVyKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm9taXNpZnlBbGwgPSBmdW5jdGlvbiAodGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0aGUgdGFyZ2V0IG9mIHByb21pc2lmeUFsbCBtdXN0IGJlIGFuIG9iamVjdCBvciBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOUlUbFYwXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IE9iamVjdChvcHRpb25zKTtcbiAgICB2YXIgc3VmZml4ID0gb3B0aW9ucy5zdWZmaXg7XG4gICAgaWYgKHR5cGVvZiBzdWZmaXggIT09IFwic3RyaW5nXCIpIHN1ZmZpeCA9IGRlZmF1bHRTdWZmaXg7XG4gICAgdmFyIGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgIGlmICh0eXBlb2YgZmlsdGVyICE9PSBcImZ1bmN0aW9uXCIpIGZpbHRlciA9IGRlZmF1bHRGaWx0ZXI7XG4gICAgdmFyIHByb21pc2lmaWVyID0gb3B0aW9ucy5wcm9taXNpZmllcjtcbiAgICBpZiAodHlwZW9mIHByb21pc2lmaWVyICE9PSBcImZ1bmN0aW9uXCIpIHByb21pc2lmaWVyID0gbWFrZU5vZGVQcm9taXNpZmllZDtcblxuICAgIGlmICghdXRpbC5pc0lkZW50aWZpZXIoc3VmZml4KSkge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcInN1ZmZpeCBtdXN0IGJlIGEgdmFsaWQgaWRlbnRpZmllclxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzhGWm81VlxcdTAwMGFcIik7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSB1dGlsLmluaGVyaXRlZERhdGFLZXlzKHRhcmdldCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldFtrZXlzW2ldXTtcbiAgICAgICAgaWYgKGtleXNbaV0gIT09IFwiY29uc3RydWN0b3JcIiAmJlxuICAgICAgICAgICAgdXRpbC5pc0NsYXNzKHZhbHVlKSkge1xuICAgICAgICAgICAgcHJvbWlzaWZ5QWxsKHZhbHVlLnByb3RvdHlwZSwgc3VmZml4LCBmaWx0ZXIsIHByb21pc2lmaWVyKTtcbiAgICAgICAgICAgIHByb21pc2lmeUFsbCh2YWx1ZSwgc3VmZml4LCBmaWx0ZXIsIHByb21pc2lmaWVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNpZnlBbGwodGFyZ2V0LCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIpO1xufTtcbn07XG5cblxufSx7XCIuL2Vycm9yc1wiOjEzLFwiLi9wcm9taXNlX3Jlc29sdmVyLmpzXCI6MjUsXCIuL3V0aWwuanNcIjozOH1dLDI3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihcbiAgICBQcm9taXNlLCBQcm9taXNlQXJyYXksIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIGlzT2JqZWN0ID0gdXRpbC5pc09iamVjdDtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczUuanNcIik7XG5cbmZ1bmN0aW9uIFByb3BlcnRpZXNQcm9taXNlQXJyYXkob2JqKSB7XG4gICAgdmFyIGtleXMgPSBlczUua2V5cyhvYmopO1xuICAgIHZhciBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbiAqIDIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXldO1xuICAgICAgICB2YWx1ZXNbaSArIGxlbl0gPSBrZXk7XG4gICAgfVxuICAgIHRoaXMuY29uc3RydWN0b3IkKHZhbHVlcyk7XG59XG51dGlsLmluaGVyaXRzKFByb3BlcnRpZXNQcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2luaXQkKHVuZGVmaW5lZCwgLTMpIDtcbn07XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICB2YXIgdG90YWxSZXNvbHZlZCA9ICsrdGhpcy5fdG90YWxSZXNvbHZlZDtcbiAgICBpZiAodG90YWxSZXNvbHZlZCA+PSB0aGlzLl9sZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbCA9IHt9O1xuICAgICAgICB2YXIga2V5T2Zmc2V0ID0gdGhpcy5sZW5ndGgoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoKCk7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgdmFsW3RoaXMuX3ZhbHVlc1tpICsga2V5T2Zmc2V0XV0gPSB0aGlzLl92YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVzb2x2ZSh2YWwpO1xuICAgIH1cbn07XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUHJvZ3Jlc3NlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLl9wcm9taXNlLl9wcm9ncmVzcyh7XG4gICAgICAgIGtleTogdGhpcy5fdmFsdWVzW2luZGV4ICsgdGhpcy5sZW5ndGgoKV0sXG4gICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgIH0pO1xufTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuc2hvdWxkQ29weVZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5nZXRBY3R1YWxMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XG4gICAgcmV0dXJuIGxlbiA+PiAxO1xufTtcblxuZnVuY3Rpb24gcHJvcHMocHJvbWlzZXMpIHtcbiAgICB2YXIgcmV0O1xuICAgIHZhciBjYXN0VmFsdWUgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHByb21pc2VzKTtcblxuICAgIGlmICghaXNPYmplY3QoY2FzdFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiY2Fubm90IGF3YWl0IHByb3BlcnRpZXMgb2YgYSBub24tb2JqZWN0XFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvT3NGS0M4XFx1MDAwYVwiKTtcbiAgICB9IGVsc2UgaWYgKGNhc3RWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0ID0gY2FzdFZhbHVlLl90aGVuKFxuICAgICAgICAgICAgUHJvbWlzZS5wcm9wcywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXQgPSBuZXcgUHJvcGVydGllc1Byb21pc2VBcnJheShjYXN0VmFsdWUpLnByb21pc2UoKTtcbiAgICB9XG5cbiAgICBpZiAoY2FzdFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXQuX3Byb3BhZ2F0ZUZyb20oY2FzdFZhbHVlLCA0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvcHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHByb3BzKHRoaXMpO1xufTtcblxuUHJvbWlzZS5wcm9wcyA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBwcm9wcyhwcm9taXNlcyk7XG59O1xufTtcblxufSx7XCIuL2VzNS5qc1wiOjE0LFwiLi91dGlsLmpzXCI6Mzh9XSwyODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIGFycmF5TW92ZShzcmMsIHNyY0luZGV4LCBkc3QsIGRzdEluZGV4LCBsZW4pIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgIGRzdFtqICsgZHN0SW5kZXhdID0gc3JjW2ogKyBzcmNJbmRleF07XG4gICAgICAgIHNyY1tqICsgc3JjSW5kZXhdID0gdm9pZCAwO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gUXVldWUoY2FwYWNpdHkpIHtcbiAgICB0aGlzLl9jYXBhY2l0eSA9IGNhcGFjaXR5O1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fZnJvbnQgPSAwO1xufVxuXG5RdWV1ZS5wcm90b3R5cGUuX3dpbGxCZU92ZXJDYXBhY2l0eSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhcGFjaXR5IDwgc2l6ZTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fcHVzaE9uZSA9IGZ1bmN0aW9uIChhcmcpIHtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICB0aGlzLl9jaGVja0NhcGFjaXR5KGxlbmd0aCArIDEpO1xuICAgIHZhciBpID0gKHRoaXMuX2Zyb250ICsgbGVuZ3RoKSAmICh0aGlzLl9jYXBhY2l0eSAtIDEpO1xuICAgIHRoaXNbaV0gPSBhcmc7XG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuZ3RoICsgMTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fdW5zaGlmdE9uZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGNhcGFjaXR5ID0gdGhpcy5fY2FwYWNpdHk7XG4gICAgdGhpcy5fY2hlY2tDYXBhY2l0eSh0aGlzLmxlbmd0aCgpICsgMSk7XG4gICAgdmFyIGZyb250ID0gdGhpcy5fZnJvbnQ7XG4gICAgdmFyIGkgPSAoKCgoIGZyb250IC0gMSApICZcbiAgICAgICAgICAgICAgICAgICAgKCBjYXBhY2l0eSAtIDEpICkgXiBjYXBhY2l0eSApIC0gY2FwYWNpdHkgKTtcbiAgICB0aGlzW2ldID0gdmFsdWU7XG4gICAgdGhpcy5fZnJvbnQgPSBpO1xuICAgIHRoaXMuX2xlbmd0aCA9IHRoaXMubGVuZ3RoKCkgKyAxO1xufTtcblxuUXVldWUucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbihmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHRoaXMuX3Vuc2hpZnRPbmUoYXJnKTtcbiAgICB0aGlzLl91bnNoaWZ0T25lKHJlY2VpdmVyKTtcbiAgICB0aGlzLl91bnNoaWZ0T25lKGZuKTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCkgKyAzO1xuICAgIGlmICh0aGlzLl93aWxsQmVPdmVyQ2FwYWNpdHkobGVuZ3RoKSkge1xuICAgICAgICB0aGlzLl9wdXNoT25lKGZuKTtcbiAgICAgICAgdGhpcy5fcHVzaE9uZShyZWNlaXZlcik7XG4gICAgICAgIHRoaXMuX3B1c2hPbmUoYXJnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaiA9IHRoaXMuX2Zyb250ICsgbGVuZ3RoIC0gMztcbiAgICB0aGlzLl9jaGVja0NhcGFjaXR5KGxlbmd0aCk7XG4gICAgdmFyIHdyYXBNYXNrID0gdGhpcy5fY2FwYWNpdHkgLSAxO1xuICAgIHRoaXNbKGogKyAwKSAmIHdyYXBNYXNrXSA9IGZuO1xuICAgIHRoaXNbKGogKyAxKSAmIHdyYXBNYXNrXSA9IHJlY2VpdmVyO1xuICAgIHRoaXNbKGogKyAyKSAmIHdyYXBNYXNrXSA9IGFyZztcbiAgICB0aGlzLl9sZW5ndGggPSBsZW5ndGg7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZyb250ID0gdGhpcy5fZnJvbnQsXG4gICAgICAgIHJldCA9IHRoaXNbZnJvbnRdO1xuXG4gICAgdGhpc1tmcm9udF0gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fZnJvbnQgPSAoZnJvbnQgKyAxKSAmICh0aGlzLl9jYXBhY2l0eSAtIDEpO1xuICAgIHRoaXMuX2xlbmd0aC0tO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX2NoZWNrQ2FwYWNpdHkgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICAgIGlmICh0aGlzLl9jYXBhY2l0eSA8IHNpemUpIHtcbiAgICAgICAgdGhpcy5fcmVzaXplVG8odGhpcy5fY2FwYWNpdHkgPDwgMSk7XG4gICAgfVxufTtcblxuUXVldWUucHJvdG90eXBlLl9yZXNpemVUbyA9IGZ1bmN0aW9uIChjYXBhY2l0eSkge1xuICAgIHZhciBvbGRDYXBhY2l0eSA9IHRoaXMuX2NhcGFjaXR5O1xuICAgIHRoaXMuX2NhcGFjaXR5ID0gY2FwYWNpdHk7XG4gICAgdmFyIGZyb250ID0gdGhpcy5fZnJvbnQ7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuX2xlbmd0aDtcbiAgICB2YXIgbW92ZUl0ZW1zQ291bnQgPSAoZnJvbnQgKyBsZW5ndGgpICYgKG9sZENhcGFjaXR5IC0gMSk7XG4gICAgYXJyYXlNb3ZlKHRoaXMsIDAsIHRoaXMsIG9sZENhcGFjaXR5LCBtb3ZlSXRlbXNDb3VudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXVlO1xuXG59LHt9XSwyOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXG4gICAgUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbikge1xudmFyIGlzQXJyYXkgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpLmlzQXJyYXk7XG5cbnZhciByYWNlTGF0ZXIgPSBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgIHJldHVybiBwcm9taXNlLnRoZW4oZnVuY3Rpb24oYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIHJhY2UoYXJyYXksIHByb21pc2UpO1xuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gcmFjZShwcm9taXNlcywgcGFyZW50KSB7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UocHJvbWlzZXMpO1xuXG4gICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHJhY2VMYXRlcihtYXliZVByb21pc2UpO1xuICAgIH0gZWxzZSBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJleHBlY3RpbmcgYW4gYXJyYXksIGEgcHJvbWlzZSBvciBhIHRoZW5hYmxlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvczhNTWhjXFx1MDAwYVwiKTtcbiAgICB9XG5cbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXQuX3Byb3BhZ2F0ZUZyb20ocGFyZW50LCA0IHwgMSk7XG4gICAgfVxuICAgIHZhciBmdWxmaWxsID0gcmV0Ll9mdWxmaWxsO1xuICAgIHZhciByZWplY3QgPSByZXQuX3JlamVjdDtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcHJvbWlzZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIHZhbCA9IHByb21pc2VzW2ldO1xuXG4gICAgICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCAmJiAhKGkgaW4gcHJvbWlzZXMpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIFByb21pc2UuY2FzdCh2YWwpLl90aGVuKGZ1bGZpbGwsIHJlamVjdCwgdW5kZWZpbmVkLCByZXQsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gcmFjZShwcm9taXNlcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJhY2UodGhpcywgdW5kZWZpbmVkKTtcbn07XG5cbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwzMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZUFycmF5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhcGlSZWplY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOVEVSTkFMKSB7XG52YXIgZ2V0RG9tYWluID0gUHJvbWlzZS5fZ2V0RG9tYWluO1xudmFyIGFzeW5jID0gX2RlcmVxXyhcIi4vYXN5bmMuanNcIik7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbmZ1bmN0aW9uIFJlZHVjdGlvblByb21pc2VBcnJheShwcm9taXNlcywgZm4sIGFjY3VtLCBfZWFjaCkge1xuICAgIHRoaXMuY29uc3RydWN0b3IkKHByb21pc2VzKTtcbiAgICB0aGlzLl9wcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHRoaXMuX3ByZXNlcnZlZFZhbHVlcyA9IF9lYWNoID09PSBJTlRFUk5BTCA/IFtdIDogbnVsbDtcbiAgICB0aGlzLl96ZXJvdGhJc0FjY3VtID0gKGFjY3VtID09PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2dvdEFjY3VtID0gZmFsc2U7XG4gICAgdGhpcy5fcmVkdWNpbmdJbmRleCA9ICh0aGlzLl96ZXJvdGhJc0FjY3VtID8gMSA6IDApO1xuICAgIHRoaXMuX3ZhbHVlc1BoYXNlID0gdW5kZWZpbmVkO1xuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKGFjY3VtLCB0aGlzLl9wcm9taXNlKTtcbiAgICB2YXIgcmVqZWN0ZWQgPSBmYWxzZTtcbiAgICB2YXIgaXNQcm9taXNlID0gbWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZTtcbiAgICBpZiAoaXNQcm9taXNlKSB7XG4gICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UuX2lzUGVuZGluZygpKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UuX3Byb3h5UHJvbWlzZUFycmF5KHRoaXMsIC0xKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXliZVByb21pc2UuX2lzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgIGFjY3VtID0gbWF5YmVQcm9taXNlLl92YWx1ZSgpO1xuICAgICAgICAgICAgdGhpcy5fZ290QWNjdW0gPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVqZWN0KG1heWJlUHJvbWlzZS5fcmVhc29uKCkpO1xuICAgICAgICAgICAgcmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghKGlzUHJvbWlzZSB8fCB0aGlzLl96ZXJvdGhJc0FjY3VtKSkgdGhpcy5fZ290QWNjdW0gPSB0cnVlO1xuICAgIHZhciBkb21haW4gPSBnZXREb21haW4oKTtcbiAgICB0aGlzLl9jYWxsYmFjayA9IGRvbWFpbiA9PT0gbnVsbCA/IGZuIDogZG9tYWluLmJpbmQoZm4pO1xuICAgIHRoaXMuX2FjY3VtID0gYWNjdW07XG4gICAgaWYgKCFyZWplY3RlZCkgYXN5bmMuaW52b2tlKGluaXQsIHRoaXMsIHVuZGVmaW5lZCk7XG59XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuX2luaXQkKHVuZGVmaW5lZCwgLTUpO1xufVxudXRpbC5pbmhlcml0cyhSZWR1Y3Rpb25Qcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVzb2x2ZUVtcHR5QXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2dvdEFjY3VtIHx8IHRoaXMuX3plcm90aElzQWNjdW0pIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl9wcmVzZXJ2ZWRWYWx1ZXMgIT09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgID8gW10gOiB0aGlzLl9hY2N1bSk7XG4gICAgfVxufTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICB2YXIgcHJlc2VydmVkVmFsdWVzID0gdGhpcy5fcHJlc2VydmVkVmFsdWVzO1xuICAgIHZhciBpc0VhY2ggPSBwcmVzZXJ2ZWRWYWx1ZXMgIT09IG51bGw7XG4gICAgdmFyIGdvdEFjY3VtID0gdGhpcy5fZ290QWNjdW07XG4gICAgdmFyIHZhbHVlc1BoYXNlID0gdGhpcy5fdmFsdWVzUGhhc2U7XG4gICAgdmFyIHZhbHVlc1BoYXNlSW5kZXg7XG4gICAgaWYgKCF2YWx1ZXNQaGFzZSkge1xuICAgICAgICB2YWx1ZXNQaGFzZSA9IHRoaXMuX3ZhbHVlc1BoYXNlID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvciAodmFsdWVzUGhhc2VJbmRleD0wOyB2YWx1ZXNQaGFzZUluZGV4PGxlbmd0aDsgKyt2YWx1ZXNQaGFzZUluZGV4KSB7XG4gICAgICAgICAgICB2YWx1ZXNQaGFzZVt2YWx1ZXNQaGFzZUluZGV4XSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFsdWVzUGhhc2VJbmRleCA9IHZhbHVlc1BoYXNlW2luZGV4XTtcblxuICAgIGlmIChpbmRleCA9PT0gMCAmJiB0aGlzLl96ZXJvdGhJc0FjY3VtKSB7XG4gICAgICAgIHRoaXMuX2FjY3VtID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2dvdEFjY3VtID0gZ290QWNjdW0gPSB0cnVlO1xuICAgICAgICB2YWx1ZXNQaGFzZVtpbmRleF0gPSAoKHZhbHVlc1BoYXNlSW5kZXggPT09IDApXG4gICAgICAgICAgICA/IDEgOiAyKTtcbiAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB0aGlzLl9hY2N1bSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9nb3RBY2N1bSA9IGdvdEFjY3VtID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodmFsdWVzUGhhc2VJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgdmFsdWVzUGhhc2VbaW5kZXhdID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlc1BoYXNlW2luZGV4XSA9IDI7XG4gICAgICAgICAgICB0aGlzLl9hY2N1bSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghZ290QWNjdW0pIHJldHVybjtcblxuICAgIHZhciBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrO1xuICAgIHZhciByZWNlaXZlciA9IHRoaXMuX3Byb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICB2YXIgcmV0O1xuXG4gICAgZm9yICh2YXIgaSA9IHRoaXMuX3JlZHVjaW5nSW5kZXg7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICB2YWx1ZXNQaGFzZUluZGV4ID0gdmFsdWVzUGhhc2VbaV07XG4gICAgICAgIGlmICh2YWx1ZXNQaGFzZUluZGV4ID09PSAyKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWR1Y2luZ0luZGV4ID0gaSArIDE7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVzUGhhc2VJbmRleCAhPT0gMSkgcmV0dXJuO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgaWYgKGlzRWFjaCkge1xuICAgICAgICAgICAgcHJlc2VydmVkVmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgcmV0ID0gdHJ5Q2F0Y2goY2FsbGJhY2spLmNhbGwocmVjZWl2ZXIsIHZhbHVlLCBpLCBsZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gdHJ5Q2F0Y2goY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgLmNhbGwocmVjZWl2ZXIsIHRoaXMuX2FjY3VtLCB2YWx1ZSwgaSwgbGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcm9taXNlLl9wb3BDb250ZXh0KCk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHJldHVybiB0aGlzLl9yZWplY3QocmV0LmUpO1xuXG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHJldCwgdGhpcy5fcHJvbWlzZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UgPSBtYXliZVByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZS5faXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNQaGFzZVtpXSA9IDQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlUHJvbWlzZS5fcHJveHlQcm9taXNlQXJyYXkodGhpcywgaSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5faXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldCA9IG1heWJlUHJvbWlzZS5fdmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdChtYXliZVByb21pc2UuX3JlYXNvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlZHVjaW5nSW5kZXggPSBpICsgMTtcbiAgICAgICAgdGhpcy5fYWNjdW0gPSByZXQ7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVzb2x2ZShpc0VhY2ggPyBwcmVzZXJ2ZWRWYWx1ZXMgOiB0aGlzLl9hY2N1bSk7XG59O1xuXG5mdW5jdGlvbiByZWR1Y2UocHJvbWlzZXMsIGZuLCBpbml0aWFsVmFsdWUsIF9lYWNoKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICB2YXIgYXJyYXkgPSBuZXcgUmVkdWN0aW9uUHJvbWlzZUFycmF5KHByb21pc2VzLCBmbiwgaW5pdGlhbFZhbHVlLCBfZWFjaCk7XG4gICAgcmV0dXJuIGFycmF5LnByb21pc2UoKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGZuLCBpbml0aWFsVmFsdWUpIHtcbiAgICByZXR1cm4gcmVkdWNlKHRoaXMsIGZuLCBpbml0aWFsVmFsdWUsIG51bGwpO1xufTtcblxuUHJvbWlzZS5yZWR1Y2UgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGZuLCBpbml0aWFsVmFsdWUsIF9lYWNoKSB7XG4gICAgcmV0dXJuIHJlZHVjZShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpO1xufTtcbn07XG5cbn0se1wiLi9hc3luYy5qc1wiOjIsXCIuL3V0aWwuanNcIjozOH1dLDMxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIHNjaGVkdWxlO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIG5vQXN5bmNTY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhc3luYyBzY2hlZHVsZXIgYXZhaWxhYmxlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvbTNPVFhrXFx1MDAwYVwiKTtcbn07XG5pZiAodXRpbC5pc05vZGUgJiYgdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB2YXIgR2xvYmFsU2V0SW1tZWRpYXRlID0gZ2xvYmFsLnNldEltbWVkaWF0ZTtcbiAgICB2YXIgUHJvY2Vzc05leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICBzY2hlZHVsZSA9IHV0aWwuaXNSZWNlbnROb2RlXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbihmbikgeyBHbG9iYWxTZXRJbW1lZGlhdGUuY2FsbChnbG9iYWwsIGZuKTsgfVxuICAgICAgICAgICAgICAgIDogZnVuY3Rpb24oZm4pIHsgUHJvY2Vzc05leHRUaWNrLmNhbGwocHJvY2VzcywgZm4pOyB9O1xufSBlbHNlIGlmICgodHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09IFwidW5kZWZpbmVkXCIpICYmXG4gICAgICAgICAgISh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yICYmXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yLnN0YW5kYWxvbmUpKSB7XG4gICAgc2NoZWR1bGUgPSBmdW5jdGlvbihmbikge1xuICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZm4pO1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGRpdiwge2F0dHJpYnV0ZXM6IHRydWV9KTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyBkaXYuY2xhc3NMaXN0LnRvZ2dsZShcImZvb1wiKTsgfTtcbiAgICB9O1xuICAgIHNjaGVkdWxlLmlzU3RhdGljID0gdHJ1ZTtcbn0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHNjaGVkdWxlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHNldEltbWVkaWF0ZShmbik7XG4gICAgfTtcbn0gZWxzZSBpZiAodHlwZW9mIHNldFRpbWVvdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSBlbHNlIHtcbiAgICBzY2hlZHVsZSA9IG5vQXN5bmNTY2hlZHVsZXI7XG59XG5tb2R1bGUuZXhwb3J0cyA9IHNjaGVkdWxlO1xuXG59LHtcIi4vdXRpbFwiOjM4fV0sMzI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgZnVuY3Rpb24oUHJvbWlzZSwgUHJvbWlzZUFycmF5KSB7XG52YXIgUHJvbWlzZUluc3BlY3Rpb24gPSBQcm9taXNlLlByb21pc2VJbnNwZWN0aW9uO1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xuXG5mdW5jdGlvbiBTZXR0bGVkUHJvbWlzZUFycmF5KHZhbHVlcykge1xuICAgIHRoaXMuY29uc3RydWN0b3IkKHZhbHVlcyk7XG59XG51dGlsLmluaGVyaXRzKFNldHRsZWRQcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5cblNldHRsZWRQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVzb2x2ZWQgPSBmdW5jdGlvbiAoaW5kZXgsIGluc3BlY3Rpb24pIHtcbiAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gaW5zcGVjdGlvbjtcbiAgICB2YXIgdG90YWxSZXNvbHZlZCA9ICsrdGhpcy5fdG90YWxSZXNvbHZlZDtcbiAgICBpZiAodG90YWxSZXNvbHZlZCA+PSB0aGlzLl9sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl92YWx1ZXMpO1xuICAgIH1cbn07XG5cblNldHRsZWRQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZUluc3BlY3Rpb24oKTtcbiAgICByZXQuX2JpdEZpZWxkID0gMjY4NDM1NDU2O1xuICAgIHJldC5fc2V0dGxlZFZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fcHJvbWlzZVJlc29sdmVkKGluZGV4LCByZXQpO1xufTtcblNldHRsZWRQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uLCBpbmRleCkge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZUluc3BlY3Rpb24oKTtcbiAgICByZXQuX2JpdEZpZWxkID0gMTM0MjE3NzI4O1xuICAgIHJldC5fc2V0dGxlZFZhbHVlID0gcmVhc29uO1xuICAgIHRoaXMuX3Byb21pc2VSZXNvbHZlZChpbmRleCwgcmV0KTtcbn07XG5cblByb21pc2Uuc2V0dGxlID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIG5ldyBTZXR0bGVkUHJvbWlzZUFycmF5KHByb21pc2VzKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXR0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBTZXR0bGVkUHJvbWlzZUFycmF5KHRoaXMpLnByb21pc2UoKTtcbn07XG59O1xuXG59LHtcIi4vdXRpbC5qc1wiOjM4fV0sMzM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsLmpzXCIpO1xudmFyIFJhbmdlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnMuanNcIikuUmFuZ2VFcnJvcjtcbnZhciBBZ2dyZWdhdGVFcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKS5BZ2dyZWdhdGVFcnJvcjtcbnZhciBpc0FycmF5ID0gdXRpbC5pc0FycmF5O1xuXG5cbmZ1bmN0aW9uIFNvbWVQcm9taXNlQXJyYXkodmFsdWVzKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQodmFsdWVzKTtcbiAgICB0aGlzLl9ob3dNYW55ID0gMDtcbiAgICB0aGlzLl91bndyYXAgPSBmYWxzZTtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xufVxudXRpbC5pbmhlcml0cyhTb21lUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2hvd01hbnkgPT09IDApIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZShbXSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCAtNSk7XG4gICAgdmFyIGlzQXJyYXlSZXNvbHZlZCA9IGlzQXJyYXkodGhpcy5fdmFsdWVzKTtcbiAgICBpZiAoIXRoaXMuX2lzUmVzb2x2ZWQoKSAmJlxuICAgICAgICBpc0FycmF5UmVzb2x2ZWQgJiZcbiAgICAgICAgdGhpcy5faG93TWFueSA+IHRoaXMuX2NhblBvc3NpYmx5RnVsZmlsbCgpKSB7XG4gICAgICAgIHRoaXMuX3JlamVjdCh0aGlzLl9nZXRSYW5nZUVycm9yKHRoaXMubGVuZ3RoKCkpKTtcbiAgICB9XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLl9pbml0KCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zZXRVbndyYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdW53cmFwID0gdHJ1ZTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLmhvd01hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvd01hbnk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zZXRIb3dNYW55ID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgdGhpcy5faG93TWFueSA9IGNvdW50O1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl9hZGRGdWxmaWxsZWQodmFsdWUpO1xuICAgIGlmICh0aGlzLl9mdWxmaWxsZWQoKSA9PT0gdGhpcy5ob3dNYW55KCkpIHtcbiAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aCA9IHRoaXMuaG93TWFueSgpO1xuICAgICAgICBpZiAodGhpcy5ob3dNYW55KCkgPT09IDEgJiYgdGhpcy5fdW53cmFwKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZVJlamVjdGVkID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHRoaXMuX2FkZFJlamVjdGVkKHJlYXNvbik7XG4gICAgaWYgKHRoaXMuaG93TWFueSgpID4gdGhpcy5fY2FuUG9zc2libHlGdWxmaWxsKCkpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgQWdncmVnYXRlRXJyb3IoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMubGVuZ3RoKCk7IGkgPCB0aGlzLl92YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGUucHVzaCh0aGlzLl92YWx1ZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlamVjdChlKTtcbiAgICB9XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl90b3RhbFJlc29sdmVkO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX3JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gdGhpcy5sZW5ndGgoKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9hZGRSZWplY3RlZCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICB0aGlzLl92YWx1ZXMucHVzaChyZWFzb24pO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2FkZEZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl90b3RhbFJlc29sdmVkKytdID0gdmFsdWU7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fY2FuUG9zc2libHlGdWxmaWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmxlbmd0aCgpIC0gdGhpcy5fcmVqZWN0ZWQoKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9nZXRSYW5nZUVycm9yID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBcIklucHV0IGFycmF5IG11c3QgY29udGFpbiBhdCBsZWFzdCBcIiArXG4gICAgICAgICAgICB0aGlzLl9ob3dNYW55ICsgXCIgaXRlbXMgYnV0IGNvbnRhaW5zIG9ubHkgXCIgKyBjb3VudCArIFwiIGl0ZW1zXCI7XG4gICAgcmV0dXJuIG5ldyBSYW5nZUVycm9yKG1lc3NhZ2UpO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc29sdmVFbXB0eUFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlamVjdCh0aGlzLl9nZXRSYW5nZUVycm9yKDApKTtcbn07XG5cbmZ1bmN0aW9uIHNvbWUocHJvbWlzZXMsIGhvd01hbnkpIHtcbiAgICBpZiAoKGhvd01hbnkgfCAwKSAhPT0gaG93TWFueSB8fCBob3dNYW55IDwgMCkge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGEgcG9zaXRpdmUgaW50ZWdlclxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsLzF3QW1IeFxcdTAwMGFcIik7XG4gICAgfVxuICAgIHZhciByZXQgPSBuZXcgU29tZVByb21pc2VBcnJheShwcm9taXNlcyk7XG4gICAgdmFyIHByb21pc2UgPSByZXQucHJvbWlzZSgpO1xuICAgIHJldC5zZXRIb3dNYW55KGhvd01hbnkpO1xuICAgIHJldC5pbml0KCk7XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2Uuc29tZSA9IGZ1bmN0aW9uIChwcm9taXNlcywgaG93TWFueSkge1xuICAgIHJldHVybiBzb21lKHByb21pc2VzLCBob3dNYW55KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoaG93TWFueSkge1xuICAgIHJldHVybiBzb21lKHRoaXMsIGhvd01hbnkpO1xufTtcblxuUHJvbWlzZS5fU29tZVByb21pc2VBcnJheSA9IFNvbWVQcm9taXNlQXJyYXk7XG59O1xuXG59LHtcIi4vZXJyb3JzLmpzXCI6MTMsXCIuL3V0aWwuanNcIjozOH1dLDM0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG5mdW5jdGlvbiBQcm9taXNlSW5zcGVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKHByb21pc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9taXNlID0gcHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gcHJvbWlzZS5fYml0RmllbGQ7XG4gICAgICAgIHRoaXMuX3NldHRsZWRWYWx1ZSA9IHByb21pc2UuX3NldHRsZWRWYWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gMDtcbiAgICAgICAgdGhpcy5fc2V0dGxlZFZhbHVlID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgZ2V0IGZ1bGZpbGxtZW50IHZhbHVlIG9mIGEgbm9uLWZ1bGZpbGxlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvaGMxRExqXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZTtcbn07XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5lcnJvciA9XG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUucmVhc29uID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBnZXQgcmVqZWN0aW9uIHJlYXNvbiBvZiBhIG5vbi1yZWplY3RlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvaFB1aXdCXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZTtcbn07XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5faXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDI2ODQzNTQ1NikgPiAwO1xufTtcblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzUmVqZWN0ZWQgPVxuUHJvbWlzZS5wcm90b3R5cGUuX2lzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDEzNDIxNzcyOCkgPiAwO1xufTtcblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzUGVuZGluZyA9XG5Qcm9taXNlLnByb3RvdHlwZS5faXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA0MDI2NTMxODQpID09PSAwO1xufTtcblxuUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzUmVzb2x2ZWQgPVxuUHJvbWlzZS5wcm90b3R5cGUuX2lzUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDQwMjY1MzE4NCkgPiAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldCgpLl9pc1BlbmRpbmcoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0KCkuX2lzUmVqZWN0ZWQoKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldCgpLl9pc0Z1bGZpbGxlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZXNvbHZlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl90YXJnZXQoKS5faXNSZXNvbHZlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3ZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWFzb24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuICAgIGlmICghdGFyZ2V0LmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgb2YgYSBub24tZnVsZmlsbGVkIHByb21pc2VcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9oYzFETGpcXHUwMDBhXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0Ll9zZXR0bGVkVmFsdWU7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yZWFzb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0KCk7XG4gICAgaWYgKCF0YXJnZXQuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgZ2V0IHJlamVjdGlvbiByZWFzb24gb2YgYSBub24tcmVqZWN0ZWQgcHJvbWlzZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL2hQdWl3QlxcdTAwMGFcIik7XG4gICAgfVxuICAgIHRhcmdldC5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIHJldHVybiB0YXJnZXQuX3NldHRsZWRWYWx1ZTtcbn07XG5cblxuUHJvbWlzZS5Qcm9taXNlSW5zcGVjdGlvbiA9IFByb21pc2VJbnNwZWN0aW9uO1xufTtcblxufSx7fV0sMzU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWwuanNcIik7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIGlzT2JqZWN0ID0gdXRpbC5pc09iamVjdDtcblxuZnVuY3Rpb24gdHJ5Q29udmVydFRvUHJvbWlzZShvYmosIGNvbnRleHQpIHtcbiAgICBpZiAoaXNPYmplY3Qob2JqKSkge1xuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0FueUJsdWViaXJkUHJvbWlzZShvYmopKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICAgICAgb2JqLl90aGVuKFxuICAgICAgICAgICAgICAgIHJldC5fZnVsZmlsbFVuY2hlY2tlZCxcbiAgICAgICAgICAgICAgICByZXQuX3JlamVjdFVuY2hlY2tlZENoZWNrRXJyb3IsXG4gICAgICAgICAgICAgICAgcmV0Ll9wcm9ncmVzc1VuY2hlY2tlZCxcbiAgICAgICAgICAgICAgICByZXQsXG4gICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoZW4gPSB1dGlsLnRyeUNhdGNoKGdldFRoZW4pKG9iaik7XG4gICAgICAgIGlmICh0aGVuID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgaWYgKGNvbnRleHQpIGNvbnRleHQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgICAgICB2YXIgcmV0ID0gUHJvbWlzZS5yZWplY3QodGhlbi5lKTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBkb1RoZW5hYmxlKG9iaiwgdGhlbiwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihvYmopIHtcbiAgICByZXR1cm4gb2JqLnRoZW47XG59XG5cbnZhciBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5mdW5jdGlvbiBpc0FueUJsdWViaXJkUHJvbWlzZShvYmopIHtcbiAgICByZXR1cm4gaGFzUHJvcC5jYWxsKG9iaiwgXCJfcHJvbWlzZTBcIik7XG59XG5cbmZ1bmN0aW9uIGRvVGhlbmFibGUoeCwgdGhlbiwgY29udGV4dCkge1xuICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHZhciByZXQgPSBwcm9taXNlO1xuICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wdXNoQ29udGV4dCgpO1xuICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgaWYgKGNvbnRleHQpIGNvbnRleHQuX3BvcENvbnRleHQoKTtcbiAgICB2YXIgc3luY2hyb25vdXMgPSB0cnVlO1xuICAgIHZhciByZXN1bHQgPSB1dGlsLnRyeUNhdGNoKHRoZW4pLmNhbGwoeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlRnJvbVRoZW5hYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdEZyb21UaGVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0Zyb21UaGVuYWJsZSk7XG4gICAgc3luY2hyb25vdXMgPSBmYWxzZTtcbiAgICBpZiAocHJvbWlzZSAmJiByZXN1bHQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHJlc3VsdC5lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZUZyb21UaGVuYWJsZSh2YWx1ZSkge1xuICAgICAgICBpZiAoIXByb21pc2UpIHJldHVybjtcbiAgICAgICAgcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVqZWN0RnJvbVRoZW5hYmxlKHJlYXNvbikge1xuICAgICAgICBpZiAoIXByb21pc2UpIHJldHVybjtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCBzeW5jaHJvbm91cywgdHJ1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2dyZXNzRnJvbVRoZW5hYmxlKHZhbHVlKSB7XG4gICAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuO1xuICAgICAgICBpZiAodHlwZW9mIHByb21pc2UuX3Byb2dyZXNzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuX3Byb2dyZXNzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5yZXR1cm4gdHJ5Q29udmVydFRvUHJvbWlzZTtcbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwzNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKTtcbnZhciBUaW1lb3V0RXJyb3IgPSBQcm9taXNlLlRpbWVvdXRFcnJvcjtcblxudmFyIGFmdGVyVGltZW91dCA9IGZ1bmN0aW9uIChwcm9taXNlLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFwcm9taXNlLmlzUGVuZGluZygpKSByZXR1cm47XG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBcIm9wZXJhdGlvbiB0aW1lZCBvdXRcIjtcbiAgICB9XG4gICAgdmFyIGVyciA9IG5ldyBUaW1lb3V0RXJyb3IobWVzc2FnZSk7XG4gICAgdXRpbC5tYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24oZXJyKTtcbiAgICBwcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKGVycik7XG4gICAgcHJvbWlzZS5fY2FuY2VsKGVycik7XG59O1xuXG52YXIgYWZ0ZXJWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7IHJldHVybiBkZWxheSgrdGhpcykudGhlblJldHVybih2YWx1ZSk7IH07XG52YXIgZGVsYXkgPSBQcm9taXNlLmRlbGF5ID0gZnVuY3Rpb24gKHZhbHVlLCBtcykge1xuICAgIGlmIChtcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1zID0gdmFsdWU7XG4gICAgICAgIHZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyByZXQuX2Z1bGZpbGwoKTsgfSwgbXMpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBtcyA9ICttcztcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS5fdGhlbihhZnRlclZhbHVlLCBudWxsLCBudWxsLCBtcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKG1zKSB7XG4gICAgcmV0dXJuIGRlbGF5KHRoaXMsIG1zKTtcbn07XG5cbmZ1bmN0aW9uIHN1Y2Nlc3NDbGVhcih2YWx1ZSkge1xuICAgIHZhciBoYW5kbGUgPSB0aGlzO1xuICAgIGlmIChoYW5kbGUgaW5zdGFuY2VvZiBOdW1iZXIpIGhhbmRsZSA9ICtoYW5kbGU7XG4gICAgY2xlYXJUaW1lb3V0KGhhbmRsZSk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBmYWlsdXJlQ2xlYXIocmVhc29uKSB7XG4gICAgdmFyIGhhbmRsZSA9IHRoaXM7XG4gICAgaWYgKGhhbmRsZSBpbnN0YW5jZW9mIE51bWJlcikgaGFuZGxlID0gK2hhbmRsZTtcbiAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICB0aHJvdyByZWFzb247XG59XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIG1lc3NhZ2UpIHtcbiAgICBtcyA9ICttcztcbiAgICB2YXIgcmV0ID0gdGhpcy50aGVuKCkuY2FuY2VsbGFibGUoKTtcbiAgICByZXQuX2NhbmNlbGxhdGlvblBhcmVudCA9IHRoaXM7XG4gICAgdmFyIGhhbmRsZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gdGltZW91dFRpbWVvdXQoKSB7XG4gICAgICAgIGFmdGVyVGltZW91dChyZXQsIG1lc3NhZ2UpO1xuICAgIH0sIG1zKTtcbiAgICByZXR1cm4gcmV0Ll90aGVuKHN1Y2Nlc3NDbGVhciwgZmFpbHVyZUNsZWFyLCB1bmRlZmluZWQsIGhhbmRsZSwgdW5kZWZpbmVkKTtcbn07XG5cbn07XG5cbn0se1wiLi91dGlsLmpzXCI6Mzh9XSwzNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKFByb21pc2UsIGFwaVJlamVjdGlvbiwgdHJ5Q29udmVydFRvUHJvbWlzZSxcbiAgICBjcmVhdGVDb250ZXh0KSB7XG4gICAgdmFyIFR5cGVFcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9ycy5qc1wiKS5UeXBlRXJyb3I7XG4gICAgdmFyIGluaGVyaXRzID0gX2RlcmVxXyhcIi4vdXRpbC5qc1wiKS5pbmhlcml0cztcbiAgICB2YXIgUHJvbWlzZUluc3BlY3Rpb24gPSBQcm9taXNlLlByb21pc2VJbnNwZWN0aW9uO1xuXG4gICAgZnVuY3Rpb24gaW5zcGVjdGlvbk1hcHBlcihpbnNwZWN0aW9ucykge1xuICAgICAgICB2YXIgbGVuID0gaW5zcGVjdGlvbnMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGlvbiA9IGluc3BlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKGluc3BlY3Rpb24uaXNSZWplY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGluc3BlY3Rpb24uZXJyb3IoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnNwZWN0aW9uc1tpXSA9IGluc3BlY3Rpb24uX3NldHRsZWRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zcGVjdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGhyb3dlcihlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aHJvdyBlO30sIDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhc3RQcmVzZXJ2aW5nRGlzcG9zYWJsZSh0aGVuYWJsZSkge1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh0aGVuYWJsZSk7XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgIT09IHRoZW5hYmxlICYmXG4gICAgICAgICAgICB0eXBlb2YgdGhlbmFibGUuX2lzRGlzcG9zYWJsZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICB0eXBlb2YgdGhlbmFibGUuX2dldERpc3Bvc2VyID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgIHRoZW5hYmxlLl9pc0Rpc3Bvc2FibGUoKSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9zZXREaXNwb3NhYmxlKHRoZW5hYmxlLl9nZXREaXNwb3NlcigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF5YmVQcm9taXNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwb3NlKHJlc291cmNlcywgaW5zcGVjdGlvbikge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsZW4gPSByZXNvdXJjZXMubGVuZ3RoO1xuICAgICAgICB2YXIgcmV0ID0gUHJvbWlzZS5kZWZlcigpO1xuICAgICAgICBmdW5jdGlvbiBpdGVyYXRvcigpIHtcbiAgICAgICAgICAgIGlmIChpID49IGxlbikgcmV0dXJuIHJldC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gY2FzdFByZXNlcnZpbmdEaXNwb3NhYmxlKHJlc291cmNlc1tpKytdKTtcbiAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlICYmXG4gICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9pc0Rpc3Bvc2FibGUoKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX2dldERpc3Bvc2VyKCkudHJ5RGlzcG9zZShpbnNwZWN0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlcy5wcm9taXNlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aHJvd2VyKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVQcm9taXNlLl90aGVuKGl0ZXJhdG9yLCB0aHJvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXJhdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmF0b3IoKTtcbiAgICAgICAgcmV0dXJuIHJldC5wcm9taXNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VyU3VjY2Vzcyh2YWx1ZSkge1xuICAgICAgICB2YXIgaW5zcGVjdGlvbiA9IG5ldyBQcm9taXNlSW5zcGVjdGlvbigpO1xuICAgICAgICBpbnNwZWN0aW9uLl9zZXR0bGVkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgaW5zcGVjdGlvbi5fYml0RmllbGQgPSAyNjg0MzU0NTY7XG4gICAgICAgIHJldHVybiBkaXNwb3NlKHRoaXMsIGluc3BlY3Rpb24pLnRoZW5SZXR1cm4odmFsdWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VyRmFpbChyZWFzb24pIHtcbiAgICAgICAgdmFyIGluc3BlY3Rpb24gPSBuZXcgUHJvbWlzZUluc3BlY3Rpb24oKTtcbiAgICAgICAgaW5zcGVjdGlvbi5fc2V0dGxlZFZhbHVlID0gcmVhc29uO1xuICAgICAgICBpbnNwZWN0aW9uLl9iaXRGaWVsZCA9IDEzNDIxNzcyODtcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2UodGhpcywgaW5zcGVjdGlvbikudGhlblRocm93KHJlYXNvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gRGlzcG9zZXIoZGF0YSwgcHJvbWlzZSwgY29udGV4dCkge1xuICAgICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZSA9IHByb21pc2U7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIERpc3Bvc2VyLnByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICB9O1xuXG4gICAgRGlzcG9zZXIucHJvdG90eXBlLnByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUucmVzb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb21pc2UoKS5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9taXNlKCkudmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgRGlzcG9zZXIucHJvdG90eXBlLnRyeURpc3Bvc2UgPSBmdW5jdGlvbihpbnNwZWN0aW9uKSB7XG4gICAgICAgIHZhciByZXNvdXJjZSA9IHRoaXMucmVzb3VyY2UoKTtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLl9jb250ZXh0O1xuICAgICAgICBpZiAoY29udGV4dCAhPT0gdW5kZWZpbmVkKSBjb250ZXh0Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgcmV0ID0gcmVzb3VyY2UgIT09IG51bGxcbiAgICAgICAgICAgID8gdGhpcy5kb0Rpc3Bvc2UocmVzb3VyY2UsIGluc3BlY3Rpb24pIDogbnVsbDtcbiAgICAgICAgaWYgKGNvbnRleHQgIT09IHVuZGVmaW5lZCkgY29udGV4dC5fcG9wQ29udGV4dCgpO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl91bnNldERpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIERpc3Bvc2VyLmlzRGlzcG9zZXIgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gKGQgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBkLnJlc291cmNlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgZC50cnlEaXNwb3NlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBGdW5jdGlvbkRpc3Bvc2VyKGZuLCBwcm9taXNlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IkKGZuLCBwcm9taXNlLCBjb250ZXh0KTtcbiAgICB9XG4gICAgaW5oZXJpdHMoRnVuY3Rpb25EaXNwb3NlciwgRGlzcG9zZXIpO1xuXG4gICAgRnVuY3Rpb25EaXNwb3Nlci5wcm90b3R5cGUuZG9EaXNwb3NlID0gZnVuY3Rpb24gKHJlc291cmNlLCBpbnNwZWN0aW9uKSB7XG4gICAgICAgIHZhciBmbiA9IHRoaXMuZGF0YSgpO1xuICAgICAgICByZXR1cm4gZm4uY2FsbChyZXNvdXJjZSwgcmVzb3VyY2UsIGluc3BlY3Rpb24pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtYXliZVVud3JhcERpc3Bvc2VyKHZhbHVlKSB7XG4gICAgICAgIGlmIChEaXNwb3Nlci5pc0Rpc3Bvc2VyKHZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXNbdGhpcy5pbmRleF0uX3NldERpc3Bvc2FibGUodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgUHJvbWlzZS51c2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW4gPCAyKSByZXR1cm4gYXBpUmVqZWN0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ5b3UgbXVzdCBwYXNzIGF0IGxlYXN0IDIgYXJndW1lbnRzIHRvIFByb21pc2UudXNpbmdcIik7XG4gICAgICAgIHZhciBmbiA9IGFyZ3VtZW50c1tsZW4gLSAxXTtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZm4gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvOTE2bEpKXFx1MDAwYVwiKTtcbiAgICAgICAgbGVuLS07XG4gICAgICAgIHZhciByZXNvdXJjZXMgPSBuZXcgQXJyYXkobGVuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgdmFyIHJlc291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKERpc3Bvc2VyLmlzRGlzcG9zZXIocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpc3Bvc2VyID0gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSByZXNvdXJjZS5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuX3NldERpc3Bvc2FibGUoZGlzcG9zZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKG1heWJlVW53cmFwRGlzcG9zZXIsIG51bGwsIG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IHJlc291cmNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaVxuICAgICAgICAgICAgICAgICAgICB9LCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc291cmNlc1tpXSA9IHJlc291cmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb21pc2UgPSBQcm9taXNlLnNldHRsZShyZXNvdXJjZXMpXG4gICAgICAgICAgICAudGhlbihpbnNwZWN0aW9uTWFwcGVyKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFscykge1xuICAgICAgICAgICAgICAgIHByb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHJldDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXQgPSBmbi5hcHBseSh1bmRlZmluZWQsIHZhbHMpO1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuX3RoZW4oXG4gICAgICAgICAgICAgICAgZGlzcG9zZXJTdWNjZXNzLCBkaXNwb3NlckZhaWwsIHVuZGVmaW5lZCwgcmVzb3VyY2VzLCB1bmRlZmluZWQpO1xuICAgICAgICByZXNvdXJjZXMucHJvbWlzZSA9IHByb21pc2U7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5fc2V0RGlzcG9zYWJsZSA9IGZ1bmN0aW9uIChkaXNwb3Nlcikge1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgMjYyMTQ0O1xuICAgICAgICB0aGlzLl9kaXNwb3NlciA9IGRpc3Bvc2VyO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5faXNEaXNwb3NhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMjYyMTQ0KSA+IDA7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl9nZXREaXNwb3NlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3Bvc2VyO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5fdW5zZXREaXNwb3NhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH4yNjIxNDQpO1xuICAgICAgICB0aGlzLl9kaXNwb3NlciA9IHVuZGVmaW5lZDtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuZGlzcG9zZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uRGlzcG9zZXIoZm4sIHRoaXMsIGNyZWF0ZUNvbnRleHQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgIH07XG5cbn07XG5cbn0se1wiLi9lcnJvcnMuanNcIjoxMyxcIi4vdXRpbC5qc1wiOjM4fV0sMzg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZXM1ID0gX2RlcmVxXyhcIi4vZXM1LmpzXCIpO1xudmFyIGNhbkV2YWx1YXRlID0gdHlwZW9mIG5hdmlnYXRvciA9PSBcInVuZGVmaW5lZFwiO1xudmFyIGhhdmVHZXR0ZXJzID0gKGZ1bmN0aW9uKCl7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIG8gPSB7fTtcbiAgICAgICAgZXM1LmRlZmluZVByb3BlcnR5KG8sIFwiZlwiLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvLmYgPT09IDM7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbn0pKCk7XG5cbnZhciBlcnJvck9iaiA9IHtlOiB7fX07XG52YXIgdHJ5Q2F0Y2hUYXJnZXQ7XG5mdW5jdGlvbiB0cnlDYXRjaGVyKCkge1xuICAgIHRyeSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0cnlDYXRjaFRhcmdldDtcbiAgICAgICAgdHJ5Q2F0Y2hUYXJnZXQgPSBudWxsO1xuICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBlcnJvck9iai5lID0gZTtcbiAgICAgICAgcmV0dXJuIGVycm9yT2JqO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyeUNhdGNoKGZuKSB7XG4gICAgdHJ5Q2F0Y2hUYXJnZXQgPSBmbjtcbiAgICByZXR1cm4gdHJ5Q2F0Y2hlcjtcbn1cblxudmFyIGluaGVyaXRzID0gZnVuY3Rpb24oQ2hpbGQsIFBhcmVudCkge1xuICAgIHZhciBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgICBmdW5jdGlvbiBUKCkge1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gQ2hpbGQ7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IkID0gUGFyZW50O1xuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gUGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChQYXJlbnQucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUpICYmXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lLmNoYXJBdChwcm9wZXJ0eU5hbWUubGVuZ3RoLTEpICE9PSBcIiRcIlxuICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZSArIFwiJFwiXSA9IFBhcmVudC5wcm90b3R5cGVbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBULnByb3RvdHlwZSA9IFBhcmVudC5wcm90b3R5cGU7XG4gICAgQ2hpbGQucHJvdG90eXBlID0gbmV3IFQoKTtcbiAgICByZXR1cm4gQ2hpbGQucHJvdG90eXBlO1xufTtcblxuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZSh2YWwpIHtcbiAgICByZXR1cm4gdmFsID09IG51bGwgfHwgdmFsID09PSB0cnVlIHx8IHZhbCA9PT0gZmFsc2UgfHxcbiAgICAgICAgdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgdmFsID09PSBcIm51bWJlclwiO1xuXG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuICFpc1ByaW1pdGl2ZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlV3JhcEFzRXJyb3IobWF5YmVFcnJvcikge1xuICAgIGlmICghaXNQcmltaXRpdmUobWF5YmVFcnJvcikpIHJldHVybiBtYXliZUVycm9yO1xuXG4gICAgcmV0dXJuIG5ldyBFcnJvcihzYWZlVG9TdHJpbmcobWF5YmVFcnJvcikpO1xufVxuXG5mdW5jdGlvbiB3aXRoQXBwZW5kZWQodGFyZ2V0LCBhcHBlbmRlZSkge1xuICAgIHZhciBsZW4gPSB0YXJnZXQubGVuZ3RoO1xuICAgIHZhciByZXQgPSBuZXcgQXJyYXkobGVuICsgMSk7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHJldFtpXSA9IHRhcmdldFtpXTtcbiAgICB9XG4gICAgcmV0W2ldID0gYXBwZW5kZWU7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0KG9iaiwga2V5LCBkZWZhdWx0VmFsdWUpIHtcbiAgICBpZiAoZXM1LmlzRVM1KSB7XG4gICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG5cbiAgICAgICAgaWYgKGRlc2MgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGRlc2MuZ2V0ID09IG51bGwgJiYgZGVzYy5zZXQgPT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICA/IGRlc2MudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgOiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge30uaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgPyBvYmpba2V5XSA6IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEVudW1lcmFibGVQcm9wKG9iaiwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoaXNQcmltaXRpdmUob2JqKSkgcmV0dXJuIG9iajtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gICAgZXM1LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwgZGVzY3JpcHRvcik7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gdGhyb3dlcihyKSB7XG4gICAgdGhyb3cgcjtcbn1cblxudmFyIGluaGVyaXRlZERhdGFLZXlzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBleGNsdWRlZFByb3RvdHlwZXMgPSBbXG4gICAgICAgIEFycmF5LnByb3RvdHlwZSxcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZSxcbiAgICAgICAgRnVuY3Rpb24ucHJvdG90eXBlXG4gICAgXTtcblxuICAgIHZhciBpc0V4Y2x1ZGVkUHJvdG8gPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlZFByb3RvdHlwZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChleGNsdWRlZFByb3RvdHlwZXNbaV0gPT09IHZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgaWYgKGVzNS5pc0VTNSkge1xuICAgICAgICB2YXIgZ2V0S2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgICAgICB2YXIgdmlzaXRlZEtleXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgICAgd2hpbGUgKG9iaiAhPSBudWxsICYmICFpc0V4Y2x1ZGVkUHJvdG8ob2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXlzO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMgPSBnZXRLZXlzKG9iaik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh2aXNpdGVkS2V5c1trZXldKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgdmlzaXRlZEtleXNba2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXNjICE9IG51bGwgJiYgZGVzYy5nZXQgPT0gbnVsbCAmJiBkZXNjLnNldCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iaiA9IGVzNS5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBpZiAoaXNFeGNsdWRlZFByb3RvKG9iaikpIHJldHVybiBbXTtcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblxuICAgICAgICAgICAgLypqc2hpbnQgZm9yaW46ZmFsc2UgKi9cbiAgICAgICAgICAgIGVudW1lcmF0aW9uOiBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVkUHJvdG90eXBlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChleGNsdWRlZFByb3RvdHlwZXNbaV0sIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBlbnVtZXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH07XG4gICAgfVxuXG59KSgpO1xuXG52YXIgdGhpc0Fzc2lnbm1lbnRQYXR0ZXJuID0gL3RoaXNcXHMqXFwuXFxzKlxcUytcXHMqPS87XG5mdW5jdGlvbiBpc0NsYXNzKGZuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IGVzNS5uYW1lcyhmbi5wcm90b3R5cGUpO1xuXG4gICAgICAgICAgICB2YXIgaGFzTWV0aG9kcyA9IGVzNS5pc0VTNSAmJiBrZXlzLmxlbmd0aCA+IDE7XG4gICAgICAgICAgICB2YXIgaGFzTWV0aG9kc090aGVyVGhhbkNvbnN0cnVjdG9yID0ga2V5cy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgIShrZXlzLmxlbmd0aCA9PT0gMSAmJiBrZXlzWzBdID09PSBcImNvbnN0cnVjdG9yXCIpO1xuICAgICAgICAgICAgdmFyIGhhc1RoaXNBc3NpZ25tZW50QW5kU3RhdGljTWV0aG9kcyA9XG4gICAgICAgICAgICAgICAgdGhpc0Fzc2lnbm1lbnRQYXR0ZXJuLnRlc3QoZm4gKyBcIlwiKSAmJiBlczUubmFtZXMoZm4pLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgICAgIGlmIChoYXNNZXRob2RzIHx8IGhhc01ldGhvZHNPdGhlclRoYW5Db25zdHJ1Y3RvciB8fFxuICAgICAgICAgICAgICAgIGhhc1RoaXNBc3NpZ25tZW50QW5kU3RhdGljTWV0aG9kcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvRmFzdFByb3BlcnRpZXMob2JqKSB7XG4gICAgLypqc2hpbnQgLVcwMjcsLVcwNTUsLVcwMzEqL1xuICAgIGZ1bmN0aW9uIGYoKSB7fVxuICAgIGYucHJvdG90eXBlID0gb2JqO1xuICAgIHZhciBsID0gODtcbiAgICB3aGlsZSAobC0tKSBuZXcgZigpO1xuICAgIHJldHVybiBvYmo7XG4gICAgZXZhbChvYmopO1xufVxuXG52YXIgcmlkZW50ID0gL15bYS16JF9dW2EteiRfMC05XSokL2k7XG5mdW5jdGlvbiBpc0lkZW50aWZpZXIoc3RyKSB7XG4gICAgcmV0dXJuIHJpZGVudC50ZXN0KHN0cik7XG59XG5cbmZ1bmN0aW9uIGZpbGxlZFJhbmdlKGNvdW50LCBwcmVmaXgsIHN1ZmZpeCkge1xuICAgIHZhciByZXQgPSBuZXcgQXJyYXkoY291bnQpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgIHJldFtpXSA9IHByZWZpeCArIGkgKyBzdWZmaXg7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHNhZmVUb1N0cmluZyhvYmopIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gb2JqICsgXCJcIjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBcIltubyBzdHJpbmcgcmVwcmVzZW50YXRpb25dXCI7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24oZSkge1xuICAgIHRyeSB7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKGUsIFwiaXNPcGVyYXRpb25hbFwiLCB0cnVlKTtcbiAgICB9XG4gICAgY2F0Y2goaWdub3JlKSB7fVxufVxuXG5mdW5jdGlvbiBvcmlnaW5hdGVzRnJvbVJlamVjdGlvbihlKSB7XG4gICAgaWYgKGUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiAoKGUgaW5zdGFuY2VvZiBFcnJvcltcIl9fQmx1ZWJpcmRFcnJvclR5cGVzX19cIl0uT3BlcmF0aW9uYWxFcnJvcikgfHxcbiAgICAgICAgZVtcImlzT3BlcmF0aW9uYWxcIl0gPT09IHRydWUpO1xufVxuXG5mdW5jdGlvbiBjYW5BdHRhY2hUcmFjZShvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRXJyb3IgJiYgZXM1LnByb3BlcnR5SXNXcml0YWJsZShvYmosIFwic3RhY2tcIik7XG59XG5cbnZhciBlbnN1cmVFcnJvck9iamVjdCA9IChmdW5jdGlvbigpIHtcbiAgICBpZiAoIShcInN0YWNrXCIgaW4gbmV3IEVycm9yKCkpKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGNhbkF0dGFjaFRyYWNlKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgdHJ5IHt0aHJvdyBuZXcgRXJyb3Ioc2FmZVRvU3RyaW5nKHZhbHVlKSk7fVxuICAgICAgICAgICAgY2F0Y2goZXJyKSB7cmV0dXJuIGVycjt9XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoY2FuQXR0YWNoVHJhY2UodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKHNhZmVUb1N0cmluZyh2YWx1ZSkpO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGNsYXNzU3RyaW5nKG9iaikge1xuICAgIHJldHVybiB7fS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5cbmZ1bmN0aW9uIGNvcHlEZXNjcmlwdG9ycyhmcm9tLCB0bywgZmlsdGVyKSB7XG4gICAgdmFyIGtleXMgPSBlczUubmFtZXMoZnJvbSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBpZiAoZmlsdGVyKGtleSkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZXM1LmRlZmluZVByb3BlcnR5KHRvLCBrZXksIGVzNS5nZXREZXNjcmlwdG9yKGZyb20sIGtleSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7fVxuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgcmV0ID0ge1xuICAgIGlzQ2xhc3M6IGlzQ2xhc3MsXG4gICAgaXNJZGVudGlmaWVyOiBpc0lkZW50aWZpZXIsXG4gICAgaW5oZXJpdGVkRGF0YUtleXM6IGluaGVyaXRlZERhdGFLZXlzLFxuICAgIGdldERhdGFQcm9wZXJ0eU9yRGVmYXVsdDogZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0LFxuICAgIHRocm93ZXI6IHRocm93ZXIsXG4gICAgaXNBcnJheTogZXM1LmlzQXJyYXksXG4gICAgaGF2ZUdldHRlcnM6IGhhdmVHZXR0ZXJzLFxuICAgIG5vdEVudW1lcmFibGVQcm9wOiBub3RFbnVtZXJhYmxlUHJvcCxcbiAgICBpc1ByaW1pdGl2ZTogaXNQcmltaXRpdmUsXG4gICAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICAgIGNhbkV2YWx1YXRlOiBjYW5FdmFsdWF0ZSxcbiAgICBlcnJvck9iajogZXJyb3JPYmosXG4gICAgdHJ5Q2F0Y2g6IHRyeUNhdGNoLFxuICAgIGluaGVyaXRzOiBpbmhlcml0cyxcbiAgICB3aXRoQXBwZW5kZWQ6IHdpdGhBcHBlbmRlZCxcbiAgICBtYXliZVdyYXBBc0Vycm9yOiBtYXliZVdyYXBBc0Vycm9yLFxuICAgIHRvRmFzdFByb3BlcnRpZXM6IHRvRmFzdFByb3BlcnRpZXMsXG4gICAgZmlsbGVkUmFuZ2U6IGZpbGxlZFJhbmdlLFxuICAgIHRvU3RyaW5nOiBzYWZlVG9TdHJpbmcsXG4gICAgY2FuQXR0YWNoVHJhY2U6IGNhbkF0dGFjaFRyYWNlLFxuICAgIGVuc3VyZUVycm9yT2JqZWN0OiBlbnN1cmVFcnJvck9iamVjdCxcbiAgICBvcmlnaW5hdGVzRnJvbVJlamVjdGlvbjogb3JpZ2luYXRlc0Zyb21SZWplY3Rpb24sXG4gICAgbWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uOiBtYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24sXG4gICAgY2xhc3NTdHJpbmc6IGNsYXNzU3RyaW5nLFxuICAgIGNvcHlEZXNjcmlwdG9yczogY29weURlc2NyaXB0b3JzLFxuICAgIGhhc0RldlRvb2xzOiB0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZSAmJlxuICAgICAgICAgICAgICAgICB0eXBlb2YgY2hyb21lLmxvYWRUaW1lcyA9PT0gXCJmdW5jdGlvblwiLFxuICAgIGlzTm9kZTogdHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgY2xhc3NTdHJpbmcocHJvY2VzcykudG9Mb3dlckNhc2UoKSA9PT0gXCJbb2JqZWN0IHByb2Nlc3NdXCJcbn07XG5yZXQuaXNSZWNlbnROb2RlID0gcmV0LmlzTm9kZSAmJiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGUuc3BsaXQoXCIuXCIpLm1hcChOdW1iZXIpO1xuICAgIHJldHVybiAodmVyc2lvblswXSA9PT0gMCAmJiB2ZXJzaW9uWzFdID4gMTApIHx8ICh2ZXJzaW9uWzBdID4gMCk7XG59KSgpO1xuXG5pZiAocmV0LmlzTm9kZSkgcmV0LnRvRmFzdFByb3BlcnRpZXMocHJvY2Vzcyk7XG5cbnRyeSB7dGhyb3cgbmV3IEVycm9yKCk7IH0gY2F0Y2ggKGUpIHtyZXQubGFzdExpbmVFcnJvciA9IGU7fVxubW9kdWxlLmV4cG9ydHMgPSByZXQ7XG5cbn0se1wiLi9lczUuanNcIjoxNH1dfSx7fSxbNF0pKDQpXG59KTsgICAgICAgICAgICAgICAgICAgIDtpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93ICE9PSBudWxsKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5QID0gd2luZG93LlByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmICE9PSBudWxsKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLlAgPSBzZWxmLlByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
