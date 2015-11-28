var util = require('../util/util');
var event = require('../core/event');
var Command = require('../core/command');

var Manager = function(diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
};

Manager.prototype.command = function(cmdId, doAction, undoAction) {
    this.diagram.registerCommand(cmdId, new Command(this, doAction, undoAction));
};

Manager.prototype.exec = function(cmdId, doArgs, undoArgs) {
    return this.diagram.executeCommand(cmdId, doArgs, undoArgs);
};

Manager.prototype.addCmd = function(cmdId, doArgs, undoArgs) {
    this.diagram.addCommand(cmdId, doArgs, undoArgs);
};

Manager.prototype.listen = function(eventId, handler) {
    this.event.listen(eventId, handler, this);
}

Manager.prototype.getNodeById = function(id) {
    return this.diagram.getNodeById(id);
};

Manager.prototype.getTransitionById = function(id) {
    return this.diagram.getTransitionById(id);
};

Manager.prototype.getSVG = function(id) {
    return $.svg(id);
};

Manager.prototype.getNodeMgr = function(command) {
    return this.diagram.nodeMgr;
};

Manager.prototype.getTransitionMgr = function(command) {
    return this.diagram.transitionMgr;
};

Manager.prototype.getSelectionMgr = function(command) {
    return this.diagram.selectionMgr;
};

module.exports = Manager;