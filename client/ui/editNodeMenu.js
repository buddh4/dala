var object = require('../util/object');
var toolTip = require('./toolTip');
var dom = require('../dom/dom');

var ID_SECTION = 'editNodeSection';
var ID_PANEL = 'editNodePanel';
var ID_FORM = 'editNodeForm'

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
    var diagram = node.diagram;

    if(!node.additions.edit) {
        return;
    }

    // Create a dynamic table by means of the edit addition config fields of the current node which is taken from the tmpl.
    //var $editTable = $(document.createElement('fieldset'));
    object.each(node.additions.edit.config, function(key, value) {
        var editConfigItem = diagram.getEditItem(node, key);

        //TODO: we should allow adding new types to allow templates to add edit logic
        switch(editConfigItem.type) {
            //TODO: we should be able to just define stroke and render stroke-width/color/dash through the same key
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
    appendInput($fieldSet, editConfigItem, 'Size', editKey+'_text-size', {type : 'text'});
    $form.append($fieldSet);
};

var appendTextareaFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    appendInput($fieldSet, editConfigItem, 'Text', editKey+'_textarea', {rows: 5}, 'textarea');
    appendInput($fieldSet, editConfigItem, 'Color', editKey+'_color', {type : 'color'});
    appendInput($fieldSet, editConfigItem, 'Size', editKey+'_text-size', {type : 'text'});
    $form.append($fieldSet);
};

var appendStrokeFieldSet = function(editKey, editConfigItem) {
    var $fieldSet = initFieldSet(editConfigItem);
    appendInput($fieldSet, editConfigItem, 'Color', editKey+'_stroke', {type : 'color'});
    appendInput($fieldSet, editConfigItem, 'Width', editKey+'_stroke-width', {type : 'range', min : 0, max : 10});
    appendInput($fieldSet, editConfigItem, 'Dash', editKey+'_stroke-dash', {type : 'range', min : 0, max : 3});
    $form.append($fieldSet);
}

var appendInput = function($fieldSet, editConfigItem, label, key, attributes, overwriteElementName) {
    var name = overwriteElementName || 'input';
    var $label = dom.create('label', undefined, label);
    var $input = dom.create(name, attributes);
    var currentVal = editNode.additions.edit.getValue(key);
    currentVal = (currentVal)? currentVal.trim() : currentVal;
    $input.val(currentVal);
    $input.on('change', function() {
        editNode.diagram.setEditValue(editNode, key, $(this).val());
    });
    $fieldSet.append($label, $input);
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