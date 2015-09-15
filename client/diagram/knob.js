var object = require('../util/object');
var app = require('../util/app');
var dom = require('../dom/dom');
var Transform = require('../svg/transform');

var DEFAULT_FILL = 'black';
var DEFAULT_FILL_SELECT = 'green';

var Knob = function(diagram, p, cfg) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.selected = false;
    this.hideDocking = false;

    if(object.isDefined(cfg)) {
        this.group = cfg.group;
    }

    if(p.x && p.y) {
        this.init(p);
    }
};

Knob.prototype.clearRelativeOrientation = function() {
    delete this.relativePosition;
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

Knob.prototype.init = function(position) {
    this.node = this.diagram.createDocking(position, this.group);
    this.node.isKnob = true;
    var that = this;
    this.node.additions['knob'] = {
        deselect : function() {
            that.deselect();
        },
        select : function() {
            that.select();
        },
        remove : function() {
            that.remove();
        }
    };
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
    this.hideDocking = true;
    if(!this.selected) {
        this.node.root.hide();
    }
};

Knob.prototype.show = function() {
    this.hideDocking = false;
    this.node.root.show();
};

Knob.prototype.select = function() {
    this.selected = true;
    this.node.root.fill(DEFAULT_FILL_SELECT);
    this.node.root.show();
    return this;
};

Knob.prototype.deselect = function() {
    this.node.root.fill(DEFAULT_FILL);
    this.selected = false;
    if(this.hideDocking && !this.selected) {
        this.node.root.hide();
    }
    return this;
};

Knob.prototype.selectable = function() {
    var that = this;
    this.isSelectable = true;
    this.node.root.hoverable({
        in: function() {
            that.node.root.show();
            that.node.root.fill(DEFAULT_FILL_SELECT);
        },
        out: function() {
            if(!that.selected && !this.selected) {
                if(that.hideDocking) {
                    that.node.root.hide();
                }
                that.node.root.fill(DEFAULT_FILL);
            }
        }
    });
};

Knob.prototype.onRemove = function(handler) {
    this.removeHandler = handler;
};

Knob.prototype.remove = function() {
    if(object.isDefined(this.removeHandler)) {
        this.removeHandler.apply();
    }
};

Knob.prototype.move = function(dx,dy) {
    this.node.root.move(dx,dy);
};

Knob.prototype.moveTo = function(x,y) {
    this.node.root.moveTo(x,y);
};

Knob.prototype.toString = function() {
    return '('+this.x()+'/'+this.y()+')';
};

module.exports = Knob;