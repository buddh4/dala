var object = require('../util/object');
var app = require('../util/app');
var dom = require('../dom/dom');
var Transform = require('../svg/transform');

var DEFAULT_FILL = 'silver';
var DEFAULT_FILL_SELECT = 'green';
var DEFAULT_OPACITY = 0.5;
var DEFAULT_KNOB_RADIUS = 5;

var Knob = function(diagram, p, cfg, group) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.config = cfg;
    this.group = group;

    if(p.x && p.y) {
        this.init(p, cfg);
    }
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
    var config = object.extend({r : DEFAULT_KNOB_RADIUS}, cfg);
    this.node = this.diagram.createKnob(position, this.group, config);
    this.node.knob = this;

    var that = this;
    this.on('select', function() {
        that.selected = true;
        that.activeStyle();
    }).on('deselect', function() {
        that.selected = false;
        if(!that.selected) {
            that.inactiveStyle();
        }
    });
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
};

Knob.prototype.initDrag = function(evt) {
    this.node.initDrag(evt);
};

Knob.prototype.hide = function() {
    if(!this.node.selected) {
        this.node.root.hide();
    }
};

Knob.prototype.show = function(opacity) {
    opacity = opacity || DEFAULT_OPACITY;
    this.node.root.show(DEFAULT_OPACITY);
};

Knob.prototype.select = function() {
    this.node.trigger('select');
    return this;
};

Knob.prototype.deselect = function() {
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
    this.fill(DEFAULT_FILL_SELECT);
    this.show();
};

Knob.prototype.deselect = function() {
    this.inactiveStyle();
    return this;
};

Knob.prototype.inactiveStyle = function() {
    this.fill(DEFAULT_FILL);
    this.show();
};

Knob.prototype.hoverable = function(handler) {
    var that = this;
    handler = handler || {};
    this.node.root.hoverable({
        in: function() {
            that.activeStyle();
            if(handler && handler.in) {
                handler.in(that);
            }
        },
        out: function() {
            if(!that.selected ) {
                that.inactiveStyle();
                if(handler && handler.out) {
                    handler.out(that);
                }
            }
        }
    });
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