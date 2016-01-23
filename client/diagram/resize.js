var util = require('../util/util');
var event = require('../core/event');
var Command = require('../core/command');
var Transform = require('../svg/transform');
var SVG = require('../svg/svg');
var DragConfig = require('../svg/dragConfig');
var Knob = require('./knob');

var object = util.object;
var dom = util.dom;

// Used to identify the different knobs from north west clockwise
var KNOB_NW = 0;
var KNOB_N = 1;
var KNOB_NE = 2;
var KNOB_E = 3;
var KNOB_SE = 4;
var KNOB_S = 5;
var KNOB_SW = 6;
var KNOB_W = 7;


// specifies the space between node and resize knob
var DIF = 3;

// specifies the size of a knob
var SIZE = 5;

// used for calculating the position of the knobs
var DIF_REL = DIF + SIZE;

var Resize = function(node, diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.knobs = [];
    this.node = node;
    this.config = this.node.template.config.resize;
};

/**
 * Renders the knobs around the node.
 */
Resize.prototype.activateKnobs = function() {
    var positions = this.calculateKnobPosition();

    this.group = this.diagram.svg.g({}).translate(this.node.position()).rotate(this.node.rotate());

    //Initialize the different knobs with different drag restricitons
    this.createKnob(KNOB_NW,positions[KNOB_NW],new DragConfig());
    this.createKnob(KNOB_N, positions[KNOB_N],new DragConfig().yOnly());
    this.createKnob(KNOB_NE,positions[KNOB_NE],new DragConfig());
    this.createKnob(KNOB_E, positions[KNOB_E],new DragConfig().xOnly());
    this.createKnob(KNOB_SE,positions[KNOB_SE],new DragConfig());
    this.createKnob(KNOB_S, positions[KNOB_S], new DragConfig().yOnly());
    this.createKnob(KNOB_SW,positions[KNOB_SW],new DragConfig());
    this.createKnob(KNOB_W, positions[KNOB_W],new DragConfig().xOnly());


};

/**
 * Renders a knob to the given position and configures the drag and hover
 * logic. The total drag amount of one drag is can be acessed through
 * this.dx and this.dy.
 */
Resize.prototype.createKnob = function(knob, p, dragCfg) {
    var that = this;
    // Initialize draglogic
    var dragHook = dragCfg
        .dragStart(function(evt) {
            that.dx = 0;
            that.dy = 0;
            that.dragKnob = knob;
            that.knobs[knob].fill('green');
        })
        .dragMove(function(evt, dx, dy) {
            //We keep track of the total drag movement
            dx = object.isOneOf(knob, KNOB_NW, KNOB_W, KNOB_SW) ? -1 * dx : dx;
            dy = object.isOneOf(knob, KNOB_NW, KNOB_N, KNOB_NE) ? -1 * dy : dy;

            that.dx += dx;
            that.dy += dy;

            that.resize(dx,dy);
        })
        .dragEnd(function(evt) {
            that.event.trigger('node_resized', that.node);
            that.knobs[knob].fill('black');
        })
        .getScale(function() {
            return that.diagram.scale;
        }).get();

    dragHook.preventAlignment = true;

    // Render the knob on stage
    this.knobs[knob] = new Knob(this.diagram, p, {type:'rect', fill:'black', 'fill-active':'black', stroke:'none', selectable:false, 'stroke-width':0, size:SIZE, 'fill-opacity':1}, this.group)
        .draggable(dragHook).hoverable();
};

/**
 * Determines all svg elements participating in the resize process, which
 * are configured in the resize config bind attribute
 */
Resize.prototype.getResizeElements = function() {
    var result = [];
    var that = this;
    object.each(this.config, function(index, value) {
        if(value.bind === 'root') {
            result[index] = that.node.root;
        } else {
            var svgSelector = that.node.getNodeSelector(value.bind);
            result[index] = $.qCache().svg(svgSelector);
        }
    });
    return result;
};

/**
 * Updates the resize logic
 */
Resize.prototype.update = function() {
    this.resize(0,0);
};

/**
 * Resizes the node by applying the configured resize logic to the inner
 * svg elements of the nodes. The dx and dy values specifie the resize
 * amount of the x- and y-axis. After the actual resize process the knobs
 * are aligned to the new node dimension.
 */
Resize.prototype.resize = function(dx, dy) {
    this.updateNodes(dx,dy);
    this.updateKnobs(true);
};

/**
 * Aligns a single knob to the
 * @param {type} resizeKnob
 * @returns {undefined}
 */
Resize.prototype.updateKnobs = function(resizeKnob) {
    if(object.isDefined(this.group)) {
        if(object.isDefined(resizeKnob) && resizeKnob) {
            var positions = this.calculateKnobPosition();
            this.knobs[KNOB_NW].moveTo(positions[KNOB_NW]);
            this.knobs[KNOB_N].moveTo(positions[KNOB_N]);
            this.knobs[KNOB_NE].moveTo(positions[KNOB_NE]);
            this.knobs[KNOB_E].moveTo(positions[KNOB_E]);
            this.knobs[KNOB_SE].moveTo(positions[KNOB_SE]);
            this.knobs[KNOB_S].moveTo(positions[KNOB_S]);
            this.knobs[KNOB_SW].moveTo(positions[KNOB_SW]);
            this.knobs[KNOB_W].moveTo(positions[KNOB_W]);
            this.node.exec('resize');
        } else {
            //If the flag is not set we just do an update probably from simple node drag/drop
            this.group.translate(this.node.position());
        }
    }
};

Resize.prototype.calculateKnobPosition = function() {
    var sizeDifsum = (SIZE + DIF)
    var left = -1 * sizeDifsum;
    var top = left;
    var right = this.node.width() + DIF;
    var centerX = right / 2 - (sizeDifsum / 2);
    var bottom = this.node.height() + DIF;
    var centerY = bottom / 2 - (sizeDifsum / 2);

    var result = [];
    result[KNOB_NW] = {x:left, y:top};
    result[KNOB_N] = {x:centerX, y:top};
    result[KNOB_NE] = {x:right, y:top};
    result[KNOB_E] = {x:right, y:centerY};
    result[KNOB_SE] = {x:right, y:bottom};
    result[KNOB_S] = {x:centerX, y:bottom};
    result[KNOB_SW] = {x:left, y:bottom};
    result[KNOB_W] = {x:left, y:centerY};
    return result;

};

Resize.prototype.removeKnobs = function() {
    if(object.isDefined(this.group)) {
        this.group.remove();
    }
    delete this.group;
};

Resize.prototype.updateNodes = function(dx,dy) {

    if(!object.isDefined(this.resizeElements)) {
        this.resizeElements = this.getResizeElements();
    }

    var that = this;
    object.each(this.resizeElements, function(index, element) {
        that.updateNode(index,element,dx,dy);
    });

    if(!object.isDefined(dx)) {
        return;
    }

    var alignX = object.isOneOf(this.dragKnob, KNOB_NW, KNOB_W, KNOB_SW) ? dx * -1 : 0;
    var alignY = object.isOneOf(this.dragKnob, KNOB_NW, KNOB_N, KNOB_NE) ? dy * -1 : 0;
    this.node.root.move(alignX, alignY);
    this.group.move(alignX, alignY);
};

Resize.prototype.updateNode = function(index, element, dx, dy) {
    dx = (!object.isDefined(dx))? 0 : dx;
    dy = (!object.isDefined(dy))? 0 : dy;

    var elementConfig = this.config[index];
    if(object.isDefined(elementConfig.value)) {
        //TODO: cleaner implementation
        //Scale with even alignment (default for type scale)
        if(elementConfig.value[0].type === 'scale' && elementConfig.even) {
            var d = util.math.minMax(dx,dy).max;
            this.setResize(element, elementConfig, elementConfig.value[0], d, 'width');
        } else {
            if(elementConfig.value[0].type !== 'vertical') {
                this.setResize(element, elementConfig, elementConfig.value[0], dx, 'width');
            }
            //We just set one dimension for a circle
            if(elementConfig.value[0].type !== 'circle' || this.dragKnob === KNOB_S || this.dragKnob === KNOB_N) {
                this.setResize(element,elementConfig, elementConfig.value[1], dy, 'height');
            }
        }
    }

    if(object.isDefined(elementConfig.min)) {
        this.alignValueLimit(element, elementConfig.min[0], 'width', 'min');
        this.alignValueLimit(element, elementConfig.min[1], 'height', 'min');
    }

    if(object.isDefined(elementConfig.max)) {
        this.alignValueLimit(element, elementConfig.max[0], 'width', 'max');
        this.alignValueLimit(element, elementConfig.max[1], 'height', 'max');
    }

    if(object.isDefined(elementConfig.position)) {
        this.alignPosition(element, elementConfig);
    }
};

Resize.prototype.setResize = function(svgElement, elementConfig, setting, d, dimension) {
    switch(setting.type) {
        case 'static':
        case 'none':
            break;
        case 'vertical':
            var newY = parseInt(svgElement.attr('y2')) + d;
            svgElement.attr('y2', newY);
        case 'parent':
            //We could check the resize settings of the parent if this is static
            //we do not have to change anything when resizing.
            svgElement[dimension](1);

            //Get the dimension from parent node
            var parentVal = svgElement.$().parent().get(0).getBBox()[dimension];
            svgElement[dimension](parentVal + setting.value);
            break;
        case 'scale':
            if(elementConfig.even) {
                var scale = svgElement.scale()[0];
                var ratio = d / svgElement.getBBox().width;
                svgElement.scale(scale + ratio);
                $.each(svgElement.find('.alignScale'), function(index, svgToAlign) {
                    svgToAlign.scale(1 / svgElement.scale()[0]);
                });
                $.each(svgElement.find('.alignScaleStroke'), function(index, svgToAlign) {
                    var current = svgToAlign.strokeWidth();
                    var init = current * scale;
                    svgToAlign.strokeWidth(init / svgElement.scale()[0]);
                });
                break;
            } else {
                var scaleOld  = svgElement.scale();
                var scaleIndex = (dimension === 'height') ? 1 : 0;
                var scaleNew = scaleOld.slice();
                //Add the ratio from original size (without scale)
                scaleNew[scaleIndex] += (d / svgElement.getBBox()[dimension]);
                svgElement.scale(scaleNew[0], scaleNew[1]);
            }


            /**
             * TODO: search for inner elements with class .alignScaling and aling e.g. stroke-width, font-size..
             */
            break;
        default:
            var currentVal = svgElement[dimension](false);
            var newValue = (currentVal + d);
            if(newValue > 0) {
                svgElement[dimension]((currentVal + d));
            }
            break;
    }
};

Resize.prototype.alignValueLimit = function(svgElement, setting, dimension, type) {
    var value = setting.type;
    var limit;

    if(value === 'parent') {
        limit = svgElement.$().parent()[0].getBBox()[dimension];
    } else if(!isNaN(value)) {
        limit = parseInt(value);
    } else if(util.string.startsWith(value, '#')) {
        limit = $.qCache(this.node.getNodeSelector(value))[0].getBBox()[dimension];
    } else {
        return;
    }

    if(object.isDefined(setting.value)) {
        limit += setting.value;
    }

    var currentVal = svgElement[dimension](false)
    if((type === 'min' && currentVal < limit) || (type === 'max' && currentVal > limit)) {
        svgElement[dimension](limit);
    }
};

Resize.prototype.alignPosition = function(svgElement, elementConfig) {
    //var setting = elementConfig.
    //TODO: set alignElement id in config !
    var x = this.getAlignedPosition(svgElement,elementConfig.position[0], elementConfig.alignto, 'width' , 'x');
    var y = this.getAlignedPosition(svgElement,elementConfig.position[1], elementConfig.alignto, 'height', 'y');

    if(object.isDefined(x)) {
        svgElement.moveX(x);
    }

    if(object.isDefined(y)) {
        svgElement.moveY(y);
    }
};

Resize.prototype.getAlignedPosition = function(svgElement, settings, alignto, dimension, dimensionCoord) {
    switch(settings.type) {
        case 'none':
            break;
        case 'center':
            var alignSVG = this.getAlignElement(alignto, svgElement);
            if(object.isDefined(alignSVG)) {
                var alignVal = alignSVG.getCenter()[dimensionCoord];
                return alignVal - (svgElement[dimension]() / 2) - settings.value;
            };
            break;
        case 'relative':
            var $prevNode = svgElement.$().prev();
            if($prevNode.length) {
                var prevSVG = $.qCache().svg($prevNode);
                var prevVal = prevSVG[dimension]();
                var prevCoord = prevSVG[dimensionCoord]();
                return (prevCoord + prevVal) + settings.value;
            } else {
                //No prev sibling
                return 0;
            };
            break;
        case 'right':
        case 'bottom':
            var alignSVG = this.getAlignElement(alignto, svgElement);
            if(object.isDefined(alignSVG)) {
                var alignVal = (settings.type === 'right')? alignSVG.getRightX():alignSVG.getBottomY();
                return (alignVal - svgElement[dimension]()) - settings.value;
            };
            break;
        default:
            return;
    }
};

Resize.prototype.getAlignElement = function(alignto, svgElement) {
    var elementToAlign;
    //The alignto setting can be the parent-, root- or an explicit element default is the previous sibling element
    if(!alignto || alignto === 'prev') {
        elementToAlign = $.qCache().svg(svgElement.$().prev());
    }else if(alignto === 'parent') {
        elementToAlign = $.qCache().svg(svgElement.$().parent());;
    } else if(alignto === 'root') {
        elementToAlign = this.node.root;
    } else {
        elementToAlign = $.qCache().svg(this.node.getNodeSelector(alignto));
    }

    if(!elementToAlign) {
        console.warn('Could not determine alignto element "'+alignto+'" for node '+this.node.id);
    }

    return elementToAlign;
};

module.exports = Resize;
