var Dialog = require('./dialog');
var diagramManager = require('../diagram/diagramManager');
var xml = require('../util/xml');

var XMLView = function() {
    //TODO listen for change diagram/file events
    var that = this;
    this.dialog = new Dialog({
        dialogId : "#dom-view",
        triggerId : "#viewXML",
        width: 1000,
        height: 300,
        open: function() {
            var diagramAsString = diagramManager.getActiveDiagram().asString();
            $('#dom-view').find('textarea').val(xml.format(diagramAsString));
        }
    });
};

XMLView.prototype.close = function() {
    this.dialog.close();
};

module.exports = XMLView;