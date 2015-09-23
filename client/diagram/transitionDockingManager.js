var util = require('../util/util');
var Knob = require('./Knob');

var TransitionDocking = function(dockingManager, node, mouse) {
    this.node = node;
    this.transition = dockingManager.transition;
    this.dockingManager = dockingManager;
    this.initOrientation(mouse);
};

TransitionDocking.prototype.initOrientation = function(startPosition, dragAlignment) {
    var that = this;
    var orientationPosition = _getStartOrientationPosition(this.node, startPosition);

    this.orientationKnob = new Knob(this.transition.diagram, orientationPosition, {r:3, fill:'orange'}, this.transition.group);
    this.orientationKnob.draggable({
            restrictionX : function(evt, dx, dy) {
                var currentX = this.xBBox();
                var currentRightX = this.getRightX();
                return ((currentX > that.node.x() || dx > 0)&& (currentRightX < that.node.getRightX() || dx < 0))? dx : 0;
            },
            restrictionY : function(evt, dx, dy) {
                var currentY = this.yBBox();
                var currentBottomY = this.getBottomY();
                return ((currentY > that.node.y() || dy > 0) && (currentBottomY < that.node.getBottomY() || dy < 0))? dy : 0;
            },
            dragAlignment : function() {
                var otherDocking = (that.dockingManager.startDocking === that)
                                    ? that.dockingManager.endDocking : that.dockingManager.startDocking;
                return [
                    {source:[that.position()], target: [that.node.getCenter(), otherDocking.position()]}
                ];
            },
            dragMove : function(evt, dx ,dy) {
                that.transition.update();
            }
        });
};

var _getStartOrientationPosition = function(node, mouse) {
    var orientationType = (node.config.docking && node.config.docking.orientation)
                          ? node.config.docking.orientation : 'center';
    switch(orientationType.toUpperCase()) {
        case 'FREE':
            return mouse;
        case  'CENTER':
        default:
            return node.getCenter();
    }

};

TransitionDocking.prototype.position = function() {
    return this.orientationKnob.position();
};

TransitionDocking.prototype.triggerDrag = function(dx, dy) {
    this.orientationKnob.triggerDrag(dx,dy);
};

TransitionDocking.prototype.calculateDockingPosition = function(outerOrientation) {
    return this.node.getDockingPosition(outerOrientation, this.position());
};

TransitionDocking.prototype.inactiveStyle = function() {
    this.orientationKnob.inactiveStyle();
};

TransitionDocking.prototype.hide = function() {
    this.orientationKnob.hide();
};

TransitionDocking.prototype.remove = function() {
    this.orientationKnob.remove();
};

/**
 *
 */
var TransitionDockingManager = function(transition, startNode, mouse) {
    this.diagram = transition.diagram;
    this.transition = transition;
    this.setStartNode(startNode, mouse);

    var that = this;
    this.transition.additions['dockingManager'] = {
        select : function() {
            that.inactiveStyle();
        },
        deselect : function() {
            that.hide();
        },
        hover : function() {
            that.inactiveStyle();
        },
        hoverOut : function() {
            if(!that.transition.selected) {
                that.knobManager.hide();
            }
        }

    };
};

TransitionDockingManager.prototype.setStartNode = function(node, mousePosition) {
    if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
    }

    this.startNode = node;
    this.startNode.addOutgoingTransition(this.transition);
    this.startDocking = new TransitionDocking(this, node, mousePosition);
    this.setStartNodeFeature();
};

TransitionDockingManager.prototype.setStartNodeFeature = function() {
    this.transition.group.dala('start', this.startNode.id);
};

TransitionDockingManager.prototype.calculateStart = function(outerOrientation) {
    return this.startDocking.calculateDockingPosition(outerOrientation);
};

TransitionDockingManager.prototype.dragStartOrientation = function(dx,dy) {
    this.startDocking.triggerDrag(dx,dy);
};

TransitionDockingManager.prototype.setEndNode = function(node, mousePosition) {
    if(this.endNode) {
        this.endNode.removeIncomingTransition(this.transition);
    }

    this.endNode = node;
    this.endNode.addIncomingTransition(this.transition);
    this.endDocking = new TransitionDocking(this, node, mousePosition);
    this.setEndNodeFeature();
};

TransitionDockingManager.prototype.dragEndOrientation = function(dx,dy) {
    this.endDocking.triggerDrag(dx,dy);
};

TransitionDockingManager.prototype.calculateEnd = function(outerOrientation) {
    return this.endDocking.calculateDockingPosition(outerOrientation);
};

TransitionDockingManager.prototype.setEndNodeFeature = function() {
    if(this.endNode) {
        this.transition.group.dala('end', this.endNode.id);
    }
};

TransitionDockingManager.prototype.getStartDockingLocation = function() {
    if(this.startNode) {
        return this.startNode.getRelativeLocation(this.startKnob.position());
    }
};

TransitionDockingManager.prototype.getEndDockingLocation = function() {
    if(this.endNode) {
        return this.endNode.getRelativeLocation(this.endKnob.position());
    }
};

TransitionDockingManager.prototype.inactiveStyle = function() {
    this.startDocking.inactiveStyle();
    if(this.endDocking) {
        this.endDocking.inactiveStyle();
    }
};

TransitionDockingManager.prototype.hide = function() {
    this.startDocking.hide();
    if(this.endDocking) {
        this.endDocking.hide();
    }
};

TransitionDockingManager.prototype.remove = function() {
    if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
        this.startDocking.remove();
    }

    if(this.endNode) {
        this.endNode.removeIncomingTransition(this.transition);
        this.endDocking.remove();
    }
};

module.exports = TransitionDockingManager;