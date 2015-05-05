var util = require('../util/util');
var event = require('../core/event');

var StageCommand = function(diagram) {
    this.diagram = diagram;
};

StageCommand.prototype.getNodeById = function(id) {
    return this.diagram.getNodeById(id);
};

StageCommand.prototype.getTransitionById = function(id) {
    return this.diagram.getNodeById(id);
};

StageCommand.prototype.getTransitionById = function(id) {
    return this.diagram.getTransitionById(id);
};

StageCommand.prototype.getSVG = function(id) {
    return this.diagram.svg.get(id);
};

StageCommand.prototype.store = function(command) {
    event.trigger('command_add', command);
};

StageCommand.prototype.exec = function(command) {
    return event.trigger('command_execute', command);
};

StageCommand.prototype.getNodeMgr = function(command) {
    return this.diagram.nodeMgr;
};

StageCommand.prototype.getTransitionMgr = function(command) {
    return this.diagram.transitoinMgr;
};

StageCommand.prototype.getSelectionMgr = function(command) {
    return this.diagram.selectionMgr;
};

module.exports = StageCommand;