var Command = require('../core/command');
var event = require('../core/event');
var object = require('../util/object');
var string = require('../util/string');
var toolTip = require('./toolTip');

var ID_PANEL = 'editTransitionPanel';
var ID_SECTION = 'editTransitionSection';

var section, panel, editTransition, initState;

var init = function() {
    section = toolTip.getSection(ID_SECTION);
    panel = toolTip.getPanel(ID_PANEL);
    initMarkerDropDown('endMarker');
    initMarkerDropDown('startMarker');
    initTypeDropDown();
    initTransitionTextInput();
    clear();
};

var clear = function() {
    delete editTransition;
    panel.hide();
    $('.ttextPositionInput').empty();
};

var show = function() {
    panel.show();
};

var update = function() {
    panel.update();
};

/**
 * Initializes a transition marker dropdown menu (start or end marker).
 * @param markerId defines the dropdown id (not selector) to determine to which marker this dropdown is assigned.
 */
var initMarkerDropDown = function(markerId) {
    var selector = '#'+markerId;
    // Init the custom jquery-ui.iconselectmenu (see ./uiAdditions.js)
    $( selector ).iconselectmenu({
        appendTo: '#editTransition',
        change : function(evt, ui) {
            if(editTransition && !initState) {
                triggerEdit(markerId, ui.item.value);
            }
        }
    }).iconselectmenu( "menuWidget" ).addClass( "ui-menu-icons customicons" );
    $( selector ).iconselectmenu('widget').prepend($('<span>', {class:'ui-icon marker-none'}));
};

var initTypeDropDown = function() {
    // Init the custom jquery-ui.iconselectmenu (see ./uiAdditions.js)
    $( '#transitionType' ).iconselectmenu({
        appendTo: '#editTransition',
        change : function(evt, ui) {
            if(editTransition && !initState) {
                triggerEdit('type', ui.item.value);
            }
        }
    }).iconselectmenu( "menuWidget" ).addClass( "ui-menu-icons customicons" );
    $( '#transitionType' ).iconselectmenu('widget').prepend($('<span>', {class:'ui-icon marker-none'}));
};

/**
 * Initializes the text edit input events.
 */
var initTransitionTextInput = function() {
    $('.ttextPositionInput').on('change', function() {
        if(editTransition && !initState) {
            var textIndex = parseInt($(this).data('index'));
            var text = $(this).val();
            triggerEdit('text' + textIndex, text);
            editTransition.additions.text.setText(textIndex, text);
        }
    });
};

var triggerEdit = function(key , value) {
    event.trigger('transition_edit', {transition : editTransition, key : key, value : value});
};

/**
 * Fills the static transitoin form
 */
var fillForm = function(transition) {
    initState = true;
    editTransition = transition;
    //Fill Marker values
    updateButtonMarker('#endMarker', transition.endMarker());
    updateButtonMarker('#startMarker', transition.startMarker());

    $('#transitionType').val(transition.type()).iconselectmenu('refresh');


    //Fill text values
    var textAddition = transition.additions.text;
    $('#edit_ST').val(textAddition.getText(0));
    $('#edit_SB').val(textAddition.getText(1));
    $('#edit_MT').val(textAddition.getText(2));
    $('#edit_MB').val(textAddition.getText(3));
    $('#edit_ET').val(textAddition.getText(4));
    $('#edit_EB').val(textAddition.getText(5));

    //Focus first input
    $('#startMarker-button').focus();
    //We should not prefocus a jquery ui selectmenu item because it causes two keydown event triggers when focused.
    //$('#edit_ST').focus();
    initState = false;
}

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

var focus = function() {
    $('#startMarker-button').focus();
};

var getEditTransition = function() {
    return editTransition;
}

module.exports = {
    init : init,
    getEditTransition : getEditTransition,
    clear : clear,
    focus : focus,
    update : update,
    fillForm : fillForm,
    show : show
}