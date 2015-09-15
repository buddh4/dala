require('../svg/draggable');
var util = require('../util/util');
var DragAlignment = require('./dragAlignment');
var Node = require('./node');

var dom = util.dom;
var object = util.object;

var lastDrag;

var DragContext = function(node, cfg) {
    this.cfg = cfg || {};
    this.node = node;
    this.event = node.diagram.event;
};

DragContext.prototype.dragStart = function(evt) {
    this.dxSum = 0;
    this.dySum = 0;
    this.from = this.node.position();
    delete this.to;
    if(this.cfg.dragStart) {
        this.cfg.dragStart(evt);
    }
    this.event.trigger('drag_start', {context : this});
};

DragContext.prototype.dragMove = function(evt, dx, dy) {
    this.dxSum += dx;
    this.dySum += dy;
    if(this.cfg.dragMove) {
        this.cfg.dragMove(dx,dy);
    }
    if(!evt.triggerEvent) {
        this.event.trigger('drag_move', {context: this, dx: dx, dy: dy});
    } else {
        this.event.trigger('drag_move_trigger', {context: this, dx: dx, dy: dy});
    }
};

DragContext.prototype.dragEnd = function(evt) {
    if(this.dxSum > 0 || this.dySum > 0) {
        this.to = this.node.position();
        if (this.cfg.dragEnd) {
            this.cfg.dragEnd(evt);
        }
        this.event.trigger('drag_end', {context: this});
    }
};

DragContext.prototype.clone = function() {
    return {
        dxSum : this.dxSum,
        dySum : this.dySum,
        from : this.from,
        to : this.to
    }
};

//TODO: dragBeforeMove delegation

Node.prototype.draggable = function(cfg) {
    cfg = cfg || {};
    var that = this;
    this.dragContext = new DragContext(this, cfg);

    this.triggerDrag = function(dx,dy) {
        this.root.triggerDrag(dx,dy);
    };

    var dragAlignment = cfg.dragAlignment || new DragAlignment(that.diagram, {
                getSource: function() {
                    //We align the center to all outter transition orientations
                    //TODO: This will not work for relative transitions implement a dragAlignment with multiple {source, [target]} alignments
                    return that.getOrientation();
                },
                getTargets: function() {
                    return that.getAlignmentTargets();
                }
            }
        );

    var dragConfig = {
        cursor: 'all-scroll',
        dragAlignment: dragAlignment ,
        dragStart: function(evt) {
            that.dragContext.dragStart(evt);
            lastDrag = that.dragContext;
        },
        dragMove : function(evt, dx , dy) {
            that.executeAddition('drag');
            //TODO: perhaps fire every 20 px a node_drag event...
            that.dragContext.dragMove(evt, dx, dy);
        },
        dragEnd : function(evt) {
            that.dragContext.dragEnd(evt);
        },
        getScale: function() {
            return that.diagram.scale;
        }
    };

    this.root.draggable(dragConfig, this.getDragElement());

    //Simulates an drag start event
    this.initDrag = this.root.initDrag;

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    this.triggerDrag = this.root.triggerDrag;

    return this;
};

Node.prototype.getAlignmentTargets = function() {
    return this.getOrientations();
};

Node.prototype.getDragElement = function() {
    return dom.findIncludeSelf(this.getRootSVG().instance(), this.getNodeSelector('.dragRoute_'));
};

module.exports = {
    getLastDrag : function() {
        return lastDrag;
    }
}

