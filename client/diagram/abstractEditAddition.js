var dom = require('../dom/dom');
var object = require('../util/object');
var EditPanel = require('../ui/editPanel');

var editPanel = new EditPanel();

var AbstractEditAddition = function(editable, editFunctions, config) {
    this.editable = editable;
    this.editFunctions = editFunctions;
    this.config = config;
    this.initEditTrigger();
};

AbstractEditAddition.prototype.initEditTrigger = function() {
    var that = this;
    object.each(this.config, function(key, editItem) {
        if(object.isDefined(editItem.trigger)) {
            that.addEditTextTrigger(key);
        }
    });
};

AbstractEditAddition.prototype.addEditTrigger = function(key) {
    switch(type) {
        case 'text':
        case 'textarea':
            this.addEditTextTrigger(key);
            break;
    }
};

AbstractEditAddition.prototype.addEditTextTrigger = function(key) {
    var editItem = this.getEditItem(key);
    var that = this;

    var selector = this.editable.selector(editItem.trigger);
    $(selector).css('cursor', 'pointer');

    //TODO: evtl move this to text.editable();
    this.editable.root.$().on('click', selector,  function(evt) {
        if(that.isTriggerAllowed()) {
            //TODO: remove UI dependency and handle it trough trigger event
            switch(editItem.type) {
                case 'textarea':
                    editPanel.createTextAreaEdit(evt.pageX, evt.pageY,
                        function() {
                            return that.getValue(key).trim();
                        },
                        function(value) {
                            that.setValue(key, value);
                        });
                    break;
                case 'text':
                    editPanel.createTextEdit(evt.pageX, evt.pageY, function() {
                            return that.getValue(key).trim();
                        },
                        function(value) {
                            that.setValue(key, value);
                        });
                    break;
            }
        }
    });
};

AbstractEditAddition.prototype.getValue = function(key) {
    var editItem = this.getEditItem(key);
    var editFunction = this.editFunctions[editItem.type];
    if(editFunction && !object.isString(editFunction)) {
        return this.editFunctions[editItem.type].get.call(this, editItem, key);
    } else if(editFunction && object.isString(editFunction)) {
        return this.editable.getInnerSVG(editItem.bind)[editFunction]();
    }
};

AbstractEditAddition.prototype.setValue = function(key, value) {
    var editItem = this.getEditItem(key);
    var oldValue = this.getValue(key);
    var editFunction = this.editFunctions[editItem.type];
    if(editFunction && !object.isString(editFunction)) {
        this.editFunctions[editItem.type].set.call(this, editItem, value);
        this.onSetValue(editItem, value);
    } else if(editFunction && object.isString(editFunction)) {
        this.editable.getInnerSVG(editItem.bind)[editFunction](value);
        this.onSetValue(editItem, value);
    }

    if(this.editable.exec) {
        this.editable.exec('edit', [key, value, oldValue]);
    }
};

/**
 * This method either returns a clone of the editItem for normal keys like 'title', or
 * creates a new editItem out of a combined key like 'title_text-size' with key title and type text-size
 */
AbstractEditAddition.prototype.getEditItem = function(key) {
    var type;
    var editItem;
    if(key.indexOf(':') > -1) {
        var splitted = key.split(':');
        editItem = object.cloneObject(this.config[splitted[0]]);
        editItem.type = splitted[1];
    } else {
        editItem = this.config[key];
    }
    return editItem;
};

AbstractEditAddition.prototype.isTriggerAllowed = function() {
    return !this.lastSelect || (Date.now() - this.lastSelect > 200);
};

AbstractEditAddition.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
    this.editable.diagram.svg.get($textAreaNode).content(txtAreaContent);
};

AbstractEditAddition.prototype.getTextAreaContent = function($textAreaNode) {
    return this.editable.diagram.svg.get($textAreaNode).content();
};

AbstractEditAddition.prototype.deselect = function() {
    this.remove();
};

AbstractEditAddition.prototype.select = function() {
    this.lastSelect = Date.now();
};

AbstractEditAddition.prototype.remove = function() {
    editPanel.close();
};

AbstractEditAddition.prototype.update = function() {
    this.remove();
};

AbstractEditAddition.prototype.activate = function() {
    this.remove();
};

AbstractEditAddition.prototype.onSetValue = function(editItem, value) { };

module.exports = AbstractEditAddition;