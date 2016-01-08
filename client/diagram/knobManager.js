var object = require('../util/object');

var KnobManager = function(diagram) {
    this.knobs = [];
    this.hideDocking = false;
    this.diagram = diagram;
    this.templateMgr = diagram.templateMgr;
    diagram.event.listen('knob_added', this.addKnobListener, this);
    diagram.event.listen('knob_delete', this.deleteKnobListener, this);
};

KnobManager.prototype.addKnobListener = function(evt) {
    if(evt.data) {
        this.knobs.push(evt.data);
    }
};

KnobManager.prototype.createKnobNode = function(p, group, cfg) {
    var knobId = this.diagram.uniqueId();
    var config = object.extend({node_id:'docking_'+knobId, x: p.x, y: p.y, type:'circle'}, cfg);
    var tmpl_id = 'knob_'+config.type.toLowerCase();
    var node = this.templateMgr.getTemplateSync(tmpl_id).createNode(config, this.diagram).init();
    if(group) {
        this.diagram.svg.addToGroup(group, node.root);
    }
    return node;
};

KnobManager.prototype.deleteKnobListener = function(evt) {
    if(object.isDefined(evt.data)) {
        var index = this.knobs.indexOf(evt.data);
        if(index > -1) {
            this.knobs.splice(index, 1);
        }
        evt.data.remove();
    }
};

KnobManager.prototype.hideKnobs = function() {
    this.hideDocking = true;
    this.executeOnAllKnobs(function(knob) {
        knob.hide();
    });
};

KnobManager.prototype.showKnobs = function() {
    this.hideDocking = false;
    this.executeOnAllKnobs(function(knob) {
        knob.show();
    });
};

KnobManager.prototype.executeOnAllKnobs = function(func) {
    object.each(this.knobs, function(index, knob) {
        func(knob);
    });
};

module.exports = KnobManager;
