require('./draggable');
require('./hoverable');

var util = require('../util/util');
var xml = require('../xml/xml');
var event = require('../core/event');
var Node = require('./node');
var AbstractManager = require('./abstractManager');

var object = util.object;
var dom = util.dom;

var CMD_ADD = 'node_add';
var CMD_DELETE = 'node_delete';
var CMD_COPY = 'node_copy';
var CMD_DROP = 'node_drop';
var CMD_RESIZE = 'node_resize';
var CMD_EDIT = 'node_edit';

var NodeManager = function(diagram) {
    // Contains all nodes added to the diagram
    AbstractManager.call(this, diagram);
    this.nodes = {};

    this.listen('node_create', this.createNodeListener);
    this.listen('node_delete', this.deleteNodeListener);
    this.listen('node_copy', this.copyNodeListener);
    this.listen('node_droped', this.dropNodeListener);
    this.listen('node_resized', this.resizeNodeListener);

    this.command(CMD_ADD, this.createNodeCmd, this.deleteNodeCmd);
    this.command(CMD_DELETE, this.deleteNodeCmd, this.importNodeCmd);
    this.command(CMD_COPY, this.importNodeCmd, this.deleteNodeCmd);
    this.command(CMD_DROP, this.moveNodeCmd, this.moveNodeCmd);
    this.command(CMD_RESIZE, this.resizeCmd, this.resizeCmd);
    this.command(CMD_EDIT, this.editCmd, this.editCmd);
};

NodeManager.prototype = Object.create(AbstractManager.prototype);
var _super = AbstractManager.prototype;

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

    if(!tmpl) {
        event.trigger('warn', 'Could not create Node: No template selected!');
        return;
    }

    config.node_id = Date.now();

    return this.exec(CMD_ADD, [tmpl, config], [config.node_id]);
};

NodeManager.prototype.createNodeCmd = function(tmpl, config) {
    var node = tmpl.getInstance(config, this.diagram).init().draggable();
    this.addNode(node);
};

NodeManager.prototype.addNode = function(node) {
    this.nodes[node.id] = node;
    this.event.trigger('node_added', node);
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
        if(node) {
            return this.exec(CMD_DELETE, [node.id], [this.getNodeAsString(node)]);
        }
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Could not delete node('+node.id+')');
    }
};

NodeManager.prototype.deleteNodeCmd = function(node) {
    node = this.getNode(node);
    if(node) {
        node.remove();
        delete this.nodes[node.id];
    } else {
        console.warn('delete node was called for unknown node');
    }
};

NodeManager.prototype.importNodeCmd = function(nodeStr, cfg) {
    cfg = cfg || {};

    //If set we replace the old node id with a new one e.g. when we copy a node
    if(cfg.newId && cfg.oldId) {
        nodeStr = nodeStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    //Insert to dom and activate the new node
    var targetInstance = this.diagram.import(nodeStr);
    var node = this.diagram.activateNode(targetInstance);
    this.addNode(node);

    //If set we move the new node to a given position
    if(object.isDefined(cfg.mouse)) {
        var stagePosition = this.diagram.getStagePosition(cfg.mouse);
        node.moveTo(stagePosition.x, stagePosition.y);
    }
};

NodeManager.prototype.getNodeAsString = function(node) {
    node = this.getNode(node);
    return xml.serializeToString(node.instance());
};

NodeManager.prototype.copyNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(object.isDefined(node)) {
            var nodeStr = this.getNodeAsString(node);
            var newNodeId = Date.now();
            return this.exec(CMD_COPY, [nodeStr,
                {
                    mouse : evt.mouse,
                    oldId : node.id,
                    newId : newNodeId
                }], [newNodeId]);
        }
    } catch(err) {
        console.log(err);
        event.trigger('error', 'Could not copy node !');
    }
};

NodeManager.prototype.dropNodeListener = function(evt) {
    try {
        var node = evt.data;
        if(node) {
            //We just add the command since we don't want to execute the drag twice
            this.addCmd(CMD_DROP,
                [node.id, node.dxSum, node.dySum],
                [node.id, (-1 * node.dxSum), (-1 * node.dySum)]);
        }
    } catch(err) {
        console.error(err);
    }
};

NodeManager.prototype.moveNodeCmd = function(node, dxSum, dySum) {
    node = this.getNode(node);
    if(node) {
        node.triggerDrag(dxSum, dySum);
    }
};

NodeManager.prototype.resizeNodeListener = function(evt) {
    try {
        var node = evt.data;
        if(node) {
            var resizeInstance = node.additions.resize.get();
            this.addCmd(CMD_RESIZE,
                [node.id, resizeInstance.dx, resizeInstance.dy, resizeInstance.knob],
                [node.id, (-1*resizeInstance.dx), (-1*resizeInstance.dy), resizeInstance.knob]);
        }
    } catch(err) {
        console.log(err);
    }
};

NodeManager.prototype.resizeCmd = function(node, dx, dy, knob) {
    node = this.getNode(node);
    if(node) {
        node.additions.resize.get().resize(dx,dy,knob);
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

NodeManager.prototype.setEditValue = function(node, editKey, newValue) {
    node = this.getNode(node);
    if(node) {
        var editConfigItem = this.getEditItem(node, editKey);
        return this.exec(CMD_EDIT, [node.id, editKey, newValue], [node.id, editKey, editConfigItem.currentVal]);
    }
};

NodeManager.prototype.getEditItem = function(node, editKey) {
    node = this.getNode(node);
    return node.additions.edit.getItem(editKey);
};

NodeManager.prototype.editCmd = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.clear = function() {
    this.nodes = {};
};

module.exports = NodeManager;