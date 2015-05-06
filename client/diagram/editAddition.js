var util = require('../util/util');

var object = util.object;
var dom = util.dom;

var EditAddition = function(node) {
    this.node = node;
    this.event = node.event;
    this.node.additions.edit = this;
    this.config = this.node.template.config.edit;
    this.initEditTrigger();
    //this.$contentNodes = $(node.root.instance()).find('*').filter(function() { return $(this).attr('dala:content'); });
};

EditAddition.prototype.initEditTrigger = function() {
    var that = this;
    object.each(this.config, function(key, editItem) {
        if(object.isDefined(editItem.trigger)) {
            if(object.isArray(editItem.trigger)) {
                object.each(editItem.trigger, function(index, relTriggerId) {
                    that.addEditTrigger(relTriggerId, {key : key, item : editItem});
                });
            } else if(object.isString(editItem.trigger)) {
                that.addEditTrigger(editItem.trigger, {key : key, item : editItem});
            }
        }
    });
};

EditAddition.prototype.addEditTrigger = function(relativeTriggerId, editItemConfig) {
    switch(editItemConfig.item.type) {
        case 'text':
        case 'textarea':
            this.addEditTextTrigger(relativeTriggerId, editItemConfig);
            break;
    }
};

EditAddition.prototype.addEditTextTrigger = function(relativeTriggerId, editItemConfig) {
    var that = this;
    var $triggerNode = $(this.node.getNodeSelector(relativeTriggerId));

    $triggerNode.css('cursor', 'pointer');
    $triggerNode.on('click', function(evt) {
        if(that.isTriggerAllowed()) {
            var type = editItemConfig.item.type;
            switch(type) {
                case 'textarea':
                    that.renderTextAreaEdit(evt.pageX, evt.pageY, editItemConfig);
                    break;
                case 'text':
                    that.renderTextEdit(evt.pageX, evt.pageY, editItemConfig);
                    break;
            }
        }
    });
};

EditAddition.prototype.renderTextAreaEdit = function(pageX ,pageY, editItemConfig) {
    var that = this;
    var $editDiv = this.initEditPanel(pageX ,pageY);
    var content = this.getValueFromItem(editItemConfig.item);

    var $input = $(document.createElement('textarea'));
    $input.val(content);

    $input.on('change', function() {
        that.node.diagram.setEditValue(that.node, editItemConfig.key, $input.val());
    });

    $input.on('focus', function() {
        this.select();
    });

    $editDiv.children('form').append($input);
    $input.focus();
};

EditAddition.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
    $textAreaNode.empty();
    //TODO: we do not consider the text size for dy !
    var dy = 11;
    $.each(txtAreaContent.split('\n'), function(index, value) {
        if(object.isDefined(value) && value.trim().length > 0) {
            dom.appendSVGElement($textAreaNode.get(0), {
                name : 'tspan',
                attributes : {
                    dy : dy,
                    x : 2
                }
            }, value);
        }
    });
};

EditAddition.prototype.getTextAreaContent = function($textAreaNode) {
    var result = '';
    $textAreaNode.children().each(function() {
        result += $(this).text()+'\n';
    });
    return result;
};

EditAddition.prototype.renderTextEdit = function(pageX ,pageY, editItemConfig) {
    var that = this;
    var $editDiv = this.initEditPanel(pageX ,pageY);

    var $input = $(document.createElement('input'));
    $input.attr('type', 'text');
    $input.attr('value', this.getValueFromItem(editItemConfig.item));
    $input.focus();

    $input.on('focus', function() {
        this.select();
    });



    /* We cannot use the direct update because the undo command will not work
     * since after the change the undo command gets the current value which
     * already is updated in in this case.

     var $textNode = $(this.node.getNodeSelector(editItemConfig.item.bind));
     $input.on('input', function() {
     $textNode.text($input.val());
     });*/

    $input.on('change', function() {
        that.node.diagram.setEditValue(that.node, editItemConfig.key, $input.val());
    });

    $editDiv.children('form').append($input);
    $input.focus();
};

EditAddition.prototype.initEditPanel = function(pageX, pageY, onclose) {
    $('#editPanel').remove();
    var that = this;
    var $editDiv = $(document.createElement('div'));
    $editDiv.offset({top: pageY, left: (pageX+5)});
    $editDiv.css('position', 'absolute');
    $editDiv.css('background-color', 'silver');
    $editDiv.attr('id', 'editPanel');

    var $close = $(document.createElement('input'));
    $close.attr('type', 'button');
    $close.attr('value', 'x');
    $close.on('mouseup',function() {
        if(object.isDefined(onclose)) {
            onclose.apply();
        }
        that.node.executeAddition('contentChanged');
        $('#editPanel').remove();
    });

    var $form = $(document.createElement('form'));
    $form.attr('action', '#');
    $form.on('submit', function() {
        $close.trigger('mouseup');
    });

    $form.append($close)
    $editDiv.append($form);
    document.getElementsByTagName('body')[0].appendChild($editDiv.get(0));
    return $editDiv;
};

EditAddition.prototype.getItem = function(key) {
    var result = object.cloneObject(this.config[key]);
    result.currentVal = this.getValue(key);
    return result;
};

EditAddition.prototype.getValue = function(key) {
    return this.getValueFromItem(this.config[key]);
};

EditAddition.prototype.getValueFromItem = function(item) {
    switch(item.type) {
        case 'color':
            //TODO: binding can be an array of inner nodes !!
            return this.node.getInnerSVG(item.bind).fill();
        case 'text':
            return $(this.node.getNodeSelector(item.bind)).text();
        case 'textarea':
            return this.getTextAreaContent($(this.node.getNodeSelector(item.bind)));
    }
    return item;
};


EditAddition.prototype.setValue = function(key, newValue) {
    var item = this.config[key];
    switch(item.type) {
        case 'color':
            this.node.getInnerSVG(item.bind).fill(newValue);
            break;
        case 'text':
            $(this.node.getNodeSelector(item.bind)).text(newValue);
            break;
        case 'textarea':
            var $editSVGNode = $(this.node.getNodeSelector(item.bind));
            this.setTextAreaContent($editSVGNode,newValue);
            break;
    }
    this.node.executeAddition('edit');
    this.event.trigger('node_edit',this.node);
};

EditAddition.prototype.deselect = function() {
    this.remove();
};

EditAddition.prototype.isTriggerAllowed = function() {
    //Since the
    var now = Date.now();
    return (now - this.lastSelect > 200);
};

EditAddition.prototype.select = function() {
    this.lastSelect = Date.now();
};

EditAddition.prototype.remove = function() {
    $('#editPanel').remove();
};

EditAddition.prototype.update = function() {
    this.remove();
};

module.exports = EditAddition;