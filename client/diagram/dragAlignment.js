var util = require('../util/util');
var config = require('../core/config');

var object = util.object;
var DEF_TOLERANCE = 10;

var Alignment = function(tolerance, dimension) {
    this.dimension = dimension;
    this.tolerance = tolerance;
    this.actualD = 0;
};

Alignment.prototype.check = function(source, sourceIndexArr,target, d) {
    if(this.checkRange(source, target, d)) {
        // We keep the source position for the realignment
        if(!this.wasAligned) {
            this.source = source;
            this.sourceIndex = sourceIndexArr;
        }
        // Calculate d between target and source before drag
        this.d = (target[this.dimension] - (source[this.dimension]));
        this.target = target;
        // Keep track of the actual drag while beeing aligned for the realign
        this.actualD += d;
    }
};

Alignment.prototype.checkRange = function(source, target, d) {
    //Check if the difference between source (after drag) and target is within the tolerane
    return util.math.checkRangeDiff(target[this.dimension], (source[this.dimension] + this.actualD + d), this.tolerance);
};

Alignment.prototype.realign = function(alignConfig, d) {
    // We just have to calculate the realignment if an alignment was set
    var result;
    if(this.wasAligned) {
        //Now we retrieve the current position of the aligned source by our sourceIndex
        var currentSourcePosition = alignConfig[this.sourceIndex[0]].source[this.sourceIndex[1]];
        result = (this.source[this.dimension] + this.actualD + d) - currentSourcePosition[this.dimension];
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

var DragAlignment = function(diagram, getConfig, tolerance) {
    this.diagram = diagram;
    this.tolerance = tolerance || DEF_TOLERANCE;
    this.getConfig = getConfig;
    this.alignX = new Alignment(this.tolerance, 'x');
    this.alignY = new Alignment(this.tolerance, 'y');
    this.actualDrag = {x:0, y:0};
};

DragAlignment.prototype.check = function(dx, dy) {
    var result;
    if(config.val('dragAlign', true) && !this.diagram.isMultiSelection()) {
        var that = this;

        // Reset the alignments to notify a new search loop
        this.alignX.reset();
        this.alignY.reset();

        var alignmentConfig = this.getConfig(dx, dy);
        object.each(alignmentConfig, function(configIndex, value) {
            var sourceArr = value.source;
            var targetArr = value.target;
            object.each(sourceArr, function(sourceIndex, value) {
                that.checkAlignment(value, targetArr, [configIndex, sourceIndex], dx, dy);

                if(that.alignX.isAligned() && that.alignY.isAligned()) {
                    return false; //Escape the each loop since we found both alingments
                }
            })
        });

        result = {
            dx : (this.alignX.isAligned()) ? this.alignX.d : this.alignX.realign(alignmentConfig, dx),
            dy : (this.alignY.isAligned()) ? this.alignY.d : this.alignY.realign(alignmentConfig, dy)
        };
    } else {
        this.alignX.reset(true);
        this.alignY.reset(true);
        result = {dx : dx, dy : dy};
    }

    return result;
};

DragAlignment.prototype.checkAlignment = function(source, targets, sourceIndexArr, dx, dy) {
    var that = this;
    object.each(targets, function(index, target) {
        if(!that.alignX.isAligned()) {
            that.alignX.check(source,sourceIndexArr, target, dx);
        }

        if(!that.alignY.isAligned()) {
            that.alignY.check(source,sourceIndexArr, target, dy);
        }

        if(that.alignX.isAligned() && that.alignY.isAligned()) {
            return false; //Escape the each loop since we found both alingments
        }
    });
}

DragAlignment.prototype.reset = function() {
    this.alignX.reset(true);
    this.alignY.reset(true);
};

DragAlignment.prototype.isAligned = function() {
    return this.alignX.isAligned || this.alignY.isAligned();
};

module.exports = DragAlignment;

