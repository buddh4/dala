var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var object = util.object;
var string = util.string;
var dom = util.dom;

var editFunctions = {
    stroke : {
        get : function(binding) {
            return this.transition.line.stroke();
        },
        set : function(binding, value) {
            this.transition.line.stroke(value);
        }
    },
    'stroke-width' : {
        get : function(binding) {
            return this.transition.strokeWidth();
        },
        set : function(binding, value) {
            this.transition.strokeWidth(value);
        }
    },
    'stroke-dash' : {
        get : function(binding) {
            return this.transition.line.strokeDashType();
        },
        set : function(binding, value) {
            this.transition.line.strokeDashType(value);
        }
    },
    text : {
        get : function(binding) {
            return $(this.transition.getNodeSelector(binding)).text();
        },
        set : function(binding, value) {
            $(this.transition.getNodeSelector(binding)).text(value);
        }
    },
    textarea : {
        get : function(binding) {
            return $(this.transition.getNodeSelector(binding)).text();
        },
        set : function(binding, value) {
            var $editSVGNode = $(this.transition.getNodeSelector(binding));
            this.setTextAreaContent($editSVGNode,value);
        }
    },
    'text-size' : {
        get : function(binding) {
            return this.transition.getInnerSVG(binding).style('font-size');
        },
        set : function(binding, value) {
            this.transition.getInnerSVG(binding).style('font-size', value);
        }
    },
    'type' : {
        get : function(binding) {
            return this.transition.type();
        },
        set : function(binding, value) {
            this.transition.type(value);
        }
    },
    'startMarker' : {
        get : function(binding) {
            return this.transition.startMarkerValue();
        },
        set : function(binding, value) {
            value = value || '';
            this.transition.startMarker(value);
        }
    },
    'endMarker' : {
        get : function(binding) {
            return this.transition.endMarkerValue();
        },
        set : function(binding, value) {
            value = value || '';
            this.transition.endMarker(value);
        }
    }
};

var config = {
    'text0' : {type : 'text', bind : 'text0'},
    'text1' : {type : 'text', bind : 'text1'},
    'text2' : {type : 'text', bind : 'text2'},
    'text3' : {type : 'text', bind : 'text3'},
    'text4' : {type : 'text', bind : 'text4'},
    'text5' : {type : 'text', bind : 'text5'},
    'type'  : {type : 'type', bind : 'line'},
    'transition' : { type : 'stroke', bind : 'line'},
    'startMarker' : { type : 'startMarker', bind : 'line'},
    'endMarker' : { type : 'endMarker', bind : 'line'}
};

var EditTransitionAddition = function(transition) {
    AbstractEditAddition.call(this, transition, editFunctions, config);
    this.transition = transition;
    this.event = transition.event;
    //this.$contentNodes = $(node.root.instance()).find('*').filter(function() { return $(this).attr('dala:content'); });
};

util.inherits(EditTransitionAddition, AbstractEditAddition );

module.exports = EditTransitionAddition;