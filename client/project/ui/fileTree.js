var FileTreeBuilder = require('./fileTreeBuilder');
var stringUtil = require('../../util/string');
var event = require('../../core/event');

var typeDefinition = {
    "root" : {
        "icon" : "/images/icons/folder.png"
    },
    "project" : {
        "icon": "/images/icons/project_folder.png"
    },
    "diagram" : {
        "icon": "/images/icons/file.png",
        "max_children" : 0
    }
};

/**
 * Context Menu definition
 */
var contextMenuDefinition = {
    "items": function (node) {
        var idSplitted = node.id.split('_');
        var type = idSplitted[0];
        var id = idSplitted[1];
        switch(type) {
            case 'project':
                return {
                    "New Diagram": {
                        "label": "New Diagram",
                        "action": function (obj) {
                            event.trigger('dialog_new_diagram', id);
                        }
                    }
                };
            case 'diagram':
                break;
            case 'root':
                return {
                    "New Project": {
                        "label": "New Project",
                        "action": function (obj) {
                            event.trigger('dialog_new_project');
                        }
                    }
                    //TODO: DELETE / CLOSE PROJECT / RENAME / NEW FOLDER
                }
        }
    }
};

var FileTree = function(containerId) {
    this.init(containerId);
};

FileTree.prototype.init = function(containerId) {
    var that = this;
    //The builder is responsible for building the data array
    this.builder = new FileTreeBuilder(function(data) {
        that.updateTreeData(data);
    });

    this.$treeNode = $(containerId);
    this.$treeNode.jstree({
        'core' : { 'check_callback': check_callback},
        "plugins": ["contextmenu", "types", "sort", "dnd"],
        "types" : typeDefinition,
        "contextmenu": contextMenuDefinition
    });

    $(document)
        .on('dnd_move.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('#diagramStage').length) {
                    var test = data.helper.find('.jstree-icon');
                    data.helper.find('.jstree-icon').removeClass('jstree-er').addClass('jstree-ok');
                    // Stop the jstree handlers since we don't need them for outter tree drag / drops
                    // Furthermore they would change the helper class again.
                    e.stopImmediatePropagation();
                }
            }
        })
        .on('dnd_stop.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('#diagramStage').length) {
                    console.log('asdfasdf');
                    // node data:
                    // if(data.data.jstree && data.data.origin) { console.log(data.data.origin.get_node(data.element); }
                }
            }
        });
};

/**
 * With this method we cann allow / disallow specific tree actions
 */
var check_callback = function(operation, node, node_parent, node_position, more) {
    // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
    // in case of 'rename_node' node_position is filled with the new node name

    /* if (operation === "move_node") {
     return node_parent.original.type === "root"; //only allow dropping inside nodes of type 'Parent'
     }*/
    return true;  //allow all other operations
};

FileTree.prototype.updateTreeData = function(data) {
    this.$treeNode.jstree(true).settings.core.data = data;
    this.refresh();
};

FileTree.prototype.build = function() {
    this.builder.init();
    return this.builder;
};

FileTree.prototype.refresh = function() {
    this.$treeNode.jstree(true).refresh();
    return this;
};

FileTree.prototype.getNodeText = function(nodeType, itemId) {
    return this.$treeNode.jstree(true).get_text(getNodeId(nodeType,itemId));
};

FileTree.prototype.openNode = function(nodeType, itemId) {
    this.$treeNode.jstree(true).open_node(getNodeId(nodeType,itemId));
    return this;
}

FileTree.prototype.triggerFileChange = function(nodeType, itemId) {
    var nodeId =  getNodeId(nodeType,itemId);
    var text = this.getNodeText(nodeId);
    if(!stringUtil.endsWith(text, '*')) {
        this.setNodeText(nodeId, text+'*');
    }
    return this;
};

FileTree.prototype.setNodeText = function(nodeType, itemId, text) {
    var nodeId = (arguments.length < 3)? nodeType : getNodeId(type,itemId);
    text = (arguments.length < 3)? itemId : text;
    this.$treeNode.jstree(true).rename_node(nodeId, text);
};

var getNodeId = function(type, id) {
    if(id) {
        return type + '_' + id;
    } else {
        return type;
    }
}

module.exports = FileTree;