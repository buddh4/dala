var util = require('../util/util');
var event = require('../core/event');
var TransitionKnobManager = require('./transitionKnobManager');
var TransitionDockingManager = require('./transitionDockingManager');
var TransitionPathManager = require('./curvePathManager');
var transitionAdditions = require('./transitionAdditions');

var STYLE_TRANSITION_ACTIVE = "stroke:red;stroke-width:1;fill:none;";
var STYLE_TRANSITION_INACTIVE = "stroke:black;stroke-width:1;fill:none;";
var STYLE_AREA = "stroke:grey;stroke-opacity:0.0;stroke-width:11;fill:none;";

var object = util.object;
var dom = util.dom;

var Transition = function(node) {
    if(node) {
        this.diagram = node.diagram;
        this.event = node.event;
        this.svg = this.diagram.svg;

        //Initialize the transition docking mechanism (start/end) docking to nodes.
        this.dockingManager = new TransitionDockingManager(this, node);
        //Initialize the path creator which creates the path with the help of the knobs and a given transitiontype.
        this.pathManager = new TransitionPathManager(this);
        //Initialize the transition knob mechanism for (start/end) and inner knobs for manipulating transitions
        this.knobManager = new TransitionKnobManager(this);

        transitionAdditions.init(this);
    }
};

/**
 * Initializes a new transition by creating the svg nodes and startdocking
 *
 * @param {type} mouse
 */
Transition.prototype.init = function(mouse) {
    //TODO: user UUID.new or something
    this.id = Date.now();
    //Initializes the transition group container
    this.initSVGGroup();
    //Calculate start position for outer orientation (mouse position)
    var start = this.dockingManager.calculateStart(mouse);
    //Init knob for startPosition
    var startKnob = this.knobManager.init(start);
    //Create SVG Elements in dom and transition events
    this.initTransitionSVG();
    this.initEvents();
    //This will initiate the node docking feature note: this is dependent on the svg creation.
    this.dockingManager.init(startKnob);
    return this;
};

Transition.prototype.initSVGGroup = function() {
    this.group = this.svg.g({prepend:true, "class":'transition'});
}

Transition.prototype.initTransitionSVG = function() {
    var path = this.pathManager.path;

    //Note we share the path between line and lineArea an update
    this.line = this.svg.path({
        d : path,
        style  : STYLE_TRANSITION_ACTIVE
    });

    this.lineArea = this.svg.path({
        d : path,
        style  : STYLE_AREA
    });

    //TODO: make this configurable in node template or something !!!
    this.endMarker('trianglefill');

    this.group.prepend(this.lineArea, this.line);
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

    this.lineArea.mousedown(function(evt) {
        evt.preventDefault();
        that.event.trigger('transition_select', that);

        var dragInitiated = false;
        var startPosition = that.diagram.getStagePosition(evt.pageX, evt.pageY);
        var knobIndex = that.pathManager.getPathIndexForPosition(startPosition);

        if (knobIndex) {
            event.on(that.diagram.svg.getRootNode(), "mouseup", function(evt) {
                event.off(that.diagram.svg.getRootNode(), "mousemove");
            });
            event.on(that.diagram.svg.getRootNode(),"mousemove", function(event) {
                var movePosition = that.diagram.getStagePosition(event.pageX, event.pageY);

                //We just start the drag event in case we move more thant 5px away
                if(!dragInitiated && util.app.isMinDist(startPosition, movePosition, 5)) {
                    var knob = that.knobManager.addKnob(startPosition, knobIndex);
                    knob.initDrag(event);
                    dragInitiated = true;
                }
            });
        }
    });
};

Transition.prototype.isInitState = function() {
    return !this.dockingManager.endNode;
};

Transition.prototype.update = function(mouse) {
    this.updateEnd(mouse);
    this.updateStart(mouse);
    this.redraw();
    this.executeAddition('update');
};

Transition.prototype.redraw = function() {
    if(this.line && this.lineArea) {
        this.line.update();
        this.lineArea.update();
    }
};

Transition.prototype.updateStart = function(mouse) {
    this.knobManager.updateKnob(0, this.dockingManager.calculateStart(mouse));
};

Transition.prototype.updateEnd = function(mouse) {
    var end = this.dockingManager.calculateEnd(mouse);
    if(this.isInitState()) { //In initstate we dont have a endKnob yet so we update the pathManager by hand
        this.pathManager.dragLine(end);
    } else {
        this.knobManager.updateKnob(-1, end);
    }
};

Transition.prototype.setStartNode = function(node, feature) {
    this.dockingManager.setStartNode(node,feature);

    if(!this.isInitState()) {
        this.checkDomPosition();
    }

    this.update();
};

Transition.prototype.setEndNode = function(node) {
    this.dockingManager.setEndNode(node);

    if(this.knobManager.isInitState()) {
        var endPosition = this.dockingManager.calculateEnd();
        this.dockingManager.setEndKnob(this.knobManager.addKnob(endPosition));
    }

    this.checkDomPosition();

    //TODO: ?? rather use this.inactivate or something
    this.line.attr({style:STYLE_TRANSITION_INACTIVE});
    this.update();
};

Transition.prototype.checkDomPosition = function() {
    var maxNodeIndex = Math.max(this.dockingManager.startNode.index(), this.dockingManager.endNode.index());
    var transitionIndex = this.index();

    if(transitionIndex < maxNodeIndex) {
        dom.insertAfterIndex(this.group.instance(), maxNodeIndex);
    }
};

Transition.prototype.remove = function() {
    this.removed = true;
    this.group.remove();
    this.dockingManager.remove();
    this.event.trigger('transition_removed', this);
};

Transition.prototype.executeAddition = function(func, args) {
    object.each(this.additions, function(key, addition) {
        if(object.isDefined(addition) && object.isFunction(addition[func])) {
            addition[func].apply(addition, args);
        }
    });
};

Transition.prototype.index = function() {
    return this.group.$().index();
};

Transition.prototype.instance = function() {
    if(this.group) {
        return this.group.instance();
    }
};

Transition.prototype.endMarker = function(marker) {
    return this.marker('end', marker);
};

Transition.prototype.startMarker = function(marker) {
    return this.marker('start', marker);
};

Transition.prototype.marker = function(type, marker) {
    var key = 'marker-'+type;
    if(marker) {
        this.line.attr(key, this.getMarkerSelector(marker));
    } else {
        var markerStr = this.line.attr(key);
        if(markerStr) {
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

Transition.prototype.getEndKnob = function() {
    return this.dockingManager.endKnob;
};

Transition.prototype.getStartKnob = function() {
    return this.dockingManager.startKnob;
};

Transition.prototype.getStartDockingLocation = function() {
    return this.dockingManager.getStartDockingLocation();
};

Transition.prototype.getEndDockingLocation = function() {
    return this.dockingManager.getEndDockingLocation();
};

module.exports = Transition;