var util = require('../util/Util');
var event = require('../core/event');
var PathData = require('../svg/PathData');

var object = util.object;
var dom = util.dom;

var SelectionManager = function(diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.selectedNodes = [];
    this.selectedTransition;
    this.hoverElement;

    event.listen('key_up_press', this.upListener, this);
    event.listen('node_moveup', this.moveUpListener, this);
    event.listen('node_movedown', this.moveDownListener, this);
    event.listen('key_down_press', this.downListener, this);
    event.listen('key_del_press', this.deleteListener, this);
    event.listen('tab_activated', this.clear, this);

    this.event.listen('transition_added', this.transitionAddedListener, this);
    this.event.listen('node_added', this.nodeAddedListener, this);
    this.event.listen('knob_added', this.knobAddedListener, this);

    //These are currently global events not diagram context events
    event.listen('element_hoverIn', this.hoverInElementListener, this);
    event.listen('element_hoverOut', this.hoverOutElementListener, this);
};

SelectionManager.prototype.getSelectedNodes = function() {
    return this.selectedNodes.slice();
};

SelectionManager.prototype.getSelectedNodeIds = function() {
    var result = [];
    $.each(this.selectedNodes, function(index, value) {
        result.push(value.id);
    });
    return result;
};

SelectionManager.prototype.knobAddedListener = function(evt) {
    var knob = evt.data;
    var that = this;
    this.addNodeEvents(knob.node);
    if(knob.node.selectable) {
        knob.node.on('select', function (selectEvt, shifted) {
            if (that.dragSelection || evt.shiftKey || shifted && (knob.transition && knob.transition.selected)) {
                knob.transition.deselect();
            } else if(knob.transition && !knob.transition.selected) {
                knob.transition.select();
            }
        });
    }
};

SelectionManager.prototype.nodeAddedListener = function(evt) {
    this.addNodeEvents(evt.data);
};

SelectionManager.prototype.addNodeEvents = function(node, shifted) {
    if(node.selectable) {
        var that = this;
        node.on('select', function (evt, shifted) {
            that.setNodeSelection(node, shifted);
        }).on('deselect', function () {
            that.removeSelectedNode(node);
        }).on('remove', function () {
            that.removeSelectedNode(node);
        }).select();
    }
    return node;
};

SelectionManager.prototype.transitionAddedListener = function(evt) {
    var that = this;
    var transition = evt.data;
    transition.on('select', function(evt, shifted) {
        that.setTransitionSelection(transition);
    }).on('deselect', function() {
        that.removeSelectedTransition(transition);
    }).on('remove', function() {
        that.removeSelectedTransition(transition);
    }).select(evt.shiftKey);
};

//TODO: COMMANDS + Move to NodeManager!
SelectionManager.prototype.moveUpListener = function() {
    var selection = this.selectedNodes.slice(0);
    selection.sort(function(a,b) {
        return (a.index() < b.index())? 1 : -1;
    });

    object.each(selection, function(index, node) {
        if(object.isDefined(node)) {
            node.moveUp();
        }
    });
};

SelectionManager.prototype.upListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        this.moveUpListener();
    }
};

SelectionManager.prototype.downListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        this.moveDownListener();
    }
};

SelectionManager.prototype.moveDownListener = function() {
    var selection = this.selectedNodes.slice(0);
    selection.sort(function(a,b) {
        return (a.index() < b.index())? -1 : 1;
    });

    object.each(selection, function(index, node) {
        if(object.isDefined(node)) {
            node.moveDown();
        }
    });
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
    //Remove selected transition
    if(object.isDefined(this.selectedTransition) && !this.selectedTransition.getSelectedKnobs().length) {
        this.event.trigger('transition_delete', this.selectedTransition);
        return;
    };

    this.deleteSelectionNodes();
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

SelectionManager.prototype.transitionCreatedListener = function(evt) {
    this.selectedTransition = evt.data;
};

SelectionManager.prototype.isElementHover = function() {
    return object.isDefined(this.hoverElement);
};

SelectionManager.prototype.setTransitionSelection = function(transition) {
    //We do not call this.clear because we would hide the edit fields trough the triggered event
    this.clearNodes(function(node) {return !transition.ownsKnobNode(node)});
    if(transition !== this.selectedTransition) {
        this.clearTransition();
        this.selectedTransition = transition;
    }
};

SelectionManager.prototype.setNodeSelection = function(selectedNode, shifted) {
    //some templates or nodes are should not affect the selection (e.g. resize knobs)
    if(!selectedNode.selectable) {
        return;
    };

    if(!this.containsNode(selectedNode)) {
        var that = this;

        //Clear the current selection if not shifted or dragSelection
        if(!shifted && !this.dragSelection) {
            this.clearNodes(function(node) {return selectedNode.id !== node.id});
        }

        this.selectedTemplate = selectedNode.template;
        this.addSelectedNode(selectedNode);
        this.clearTransition(selectedNode, object.isDefined(this.dragSelection));

        //Trigger drag for all selected nodes if one selection is dragged
        //We use additon style instead of on event for a performance gain (on.dragMove is deactivated see draggable.js)
        //We don't have to remove this addition after reselect because only selected nodes can be dragged anyways.
        var that = this;
        if(!selectedNode.additions['multiSelectionDrag']) {
            selectedNode.additions['multiSelectionDrag'] = {
                dragMove: function (dx, dy, evt) {
                    if (!evt.triggerEvent) {
                        object.each(that.selectedNodes, function (index, node) {
                            if (selectedNode.id !== node.id) {
                                node.triggerDrag(dx, dy);
                            }
                        });
                    }
                }
            }
        }
    } else if(shifted && !this.dragSelection) {
        this.removeSelectedNode(selectedNode);
    }
};

SelectionManager.prototype.dragSelectionStart = function(evt, startPosition) {
    var that = this;
    // INIT drag selection
    if (!this.isElementHover()) {
        this.clear();
        evt.preventDefault();
        this.diagram.on('mousemove', function (evt) {
            var stagePosition = that.diagram.getStagePosition(evt);
            if (!that.dragSelection) {
                that.dragSelection = that.diagram.svg.path({style: 'stroke:gray;stroke-width:1px;stroke-dasharray:5,5;fill:none;'});
                that.dragSelection.d().start(startPosition)
                    .line(startPosition)
                    .line(stagePosition)
                    .line(stagePosition)
                    .complete();
            } else {
                //Move selection away from mouse pointer
                var alignedMouseX = stagePosition.x - 1;
                var alignedMouseY = stagePosition.y - 1;

                //Update pathdata
                that.dragSelection.d().clear().start(startPosition)
                    .line({x: startPosition.x, y: alignedMouseY})
                    .line({x: alignedMouseX, y: alignedMouseY})
                    .line({x: alignedMouseX, y: startPosition.y})
                    .complete();

                //Check for hovered elements to select
                object.each(that.diagram.nodeMgr.nodes, function (id, node) {
                    that.dragSelect(node);
                });

                object.each(that.diagram.knobMgr.knobs, function(id, knob) {
                    that.dragSelect(knob.node);
                });
            }

            //Trigger attribute update
            that.dragSelection.update();
        });
    };
};

SelectionManager.prototype.dragSelect = function(node) {
    if(!node.selectable) {
        return;
    }
    if(this.dragSelection.overlays(node.getCenter())) {
        if(!node.selected) {
            node.select();
        }
    } else if(node.selected) {
        node.deselect();
    }
};

SelectionManager.prototype.dragSelectionEnd = function() {
    this.diagram.off('mousemove');
    if(this.dragSelection) {
        this.dragSelection.remove();
        delete this.dragSelection;
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
    this.selectedNodes.push(selectedNode);
};

SelectionManager.prototype.removeSelectedTransition = function(transition) {
    if(this.selectedTransition === transition) {
        delete this.selectedTransition;
    }
};

SelectionManager.prototype.removeSelectedNode = function(node) {
    var index = this.selectedNodes.indexOf(node);
    if(index >= 0) {
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

SelectionManager.prototype.clearNodes = function(filter) {
    var that = this;
    filter = filter || function() {return true;};
    //We clone the array since the original array can be manipulated while deselection.
    var selectedNodesArr = object.cloneArray(this.selectedNodes);
    object.each(selectedNodesArr, function(index, node) {
        if(node.selectable && filter(node)) {
            node.deselect();
        }
    });
    this.selectedNodes = [];
};

SelectionManager.prototype.clearTransition = function(node, force) {
    if(!this.selectedTransition) {
        return;
    }
    if(force || !node  || !node.knob || !this.selectedTransitionOwnsKnobNode(node)) {
        this.selectedTransition.deselect();
    }
};

SelectionManager.prototype.selectedTransitionOwnsKnobNode = function(node) {
    return this.selectedTransition && this.selectedTransition.ownsKnobNode(node);
};

SelectionManager.prototype.isMultiSelection = function() {
    var count = 0;
    count += this.selectedNodes.length;
    return count > 1;
};

module.exports = SelectionManager;
