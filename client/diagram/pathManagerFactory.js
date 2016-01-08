var config = require('../core/config');
var CurvePathManager = require('./curvedPathManager');
var StraightPathManager = require('./straightPathManager');
var RoundPathManager = require('./roundPathManager');
var pathManager = {};

var register =   function(constructor) {
    pathManager[constructor.type] = constructor;
};

register(CurvePathManager);
register(StraightPathManager);
register(RoundPathManager);

module.exports =  {
    register : register,
    get : function(transition, id) {
        id = id || config.val('transition_type', StraightPathManager.type);
        if(pathManager[id]) {
            return new pathManager[id](transition);
        }
    }
};