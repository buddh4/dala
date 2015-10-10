var event = require('../core/event');
var stringUtil = require('../util/string');
var objectUtil = require('../util/object');
var diagramManager = require('../diagram/diagramManager');
var userManager = require('../user/userManager');

var CONTAINER_SELECTOR = '#diagramStage'
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var TAB_CONTAINER_PREFIX = 'file_';
var TAB_STAGE_PREFIX = 'stage_';

var tabs;

var tabTemplate = '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close" style="float:right;" role="presentation">Remove Tab</span></li>';

var initListener = function() {
    event.listen('tab_new', newFileListener);
    event.listen('diagram_updated', diagramUpdatedListener);
    event.listen('diagram_initialized', showTabListener);
};

var newFileListener = function(evt) {
    var settings = (evt.data) ? evt.data : {
        projectId : 'default',
        title : 'new'
    }
    addTab(settings);
};

var diagramUpdatedListener = function(evt) {
    var diagramId = evt.data;
    var $tabLink = getTabLinkForDiagramId(diagramId);
    var text = $tabLink.text();
    if(!stringUtil.endsWith(text, '*')) {
        $tabLink.text(text+'*');
    }
};

var addTab = function(settings) {
    var projectId = (objectUtil.isString(settings)) ? settings : settings.projectId;
    var title = (objectUtil.isString(settings)) ? 'new' : settings.title;

    // We use the timestamp to identify the tab/stage/diagram
    var diagramId = diagramManager.createDiagramId();
    var id = TAB_CONTAINER_PREFIX+diagramId;
    var stageId = TAB_STAGE_PREFIX+diagramId;
    var label = title+'.dala';
    var li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );

    $CONTAINER_NODE.find( ".ui-tabs-nav" ).append( li );
    $CONTAINER_NODE.append( '<div id=' + id + ' class="stageFile"><div id='+stageId+' class="svgStage"></div></div>' );
    $CONTAINER_NODE.tabs( "refresh" );

    $('#stageTabs').removeClass('ui-corner-all').addClass('ui-corner-top');

    event.trigger('diagram_new', {diagramId: diagramId, stageId: stageId, projectId: projectId, title: title, label: label });
}

var showTabListener = function(evt) {
    var diagramId = evt.data.diagramId;
    getTabLinkForDiagramId(diagramId).click();
    event.trigger('tab_activated', diagramId);
};

var getTabLinkForDiagramId = function(diagramId) {
    // We search the tab link which has a href="#file_" attribute and trigger an click event to open it
    var tabContentSelector = '#'+TAB_CONTAINER_PREFIX+diagramId;
    return $('a[href="'+tabContentSelector+'"]');
}

module.exports.init = function() {
    var tabs = $CONTAINER_NODE.tabs({
        activate: function( evt, ui ) {
            var a = ui.newTab.children('a');
            var href = a.attr('href');
            var diagramId = href.split('_')[1];
            event.trigger('tab_activated', diagramId);
        }
    });

    //TODO: no direct closing, either show save dialog or auto save it to cache/draft
    // close icon: removing the tab on click
    tabs.delegate( "span.ui-icon-close", "click", function() {
        var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
        $( "#" + panelId ).remove();
        tabs.tabs( "refresh" );
    });

    tabs.bind( "keyup", function( event ) {
        if (event.altKey && event.keyCode === $.ui.keyCode.BACKSPACE) {
            var panelId = tabs.find(".ui-tabs-active").remove().attr("aria-controls");
            $("#" + panelId).remove();
            tabs.tabs("refresh");
        }
    });

    $('#zoomIn').on('click', function() {
        event.trigger('view_zoomIn');
    });

    $('#zoomOut').on('click', function() {
        event.trigger('view_zoomOut');
    });

    $CONTAINER_NODE.droppable({
        drop: function( event, ui ) {
            console.log('DROPPPPPPED');
        }
    });

    initListener();
}