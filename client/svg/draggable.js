var SVGElement = require('./svgElement');
var util = require('../util/util');
var event = require('../core/event');

var object = util.object;
var dom = util.dom;

var getMouseEventData = function(evt) {
    if(!evt.clientX) {
        return event.mouse();
    }
    return evt;
}

SVGElement.prototype.draggable = function(cfg, dragElement) {
    var cfg = cfg || {};

    if(!object.isDefined(dragElement)) {
        dragElement = this.instance();
    }

    var that = this;

    var dragMove = function(evt) {
        if(evt.preventDefault) {
            evt.preventDefault();
        }

        var actualdx = (object.isDefined(evt.dx)) ? evt.dx : evt.clientX - that.dragCurrentX;
        var actualdy = (object.isDefined(evt.dy)) ? evt.dy : evt.clientY - that.dragCurrentY;

        // DRAG BEFORE HOOK
        if(cfg.dragBeforeMove) {
            cfg.dragBeforeMove.apply(that, [evt, actualdx, actualdy, dragElement]);
        }

        // DRAG ALIGNMENT
        if(object.isDefined(cfg.dragAlignment)) {
            var alignment = cfg.dragAlignment.check(actualdx, actualdy);
            actualdx = alignment.dx;
            actualdy = alignment.dy;
        }

        // DRAG RESTRICTION
        var dx = (cfg.restrictionX) ? cfg.restrictionX.apply(that, [evt, actualdx, actualdy]) : actualdx;
        var dy = (cfg.restrictionY) ? cfg.restrictionY.apply(that, [evt, actualdx, actualdy]) : actualdy;

        //TODO: somehow the scale should be determined in a more elegant way perhaps store it in svg instance...
        if(cfg.getScale) {
            var scale = cfg.getScale();
            dx /= scale;
            dy /= scale;
        }

        // EXECUTE DRAG
        if(dx !== 0 || dy !== 0) {
            that.move(dx, dy);
        }

        var evtData = getMouseEventData(evt);
        // Keep track of current mouse position
        that.dragCurrentX = evtData.clientX;
        that.dragCurrentY = evtData.clientY;

        that.dxSum += dx;
        that.dySum += dy;

        // DRAG MOVE HOOK
        if(cfg.dragMove) {
            cfg.dragMove.apply(that, [evt, dx, dy, dragElement]);
        }
    };

    var dragEnd = function(evt) {
        evt.preventDefault();
        //Turn off drag events
        event.off(that.getRootNode(), 'mousemove');
        event.off(document, 'mouseup', dragEnd);

        if(cfg.dragAlignment) {
            cfg.dragAlignment.reset();
        }

        this.drag = false;

        if(cfg.cursor) {
            $('body').css('cursor','default');
        }

        // DRAG END HOOK
        if(cfg.dragEnd) {
            cfg.dragEnd.apply(that, [evt]);
        }
    };

    if(dragElement) {
        var evtType = (cfg.once)? event.once : event.on;
        evtType(dragElement,'mousedown', function(e) {
            if(e.ctrlKey) {
                return;
            }
            e.preventDefault();
            // We stop the event propagation to prevent the document mousedown handler to fire
            e.stopPropagation();

            that.dxSum = 0;
            that.dySum = 0;

            // DRAG START HOOK
            if(cfg.dragStart) {
                cfg.dragStart.apply(that, [e]);
            }

            if(cfg.cursor) {
                $('body').css('cursor', cfg.cursor);
            }

            var evtData = getMouseEventData(e);
            that.dragCurrentX = evtData.clientX;
            that.dragCurrentY = evtData.clientY;

            that.drag = true;
            event.on(that.getRootNode(), 'mousemove', dragMove);
            event.on(document, 'mouseup', dragEnd);
        });
    }

    //Simulates an drag start event
    this.initDrag = function() {
        $(dragElement).trigger('mousedown');
    };

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    this.triggerDrag = function(dx, dy) {
        dragMove.apply(this,[{dx:dx, dy:dy, triggerEvent:true}]);
    };

    return this;
};