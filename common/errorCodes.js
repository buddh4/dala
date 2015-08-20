module.exports = {
    UNKNOWN_APP_ERROR : 1,
    UNKNOWN_DB_ERROR : 2,
    FILESYSTEM_ERROR: 3,
    LOGIN_REQUIRED : 100,
    ACCESS_DENIED : 101,
    USER_LOGIN_INCORRECT_PASSWORD : 1000,
    USER_LOGIN_INVALID_EMAIL : 1001,
    DB_DUPLICATE : 11000 //We just adopt the mongoose duplicate errorcode
};