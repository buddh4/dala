var event = require('../core/event');


exports.init = function() {
    $('#file_new').on('click', function() {
        event.trigger('tab_new');
    });

    $('#saveButton').on('click', function() {
        event.trigger('key_save_press');
    });

    event.on('#downloadDiagram', 'click', function(evt) {
        event.trigger('diagram_download');
    });
};