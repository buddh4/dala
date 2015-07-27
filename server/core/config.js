var fs = require('fs');
var path = require('path');
var object = require('../util/ObjectUtil.js');

var instance = null;

var Config = function() {
    //TODO: check with process.argv for cfg location
    var cfgPath = path.join(__dirname, '../../cfg',  'dala.cfg');

    try {
        this.values = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        console.log('Config loaded from '+cfgPath);
    } catch(error) {
        console.log('Could not load config file '+cfgPath+' Error:'+error.message);
    }
};

Config.prototype.val = function(key, defaultVal) {
    if(object.isDefined(key)) {
        var result = this.values[key];
        return (object.isDefined(result)) ? result : defaultVal;
    }
};

Config.prototype.setVal = function(key, value) {
    if(object.isDefined(key) && object.isDefined(value)) {
        this.values[key] = value;
    }
};

var getInstance = function() {
    if(instance === null) {

        instance = new Config();
    }
    return instance;
};

module.exports = getInstance();