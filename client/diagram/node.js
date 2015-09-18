/**
 * This class represents the nodes of a diagram. Every note has a unique ID and
 * a template defining the type of the node.
 */
var util = require('../util/util');
var dockingType = require('./dockingType');
var SVG = require('../svg/svg');
var event = require('../core/event');
var nodeAdditions = require('./nodeAdditions');

var object = util.object;
var dom = util.dom;

/**
 * The constructor does not render a node to the stage. To render a node
 * the init method has to be called.
 */
var Node = function(tmpl, config, diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.id = config.node_id;
    this.template = tmpl;
    this.config = config;
    this.visible = true;
};

/**
 * This method renders the node to the stage and initializes all event handlers
 * With the part argument we can import the node to another svg part than the default which is the main stage.
 * This is used for example for the defs (which is technically not a real node)
 *
 * @returns {Node_L7.Node.prototype}
 */
Node.prototype.init = function(part, prepend) {
    //ADD Element to stage
    this.diagram.import(this.template.getSVGString(this.config), part, prepend);
    return this.activate();
};

Node.prototype.getCorners = function() {
    var x = this.x();
    var y = this.y();
    var bottomy = this.getBottomY();
    var rightx = this.getRightX();
    return [
        {x:x,y:y},
        {x:rightx, y:y},
        {x:rightx, y:bottomy},
        {x:x,y:bottomy}
    ];
};

/**
 * Activates the the node and handler functions by means of the given config
 *
 * @returns itself
 */
Node.prototype.activate = function(nodeID) {
    if(object.isDefined(nodeID)) {
        this.id = this.config.node_id = nodeID;
    }

    //The root element of the node, its supposed to be a group node
    this.root = $.svg('#'+this.id);


    nodeAdditions.init(this);

    if(this.root) {
        this.initEventFunctions(this.config);
        this.root.attr({'dala:tmpl' : this.template.id});
    }

    this.exec('activate');
    return this;
};

Node.prototype.initEventFunctions = function() {
    var that = this;

    if(this.root.hoverable) {
        this.root.hoverable({
            in : function() {
                that.exec('mouseover');
            },
            out : function() {
                that.exec('mouseout');
            }
        });
    }

    this.root.dblclick(function(evt) {
        that.exec('dbclick');
    });

    this.root.mousedown(function(evt) {
        if(!evt.ctrlKey) {
            that.exec('mousedown', [evt]);
            that.event.trigger('node_mousedown', that, evt);
        }
    });

    this.root.mouseup(function(evt) {
        that.exec('mouseup', [evt]);
    });
};

Node.prototype.index = function() {
    return this.root.$().index();
};

Node.prototype.firstChild = function() {
    //TODO: this should be cached to reduce dom calls !
    return this.root.firstChild();
};

Node.prototype.moveUp = function() {
    //We switch UP/Down here because the first node in the dom tree is the
    //last node (back) in the svg view.

    //TODO: as command event !
    dom.moveDown(this.root.instance());
    this.exec('moveUp');
};

Node.prototype.moveDown = function() {
    //We switch UP/Down here because the first node in the dom tree is the
    //last node (back) in the svg view.

    //TODO: as command event !
    dom.moveUp(this.root.instance());
    this.exec('moveDown');
};

Node.prototype.remove = function() {
    this.event.trigger('node_removed', this);
    this.exec('remove');
    this.root.remove();
};

Node.prototype.moveTo = function(x, y) {
    this.root.moveTo(x, y);
    this.exec('drag');
};

Node.prototype.position = function(x,y) {
    return {
        x : this.x(),
        y : this.y()
    };
};

Node.prototype.getInnerSVG = function(prefix) {
    return $.qCache().svg(this.getNodeSelector(prefix));
};

Node.prototype.updateAdditions = function(type) {
    this.exec('update');
};

Node.prototype.getDockingPosition = function(position, orientationIn) {
    return dockingType.getDocking(this, position, orientationIn);
};

Node.prototype.addOutgoingTransition = function(value) {
    return this.additions.transition.addOutgoingTransition(value);
};

Node.prototype.getOrientations = function() {
    return this.additions.transition.getOrientations();
};

Node.prototype.removeOutgoingTransition = function(transition) {
    this.additions.transition.removeOutgoingTransition(transition);
};

Node.prototype.addIncomingTransition = function(transition) {
    this.additions.transition.addIncomingTransition(transition);
};

Node.prototype.removeIncomingTransition = function(transition) {
    this.additions.transition.removeIncomingTransition(transition);
};

Node.prototype.getRootSVG = function() {
    return this.root;
};

Node.prototype.instance = function() {
    if(object.isDefined(this.root)) {
        return this.root.instance();
    }
};

Node.prototype.selector = function(prefix) {
    return this.getNodeSelector(prefix);
};

Node.prototype.getNodeSelector = function(prefix) {
    var result = '';

    if(!util.string.startsWith(prefix, '#') && !util.string.startsWith(prefix, '.')) {
        result = '#'+prefix;
    } else {
        result = prefix;
    }

    return util.string.endsWith(prefix, '_')
        ? result + this.id
        : result + '_' + this.id;
};

Node.prototype.getRootNode = function() {
    return this.root.getRootNode();
};

Node.prototype.exec = function(func, args) {
    args = args || this;
    if(this.template.handler && this.template.handler[func]) {
        this.template.handler[func](args);
    }
    this.executeAddition(func, args);
}

Node.prototype.executeAddition = function(func, args) {
    object.each(this.additions, function(key, addition) {
        if(object.isDefined(addition) && object.isFunction(addition[func])) {
            addition[func].apply(addition, args);
        }
    });
};

Node.prototype.select = function() {
    this.selected = true;
    this.exec('select');

};

Node.prototype.deselect = function() {
    this.selected = false;
    this.exec('deselect');
};

Node.prototype.extractNodeId = function(rawId) {
    var splitted = rawId.split('_');
    return splitted[splitted.length - 1];
};

Node.prototype.x = function() {
    return this.root.x();
};

Node.prototype.y = function() {
    return this.root.y();
};

Node.prototype.height = function() {
    return this.root.height();
};

Node.prototype.width = function() {
    return this.root.width();
};

Node.prototype.getRightX = function() {
    return this.root.getRightX();
};

Node.prototype.getBottomY = function() {
    return this.root.getBottomY();
};

Node.prototype.isLeftOf = function(mousePosition) {
    return mousePosition.x > (this.getRightX());
};

Node.prototype.isRightOf = function(mousePosition) {
    return mousePosition.x < (this.x());
};

Node.prototype.isOver = function(mousePosition) {
    return mousePosition.y > (this.getBottomY());
};

Node.prototype.overlays = function() {
    return this.root.overlays.apply(this.root, arguments);
    //return this.root.overlayCheck(mousePosition);
};

Node.prototype.isUnder = function(mousePosition) {
    return mousePosition.y < (this.getBottomY());
};

Node.prototype.getCenter = function() {
    return this.root.getCenter();
};

Node.prototype.getRelativePosition = function(pageX,pageY) {
    var p = util.app.getPoint(pageX,pageY);
    return {
        x: p.x - this.x(),
        y: p.y - this.y()
    };
};

/**
 * Determines the location of a given position relative to the node node.
 *
 * @param node
 * @param position
 * @returns {*}
 */
Node.prototype.getRelativeLocation = function(position) {
    return this.root.getRelativeLocation(position);
};

Node.prototype.getOrientation = function(relative) {
    if(!object.isDefined(relative)) {
        return this.getCenter();
    } else {
        return {
            x : this.x() + relative.x,
            y : this.y() + relative.y
        };
    }
};

module.exports = Node;