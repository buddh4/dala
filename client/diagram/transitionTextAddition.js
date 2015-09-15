var util = require('../util/util');
var object = util.object;
var Helper = require('./helper');

var NODE_DISTANCE = 10;
var TRANSITION_DISTANCE = 10;

var TransitionTextAddition = function(transition) {
    this.textNodes = [];
    this.helper = new Helper(transition.diagram);
    this.transition = transition;
    this.diagram = this.transition.diagram;
    this.transition.additions.text = this;
};

/**
 * The update addition function rerenders all containing textnodes by means
 * of the current transition settings. This function is delegated by
 * the transition as addition call.
 */
TransitionTextAddition.prototype.update = function() {
    var that = this;
    object.each(this.textNodes, function(index, textSVG) {
        if(textSVG) {
            that.updateTextPosition(index);
        }
    });
};

TransitionTextAddition.prototype.getText = function(pos) {
    if(this.textNodes[pos]) {
        return this.textNodes[pos].$().text();
    }
};

/**
 * Sets the text for a given position. If the given text position is not
 * occupied yet we create a new textnode.
 */
TransitionTextAddition.prototype.setText = function(pos, text) {
    if(!this.textNodes[pos]) {
        this.textNodes[pos] = this.diagram.svg.text(text);
        this.diagram.svg.addToGroup(this.transition.group, this.textNodes[pos]);
    } else {
        this.textNodes[pos].$().text(text);
    }
    this.updateTextPosition(pos);
};

/**
 * Updates the textnode position and anchor for the given position by means of the current
 * transition settings.
 */
TransitionTextAddition.prototype.updateTextPosition = function(pos) {
    var position = this.getTextPosition(pos);

    //For some points the position cannot be determined mainly on the node corner
    if(position) {
        this.textNodes[pos].moveTo(position);
        this.setAnchor(pos);
    }
};

TransitionTextAddition.prototype.getTextPosition = function(pos) {
    // The resulting text position
    var textPosition;

    if(isStartPos(pos) || isEndPos(pos)) {
        // start/end docking position
        var alignPosition = this.getAlignPosition(pos);
        // the first/last part of the transition
        var transitionLine = this.transition.pathManager.getLineByIndex(0, isEndPos(pos));
        // the location of the end/start docking on the node
        var location =  this.getNodeLocation(pos);
        switch(location) {
            case 'left':
            case 'right':
                // Move x along the transition by NODE_DISTANCE
                textPosition = (location === 'left')
                    ? transitionLine.calcFX(alignPosition.x - NODE_DISTANCE)
                    : transitionLine.calcFX(alignPosition.x + NODE_DISTANCE);

                /*
                 * Move y upwards/downwards by TRANSITION_DISTANCE adjusted by textheight
                 * away from the transition.
                 * Note: the svg text height is not precise because of a glyph padding (we assum 5 pixel here)
                 */
                textPosition.y += (isTop(pos))
                    ? -TRANSITION_DISTANCE
                    : TRANSITION_DISTANCE + (this.textNodes[pos].height() - 5);
                break;
            case 'top':
            case 'bottom':
                // Calculate the y - axis interception for the helper line
                var t = (location === 'top')
                    ? alignPosition.y  - NODE_DISTANCE
                    : alignPosition.y  + NODE_DISTANCE + (this.textNodes[pos].height() - 5);

                // Move y along the transition by means of the y - axis interception
                textPosition = (!transitionLine.isVertical())
                    ? transitionLine.calcLineIntercept(new util.math.Line(0, t))
                    : {x : alignPosition.x, y : t};

                // Move x left/right away from the transition
                textPosition.x += (isTop(pos))
                    ? TRANSITION_DISTANCE
                    : -TRANSITION_DISTANCE;

                break;
        }

        return textPosition;
    } else {
        //Mid Position
        var textPosition = this.transition.pathManager.getCenter();
        if(isTop(pos)) {
            textPosition.y -= 10;
        } else {
            textPosition.y += 10;
        }
        return textPosition;
    }
};

TransitionTextAddition.prototype.getAlignPosition = function(pos) {
    if(isStartPos(pos)) {
        return this.transition.getStartKnob().position();
    } else if(isEndPos(pos)) {
        return this.transition.getEndKnob().position();
    }
};

TransitionTextAddition.prototype.getNodeLocation = function(pos) {
    if(isStartPos(pos)) {
        return this.transition.getStartDockingLocation();
    } else if(isEndPos(pos)) {
        return this.transition.getEndDockingLocation();
    }
};

/**
 * This function determines the text-anchor by means of the current
 * node location to assure the text is not overlapping other texts or the
 * node itself.
 */
TransitionTextAddition.prototype.setAnchor = function(pos) {
    var textSVG = this.textNodes[pos];
    if(!isMidPos(pos)) {
        switch(this.getNodeLocation(pos)) {
            case 'left':
                textSVG.end();
                break;
            case 'right':
                textSVG.start();
                break;
            case 'top':
            case 'bottom':
                if(isBottom(pos)) {
                    textSVG.end();
                } else {
                    textSVG.start();
                }
                break;
        }
    } else {
        textSVG.middle();
    }
};

var isBottom = function(pos) {
    return !isTop(pos);
};

var isTop = function(pos) {
    return pos % 2 === 0;
};

var isStartPos = function(pos) {
    return pos < 2;
};

var isMidPos = function(pos) {
    return !isStartPos(pos) && !isEndPos(pos);
};

var isEndPos = function(pos) {
    return pos > 3;
};

module.exports = TransitionTextAddition;
