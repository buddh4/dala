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

SVGShape.prototype.scale = function(scale) {
    var result = this.getTransformation().scale(scale);

    if(result instanceof Transform) {
        // The trnaslate setter returns the Transform object so we reset thestyle
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

SVGShape.prototype.stroke = function(color) {
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

SVGShape.prototype.x = function() {
    return this.translatedX(0);
};

SVGShape.prototype.y = function() {
    return this.translatedY(0);
};

SVGElement.prototype.position = function() {
    var that = this;
    return {
        x : that.x(),
        y : that.y()
    };
};

SVGShape.prototype.getCenter = function() {
    return {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
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
SVGElement.prototype.height = function() {
    return this.getBBox().height;
};

SVGElement.prototype.width = function() {
    return this.getBBox().width;
};

SVGElement.prototype.getBottomY = function() {
    return this.y() + this.height();
};

SVGElement.prototype.getRightX = function() {
    return this.x() + this.width();
};

module.exports = SVGShape;