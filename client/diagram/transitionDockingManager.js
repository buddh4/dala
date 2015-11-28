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
    var orientationPosition = _getStartOrientationPosition(this.node, startPosition);
    this.knob = new Knob(this.transition.diagram, orientationPosition, {'cssClass':'orientationKnob', 'fill-active':'orange', fill:'orange', selectable:false}, this.transition.group);
    this.initKnobEvents();
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

TransitionDocking.prototype.initKnobEvents = function() {
    var that = this;
    this.knob.draggable({
        restrictionX : function(evt, dx, dy) {
            var dragCenter = that.knob.position();
            dragCenter.x += dx;
            return that.node.overlays(dragCenter) ? dx : 0;
            //return (dockingType.checkOrientationBoundary(that.node, dragCenter)) ? dx : 0;
        },
        restrictionY : function(evt, dx, dy) {
            var dragCenter = that.knob.position();
            dragCenter.y += dy;
            return that.node.overlays(dragCenter) ? dy : 0;
            //return (dockingType.checkOrientationBoundary(that.node, dragCenter)) ? dy : 0;
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

TransitionDocking.prototype.position = function() {
    if(this.knob) {
        return this.knob.position();
    } else {
        return this.node.getCenter();
    }
};

TransitionDocking.prototype.triggerDrag = function(dx, dy) {
    if(this.knob) {
        this.knob.triggerDrag(dx, dy);
    }
};

TransitionDocking.prototype.calculateDockingPosition = function(outerOrientation) {
    if(this.node.knob) {
        return this.node.getCenter();
    }
    return dockingType.calculateDockingPosition(this.node, outerOrientation, this.position());
};

TransitionDocking.prototype.inactiveStyle = function() {
    if(this.knob) {
        this.knob.inactiveStyle();
    }
};

TransitionDocking.prototype.hide = function() {
    if(this.knob) {
        this.knob.hide();
    }
};

TransitionDocking.prototype.remove = function() {
    if(this.knob) {
        this.knob.remove();
    }
};

var TransitionDockingManager = function(transition, startNode, mouse) {
    this.diagram = transition.diagram;
    this.transition = transition;

    if(startNode) {
        this.setStartNode(startNode, mouse);
    }

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

TransitionDockingManager.prototype.activate = function() {
    var currentOrientationNodes = this.transition.group.$().children('.orientationKnob');
    this.setStartNode(this.diagram.getNodeById(this.getStartNodeFeature()));
    this.setEndNode(this.diagram.getNodeById(this.getEndNodeFeature()));
    var that = this;
    $.each(currentOrientationNodes, function(index, orientationNode) {
        var svgNode = $.svg(orientationNode);
        if(that.startNode.overlays(svgNode.position())) {
            that.startDocking.knob.moveTo(svgNode.position());
        } else if(that.endNode.overlays(svgNode.position())) {
            that.endDocking.knob.moveTo(svgNode.position());
        } else {
            console.warn('Detected orientation knob not hovering a start/end node.');
        }
        svgNode.remove();
    });
    return this;
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

TransitionDockingManager.prototype.getStartNodeFeature = function() {
    return this.transition.group.dala('start');
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

TransitionDockingManager.prototype.getEndNodeFeature = function() {
    return this.transition.group.dala('end');
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