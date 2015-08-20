var util = require('../util/util');
var xml = require('../util/xml');
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
};



module.exports = TemplatePanel;