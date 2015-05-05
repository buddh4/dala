var object = require('../util/object');
var Template = require('./template');
var event = require('../core/event');

var templates = {};
var selectedTemplate;

var initListener = function() {
    event.listen('node_selected', nodeSelectionListener);
    event.listen('template_select', templateSelectListener);
}

var templateSelectListener = function(evt) {
    if(evt.data) {
        setSelectedTemplate(evt.data);
    }
};

var addTemplate = function(tmpl) {
    templates[tmpl.id] = tmpl;
    return tmpl;
};

var createTemplate = function(tmplId, tmplRootEl) {
    return addTemplate(new Template(tmplId, tmplRootEl));
};

var getTemplate = function(id) {
    var tmpl = templates[id];
    if(!object.isDefined(tmpl)) {
        tmpl = createTemplate(id);
    }
    return tmpl;
};

var getSelectedTemplate = function() {
    return selectedTemplate;
};

var nodeSelectionListener = function(evt) {
    setSelectedTemplate(evt.data.template);
};

var setSelectedTemplate = function(tmpl) {
    if(!object.isDefined(tmpl)) {
        return;
    }

    var tmplInst = (object.isString(tmpl))? getTemplate(tmpl) : tmpl;

    if(object.isDefined(tmplInst)) {
        selectedTemplate = tmplInst;
    }
};

initListener();

module.exports = {
    addTemplate: addTemplate,
    createTemplate: createTemplate,
    getTemplate: getTemplate,
    getSelectedTemplate: getSelectedTemplate,
    nodeSelectionListener: nodeSelectionListener,
    setSelectedTemplate: setSelectedTemplate
};
