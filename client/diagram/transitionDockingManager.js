var util = require('../util/util');
var Knob = require('./Knob');
var dockingType = require('./docking');

var TransitionDocking = function(dockingManager, node, mouse, type) {
    this.node = node;
    this.type = type;
    this.transition = dockingManager.transition;
    this.dockingManager = dockingManager;
    if(!node.knob) {
        this.initOrientation(mouse);
    }
};

TransitionDocking.prototype.initOrientation = function(startPosition) {
    var that = this;
    var orientationPosition = _getStartOrientationPosition(this.node, startPosition);

    this.orientationKnob = new Knob(this.transition.diagram, orientationPosition, {'fill-active':'orange', fill:'orange', selectable:false}, this.transition.group);
    this.orientationKnob.draggable({
            restrictionX : function(evt, dx, dy) {
                var dragCenter = that.orientationKnob.position();
                dragCenter.x += dx;
                return (dockingType.checkOrientationBoundary(that.node, dragCenter)) ? dx : 0;
                //return ((this.xBBox() > that.node.x() || dx > 0)&& (this.getRightX() < that.node.getRightX() || dx < 0))? dx : 0;
            },
            restrictionY : function(evt, dx, dy) {
                var dragCenter = that.orientationKnob.position();
                dragCenter.y += dy;
                return (dockingType.checkOrientationBoundary(that.node, dragCenter)) ? dy : 0;
                //return ((this.yBBox() > that.node.y() || dy > 0) && (this.getBottomY() < that.node.getBottomY() || dy < 0))? dy : 0;
            },
            dragAlignment : function() {
                //We align our knob center to the node center and also to our transition alignment point
                var alignment = (that.type === 'start')
                    ? that.transition.getStartAlignment() : that.transition.getEndAlignment();
                alignment.target.push(that.node.getCenter());
                return [alignment];
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
    if(this.orientationKnob) {
        return this.orientationKnob.position();
    } else {
        return this.node.getCenter();
    }
};

TransitionDocking.prototype.triggerDrag = function(dx, dy) {
    if(this.orientationKnob) {
        this.orientationKnob.triggerDrag(dx, dy);
    }
};

TransitionDocking.prototype.calculateDockingPosition = function(outerOrientation) {
    if(this.node.knob) {
        return this.node.getCenter();
    }
    return dockingType.calculateDockingPosition(this.node, outerOrientation, this.position());
};

TransitionDocking.prototype.inactiveStyle = function() {
    if(this.orientationKnob) {
        this.orientationKnob.inactiveStyle();
    }
};

TransitionDocking.prototype.hide = function() {
    if(this.orientationKnob) {
        this.orientationKnob.hide();
    }
};

TransitionDocking.prototype.remove = function() {
    if(this.orientationKnob) {
        this.orientationKnob.remove();
    }
};

var TransitionDockingManager = function(transition, startNode, mouse) {
    this.diagram = transition.diagram;
    this.transition = transition;
    this.setStartNode(startNode, mouse);

    var that = this;
    this.transition.additions['dockingManager'] = {
        setEndNode : function(node, mousePosition) {
            that.setEndNode(node, mousePosition);
        },
        setStartNode : function(node) {
            that.setStartNode(node);
        },
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
                that.hide();
            }
        }

    };
};

TransitionDockingManager.prototype.setStartNode = function(node, mousePosition) {
    if(this.startNode && this.startNode.id === node.id) {
        return;
    } else if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
    }

    if(this.startDocking) {
        this.startDocking.remove();
    }

    this.startNode = node;
    this.startNode.addOutgoingTransition(this.transition);
    this.startDocking = new TransitionDocking(this, node, mousePosition, 'start');
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

    if(this.endDocking) {
        this.endDocking.remove();
    }

    this.endNode = node;
    this.endNode.addIncomingTransition(this.transition);
    this.endDocking = new TransitionDocking(this, node, mousePosition, 'end');
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