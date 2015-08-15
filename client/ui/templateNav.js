var event = require('../core/event');
var templateManager = require('../diagram/templateManager');

var CONTAINER_SELECTOR = '#templateNav';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var TPML_SELECT_PREFIX = 'tmpl_select_';
var CLASS_ACTIVE = 'tmpl_select_active';
var EVT_TMPL_SELECT = 'template_select';

var initListener = function() {
    event.listen('node_selected', nodeSelectListener);
    event.listen('template_panel_loaded', templateLoadedListener);

    $CONTAINER_NODE.on('click', '.tmpl_select' , function(evt) {
        var id = $(this).attr('id');
        var tmplId = id.substring(TPML_SELECT_PREFIX.length, id.length);
        event.trigger(EVT_TMPL_SELECT, tmplId);
        setActiveTemplate(tmplId);
    });
}

var templateLoadedListener = function(evt) {
    var panel = evt.data;
    if(getPanelHeadNode(panel.id).length) {
        appendTemplateContent(panel);
    } else {
        //todo: create panel
    }
};

var getPanelHeadNode = function(panelId) {
    return $('#tmpl_panel_head_'+panelId);
};

var getPanelContentNode = function(panelId) {
    return $('#tmpl_panel_content_'+panelId);
};

var appendTemplateContent = function(panel) {
    var $contentNode = getPanelContentNode(panel.id);
    var index = 0;
    var content = '<table>';
    $.each(panel.definition, function() {

        if(index % 3 === 0) {
            content += (index !== 0) ? '</tr><tr>' : '<tr>';
        }

        content +=  '<td id="tmpl_select_'+this.id+'" class="tmpl_select">'+
                    '<img src="images/icons/'+this.id+'.png" />'+
                    '<br />'+
                    '<span class="tmplName">'+this.label+'</span>';

        index++;
    });

    content += (index % 3 !== 0) ? '</tr></table>' : '</table>';

    $contentNode.fadeOut(300, function() {
        $contentNode.empty();
        $contentNode.append(content);
        $contentNode.fadeIn(300, function() {
            $CONTAINER_NODE.accordion("refresh");
            $('.tmpl_select').draggable({helper: "clone", appendTo: "body" ,zIndex: 1004});
        });
    });
}

var nodeSelectListener = function(evt) {
    setActiveTemplate(evt.data.template.id);
};

var setActiveTemplate = function(tmplId) {
    $('.'+CLASS_ACTIVE).removeClass(CLASS_ACTIVE);
    $('#tmpl_select_'+tmplId).addClass(CLASS_ACTIVE);
};



module.exports.init = function() {
    $CONTAINER_NODE.accordion({
        collapsible: true,
        active: false,
        activate: function(event, ui) {
            $CONTAINER_NODE.accordion("refresh");
        },
        beforeActivate: function(event, ui) {
            var id = ui.newHeader.attr('id');
            if(id) {
                var panelId = id.split('tmpl_panel_head_')[1];
                if(!templateManager.getPanel(panelId)) {
                    getPanelContentNode(panelId).empty().append('<div style="width: 50%;margin: 0 auto;text-align:center;"><img src="images/icons/loading.gif" /><br /><p>Loading...</p></div>');
                    templateManager.loadPanel(panelId);
                } else {
                    $CONTAINER_NODE.accordion("refresh");
                }
            } else {
                $CONTAINER_NODE.accordion("refresh");
            }
        }
    });

    if(dala_env.initial_templates && dala_env.initial_templates.panels) {
        $.each(dala_env.initial_templates.panels, function(index, panel) {
            var newDiv = '<h3 id="tmpl_panel_head_'+panel.id+'">'+panel.label+'</h3><div style="overflow:hidden;" id="tmpl_panel_content_'+panel.id+'"></div>';
            $CONTAINER_NODE.append(newDiv)
        });

        $CONTAINER_NODE.accordion("refresh");
    }

    initListener();
};
