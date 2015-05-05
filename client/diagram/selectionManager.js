var util = require('../util/Util');
var event = require('../core/event');

var object = util.object;
var dom = util.dom;

var SelectionManager = function(diagram) {
    this.diagram = diagram;
    this.selectedNodes = [];
    this.copyNodes = [];
    this.selectedTransition;
    this.selectedDockings = [];
    this.hoverElement;

    event.listen('key_up_press', this.upListener, this);
    event.listen('key_down_press', this.downListener, this);
    event.listen('key_copy_press', this.copyListener, this);
    event.listen('key_paste_press', this.pasteListener, this);
    event.listen('key_del_press', this.deleteListener, this);

    event.listen('transition_start', this.transitionStartListener, this);
    event.listen('transition_select', this.selectTransitionListener, this);
    event.listen('transition_removed', this.removedTransitionListener, this);

    event.listen('node_added', this.selectNodeListener, this);
    event.listen('node_removed', this.removedNodeListener, this);
    event.listen('node_mousedown', this.selectNodeListener, this);

    event.listen('docking_select', this.selectDockingListener, this);
    event.listen('docking_removed', this.removedDockingListener, this);

    event.listen('element_hoverIn', this.hoverInElementListener, this);
    event.listen('element_hoverOut', this.hoverOutElementListener, this);
};

SelectionManager.prototype.copyListener = function(evt) {
    this.copyNodes = object.cloneArray(this.selectedNodes);

};

SelectionManager.prototype.pasteListener = function(evt) {
    evt.preventDefault();
    object.each(this.copyNodes, function(index, node) {
        event.trigger('node_copy', node, evt);
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

SelectionManager.prototype.removedDockingListener = function(evt) {
    if(object.isDefined(evt.data)) {
        object.removeFromArray(this.selectedDockings, evt.data);
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
    this.deleteSelectionDockings();

    //Remove selected transition
    if(object.isDefined(this.selectedTransition)) {
        event.trigger('transition_delete', this.selectedTransition);
    };

    this.clear();
};

SelectionManager.prototype.deleteSelectionNodes = function() {
    var arrClone = this.selectedNodes.slice(0);
    object.each(arrClone, function(index, node) {
        if(object.isDefined(node)) {
            event.trigger('node_delete', node);
        } else {
            //If there is a undefined value we remove it from the selection
            this.selectedNodes.splice(0, 1);
        }
    });
};

SelectionManager.prototype.deleteSelectionDockings = function() {
    var arrClone = this.selectedDockings.slice(0);
    object.each(arrClone, function(index, docking) {
        if(object.isDefined(docking)) {
            event.trigger('docking_delete', docking);
        }
    });
};

SelectionManager.prototype.selectNodeListener = function(evt) {
    this.setSelection(evt.data, evt.shiftKey);
};



SelectionManager.prototype.selectDockingListener = function(evt) {
    if(!evt.shiftKey) {
        this.clear();
    }
    this.addSelectedDocking(evt.data);
};

SelectionManager.prototype.transitionStartListener = function(evt) {
    this.selectedTransition = evt.data;
};

SelectionManager.prototype.selectTransitionListener = function(evt) {
    //We do not call this.clear because we would hide the edit fields trough the triggered event
    this.clearNodes();
    this.clearTransition();
    this.clearDocking();
    this.selectedTransition = evt.data;
    this.selectedTransition.select();
};

SelectionManager.prototype.isElementHover = function() {
    return object.isDefined(this.hoverElement);
};

SelectionManager.prototype.fireDrag = function(dragNode, dx ,dy) {
    object.each(this.selectedNodes, function(index, currentNode) {
        if(dragNode.id !== currentNode.id) {
            currentNode.triggerDrag(dx,dy);
        }
    });

    object.each(this.selectedDockings, function(index, docking) {
        docking.triggerDrag(dx,dy);
    });
};

SelectionManager.prototype.setSelection = function(selectedNode, shifted) {
    //TODO MULTIPLE SELECTIONS DIFFERENT TYPES (TRANSITION/NODES)...
    // we could provide the whole selection instead of the single node
    if(!this.containsNode(selectedNode)) {
        event.trigger('node_selected',selectedNode);

        //Clear the current selection
        if(!(object.isDefined(shifted) && shifted)) {
            this.selectedNodes = object.grep(this.selectedNodes, function(currentSelection) {
                if(currentSelection.id !== selectedNode.id) {
                    currentSelection.deselect();
                    return false;
                }
                return true;
            });
            this.clearDocking();
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
 * All selected dockings or transitions are deselected since the mixed selection
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

SelectionManager.prototype.addSelectedDocking = function(docking) {
    if(docking.isSelectable && !this.containsDocking(docking)) {
        this.selectedDockings.push(docking);
        this.clearTransition();
        docking.select();
    }
};

SelectionManager.prototype.removeSelectedDocking = function(docking) {
    var index = this.selectedDockings.indexOf(docking);
    if(index >= 0) {
        docking.deselect();
        this.selectedDockings.splice(index, 1);
    }
};

SelectionManager.prototype.containsNode = function(node) {
    return this.selectedNodes.indexOf(node) > -1;
};

SelectionManager.prototype.containsDocking = function(docking) {
    return this.selectedDockings.indexOf(docking) > -1;
};

SelectionManager.prototype.clear = function() {
    this.clearNodes();
    this.clearTransition();
    this.clearDocking();
    event.trigger('selection_clear');
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
    count += this.selectedDockings.length;
    count += this.selectedNodes.length;
    count += (object.isDefined(this.selectedTransition)) ? 1 : 0;
    return count > 1;
};

SelectionManager.prototype.clearDocking = function() {
    object.each(this.selectedDockings, function(index, docking) {
        docking.deselect();
    });
    this.selectedDockings = [];
};

module.exports = SelectionManager;
