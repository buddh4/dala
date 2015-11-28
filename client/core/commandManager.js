var util = require('../util/util');
var object = util.object;
var dom = util.dom;
var event = require('./event');

//Command instances for diagrams
var instances = {};

var sub = function(subId, updateHandler) {
    return instances[subId] = new CommandManager(subId, updateHandler);
};

var CommandManager = function(subId, updateHandler) {
    this.subId = subId;
    this.commands = {};
    this.undoCommands = [];
    this.redoCommands = [];
    this.updateHandler = updateHandler;
};

/**
 * We can register a new command for this given command instance (mostly a command for a specific diagram instance)
 * which is identified by its string id.
 *
 * The client and action attribute for the do and undo action should be set for the given actions.
 *
 * @param cmdId string id
 * @param cmd command instance
 */
CommandManager.prototype.register = function(cmdId, cmd) {
    this.commands[cmdId] = cmd;
};

CommandManager.prototype.exec = function(cmdId, doArgs, undoArgs) {
    var cmdInstance = this.add(cmdId, doArgs, undoArgs);
    if(cmdInstance) {
        console.log('Execute command '+cmdInstance.id);
        return cmdInstance.exec();
    }
};

CommandManager.prototype.add = function(cmdId, doArgs, undoArgs) {
    var command = this.commands[cmdId];
    if(command) {
        this.updated(command);
        var cmdInstance = command.instance(doArgs,undoArgs);
        if(cmdInstance) {
            cmdInstance.id = cmdId+'_'+Date.now();
            console.log('Add command '+cmdInstance.id);
            this.undoCommands.push(cmdInstance);
            this.redoCommands = [];
        }
        return cmdInstance
    } else {
        console.warn('Unregistered command '+cmdId+' was called.');
    }
};

CommandManager.prototype.undo = function() {
    var command = this.undoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.undo)) {
        command.undo.apply(command);
        console.log('Undo command '+command.id);
        this.redoCommands.push(command);
        this.updated(command);
    }
};

CommandManager.prototype.redo = function() {
    var command = this.redoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.exec)) {
        command.exec.apply(command);
        console.log('Redo command '+command.id);
        this.undoCommands.push(command);
        this.updated(command);
    }
};

CommandManager.prototype.updated = function(command) {
    this.lastChange = Date.now();
    if(this.updateHandler) {
        this.updateHandler(command);
    }
}

module.exports = {
    sub : sub
};

