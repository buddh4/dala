var mongoose = require('mongoose');
var Promise = require('bluebird');

var connect = function() {
    return new Promise(function(resolve, reject) {
        try {
            mongoose.connect('mongodb://localhost/dala', function(err) {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    connect : connect
};