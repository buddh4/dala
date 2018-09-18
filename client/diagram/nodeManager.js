require('./draggable');
require('./hoverable');

var util = require('../util/util');
var event = require('../core/event');
var Node = require('./node');
var AbstractManager = require('./abstractManager');

var cache = require('../core/cache');
var object = util.object;
var dom = util.dom;
var config = require('../core/config');

var EVT_CREATE = 'node_create';
//TODO: implement like copy paste by diagram event
var EVT_DELETE = 'node_delete';

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
    this.listen(EVT_RESIZED, this.resizeNodeListener);

    this.command(CMD_ADD, this.createNode, this.deleteNode);
    this.command(CMD_DELETE, this.deleteNode, this.importNode);
    this.command(CMD_COPY, this.importNode, this.deleteNode);
    this.command(CMD_DROP, this.moveNode, this.moveNode);
    this.command(CMD_RESIZE, this.resizeNode, this.resizeNode);
    this.command(CMD_EDIT, this.editNode, this.undoEdit);

    this.initCopyPasteHandler();
};

util.inherits(NodeManager, AbstractManager);

NodeManager.prototype.initCopyPasteHandler = function() {
    var that = this;

    this.diagram.on('copy', function(evt) {
        var copyNodes = {};
        var copyTransitions = {};
        var nodeCount = 0;

        if(!that.selectionMgr.selectedNodes.length) {
            that.lastCopy = null;
            return;
        }

        $.each(that.selectionMgr.selectedNodes, function(index, node) {
            if(!node.knob) {
                nodeCount++;
                copyNodes[node.id] =  {svg : node.toString(), position: node.position()};
                $.each(node.additions.transition.outgoingTransitions, function(index, transition) {
                    if(transition.getEndNode().selected) {
                        copyTransitions[transition.id] ={svg : transition.toString(), start: transition.getStartNode().id, end: transition.getEndNode().id};
                    }
                });

                $.each(node.additions.transition.incomingTransitions, function(index, transition) {
                    if(!copyTransitions[transition.id] && transition.getStartNode().selected) {
                        copyTransitions[transition.id] = {svg : transition.toString(), start: transition.getStartNode().id, end: transition.getEndNode().id};
                    }
                })
            }
        });


        var topNode = that.getTopNode(that.selectionMgr.selectedNodes);
        var leftNode = that.getLeftNode(that.selectionMgr.selectedNodes);

        that.lastCopy = {
            x : leftNode.x(),
            y: topNode.y(),
            nodes : copyNodes,
            count : nodeCount,
            transitions : copyTransitions
        };
    });

    this.diagram.on('paste', function(evt) {
        if(!that.lastCopy || !that.lastCopy.count) {
            return;
        }

        var mouse = that.diagram.getStagePosition(event.mouse());
        var d = {x:(mouse.x - that.lastCopy.x), y:(mouse.y - that.lastCopy.y)};

        that.importCopyNodes().then(function(result) {
            var ids = [];
            var svgStrings = [];
            var nodeIdMapping = {};
            var nodes = [];
            that.selectionMgr.clear();

            $.each(result, function(index, node) {
                nodes.push(node);
                node.select(true);
                nodeIdMapping[node.config.oldId] = node.config.newId;
                ids.push(node.id);
                svgStrings.push(node.toString());
            });

            that.importCopyTransitions(nodeIdMapping).then(function(transitions) {
                //that.addCmd('cmd_group', [[CMD_COPY, [svgStrings], [ids]], []])
                $.each(nodes, function(index, node) {
                    node.triggerDrag(d.x, d.y);
                    //We have to deselect because its already selected after creation and we shift select it
                    //for multiple node copies. If not deselected this would deselect the node in selectionmgr
                    node.deselect();
                    node.select(true);
                });
                $.each(transitions, function(index, transition) {
                    transition.moveInnerKnobs(d);
                    transition.selectInnerKnobs();
                });

                that.addCmd(CMD_COPY, [svgStrings], [ids]);
            });

        }, function(err) {});
    });
};

NodeManager.prototype.size = function() {
    return object.size(this.nodes);
};

NodeManager.prototype.getTopNode = function(nodes) {
    return this.sorted(nodes, function(a,b) {
        return (a.y() > b.y()) ? 1 : -1;
    })[0];
};

NodeManager.prototype.getLeftNode = function(nodes) {
    return this.sorted(nodes, function(a,b) {
        return (a.x() > b.x()) ? 1 : -1;
    })[0];
};

NodeManager.prototype.getBottomNode = function(nodes) {
    return this.sorted(nodes, function(a,b) {
        return (a.getBottomY() < b.getBottomY()) ? 1 : -1;
    })[0];
};

NodeManager.prototype.getRightNode = function(nodes) {
    return this.sorted(nodes, function(a,b) {
        return (a.getRightX() < b.getRightX()) ? 1 : -1;
    })[0];
};

NodeManager.prototype.sorted = function(nodes, compare) {
    if(object.isFunction(nodes)) {
        compare = nodes;
        nodes = undefined;
    }
    nodes = this.getNodesAsArray(nodes);
    return nodes.sort(compare);
};

NodeManager.prototype.getNodesAsArray = function(nodes) {
    nodes = nodes || this.nodes;
    if(!object.isArray(nodes)) {
        return $.map(nodes, function(val) {
            return val;
        })
    } else {
        return nodes;
    }
};

NodeManager.prototype.importCopyNodes = function() {
    var promises = [];
    var that = this;
    $.each(that.lastCopy.nodes, function(key, value) {
        promises.push(that.importNode(value.svg, {
            oldId : key,
            x : value.position.x,
            y : value.position.y,
            newId : that.diagram.uniqueId()
        }));
    });
    return Promise.all(promises);
};

NodeManager.prototype.importCopyTransitions = function(nodeIdMapping) {
    var that = this;
    return new Promise(function(resolve, reject) {
        var result = [];
        $.each(that.lastCopy.transitions, function(key, value) {
            var svg = value.svg;
            svg = svg.replace(new RegExp(value.start, 'g'), nodeIdMapping[value.start]);
            svg = svg.replace(new RegExp(value.end, 'g'), nodeIdMapping[value.end]);
            var transition = that.diagram.transitionMgr.importTransition(svg, {oldId:key, newId:that.diagram.uniqueId()});
            transition.update();
            result.push(transition);
        });
        resolve(result);
    });
};

NodeManager.prototype.createNodeListener = function(evt) {
    try {
        var stagePosition = this.diagram.getStagePosition(evt);
        this.createNodeCommand(evt.data, stagePosition);
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Error occured while creating node !');
    }
};

NodeManager.prototype.createNodeCommand = function(tmpl, cfg) {
    cfg = cfg || {};
    cfg = $.extend({}, cfg, config.val('node_settings', {}));

    if(!tmpl) {
        event.trigger('warn', 'Could not create Node: No template selected!');
        return;
    }

    cfg.node_id = this.diagram.uniqueId();
    cfg.diagramId = this.diagram.id;
    return this.exec(CMD_ADD, [tmpl, cfg], [cfg.node_id]);
};

NodeManager.prototype.createNode = function(tmpl, cfg) {
    var that = this;
    var node = tmpl.createNode(cfg, this.diagram).init();
    if(!cfg.preventDrag) {
        node.draggable();
        node.on('dblclick', function() {
           console.log('yeessssss');
        });
        node.on('select', function() {
            that.event.trigger(EVT_SELECTED, node);
        }).on('deselect', function() {
            that.event.trigger(EVT_DESELECTED, node);
        }).on('remove', function() {
            that.event.trigger(EVT_REMOVED, node);
        }).on('edit', function(evt, key, value, oldValue) {
            that.addCmd(CMD_EDIT, [node.id, key, value], [node.id, key, oldValue]);
        }).on('dragEnd', function() {
            var selection = that.selectionMgr.getSelectedNodes();
            //We just add the command since we don't want to execute the drag twice

            //For API calls where the node is not necessarily selected
            if($(selection).filter(function(i) { return this.id === node.id;}).length < 1) {
                selection.push(node);
            }


            that.addCmd(CMD_DROP,
                [selection, node.dragContext.dxSum, node.dragContext.dySum],
                [selection, (-1 * node.dragContext.dxSum), (-1 * node.dragContext.dySum)]);
        });
    }
    this.addNode(node);
    return node;
};

NodeManager.prototype.addNode = function(node) {
    this.nodes[node.id] = node;
    this.event.trigger(EVT_ADDED, node);
};


NodeManager.prototype.activateNode = function(node, cfg) {
    var domNode;
    if(node.SVGElement) {
        domNode = node.instance();
    } else if(object.isString(node)) {
        domNode = this.diagram.svg.get(node);
    } else {
        domNode = node;
    }

    var attributes = dom.getAttributes(domNode);
    var that = this;
    return new Promise(function(resolve, reject) {
        that.templateMgr.getTemplate(attributes['dala:tmpl'])
            .then(function (tmpl) {
                resolve(that.activate(attributes['id'], tmpl, cfg));
            }, reject);
    });
};

NodeManager.prototype.activate = function(nodeId, tmpl, cfg) {
    //Create Node instance and set nodeId
    cfg = cfg || {};
    var node = tmpl.createNode(cfg, this.diagram)
        .activate(nodeId)
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
            return this.exec(CMD_DELETE, [node.id], [node.toString()]);
        }
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Could not delete node('+node.id+')');
    }
};

NodeManager.prototype.clear = function(nodes) {
    $.each(this.nodes, function(id, node) {
        node.remove();
    });
};

NodeManager.prototype.deleteNode = function(node) {
    if(object.isArray(node)) {
        var that = this;
        $.each(node, function(index, value) {
            that.deleteNode(value);
        });
        return;
    }

    node = this.getNode(node);
    if(node) {
        node.remove();
        delete this.nodes[node.id];
        cache.clearBySuffix(node.id);
    } else {
        console.warn('delete node was called for unknown node');
    }
};

NodeManager.prototype.importNode = function(nodeStr, cfg) {
    if(object.isArray(nodeStr)) {
        var promises = [];
        var that = this;
        $.each(nodeStr, function(index, value) {
            promises.push(that.importNode(value, cfg));
        });

        return new Promise(function(resolve, reject) {
            Promise.all(promises).then(function(nodes) {
                resolve(nodes);
            });
        });

    }

    cfg = cfg || {};

    //If set we replace the old node id with a new one e.g. when we copy a node
    if(cfg.newId && cfg.oldId) {
        nodeStr = nodeStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    //Insert to dom and activate the new node
    var targetInstance = this.diagram.import(nodeStr);
    return this.activateNode(targetInstance, cfg);
};

NodeManager.prototype.getNodeAsString = function(node) {
    node = this.getNode(node);
    return node.toString();
};

NodeManager.prototype.moveNode = function(node, dxSum, dySum) {
    if(object.isArray(node)) {
        var that = this;
        $.each(node, function(index, value) {
            that.moveNode(value, dxSum, dySum);
        });
    } else {
        node = this.getNode(node);
        if(node) {
            node.triggerDrag(dxSum, dySum);
        }
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

NodeManager.prototype.resizeNode = function(node, dx, dy, knob) {
    node = this.getNode(node);
    if(node) {
        node.additions.resize.get().resize(dx,dy,knob);
    } else {
        console.warn('resizeNode was for unknown node :'+node.toString());
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

NodeManager.prototype.editNode = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.undoEdit = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.dump = function() {
    var result = '<b>Nodemanager</b> - '+this.size()+' Nodes<br /><br />';
    $.each(this.nodes, function(index, node) {
        result += node.dump()+'<br />';
    });
    return result;
};

NodeManager.prototype.validateNode = function(node) {
    if(!node) {
        return ['Error: Undefined Node!'];
    }

    var result = {};
    if(!node.id) {
        result['NodeId'] = 'Error: Node has no Id!';
    } else {
        if(!this.getNode(node.id)) {
            result['NodeId'] = 'Error: Node '+node.id+' not registered!';
        }
        if(!this.diagram.svg.get('#'+node.id).length) {
            result['NodeId'] = 'Error: Node'+node.id+' not part of SVG!';
        }
    }
    return result;
};

module.exports = NodeManager;