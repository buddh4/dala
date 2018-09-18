var util = require('../util/util');
var object = require('../util/object');
var xml = require('../util/xml');
var event = require('../core/event');
var config = require('../core/config');
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
    event.listen('transition_edit', this.editTransitionListener, this);

    this.command(CMD_ADD, this.importTransition, this.deleteTransition);
    this.command(CMD_DEL, this.deleteTransition, this.importTransition);
    this.command(CMD_KNOB_ADD, this.addKnob, this.deleteKnob);
    this.command(CMD_KNOB_DROP, this.dropDocking, this.dropDocking);
    this.command(CMD_EDIT, this.editTransition, this.undoEdit);
};

util.inherits(TransitionManager, AbstractManager);


TransitionManager.prototype.size = function() {
    return object.size(this.transitions);
};

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
    if(!transition) {
        return;
    }
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edit_undo', transition);
};

TransitionManager.prototype.importTransition = function(transitionStr, cfg) {
    var cfg = cfg || {};

    //If set we replace the old node id with a new one e.g. when we copy a node
    if(cfg.newId && cfg.oldId) {
        transitionStr = transitionStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    var transitionElement = this.diagram.import(transitionStr);
    return this.activateTransition(transitionElement);
};

var _sortActivationTransition = function(a, b) {
    var $tA = $(a);
    var $tB = $(b);

    var startA = $tA.attr('dala:start');
    var startB = $tB.attr('dala:start');

    var endA = $tA.attr('dala:end');
    var endB = $tB.attr('dala:end');

    if($tA.find('#'+startB).length || $tA.find('#'+endB).length) {
        return -1;
    } else if($tB.find('#'+startA).length || $tB.find('#'+endA).length) {
        return 1;
    }
    return 0;
}

TransitionManager.prototype.activateTransition = function(toActivate) {
    if(object.isArray(toActivate) || object.isJQuery(toActivate)) {
        toActivate.sort(_sortActivationTransition);
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

    var cfg = $.extend({}, config.val('transition_settings', {}));
    //TODO: check for node/template prefered/transition + transitionconfiguration prefer template or settings
    return this.dragTransition = new Transition(node, mouse, cfg);
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
        //TODO: perhaps rather use dragContext note: api call in transitionknobmanager
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

TransitionManager.prototype.dump = function() {
    var result = '<b>TransitionManager</b> - '+this.size()+' Transitions<br />\n';
    $.each(this.transitions, function(index, transition) {
        result += transition.dump()+'<br />\n';
    });
    return result;
};

TransitionManager.prototype.validate = function() {
    var result = {};
    $.each(this.transitions, function(index, transition) {
        result['transition'+transition.id] = transition.validate();
    });
    return result;
};

module.exports = TransitionManager;