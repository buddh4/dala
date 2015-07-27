module.exports.confirm = function(result) {
    var ret = { status : 0 };
    if(result) {
        ret.result = result;
    }
    return ret;
};

module.exports.error = function(error, errorCode) {
    return { status : 1, error : error, errorCode: errorCode};
};

