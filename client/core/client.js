var event = require('./event');
var object = require('../util/object');
var string = require('../util/string');

var Response = function(data) {
    this.data = data;
};

Response.prototype.isConfirmation = function() {
    return this.data && (this.data.status === 0);
};

Response.prototype.isError = function() {
    return this.data && this.data.status && (this.data.status > 0);
};

Response.prototype.getError = function() {
    return this.data.error;
};

Response.prototype.getErrorCode = function() {
    return this.data.errorCode;
};

Response.prototype.toString = function() {
    return "{ status: "+this.data.status+" error: "+this.data.error+" data: "+this.data.data+" }";
};

var config = {
    host : 'localhost',
    port : 3000
};

module.exports = {
    test: function(settings) {
        this.ping(settings);
    },
    ping: function(settings) {
        settings = settings || config;
        var result = false;
        $.ajax({
            url: "http://"+settings.host+":"+settings.port+"/service/ping",
            crossDomain: true,
            type : "GET",
            data: {'ping':true},
            async : false,
            dataType: "json",
            success: function (response) {
                result = true;
            },
            error: function (xhr, status, msg) {
                result = false;
            }
        });

        return result;
    },
    ajax: function(path, data, cfg) {
        var cfg = cfg || {};
        var async = cfg.async || true;
        var dataType = cfg.dataType || "json";

        var error = function(xhr,type,errorThrown, errorCode) {
            console.warn("ajaxError: "+type+" "+errorThrown+" - "+errorCode);

            if(cfg.errorMessage) {
                if(object.isString(cfg.errorMessage)) {
                    event.trigger('error', cfg.errorMessage);
                } else if(object.isObject(cfg.errorMessage, errorCode)) {
                    var msg = cfg.errorMessage[errorCode] || cfg.errorMessage['default'];
                    if(object.isDefined(msg)) {
                        event.trigger('error', msg);
                    }
                }
            }

            if(cfg.error) {
                // "timeout", "error", "abort", "parsererror" or "application"
                cfg.error(errorThrown, errorCode, type);
            }

            if(!cfg.error && !cfg.errorMessage) {
                console.warn('Unhandled ajax error: '+path+" type"+type+" error: "+errorThrown);
            }
        };

        var success = function(response) {
            var responseWrapper = new Response(response);

            if(responseWrapper.isError()) {
                return error(undefined,"application",responseWrapper.getError(), responseWrapper.getErrorCode());
            } else if(cfg.success) {
                cfg.success(responseWrapper);
            }

            if(!cfg.success && !cfg.successMessage) {
                console.info('Unhandled ajax success: '+responseWrapper);
            }

            if (cfg.successMessage) {
                event.trigger('info', cfg.successMessage);
            }
        };

        var that = this;
        $.ajax({
            url: that.getUrl(path),
            crossDomain: true, //TODO: read from config
            type : cfg.type,
            processData : cfg.processData,
            contentType: cfg.contentType,
            data: data,
            async : async,
            dataType: dataType,
            success: success,
            error: error
        });
    },
    post: function(path, data, cfg) {
        var cfg = cfg || {};
        cfg.type = 'POST';
        this.ajax(path, data, cfg);
    },
    get: function(path, cfg) {
        var cfg = cfg || {};
        cfg.type = 'GET';
        this.ajax(path, cfg.data, cfg);
    },
    restGet: function(path, id, cfg) {
        var path = string.endsWith(path, '/')? path+id : path+'/'+id;
        this.get(path, cfg);
    },
    getUrl: function(addition) {
        var url = "http://"+config.host+":"+config.port;
        if(addition) {
            url += addition;
        }
        return url;
    },
    set: function(settings) {
        config = settings;
    },
    getSettings: function() {
        return config;
    }
}