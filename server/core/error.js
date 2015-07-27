var DBError = function(appErrMsg, dbError) {
    this.dbError = dbError;
    this.isDBError = true;
    this.isAPPError = false;
    this.message = message;
    this.name = "DBError";
};

DBError.prototype.isDuplicateError = function() {
    return this.dbError.code === 11000;
}

var APPError = function(msg, code) {
    this.message = msg;
    this.name = "APPError";
    this.code = code || 1;
    this.isDBError = false;
    this.isAPPError = true;
}

module.exports = {
    DBError : DBError,
    APPError : APPError
}