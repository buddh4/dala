var object = require('../util/object');
var Template = require('./template');
var TemplatePanel = require('./templatePanel');
var event = require('../core/event');
var client = require('../core/client');

var PATH_PANELS = '/template/panel';

var panels = {};
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

var loadPanel = function(panelId) {
    client.restGet(PATH_PANELS, panelId, {
        dataType : 'html',
        success : function(response) {
            var scriptNode = $(response.data)[0];
            panels[panelId] = new TemplatePanel(panelId, scriptNode);
            event.trigger('template_panel_loaded', panels[panelId]);
        },
        error : function(status, error) {
            //showPanelError(panelId);
        },
        errorMessage : 'Could not load templates !',
        successMessage : 'Templates loaded.'
    });
}

var addTemplate = function(tmpl) {
    templates[tmpl.id] = tmpl;
    return tmpl;
};

var createTemplate = function(tmplId, tmplRootEl) {
    return addTemplate(new Template(tmplId, true, tmplRootEl));
};

var getTemplate = function(tmplId, tmplRootEl) {
    var panelId = tmplId.substring(0, tmplId.indexOf('_'));
    var panel = getPanel(panelId);
    if(panel) {
        return panel.templates[tmplId];
    } else {
        return createTemplate(tmplId, tmplRootEl);
    }
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

var getPanel = function(panelId) {
    return panels[panelId];
}

initListener();

module.exports = {
    addTemplate: addTemplate,
    createTemplate: createTemplate,
    getPanel: getPanel,
    getTemplate: getTemplate,
    getSelectedTemplate: getSelectedTemplate,
    nodeSelectionListener: nodeSelectionListener,
    setSelectedTemplate: setSelectedTemplate,
    loadPanel:loadPanel
};
