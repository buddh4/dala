var event = require('../core/event');
var templateManager = require('../diagram/templateManager');
var object = require('../util/object');

var CONTAINER_SELECTOR = '#templateNav';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);

var ID_PREFIX_TMPL_SELECT= 'tmpl_select_';
var ID_PREFIX_PANEL_CONTENT = 'tmpl_panel_content_';
var ID_PREFIX_PANEL_HEAD = 'tmpl_panel_head_';

var CLASS_ACTIVE = 'tmpl_select_active';
var EVT_TMPL_SELECT = 'template_select';

var initListener = function() {
    event.listen('node_selected', nodeSelectListener);
    event.listen('template_panel_loaded', panelAddedListener);

    $CONTAINER_NODE.on('mousedown', '.tmpl_select' , function(evt) {
        var tmplId = $(this).data('tmplid');
        event.trigger(EVT_TMPL_SELECT, tmplId);
        setActiveTemplate(tmplId);
    });
};

var panelAddedListener = function(evt) {
    if(!!!evt.data.hidden) {
        createPanel(evt.data);
        sortPanel();
    }
};

var sortPanel = function() {
    $CONTAINER_NODE.find('.tmpl_nav_head').sort(function (a, b) {
        return (a.id < b.id) ? -1 : 1;
    }).appendTo( $CONTAINER_NODE );

    $CONTAINER_NODE.find('.tmpl_nav_body').each(function() {
        var $node = $(this);
        var nodeId = $node.attr('id');
        var panelId = nodeId.substring(ID_PREFIX_PANEL_CONTENT.length, nodeId.length);
        getPanelHeadNode(panelId).after($node);
    });
    refresh();
};

var createPanel = function(panel) {
    var $panelBody = $(_createPanelBodyHTML(panel));
    $panelBody.find('.tmpl_select').draggable({helper: "clone", appendTo: "body" ,zIndex: 1004});
    $CONTAINER_NODE.append(_createPanelHeadHTML(panel)).append($panelBody);
};

var _createPanelHeadHTML = function(panel) {
   return '<h3 id="'+ID_PREFIX_PANEL_HEAD+panel.id+'" class="tmpl_nav_head">'+panel.label+'</h3>';;
};

var _createPanelBodyHTML = function(panel) {
    var content = '<div id="'+ID_PREFIX_PANEL_CONTENT+panel.id+'" style="overflow:hidden;" class="tmpl_nav_body">';

    if(!panel.templates) {
        return content += '</div>'; //Just return an empty content div in case there are no templates defined.
    }

    var templateArr = object.sort(panel.templates, function(a,b) {
        return (a.label < b.label) ? -1 : 1;
    });

    content += '<table>';
    $.each(templateArr, function(index, tmplDefinition) {
        //TODO: there is no colspan for the last rowyet...
        if(index % 3 === 0) {
            content += (index !== 0) ? '</tr><tr>' : '<tr>';
        }

        var iconUrl = (tmplDefinition.icon) ? tmplDefinition.icon : '/templates/'+panel.id+'/icons/'+tmplDefinition.id+".png";

        content +=  '<td id="'+ID_PREFIX_TMPL_SELECT+this.id+'" data-tmplid="'+this.id+'" class="tmpl_select">'+
            '<img src="'+iconUrl+'" />'+
            '<br />'+
            '<span class="tmplName">'+tmplDefinition.label+'</span>';

        index++;
    });

    return content += ((templateArr.length-1) % 3 !== 0) ? '</tr></table></div>' : '</table></div>';
};

var getPanelHeadNode = function(panelId) {
    return $('#tmpl_panel_head_'+panelId);
};

var getPanelContentNode = function(panelId) {
    return $('#tmpl_panel_content_'+panelId);
};

var refresh = function() {
    $CONTAINER_NODE.accordion("refresh");
};

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
    });

    initListener();
};
