var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * Our User model.
 *
 * This is how we create, edit, delete, and retrieve user accounts via MongoDB.
 */
module.exports.User = mongoose.model('User', new Schema({
    id:           ObjectId,
    username:     { type: String, required: '{PATH} is required.' },
    email:        { type: String, unique: true, required: '{PATH} is required.' },
    password:     { type: String, required: '{PATH} is required.' },
    firstName:    String,
    lastName:     String
}));
