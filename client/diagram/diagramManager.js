var Diagram = require('./diagram');
var event = require('../core/event');

var diagrams = {};
var activeDiagramId;

var initListener = function() {
    event.listen('diagram_new', newDiagramListener);
    event.listen('tab_activated', activeTabListener);
    event.listen('view_zoomIn', zoomIn);
    event.listen('view_zoomOut', zoomOut);
};

var newDiagramListener = function(evt) {
    var diagramId = evt.data.ts;
    var stageId = evt.data.stageId;
    diagrams[diagramId] = new Diagram({id:diagramId, container:'#'+stageId});
    event.trigger('diagram_initialized', diagramId);
};

var activeTabListener = function(evt) {
    activeDiagramId = evt.data;
    console.log('AcitveDiagramId: '+activeDiagramId);
};

var zoomIn = function() {
    getActiveDiagram().zoomIn();
}

var zoomOut = function() {
    getActiveDiagram().zoomOut();
}

var getActiveDiagram = function() {
    return diagrams[activeDiagramId];
}

initListener();

module.exports = {
    getActiveDiagram: getActiveDiagram
};