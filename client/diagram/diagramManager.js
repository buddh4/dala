var Diagram = require('./diagram');
var event = require('../core/event');
var client = require('../core/client');

var userManager = require('../user/userManager');

var config = require('../core/config');

var diagrams = {};
var activeDiagramId;

//TODO: load from remote/local storage

config.setVal('transition_settings', {
    type: 'straight',
    color: 'black'
});

var initListener = function() {
    event.listen('diagram_new', newDiagramListener);
    event.listen('tab_activated', activeTabListener);
    event.listen('key_save_press', saveDiagram);
    event.listen('key_paste_press', pasteDiagramDataListener);
    event.listen('key_copy_press', copyDiagramDataListener)

    event.listen('view_zoomIn', zoomIn);
    event.listen('view_zoomOut', zoomOut);
    event.listen('view_toggle_mode_move', toggleModeMove);
    event.listen('view_toggle_setting_align', toggleSettingAlign);

    event.listen('key_redo_press', redoCommand);
    event.listen('key_undo_press', undoCommand);
};

var toggleModeMove = function() {
    var  val = config.is('diagram_mode_move', false);
    config.setVal('diagram_mode_move', !val);
    config.setVal('events_restricted', !val);

};

var toggleSettingAlign = function() {
    var  val = config.is('dragAlign', true);
    config.setVal('dragAlign', !val);
};

var undoCommand = function(evt) {
    getActiveDiagram().undoCommand();
};

var redoCommand = function(evt) {
    getActiveDiagram().redoCommand();
};

var copyDiagramDataListener = function(evt) {
    var activeDiagram = getActiveDiagram();
    if(activeDiagram) {
        activeDiagram.trigger('copy',[evt.mouse]);
    };
};

var pasteDiagramDataListener = function(evt) {
    var activeDiagram = getActiveDiagram();
    if(activeDiagram) {
        activeDiagram.trigger('paste',[evt.mouse]);
    };
};

var saveDiagram = function(evt) {
    var activeDiagram = getActiveDiagram();
    if(activeDiagram && userManager.isLoggedIn()){
        //TODO: Remove Dockings.....
        //TODO: check if loggedIn, if not login first dialog... or save via browser cache ?
        var data = {
            "diagram" : activeDiagram.asString(),
            "diagramId" : activeDiagram.id,
            "projectId" : activeDiagram.projectId,
            "title" : activeDiagram.title
        };
        client.post('/project/saveDiagram', data, {
            success : function(response) {},
            error : function(status, error, errorcode) {},
            errorMessage : {
                'default': 'Could not save diagram, please try again later or backup via download!',
                '401':  'Could not save diagram. Please login or create an account first!'
            },
            successMessage : 'Diagram was saved !'
        });
    }

};

var createDiagramId = function() {
    return (userManager.isLoggedIn()) ? Date.now() + '_' +userManager.getUserId() : Date.now()+'';
};

var newDiagramListener = function(evt) {
    var diagramId = evt.data.diagramId;
    var stageId = evt.data.stageId;
    var projectId = evt.data.projectId;
    var title = evt.data.title;
    evt.data.diagramId = diagramId;
    diagrams[diagramId] = new Diagram({id:diagramId, container:'#'+stageId, projectId: projectId, title: title});
    event.trigger('diagram_initialized', evt.data);
};

var activeTabListener = function(evt) {
    activeDiagramId = evt.data;
    console.log('AcitveDiagramId: '+activeDiagramId);
};

var zoomIn = function() {
    getActiveDiagram().zoomIn();
    event.trigger('view_zoomedIn');
}

var zoomOut = function() {
    getActiveDiagram().zoomOut();
    event.trigger('view_zoomedOut');
}

var getActiveDiagram = function() {
    return diagrams[activeDiagramId];
}

initListener();

module.exports = {
    getActiveDiagram: getActiveDiagram,
    createDiagramId : createDiagramId
};