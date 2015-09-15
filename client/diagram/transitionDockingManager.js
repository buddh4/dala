var util = require('../util/util');
var TransitionDocking = function(transition, startNode) {
    this.startNode = startNode;
    this.transition = transition;
};

TransitionDocking.prototype.init = function(startKnob) {
    this.startKnob = startKnob;
    //TODO: add draggable listener for start and end knobs
    this.setStartNodeFeature();
};

/**
 * The startnodefeature
 * @param feature
 */
TransitionDocking.prototype.setStartNodeFeature = function(feature) {
    if(feature && feature.value && this.transition.group) {
        this.transition.group.attr({'dala:start':util.app.createFeatureString(this.startNode.id, feature.value)});
        this.startKnob.relativeOrientation(this.startNode.getRelativePosition(feature.value[0], feature.value[1]));
    } else if(this.transition.group) {
        this.transition.group.attr({'dala:start':this.startNode.id});
        this.startKnob.clearRelativeOrientation();
    }
};

TransitionDocking.prototype.calculateStart = function(mouse) {
    var outerOrientation = mouse || this.transition.knobManager.getPosition(1);
    var relativeInnerOrientation = (this.startKnob) ? this.startKnob.relativeOrientation() : undefined;
    return this.startNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
};


TransitionDocking.prototype.calculateEnd = function(mouse) {
    if(!this.endNode && mouse) {
        return this.getEndPositionForMouse(mouse);
    } else {
        var outerOrientation = this.transition.knobManager.getPosition(-2);
        var relativeInnerOrientation = (this.endKnob) ? this.endKnob.relativeOrientation() : undefined;
        return this.endNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
    }
};

TransitionDocking.prototype.getEndPositionForMouse = function(mouse) {
    //This prevents the line rendering to overlap the exact mouse position
    return {
        x : (this.startKnob.x() < mouse.x) ? mouse.x - 1 : mouse.x + 1,
        y : (this.startKnob.y() < mouse.y) ? mouse.y - 1 : mouse.y + 1
    };
};

TransitionDocking.prototype.setEndNode = function(node) {
    if(this.endNode) {
        this.endNode.removeIncomingTransition(this);
    }

    // Init node connection and check dom position
    this.endNode = node;
    this.endNode.addIncomingTransition(this.transition);
    this.setEndNodeFeature();
};

TransitionDocking.prototype.setStartNode = function(node, feature) {
    if(object.isDefined(this.startNode)) {
        this.startNode.removeOutgoingTransition(this);
    }

    // Init node connection and check dom position
    this.startNode = node;
    this.startNode.addOutgoingTransition(this);

    // Set relative startnode orientation and update
    this.setStartNodeFeature(feature);
}

TransitionDocking.prototype.setEndKnob = function(endKnob) {
    this.endKnob = endKnob;
};

TransitionDocking.prototype.start = function(value) {
    if(value) {
        this.start = value;
    } else {
        return this.start;
    }
}

TransitionDocking.prototype.setRelativeEndDocking = function(x,y) {
    var p = util.app.getPoint(x,y);
    this.setEndNodeFeature({
        value : [p.x, p.y]
    });
};

TransitionDocking.prototype.setEndNodeFeature = function(feature) {
    if(this.endNode) {
        if(feature && feature.value) {
            this.transition.group.attr({'dala:end':util.app.createFeatureString(this.endNode.id, feature.value)});
            this.endKnob.relativeOrientation(this.endNode.getRelativePosition(feature.value[0], feature.value[1]));
        } else {
            this.transition.group.attr({'dala:end':this.endNode.id});
            if(this.endKnob) {
                this.endKnob.clearRelativeOrientation();
            }
        }
    }
};

TransitionDocking.prototype.remove = function() {
    if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
    }

    if(this.endNode) {
        this.endNode.removeIncomingTransition(this.transition);
    }
};

TransitionDocking.prototype.getStartDockingLocation = function() {
    if(this.startNode && this.startKnob) {
        return this.startNode.getRelativeLocation(this.startKnob.position());
    }
};

TransitionDocking.prototype.getEndDockingLocation = function() {
    if(this.endNode && this.endKnob) {
        return this.endNode.getRelativeLocation(this.endKnob.position());
    }
};

module.exports = TransitionDocking;