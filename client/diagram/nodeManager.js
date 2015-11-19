require('./draggable');
require('./hoverable');

var util = require('../util/util');
var xml = require('../util/xml');
var event = require('../core/event');
var Node = require('./node');
var AbstractManager = require('./abstractManager');

var cache = require('../core/cache');
var object = util.object;
var dom = util.dom;

var EVT_CREATE = 'node_create';
var EVT_DELETE = 'node_delete';
var EVT_COPY = 'node_copy';

var EVT_RESIZED = 'node_resized';
var EVT_ADDED = 'node_added';
var EVT_SELECTED = 'node_selected';
var EVT_DESELECTED = 'node_deselected';
var EVT_REMOVED = 'node_removed';

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

    this.selectionMgr = diagram.selectionMgr;
    this.templateMgr = diagram.templateMgr;

    this.listen(EVT_CREATE, this.createNodeListener);
    this.listen(EVT_DELETE, this.deleteNodeListener);
    this.listen(EVT_COPY, this.copyNodeListener);
    this.listen(EVT_RESIZED, this.resizeNodeListener);

    this.command(CMD_ADD, this.createNodeCmd, this.deleteNodeCmd);
    this.command(CMD_DELETE, this.deleteNodeCmd, this.importNodeCmd);
    this.command(CMD_COPY, this.importNodeCmd, this.deleteNodeCmd);
    this.command(CMD_DROP, this.moveNodeCmd, this.moveNodeCmd);
    this.command(CMD_RESIZE, this.resizeCmd, this.resizeCmd);
    this.command(CMD_EDIT, this.editCmd, this.undoEditCmd);
};

util.inherits(NodeManager, AbstractManager);

NodeManager.prototype.createNodeListener = function(evt) {
    try {
        var stagePosition = this.diagram.getStagePosition(evt);
        this.createNode(evt.data, stagePosition);
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Error occured while creating node !');
    }
};

NodeManager.prototype.createNode = function(tmpl, config) {
    config = config || {};

    if(!tmpl) {
        event.trigger('warn', 'Could not create Node: No template selected!');
        return;
    }

    config.node_id = this.diagram.uniqueId();
    config.diagramId = this.diagram.id;
    return this.exec(CMD_ADD, [tmpl, config], [config.node_id]);
};

NodeManager.prototype.createNodeCmd = function(tmpl, config) {
    var that = this;
    var node = tmpl.createNode(config, this.diagram).init();
    if(!config.preventDrag) {
        node.draggable();
        node.on('select', function() {
            that.event.trigger(EVT_SELECTED, node);
        }).on('deselect', function() {
            that.event.trigger(EVT_DESELECTED, node);
        }).on('remove', function() {
            that.event.trigger(EVT_REMOVED, node);
        }).on('dragEnd', function() {
            //We just add the command since we don't want to execute the drag twice
            that.addCmd(CMD_DROP,
                [node.id, node.dragContext.dxSum, node.dragContext.dySum],
                [node.id, (-1 * node.dragContext.dxSum), (-1 * node.dragContext.dySum)]);
        });
    }
    this.addNode(node);
};

NodeManager.prototype.addNode = function(node) {
    this.nodes[node.id] = node;
    this.event.trigger(EVT_ADDED, node);
};


NodeManager.prototype.activateByDomNode = function(domNode) {
    var attributes = dom.getAttributes(domNode);
    var that = this;
    return new Promise(function(resolve, reject) {
        var tmpl = that.templateMgr.getTemplate(attributes['dala:tmpl'])
            .then(function (tmpl) {
                resolve(that.activate(attributes['id'], tmpl));
            }, reject);
    });
};

NodeManager.prototype.activate = function(elementId, tmpl) {
    var node = tmpl.createNode({}, this.diagram)
        .activate(elementId)
        .draggable();

    this.addNode(node);
    return node;
};

NodeManager.prototype.deleteNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(node.knob) {
            //CMD is handled by transitionMgr
            node.remove();
        } else if(node) {
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
        cache.clearBySuffix(node.id);
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

    //If set we move the new node to a given position
    if(cfg.mouse) {
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

NodeManager.prototype.moveNodeCmd = function(node, dxSum, dySum) {
    node = this.getNode(node);
    if(node) {
        node.triggerDrag(dxSum, dySum);
    }
};

/**
 * TODO: listen through node event !
 * @param evt
 */
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

NodeManager.prototype.getNodes = function(filter) {
    if(!filter) {
        return object.toArray(this.nodes);
    } else {
        var result = [];
        object.each(this.nodes, function(key, value) {
            if(filter(value)) {
                result.push[value];
            }
        });
        return result;
    }
};

NodeManager.prototype.setEditValue = function(node, editKey, newValue) {
    node = this.getNode(node);
    if(node) {
        var currentValue = node.additions.edit.getValue(editKey) || '';
        return this.exec(CMD_EDIT, [node.id, editKey, newValue], [node.id, editKey, currentValue]);
    }
};

NodeManager.prototype.getEditItem = function(node, editKey) {
    node = this.getNode(node);
    return node.additions.edit.getEditItem(editKey);
};

NodeManager.prototype.editCmd = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
    event.trigger('node_edit', node);
};

NodeManager.prototype.undoEditCmd = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
    event.trigger('node_edit_undo', node);
};

NodeManager.prototype.clear = function() {
    this.nodes = {};
};

module.exports = NodeManager;