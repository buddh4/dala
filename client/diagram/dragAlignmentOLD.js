var util = require('../util/util');
var config = require('../core/config');

var object = util.object;
var DEF_TOLERANCE = 20;

var Alignment = function(tolerance, dimension) {
    this.dimension = dimension;
    this.tolerance = tolerance;
    this.actualD = 0;
};

Alignment.prototype.check = function(source, target, d) {
    if(this.checkRange(source, target, d)) {
        // We keep the source position for the realignment
        if(!this.wasAligned) {
            this.source = source;
        }
        // Calculate d between target and source before drag
        this.d = (target[this.dimension] - (source[this.dimension]));
        this.target = target;
        // Keep track of the actual drag while beeing aligned for the realign
        this.actualD = this.actualD + d;
    }
};

Alignment.prototype.checkRange = function(source, target, d) {
    //Check if the difference between source (after drag) and target is within the tolerane
    return this.isInDiffRange(target[this.dimension], (source[this.dimension] + this.actualD + d), this.tolerance);
};

Alignment.prototype.isInDiffRange = function(p1, p2, diff) {
    return Math.abs(p1 - p2) < diff;
};

Alignment.prototype.realign = function(currentSource, d) {
    // We just have to calculate the realignment if an alignment was set
    var result;
    if(this.wasAligned) {
        result = (this.source[this.dimension] + this.actualD + d) - currentSource[this.dimension];
    } else {
        result = d;
    }
    this.actualD = 0;
    return result;
};

Alignment.prototype.reset = function(initialize) {
    if(!initialize) {
        this.wasAligned = this.isAligned();
    } else {
        this.wasAligned = false;
    }

    delete this.target;
    delete this.d;
};

Alignment.prototype.isAligned = function() {
    return object.isDefined(this.target);
};


var DragAlignmentConfig = function(diagram, tolerance, getConfig) {
    this.diagram = diagram;
    this.tolerance = tolerance;
    this.getConfig = getConfig;
};

DragAlignmentConfig.prototype.check = function(dx, dy) {
    var that = this;
    var config = this.getConfig(dx,dy);
    var alignments = [];
    object.each(config, function(index, alignConfig) {
        alignments.push(new DragAlignment(that.diagram, alignConfig.source, alignConfig.target, this.tolerance));
    })
};

var DragAlignment = function(diagram, config, tolerance) {

};

DragAlignment.init = function(diagram, sourceArr, targetArr, tolerance) {
    this.diagram = diagram;
    this.tolerance = tolerance || DEF_TOLERANCE;
    this.source = sourceArr;
    this.target = targetArr;
    this.alignX = new Alignment(this.tolerance, 'x');
    this.alignY = new Alignment(this.tolerance, 'y');
    this.actualDrag = {x:0, y:0};
};

DragAlignment.prototype.check = function(dx, dy) {
    var result;
    if(config.val('dragAlign', true) && !this.diagram.isMultiSelection()) {
        // Determine all alignment targets todo: implementation for multiple targets and sources
        var targets = this.getTargets(dx, dy);
        // The alignment source position of the element e.g. the center of the node
        var source = this.getSource(dx, dy);

        object.each(source, function(sourceIndex, value) {
            that.checkAlignment(value, targetArr, {configIndex:configIndex, index:sourceIndex}, dx, dy);

            if(that.alignX.isAligned() && that.alignY.isAligned()) {
                return false; //Escape the each loop since we found both alingments
            }
        });



        // Reset the alignments to notify a new search loop
        this.alignX.reset();
        this.alignY.reset();

        var that = this;
        object.each(targets, function(index, target) {
            that.alignX.check(source, target, dx);
            that.alignY.check(source, target, dy);

            if(that.alignX.isAligned() && that.alignY.isAligned()) {
                return false; //Escape the each loop since we found both alingments
            }
        });

        result = {
            dx : (this.alignX.isAligned()) ? this.alignX.d : this.alignX.realign(source, dx),
            dy : (this.alignY.isAligned()) ? this.alignY.d : this.alignY.realign(source, dy)
        };
    } else {
        this.alignX.reset(true);
        this.alignY.reset(true);
        result = {dx : dx, dy : dy};
    }

    return result;
};

DragAlignment.prototype.reset = function() {
    this.alignX.reset(true);
    this.alignY.reset(true);
};

DragAlignment.prototype.isAligned = function() {
    return this.alignX.isAligned || this.alignY.isAligned();
};

module.exports = DragAlignment;

