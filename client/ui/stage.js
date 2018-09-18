var event = require('../core/event');
var stringUtil = require('../util/string');
var objectUtil = require('../util/object');
var diagramManager = require('../diagram/diagramManager');
var userManager = require('../user/userManager');
var fileManager = require('../core/fileManager');

var CONTAINER_SELECTOR = '#diagramStage';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var TAB_CONTAINER_PREFIX = 'file_';
var TAB_STAGE_PREFIX = 'stage_';

var tabs;

var tabTemplate = '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close" style="float:right;" role="presentation">Remove Tab</span></li>';
var dragFileTmpl = '<div id="file-drag-import" style="position:absolute;display:none;z-index:1000;background-color:grey;text-align: center"><span class="glyphicon glyphicon-open-file" style="font-size: 50px;color:white;top:50%;"></span></div>';
var dragBackTmpl = '<div id="file-drag-back" style="position: fixed;height: 100%;width: 100%;z-index: 5000;text-align: center;opacity: 0;background-color: grey;top: 0px;left: 0px;display:none">&nbsp;</div>';

var $dragIcon;
var $dragBack;

var initListener = function() {
    event.listen('tab_new', newFileListener);
    event.listen('diagram_updated', diagramUpdatedListener);
    event.listen('diagram_initialized', showTabListener);

    $dragIcon = $(dragFileTmpl);
    $dragBack = $(dragBackTmpl);
    $('body').append($dragBack);
    $CONTAINER_NODE.append($dragIcon);

    var doc = document;
    $(document).on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $diagramContainer = diagramManager.getActiveDiagram().$container;
        $dragIcon.css({width: $diagramContainer.width(), height: $diagramContainer.height()});
        $dragIcon.show();
        $dragBack.show();
    });

    $(document).on('drop', function(e) {
        e.preventDefault();
    })

    $dragBack.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        //console.log(document);
        console.log(e.target);
        $dragIcon.hide();
        $dragBack.hide();
    });

    $dragBack.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            var event = e.originalEvent;
            if(event.dataTransfer || event.target) {
                var files = event.target.files || event.dataTransfer.files;
                $.each(files, function (i, file) {
                    var fileName = file.name;
                    //console.log(file);
                    //console.log(file.mimetype);
                    switch (file.type) {
                        case "image/svg+xml":
                            //TODO check if is dala diagram or simple svg...
                            var rawFileName = stringUtil.cutsuffix(fileName, '.svg');
                            fileManager.readAsText(file).then(function (svgString) {
                                addTab({projectId: 'default', title: rawFileName});
                                diagramManager.getActiveDiagram().loadDiagram(svgString);
                            });
                            break;
                    }
                });
            }
        } catch(e) {
            console.error(e);
        } finally {
            $dragIcon.hide();
            $dragBack.hide();
        }
    });
};

var newFileListener = function(evt) {
    var settings = (evt.data) ? evt.data : {
        projectId : 'default',
        title : 'new'
    };
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

    return event.trigger('diagram_new', {diagramId: diagramId, stageId: stageId, projectId: projectId, title: title, label: label });
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

    $CONTAINER_NODE.droppable({
        drop: function( event, ui ) {
            //Since the template was selected before we just can use the default creation mechanism
            diagramManager.getActiveDiagram().createNode(event);
        }
    });

    initListener();
}