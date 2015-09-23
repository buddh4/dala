var object = require('../util/object');
var app = require('../util/app');
var dom = require('../dom/dom');
var Transform = require('../svg/transform');

var DEFAULT_OPACITY = 0.5;
var DEFAULT_KNOB_RADIUS = 5;

var Knob = function(diagram, p, cfg, group) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.group = group;
    this.init(p, cfg);
};

Knob.prototype.clearRelativeOrientation = function() {
    delete this.relativePosition;
};

Knob.prototype.isSelected = function() {
    return this.node.selected;
};

Knob.prototype.relativeOrientation = function(position) {
    if(position) {
        this.relativePosition = {
            x : position.x,
            y : position.y
        };
    }
    return this.relativePosition;
};

Knob.prototype.init = function(position, cfg) {
    this.config = object.extend({radius : DEFAULT_KNOB_RADIUS}, cfg);
    this.node = this.diagram.createKnob(position, this.group, this.config);
    this.root = this.node.root;
    this.node.knob = this;

    var that = this;
    var select = cfg.select || function() {
            that.activeStyle();
        };

    var deselect = cfg.select || function() {
            if (!that.selected) {
                that.inactiveStyle();
            }
        }


    this.on('select', deselect).on('deselect', select);
    this.event.trigger('knob_created', this);
};

Knob.prototype.x = function() {
    return this.node.x();
};

Knob.prototype.y = function() {
    return this.node.y();
};

Knob.prototype.position = function() {
    return {
        x : this.x(),
        y : this.y()
    };
};

Knob.prototype.draggable = function(handler) {
    this.node.draggable(handler);
    this.triggerDrag = function(dx,dy) {
        this.node.triggerDrag(dx,dy);
    };
    return this;
};

Knob.prototype.initDrag = function(evt) {
    this.node.initDrag(evt);
};

Knob.prototype.hide = function() {
    if(!this.node.selected) {
        this.node.root.hide();
        this.node.root.attr('r', 0);
    }
};

Knob.prototype.show = function(opacity) {
    opacity = opacity || this.config['fill-opcaity'] || 1;
    this.node.root.show(DEFAULT_OPACITY);
    this.node.root.attr('r', this.config['radius']);
};

Knob.prototype.select = function() {
    this.selected = true;
    this.node.trigger('select');
    return this;
};

Knob.prototype.deselect = function() {
    this.selected = false;
    this.node.trigger('deselect');
    return this;
};

Knob.prototype.fill = function(color) {
    this.node.root.fill(color);
};

Knob.prototype.stroke = function(color) {
    this.node.root.stroke(color);
    this.node.root.strokeWidth(1);
};

Knob.prototype.activeStyle = function() {
    this.fill(this.config['fill-active']);
    this.show();
};

Knob.prototype.deselect = function() {
    this.inactiveStyle();
    return this;
};

Knob.prototype.inactiveStyle = function() {
    this.fill(this.config['fill']);
    this.show();
};

Knob.prototype.hoverable = function(handler) {
    var that = this;
    handler = handler || {};
    this.node.root.hoverable();
    return this;
};

Knob.prototype.on = function(handler, args) {
    this.node.on(handler, args);
    return this;
};

Knob.prototype.remove = function() {
    this.node.trigger('remove');
};

Knob.prototype.move = function(dx,dy) {
    this.node.root.move(dx,dy);
    this.node.trigger('move' [dx,dy]);
};

Knob.prototype.moveTo = function(x,y) {
    this.node.root.moveTo(x,y);
    this.node.trigger('moveTo', [x,y]);
};

Knob.prototype.toString = function() {
    return '('+this.x()+'/'+this.y()+')';
};

module.exports = Knob;