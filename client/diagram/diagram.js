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
var DiagramAPI = require('./api');

var fileManager = require('../core/fileManager');

var Eventable = require('./../dom/eventableNode');

var Knob = require('./knob');

var KnobManager = require('./knobManager');
require('./knobTemplate');
require('./imageTemplate');
var xml = require('../util/xml');

var Promise = require('bluebird');

var Helper = require('./../svg/helper');

var config = require('../core/config');

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
var Diagram = function (cfg) {
    cfg = cfg || {};

    if (!cfg.id) {
        console.warn('Created diagram without id');
    }

    this.uniqueIds = [];

    this.id = cfg.id || 'not specified';
    this.projectId = cfg.projectId || 'default';
    this.title = cfg.title || 'new';
    this.config = config;

    //Diagram intern event context
    this.event = event.sub(this.id);

    if (cfg.container) {
        this.$container = $(cfg.container);
    } else {
        this.$container = $CONTAINER_NODE;
    }

    // Build the SVG stage within the container
    this.svg = new SVG(this.$container.attr('id'), this.ns());
    this.eventBase = this.svg.root;

    var that = this;
    this.commandMgr = commandManager.sub(this.id, function (cmd) {
        that.triggerUpdate();
    });

    // Handles the loading and creation of templates
    this.templateMgr = templateManager;
    // This helper class manages the selection of nodes/transitions
    this.selectionMgr = new SelectionManager(this);
    // Responsible for creating and maintaining nodes
    this.nodeMgr = new NodeManager(this);
    // Responsible for creating and maintaining transitions
    this.transitionMgr = new TransitionManager(this);
    // Responsible for tracking and accessing all dockings on the diagram
    this.knobMgr = new KnobManager(this);

    // Init stage related and key events
    this.initEvents();

    this.scale = 1;

    //This is used by the eventable addition in case there are event restrictions (move mode...)
    this.excludeEventRestrictions = true;

    this.background = this.svg.createPart('background');
    this.svg.rect({width: '100%', height: '100%', fill: '#FFFFFF'}, 'background');

    var that = this;
    this.initDefs()
        .then(function () {
            that.initialized = true;
            that.mainPart = that.svg.createPart('main', true);
            that.mainPart.excludeEventRestrictions = true;
            that.helper = that.svg.helper();
            that.trigger('initialized');
        }, function (err) {
            console.error('Could not load defs initialisation failed!');
        });
};

util.inherits(Diagram, Eventable);

Diagram.prototype.ns = function () {
    return {"xmlns:dala": "http://www.dala.com"};
};

Diagram.prototype.getRootSVG = function () {
    return this.svg.root;
};

Diagram.prototype.triggerUpdate = function () {
    this.trigger('diagram_updated', this.id);
};

Diagram.prototype.getNodes = function (filter) {
    return this.nodeMgr.getNodes(filter);
};

Diagram.prototype.trigger = function (evt, args) {
    //perhaps also listen to diagram intern events not only dom events.
    this.svg.root.trigger(evt, args);
    this.event.trigger(event, args);
};

/*
 * Initializes Stage Mouse and Key events.
 */
Diagram.prototype.initEvents = function () {
    var that = this;
    // Double clicks on the stage area will create new nodes of the selected
    // template type. Only if we do not dbclick another node in this case
    // we start a transition drag.
    this.on('dblclick', function (evt) {
        if (config.is('diagram_mode_draw_transition')) {
            var position = that.getStagePosition(evt);
            that.createFreeTransition(position, position, true);
        } else if (!that.selectionMgr.isElementHover() && !config.is('diagram_mode_move')) {
            that.event.trigger('node_create', that.templateMgr.getSelectedTemplate(), evt);
        }
    }).on('mousedown', function (evt) {
        var startPosition = that.getStagePosition(evt);

        if (evt.ctrlKey || config.is('diagram_mode_move')) {
            //Move main part
            that.mainPart.draggable({
                once: true,
                cursor: 'all-scroll',
                dragMove: function (event, dx, dy) {
                    that.event.trigger('viewport_update', this.position());
                },
                dragEnd: function (event) {
                    that.event.trigger('viewport_updated', this.position());
                },
                restrictionX: function (event, dx, dy) {
                    return (this.x() + dx <= 0) ? dx : 0;
                },
                restrictionY: function (event, dx, dy) {
                    return (this.y() + dy <= 0) ? dy : 0;
                },
                getScale: function () {
                    return that.scale;
                }
            });
            that.mainPart.trigger('mousedown');
        } else {
            that.selectionMgr.dragSelectionStart(evt, startPosition);
        }

    });

    this.on('mouseup', function () {
        that.selectionMgr.dragSelectionEnd();
    });

    event.on(document, "dragstart", function (e) {
        if (e.target.nodeName.toUpperCase() === "POLYLINE" || e.target.nodeName.toUpperCase() === 'PATH' || e.target.nodeName.toUpperCase() === 'CIRCLE') {
            e.preventDefault();
            return false;
        }
    });
};

Diagram.prototype.createFreeTransition = function (start, end, initDrag, group) {
    var startKnob = new Knob(this, start, {radius: 10}, group).draggable();
    var endKnob = new Knob(this, end, {radius: 10}, group).draggable();
    var transition = this.createTransition(startKnob.node, endKnob.node);

    if (group) {
        group.append(transition);
    }

    if (initDrag) {
        endKnob.initDrag();
    }

    transition.on('remove', function () {
        startKnob.remove();
        endKnob.remove();
    });

    startKnob.on('remove', function () {
        transition.remove();
    });

    endKnob.on('remove', function () {
        transition.remove();
    });

    return {
        startKnob: startKnob,
        endKnob: endKnob,
        transition: transition
    }
};

Diagram.prototype.part = function (id) {
    return this.svg.part(id);
};

Diagram.prototype.height = function () {
    return (this.nodeMgr.size()) ? this.nodeMgr.getBottomNode().getBottomY(true) : 0;
};

Diagram.prototype.width = function () {
    return (this.nodeMgr.size()) ? this.nodeMgr.getRightNode().getRightX(true) : 0;
};

Diagram.prototype.dimensions = function (id) {
    if (this.nodeMgr.size()) {
        var leftNode = this.nodeMgr.getLeftNode();
        var topNode = this.nodeMgr.getTopNode();
        var rightNode = this.nodeMgr.getRightNode();
        var bottomNode = this.nodeMgr.getBottomNode();
        return {
            width: rightNode.getRightX(),
            height: bottomNode.getBottomY(),
            x: leftNode.x(),
            y: bottomNode.y(),
        }
    } else {
        return {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
        }
    }
};

Diagram.prototype.import = function (svg, part, prepend) {
    return this.svg.import(svg, part, prepend);
};

Diagram.prototype.part = function (id) {
    return this.svg.part(id);
};

Diagram.prototype.initDefs = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.templateMgr.getTemplate('defs_marker')
            .then(function (tmpl) {
                if (tmpl) {
                    tmpl.createNode({diagramId: that.id}, that).init('root', true);
                    resolve();
                } else {
                    reject('Could initialize defs template result undefined');
                }
            }, function (err) {
                reject(err);
            });
    });
};

Diagram.prototype.createKnobNode = function (p, group, cfg) {
    return this.knobMgr.createKnobNode(p, group, cfg);
};

Diagram.prototype.activateKnobNode = function (svgNode, cfg) {
    return this.knobMgr.activateKnobNode(svgNode, cfg);
};

Diagram.prototype.uniqueId = function () {
    var newId = this.checkId(Date.now() + '');
    this.uniqueIds.push(newId);
    return newId;
};

/**
 * Prevent duplicates
 */
Diagram.prototype.checkId = function (id) {
    return ($.inArray(id, this.uniqueIds) > -1) ? this.checkId('u' + id) : id;
};

Diagram.prototype.isMultiSelection = function () {
    return this.selectionMgr.isMultiSelection();
};


Diagram.prototype.newDiagram = function () {
    //TODO: we should unify this with the constructor svg creation technique
    this.loadDiagram('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="svgStage_svg" xmlns:dala="http://www.dala.com" height="100%" width="100%"></svg>');
    this.initDefs();
};
Diagram.prototype.loadDiagram = function (svgString, callback) {
    //TODO: rather handle this per event or in constructor
    this.clear();
    this.svg.setRoot(dom.importSVG(this.svg.$container, svgString));
    this.getRootSVG().height('100%');
    this.getRootSVG().width('100%');
    var that = this;
    this.activateNodes().then(function () {
        that.activateTransitions();
        that.initEvents();
        if (object.isFunction(callback)) {
            callback(that);
        }
        that.selectionMgr.clear();
    });
};

Diagram.prototype.clear = function () {
    this.$container.empty();
    this.nodeMgr.clear();
    this.selectionMgr.clear();
};

Diagram.prototype.triggerDockingVisibility = function () {
    if (this.knobMgr.hideDocking) {
        this.knobMgr.showKnobs();
    } else {
        this.knobMgr.hideKnobs();
    }
};

Diagram.prototype.activateNodes = function () {
    var that = this;
    var promises = [];
    this.getRootSVG().$().find('.element_root').each(function () {
        promises.push(that.nodeMgr.activateNode(this));
    });
    return Promise.all(promises);
};

//TODO: move to transitionmgr
Diagram.prototype.activateTransitions = function () {
    this.transitionMgr.activateTransition($('.transition'));
};

Diagram.prototype.getNodeById = function (nodeId) {
    var result =  this.nodeMgr.getNode(nodeId);
    if(!result) {
        result = this.knobMgr.getKnobNode(nodeId);
    }
    return result;
};

Diagram.prototype.getTransitionById = function (id) {
    return this.transitionMgr.getNode(id);
};

Diagram.prototype.zoomIn = function () {
    this.scale += 0.1;
    this.part('main').scale(this.scale);
    this.exec('zoomIn', [this.scale]);
};

Diagram.prototype.zoomOut = function () {
    if (this.scale > 0) {
        this.scale -= 0.1;
        this.part('main').scale(this.scale);
        this.exec('zoomOut', [this.scale]);
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
Diagram.prototype.getStagePosition = function (x, y) {
    if (object.isDefined(x.pageX)) {
        y = x.pageY;
        x = x.pageX;
    } else if (object.isDefined(x.x)) {
        y = x.y;
        x = x.x;
    }

    var stagePosition = this.$container.offset();
    var viewPointAlignment = this.mainPart.position();

    //TODO: viewbox alignement ?
    return {
        x: parseInt((x - stagePosition.left - viewPointAlignment.x) / this.scale),
        y: parseInt((y - stagePosition.top - viewPointAlignment.y) / this.scale)
    };
};

/**
 * Checks if a given position is within the boundaries of a diagram node.
 * TODO: either return all overlay nodes or just the one with the biggest index...
 * @param {type} position
 * @returns {Boolean}
 */
Diagram.prototype.getNodeByPosition = function (position) {
    var result;
    object.each(this.nodeMgr.nodes, function () {
        if (this.overlays(position)) {
            result = this;
            return false;
        }
    });

    return result;
};

Diagram.prototype.createNode = function (tmplId, position) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.loadTemplate(tmplId)
            .then(function (template) {
                resolve(that.nodeMgr.createNodeCommand(template, position));
            }, function (err) {
                reject(err);
            });
    });
};

Diagram.prototype.getSelectedTransition = function (tmpl, position) {
    return this.selectionMgr.selectedTransition;
};

Diagram.prototype.loadTemplate = function (tmpl) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.templateMgr.getTemplate(tmpl)
            .then(function (template) {
                resolve(template);
            }, function (err) {
                reject(err);
            });
    });
};

Diagram.prototype.screenShot = function (container, withadditions) {
    var stringVal = (withadditions) ? this.asString() : this.asPlainString();
    fileManager.makeScreenShot(container, stringVal, this.width(), this.height());
};

Diagram.prototype.getSelectedNodes = function (tmpl, position) {
    return this.selectionMgr.getSelectedNodes();
};

Diagram.prototype.createTransition = function (node1, node2) {
    return node1.additions.transition.startNewTransition(node2);
};

Diagram.prototype.getTransitionById = function (id) {
    return this.transitionMgr.getTransition(id);
};

Diagram.prototype.asString = function () {
    return this.svg.asString();
};

Diagram.prototype.asPlainString = function () {
    var $diagramXml = this.clone();
    $diagramXml.find('.knob').remove();
    //TODO: Diagram dimension settings
    $diagramXml.attr('height', this.height() + 10);
    $diagramXml.attr('width', this.width() + 10);
    $diagramXml.find('.orientationKnob').hide();
    $diagramXml.find('#' + this.mainPart.attr('id')).attr('transform', '');
    return util.xml.serializeToString($diagramXml[0]);
};

Diagram.prototype.clone = function () {
    return this.svg.clone();
};

Diagram.prototype.undoCommand = function () {
    this.commandMgr.undo();
};

Diagram.prototype.redoCommand = function () {
    this.commandMgr.redo();
};

Diagram.prototype.registerCommand = function (cmdId, cmd) {
    this.commandMgr.register(cmdId, cmd);
};

Diagram.prototype.executeCommand = function (cmdId, doArgs, undoArgs) {
    return this.commandMgr.exec(cmdId, doArgs, undoArgs);
};

Diagram.prototype.addCommand = function (cmdId, doArgs, undoArgs) {
    this.commandMgr.add(cmdId, doArgs, undoArgs);
};

Diagram.prototype.dump = function() {
    var result = '<hr />';
    result += 'Diagram: '+this.id+'<br />';
    result += this.nodeMgr.dump();
    result += this.transitionMgr.dump()+'<br />';
    result += '<hr />';
    return result;
};

Diagram.prototype.validate = function() {
    var result = {};
    result['transitionManager'] = this.transitionMgr.validate();
    return result;
};

module.exports = Diagram;

