require('../svg/draggable');
var util = require('../util/util');
var DragAlignment = require('./dragAlignment');
var Node = require('./node');

var dom = util.dom;
var object = util.object;

Node.prototype.draggable = function() {
    var that = this;

    this.triggerDrag = function(dx,dy) {
        this.root.triggerDrag(dx,dy);
    };

    this.root.draggable({
            cursor: 'all-scroll',
            dragAlignment : new DragAlignment(that.diagram,
                {
                    getSource: function() {
                        //We align the center to all outter transition orientations
                        //TODO: This will not work for relative transitions implement a dragAlignment with multiple {source, [target]} alignments
                        return that.getOrientation();
                    },
                    getTargets: function() {
                        return that.getAlignmentTargets();
                    }
                }
            ),
            dragStart : function(evt) {
                that.dxSum = 0;
                that.dySum = 0;
            },
            dragMove : function(evt, dx , dy) {
                that.executeAddition('drag');
                //TODO: perhaps fire every 20 px a node_drag event...
                that.dxSum += dx;
                that.dySum += dy;
                if(!evt.triggerEvent) {
                    that.diagram.selectionMgr.fireDrag(that, dx, dy);
                }
            },
            dragEnd : function(evt) {
                if(that.dxSum > 0 || that.dySum > 0) {
                    that.event.trigger('node_droped', that);
                }
            },
            getScale: function() {
                return that.diagram.scale;
            }},
        this.getDragElement());

    return this;
};

Node.prototype.getAlignmentTargets = function() {
    return this.getOrientations();
};

Node.prototype.getDragElement = function() {
    return dom.findIncludeSelf(this.getRootSVG().instance(), this.getNodeSelector('.dragRoute_'));
};

