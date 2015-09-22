/**
 * This module manages the transition data like knobs and pathdata.
 *
 */
var util = require('../util/util');
var Knob = require('./knob');
var DragAlignment = require('./dragAlignment');
var event = require('../core/event');

var dom = util.dom;
var object = util.object;

var TransitionKnobManager = function(transition) {
    this.transition = transition;
    this.event = transition.event;
};

TransitionKnobManager.prototype.init = function(start) {
    this.knobs = [];
    return this.addKnob(start, 0);
};

TransitionKnobManager.prototype.addKnob = function(position, index) {
    var index = index || this.size();
    var knob = this.initKnob(index, position);
    this.knobs.splice(index, 0, knob);

    if(index === 0) {
        this.startKnob = knob;
        this.getPathManager().addPathPart(index, position);
    } else if(arguments.length === 1) {
        //we don't need to add an additionalpathpart for the endknob
        this.endKnob = knob;
    } else {
        this.getPathManager().addPathPart(index, position);
    }

    this.transition.redraw();
    return knob;
};

TransitionKnobManager.prototype.initKnob = function(knobIndex, position) {
    var knob = new Knob(this.transition.diagram, position, {r:5}, this.transition.group);
    var that = this;
    var initialDrag = true;
    knob.draggable({
        dragAlignment : new DragAlignment(that.transition.diagram,
            function() { return [{source: [knob.position()], target: that.getJoiningOrientation(knob)}];}),
        dragStart : function() {
            that.transition.activeStyle();
        },
        dragMove : function() {
            //We just update boundary knobs if they are not in within multiselection
            if(!(that.transition.diagram.isMultiSelection() && that.isBoundaryIndex(knobIndex))) {
                that.updateKnob(that.getIndexForKnob(knob), knob.position());
                that.transition.update();
            }
        },
        dragEnd : function() {
            if(!that.isBoundaryIndex(knobIndex) && initialDrag) {
                that.event.trigger('transition_docking_created', {'transition':that.transition.id, 'dockingIndex':knobIndex});
                initialDrag = false;
            } else if(!that.isBoundaryIndex(knobIndex)) {
                that.event.trigger('transition_docking_dropped', {'transition':that.transition.id, 'dockingIndex':knobIndex});
            }
        }
    });

    knob.on('remove', function() {
        that.transition.removeKnobListener(knob);
    });

    knob.on('deselect', function() {
        that.transition.deselect();
    });

    //To prevent hiding the hoverknobs we adobt the transition hovering
    knob.hoverable({
        in : function() {
            that.transition.hover();
            if(!knob.isSelected()) {
                knob.fill('#9E9E9E');
            }
        },
        out : function() {
            that.transition.hoverOut();
        }
    });
    return knob;
};

TransitionKnobManager.prototype.updateKnob = function(knobIndex, position) {
    knobIndex = object.getIndex(this.knobs, knobIndex);

    // move the corresponding docking
    this.knobs[knobIndex].moveTo(position.x, position.y);
    // update path
    this.getPathManager().updatePart(knobIndex, position);


    // special handling for start and end dockings
    // Todo: implement this in transitionDockingManager add context dragMove listener
    if(knobIndex === 0) {
        this.event.trigger('transition_drag_startdocking', this.transition);
    } else if(knobIndex === this.lastIndex()) {
        this.event.trigger('transition_drag_enddocking', this.transition);
    }
};

TransitionKnobManager.prototype.removeKnobListener = function(knob) {
    if(!this.transition.removed) {
        var index = this.getIndexForKnob(knob);
        this.knobs.splice(index, 1);
        this.getPathManager().removePathPart(index);
        this.transition.update();
    }
};

TransitionKnobManager.prototype.size = function() {
    return this.knobs.length;
};

TransitionKnobManager.prototype.lastIndex = function() {
    return this.size() - 1;
};

TransitionKnobManager.prototype.hasInnerKnobs = function() {
    return this.knobs.length > 2;
};

TransitionKnobManager.prototype.remove = function() {
    object.each(this.knobs, function(index, value) {
        if(object.isDefined(value)) {
            value.remove();
        }
    });
};

TransitionKnobManager.prototype.removeDockingMarker = function() {
    this.transition.group.$().children('.docking').remove();
};

TransitionKnobManager.prototype.isBoundaryKnob = function(knob) {
    return this.isBoundaryIndex(this.getIndexForKnob(knob));
};

TransitionKnobManager.prototype.isBoundaryIndex = function(knobIndex) {
    return knobIndex === 0 || knobIndex === this.lastIndex();
};

TransitionKnobManager.prototype.getJoiningDockings = function(docking) {
    var index = this.getIndexForKnob(docking);
    return [this.knobs[index - 1], this.knobs[index + 1]];
};

TransitionKnobManager.prototype.getJoiningOrientation = function(knob) {
    var index = this.getIndexForKnob(knob);
    var result = [];
    if(index <= 1) { //start or second docking
        result.push(this.transition.dockingManager.startOrientationKnob.position());
    } else if(index !== 0){
        var orientation = this.knobs[index - 1];
        result.push({x : orientation.x(), y : orientation.y()});
    }

    if(index >= this.knobs.length -2) { //end or one before end docking
        result.push(this.transition.dockingManager.endOrientationKnob.position());
    } else {
        var orientation = this.knobs[index + 1];
        result.push({x : orientation.x(), y : orientation.y()});
    }

    return result;
};

TransitionKnobManager.prototype.getIndexForKnob = function(knob) {
    return this.knobs.indexOf(knob);
};

TransitionKnobManager.prototype.getKnobPositions = function() {
    var result = [];
    object.each(this.knobs, function(index, value) {
        result.push(value.position());
    });
    return result;
};

TransitionKnobManager.prototype.getDockingByEndIndex = function(indexDif) {
    return this.knobs[(this.knobs.length - 1) - indexDif];
};

TransitionKnobManager.prototype.start = function() {
    return this.knobs[0].position();
};

TransitionKnobManager.prototype.getDockingByIndex = function(index) {
    return this.knobs[index];
};

TransitionKnobManager.prototype.calcEndDockingPosition = function() {
    // if we have inner dockings we use the last inner docking as
    // outer orientation for the end docking else we use the startdocking
    var outerOrientation = (this.pathData.length() > 2)
        ? this.pathData.value(-2).to()
        : this.startKnob.position();

    var relativeInnerOrientation = (object.isDefined(this.endKnob))
        ? this.endKnob.relativeOrientation()
        : undefined;

    return this.transition.endNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
};

TransitionKnobManager.prototype.calculateStartDockingPosition = function(mouse) {
    var outerOrientation = mouse;
    if(this.transition.line) {
        switch(this.pathData.length()) {
            case 2: // just the end node
                if(this.endKnob) {
                    outerOrientation = this.endKnob.position();
                } else {
                    //for init per drag we use mouse init per activation we use endNode
                    outerOrientation = (this.endNode) ? this.endNode.getCenter() : mouse;
                }
                break;
            default: // additonal dockings
                outerOrientation = this.pathData.value(1).to();
                break;
        }
    }

    var relativeInnerOrientation = (object.isDefined(this.startKnob))
        ? this.startKnob.relativeOrientation()
        : undefined;

    return this.transition.startNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
};

TransitionKnobManager.prototype.hide = function() {
    object.each(this.knobs, function(index, knob) {
        if(!knob.isSelected()) {
            knob.hide();
        }
    });
};

TransitionKnobManager.prototype.activeStyle = function() {
    object.each(this.knobs, function(index, knob) {
        knob.activeStyle();
    });
};

TransitionKnobManager.prototype.inactiveStyle = function() {
    object.each(this.knobs, function(index, knob) {
        if(!knob.isSelected()) {
            knob.inactiveStyle();
        }
    });
};

TransitionKnobManager.prototype.getPosition = function(index) {
    if(index < this.size()) {
        return object.valueByIndex(this.knobs, index).position();
    }
};

TransitionKnobManager.prototype.getPathManager = function() {
    return this.transition.pathManager;
}

TransitionKnobManager.prototype.isInitState = function() {
    return !this.endKnob;
}

module.exports = TransitionKnobManager;