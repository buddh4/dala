var object = require('../util/object');
var SVGElement = require('../svg/svgElement');
var event = require('../core/event');

SVGElement.prototype.hoverable = function(handler) {
    handler = handler || {};
    var that = this;

    this.mouseenter(function(evt) {
        that.hovered = true;
        event.trigger('element_hoverIn', that);
        if(object.isDefined(handler.in)) {
            handler.in.apply(that, [evt]);
        }
    });

    this.mouseleave(function(evt) {
        that.hovered = false;
        event.trigger('element_hoverOut', that);
        if(object.isDefined(handler.out)) {
            handler.out.apply(that, [evt]);
        }
    });

    return this;
};