var additions = {};
var event = require('../core/event');

var registerAddition = function(key, addition) {
    additions[key] = addition;
};

var initAddition = function(key, host) {
    if (!host.additions) {
        host.additions = {};
    }

    var addition = additions[key];

    if(addition && host && _checkConfigRequirement(addition, host, key)) {
        host.additions[key] = new addition(host);
    } else if(!addition){
        event.trigger('warn', 'Tried to initiate an unknown addition '+key+' some functionality may not available.');
    }
};

var _checkConfigRequirement = function(addition, host, key) {
    return !addition.requireConfig || (addition.requireConfig && (host.config && host.config[key]));
};

module.exports = {
    registerAddition : registerAddition,
    initAddition : initAddition
};