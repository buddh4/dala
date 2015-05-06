var util = require('../util/util');
var event = require('../core/event');
var PathData = require('../svg/pathData');
var TransitionDocking = require('./transitionDocking');
var TransitionTextAddition = require('./transitionTextAddition');

var STYLE_TRANSITION_ACTIVE = "stroke:red;stroke-width:1;fill:none;";
var STYLE_TRANSITION_INACTIVE = "stroke:black;stroke-width:1;fill:none;";
var STYLE_AREA = "stroke:grey;stroke-opacity:0.0;stroke-width:11;fill:none;";

var object = util.object;
var dom = util.dom;

var Transition = function(node, diagram) {
    if(object.isDefined(node) && object.isDefined(node.template)) {
        // Create new Transition with the given node as startnode
        this.startNode = node;
        this.diagram = node.diagram;
        this.event = node.event;
        this.svg = this.diagram.svg;
        this.additions = {};
        this.docking = new TransitionDocking(this);
        new TransitionTextAddition(this);
    } else {
        //Activation of a transition, the node is supposted to be the transition group
        this.diagram = diagram;
        this.event = diagram.event;
        this.svg = this.diagram.svg;
        this.docking = new TransitionDocking(this);
        this.activate(node);
    }
};

/**
 * This methods activates an existing dom group element as a transition.
 *
 * @param {type} groupElement
 * @returns {Transition_L1.Transition.prototype}
 */
Transition.prototype.activate = function(groupElement) {
    this.activateTransitionElements(groupElement);
    this.docking.activateDockings();
    this.activateNodeBinding(groupElement);
    this.initEvents();
};

Transition.prototype.getStartDockingLocation = function() {
    return Transition.getDockingLocation(this.startNode, this.getStartDocking().position());

};

Transition.prototype.getEndDockingLocation = function() {
    return Transition.getDockingLocation(this.endNode, this.getEndDocking().position());

};

Transition.getDockingLocation = function(node, position) {
    if(position.x === node.x()) {
        return 'left';
    } else if(position.y === node.y()) {
        return 'top';
    } else if(position.x === node.getRightX()) {
        return 'right';
    } else if(position.y === node.getBottomY()) {
        return 'bottom';
    }

    var center = node.getCenter();
    if(position.x === center.x && position.y === center.y) {
        return 'center';
    } else if(!node.overlays(position)) {
        return 'outside';
    } else {
        return 'relative';
    }
};

Transition.prototype.activateTransitionElements = function(groupElement) {
    var transitionElements = dom.children(groupElement);
    this.group = this.svg.get(groupElement);
    this.id = this.group.attr('id');
    this.line = this.svg.get(transitionElements[0]);
    this.lineArea = this.svg.get(transitionElements[1]);
    this.lineArea.attributes.d = this.line.attributes.d;

    //We remove the marker, they will be rerendered and initialized later
    this.docking.removeDockingMarker();
};

Transition.prototype.activateNodeBinding = function(groupElement) {
    var attributes = dom.getAttributes(groupElement);
    var startNodeFeature = util.app.parseFeatureString(attributes['dala:start']);
    var endNodeFeature = util.app.parseFeatureString(attributes['dala:end']);

    var startNode = this.diagram.getNodeById(startNodeFeature.type);
    var endNode = this.diagram.getNodeById(endNodeFeature.type);

    this.setStartNode(startNode, startNodeFeature);
    this.setEndNode(endNode, endNodeFeature);
};

Transition.prototype.setStartNode = function(node, feature) {
    if(object.isDefined(this.startNode)) {
        this.startNode.removeOutgoingTransition(this);
    }

    // Init node connection and check dom position
    this.startNode = node;
    this.startNode.addOutgoingTransition(this);

    if(!this.isInitState()) {
        this.checkDomPosition();
    }

    // Set relative startnode orientation and update
    this.setStartNodeFeature(feature);
    this.update();
};

Transition.prototype.setStartNodeFeature = function(feature) {
    if(object.isDefined(feature) && object.isDefined(feature.value)) {
        this.group.attr({'dala:start':util.app.createFeatureString(this.startNode.id, feature.value)});
        this.docking.getStartDocking().relativeOrientation(this.startNode.getRelativePosition(feature.value[0], feature.value[1]));
    } else {
        this.group.attr({'dala:start':this.startNode.id});
        this.docking.getStartDocking().clearRelativeOrientation();
    }
};

Transition.prototype.setRelativeStartDocking = function(x,y) {
    this.setStartNodeFeature({
        value : [x,y]
    });
};

Transition.prototype.getGradien = function(x,y) {
    var position = util.app.getPoint(x,y);
    var index = this.docking.getDockingIndexForPoint(position);
    var p1 = this.docking.getDockingFromIndex(index).position();
    var p2 = this.docking.getDockingFromIndex(index + 1).position();
    return util.math.Line.calcGradient(p1, p2);
};

Transition.prototype.getGradientByIndex = function(index) {
    var p1 = this.docking.getDockingFromIndex(index).position();
    var p2 = this.docking.getDockingFromIndex(index + 1).position();
    return util.math.Line.calcGradient(p1, p2);
};

Transition.prototype.getGradientByIndex = function(index) {
    var p1 = this.docking.getDockingFromIndex(index).position();
    var p2 = this.docking.getDockingFromIndex(index + 1).position();
    return util.math.Line.calcGradient(p1, p2);
};

Transition.prototype.getVectorByIndex = function(index, fromEnd) {
    var p1, p2;
    if(fromEnd) {
        p1 = this.docking.getDockingFromEndIndex(index + 1).position();
        p2 = this.docking.getDockingFromEndIndex(index).position();
    } else {
        p1 = this.docking.getDockingFromIndex(index).position();
        p2 = this.docking.getDockingFromIndex(index + 1).position();
    }
    return util.math.Line.calcNormalizedLineVector(p1, p2);
};

Transition.prototype.getLineByIndex = function(index, fromEnd) {
    var p1, p2;
    if(fromEnd) {
        p1 = this.docking.getDockingFromEndIndex(index + 1).position();
        p2 = this.docking.getDockingFromEndIndex(index).position();
    } else {
        p1 = this.docking.getDockingFromIndex(index).position();
        p2 = this.docking.getDockingFromIndex(index + 1).position();
    }
    return new util.math.Line(p1, p2);
};

Transition.prototype.setEndNode = function(node, feature) {
    if(object.isDefined(this.endNode)) {
        this.endNode.removeIncomingTransition(this);
    }

    // Init node connection and check dom position
    this.endNode = node;
    this.endNode.addIncomingTransition(this);
    this.checkDomPosition();

    if(this.isInitState()) {
        this.initEvents();
        this.docking.add(this.end);
    }

    // Set relatvie endnode orientation and update
    this.setEndNodeFeature(feature);
    this.line.attr({style:STYLE_TRANSITION_INACTIVE});
    this.update();
};

Transition.prototype.setEndNodeFeature = function(feature) {
    if(this.hasEndNode()) {
        if(object.isDefined(feature) && object.isDefined(feature.value)) {
            this.group.attr({'dala:end':util.app.createFeatureString(this.endNode.id, feature.value)});
            this.docking.getEndDocking().relativeOrientation(this.endNode.getRelativePosition(feature.value[0], feature.value[1]));
        } else {
            this.group.attr({'dala:end':this.endNode.id});
            this.docking.getEndDocking().clearRelativeOrientation();
        }
    }
};

Transition.prototype.executeAddition = function(func, args) {
    object.each(this.additions, function(key, addition) {
        if(object.isDefined(addition) && object.isFunction(addition[func])) {
            addition[func].apply(addition, args);
        }
    });
};

Transition.prototype.undockStart = function() {
    this.undockEdgeDocking('Start');
};

Transition.prototype.undockEnd = function() {
    this.undockEdgeDocking('End');
};

Transition.prototype.undockEdgeDocking = function(dockingType) {
    var that = this;
    //We wait till the drag event stops (mouseup)
    event.once(this.diagram.svg.getRootNode(), "mouseup", function(mouseUpEvent) {
        var mouse = that.diagram.getStagePosition(mouseUpEvent);
        var hoverNode = that.diagram.overlaysNode(mouse);
        if(hoverNode !== that['get'+dockingType+'Node']()) {
            //If we are hovering another node we swap start/end node
            that['set'+dockingType+'Node'](hoverNode);
        } else if(hoverNode === that['get'+dockingType+'Node']()){
            //If we are hovering the same node we set a relative docking
            that['setRelative'+dockingType+'Docking'](mouse.x, mouse.y);
            that.update();
        } else {
            //Mouse is hovering empty space
            that.update();
        }
    });
};

Transition.prototype.setRelativeEndDocking = function(x,y) {
    this.setEndNodeFeature({
        value : [x,y]
    });
};

Transition.prototype.isInitState = function() {
    return !object.isDefined(this.endNode) || this.docking.size() < 2;
};

/**
 * Initializes a new transition by creating the svg nodes and startdocking
 *
 * @param {type} mouse
 * @returns {Transition_L1.Transition.prototype}
 */
Transition.prototype.init = function(mouse) {
    this.start = this.docking.calcStartDockingPosition(mouse);

    //Since the line and linearea do have the same path we just bind the line path to linearea
    var path = new PathData().start(this.start.x, this.start.y).line(mouse.x, mouse.y);

    //TODO DIFFERENT TYPES USE Path
    this.line = this.svg.path({
        d : path,
        style  : STYLE_TRANSITION_ACTIVE
    });

    this.endMarker('trianglefill');

    this.lineArea = this.svg.path({
        d : path,
        style  : STYLE_AREA
    });

    this.id = Date.now();

    this.group = this.svg.g({prepend:true, "class":'transition', "dala:start":this.startNode.id, 'id':this.id}, this.line, this.lineArea);

    this.docking.add(this.start);
    return this;
};

Transition.prototype.initEvents = function() {
    var that = this;

    this.lineArea.hoverable({
        in: function() {
            that.line.attr({style:STYLE_TRANSITION_ACTIVE});
        },
        out: function() {
            if(!that.selected) {
                that.line.attr({style:STYLE_TRANSITION_INACTIVE});
            }
        }
    });

    this.lineArea.mousedown(function(mainEvent) {
        mainEvent.preventDefault();
        that.event.trigger('transition_select', that);

        var dragInitiated = false;
        var startPosition = that.diagram.getStagePosition(mainEvent.pageX, mainEvent.pageY);
        var dockingIndex = that.docking.getDockingIndexForPoint(startPosition);

        if (dockingIndex !== 'undefined') {
            event.on(that.diagram.svg.getRootNode(), "mouseup", function(evt) {
                event.off(that.diagram.svg.getRootNode(), "mousemove");
            });
            event.on(that.diagram.svg.getRootNode(),"mousemove", function(event) {
                var stagePosition = that.diagram.getStagePosition(event.pageX, event.pageY);

                //We just start the drag event in case we move more thant 5px away
                if(!dragInitiated && (Math.abs(stagePosition.x - startPosition.x) > 5 || (stagePosition.y - startPosition.y) > 5)) {
                    var docking = that.docking.addInnerDocking(startPosition, dockingIndex);
                    docking.initDrag(event);
                    dragInitiated = true;
                } else if(dragInitiated) {
                    //that.docking.updateTransitionDocking(stagePosition, dockingIndex);
                }
            });
        }
    });
};

Transition.prototype.checkDomPosition = function() {
    var maxNodeIndex = Math.max(this.startNode.index(), this.endNode.index());
    var transitionIndex = this.index();

    if(transitionIndex < maxNodeIndex) {
        dom.insertAfterIndex(this.group.instance(), maxNodeIndex);
    }
};

Transition.prototype.index = function() {
    return dom.index(this.group.instance());
};

Transition.prototype.endMarker = function(marker) {
    return this.marker('end', marker);
};

Transition.prototype.startMarker = function(marker) {
    return this.marker('start', marker);
};

Transition.prototype.marker = function(type, marker) {
    var key = 'marker-'+type;
    if(object.isDefined(marker)) {
        this.line.attr(key, this.getMarkerSelector(marker));
    } else {
        var markerStr = this.line.attr(key);
        if(object.isDefined(markerStr)) {
            return markerStr.substring(5, markerStr.length - 1);
        }
    }
};

Transition.prototype.getMarkerSelector = function(marker) {
    return 'url(#'+marker+'_'+this.diagram.id+')';
}

Transition.prototype.select = function() {
    this.line.attr({style:STYLE_TRANSITION_ACTIVE});
    this.selected = true;
};

Transition.prototype.deselect = function() {
    this.line.attr({style:STYLE_TRANSITION_INACTIVE});
    this.selected = false;
};

Transition.prototype.getStartNode = function() {
    return this.startNode;
};

Transition.prototype.getEndNode = function() {
    return this.endNode;
};

Transition.prototype.redraw = function(transitionArray) {
    this.line.plot(transitionArray);
};

Transition.prototype.remove = function() {
    this.removed = true;
    this.group.remove();
    this.startNode.removeOutgoingTransition(this);
    this.endNode.removeIncomingTransition(this);
    this.event.trigger('transition_removed', this);
    this.docking.remove();
};

Transition.prototype.hasEndNode = function() {
    return typeof this.endNode !== 'undefined';
};

Transition.prototype.update = function(mouse) {
    this.updateEnd(mouse);
    this.updateStart(mouse);
    this.redraw();
    this.executeAddition('update');
};

Transition.prototype.getEndDocking = function() {
    return this.docking.getEndDocking();
};

Transition.prototype.getStartDocking = function() {
    return this.docking.getStartDocking();
};

Transition.prototype.redraw = function() {
    this.line.update();
    this.lineArea.update();
};

Transition.prototype.updateStart = function(mouse) {
    this.start = this.docking.calcStartDockingPosition(mouse);
    var by = this.getStartNode().getBottomY();
    this.line.data().start(this.start.x, this.start.y);
    this.docking.getStartDocking().moveTo(this.start.x, this.start.y);
};

Transition.prototype.updateEnd = function(mouse) {
    if (object.isDefined(this.endNode)) {
        this.end = this.docking.calcEndDockingPosition();
        this.docking.getEndDocking().moveTo(this.end.x, this.end.y);
    } else if(object.isDefined(mouse)){
        this.end = this.getEndPositionForMouse(mouse);
    }

    //While activating its possible that we have no endNode and no mouse...
    if(object.isDefined(this.end)) {
        this.line.data().end(this.end.x, this.end.y);
    }
};

Transition.prototype.getEndPositionForMouse = function(mouse) {
    //This prevents the line rendering to overlap the exact mouse
    var newX = (this.start.x < mouse.x) ? mouse.x - 1 : mouse.x + 1;
    var newY = (this.start.y < mouse.y) ? mouse.y - 1 : mouse.y + 1;
    return {
        x : newX,
        y : newY
    };
};

module.exports = Transition;