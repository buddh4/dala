/**
 * This class represents the nodes of a diagram. Every note has a unique ID and
 * a template defining the type of the node.
 */
var Eventable = require('./eventableNode');
var util = require('../util/util');
var dockingType = require('./docking');
var SVG = require('../svg/svg');
var nodeAdditions = require('./nodeAdditions');

var object = util.object;
var dom = util.dom;

/**
 * The constructor does not render a node to the stage. To render a node
 * the init method has to be called.
 */
var Node = function(tmpl, config, diagram) {
    this.config = config || {};
    this.data = {};
    this.diagram = diagram;
    this.isNode = true;
    this.event = diagram.event;
    this.id = config.node_id;
    this.template = tmpl;
    this.selectable = object.isDefined(this.config.selectable) ? this.config.selectable : true;
    this.visible = true;
};

util.inherits(Node, Eventable);

/**
 * This method renders the node to the stage and initializes all event handlers
 * With the part argument we can import the node to another svg part than the default which is the main stage.
 * This is used for example for the defs (which is technically not a real node)
 *
 * @returns {Node_L7.Node.prototype}
 */
Node.prototype.init = function(part, prepend) {
    //ADD Element to stage
    this._setRoot(this.diagram.import(this.template.getSVGString(this.config), part, prepend));
    this.activate();
    this.exec('init');
    return this;
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

    if(nodeID) {
        this.id = this.config.node_id = nodeID;
    }

    if(!this.root) {
        //Activation
        this._setRoot(this.diagram.svg.get(this.id));
    }

    nodeAdditions.init(this);

    if(this.root && this.id) {
        this.initEventFunctions(this.config);
        this.root.dala('tmpl' , this.template.id);
        //We set the dala namespace because in case the nodes are imported/exported/parsed...
        this.root.attr('id', this.id);
        this.root.attr(this.diagram.ns());
        this.root.attr('class', 'element_root');
        if(this.config.x && this.config.y) {
            this.moveTo(this.config);
        }
    }

    if(nodeID) {
        this.exec('activate');
    }
    return this;
};

Node.prototype._setRoot = function(root) {
    this.root = this.eventBase = root;
};

Node.prototype.initEventFunctions = function() {
    var that = this;

    if(this.root.hoverable) {
        this.root.hoverable();
    }

    this.on('dblclick', function(evt) {
        that.exec('dbclick', [evt], true);
    }).on('mousedown', function(evt) {
        if(!evt.ctrlKey && that.isVisible()) {
            evt.stopPropagation();
            that.exec('mousedown', [evt], true);
            if(!that.selected) {
                that.select();
            }
        }
    });
};

Node.prototype.isVisible = function() {
    return this.root.isVisible();
};

Node.prototype.hide = function() {
    this.root.hide();
};

Node.prototype.show = function(opacity) {
    this.root.show(opacity);
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
    this.root.up();
    this.exec('moveUp');
};

Node.prototype.moveDown = function() {
    //We switch UP/Down here because the first node in the dom tree is the
    //last node (back) in the svg view.

    //TODO: as command event !
    this.root.down();
    this.exec('moveDown');
};

Node.prototype.remove = function() {
    //Note: jquery triggers a remove dom event itself...
    this.exec('remove', undefined, true);
    this.root.remove();
};

Node.prototype.rotate = function(a) {
    return this.root.rotate(a);
};

Node.prototype.moveTo = function(x, y) {
    this.root.moveTo(x, y);
    this.exec('moveTo');
};

Node.prototype.position = function() {
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

Node.prototype.addOutgoingTransition = function(value) {
    return this.additions.transition.addOutgoingTransition(value);
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
    if(object.isArray(prefix)) {
        var stringSelector = [];
        var that = this;
        object.each(prefix, function(index, val) {
            stringSelector.push(that.selector(val));
        });
        return stringSelector.join(', ');
    } else {
        return this.getNodeSelector(prefix);
    }
};

Node.prototype.getNodeSelector = function(prefix) {
    var result = '';

    if(!prefix || prefix.length === 0) {
        return '#'+this.id;
    }


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

Node.prototype.executeTemplateHook = function(hook, args) {
    if(this.template.config && this.template.config.on) {
        var hook = this.template.config.on[hook];
        if(hook) {
            hook.apply(this, args);
        }
    }
};

Node.prototype.select = function(shifted) {
    this.selected = true;
    this.exec('select', [shifted]);
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

Node.prototype.getRelativeCenter = function() {
    return {
        x: this.width() / 2,
        y: this.height() / 2
    }
};

Node.prototype.getRelativePosition = function(pageX,pageY) {
    var p = util.math.getPoint(pageX,pageY);
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

Node.prototype.toString = function(position) {
    return this.root.toString();
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