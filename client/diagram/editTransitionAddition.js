var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var EditTransitionAddition = function(transition) {
    AbstractEditAddition.call(this, transition, editFunctions, config);
    this.transition = transition;
};

util.inherits(EditTransitionAddition, AbstractEditAddition );

var editFunctions = {
    stroke : {
        get : function(editItem) {
            return this.transition.line.stroke();
        },
        set : function(binding, value) {
            this.transition.line.stroke(value);
        }
    },
    'stroke-width' : {
        get : function(editItem) {
            return this.transition.strokeWidth();
        },
        set : function(binding, value) {
            this.transition.strokeWidth(value);
        }
    },
    'stroke-dash' : {
        get : function(editItem) {
            return this.transition.line.strokeDashType();
        },
        set : function(editItem, value) {
            this.transition.line.strokeDashType(value);
        }
    },
    text : {
        get : function(editItem) {
            return $(this.transition.getTransitionSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            $(this.transition.getTransitionSelector(editItem.bind)).text(value);
        }
    },
    textarea : {
        get : function(editItem) {
            return $(this.transition.getTransitionSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            var $editSVGNode = $(this.transition.getTransitionSelector(editItem.bind));
            this.setTextAreaContent($editSVGNode,value);
        }
    },
    'text-size' : {
        get : function(editItem) {
            var definition = this.transition.getInnerSVG(editItem.bind).style('font-size');
            if(definition) {
                return definition.substring(0, definition.length - 2);
            }
        },
        set : function(editItem, value) {
            this.transition.getInnerSVG(editItem.bind).style('font-size', value+'px');
        }
    },
    'type' : {
        get : function(editItem) {
            return this.transition.type();
        },
        set : function(editItem, value) {
            this.transition.type(value);
        }
    },
    'startMarker' : {
        get : function(editItem) {
            return this.transition.startMarkerValue();
        },
        set : function(editItem, value) {
            value = value || '';
            this.transition.startMarker(value);
        }
    },
    'endMarker' : {
        get : function(editItem) {
            return this.transition.endMarkerValue();
        },
        set : function(editItem, value) {
            value = value || '';
            this.transition.endMarker(value);
        }
    }
};

var config = {
    'text0' : {type : 'text', bind : 'text0', trigger : 'text0'},
    'text1' : {type : 'text', bind : 'text1', trigger : 'text1'},
    'text2' : {type : 'text', bind : 'text2', trigger : 'text2'},
    'text3' : {type : 'text', bind : 'text3', trigger : 'text3'},
    'text4' : {type : 'text', bind : 'text4', trigger : 'text4'},
    'text5' : {type : 'text', bind : 'text5', trigger : 'text5'},
    'type'  : {type : 'type', bind : 'line'},
    'transition' : { type : 'stroke', bind : 'line'},
    'startMarker' : { type : 'startMarker', bind : 'line'},
    'endMarker' : { type : 'endMarker', bind : 'line'}
};

module.exports = EditTransitionAddition;