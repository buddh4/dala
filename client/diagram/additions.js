var additions = {};
var event = require('../core/event');

var AdditionFactory = function() {
    this.additions = {};
};

AdditionFactory.prototype.register = function(key, addition) {
    this.additions[key] = addition;
};

AdditionFactory.prototype.initAddition = function(key, host) {
    if (!host.additions) {
        host.additions = {};
    }

    var addition = this.additions[key];

    if(addition && host && _checkConfigRequirement(addition, host, key)) {
        host.additions[key] = new addition(host);
    } else if(!addition){
        event.trigger('warn', 'Tried to initiate an unknown addition '+key+' some functionality may not available.');
    }
};

var nodeAdditions = new AdditionFactory();
var transitionAdditions = new AdditionFactory();

var _checkConfigRequirement = function(addition, host, key) {
    return !addition.requireConfig || (addition.requireConfig && (host.config && host.config[key]));
};

module.exports = {
    registerNodeAddition : function(key, addition) {nodeAdditions.register(key,addition)},
    initNodeAddition : function(key, host) {nodeAdditions.initAddition(key, host)},
    registerTransitionAddition : function(key, addition) {transitionAdditions.register(key,addition)},
    initTransitionAddition : function(key, host) {transitionAdditions.initAddition(key, host)},
    initTransitionAdditions : function(host) {
        $.each(transitionAdditions.additions, function(key, addition) {
            transitionAdditions.initAddition(key, host);
        });
    }
};