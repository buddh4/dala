var ERROR_CODES = require('./errorCodes');

var DalaError = function(message, code, triggerError) {
    this.name = 'DalaError';
    this.dalaError = true;
    this.error = triggerError
    Error.call(this, message);
    this.message = message;
    this.code = code || ERROR_CODES.UNKNOWN_APP_ERROR;
};

DalaError.CODES = ERROR_CODES;
DalaError.prototype = Object.create(Error.prototype);
DalaError.prototype.constructor = DalaError;

DalaError.prototype.log = function() {

};

module.exports = DalaError;