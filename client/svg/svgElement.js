var DomElement = require('../dom/domElement');
var Transform = require('./transform');
var Style = require('./style');
var PathData = require('./pathData');
var util = require('../util/util');
var event = require('../core/event');

var dom = util.dom;
var object = require('../util/object');

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

    this.root = svgRoot || this;
    DomElement.call(this, name, cfg, this.attributeSetter);
};

util.inherits(SVGElement, DomElement);

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

SVGElement.prototype.append = function(element) {
    var result;
    if(arguments.length > 1) {
        result = [];
        var that = this;
        object.each(arguments, function(index, val) {
            result.push(that.append(val));
        })
    } else if(arguments.length === 1) {
        result =  util.dom.appendSVGElement(this.instance(), arguments[0]);
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

SVGElement.prototype.fillOpacity = function(opacity) {
    return this.style('fill-opacity', opacity);
};

SVGElement.prototype.strokeOpacity = function(opacity) {
    return this.style('stroke-opacity', opacity);
};

SVGElement.prototype.isVisible = function() {
    return (!this.fillOpacity() || this.fillOpacity() > 0)
        && (!this.strokeOpacity() || this.strokeOpacity() > 0);
};

SVGElement.prototype.hide = function() {
    this.fillOpacity(0);
    this.strokeOpacity(0);
};

SVGElement.prototype.show = function(opacity) {
    opacity = opacity || 1;
    this.fillOpacity(opacity);
    this.strokeOpacity(opacity);
};

SVGElement.prototype.stroke = function(color) {
    return this.style('stroke', color);
};

SVGElement.prototype.strokeDasharray = function(type) {
    if(!type) {
        return this.style('stroke-dasharray');
    }
    if(object.isString(type)) {
        this.style('stroke-dasharray', type);
    } else {

    }
};

SVGElement.prototype.toString = function() {
    return util.xml.serializeToString(this.instance());
};

SVGElement.prototype.strokeDashType = function(type) {
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

SVGElement.prototype.strokeWidth = function(width) {
    return util.app.parseNumberString(this.style('stroke-width', width));
};

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
    this.update();
    return this;
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

/**
 * Determines the location of a given position relative to the svg element.
 *
 * @param node
 * @param position
 * @returns {*}
 */
SVGElement.prototype.getRelativeLocation = function(position) {
    var center = this.getCenter();
    var g = util.math.Line.calcGradient(center, position);

    if(position.y < center.y) { //TOP
        if (position.x >= center.x) { //RIGHT
            if (g > -1) {
                return 'right';
            } else {
                return 'top';
            }
        } else if (g < 1) {//TOP/LEFT
            return 'left';
        } else {
            return 'top' ;
        }
    } else { //BOTTOM
        if(position.x >= center.x) { //RIGHT
            if(g < 1) {
                return 'right';
            } else {
                return 'bottom';
            }
        } else { //BOTTOM/LEFT
            if(g < -1) {
                return 'bottom';
            } else {
                return 'left';
            }
        }
    }
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
    var p = util.math.getPoint(x,y);

    var translate = this.translate();
    if(!(translate.x === p.x && translate.y === p.y)) {
        this.translate(p);
    }
    return this;
};

SVGElement.prototype.totalRadiusX = function() {
    var strokeWith = this.strokeWidth();
    var radius = this.rx();
    if(radius) {
        radius += (strokeWith) ? strokeWith : 0;
    }

    return radius;
};


SVGElement.prototype.totalRadiusY = function() {
    var strokeWith = this.strokeWidth();
    var radius = this.ry();
    if(radius) {
        radius += (strokeWith) ? strokeWith : 0;
    }

    return radius;
};

SVGElement.prototype.r = function(value) {
    return util.app.parseNumberString(this.attr('r', value));
};

SVGElement.prototype.rx = function(value) {
    return util.app.parseNumberString(this.attr('rx', value));
};

SVGElement.prototype.ry = function(value) {
    return util.app.parseNumberString(this.attr('ry', value));
};

SVGElement.prototype.totalRadius = function() {
    var strokeWith = this.strokeWidth();
    var radius = this.r();
    if(radius) {
        radius += (strokeWith) ? strokeWith : 0;
    }

    return radius;
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

SVGElement.prototype.on = function(evt, handler) {
    this.$().on(evt, handler);
    return this;
};

SVGElement.prototype.off = function(evt) {
    this.$().off(evt);
    return this;
};

SVGElement.prototype.trigger = function(evt) {
    this.$().trigger(evt);
    return this;
};

module.exports = SVGElement;
