var util = require('../util/Util');
var event = require('../core/event');

var object = util.object;
var dom = util.dom;

var dragContext = require('./draggable').dragContext;

var SelectionManager = function(diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.selectedNodes = [];
    this.copyNodes = [];
    this.selectedTransition;
    this.hoverElement;

    event.listen('key_up_press', this.upListener, this);
    event.listen('key_down_press', this.downListener, this);
    event.listen('key_copy_press', this.copyListener, this);
    event.listen('key_paste_press', this.pasteListener, this);
    event.listen('key_del_press', this.deleteListener, this);
    event.listen('tab_activated', this.clear, this);

    this.event.listen('transition_start', this.transitionStartListener, this);
    this.event.listen('transition_select', this.selectTransitionListener, this);
    this.event.listen('transition_removed', this.removedTransitionListener, this);

    this.event.listen('node_added', this.selectNodeListener, this);
    this.event.listen('node_removed', this.removedNodeListener, this);
    this.event.listen('node_mousedown', this.selectNodeListener, this);

    this.event.listen('drag_move', this.dragListener, this);

    //These are currently global events not diagram context events
    event.listen('element_hoverIn', this.hoverInElementListener, this);
    event.listen('element_hoverOut', this.hoverOutElementListener, this);
};

SelectionManager.prototype.dragListener = function(evt) {
    var dragNode = evt.data.context.node;
    var dx = evt.data.dx;
    var dy = evt.data.dy;

    object.each(this.selectedNodes, function(index, currentNode) {
        if(dragNode.id !== currentNode.id) {
            currentNode.triggerDrag(dx,dy);
        }
    });
};

SelectionManager.prototype.copyListener = function(evt) {
    this.copyNodes = object.cloneArray(this.selectedNodes);

};

SelectionManager.prototype.pasteListener = function(evt) {
    evt.preventDefault();
    var that = this;
    object.each(this.copyNodes, function(index, node) {
        that.event.trigger('node_copy', node, evt);
    });
};

SelectionManager.prototype.upListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        object.each(this.selectedNodes, function(index, node) {
            if(object.isDefined(node)) {
                node.moveUp();
            }
        });
    }
};

SelectionManager.prototype.downListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        object.each(this.selectedNodes, function(index, node) {
            if(object.isDefined(node)) {
                node.moveDown();
            }
        });
    }
};

SelectionManager.prototype.hoverInElementListener = function(evt) {
    this.hoverElement = evt.data;
};

SelectionManager.prototype.hoverOutElementListener = function(evt) {
    delete this.hoverElement;
};

SelectionManager.prototype.removedTransitionListener = function(evt) {
    if(object.isDefined(evt.data)) {
        if(evt.data === this.selectedTransition) {
            delete this.selectedTransition;
        }
    }
};

SelectionManager.prototype.removedNodeListener = function(evt) {
    if(object.isDefined(evt.data)) {
        //Remove the node from the selection
        object.removeFromArray(this.selectedNodes, evt.data);

        //Check if we have to remove the hoverElement too
        if(evt.data.root === this.hoverElement) {
            this.hoverOutElementListener();
        }
    }
};

SelectionManager.prototype.deleteListener = function(evt) {
    this.deleteSelectionNodes();

    //Remove selected transition
    if(object.isDefined(this.selectedTransition)) {
        this.event.trigger('transition_delete', this.selectedTransition);
    };

    this.clear();
};

SelectionManager.prototype.deleteSelectionNodes = function() {
    var arrClone = this.selectedNodes.slice(0);
    var that = this;
    object.each(arrClone, function(index, node) {
        if(object.isDefined(node)) {
            that.event.trigger('node_delete', node);
        } else {
            //If there is a undefined value we remove it from the selection
            that.selectedNodes.splice(0, 1);
        }
    });
};

SelectionManager.prototype.selectNodeListener = function(evt) {
    this.setSelection(evt.data, evt.shiftKey);
};

SelectionManager.prototype.transitionStartListener = function(evt) {
    this.selectedTransition = evt.data;
};

SelectionManager.prototype.selectTransitionListener = function(evt) {
    //We do not call this.clear because we would hide the edit fields trough the triggered event
    this.clearNodes();
    this.clearTransition();
    this.selectedTransition = evt.data;
    this.selectedTransition.select();
};

SelectionManager.prototype.isElementHover = function() {
    return object.isDefined(this.hoverElement);
};

SelectionManager.prototype.setSelection = function(selectedNode, shifted) {
    //TODO MULTIPLE SELECTIONS DIFFERENT TYPES (TRANSITION/NODES)...
    // we could provide the whole selection instead of the single node
    if(!this.containsNode(selectedNode)) {
        this.event.trigger('node_selected',selectedNode);

        //Clear the current selection
        if(!(object.isDefined(shifted) && shifted)) {
            this.selectedNodes = object.grep(this.selectedNodes, function(currentSelection) {
                if(currentSelection.id !== selectedNode.id) {
                    currentSelection.deselect();
                    return false;
                }
                return true;
            });
        }

        this.clearTransition();


        //Add the resize addition to the node which is removed after deselection
        this.selectedTemplate = selectedNode.template;
        selectedNode.select();
        this.selectedNodes.push(selectedNode);
    } else if(object.isDefined(shifted) && shifted) {
        this.removeSelectedNode(selectedNode);
    }
};

/**
 * This method just adds new nodes to the selection if it have not been
 * added yet without any additional restrictions.
 *
 * All selected transitions are deselected since the mixed selection
 * is not implemented yet.
 *
 * @param {type} selectedNode
 * @returns {undefined}
 */
SelectionManager.prototype.addSelectedNode = function(selectedNode) {
    if(!this.containsNode(selectedNode)) {
        this.selectedNodes.push(selectedNode);
        this.clearTransition();
        selectedNode.select();
    }
};

SelectionManager.prototype.removeSelectedNode = function(node) {
    var index = this.selectedNodes.indexOf(node);
    if(index >= 0) {
        node.deselect();
        this.selectedNodes.splice(index, 1);
    }
};

SelectionManager.prototype.containsNode = function(node) {
    return this.selectedNodes.indexOf(node) > -1;
};

SelectionManager.prototype.clear = function() {
    this.clearNodes();
    this.clearTransition();
    this.event.trigger('selection_clear');
};

SelectionManager.prototype.clearNodes = function() {
    object.each(this.selectedNodes, function(index, node) {
        node.deselect();
    });
    this.selectedNodes = [];
};

SelectionManager.prototype.clearTransition = function() {
    if(object.isDefined(this.selectedTransition)) {
        this.selectedTransition.deselect();
    }
    delete this.selectedTransition;
};

SelectionManager.prototype.isMultiSelection = function() {
    var count = 0;
    count += this.selectedNodes.length;
    count += (object.isDefined(this.selectedTransition)) ? 1 : 0;
    return count > 1;
};

module.exports = SelectionManager;
