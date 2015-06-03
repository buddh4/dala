var object = require('../util/object');
var event = require('../core/event');
var Transition = require('./transition');

var TransitionAddition = function(node) {
    this.node = node;
    this.event = node.event;
    this.node.additions.transition = this;
    this.diagram = this.node.diagram;
    this.transitionMgr = this.diagram.transitionMgr;
    this.outgoingTransitions = [];
    this.incomingTransitions = [];
};

TransitionAddition.prototype.drag = function() {
    this.update();
};

TransitionAddition.prototype.resize = function() {
    this.update();
};

TransitionAddition.prototype.update = function() {
    this.executeOnAllTransitions(function( transition) {
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

TransitionAddition.prototype.dbclick = function() {
    //Start Transition Init Drag Event
    if(!this.transitionMgr.dragTransition) {
        var that = this;
        event.on(this.diagram.svg.getRootNode(), "mousemove", function(event) {
            that.updateLineDrag(event);
        });
    }
};

TransitionAddition.prototype.updateLineDrag = function(evt) {
    var mouse = this.diagram.getStagePosition(evt);

    //Initialize or update the new transition
    if (!this.transitionMgr.dragTransition) {
        this.transitionMgr.dragTransition = this.addOutgoingTransition(mouse);
    } else {
        this.transitionMgr.dragTransition.update(mouse);
    }
};

TransitionAddition.prototype.mousedown = function(evt) {
    var mouse = this.diagram.getStagePosition(evt);
    // Stop transition drag event and set end node
    if(object.isDefined(this.transitionMgr.dragTransition)) {
        var transition = this.transitionMgr.dragTransition;
        transition.setEndNode(this.node, undefined, mouse);
        this.transitionMgr.addTransition(transition);
        delete this.transitionMgr.dragTransition;
        event.off(this.diagram.svg.getRootNode(), 'mousemove');
    }
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
            transition['setRelative'+dockingType+'Docking'](mouse.x, mouse.y);
            transition.update();
        } else {
            //Mouse is hovering empty space
            transition.update();
        }
    });
};

TransitionAddition.prototype.executeOnAllTransitions = function(handler) {
    object.each(this.outgoingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            handler(transition);
        }
    });

    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.getOrientations = function() {
    var result = [];
    object.each(this.outgoingTransitions, function(index, transition) {
        if(object.isDefined(transition)) {
            if(!transition.docking.hasInnerDockings()) {
                // Return the endNode orientation inclusive the end docking relative orientation for alignment
                result.push(transition.endNode.getOrientation(transition.getEndDocking().relativeOrientation()));
            } else {
                var docking = transition.docking.getDockingFromIndex(1);
                result.push({x: docking.x(), y: docking.y()});
            }
        }
    });

    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            if(!transition.docking.hasInnerDockings()) {
                // Return the startNode orientation inclusive the start docking relative orientation for alignment
                result.push(transition.startNode.getOrientation(transition.getStartDocking().relativeOrientation()));
            } else {
                var docking = transition.docking.getDockingFromEndIndex(1);
                result.push({x: docking.x(), y: docking.y()});
            }

        }
    });
    return result;
};

TransitionAddition.prototype.addOutgoingTransition = function(value) {
    var transition;

    if(value instanceof Transition) {
        transition = value;
        this.outgoingTransitions.push(value);
    } else if(value) {
        transition = new Transition(this.node).init(value);
        this.outgoingTransitions.push(transition);
    }
    return transition;
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

module.exports = TransitionAddition;

