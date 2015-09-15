var additions = require('./additions');

//Init default additions
additions.registerAddition('t_text', require('./transitionTextAddition'));

module.exports = {
    init : function(transition) {
        additions.initAddition('t_text', transition);
    }
}