var event = require('../core/event');
var Command = require('../core/command');
var object = require('../util/object');
var string = require('../util/string');

// CONSTANTS
var CONTAINER_SELECTOR = '#editNav';
var CONTENT_SELECTOR = '#editContent';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var $CONTAINER_CONTENT = $(CONTENT_SELECTOR);

// private
var editNode, editTransition;

var initListener = function() {
    event.listen('node_selected', nodeSelectListener);
    event.listen('node_edit', nodeEditListener);
    event.listen('node_removed', nodeRemovedListener);
    event.listen('selection_clear', clearInfo);
    event.listen('transition_select', transitionSelectListener);
}


/**
 * Initializes a transition marker dropdown menu (start or end marker).
 * @param markerId defines the dropdown id (not selector) to determine to which marker this dropdown is assigned.
 */
var initMarkerDropDown = function(markerId) {
    var selector = '#'+markerId;
    // Init the custom jquery-ui.iconselectmenu (see ./uiAdditions.js)
    $( selector ).iconselectmenu({
        appendTo: '#editNav',
        change : function(evt, ui) {
            if(editTransition) {
                var command = new Command()
                    .exec({}, updateMarker, [markerId, ui.item.value])
                    .undo({}, updateMarker, [markerId, editTransition[markerId]()]);

                event.command(command, true);
            }
        }
    }).iconselectmenu( "menuWidget" ).addClass( "ui-menu-icons customicons" );
    $( selector ).iconselectmenu('widget').prepend($('<span>', {class:'ui-icon marker-none'}));
};

/**
 * Initializes the text edit input events.
 */
var initTransitionTextInput = function() {
    $('.transTextEdit').on('change', function() {
        var textIndex = parseInt($(this).data('index'));
        var text = $(this).val();
        editTransition.additions.text.setText(textIndex, text);
    });
};

/**
 * We listen to edit events
 */
var nodeEditListener = function(evt) {
    if(editNode === evt.data) {
        nodeSelectListener(evt);
    }
};

/**
 * Check if the current edit node was removed and clear the edit fields if this was the case.
 */
var nodeRemovedListener = function(evt) {
    if(editNode === evt.data) {
        clearInfo();
    }
};

/**
 * Clears the edit node and edit transition data and hides the menus
 */
var clearInfo = function() {
    delete editTransition;
    delete editNode;
    $('#editTransition').hide();
    $('#editNodeContent').empty();
    $('.transTextEdit').empty();
    $('#editNav').hide();
    $('#editNode').hide();
};

/**
 * Sets the menu data for a the current node selection.
 */
var nodeSelectListener = function(evt) {
    clearInfo();

    editNode = evt.data;
    var diagram = editNode.diagram;

    // Create a dynamic table by means of the edit addition config fields of the current node which is taken from the tmpl.
    var $editTable = $(document.createElement('table'));
    object.each(editNode.additions.edit.config, function(key, value) {
        var editConfigItem = diagram.getEditItem(editNode, key);

        //TODO: we should allow adding new types to allow templates to add edit logic
        switch(editConfigItem.type) {
            case 'color':
                appendColorInputRow($editTable, key, editConfigItem);
                break;
            case 'text':
                appendTextInputRow($editTable, key, editConfigItem);
                break;
            case 'textarea':
                appendTextareaInputRow($editTable, key, editConfigItem);
                break;
        }
    });
    $('#editNodeContent').append($editTable);
    $('#editNode').show();
    $('#editNav').show();
    // Focus the first form input to enable a fast edit
    $("#editNodeForm").find(':input:visible:enabled:first').focus();
};

/**
 * Appends a color input field to the given table node with the editConfig values.
 */
var appendColorInputRow = function($editTable, editKey, editConfigItem) {
    var $input = $(document.createElement('input'));
    $input.attr('type', 'color');
    $input.val(editConfigItem.currentVal);
    $input.on('change', function() {
        editNode.diagram.setEditValue(editNode, editKey, $(this).val());
    });
    appendRow($editTable, $input, editConfigItem);
};

/**
 * Appends a textarea input field to the given table node with the given editConfig values.
 */
var appendTextareaInputRow = function($editTable, editKey, editConfigItem) {
    var $input = $(document.createElement('textarea'));
    $input.val(editConfigItem.currentVal);
    $input.on('change', function() {
        editNode.diagram.setEditValue(editNode, editKey, $(this).val());
    });
    appendRow($editTable, $input, editConfigItem);
};

/**
 * Appends a text input field to the given table node with the given editConfig values.
 */
var appendTextInputRow = function($editTable, editKey, editConfigItem) {
    var $input = $(document.createElement('input'));
    $input.attr('type', 'text');
    $input.attr('value', editConfigItem.currentVal);
    $input.on('change', function() {
        editNode.diagram.setEditValue(editNode, editKey, $(this).val());
    });
    appendRow($editTable, $input, editConfigItem);
};

/**
 * Appends the given input to a new row instance and appends the new row to the table
 */
var appendRow = function($editTable, $input, editConfigItem) {
    var $editRow = createEditRow(editConfigItem);
    var $editTD = $(document.createElement('td'));
    $editTD.append($input);
    $editRow.append($editTD);
    $editTable.append($editRow);
};

/**
 * Creates a new edit menu row with the given editconfig label as a tablehead cell
 */
var createEditRow = function(editConfigVal) {
    var $editTR = $(document.createElement('tr'));
    var $editTH = $(document.createElement('th'));
    $editTH.text(editConfigVal.label+': ');
    $editTR.append($editTH);
    return $editTR;
};

/**
 *
 * @param evt
 */
var transitionSelectListener = function(evt) {
    clearInfo();

    editTransition = evt.data;
    $('#editTransition').show();

    var currentEndMarker = editTransition.endMarker();
    var currentStartMarker = editTransition.startMarker();

    updateButtonMarker('#endMarker', currentEndMarker);
    updateButtonMarker('#startMarker', currentStartMarker);
    $('#editNav').show();

    var textAddition = editTransition.additions.text;

    $('#edit_ST').val(textAddition.getText(0));
    $('#edit_SB').val(textAddition.getText(1));
    $('#edit_MT').val(textAddition.getText(2));
    $('#edit_MB').val(textAddition.getText(3));
    $('#edit_ET').val(textAddition.getText(4));
    $('#edit_EB').val(textAddition.getText(5));

    $('#startMarker-button').focus();
};

var updateMarker = function(markerId, markerValue) {
    var markerSelector = '#'+markerId;

    if(editTransition[markerId]() !== markerValue) {
        if(markerValue) {
            editTransition[markerId](markerValue);
        } else {
            editTransition[markerId]('');
        }

        updateButtonMarker(markerSelector,markerValue);
    }
};

var updateButtonMarker = function(markerSelector, markerValue) {
    markerValue = (object.isDefined(markerValue)) ? markerValue : 'none';
    $(markerSelector).val(markerValue).iconselectmenu('refresh');
    var icon = $(markerSelector).iconselectmenu('widget').children('.ui-icon').get(0);

    //reset current marker class of the button and update the icon
    $(icon).attr('class', 'ui-icon');

    //for start marker we cut the suffix
    if(string.endsWith(markerValue, '_s')) {
        markerValue = markerValue.substring(0,markerValue.length - 2);
    }

    $(icon).addClass('marker-'+markerValue);
};

module.exports.init = function() {
    clearInfo();
    initMarkerDropDown('endMarker');
    initMarkerDropDown('startMarker');
    initTransitionTextInput();
    initListener();
};