var Helper = function(diagram) {
    this.diagram = diagram;
    this.points = {};
};

Helper.prototype.point = function(id, p, color) {
    color = color || 'red';
    var text = id+'(x:'+p.x + ' y:'+p.y+')';
    if(!this.points[id]) {
        var point = this.diagram.svg.circle({
            r:2,
            style:'fill:'+color
        });
        var text = this.diagram.svg.text(text);
        var group = this.diagram.svg.g({id:'helper_'+id}, text, point);
        this.points[id] = {
            group : group,
            text : text,
            point : point
        }
    }

    this.points[id].point.moveTo(p);
    this.points[id].text.$().text(text);
    this.points[id].text.moveTo(p);
};

module.exports = Helper;
