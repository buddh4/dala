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

/**
 * SVG Eventhandling
 */

SVGElement.prototype.trigger = function(evt, args) {
    this.$().trigger(evt, args);
    return this;
};

SVGElement.prototype.on = function(evt, handler) {
    this.$().on(evt, handler);
    return this;
};

SVGElement.prototype.one = function(evt, handler) {
    this.$().one(evt, handler);
    return this;
};

SVGElement.prototype.off = function(evt) {
    this.$().off(evt);
    return this;
};

SVGElement.prototype.toString = function() {
    return util.xml.serializeToString(this.instance());
};

module.exports = SVGElement;
