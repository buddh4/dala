var object = require('../util/object');
var Template = require('./template');
var event = require('../core/event');
var client = require('../core/client');

var Promise = require('bluebird');

var PATH_PANELS = '/template/panel';
var PATH_TEMPLATES = '/templates';

var EVENT_PANEL_LOADED = 'template_panel_loaded';

var panels = {};
var templates = {};
var selectedTemplate;

/**
 * Initializes listeners and loads the initial template panels set in dala_env.initial_templates array.
 */
var init = function() {
    event.listen('node_selected', nodeSelectionListener);
    event.listen('template_select', templateSelectListener);

    if(dala_env.initial_templates && dala_env.initial_templates.panels) {
        $.each(dala_env.initial_templates.panels, function(index, panelId) {
            _loadPanel(panelId);
        });
    }
};

var nodeSelectionListener = function(evt) {
    _setSelectedTemplate(evt.data.template);
};

var templateSelectListener = function(evt) {
    if(evt.data) {
        _setSelectedTemplate(evt.data);
    }
};

var _setSelectedTemplate = function(tmplId) {
    if(!object.isDefined(tmplId)) {
        return;
    };

    var instance;

    if(!object.isString(tmplId)) {
        if(!tmplId.config.preventSelection) {
            selectedTemplate = tmplId;
        }
    } else {
        getTemplate(tmplId)
            .then(function(template) {
                if(template && !template.config.preventSelection) {
                    selectedTemplate = template;
                } else {
                    console.warn('Coult not determine template: '+tmplId);
                }
            }, function(err) {
                console.warn('Error while determining template: '+tmplId+' - '+err);
            });
    }
};

/**
 * Returns a templateinstance, the template will be loaded and initialized if not loaded yet.
 *
 * @param tmplId
 * @param tmplRootEl
 * @returns {bluebird|exports|module.exports}
 */
var getTemplate = function(tmplId) {
    var panelId = tmplId.substring(0, tmplId.indexOf('_'));
    return new Promise(function(resolve, reject) {
        if(templates[tmplId]) { //Template is loaded
            var tmpl = templates[tmplId];
            if(!tmpl.isInitialized()) { //Template is not initialized yet so load svg
                _loadRemoteTemplateSVG(tmplId, panelId).
                    then(function() {
                        resolve(tmpl);
                    }, function(err) {
                        reject(err);
                    });
            } else {
                resolve(templates[tmplId]);
            }
        } else { //Template not loaded yet
            if(panelId) { //Load and initialize template
                //TODO: here we have to consider other loading mechanism as dom loading / browser cache first
                _loadRemoteTemplate(panelId, tmplId)
                    .then(function(tmpl) {
                        resolve(tmpl);
                    }, function(err) {
                        reject(err);
                    });
            } else {
                resolve(_createTemplate(tmplId));
            }
        }
    });
};

/**
 * This simply returns a template if its already loaded. This should only be used for templates which are registered
 * on startup and already loaded.
 *
 * @param tmplId
 * @returns {*}
 */
var getTemplateSync = function(tmplId) {
    return templates[tmplId];
};

/**
 * Loads a panel definition from the server. When loaded the panel will register itself to the templateManager.
 * The function returns a Promise.
 *
 * @param panelId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadPanel = function(panelId) {
    return new Promise(function(resolve, reject) {
        client.getScript(PATH_TEMPLATES+'/'+panelId+'/'+panelId+'.js', {
            success : function() {
                resolve();
            },
            error : function() {
                reject();
            },
            errorMessage : {
                404: 'Could not load panel '+panelId+' file was not found on the server !',
                'default': 'Could not load panel '+panelId+' something went wrong !'
            }
        });
    });
};

/**
 * Loads a remote tamplate from the server. When loaded the template will register itself to the templateManager
 * This function returns a Promise without result.
 *
 * @param panelId
 * @param tmplId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadRemoteTemplate = function(panelId, tmplId) {
    return new Promise(function(resolve, reject) {
        var that = this;
        client.getScript(PATH_TEMPLATES+'/'+panelId+'/'+tmplId+'.js', {
            success : function(response) {
                //Now that we have loaded and initialized the template script we can get the template
                getTemplate(tmplId).then(resolve, reject);
            },
            error: function(errorMsg) {
                reject(errorMsg);
            },
            errorMessage : {
                404: 'Could not load template "'+tmplId+'" file was not found on the server !',
                'default': 'Could not load template "'+tmplId+'" something went wrong !'
            }
        });
    });
};

/**
 * Registers a template by creating a new Template instance out of the given arguments.
 * @param templateId
 * @param panelId
 * @param config
 */
var registerTemplate = function(templateId, config) {
    _addTemplate(new Template(templateId, config));
};

/**
 * Loads the template svg as xml document for the given tmplId.
 * @param tmplId
 * @param panelId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadRemoteTemplateSVG = function(tmplId, panelId) {
    return new Promise(function(resolve, reject) {
        client.text('/templates/'+panelId+'/'+tmplId+'.tmpl', {
            success : function(response) {
                _initTemplate(tmplId, response.data);
                resolve(response.data);
            },
            error : function(err) {
                reject(err);
            },
            errorMessage :  {
                404: 'Could not load template "'+tmplId+'" file was not found on the server !',
                'default': 'Could not load template "'+tmplId+'" something went wrong !'
            }
        });
    });

};

var _initTemplate = function(tmplId, tmplStr) {
    templates[tmplId].init(tmplStr);
};

/**
 * Registers a new panel.
 * @param cfg
 */
var registerPanel = function(cfg) {
  if(cfg.id) {
      panels[cfg.id] = cfg;
      event.trigger(EVENT_PANEL_LOADED, cfg);
  }
};

var _createTemplate = function(tmplId, tmplRootEl) {
    return _addTemplate(new Template(tmplId, true, tmplRootEl));
};

var _addTemplate = function(tmpl) {
    templates[tmpl.id] = tmpl;
    return tmpl;
};

var getSelectedTemplate = function() {
    return selectedTemplate;
};

var getPanel = function(panelId) {
    return panels[panelId];
};

module.exports = {
    registerPanel : registerPanel,
    registerTemplate : registerTemplate,
    getPanel: getPanel,
    getTemplate: getTemplate,
    getTemplateSync : getTemplateSync,
    getSelectedTemplate: getSelectedTemplate,
    init : function() {
        init();
        return this;
    }
};
