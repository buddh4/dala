var additions = require('./additions');

//Init default additions
additions.registerTransitionAddition('text', require('./transitionTextAddition'));
additions.registerTransitionAddition('edit', require('./editTransitionAddition'));

module.exports = {
    init : function(transition) {
        additions.initTransitionAddition('text', transition);
        additions.initTransitionAddition('edit', transition);
    }
};