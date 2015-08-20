var mongoose = require('mongoose');
var objectUtil = require('../util/object');

var getObjectId = function(obj) {
    var result;

    if(result = _objectIdTest(obj)) {
        return result;
    } else if(result = _objectIdTest(obj._id)) {
        return result;
    } else if(result = _objectIdTest(obj.id)) {
        return result;
    }
};

var _objectIdTest = function(obj) {
    var result;

    if(!obj) {
        return;
    }

    if(obj instanceof mongoose.Types.ObjectId) {
        result = obj;
    }else if(objectUtil.isString(obj)) {
        result = mongoose.Types.ObjectId(userId);
    }

    return result;
}

module.exports = {
    getObjectId : getObjectId
}