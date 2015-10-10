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
};

DragContext.prototype.dragStart = function(evt) {
    this.dxSum = 0;
    this.dySum = 0;
    this.from = this.node.position();
    delete this.to;
    if(this.cfg.dragStart) {
        this.cfg.dragStart(evt);
    }
};

DragContext.prototype.dragMove = function(evt, dx, dy) {
    this.dxSum += dx;
    this.dySum += dy;
    if(this.cfg.dragMove) {
        this.cfg.dragMove(evt, dx,dy);
    }
};

DragContext.prototype.dragEnd = function(evt) {
    if(this.dxSum != 0 || this.dySum != 0) {
        this.to = this.node.position();
        if (this.cfg.dragEnd) {
            this.cfg.dragEnd(evt);
        }
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

    var dragConfig = {
        cursor: 'all-scroll',
        dragStart: function(evt) {
            that.dragContext.dragStart(evt);
            lastDrag = that.dragContext;
            that.exec('dragStart', [evt]);
        },
        dragMove : function(evt, dx , dy) {
            that.dragContext.dragMove(evt, dx, dy);
            //that.exec('dragMove', [dx,dy, evt]);
            //We skip the the domEvent dragMove here cause of performance...
            that.exec('dragMove', [dx,dy, evt], true);

        },
        dragEnd : function(evt) {
            that.dragContext.dragEnd(evt);
            that.exec('dragEnd', [evt]);
        },
        getScale: function() {
            return that.diagram.scale;
        },
        restrictionX : cfg.restrictionX,
        restrictionY : cfg.restrictionY,
        cursor : cfg.cursor
    };

    if(!cfg.preventAlignment) {
        var dragAlignment;
        if(cfg.dragAlignment) {
            dragAlignment = (cfg.dragAlignment instanceof DragAlignment)
                ? cfg.dragAlignment : new DragAlignment(this.diagram, cfg.dragAlignment);
        } else {
            dragAlignment = new DragAlignment(that.diagram,
                function() {
                    var alignments = that.getTransitionAlignmentTargets();
                    alignments.push({source:[that.getCenter()], target:that.getNodeAlignmentTargets()});
                    return alignments;
                });
        }
        dragConfig.dragAlignment = dragAlignment;
    }


    this.root.draggable(dragConfig, this.getDragElement());

    //Simulates an drag start event
    this.initDrag = this.root.initDrag;

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    this.triggerDrag = this.root.triggerDrag;

    return this;
};

Node.prototype.getTransitionAlignmentTargets = function() {
    return this.additions.transition.getTransitionAlignmentTargets();
};

Node.prototype.getNodeAlignmentTargets = function() {
    var result = [];
    var that = this;

    object.each(this.diagram.getNodes(), function(key, node) {
        if(node.id !== that.id && !node.knob) {
            result.push(node.getCenter());
        }
    });

    return result;
};

Node.prototype.getDragElement = function() {
    return dom.findIncludeSelf(this.getRootSVG().instance(), this.getNodeSelector('.dragRoute_'));
};

module.exports = {
    getLastDrag : function() {
        return lastDrag;
    }
}

