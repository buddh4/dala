module.exports.confirm = function(result) {
    var ret = { status : 0 };
    if(result) {
        ret.result = result;
    }
    return ret;
};

module.exports.error = function(error, code) {
    var message = (error instanceof Error) ? error.message : error;
    var errorCode = code || error.code;

    return { status : 1, error : message, errorCode: errorCode};
};

