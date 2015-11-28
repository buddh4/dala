var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var editFunctions = {
    stroke : 'stroke',
    'stroke-width' : 'strokeWidth',
    'stroke-dash' : 'strokeDashType',
    color : 'fill',
    text : {
        get : function(editItem) {
            return $(this.node.getNodeSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            $(this.node.getNodeSelector(editItem.bind)).text(value);
        }
    },
    textarea : {
        get : function(editItem) {
            return this.getTextAreaContent(this.node.getNodeSelector(editItem.bind));
        },
        set : function(editItem, value) {
            var $editSVGNode = $(this.node.getNodeSelector(editItem.bind));
            this.setTextAreaContent($editSVGNode,value);
        }
    },
    'text-size' : {
        get : function(editItem) {
            var definition = this.node.getInnerSVG(editItem.bind).style('font-size');
            if(definition) {
                return definition.substring(0, definition.length - 2);
            }
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).style('font-size', value+'px');
        }
    }
};

var EditNodeAddition = function(node) {
    AbstractEditAddition.call(this, node, editFunctions, node.config.edit);
    this.node = node;
};

util.inherits(EditNodeAddition, AbstractEditAddition);

EditNodeAddition.prototype.onSetValue = function() {
    this.node.event.trigger('node_edit', this.node);
};

EditNodeAddition.requireConfig = true;

module.exports = EditNodeAddition;