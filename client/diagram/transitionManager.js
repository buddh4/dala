var object = require('../util/object');
var xml = require('../util/xml');
var event = require('../core/event');
var Transition = require('./transition');

var AbstractManager = require('./abstractManager');

var CMD_ADD = "transition_add";
var CMD_DEL = "transition_delete";
var CMD_DOC_CREATED = "transition_doc_created";
var CMD_DOC_DROPPED = "transition_doc_dropped";

var TransitionManager = function(diagram) {
    // Contains all nodes added to the diagram
    AbstractManager.call(this, diagram);

    this.transitions = {};
    this.diagram = diagram;
    event.listen('transition_delete', this.deleteTransitionListener, this);
    event.listen('transition_drag_startdocking', this.startDockingDragListener, this);
    event.listen('transition_drag_enddocking', this.endDockingDragListener, this);
    event.listen('transition_docking_created', this.transitionDockingCreatedListener, this);
    event.listen('transition_docking_dropped', this.transitionDockingDropListener, this);


    this.command(CMD_ADD, this.importTransitionAction, this.deleteTransitionAction);
    this.command(CMD_DEL, this.deleteTransitionAction, this.importTransitionAction);
    this.command(CMD_DOC_CREATED, this.importTransitionAction, this.deleteDockingAction);
    this.command(CMD_DOC_DROPPED, this.dropDockingAction, this.dropDockingAction);
};

TransitionManager.prototype = Object.create(AbstractManager.prototype);
var _super = AbstractManager.prototype;

TransitionManager.prototype.transitionDockingDropListener = function(evt) {
    if (evt.data) {
        var transition = evt.data.transition;
        var dockingIndex = evt.data.dockingIndex;
        var docking = this.getTransition(transition).docking.getDockingByIndex(dockingIndex);

        this.addCmd(CMD_DOC_DROPPED,
            [transition, dockingIndex, docking.marker.dxSum, docking.marker.dySum],
            [transition, dockingIndex, (-1 * docking.marker.dxSum), (-1 * docking.marker.dySum)]);
    }
};

TransitionManager.prototype.dropDockingAction = function(transition, dockingIndex, dxSum, dySum) {
    transition = this.getTransition(transition);
    if(transition) {
        var docking = transition.docking.getDockingByIndex(dockingIndex);
        docking.triggerDrag(dxSum, dySum);
    }
}

TransitionManager.prototype.transitionDockingCreatedListener = function(evt) {
    if (evt.data) {
        var transition = evt.data.transition;
        var dockingIndex = evt.data.dockingIndex;
        this.addCmd(CMD_DOC_CREATED, [this.getTransitionString(transition), transition], [transition, dockingIndex]);
    }
};

TransitionManager.prototype.deleteDockingAction = function(transition, dockingIndex) {
    transition = this.getTransition(transition);
    if(transition) {
        transition.docking.getDockingByIndex(dockingIndex).remove();
    }
}

TransitionManager.prototype.importTransitionAction = function(transitionStr, transition) {
    if(transition) {
        transition = this.getTransition(transition)
        if(transition) {
            this.deleteTransitionAction(transition.id);
        }
    }

    var transitionElement = this.diagram.import(transitionStr);
    this.activateTransition(transitionElement);
};

TransitionManager.prototype.activateTransition = function(value) {
    if(object.isArray(value)) {
        var result = [];
        var that = this;
        object.each(value, function() {
            result.push(that.activateTransition($(this)));
        });
        return result;
    } else  {
        return this.addTransition(new Transition(value, this.diagram));
    }
};

TransitionManager.prototype.addTransition = function(transition) {
    this.addCmd(CMD_ADD, [this.getTransitionString(transition)], [transition.id]);
    return this.transitions[transition.id] = transition;
};

TransitionManager.prototype.getTransitionString = function(transition) {
    transition = this.getTransition(transition);
    return xml.serializeToString(transition.instance());
};

TransitionManager.prototype.deleteTransitionListener = function(evt) {
    if(evt.data) {
        var transition = evt.data;
        this.exec(CMD_DEL, [transition.id], [this.getTransitionString(transition)]);
    }
};

TransitionManager.prototype.deleteTransitionAction = function(id) {
    var transition = this.getTransition(id);
    if(transition) {
        delete this.transitions[id];
        transition.remove();
    }
};

TransitionManager.prototype.getTransition = function(id) {
    if(object.isString(id) && !isNaN(id)) {
        return this.transitions[parseInt(id)];
    } else if(!isNaN(id)) {
        return this.transitions[id];
    } else if(id instanceof Transition) {
        //We assume a node instance
        return id;
    } else {
        console.warn('getTransition call with no result for :'+id);
    }
};

TransitionManager.prototype.startDockingDragListener = function(evt) {
    this.edgeDockingDragListener(evt, 'Start');
};

TransitionManager.prototype.endDockingDragListener = function(evt) {
    this.edgeDockingDragListener(evt,'End');
};

TransitionManager.prototype.edgeDockingDragListener = function(evt, dockingType) {
    var that = this;
    var transition = evt.data;
    //We wait for the drag end event (mouseup)
    event.once(this.diagram.svg.getRootNode(), "mouseup", function(mouseUpEvent) {
        var mouse = that.diagram.getStagePosition(mouseUpEvent);
        var hoverNode = that.diagram.overlaysNode(mouse);
        if(hoverNode !== transition['get'+dockingType+'Node']()) {
            //We are hovering another note so we swap the start or end node
            transition['set'+dockingType+'Node'](hoverNode);
        } else if(hoverNode === transition['get'+dockingType+'Node']()){
            //We are hovering the curretn start/end node so we just set a relative docking position
            transition['setRelative'+dockingType+'Docking'](mouse.x, mouse.y);
            transition.update();
        } else {
            //We are hovering empty space so we just update the
            transition.update();
        }
    });
};

module.exports = TransitionManager;