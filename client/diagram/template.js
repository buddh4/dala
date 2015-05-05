var util = require('../util/util');
var xml = require('../xml/xml');
var Node = require('./node');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var Template = function(id, tmplRootEl) {
    tmplRootEl = tmplRootEl || 'g';
    this.id = id;
    this.tmplNode = dom.cache('#'+id);
    this.tmplXML = dom.parseNodeXML(this.tmplNode);
    this.svg = xml.serializeToString(dom.find(this.tmplXML, tmplRootEl));

    //TODO: add error handling to enable templates without function and ocnfig elements
    this.functions = dom.text(dom.find(this.tmplXML, 'functions'));
    this.config = dom.parseNodeJSON(dom.find(this.tmplXML, 'config'));

    if(object.isDefined(this.config)) {
        if(object.isDefined(this.config.resize)) {
            this.initResizeConfig();
        }
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
    return config.replaceConfigValues(this.functions, cfg);
};

Template.prototype.getConfig = function(cfg) {
    return object.extend({}, this.config, cfg);
};

module.exports = Template;