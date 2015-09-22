var object = require('../util/object');
var event = require('../core/event');
var Transition = require('./transition');

/**
 * The transitionaddition for nodes is responsible for creating and updating/rendering the incoming and outgoing
 * transitions of a node.
 *
 * @param node
 * @constructor
 */
var TransitionAddition = function(node) {
    this.node = node;
    this.event = node.event;
    this.diagram = this.node.diagram;
    this.transitionMgr = this.diagram.transitionMgr;
    this.outgoingTransitions = [];
    this.incomingTransitions = [];
};

TransitionAddition.prototype.dragMove = function(dx, dy) {
    this.updateOrientations(dx ,dy);
    this.update();
};

TransitionAddition.prototype.updateOrientations = function(dx ,dy) {
    this.executeOnOutgoingTransitions(function(transition) {
        transition.dragStartOrientation(dx,dy);
    });

    this.executeOnIncomingTransitions(function(transition) {
        transition.dragEndOrientation(dx,dy);
    });
};

TransitionAddition.prototype.resize = function() {
    this.update();
};

TransitionAddition.prototype.update = function() {
    this.executeOnAllTransitions(function(transition) {
        transition.update();
    });
};

TransitionAddition.prototype.remove = function() {
    this.executeOnAllTransitions(function( transition) {
        transition.remove();
    });
};

TransitionAddition.prototype.moveUp = function() {
    this.executeOnAllTransitions(function(transition) {
        transition.checkDomPosition();
    });
};

/**
 * Node dbclick triggers the creation of a transition.
 */
TransitionAddition.prototype.dbclick = function() {
    //Start Transition Init Drag Event
    if(!this.transitionMgr.dragTransition) {
        var that = this;
        event.on(this.diagram.svg.getRootNode(), "mousemove", function(event) {
            that.transitionDrag(event);
        });
    }
};

TransitionAddition.prototype.transitionDrag = function(evt) {
    var mouse = this.diagram.getStagePosition(evt);

    //Initialize a new transition or update the current dragTransition
    if (!this.transitionMgr.dragTransition) {
        this.transitionMgr.dragTransition = this.addOutgoingTransition(mouse);
    } else {
        this.transitionMgr.dragTransition.update(mouse);
    }
};

/**
 * Node mousedown ends a transitionDrag even (if there is one) and sets this node as endnode
 */
TransitionAddition.prototype.mousedown = function(evt) {
    // Stop transition drag event and set end node
    if(this.transitionMgr.dragTransition) {
        //TODO: mouse position is needed for relative positions
        //var mouse = this.diagram.getStagePosition(evt);
        var transition = this.transitionMgr.dragTransition;
        transition.setEndNode(this.node);
        this.transitionMgr.addTransition(transition);
        delete this.transitionMgr.dragTransition;
        event.off(this.diagram.svg.getRootNode(), 'mousemove');
    }
};

TransitionAddition.prototype.addOutgoingTransition = function(value) {
    var transition = (value instanceof Transition) ? value : new Transition(this.node).init(value);
    this.outgoingTransitions.push(transition);
    return transition;
};

TransitionAddition.prototype.undockStart = function(transition) {
    this.edgeDockingDragListener(transition, 'Start');
};

TransitionAddition.prototype.undockEnd = function(transition) {
    this.edgeDockingDragListener(transition, 'End');
};

TransitionAddition.prototype.undockEdgeDocking = function(transition, dockingType) {
    var that = this;
    //We wait till the drag event stops (mouseup)
    event.once(this.diagram.svg.getRootNode(), "mouseup", function(mouseUpEvent) {
        var mouse = that.diagram.getStagePosition(mouseUpEvent);
        var hoverNode = that.diagram.overlaysNode(mouse);
        if(hoverNode !== transition['get'+dockingType+'Node']()) {
            //If we are hovering another node we swap start/end node
            transition['set'+dockingType+'Node'](hoverNode);
        } else if(hoverNode === transition['get'+dockingType+'Node']()){
            //If we are hovering the same node we set a relative docking
            transition['setRelative'+dockingType+'Knob'](mouse.x, mouse.y);
            transition.update();
        } else {
            //Mouse is hovering empty space
            transition.update();
        }
    });
};

TransitionAddition.prototype.executeOnAllTransitions = function(handler) {
    this.executeOnOutgoingTransitions(handler);
    this.executeOnIncomingTransitions(handler);
};

TransitionAddition.prototype.executeOnOutgoingTransitions = function(handler) {
    object.each(this.outgoingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.executeOnIncomingTransitions = function(handler) {
    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.getOrientations = function() {
    //TODO: outsource this to transition.getStartOrientation() getEndOrientation()
    var result = [];
    object.each(this.outgoingTransitions, function(index, transition) {
        if(object.isDefined(transition)) {
            if(!transition.knobManager.hasInnerKnobs()) {
                // Return the endNode orientation inclusive the end docking relative orientation for alignment
                result.push(transition.dockingManager.endOrientationKnob.position());
            } else {
                var docking = transition.knobManager.getDockingByIndex(1);
                result.push({x: docking.x(), y: docking.y()});
            }
        }
    });

    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            if(!transition.knobManager.hasInnerKnobs()) {
                // Return the startNode orientation inclusive the start docking relative orientation for alignment
                result.push(transition.dockingManager.startOrientationKnob.position());
            } else {
                var docking = transition.knobManager.getDockingByEndIndex(1);
                result.push({x: docking.x(), y: docking.y()});
            }

        }
    });
    return result;
};

TransitionAddition.prototype.removeOutgoingTransition = function(transition) {
    var index = this.outgoingTransitions.indexOf(transition);
    if (index !== -1) {
        this.outgoingTransitions.splice(index, 1);
    }
};

TransitionAddition.prototype.addIncomingTransition = function(transition) {
    this.incomingTransitions.push(transition);
};

TransitionAddition.prototype.removeIncomingTransition = function(transition) {
    var index = this.incomingTransitions.indexOf(transition);
    if (index !== -1) {
        this.incomingTransitions.splice(index, 1);
    }
};

TransitionAddition.requireConfig = false;

module.exports = TransitionAddition;

