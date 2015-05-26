var object = require('../util/object');

var CommandAction = function(client, action) {
    this.client = client;
    this.action = action;
};

CommandAction.prototype.exec = function(args) {
    this.action.apply(this.client, args);
};

var Command = function(client, doAction, undoAction) {
    if(arguments.length > 0) {
        //Call the exec setter
        this.exec(client,doAction);
        this.undo(client,undoAction);
    }
    this.timestamp = Date.now();
};

Command.prototype.exec = function(client, action, args) {
    return this.action('do', client, action, args);
};

Command.prototype.undo = function(client, action, args) {
    return this.action('undo', client, action, args);
};

Command.prototype.instance = function(doArgs, undoArgs) {
    var instance = $.extend(true, {}, this);

    //If given, we overwrite the argument settings for the actions
    if(doArgs) {
        instance.doArgs = doArgs;
    }

    if(undoArgs) {
        instance.undoArgs = undoArgs;
    }
    return instance;
};

/**
 * Just a helper to unify the logic for doAction and undoAction.
 *
 * - if just the type is given we assume all necessary action data is given for this type (do/undo) and call the action
 * - if a there is another argument beside the type we assume an args array and call the action with the given array
 * - if there are more args given, we assume a setter call to set the action data (do/undo)
 *
 * @param type do or undo
 * @param client client object used as this
 * @param action the function to call
 * @param args arguments
 * @returns {Command}
 */
Command.prototype.action = function(type, client, action, args) {
    if(args) {
        this[type + 'Args'] = args;
    }

    if(client && action) {
        this[type + 'Action'] = new CommandAction(client, action);
    } else {
        //Execute either with args settings from this or from argument list
        this[type + 'Args'] = arguments[1] || this[type + 'Args'];
        var action = this[type + 'Action'];
        if(action) {
            action.exec(this[type + 'Args']);
        }
    }

    return this;
};

module.exports = Command;

