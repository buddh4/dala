var Dialog = require('./dialog');
var xml = require('../xml/xml');

var XMLView = function(diagram) {
    //TODO listen for change diagram/file events
    var that = this;
    this.diagram = diagram;
    this.dialog = new Dialog({
        dialogId : "#xml-view",
        triggerId : "#viewXML",
        width: 1000,
        height: 300,
        open: function() {
            var diagramAsString = that.diagram.asString();
            $('#xml-view').find('textarea').val(xml.format(diagramAsString));
        }
    });
};

XMLView.prototype.close = function() {
    this.dialog.close();
};

module.exports = XMLView;