var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var EditNodeAddition = function(node) {
    AbstractEditAddition.call(this, node, editFunctions, node.config.edit);
    this.node = node;
    //this.event = transition.event;
};

util.inherits(EditNodeAddition, AbstractEditAddition);

var editFunctions = {
    stroke : {
        get : function(editItem) {
            return this.node.getInnerSVG(editItem.bind).stroke();
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).stroke(value);
        }
    },
    'stroke-width' : {
        get : function(editItem) {
            return this.node.getInnerSVG(editItem.bind).strokeWidth();
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).strokeWidth(value);
        }
    },
    'stroke-dash' : {
        get : function(editItem) {
            return this.node.getInnerSVG(editItem.bind).strokeDashType();
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).strokeDashType(value);
        }
    },
    text : {
        get : function(editItem) {
            return $(this.node.getNodeSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            $(this.node.getNodeSelector(editItem.bind)).text(value);
            this.node.exec('contentChanged');
        }
    },
    textarea : {
        get : function(editItem) {
            return $(this.node.getNodeSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            var $editSVGNode = $(this.node.getNodeSelector(editItem.bind));
            this.setTextAreaContent($editSVGNode,value);
            this.node.exec('contentChanged');
        }
    },
    'text-size' : {
        get : function(editItem) {
            var definition = this.node.getInnerSVG(editItem.bind).style('font-size');
            //TODO: better textimplementation
            if(definition) {
                return definition.substring(0, definition.length - 2);
            }
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).style('font-size', value+'px');
            this.node.exec('contentChanged');
        }
    },
    color : {
        get : function(editItem) {
            return this.node.getInnerSVG(editItem.bind).fill();
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).fill(value);
        }
    }
};

EditNodeAddition.requireConfig = true;

module.exports = EditNodeAddition;