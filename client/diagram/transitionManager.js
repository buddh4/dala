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
var CMD_KNOB_ADD = "transition_knob_added";
var CMD_KNOB_DROP = "transition_knob_dropped";
var CMD_EDIT = "transition_edit";

var TransitionManager = function(diagram) {
    // Contains all nodes added to the diagram
    AbstractManager.call(this, diagram);

    this.transitions = {};
    this.diagram = diagram;
    event.listen('transition_delete', this.deleteTransitionListener, this);
    event.listen('transition_docking_created', this.transitionDockingCreatedListener, this);
    event.listen('transition_docking_dropped', this.transitionDockingDropListener, this);
    event.listen('transition_edit', this.editTransitionListener, this);

    this.command(CMD_ADD, this.importTransition, this.deleteTransition);
    this.command(CMD_DEL, this.deleteTransition, this.importTransition);
    this.command(CMD_KNOB_ADD, this.addKnob, this.deleteKnob);
    this.command(CMD_KNOB_DROP, this.dropDocking, this.dropDocking);
    this.command(CMD_EDIT, this.editTransition, this.undoEdit);
};

util.inherits(TransitionManager, AbstractManager);

TransitionManager.prototype.editTransitionListener = function(evt) {
    var transition = this.getTransition(evt.data.transition);
    var key = evt.data.key;
    var oldValue = transition.additions.edit.getValue(key);
    this.exec(CMD_EDIT, [transition.id, key, evt.data.value], [transition.id, key, oldValue]);
};

TransitionManager.prototype.editTransition = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edited', transition);
};

TransitionManager.prototype.undoEdit = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edit_undo', transition);
};

TransitionManager.prototype.importTransition = function(transitionStr, transition) {
    if(transition) {
        transition = this.getTransition(transition)
        if(transition) {
            this.deleteTransition(transition.id);
        }
    }

    var transitionElement = this.diagram.import(transitionStr);
    this.activateTransition(transitionElement);
};

TransitionManager.prototype.activateTransition = function(toActivate) {
    if(object.isArray(toActivate)) {
        var result = [];
        var that = this;
        object.each(toActivate, function() {
            result.push(that.activateTransition($(this).get(0)));
        });
        return result;
    } else  { //toActivate is domElement
        return this.addTransition(new Transition(this.diagram, toActivate));
    }
};

TransitionManager.prototype.isDragTransition = function(transition) {
    return object.isDefined(this.dragTransition);
};

TransitionManager.prototype.startDragTransition = function(node, mouse) {
    mouse = mouse || node.getCenter();
    return this.dragTransition = new Transition(node, mouse);
};

TransitionManager.prototype.getDragTransition = function() {
    return this.dragTransition;
};

TransitionManager.prototype.endDragTransition = function() {
    var that = this;
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
    }).on('knob_add', function(evt , knobIndex, position) {
        that.addCmd(CMD_KNOB_ADD, [transition.id, knobIndex, position], [transition, knobIndex]);
    }).on('knob_drop', function(evt , knobIndex) {
        var knob = transition.knobManager.getKnob(knobIndex);
        that.addCmd(CMD_KNOB_DROP,
            [transition.id, knobIndex, knob.node.root.dxSum, knob.node.root.dySum],
            [transition.id, knobIndex, (-1 * knob.node.root.dxSum), (-1 * knob.node.root.dySum)]);
    });

    this.addCmd(CMD_ADD, [this.getTransitionString(transition)], [transition.id]);
    return this.transitions[transition.id] = transition;
};

TransitionManager.prototype.addKnob = function(transition, knobIndex, position) {
    this.getTransition(transition).addKnob(position,knobIndex);
};

TransitionManager.prototype.deleteKnob = function(transition, dockingIndex) {
    this.getTransition(transition).knobManager.getKnob(dockingIndex).remove();
};

TransitionManager.prototype.dropDocking = function(transition, dockingIndex, dxSum, dySum) {
    transition = this.getTransition(transition);
    if(transition) {
        var docking = transition.knobManager.getKnob(dockingIndex);
        docking.triggerDrag(dxSum, dySum);
    }
};

TransitionManager.prototype.transitionDockingCreated = function(transition, dockingIndex) {
    var transition = evt.data.transition;
    var dockingIndex = evt.data.dockingIndex;

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

TransitionManager.prototype.deleteTransition = function(id) {
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

module.exports = TransitionManager;