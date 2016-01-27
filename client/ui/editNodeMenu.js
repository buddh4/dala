var object = require('../util/object');
var toolTip = require('./toolTip');
var dom = require('../dom/dom');

var ID_SECTION = 'editNodeSection';
var ID_PANEL = 'editNodePanel';
var ID_FORM = 'editNodeForm';

var TEXT_SIZE_MIN = 1;
var TEXT_SIZE_MAX = 40;

var STROKE_WIDTH_MIN = 0;
var STROKE_WIDTH_MAX = 20;

//TODO: More Settings with perhaps with dropdown images
var DASH_SETTING_MIN = 0;
var DASH_SETTING_MAX = 3;

var imageDropDowns =[];

var section, panel, editNode, $form;

var init = function() {
    section = toolTip.getSection(ID_SECTION);
    panel = toolTip.getPanel(ID_PANEL);
    initForm();
    clear();
};

var initForm = function() {
    $form = dom.create('form', {id : ID_FORM, action :  'javascript:void(0);'});
    section.$content.append($form);
};

var clear = function() {
    delete editNode;
    panel.hide();
    $form.empty();
};

var show = function() {
    panel.show();
};

var update = function() {
    panel.update();
};

var createForm = function(node) {
    editNode = node;
    var editAddition = node.additions.edit;

    if(!node.additions.edit) {
        return;
    }

    // Create a dynamic table by means of the edit addition config fields of the current node which is taken from the tmpl.
    object.each(editAddition.config, function(key, value) {
        var editConfigItem = editAddition.getEditItem(key);

        //TODO: implement way to register new edit panels register(function(editNodeMenu) {...})
        switch(editConfigItem.type) {
            case 'stroke':
                appendStrokeFieldSet(key, editConfigItem);
                break;
            case 'text':
                appendTextFieldSet(key, editConfigItem);
                break;
            case 'textarea':
                appendTextareaFieldSet(key, editConfigItem);
                break;
            case 'color':
                appendColorFieldSet(key, editConfigItem);
                break;
        }
    });
};

var focus = function() {
    $form.find(':input:visible:enabled:first').focus();
};

var appendTextFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    var $divContainer = appendDivContainer($fieldSet);
    appendInput($divContainer, editConfigItem, 'Content', editKey+':text', {type : 'text'});
    appendInput($divContainer, editConfigItem, 'Color', editKey+':color', {type : 'color'});
    appendInput($divContainer, editConfigItem, 'Size', editKey+':text-size', {type : 'range', min : TEXT_SIZE_MIN, max : TEXT_SIZE_MAX}, undefined, true, 'px');
    $form.append($fieldSet);
};

var appendTextareaFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    var $divContainer = appendDivContainer($fieldSet);
    appendInput($divContainer, editConfigItem, 'Content', editKey+':textarea', {rows: 5}, 'textarea');
    appendInput($divContainer, editConfigItem, 'Color', editKey+':color', {type : 'color'});
    appendInput($divContainer, editConfigItem, 'Size', editKey+':text-size', {type : 'range', min : TEXT_SIZE_MIN, max : TEXT_SIZE_MAX}, undefined, true, 'px');
    $form.append($fieldSet);
};

var appendColorFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    var $divContainer = appendDivContainer($fieldSet);
    appendInput($divContainer, editConfigItem, 'Color', editKey, {type : 'color'});
    $form.append($fieldSet);
};

var appendStrokeFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    var $divContainer = appendDivContainer($fieldSet);
    appendInput($divContainer, editConfigItem, 'Color', editKey+':stroke', {type : 'color'});
    appendInput($divContainer, editConfigItem, 'Width', editKey+':stroke-width', {type : 'range', min : STROKE_WIDTH_MIN, max : STROKE_WIDTH_MAX}, undefined, true, 'px');

    $form.append($fieldSet);
    var that = this;
    var options = {
        'none': 'images/icons/icon-dash-none.png',
        '5,5': 'images/icons/icon-dash-1.png',
        '10,10' : 'images/icons/icon-dash-2.png',
        '3,5': 'images/icons/icon-dash-3.png',
        '5,2': 'images/icons/icon-dash-4.png',
        '20,10,5,5,5,10' : 'images/icons/icon-dash-5.png'
    };

    var $strokeSelect = appendImageDropDown($divContainer, editConfigItem, 'Dash', editKey+':stroke-dash', {id:'nodeStrokeDashSelect', style:'width:85px;'}, options);
    $('#nodeStrokeDashSelect').msDropDown();
};

var appendDivContainer = function($fieldSet) {
    var $divContainer = dom.create('div', {'class': 'editSectionContainer'});
    $fieldSet.append($divContainer);
    return $divContainer;
};

var appendInput = function($fieldSet, editConfigItem, label, key, attributes, overwriteElementName, output, outputUnit) {
    var name = overwriteElementName || 'input';
    var $label = dom.create('label', undefined, label+':');
    var $input = dom.create(name, attributes);
    var currentVal = editNode.additions.edit.getValue(key);
    currentVal = (object.isString(currentVal)) ? currentVal.trim() : currentVal;
    $input.val(currentVal);
    $input.on('change', function() {
        //We set the value trough the diagram/nodeMgr since we need to fire command events
        editNode.additions.edit.setValue(key, $(this).val());
    });

    if(output) {
        outputUnit = outputUnit || '';
        outputUnit = ' '+outputUnit;
        var outputInitValue = (currentVal) ? currentVal+outputUnit : 'none';
        var $output = dom.create('output', undefined, outputInitValue);
        $input.on("change paste keyup input", function() {
            var $this = $(this);
            $this.prev('output').text($this.val()+outputUnit);
        });
        $fieldSet.append($label, $output, $input);
    } else {
        $fieldSet.append($label, $input);
    }
    return $input;
};

var appendImageDropDown = function($fieldSet, editConfigItem, label, key, attributes, options) {
    var $select = dom.create('select', attributes);
    $.each(options, function(value, imageLink) {
        $select.append(dom.create('option', {value: value, title: imageLink}));
    });
    var currentVal = editNode.additions.edit.getValue(key);
    currentVal = (object.isString(currentVal)) ? currentVal.trim() : currentVal;
    $select.val(currentVal);
    $select.on('change', function() {
        //We set the value trough the diagram/nodeMgr since we need to fire command events
        editNode.additions.edit.setValue(key, $(this).val());
    });
    $fieldSet.append($select);
    return $select;
};

var initFieldSet = function(editConfigItem) {
    var $fieldSet = dom.create('fieldSet');
    var $legend = dom.create('legend', {'class':'editLegend'}, editConfigItem.label);
    return $fieldSet.append($legend);
};

var getEditNode = function() {
    return editNode;
}

module.exports = {
    init : init,
    getEditNode : getEditNode,
    clear : clear,
    show : show,
    focus : focus,
    update : update,
    createForm : createForm
}