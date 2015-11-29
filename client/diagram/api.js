var Promise = require('bluebird');

var DiagramAPI = function(diagram) {
    this.diagram = diagram;
};

DiagramAPI.prototype.createNode = function(tmplId, position) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.loadTemplate(tmplId)
            .then(function(template) {
                resolve(that.diagram.nodeMgr.createNodeCommand(template, position));
            }, function(err) {
                reject(err);
            });
    });

};

DiagramAPI.prototype.getSelectedTransition = function(tmpl, position) {
    return this.diagram.selectionMgr.selectedTransition;
};

DiagramAPI.prototype.loadTemplate = function(tmpl) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.diagram.templateMgr.getTemplate(tmpl)
            .then(function(template) {
                resolve(template);
            }, function(err) {
                reject(err);
            });
    });
};

DiagramAPI.prototype.getSelectedNodes = function(tmpl, position) {
    return this.diagram.selectionMgr.getSelectedNodes();
};

DiagramAPI.prototype.getNodeById = function(id) {
    return this.diagram.nodeMgr.getNode(id);
};

DiagramAPI.prototype.createTransition = function(node1, node2) {
    return node1.additions.transition.startNewTransition(node2);
};

DiagramAPI.prototype.getTransitionById = function(id) {
    return this.diagram.transitionMgr.getTransition(id);
};

module.exports = DiagramAPI;