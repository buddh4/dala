var event = require('../core/event');
var toolTip = require('./toolTip');

var editTransitionMenu = require('./editTransitionMenu');
var editNodeMenu = require('./editNodeMenu');

// CONSTANTS
var CONTAINER_SELECTOR = '#editNav';
var CONTENT_SELECTOR = '#editContent';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var $CONTAINER_CONTENT = $(CONTENT_SELECTOR);


var init = function() {
    editTransitionMenu.init();
    editNodeMenu.init();
    clearInfo();
    initListener();
};

var initListener = function() {
    event.listen('node_selected', nodeSelectListener);
    event.listen('node_edit', nodeEditListener);
    event.listen('transition_edit_undo', transitionEditListener);
    event.listen('node_removed', nodeRemovedListener);
    event.listen('selection_clear', clearInfo);
    event.listen('transition_selected', transitionSelectListener);

    $(document).on('click','.editLegend', function() {
        $(this).siblings().slideToggle({
            step:  function() {
            editNodeMenu.update();
        }
        });
    });
};

var transitionEditListener = function(evt) {
    if(editTransitionMenu.getEditTransition() === evt.data) {
        transitionSelectListener(evt);
    }
};

var nodeEditListener = function(evt) {
    if(editNodeMenu.getEditNode() === evt.data) {
        nodeSelectListener(evt);
    }
};

/**
 * Check if the current edit node was removed and clear the edit fields if this was the case.
 */
var nodeRemovedListener = function(evt) {
    if(editNodeMenu.editNode === evt.data) {
        clearInfo();
    }
};

/**
 * Clears the edit node and edit transition data and hides the menus
 */
var clearInfo = function() {
    editTransitionMenu.clear();
    editNodeMenu.clear();
};

/**
 * Sets the menu data for a the current node selection.
 */
var nodeSelectListener = function(evt) {
    clearInfo();
    if(evt.data.additions.edit) {
        editNodeMenu.createForm(evt.data);
        editNodeMenu.show();
        editNodeMenu.update();
        editNodeMenu.focus();
    }
};

var transitionSelectListener = function(evt) {
    clearInfo();
    editTransitionMenu.fillForm(evt.data);
    editTransitionMenu.show();
    editTransitionMenu.update();
    editTransitionMenu.focus();
};

module.exports = {
    init : init
};