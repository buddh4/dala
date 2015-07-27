var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * Our User model.
 *
 * This is how we create, edit, delete, and retrieve user accounts via MongoDB.
 */
module.exports.Project = mongoose.model('Project', new Schema({
    id:             ObjectId,
    title:          { type: String, required: '{PATH} is required.' },
    description:    { type: String},
    created:        { type: Date, default: Date.now},
    user:          [{user_id : ObjectId, roles:[String]}]
}));
