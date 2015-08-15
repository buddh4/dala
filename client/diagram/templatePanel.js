var util = require('../util/util');
var xml = require('../xml/xml');
var Node = require('./node');
var Template = require('./template');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var TemplatePanel = function(id, panelScriptNode, append) {
    this.id = id;
    this.scriptNode = panelScriptNode;
    var $panelXML = $(dom.parseNodeXML(this.scriptNode));

    this.definition = {};
    this.templates = {};

    var that = this;

    $panelXML.find('template').each(function() {
        var tmplId = $(this).attr('id');
        var label = $(this).attr('label');
        var tmpl = new Template(this);
        that.definition[tmplId] = {id:tmplId, label:label}
        that.templates[tmplId] = tmpl;
    });

    /**

    this.svg = xml.serializeToString(dom.find(this.tmplXML, tmplRootEl));

    //TODO: add error handling to enable templates without function and ocnfig elements
    this.functions = dom.text(dom.find(this.tmplXML, 'functions'));
    this.config = dom.parseNodeJSON(dom.find(this.tmplXML, 'config'));

    if(object.isDefined(this.config)) {
        if(object.isDefined(this.config.resize)) {
            this.initResizeConfig();
        }
    }
*/
};



module.exports = TemplatePanel;