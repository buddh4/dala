var additions = require('./additions');

//Init default additions
additions.registerAddition('resize', require('./resizeAddition'));
additions.registerAddition('edit', require('./editAddition'));
additions.registerAddition('transition', require('./transitionAddition'));

module.exports = {
    init : function(node) {
        additions.initAddition('transition', node);
        additions.initAddition('edit', node);
        additions.initAddition('resize', node);
    }
}