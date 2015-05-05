var object = require('../util/object');

var Command = function(client, args, doAction) {
    if(arguments.length > 0) {
        this.exec(client,args,doAction);
    }
    this.timestamp = Date.now();
};

Command.prototype.exec = function(client, doAction, args) {
    if(arguments.length > 0) {
        this.doClient = client;
        this.doArgs = args;
        this.doAction = doAction;
    } else {
        this.doAction.apply(this.doClient, this.doArgs);
    }
    return this;
};

Command.prototype.undo = function(client, undoAction, args) {
    if(arguments.length > 0) {
        this.undoClient = client;
        this.undoArgs = args;
        this.undoAction = undoAction;
    } else {
        this.undoAction.apply(this.undoClient, this.undoArgs);
    }
    return this;
};

module.exports = Command;

