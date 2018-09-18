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
TransitionAddition.prototype.dblclick = function(evt) {
    this.startNewTransition(undefined, this.diagram.getStagePosition(evt));
};

/**
 * This function starts a new transition either by providing a endNode or by using the transitiondrag
 * @param endNode
 */
TransitionAddition.prototype.startNewTransition = function(endNode, mouse) {
    if(this.transitionMgr.isDragTransition()) {
        return this.diagram.transitionMgr.getDragTransition();
    }

    var transition = this.transitionMgr.startDragTransition(this.node, mouse);

    if(!endNode) {
        //If no endNode was provided we start the mouse listener for the transitiondrag
        var that = this;
        event.on(this.diagram.svg.getRootNode(), "mousemove", function(event) {
            that.transitionDrag(event, true);
        });
    } else {
        //If an endNode was provided we imitate the transitiondrag and set the endNode
        this.transitionDrag(endNode.getCenter());
        endNode.additions.transition.endTransitionDrag();
    }

    return transition;
};

TransitionAddition.prototype.transitionDrag = function(mouse, isEvt) {
    mouse = (isEvt)? this.diagram.getStagePosition(mouse) : mouse;
    //Update the current dragTransition
    this.transitionMgr.getDragTransition().update(mouse);
};

/**
 * Node mousedown ends a transitionDrag even (if there is one) and sets this node as endnode
 */
TransitionAddition.prototype.mousedown = function(evt) {
    // Stop transition drag event and set end node
    if(this.transitionMgr.isDragTransition()) {
        this.endTransitionDrag(evt);
    }
};

TransitionAddition.prototype.endTransitionDrag = function(mouseEvt) {
    mouseEvt = mouseEvt || this.node.getCenter();
    var transition = this.transitionMgr.getDragTransition();
    transition.setEndNode(this.node, this.diagram.getStagePosition(mouseEvt));
    this.transitionMgr.endDragTransition();
    event.off(this.diagram.svg.getRootNode(), 'mousemove');
};

TransitionAddition.prototype.ownsTransition = function(transition) {
    var result = false;
    $.each(this.outgoingTransitions, function(index, value) {
        if(object.isString(transition) && value.id === transition) {
            result = true;
            return false; //exit each loop
        } else if(value.id === transition.id) {
            result = true;
            return false; //exit each loop
        }
    });

    if(!result) {
        $.each(this.incomingTransitions, function(index, value) {
            if(object.isString(transition) && value.id === transition) {
                result = true;
                return false; //exit each loop
            } else if(value.id === transition.id) {
                result = true;
                return false; //exit each loop
            }
        });
    }

    return result;
};

TransitionAddition.prototype.addOutgoingTransition = function(transition) {
    this.outgoingTransitions.push(transition);
    return transition;
};

TransitionAddition.prototype.executeOnAllTransitions = function(handler) {
    this.executeOnOutgoingTransitions(handler);
    this.executeOnIncomingTransitions(handler);
};

TransitionAddition.prototype.executeOnOutgoingTransitions = function(handler) {
    object.each(this.outgoingTransitions, function(index, transition) {
        if(transition) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.executeOnIncomingTransitions = function(handler) {
    object.each(this.incomingTransitions, function(index, transition) {
        if(transition) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.getTransitionAlignmentTargets = function() {
    var result = [];
    object.each(this.outgoingTransitions, function(index, transition) {
        if(object.isDefined(transition)) {
            result.push(transition.getStartAlignment());
        }
    });

    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            result.push(transition.getEndAlignment());
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

TransitionAddition.prototype.dump = function() {
    var result = '<b>TransitionAddition</b><br />';
    result += this.outgoingTransitions.length+' Outgoing Transitions:<br />';
    this.executeOnOutgoingTransitions(function(transition) {
        result += 'Transition - '+transition.id+'<br />';
    });

    result += this.incomingTransitions.length+' Incoming Transitions:<br />';
    this.executeOnIncomingTransitions(function(transition) {
        result += 'Transition - '+transition.id+'<br />';
    });
    return result;
};

TransitionAddition.requireConfig = false;

module.exports = TransitionAddition;

