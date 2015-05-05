var util = require('../util/util');
var object = util.object;
var dom = util.dom;
var event = require('./event');

var CommandManager = function() {
    this.undoCommands = [];
    this.redoCommands = [];
    event.listen('command_add', this.addCommandListener, this);
    event.listen('command_execute', this.executeCommandListener, this);
    event.listen('key_redo_press', this.redoCommand, this);
    event.listen('key_undo_press', this.undoCommand, this);
};

CommandManager.prototype.addCommandListener = function(evt) {
    this.undoCommands.push(evt.data);
};

CommandManager.prototype.executeCommandListener = function(evt) {
    this.addCommandListener(evt);
    this.execute(evt.data);
};

CommandManager.prototype.execute = function(command) {
    this.result = command.exec();
};

CommandManager.prototype.undoCommand = function() {
    var command = this.undoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.undo)) {
        command.undo.apply(command);
        this.redoCommands.push(command);
    }
};

CommandManager.prototype.redoCommand = function() {
    var command = this.redoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.exec)) {
        command.exec.apply(command);
        this.undoCommands.push(command);

    }
};

module.exports = CommandManager;

