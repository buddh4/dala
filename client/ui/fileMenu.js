var event = require('../core/event');
var Dialog = require('./dialog');
var diagramManager = require('../diagram/diagramManager');

var triggerDownload = function() {

};

exports.init = function() {
    $('#file-menu-new').on('click', function() {
        event.trigger('tab_new');
    });

    $('#file-menu-open').on('click', function() {
        $('#openSVG').click();
    });

    $('#file-menu-save').on('click', function() {
        event.trigger('key_save_press');
    });

    $("#format-svg").prop("checked", true);
    $('#download-as-suffix').text('.svg');

    $('input:radio[type=radio][name=download-format]').on('change', function() {
        $('#download-as-suffix').text('.'+$(this).next('label').text());
    });

    var downloadDialog = new Dialog({
        dialogId : "#download-as-dialog",
        triggerId : "#downloadDiagram, #file-menu-download-as",
        cancelButton: true,
        resetOnClose : true,
        submitLabel : 'Download',
        submit : function() {
            var fileName = $('#download-as-fileName').val();
            var mime = $('input:radio[type=radio][name=download-format]:checked').val();
            event.trigger('diagram_download_as', {fileName: fileName, mime: mime});
            return true;
        },
        open : function(evt) {
            $('#download-as-fileName').val(diagramManager.getActiveDiagram().title);
        }
    });
};