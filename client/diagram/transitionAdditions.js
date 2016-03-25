var additions = require('./additions');

//Init default additions
additions.registerTransitionAddition('text', require('./transitionTextAddition'));
additions.registerTransitionAddition('edit', require('./editTransitionAddition'));

module.exports = {
    init : function(transition) {
        additions.initTransitionAdditions(transition);
    }
};