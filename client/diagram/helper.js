var Helper = function(diagram) {
    this.diagram = diagram;
    this.points = {};
};

Helper.prototype.point = function(id, point, color) {
    color = color || 'red';
    if(!this.points[id]) {
        this.points[id] = this.diagram.svg.circle({
            r:2,
            style:'fill:'+color
        });
    }

    this.points[id].moveTo(point);
};

module.exports = Helper;
