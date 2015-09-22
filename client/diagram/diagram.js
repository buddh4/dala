/**
 * This class represents an instance of a diagram and is responsible for initializing and
 * building the stage. Furthermore it contains diagram related utility functionality.
 *
 * An instance of this class offers the access to all nodes/transitions and templates of the
 * diagram.
 *
 * This class is designed to be able to manage multiple diagrams within one
 * application instance.
 */
var util = require('../util/util');
var event = require('../core/event');
var SVG = require('../svg/svg');
var PathData = require('../svg/pathData'); //Rather implement svg.createpath().start().line()...
var templateManager = require('./templateManager').init();
var commandManager = require('../core/commandManager');
var SelectionManager = require('./selectionManager');
var NodeManager = require('./nodeManager');
var TransitionManager = require('./transitionManager');
var KnobManager = require('./knobManager');
require('./knobTemplate');
var Promise = require('bluebird');
var Config = require('../core/config');
var xml = require('../util/xml');

var Helper = require('./helper');

var object = util.object;
var dom = util.dom;


var CONTAINER_SELECTOR = '#svgStage';
// Contains the parent dom node (div) of the SVG element
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);

/**
 * Constructor for initiating a new diagram instance within the containerID.
 *
 * @param {type} containerID The parent of the new SVG diagram
 * @param {type} cfg
 */
 var Diagram = function(cfg) {
    cfg = cfg || {};

    if(!cfg.id) {
        console.warn('Created diagram without id');
    }

    this.id = cfg.id || 'not specified';
    this.projectId = cfg.projectId || 'default';
    this.title = cfg.title || 'new';

    //Diagram intern event context
    this.event = event.sub(this.id);

    if(cfg.container) {
        this.$containerNode = $(cfg.container);
    } else {
        this.$containerNode = $CONTAINER_NODE;
    }

    this.commandMgr = commandManager.sub(this.id, function(cmd) {
        event.trigger('diagram_updated', cfg.id);
    });

    // Handles the loading and creation of templates
    this.templateMgr = templateManager;
    // Responsible for creating and maintaining nodes
    this.nodeMgr = new NodeManager(this);
    // Responsible for creating and maintaining transitions
    this.transitionMgr = new TransitionManager(this);
    // This helper class manages the selection of nodes/transitions
    this.selectionMgr = new SelectionManager(this);
    // Responsible for tracking and accessing all dockings on the diagram
    this.knobMgr = new KnobManager(this);

    // Build the SVG stage within the container
    this.svg = new SVG(this.$containerNode.attr('id'), {"xmlns:dala" : "http://www.dala.com"});

    // Init stage related and key events
    this.initEvents();

    this.scale = 1;

    //TODO: load defs/marker on demand
    this.initDefs();

    this.mainPart = this.svg.createPart('main', true);
    this.helper = new Helper(this);
};

Diagram.prototype.getNodes = function(filter) {
    return this.nodeMgr.getNodes(filter);
};

/*
 * Initializes Stage Mouse and Key events.
 */
Diagram.prototype.initEvents = function() {
    var that = this;
    // Double clicks on the stage area will create new nodes of the selected
    // template type. Only if we do not dbclick another node in this case
    // we start a transition drag.
    event.on(this.svg.getRootNode(), 'dblclick', function(evt) {
        if (!that.selectionMgr.isElementHover()) {
            that.event.trigger('node_create', that.templateMgr.getSelectedTemplate(), evt);
        }
    });

    event.on(this.svg.getRootNode(), 'mousedown', function(evt) {
        var startPosition = that.getStagePosition(evt);
        this.mouseDownPosition = startPosition;

        if(evt.ctrlKey) {
            //Move main part
            that.mainPart.draggable({
                once: true,
                cursor: 'all-scroll',
                dragMove: function(event, dx, dy) {
                    that.event.trigger('viewport_update', this.position());
                },
                dragEnd: function(event) {
                    that.event.trigger('viewport_updated', this.position());
                },
                restrictionX: function(event, dx, dy) {
                  return (this.x() + dx <= 0)? dx : 0;
                },
                restrictionY: function(event, dx, dy) {
                    return (this.y() + dy <= 0)? dy : 0;
                },
                getScale: function() {
                    return that.scale;
                }
            });
            event.triggerDom(that.mainPart.instance(), 'mousedown');
            return;
        }

        // INIT drag selection
        if (!that.selectionMgr.isElementHover()) {
            that.selectionMgr.clear();
            evt.preventDefault();
            var moveSelection = function(evt) {
                var stagePosition = that.getStagePosition(evt);
                var path = new PathData().start(startPosition)
                    .line(startPosition)
                    .line(stagePosition)
                    .line(stagePosition)
                    .complete();
                if(!that.dragSelection) {
                    that.dragSelection = that.svg.path({
                        d : path,
                        style : 'stroke:gray;stroke-width:1px;stroke-dasharray:5,5;fill:none;'
                    });
                } else {
                    //Move selection away from mouse pointer
                    var alignedMouseX = stagePosition.x -1;
                    var alignedMouseY = stagePosition.y -1;

                    that.dragSelection.data().clear().start(startPosition)
                        .line({x: startPosition.x,  y: alignedMouseY})
                        .line({x: alignedMouseX,    y: alignedMouseY})
                        .line({x: alignedMouseX,    y: startPosition.y})
                        .complete();
                    that.dragSelection.update();

                    object.each(that.nodeMgr.nodes, function(id, node) {
                        if(that.dragSelection.overlays(node.getCenter())) {
                            that.selectionMgr.addSelectedNode(node);
                        } else {
                            that.selectionMgr.removeSelectedNode(node);
                        }
                    });


                    object.each(that.knobMgr.dockings, function(id, docking) {
                        if(that.dragSelection.overlays(docking.position())) {
                            that.selectionMgr.addSelectedNode(docking.node);
                        } else {
                            that.selectionMgr.removeSelectedNode(docking.node);
                        }
                    });
                }
            };
            event.on(that.svg.getRootNode(), 'mousemove', moveSelection);
        }
    });

    event.on(document, 'mouseup', function(evt) {
        event.off(that.svg.getRootNode(), 'mousemove');
        if(object.isDefined(that.dragSelection)) {
            that.dragSelection.remove();
            delete that.dragSelection;
        }
    });

    event.on(document, "dragstart", function(e) {
        if (e.target.nodeName.toUpperCase() === "POLYLINE" || e.target.nodeName.toUpperCase() === 'PATH' || e.target.nodeName.toUpperCase() === 'CIRCLE') {
            e.preventDefault();
            return false;
        }
    });
};

Diagram.prototype.part = function(id) {
    return this.svg.part(id);
};

Diagram.prototype.import = function(svg, part, prepend) {
    return this.svg.import(svg, part, prepend);
};

Diagram.prototype.part = function(id) {
    return this.svg.part(id);
};

Diagram.prototype.initDefs = function() {
    var that = this;
    this.templateMgr.getTemplate('defs_marker')
    .then(function(tmpl) {
        if(tmpl) {
            tmpl.createNode({diagramId:that.id}, that).init('root', true);
        } else {
            console.error('Could initialize defs template result undefined');
        }
    }, function(err) {
        console.error('Could not initialize defs template :'+err);
    });
};

Diagram.prototype.createKnob = function(p, group, cfg) {
    var config = object.extend({node_id:'docking_'+Date.now(), x: p.x, y: p.y}, cfg);
    var node = this.templateMgr.getTemplateSync('knob_circle').createNode(config, this).init();
    if(group) {
        this.svg.addToGroup(group, node.root);
    }
    return node;
};

Diagram.prototype.getHoverNode = function() {
    return this.nodeMgr.hoverNode;
};

Diagram.prototype.isMultiSelection = function() {
    return this.selectionMgr.isMultiSelection();
};

Diagram.prototype.getEditItem = function(node, editKey) {
    return this.nodeMgr.getEditItem(node, editKey);
};

Diagram.prototype.setEditValue = function(node, editKey, newValue) {
    return this.nodeMgr.setEditValue(node, editKey, newValue);
};

Diagram.prototype.isPoint = function(value) {
    return object.isDefined(value.x);
};

Diagram.prototype.newDiagram = function() {
    //TODO: we should unify this with the constructor svg creation technique
    this.loadDiagram('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="svgStage_svg" xmlns:dala="http://www.dala.com" height="100%" width="100%"></svg>');
    this.initDefs();
};

Diagram.prototype.loadDiagram = function(svgString) {
    //TODO: rather handle this per event
    this.selectionMgr.clear();
    this.nodeMgr.clear();
    this.$containerNode.empty();
    this.svg.setRoot(dom.importSVG(this.svg.$containerNode, svgString));
    this.activateNodes();
    this.activateTransitions();
    this.initEvents();
};

Diagram.prototype.triggerDockingVisibility = function() {
    if(this.knobMgr.hideDocking) {
        this.knobMgr.showKnobs();
    } else {
        this.knobMgr.hideKnobs();
    }
};

Diagram.prototype.activateNodes = function() {
    var that = this;
    $('.element_root').each(function() {
        that.activateNode(this);
    });
};

Diagram.prototype.activateNode = function(domNode) {
    var attributes = dom.getAttributes(domNode);
    var tmplId = attributes['dala:tmpl'];
    var rootId = attributes['id'];

    var that = this;
    var tmpl = this.templateMgr.getTemplate(tmplId)
        .then(function(tmpl) {
            that.nodeMgr.activateNode(rootId, tmpl);
        });
};

//TODO: move to transitionmgr
Diagram.prototype.activateTransitions = function() {
    this.transitionMgr.activateTransition($('.transition'));
};

Diagram.prototype.getNodeById = function(nodeId) {
    return this.nodeMgr.getNode(nodeId);
};

Diagram.prototype.getTransitionById = function(id) {
    return this.transitionMgr.getNode(id);
};

Diagram.prototype.zoomIn = function() {
    this.scale += 0.1;
    this.part('main').scale(this.scale);
};

Diagram.prototype.zoomOut = function() {
    if(this.scale > 0) {
        this.scale -= 0.1;
        this.part('main').scale(this.scale);
    }
};

/**
 * This method determines the relative stage coordinates for a given
 * window position either by providing the x and y position or an event
 * object with given pageX and pageY attributes or an point with x,y attributes.
 *
 * @param {type} x either an event object with pageX, pageY or an point with x,y
 *                 or just the plain x coordinate.
 * @param {type} y the y coordinate is just mandatory if the fisrst arg is the plain x
 * @returns {Diagram_L13.Diagram.prototype.getStagePosition.DiagramAnonym$2}
 */
Diagram.prototype.getStagePosition = function(x, y) {
    if(object.isDefined(x.pageX)) {
        y = x.pageY;
        x = x.pageX;
    } else if(object.isDefined(x.x)) {
        y = x.y;
        x = x.x;
    }

    var stagePosition = this.$containerNode.offset();
    var viewPointAlignment = this.mainPart.position();

    //TODO: viewbox alignement ?
    return {
        x : parseInt((x  - stagePosition.left - viewPointAlignment.x) / this.scale),
        y : parseInt((y  - stagePosition.top - viewPointAlignment.y) / this.scale)
    };
};

/**
 * Checks if a given position is within the boundaries of a diagram node.
 *
 * @param {type} position
 * @returns {Boolean}
 */
Diagram.prototype.overlaysNode = function(position) {
    var result;
    object.each(this.nodeMgr.nodes, function() {
        if (this.overlays(position)) {
            result = this;
            return false;
        }
    });

    return result;
};

Diagram.prototype.asString = function() {
    return this.svg.asString();
};

Diagram.prototype.undoCommand = function() {
    this.commandMgr.undo();
};

Diagram.prototype.redoCommand = function() {
    this.commandMgr.redo();
};

Diagram.prototype.registerCommand = function(cmdId, cmd) {
    this.commandMgr.register(cmdId, cmd);
};

Diagram.prototype.executeCommand = function(cmdId, doArgs, undoArgs) {
    this.commandMgr.exec(cmdId, doArgs, undoArgs);
};

Diagram.prototype.addCommand = function(cmdId, doArgs, undoArgs) {
    this.commandMgr.add(cmdId, doArgs, undoArgs);
};

module.exports = Diagram;

