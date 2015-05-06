var object = require('../util/object');

var DockingManager = function(diagram) {
    this.dockings = [];
    this.hideDocking = false;
    diagram.event.listen('docking_added', this.addDockingListener, this);
    diagram.event.listen('docking_delete', this.deleteDocking, this);
};

DockingManager.prototype.addDockingListener = function(evt) {
    if(object.isDefined(evt.data)) {
        this.dockings.push(evt.data);
    }
};

DockingManager.prototype.hideDockings = function() {
    this.hideDocking = true;
    object.each(this.dockings, function(index, docking) {
        docking.hide();
    });
};

DockingManager.prototype.showDockings = function() {
    this.hideDocking = false;
    object.each(this.dockings, function(index, docking) {
        docking.show();
    });
};

DockingManager.prototype.deleteDocking = function(evt) {
    if(object.isDefined(evt.data)) {
        var index = this.dockings.indexOf(evt.data);
        if(index > -1) {
            this.dockings.splice(index, 1);
        }
        evt.data.remove();
    }
};
module.exports = DockingManager;
