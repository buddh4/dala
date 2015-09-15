var util = require('../util/util');
var xml = require('../util/xml');
var Node = require('./node');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var Template = function(id, cfg) {
    this.config = cfg || {};

    if(this.config.fromDom) { //Load tmpl from dom script node
        this.id = id;
        this.tmplXML = dom.parseNodeXML($.qCache('#'+id));
    } else if(object.isString(id)) { //Remote tmpl is initialized later (after loading xml)
        this.id = id;
        this.tmplXML = (this.config.svg) ? xml.parseXML(this.config.svg) : undefined;
    } else { //id is templateXML
        this.tmplXML = id;
        this.id = $(this.tmplXML).attr('id');
    }

    //Remote templates are initialized later;
    if(this.tmplXML) {
        this.init();
    }

    if(object.isDefined(this.config)) {
        if(object.isDefined(this.config.resize)) {
            this.initResizeConfig();
        }
    }
};

Template.prototype.init = function(tmplXML) {
    this.config.rootName = this.config.rootName || 'g';

    if(tmplXML) {
        this.tmplXML = tmplXML;
    }

    this.svg = xml.serializeToString($(this.tmplXML).find(this.config.rootName)[0]);
    //TODO: remove this future version does not allow xml config/handler...
}

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

Template.prototype.resizable = function() {
    return object.isDefined(this.config.resize);
};

Template.prototype.createNode = function(config, diagram) {
    var resultConfig = this.getConfig(config);
    return new Node(this, resultConfig, diagram);
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