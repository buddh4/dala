/**
 * This utility module provies build-in docking techniques for transitions and other
 * dockable elements. The docking type can be configured within the template
 * with the config key "dockingType".
 *
 * Example:
 *  <config>
 *      {
 *          "nodeID" : "eer_entityDefault",
 *          "docking" : {type: 'RECT', orientation:'center', ...}
 *          ...
 *      }
 * </config>
 */

var util = require('../util/util');
var dom = util.dom;
var math = util.math;

var checkOrientationBoundary = function(node, p) {
    var dockingType = (node.config.docking && node.config.docking.type) ? node.config.docking.type : 'RECT';
    switch(dockingType.toUpperCase()) {
        case 'CENTER':
            return false;
        case 'CIRCLE':
            return CIRCLE_BOUNDARY.call(node, p);
        case 'ELLIPSE':
            return ELLIPSE_BOUNDARY.call(node, p);
        case 'SQUARE':
        case 'RECT':
            return RECT_BOUNDARY.call(node, p);
    };
};

var calculateDockingPosition = function(node, orientationOut, orientationIn) {
    var dockingType = (node.config.docking && node.config.docking.type) ? node.config.docking.type : 'RECT';
    var result;
    switch(dockingType.toUpperCase()) {
        case 'SIMPLE':
            result = SIMPLE.call(node, orientationOut, orientationIn);
            break;
        case 'CENTER':
            result = CENTER.call(node, orientationOut, orientationIn);
            break;
        case 'CIRCLE':
            result = CIRCLE.call(node, orientationOut, orientationIn);
            break;
        case 'ELLIPSE':
            result = ELLIPSE.call(node, orientationOut, orientationIn);
            break;
        case 'SQUARE':
        case 'RECT':
            result = RECT.call(node,orientationOut, orientationIn);
            break;
        case 'FREE':
            result = FREE.call(node,orientationOut, orientationIn);
            break;
        default:
            result = CENTER.call(node, orientationOut, orientationIn);
            break;

    };

    var rotation = node.root.rotate();
    if(rotation) {
        result = math.rotate(result, node.position(), rotation);
    }

    return result;
};

var FREE = function(position , orientationIn) {
    return orientationIn;
};

var ELLIPSE = function(position , orientationIn) {
    var rx = this.width() / 2;
    var ry = this.height() / 2;
    var ellipse = new math.Ellipse(this.getCenter(), rx, ry);
    var result = ellipse.calcLineIntercept(position, orientationIn);
    return (result.length > 0)?result[0]:orientationIn;

};

var ELLIPSE_BOUNDARY = function(position) {
    var rx = this.width() / 2;
    var ry = this.height() / 2;
    return new math.Ellipse(this.getCenter(), rx, ry).overlays(position);
};

var CIRCLE = function(position, orientationIn) {
    //Note the stroke is not included in some browsers...
    var radius = this.width() / 2;
    var circle = new math.Circle(this.getCenter(), radius);
    var result = circle.calcLineIntercept(position, orientationIn);

    return (result.length > 0)?result[0]:orientationIn;
};

var CIRCLE_BOUNDARY = function(position) {
    var center = this.getCenter();
    var radius = this.width() / 2;
    return new math.Circle(this.getCenter(), radius).overlays(position);
};

/**
 * This technique uses the center of the node as orientation point and
 * returns the intersection of the node boundary and the line from the outer
 * orientation point to the center of the node as result.
 *
 * __________
 * |        |
 * |        |
 * |    x   |<----------------x
 * |        |
 * |        |
 * ----------
 *
 * @param {type} position the outer orientation point
 * @returns {DockingType_L20@call;getCenter}
 */
var RECT = function(position, orientation) {
    if(this.overlays(position)) {
        return orientation;
    }

    var transition = new math.Line(position, orientation);

    if(this.isRightOf(position)) {
        var result = transition.calcFX(this.x());
        if(this.overlays(result)) {
            return result;
        }
    }

    if(this.isLeftOf(position)) {
        var result = transition.calcFX(this.getRightX());
        if(this.overlays(result)) {
            return result;
        }
    }

    if(this.isOver(position)) {
        var bottomY = this.getBottomY();

        if(transition.isVertical()) {
            return {x: orientation.x, y: bottomY};
        }

        if(orientation.x === position.x) {
            return {x:orientation.x, y:bottomY};
        }
        var bottomLine = new math.Line({x:1,y:bottomY}, {x:2,y:bottomY});
        var result = transition.calcLineIntercept(bottomLine);
        //We explicitly set this because of possible calculation deviations
        result.y = bottomY;
        return result;
    } else {
        if(transition.isHorizontal()) {
            return {x:orientation.x, y: this.y()};
        }

        if(orientation.x === position.x) {
            return {x:orientation.x, y:this.y()};
        }
        var topLine = new math.Line({x:1,y:this.y()}, {x:2,y:this.y()});
        var result = transition.calcLineIntercept(topLine);
        //We explicitly set this because of possible calculation deviations
        result.y = this.y();

        return result;
    }
};

var RECT_BOUNDARY = function(p) {
    return this.overl
};

/**
 * This technique just returns the center of the node as result.
 * Note that line will start or end within the node.
 *
 * @param {type} position
 * @returns {DockingType_L20.CENTER@call;getCenter}
 */
var CENTER = function(position) {
    return this.getCenter();
};

/**
 * This technique provides 4 different docking points (top/right/bottom/left)
 * and returns the most suitable docking point for the given outer position.
 *
 * @param {type} position
 */
var SIMPLE = function(position, orientationIn) {
    //The position is within the node
    if(this.overlays(position)) {
        return orientationIn;
    }

    if(this.isLeftOf(position)) {
        return {
            x: this.getRightX(),
            y: orientationIn.y
        };
    } else if(this.isRightOf(position)) {
        return {
            x: this.root.x(),
            y: orientationIn.y
        };
    } else if(this.isOver(position)) {
        return {
            x: orientationIn.x,
            y: this.getBottomY()
        };
    } else if(this.isUnder(position)) {
        return {
            x: orientationIn.x,
            y: this.root.y()
        };
    } else {
        //The position is not outside of the element itself
    }
};

module.exports = {
    CENTER : CENTER ,
    SIMPLE : SIMPLE ,
    DEFAULT : CENTER,
    calculateDockingPosition : calculateDockingPosition,
    checkOrientationBoundary : checkOrientationBoundary
};