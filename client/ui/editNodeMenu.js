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
}

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
        }
    });
};

var focus = function() {
    $form.find(':input:visible:enabled:first').focus();
};

var appendTextFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    appendInput($fieldSet, editConfigItem, 'Text', editKey+'_text', {type : 'text'});
    appendInput($fieldSet, editConfigItem, 'Color', editKey+'_color', {type : 'color'});
    appendInput($fieldSet, editConfigItem, 'Size', editKey+'_text-size', {type : 'range', min : TEXT_SIZE_MIN, max : TEXT_SIZE_MAX}, undefined, true, 'px');
    $form.append($fieldSet);
};

var appendTextareaFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    appendInput($fieldSet, editConfigItem, 'Text', editKey+'_textarea', {rows: 5}, 'textarea');
    appendInput($fieldSet, editConfigItem, 'Color', editKey+'_color', {type : 'color'});
    appendInput($fieldSet, editConfigItem, 'Size', editKey+'_text-size', {type : 'range', min : TEXT_SIZE_MIN, max : TEXT_SIZE_MAX}, undefined, true, 'px');
    $form.append($fieldSet);
};

var appendStrokeFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    appendInput($fieldSet, editConfigItem, 'Color', editKey+'_stroke', {type : 'color'});
    appendInput($fieldSet, editConfigItem, 'Width', editKey+'_stroke-width', {type : 'range', min : STROKE_WIDTH_MIN, max : STROKE_WIDTH_MAX}, undefined, true, 'px');
    appendInput($fieldSet, editConfigItem, 'Dash', editKey+'_stroke-dash', {type : 'range', min : DASH_SETTING_MIN, max : DASH_SETTING_MAX}, undefined, true);
    $form.append($fieldSet);
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

var initFieldSet = function(editConfigItem) {
    var $fieldSet = dom.create('fieldSet');
    var $legend = dom.create('legend', undefined, editConfigItem.label);
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