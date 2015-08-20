var DomElement = require('../dom/domElement');
var Transform = require('./transform');
var Style = require('./style');
var PathData = require('./pathData');
var util = require('../util/util');
var event = require('../core/event');

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
var SVGElement = function(name, svgRoot, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributeSetter.transform = this.transformationAttributeSetter;
    this.attributeSetter.style = this.styleAttributeSetter;
    this.attributeSetter.d = this.pathDataAttributeSetter;
    this.SVGElement = true;

    // If first attribute is not a string we assume a svg node constructor call.
    if(!object.isString(name)) {
        this.instance(name);
        cfg = dom.getAttributes(name);
        name = name.tagName;
    }

    this.root = svgRoot;
    DomElement.call(this, name, cfg, this.attributeSetter);
};

SVGElement.prototype = Object.create(DomElement.prototype);
var _super = DomElement.prototype;

SVGElement.prototype.transformationAttributeSetter = function(trnasformationString) {
    return new Transform(trnasformationString);
};

SVGElement.prototype.pathDataAttributeSetter = function(pathDataString) {
    return new PathData(pathDataString);
};

SVGElement.prototype.data = function(pathData) {
    if(object.isDefined(pathData)) {
        this.attributes.d = new PathData(pathData);
        this.update();
        return this;
    } else if(!object.isDefined(this.attributes.d)) {
        this.attributes.d = new PathData(pathData);
    }
    return this.attributes.d;

};

SVGElement.prototype.getRootNode = function() {
    return this.root.instance();
};

SVGElement.prototype.styleAttributeSetter = function(trnasformationString) {
    return new Style(trnasformationString);
};

SVGElement.prototype.remove = function() {
    this.$().remove();
};

SVGElement.prototype.firstChild = function() {
    return $.qCache().svg(this.$().children().first());
};

SVGElement.prototype.back = function() {
    dom.prependToRoot(this);
    return this;
};

SVGElement.prototype.scale = function(scale) {
    var result = this.getTransformation().scale(scale);

    if(result instanceof Transform) {
        // The trnaslate setter returns the Transform object so we reset the
        // transform attribute in dom (setter was called)
        this.update();
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGElement.prototype.translate = function(x, y) {
    var result = this.getTransformation().translate(x,y);

    if(result instanceof Transform) {
        // The trnaslate setter returns the Transform object so we reset the
        // transform attribute in dom (setter was called)
        this.update();
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGElement.prototype.fill = function(color) {
    return this.style('fill', color);
};

SVGElement.prototype.hide = function() {
    this.style('fill-opacity', '0.0');
    this.style('stroke-opacity', '0.0');
};

SVGElement.prototype.show = function() {
    this.style('fill-opacity', '1.0');
    this.style('stroke-opacity', '1.0');
};

SVGElement.prototype.style = function(key, value) {
    if(!object.isDefined(value) && object.isString(key) && key.indexOf(':') <= 0
        && object.isDefined(this.attributes.style)) {
        //GETTER CALL
        return this.attributes.style.get(key);
    } else if(!object.isDefined(this.attributes.style)) {
        this.attributes.style = new Style(key, value);
    } else {
        this.attributes.style.set(key, value);
    }
    this.update();
};

//TODO how to handle cx cy ?
SVGElement.prototype.x = function() {
    if(this.name === 'path') {
        return this.data().getX();
    }

    var x = this.attr('x');
    if(object.isDefined(x)) {
        return x + this.getTransformation().translate().x;
    } else {
        return this.getTransformation().translate().x;
    }
};

SVGElement.prototype.getLeftX = function() {
    if(this.name === 'text') {
        var anchor = this.attr('text-anchor');
        switch(anchor) {
            case 'end':
                return this.x() - this.width();
            case 'middle':
                return this.x() - (this.width() / 2);
        }
    }

    return this.x();
};

SVGElement.prototype.y = function() {
    if(this.name === 'path') {
        return this.data().getY();
    }

    //TODO: SETTER
    var y = this.attr('y');
    if(object.isDefined(y)) {
        return y + this.getTransformation().translate().y;
    } else {
        return this.getTransformation().translate().y;
    }
};

SVGElement.prototype.position = function() {
    var that = this;
    return {
        x : that.x(),
        y : that.y()
    };
};

SVGElement.prototype.getRightX = function() {
    if(this.name === 'path') {
        return this.data().getRightX();
    } else if(this.name === 'text') {
        var anchor = this.attr('text-anchor');
        switch(anchor) {
            case 'end':
                return this.x();
            case 'middle':
                return this.x() + (this.width() / 2);
        }
    }
    return this.x() + this.width();
};

SVGElement.prototype.getBottomY = function() {
    if(this.name === 'path') {
        return this.data().getBottomY();
    }
    return this.y() + this.height();
};

SVGElement.prototype.overlays = function() {
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

SVGElement.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

SVGElement.prototype.getCenter = function() {
    return {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
};

/**
 * element.offsetWidth, element.offsetHeight: overall size of the containing box in pixels
 * element.clientHeight, element.clientWidth: content dimensions
 * @returns {_L1.SVGElement.instance.offsetHeight}
 */
SVGElement.prototype.height = function(value) {
    if(!object.isDefined(value) && object.isDefined(this.instance())) {
        return this.instance().getBBox().height;
    } else {
        switch(this.getType()) {
            case 'circle':
                var v = value / 2;
                this.attr({cy:v,cx:v, r:v});
                break;
            case 'ellipse':
                var v = value / 2;
                this.attr({cy: v,ry:v});
                break;
            default:
                this.attr({height:value});
                break;
        }
    }
};

SVGElement.prototype.width = function(value) {
    if(!object.isDefined(value) && object.isDefined(this.instance())) {
        return this.instance().getBBox().width;
    } else {
        switch(this.getType()) {
            case 'circle':
                var v = value / 2;
                this.attr({cy:v,cx:v, r:v});
                break;
            case 'ellipse':
                var v = value / 2;
                this.attr({cx: v,rx:v});
                break;
            default:
                this.attr({width:value});
                break;
        }
    }
};

SVGElement.prototype.move = function(dx, dy) {
    var translate = this.translate();
    this.translate(translate.x + dx, translate.y + dy);
    return this;
};

SVGElement.prototype.moveTo = function(x, y) {
    //TODO: we do not calculate the innitial x/y
    //We could set x and y to 0 ?
    //TODO: just move if the values changed

    var p = util.app.getPoint(x,y);

    var translate = this.translate();
    if(!(translate.x === p.x && translate.y === p.y)) {
        this.translate(p);
    }
    return this;
};

SVGElement.prototype.moveX = function(x) {
    var translate = this.translate();
    if(translate.x !== x) {
        this.translate(x, translate.y);
    }
    return this;
};

SVGElement.prototype.moveY = function(y) {
    var translate = this.translate();
    if(translate.y !== y) {
        return this.translate(translate.x, y);
    }
    return this;
};

SVGElement.prototype.hasTransformation = function(transformation) {
    if(object.isDefined(this.attributes.transform)) {
        return (object.isDefined(this.attributes.transform[transformation]));
    }
};

SVGElement.prototype.getTransformation = function() {
    if(!this.attributes.transform) {
        this.attributes.transform = new Transform();
    }
    return this.attributes.transform;
};

SVGElement.prototype.click = function(handler) {
    event.on(this.instance(), 'click', handler);
};

SVGElement.prototype.mousedown = function(handler) {
    event.on(this.instance(), 'mousedown', handler);
};

SVGElement.prototype.mouseover = function(handler) {
    event.on(this.instance(), 'mouseover', handler);
};

SVGElement.prototype.mouseout = function(handler) {
    event.on(this.instance(), 'mouseout', handler);
};

SVGElement.prototype.dblclick= function(handler) {
    event.on(this.instance(), 'dblclick', handler);
};

SVGElement.prototype.mousedown= function(handler) {
    event.on(this.instance(), 'mousedown', handler);
};

SVGElement.prototype.mouseenter= function(handler) {
    event.on(this.instance(), 'mouseenter', handler);
};

SVGElement.prototype.mouseleave= function(handler) {
    event.on(this.instance(), 'mouseleave', handler);
};

SVGElement.prototype.mouseup= function(handler) {
    event.on(this.instance(), 'mouseup', handler);
};

module.exports = SVGElement;
