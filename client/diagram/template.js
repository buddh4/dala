var util = require('../util/util');
var xml = require('../util/xml');
var Node = require('./node');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var Template = function(id, fromDom, tmplRootEl) {
    tmplRootEl = tmplRootEl || 'g';

    if(fromDom) {
        this.id = id;
        this.tmplXML = dom.parseNodeXML($.qCache('#'+id));
    } else {
        this.tmplXML = id;
        this.id = $(this.tmplXML).attr('id');
    }

    this.svg = xml.serializeToString($(this.tmplXML).find(tmplRootEl)[0]);
    this.parseFunctions();
    this.parseConfig();

    if(object.isDefined(this.config)) {
        if(object.isDefined(this.config.resize)) {
            this.initResizeConfig();
        }
    }
};

Template.prototype.parseFunctions = function() {
    try {
        this.functions = $(this.tmplXML).find('functions').text() || {};
    } catch(err) {
        this.functions = {}//There is probably no function element.
    }
};

Template.prototype.parseConfig = function() {
    try {
        this.config = dom.parseNodeJSON($(this.tmplXML).find('config')) || {};
    } catch(err) {
        //There is probably no configuration element.
        this.config = {};
    }
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

Template.prototype.resizable = function() {
    return object.isDefined(this.config.resize);
};

Template.prototype.getInstance = function(config, diagram) {
    var resultConfig = this.getConfig(config);
    var newNode = new Node(this, resultConfig, diagram);
    return newNode;
};

Template.prototype.getSVGString = function(cfg) {
    return config.replaceConfigValues(this.svg, cfg);
};

Template.prototype.getSVGXML = function(cfg) {
    return dom.parseXML(getSVGString(cfg));
};

Template.prototype.getFunctions = function(cfg) {
    if(this.function) {
        return config.replaceConfigValues(this.functions, cfg);
    }
};

Template.prototype.getConfig = function(cfg) {
    return object.extend({}, this.config, cfg);
};

module.exports = Template;