var object = require('../util/object');

var KnobManager = function(diagram) {
    this.dockings = [];
    this.hideDocking = false;
    diagram.event.listen('knob_created', this.addDockingListener, this);
    diagram.event.listen('knob_delete', this.deleteKnob, this);
};

KnobManager.prototype.addDockingListener = function(evt) {
    if(object.isDefined(evt.data)) {
        this.dockings.push(evt.data);
    }
};

KnobManager.prototype.hideKnobs = function() {
    this.hideDocking = true;
    this.executeOnAllKnobs(function(docking) {
        docking.hide();
    });
};

KnobManager.prototype.showKnobs = function() {
    this.hideDocking = false;
    this.executeOnAllKnobs(function(docking) {
        docking.show();
    });
};

KnobManager.prototype.executeOnAllKnobs = function(func) {
    object.each(this.dockings, function(index, docking) {
        func(docking);
    });
}

KnobManager.prototype.deleteKnob = function(evt) {
    if(object.isDefined(evt.data)) {
        var index = this.dockings.indexOf(evt.data);
        if(index > -1) {
            this.dockings.splice(index, 1);
        }
        evt.data.remove();
    }
};

module.exports = KnobManager;
