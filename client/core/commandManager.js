var util = require('../util/util');
var object = util.object;
var dom = util.dom;
var event = require('./event');
var Command = require('./command');

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
    this.register('cmd_group', new Command(this, function(commands) {
        var that = this;
        $.each(commands, function(index, cmd) {
            that.commands[cmd[0]].instance(cmd[1], cmd[2]).exec();
        });
    }, function(commands) {
        var that = this;
        $.each(commands, function(index, cmd) {
            that.commands[cmd[0]].instance(cmd[1], cmd[2]).undo();
        });
    }));
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
    cmd.id = cmdId;
};

CommandManager.prototype.addGroup = function(commands) {
    this.add('cmd_group', commands, commands);
};

CommandManager.prototype.execGroup = function(commands) {
    this.exec('cmd_group', commands, commands);
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
            console.log('Add command '+cmdInstance.id);
            this.undoCommands.push(cmdInstance);
            if(!this.lockRedo) {
                this.redoCommands = [];
            }
        }
        return cmdInstance
    } else {
        console.warn('Unregistered command '+cmdId+' was called.');
    }
};

CommandManager.prototype.undo = function() {
    var command = this.undoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.undo)) {
        console.log('Undo command '+command.id);
        command.undo.apply(command);
        this.redoCommands.push(command);
        this.updated(command);
    }
};

CommandManager.prototype.redo = function() {
    var command = this.redoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.exec)) {
        console.log('Redo command '+command.id);
        this.lockRedo = true;
        command.exec.apply(command);
        this.lockRedo = false;
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

