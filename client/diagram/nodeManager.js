require('./draggable');
require('./hoverable');

var util = require('../util/util');
var xml = require('../xml/xml');
var event = require('../core/event');
var Node = require('./node');
var StageCommand = require('./stageCommand');
var Command = require('../core/command');

var object = util.object;
var dom = util.dom;

var NodeManager = function(diagram) {
    // Contains all nodes added to the diagram
    StageCommand.call(this, diagram);
    this.nodes = {};

    event.listen('node_create', this.createNodeListener, this);
    event.listen('node_delete', this.deleteNodeListener, this);
    event.listen('node_copy', this.copyNodeListener, this);
    event.listen('node_droped', this.dropNodeListener, this);
    event.listen('node_resized', this.resizeNodeListener, this);
};

NodeManager.prototype = Object.create(StageCommand.prototype);
var _super = StageCommand.prototype;

NodeManager.prototype.createNodeListener = function(evt) {
    try {
        var stagePosition = this.diagram.getStagePosition(evt);
        this.createNode(evt.data, stagePosition);
    } catch(err) {
        console.log(err);
        event.trigger('error', 'Error occured while creating node !');
    }
};

NodeManager.prototype.createNode = function(tmpl, config) {
    config = config || {};

    if(!object.isDefined(tmpl)) {
        event.trigger('warn', 'Could not create Node: No template selected!');
        return;
    }

    config.node_id = Date.now();
    return this.exec(new Command()
        .exec(this, this.createNodeCmd, [tmpl, config])
        .undo(this, this.deleteNodeCmd, [config.node_id]));
};

NodeManager.prototype.createNodeCmd = function(tmpl, config) {
    var node = tmpl.getInstance(config, this.diagram).init().draggable();
    this.addNode(node);
};

NodeManager.prototype.addNode = function(node) {
    this.nodes[node.id] = node;
    event.trigger('node_added', node);
};

NodeManager.prototype.activateNode = function(elementId, tmpl) {
    var node = tmpl.getInstance({}, this.diagram)
        .activate(elementId)
        .draggable();

    this.addNode(node);
    return node;
};

NodeManager.prototype.deleteNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(object.isDefined(node)) {
            var nodeStr = this.getNodeAsString(node);
            return this.exec(new Command()
                .exec(this, this.deleteNodeCmd, [node.id])
                .undo(this, this.importNodeCmd, [nodeStr]));
        }
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Could not delete node('+node.id+')');
    }
};

NodeManager.prototype.deleteNodeCmd = function(node) {
    node = this.getNode(node);
    if(object.isDefined(node)) {
        node.remove();
        delete this.nodes[node.id];
    } else {
        console.warn('delete node was called for unknown node');
    }
};

NodeManager.prototype.importNodeCmd = function(nodeStr, cfg) {
    cfg = cfg || {};

    if(object.isDefined(cfg.newId)) {
        nodeStr = nodeStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    var targetInstance = this.diagram.import(nodeStr);
    var node = this.diagram.activateNode(targetInstance);
    this.addNode(node);

    if(object.isDefined(cfg.mouse)) {
        var stagePosition = this.diagram.getStagePosition(cfg.mouse);
        node.moveTo(stagePosition.x, stagePosition.y);
    }
};

NodeManager.prototype.getNodeAsString = function(node) {
    return xml.serializeToString(this.getNode(node).instance());
};

NodeManager.prototype.copyNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(object.isDefined(node)) {
            var nodeStr = this.getNodeAsString(node);
            var newNodeId = Date.now();
            return this.exec(new Command()
                .exec(this, this.importNodeCmd, [nodeStr,
                    {
                        mouse : evt.mouse,
                        oldId : node.id,
                        newId : newNodeId
                    }])
                .undo(this, this.deleteNodeCmd, [newNodeId]));
        }
    } catch(err) {
        console.log(err);
        event.trigger('error', 'Could not copy node !');
    }
};

NodeManager.prototype.dropNodeListener = function(evt) {
    try {
        this.dropNodeCmd(evt.data);
    } catch(err) {
        console.error(err);
    }
};

NodeManager.prototype.dropNodeCmd = function(node) {
    node = this.getNode(node);
    if(object.isDefined(node)) {
        this.store(new Command()
            .exec(node, node.triggerDrag, [node.dxSum, node.dySum])
            .undo(node, node.triggerDrag, [(-1*node.dxSum), (-1*node.dySum)]));
    }
};

NodeManager.prototype.resizeNodeListener = function(evt) {
    try {
        this.resizeCmd(evt.data);
    } catch(err) {
        console.log(err);
    }
};

NodeManager.prototype.resizeCmd = function(node) {
    node = this.getNode(node);
    if(object.isDefined(node)) {
        var resizeInstance = node.additions.resize.get();
        this.store(new Command()
            .exec(resizeInstance, resizeInstance.resize, [resizeInstance.dx, resizeInstance.dy, resizeInstance.knob])
            .undo(resizeInstance, resizeInstance.resize, [(-1*resizeInstance.dx), (-1*resizeInstance.dy), resizeInstance.knob]));
    } else {
        console.warn('resizeCmd was for unknown node :'+node.toString());
    }
};


NodeManager.prototype.getNode = function(id) {
    if(object.isString(id) && !isNaN(id)) {
        return this.nodes[parseInt(id)];
    } else if(!isNaN(id)) {
        return this.nodes[id];
    } else if(id instanceof Node) {
        //We assume a node instance
        return id;
    } else {
        console.warn('getNode call with no result for :'+id);
    }
};

NodeManager.prototype.getEditItem = function(node, editKey) {
    node = this.getNode(node);
    return node.additions.edit.getItem(editKey);
};

NodeManager.prototype.setEditValue = function(node, editKey, newValue) {
    node = this.getNode(node);
    var editConfigItem = this.getEditItem(node, editKey);
    return this.exec(new Command()
        .exec(this, this.setEditItemCmd, [node.id, editKey, newValue])
        .undo(this, this.setEditItemCmd, [node.id, editKey, editConfigItem.currentVal]));
};

NodeManager.prototype.setEditItemCmd = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.clear = function() {
    this.nodes = {};
};

module.exports = NodeManager;