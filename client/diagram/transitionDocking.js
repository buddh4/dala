var util = require('../util/util');
var Docking = require('./docking');
var DragAlignment = require('./dragAlignment');
var event = require('../core/event');

var dom = util.dom;
var object = util.object;
//TODO: perhaps we should rather mark an element like rect or cicle as content
//element since we have to be able to add elements even if there is none

var TransitionDocking = function(transition) {
    this.transition = transition;
    this.dockings = [];
};

TransitionDocking.prototype.size = function() {
    return this.dockings.length;
};

TransitionDocking.prototype.hasInnerDockings = function() {
    return this.dockings.length > 2;
};

TransitionDocking.prototype.activateDockings = function() {
    var arr = this.getTransitionLineData().dataArr;
    for(var i = 0; i < arr.length; i++) {
        this.dockings[i] = this.initDocking(arr[i].value);
    }
};

TransitionDocking.prototype.add = function(position) {
    this.dockings.push(this.initDocking(position));
};

TransitionDocking.prototype.remove = function() {
    object.each(this.dockings, function(index, value) {
        if(object.isDefined(value)) {
            value.remove();
        }
    });
};

TransitionDocking.prototype.removeDockingMarker = function() {
    dom.remove(dom.children(this.transition.group.instance(), '.docking'));
};

TransitionDocking.prototype.addInnerDocking = function(startPoint, dockingIndex) {
    this.getTransitionLineData().addLine(dockingIndex, startPoint);
    var docking = this.initDocking(startPoint);
    this.dockings.splice(dockingIndex, 0, docking);
    this.transition.redraw();
    return docking;
};

TransitionDocking.prototype.initDocking = function(startPoint) {
    var docking = new Docking(this.transition.svg, startPoint, {group : this.transition.group});

    var that = this;
    docking.draggable({
        dragAlignment : new DragAlignment(that.transition.diagram,
            {
                getSource: function() {
                    return docking.position();
                },
                getTargets: function() {
                    return that.getJoiningOrientation(docking);
                }
            }),
        dragMove : function() {
            //We have to determine the index since it could be changed
            that.updateTransitionDocking(docking.position(), that.dockings.indexOf(docking));
        }
    });

    docking.onRemove(function() {
        if(!that.transition.removed) {
            var index = that.dockings.indexOf(docking);
            that.dockings.splice(index, 1);
            that.getTransitionLineData().removePath(index);
            that.transition.update();
        }
    });

    docking.selectable();
    return docking;
};

TransitionDocking.prototype.getJoiningDockings = function(docking) {
    var index = this.getIndexForDocking(docking);
    return [this.dockings[index - 1], this.dockings[index + 1]];
};

TransitionDocking.prototype.getJoiningOrientation = function(docking) {
    var index = this.getIndexForDocking(docking);
    var result = [];
    if(index <= 1) { //start or second docking
        result.push(this.transition.startNode.getOrientation(this.getStartDocking().relativeOrientation()));
    } else if(index !== 0){
        var orientation = this.dockings[index - 1];
        result.push({x : orientation.x(), y : orientation.y()});
    }

    if(index >= this.dockings.length -2) { //end or one before end docking
        result.push(this.transition.endNode.getOrientation(this.getEndDocking().relativeOrientation()));
    } else {
        var orientation = this.dockings[index + 1];
        result.push({x : orientation.x(), y : orientation.y()});
    }

    return result;
};

TransitionDocking.prototype.getIndexForDocking = function(docking) {
    return this.dockings.indexOf(docking);
};

TransitionDocking.prototype.getDockingFromEndIndex = function(indexDif) {
    return this.dockings[(this.dockings.length - 1) - indexDif];
};

TransitionDocking.prototype.getDockingFromIndex = function(index) {
    return this.dockings[index];
};

TransitionDocking.prototype.updateTransitionDocking = function(position, dockingIndex) {

    if(this.transition.diagram.isMultiSelection()
        && (dockingIndex === 0 || dockingIndex === this.dockings.length -1)) {
        return;
    }

    // update transitionline and transitionarea
    this.getTransitionLineData().setPoint(dockingIndex, position);
    this.getTransitionAreaData().setData(this.getTransitionLineData().dataArr);

    // move the correspondig docking
    this.dockings[dockingIndex].moveTo(position.x, position.y);

    // special handling for start and end dockings
    if(dockingIndex === 0) {
        this.transition.updateEnd(position);
        event.trigger('transition_drag_startdocking', this.transition);
    } else if(dockingIndex === this.dockings.length -1) {
        this.transition.updateStart(position);
        event.trigger('transition_drag_enddocking', this.transition);
    } else {
        this.transition.update();
    }

    this.transition.redraw();
};

TransitionDocking.prototype.calcEndDockingPosition = function() {
    var dataArr = this.getTransitionLineData().dataArr;
    // if we have inner dockings we use the last inner docking as
    // outer orientation for the end docking else we use the startdocking
    var outerOrientation = (dataArr.length > 2)
        ? dataArr[dataArr.length - 2].value
        : this.getStartDocking().position();

    var relativeInnerOrientation = (object.isDefined(this.getEndDocking()))
        ? this.getEndDocking().relativeOrientation()
        : undefined;

    return this.transition.endNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
};

TransitionDocking.prototype.calcStartDockingPosition = function(mouse) {
    var outerOrientation = mouse;
    if(object.isDefined(this.transition.line)) {
        switch(this.getTransitionLineData().dataArr.length) {
            case 2: // just the end node
                if(object.isDefined(this.getEndDocking())) {
                    outerOrientation = this.getEndDocking().position();
                } else {
                    //for init per drag we use mouse init per activation we use endNode
                    outerOrientation = (object.isDefined(this.endNode)) ?
                        this.endNode.getCenter() : mouse;
                }
                break;
            default: // additonal dockings
                outerOrientation = this.getTransitionLineData().get(1).value;
                break;
        }
    }
    var relativeInnerOrientation = (object.isDefined(this.getStartDocking()))
        ? this.getStartDocking().relativeOrientation()
        : undefined;

    return this.transition.startNode.getDockingPosition(outerOrientation, relativeInnerOrientation);
};

TransitionDocking.prototype.getTransitionLineData = function() {
    return this.transition.line.data();
};

TransitionDocking.prototype.getTransitionAreaData = function() {
    return this.transition.lineArea.data();
};

TransitionDocking.prototype.getEndDocking = function() {
    if(this.dockings.length > 1) {
        return this.dockings[this.dockings.length - 1];
    }
};

TransitionDocking.prototype.getStartDocking = function() {
    return this.dockings[0];
};

TransitionDocking.prototype.getDockingForPosition = function(position) {
    return this.dockings[this.getDockingIndexForPoint(position)];
};

TransitionDocking.prototype.getDockingIndexForPoint = function(point) {
    var arr = this.getTransitionLineData().dataArr;

    if(arr.length === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate;

    object.each(this.getTransitionParts(), function(index, part) {
        //WE assume simple line points (X/Y) here and no arrays
        var xMin = Math.min(part.start.x, part.end.x);
        var xMax = Math.max(part.start.x, part.end.x);

        // If the search point is within the transition part x boundary we calculate y and return the candidate with
        // the lowest y distance
        if (point.x <= xMax && point.x >= xMin) {
            var line = new util.math.Line(part.start, part.end);
            var yResult = line.calcFX(point.x);

            var d = Math.abs(yResult - point.y);
            if (candidate === undefined || candidate[1] > d) {
                //The dockingindex is the arrayindex + 1 since we return the end index
                candidate = [index+1, d];
            }
        }
    });

    if (candidate !== undefined) {
        return candidate[0];
    }
};

TransitionDocking.prototype.getTransitionParts = function() {
    var arr = this.getTransitionLineData().dataArr;
    var result = [];
    var dockingIndex = 1;
    while(dockingIndex <= arr.length - 1) {
        result.push({
            start: arr[dockingIndex - 1].value,
            end: arr[dockingIndex].value
        });
        dockingIndex++;
    }
    return result;
}

TransitionDocking.prototype.getCenter = function() {
    var resultD = this.getDistance() / 2;
    var currentD = 0;
    var center;
    object.each(this.getTransitionParts(), function(index, part) {
        var lineD = util.math.Line.calcDistance(part.start, part.end);
        var nextD = currentD + lineD;
        if(nextD > resultD) {
            var diffD =  resultD - currentD;
            center = util.math.Line.moveAlong(part.start, part.end, diffD);
            return false;
        }
        currentD = nextD;
    });
    return center;
}

TransitionDocking.prototype.getDistance = function() {
    var distance = 0;
    object.each(this.getTransitionParts(), function(index, part) {
        distance += util.math.Line.calcDistance(part.start, part.end);
    });
    return distance;
};

module.exports = TransitionDocking;