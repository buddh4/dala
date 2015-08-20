var event = require('../../core/event');
var Dialog = require('./../../ui/dialog');
var FileTree = require('./fileTree');

var $CONTAINER_NODE = $('#fileBrowser');
var CONTAINER_ID = '#fileBrowser';

var fileTree = new FileTree('#fileSystem');

var initListener = function() {
    event.listen('user_loggedin', userLoginListener);
    event.listen('diagram_initialized', diagramInitializedListener);
    event.listen('diagram_updated', diagramUpdatedListener);
    event.listen('project_created', projectCreatedListener);
    event.listen('dialog_new_project', newProjectDialogListener);
    event.listen('dialog_new_diagram', newDiagramDialogListener);
};

var projectCreatedListener = function(evt) {
    if(evt.data) {
        fileTree.builder.addProject(evt.data).refresh();
    }
};

var diagramUpdatedListener = function(evt) {
    var diagramId = evt.data;
    fileTree.triggerFileChange('diagram', diagramId);
};

var diagramInitializedListener = function(evt) {
    var projectId = evt.data.projectId || 'default';

    fileTree.builder.addDiagram(projectId, {
        id :  evt.data.diagramId,
        label : evt.data.label
    }).refresh();

    fileTree.openNode('project', projectId).refresh();
}

var userLoginListener = function(evt) {
    var projectData = evt.data.projects;
    if(!projectData) {
        //Todo: Load from server
    } else {
        fileTree.build().projects(projectData).refresh();
    }
};

var newProjectDialogListener = function(evt) {
    newProjectDialog.open();
}

var newProjectDialog = new Dialog({
    dialogId : "#new-project-dialog",
    resetOnClose : true,
    closeButton : true,
    submitLabel : 'Create',
    submit: function() {
        createNewProject();
        return true;
    }
});

var createNewProject = function() {
    var settings = {
        title : $('#new-project-title').val(),
        description : $('#new-project-description').val()
    }
    event.trigger('project_create', settings);
};

var newDiagramDialogListener = function(evt) {
    var projectId = evt.data;
    newDiagramDialog.setProject(projectId);
    newDiagramDialog.open();
}

var newDiagramDialog = new Dialog({
    dialogId : "#new-diagram-dialog",
    resetOnClose : true,
    closeButton : true,
    submitLabel : 'Create',
    submit: function() {
        triggerCreateNewDiagram();
        return true;
    }
});

newDiagramDialog.setProject = function(projectId) {
    $('#new-diagram-project').val(projectId);
};

var triggerCreateNewDiagram = function() {
    var settings = {
        title : $('#new-diagram-title').val(),
        projectId : $('#new-diagram-project').val()
    }
    event.trigger('tab_new', settings);
};


module.exports.init = function() {
    $CONTAINER_NODE.accordion({collapsible: true});

    // Just a dummy default project this will be overwritten after login
    var defaultProject = {
        _id         : 'default',
        title       : 'default',
        description : 'Default project for unsigned user'
    }

    fileTree.build().addProject(defaultProject, true).refresh();

    fileTree.$treeNode.on('redraw.jstree after_open.jstree after_close.jstree', function(e) {
        $CONTAINER_NODE.accordion( "refresh" );
    });

    fileTree.$treeNode.on('changed.jstree', function(evt,data) {
        //Single selection
        var id = data.selected[0];

    });

    fileTree.$treeNode.on('ready.jstree', function(e) {
        fileTree.$treeNode.jstree(true).refresh();
    });

    initListener();
};
