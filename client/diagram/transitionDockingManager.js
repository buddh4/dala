var util = require('../util/util');
var Knob = require('./Knob');
var dockingType = require('./docking');

var TransitionDocking = function(dockingManager, node, mouse, type) {
        this.node = node;
        this.type = type;
        this.transition = dockingManager.transition;
        this.dockingManager = dockingManager;
        if(!node.knob) {
            this.initOrientation(mouse, type);
        }
};

TransitionDocking.prototype.freeze = function() {
    if(this.knob) {
        this.knob.freeze();
        this.knob.config['fill-opacity'] = 0;
        this.knob.show();
    }
};

TransitionDocking.prototype.unfreeze = function() {
    if(this.knob) {
        this.knob.unfreeze();
        this.knob.config['fill-opacity'] = 0.5;
        this.knob.show();
    }
};

TransitionDocking.prototype.initOrientation = function(startPosition, type) {
    var orientationPosition = _getStartOrientationPosition(this.node, startPosition);
    this.knob = new Knob(this.transition.diagram, orientationPosition, {'cssClass':'orientationKnob '+type, 'fill-active':'orange', fill:'orange', selectable:false}, this.transition.group);
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
        },
        restrictionY : function(evt, dx, dy) {
            var dragCenter = that.knob.position();
            dragCenter.y += dy;
            return that.node.overlays(dragCenter) ? dy : 0;
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

TransitionDocking.prototype.position = function(withStroke) {
    if(this.knob) {
        return this.knob.position();
    } else {
        return this.node.getCenter();
    }
};

TransitionDocking.prototype.moveTo = function(p) {
    if(this.knob) {
        return this.knob.moveTo(p);
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
    this.setStartNode(this.diagram.getNodeById(this.getStartNodeFeature()));
    this.setEndNode(this.diagram.getNodeById(this.getEndNodeFeature()));

    //TODO activate knobs instead of replace !
    var startOrientationSvg = this.transition.group.$().children('.orientationKnob.start').svg()[0];
    if(startOrientationSvg) {
        this.startDocking.moveTo(startOrientationSvg.position());
        startOrientationSvg.remove();
    }

    var endOrientationSvg = this.transition.group.$().children('.orientationKnob.end').svg()[0];
    if(endOrientationSvg) {
        this.endDocking.moveTo(endOrientationSvg.position());
        startOrientationSvg.remove();
    }

    //TODO: add error handler what todo if we cannot activate the transition ? remove ?
    return this;
};

TransitionDockingManager.prototype.freeze = function() {
    if(this.startDocking) {
        this.startDocking.freeze();
    }

    if(this.endDocking) {
        this.endDocking.freeze();
    }
};

TransitionDockingManager.prototype.unfreeze = function() {
    if(this.startDocking) {
        this.startDocking.unfreeze();
    }

    if(this.endDocking) {
        this.endDocking.unfreeze();
    }
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

TransitionDockingManager.prototype.dump = function() {
    var result = 'DockingManager<br />\n';
    if(this.startNode) {
        result += 'StartNode:'+this.startNode.id+'<br />\n';
    } else {
        result += 'No StartNode<br />\n';
    }

    if(this.startDocking) {
        result += 'StartDocking:'+this.startDocking.position()+'<br />\n';
    } else {
        result += 'No StartDocking<br />\n';
    }

    if(this.endNode) {
        result += 'EndNode:'+this.endNode.id+'<br />\n';
    } else {
        result += 'No EndNode<br />\n';
    }

    if(this.endDocking) {
        result += 'EndDocking:'+this.endDocking.position()+'<br />\n';
    } else {
        result += 'No EndDocking<br />\n';
    }
    return result;
};

TransitionDockingManager.prototype.validate = function() {
    var $transitionGroup = this.transition.group.$();
    var $svgRoot = this.transition.diagram.getRootSVG().$();
    var result = [];

    if(this.startNode) {
        result['startNode'] = this.transition.diagram.nodeMgr.validateNode(this.startNode);
    }
    
    if(!this.startDocking) {
        result['startDocking'] = 'Error: No startDocking set!';
    } else if(this.startDocking.knob) {
        var startDocking = $transitionGroup.find('#'+this.startDocking.knob.node.id);
        if(!startDocking.length) {
            result['startDocking'] = 'Error: startDocking not found in transition group';
        } else if($transitionGroup.children('.orientationKnob.start').length != 1) {
            result['startDocking'] = 'Error: found invalid amount of startdocking nodes';
        }
    }

    if(this.endNode) {
        result['endNode'] = this.transition.diagram.nodeMgr.validateNode(this.endNode);
    }

    if(!this.endDocking) {
        result['endDocking'] = 'Error: No endDocking set!';
    } else if(this.endDocking.knob) {
        var endDocking = $transitionGroup.find('#'+this.endDocking.knob.node.id);
        if(!endDocking.length) {
            result['endDocking'] = 'Error: endDocking not found in transition group';
        } else if($transitionGroup.children('.orientationKnob.start').length != 1) {
            result['endDocking'] = 'Error: found invalid amount of endDocking nodes';
        }
    }
    return result;
};

module.exports = TransitionDockingManager;