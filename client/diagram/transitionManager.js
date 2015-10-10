var util = require('../util/util');
var object = require('../util/object');
var xml = require('../util/xml');
var event = require('../core/event');
var Transition = require('./transition');

var AbstractManager = require('./abstractManager');

var EVT_TRANSITION_ADDED = "transition_added";
var EVT_TRANSITION_SELECTED = 'transition_selected';
var EVT_TRANSITION_DESELECTED = 'transition_deselected';
var EVT_TRANSITION_REMOVED = 'transition_removed';

var CMD_ADD = "transition_add";
var CMD_DEL = "transition_delete";
var CMD_DOC_CREATED = "transition_doc_created";
var CMD_DOC_DROPPED = "transition_doc_dropped";
var CMD_EDIT = "transition_edit";

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

    event.listen('transition_edit', this.editTransitionListener, this);

    this.command(CMD_ADD, this.importTransitionAction, this.deleteTransitionAction);
    this.command(CMD_DEL, this.deleteTransitionAction, this.importTransitionAction);
    this.command(CMD_DOC_CREATED, this.importTransitionAction, this.deleteKnobAction);
    this.command(CMD_DOC_DROPPED, this.dropDockingAction, this.dropDockingAction);
    this.command(CMD_DOC_DROPPED, this.dropDockingAction, this.dropDockingAction);
    this.command(CMD_EDIT, this.editCmd, this.undoEditCmd);
};

util.inherits(TransitionManager, AbstractManager);

TransitionManager.prototype.editTransitionListener = function(evt) {
    var transition = this.getTransition(evt.data.transition);
    var key = evt.data.key;
    var oldValue = transition.additions.edit.getValue(key);
    this.exec(CMD_EDIT, [transition.id, key, evt.data.value], [transition.id, key, oldValue]);
};

TransitionManager.prototype.editCmd = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edited', transition);
};

TransitionManager.prototype.undoEditCmd = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edit_undo', transition);
};

TransitionManager.prototype.editTransitionAction = function(transition, type, value) {
    transition = this.getTransition(transition);
};

TransitionManager.prototype.transitionDockingDropListener = function(evt) {
    if (evt.data) {
        var transition = evt.data.transition;
        var dockingIndex = evt.data.dockingIndex;
        var docking = this.getTransition(transition).knobManager.getKnob(dockingIndex);

        this.addCmd(CMD_DOC_DROPPED,
            [transition, dockingIndex, docking.node.root.dxSum, docking.node.root.dySum],
            [transition, dockingIndex, (-1 * docking.node.root.dxSum), (-1 * docking.node.root.dySum)]);
    }
};

TransitionManager.prototype.dropDockingAction = function(transition, dockingIndex, dxSum, dySum) {
    transition = this.getTransition(transition);
    if(transition) {
        var docking = transition.knobManager.getKnob(dockingIndex);
        docking.triggerDrag(dxSum, dySum);
    }
};

TransitionManager.prototype.transitionDockingCreatedListener = function(evt) {
    if (evt.data) {
        var transition = evt.data.transition;
        var dockingIndex = evt.data.dockingIndex;
        this.addCmd(CMD_DOC_CREATED, [this.getTransitionString(transition), transition], [transition, dockingIndex]);
    }
};

TransitionManager.prototype.deleteKnobAction = function(transition, dockingIndex) {
    transition = this.getTransition(transition);
    if(transition) {
        transition.knobManager.getKnob(dockingIndex).remove();
    }
};

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

TransitionManager.prototype.isDragTransition = function(transition) {
    return object.isDefined(this.dragTransition);
};

TransitionManager.prototype.startDragTransition = function(transition) {
    this.dragTransition = transition;
};

TransitionManager.prototype.getDragTransition = function() {
    return this.dragTransition;
};

TransitionManager.prototype.endDragTransition = function() {
    this.addTransition(this.dragTransition);
    delete this.dragTransition;
};

TransitionManager.prototype.addTransition = function(transition) {
    var that = this;
    this.event.trigger(EVT_TRANSITION_ADDED, transition);
    transition.on('select', function() {
        that.event.trigger(EVT_TRANSITION_SELECTED, transition);
    }).on('deselect', function() {
        that.event.trigger(EVT_TRANSITION_DESELECTED, transition);
    }).on('remove', function() {
        that.event.trigger(EVT_TRANSITION_REMOVED, transition);
    });
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
    if(!this.dragTransition) {
       // this.edgeDockingDragListener(evt, 'Start');
    }
};

TransitionManager.prototype.endDockingDragListener = function(evt) {
    if(!this.dragTransition) {
        //this.edgeDockingDragListener(evt, 'End');
    }
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
            transition['setRelative'+dockingType+'Knob'](mouse.x, mouse.y);
            transition.update();
        } else {
            //We are hovering empty space so we just update the
            transition.update();
        }
    });
};

module.exports = TransitionManager;