var dom = require('../dom/dom');
var EditPanel = require('../ui/editPanel');

var editPanel = new EditPanel();

var AbstractEditAddition = function(editable, editFunctions, config) {
    this.editable = editable;
    this.editFunctions = editFunctions;
    this.config = config;
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
    var $triggerNode = $(this.editable.selector(editItem.trigger));
    $triggerNode.css('cursor', 'pointer');
    $triggerNode.on('click', function(evt) {
        if(that.isTriggerAllowed()) {
            switch(editItem.type) {
                case 'textarea':
                    editPanel.createTextAreaEdit(evt.pageX, evt.pageY,
                        function() {
                            return that.getValue(key);
                        },
                        function(value) {
                            that.setValue(key, value);
                        });
                    break;
                case 'text':
                    editPanel.createTextEdit(evt.pageX, evt.pageY, function() {
                            return that.getValue(key);
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
    if(this.editFunctions[editItem.type]) {
        return this.editFunctions[editItem.type].get.call(this, editItem, key);
    }
};

AbstractEditAddition.prototype.setValue = function(key, value) {
    var editItem = this.getEditItem(key);
    if(this.editFunctions[editItem.type]) {
        this.editFunctions[editItem.type].set.call(this, editItem, value);
        this.onSetValue(editItem, value);
    }
};

/**
 * This method either returns a clone of the editItem for normal keys like 'title', or
 * creates a new editItem out of a combined key like 'title_text-size' with key title and type text-size
 */
AbstractEditAddition.prototype.getEditItem = function(key) {
    var type;
    var editItem;
    if(key.indexOf('_') > -1) {
        var splitted = key.split('_');
        editItem = object.cloneObject(this.config[splitted[0]]);
        editItem.type = splitted[1];
    } else {
        editItem = this.config[key];
    }
    return editItem;
};

AbstractEditAddition.prototype.isTriggerAllowed = function() {
    //Since the
    var now = Date.now();
    return !this.lastSelect || (now - this.lastSelect > 200);
};

//TODO handle svg texts more elegant within a seperated module
AbstractEditAddition.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
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