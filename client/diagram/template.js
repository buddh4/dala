var util = require('../util/util');
var xml = require('../util/xml');
var Node = require('./node');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var Template = function(id, cfg) {
    this.config = cfg || {};
    this.id = id;

    //Templates can define the svgString within the config, so the svg doesn't have to be loaded in addition
    if(this.config.svg) {
        this.init(this.config.svg);
    }

    //TODO: implement a more generic way...
    if(object.isDefined(this.config.resize)) {
        this.initResizeConfig();
    }
};

Template.prototype.init = function(tmplStr) {
    this.svg = tmplStr;
};

Template.prototype.isInitialized = function() {
    return !!this.svg;
};


/**
 * The resize addition allows to configure a resize behaviour for svg elements
 * by means of defining the logic for changes of x (width) and y (height)
 * in the following form:
 * e.g.:
 *
 * parent(5) default
 *
 * where the x value is
 * @param {type} resizeConfig
 * @returns {undefined}
 */
Template.prototype.initResizeConfig = function() {
    var that = this;
    object.each(this.config.resize, function(index, resizeItem) {
        // Here we just parse the raw string to an array of feature settings
        that.setupSettings(index, resizeItem, 'value');
        that.setupSettings(index, resizeItem, 'position');
        that.setupSettings(index, resizeItem, 'max');
        that.setupSettings(index, resizeItem, 'min');
    });
};

Template.prototype.setupSettings = function(index, item, setting) {
    if(object.isDefined(item[setting])) {
        var values = util.app.parseFeatureStrings(item[setting], 0);

        //If ther is just one value given we use it for both x and y
        if(values.length === 1) {
            values[1] = values[0];
        }

        this.config.resize[index][setting] = values;
    }
};

Template.prototype.createNode = function(config, diagram) {
    var resultConfig = this.getConfig(config);
    return new Node(this, resultConfig, diagram);
};

Template.prototype.getSVGString = function(cfg) {
    return config.replaceConfigValues(this.svg, cfg);
};

Template.prototype.getConfig = function(cfg) {
    return object.extend({}, this.config, cfg);
};

module.exports = Template;