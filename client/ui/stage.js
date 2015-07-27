var event = require('../core/event');
var stringUtil = require('../util/string');
var diagramManager = require('../diagram/diagramManager');

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
    addTab();
};

var diagramUpdatedListener = function(evt) {
    var diagramId = evt.data;
    var $tabLink = getTabLinkForDiagramId(diagramId);
    var text = $tabLink.text();
    if(!stringUtil.endsWith(text, '*')) {
        $tabLink.text(text+'*');
    }
};

var addTab = function() {
    // We use the timestamp to identify the tab/stage/diagram
    var ts = Date.now();
    var id = TAB_CONTAINER_PREFIX+ts;
    var stageId = TAB_STAGE_PREFIX+ts;
    var label = 'New Diagram';
    var li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );

    $CONTAINER_NODE.find( ".ui-tabs-nav" ).append( li );
    $CONTAINER_NODE.append( '<div id=' + id + ' class="stageFile"><div id='+stageId+' class="svgStage"></div></div>' );
    $CONTAINER_NODE.tabs( "refresh" );

    $('#stageTabs').removeClass('ui-corner-all').addClass('ui-corner-top');

    event.trigger('diagram_new', {ts: ts, stageId: stageId});
}

var showTabListener = function(evt) {
    var diagramId = evt.data;
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

    initListener();
}