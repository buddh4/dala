var object = require('../util/object');
var dom = require('../util/dom');
var Transform = require('../svg/transform');
var event = require('../core/event');

var DEFAULT_FILL = 'black';
var DEFAULT_FILL_SELECT = 'green';

var Docking = function(svg, x,y, cfg) {
    this.svg = svg;
    this.selected = false;
    this.hideDocking = false;

    if(object.isDefined(x.x)) {
        cfg = y;
        y = x.y;
        x = x.x;
    }

    if(object.isDefined(cfg)) {
        this.group = cfg.group;
    }

    if(object.isDefined(x) && object.isDefined(y)) {
        this.init(x,y, cfg);
    }
};

Docking.prototype.clearRelativeOrientation = function() {
    delete this.relativePosition;
};

Docking.prototype.relativeOrientation = function(position) {
    if(position) {
        this.relativePosition = {
            x : position.x,
            y : position.y
        };
    }
    return this.relativePosition;
};

Docking.prototype.init = function(x,y, cfg) {
    this.marker = this.svg.circle({
        cx: 0,
        cy: 0,
        r: 3,
        'class': 'docking',
        style: 'stroke:none;fill:'+DEFAULT_FILL,
        transform: new Transform().translate(x, y)
    });

    event.trigger('docking_added', this);

    if(object.isDefined(this.group)) {
        this.svg.addToGroup(this.group, this.marker);
    }
};

Docking.prototype.x = function() {
    return this.marker.x();
};

Docking.prototype.y = function() {
    return this.marker.y();
};

Docking.prototype.position = function() {
    return {
        x : this.x(),
        y : this.y()
    };
};

Docking.prototype.draggable = function(handler) {
    this.marker.draggable(handler);
    this.triggerDrag = function(dx,dy) {
        this.marker.triggerDrag(dx,dy);
    };
};

Docking.prototype.initDrag = function(evt) {
    this.marker.initDrag(evt);
};

Docking.prototype.hide = function() {
    this.hideDocking = true;
    if(!this.selected) {
        this.marker.hide();
    }
};

Docking.prototype.show = function() {
    this.hideDocking = false;
    this.marker.show();
};

Docking.prototype.select = function() {
    this.selected = true;
    this.marker.fill(DEFAULT_FILL_SELECT);
    this.marker.show();
    return this;
};

Docking.prototype.deselect = function() {
    this.marker.fill(DEFAULT_FILL);
    this.selected = false;
    if(this.hideDocking && !this.selected) {
        this.marker.hide();
    }
    return this;
};

Docking.prototype.selectable = function() {
    var that = this;
    this.isSelectable = true;
    this.marker.hoverable({
        in: function() {
            that.marker.show();
            that.marker.fill(DEFAULT_FILL_SELECT);
        },
        out: function() {
            if(!that.selected && !this.selected) {
                if(that.hideDocking) {
                    that.marker.hide();
                }
                that.marker.fill(DEFAULT_FILL);
            }
        }
    });

    this.marker.mousedown(function(evt) {
        event.trigger('docking_select', that, evt);
    });
};

Docking.prototype.onRemove = function(handler) {
    this.removeHandler = handler;
};

Docking.prototype.remove = function() {
    this.marker.remove();
    event.trigger('docking_removed', this);
    if(object.isDefined(this.removeHandler)) {
        this.removeHandler.apply();
    }
};

Docking.prototype.move = function(dx,dy) {
    this.marker.move(dx,dy);
};

Docking.prototype.moveTo = function(x,y) {
    this.marker.moveTo(x,y);
};

Docking.prototype.toString = function() {
    return '('+this.x()+'/'+this.y()+')';
};

module.exports = Docking;