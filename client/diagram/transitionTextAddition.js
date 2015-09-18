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
        var id = 'text'+pos+'_'+this.transition.id;
        var textNode = this.textNodes[pos] = this.diagram.svg.text(text, {id : id});
        this.diagram.svg.addToGroup(this.transition.group, textNode);
        this.transition.additions.edit.addEditTextTrigger({
            type : 'text',
            bind : '#'+id,
            trigger : '#'+id
        });
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
    var textPosition;

    if(isStartPos(pos) || isEndPos(pos)) {
        //Move along the transition in the right direction
        var index = isEndPos(pos) ? -1 : 1;
        var distance = isEndPos(pos) ? NODE_DISTANCE * -1 : NODE_DISTANCE;
        textPosition = this.transition.getPath().moveAlong(index, distance);

        switch(this.getLocation(pos)) {
            case 'left':
            case 'right':
                textPosition.y += (isTop(pos)) ? -TRANSITION_DISTANCE : TRANSITION_DISTANCE + (this.textNodes[pos].height() - 5);
                break;
            case 'top':
            case 'bottom':
                textPosition.x += (isTop(pos)) ? TRANSITION_DISTANCE : -TRANSITION_DISTANCE;
                break;
        }
    } else {
        //Mid Position
        textPosition = this.transition.getPath().getCenter();
        textPosition.y += isTop(pos) ? -10 : 10;
    }

    return textPosition;
};

TransitionTextAddition.prototype.getAlignPosition = function(pos) {
    if(isStartPos(pos)) {
        return this.transition.getStartKnob().position();
    } else if(isEndPos(pos)) {
        return this.transition.getEndKnob().position();
    }
};

TransitionTextAddition.prototype.getLocation = function(pos) {
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
        switch(this.getLocation(pos)) {
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
