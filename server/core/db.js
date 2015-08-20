var mongoose = require('mongoose');
var Promise = require('bluebird');

var connect = function() {
    return new Promise(function(resolve, reject) {
        try {
            mongoose.connect('mongodb://localhost/dala');
            resolve();
        } catch (err) {
            reject();
        }
    });
};

module.exports = {
    connect : connect
};