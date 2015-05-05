var object = require('../util/object');
var event = require('../core/event');
var Transition = require('./transition');

var TransitionManager = function(diagram) {
    // Contains all nodes added to the diagram
    this.transitions = {};
    this.diagram = diagram;
    event.listen('transition_delete', this.deleteTransitionListener, this);
    event.listen('transition_drag_startdocking', this.startDockingDragListener, this);
    event.listen('transition_drag_enddocking', this.endDockingDragListener, this);
};

TransitionManager.prototype.activateTransition = function(value) {
    if(object.isArray(value)) {
        var result = [];
        var that = this;
        object.each(value, function() {
            result.push(that.activateTransition(this));
        });
        return result;
    } else  {
        var transiton = new Transition(value, this.diagram);
        this.addTransition(transiton);
        return transiton;
    }
};

TransitionManager.prototype.deleteTransitionListener = function(evt) {
    if(object.isDefined(evt.data)) {
        delete this.transitions[evt.data.id];
        evt.data.remove();
    }
};

TransitionManager.prototype.addTransition = function(transition) {
    this.transitions[transition.id] = transition;
};

TransitionManager.prototype.getTransition = function(id) {
    return this.transitions[id];
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