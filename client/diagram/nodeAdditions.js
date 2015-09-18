var additions = require('./additions');

//Init default additions
additions.registerNodeAddition('resize', require('./resizeAddition'));
additions.registerNodeAddition('edit', require('./editNodeAddition'));
additions.registerNodeAddition('transition', require('./transitionAddition'));

module.exports = {
    init : function(node) {
        additions.initNodeAddition('transition', node);
        additions.initNodeAddition('edit', node);
        additions.initNodeAddition('resize', node);
    }
}