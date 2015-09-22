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
        this.cfg.dragMove(dx,dy);
    }
};

DragContext.prototype.dragEnd = function(evt) {
    if(this.dxSum > 0 || this.dySum > 0) {
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

    var dragAlignment = cfg.dragAlignment || new DragAlignment(that.diagram,
            function() {
               return [
                    {source:[that.getOrientation()], target:that.getTransitionAlignmentTargets()},
                    {source:[that.getCenter()], target:that.getNodeAlignmentTargets()},
                ];

            });

    var dragConfig = {
        cursor: 'all-scroll',
        dragAlignment: dragAlignment ,
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
        }
    };

    this.root.draggable(dragConfig, this.getDragElement());

    //Simulates an drag start event
    this.initDrag = this.root.initDrag;

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    this.triggerDrag = this.root.triggerDrag;

    return this;
};

Node.prototype.getTransitionAlignmentTargets = function() {
    return this.getOrientations();
};

Node.prototype.getNodeAlignmentTargets = function() {
    var result = [];
    var that = this;

    object.each(this.diagram.getNodes(), function(key, node) {
        if(node.id !== that.id) {
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

