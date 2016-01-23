var config = require('../core/config');
var event = require('../core/event');

exports.init = function() {
    $('#node-align').on('click', function() {
        event.trigger('view_toggle_setting_align');
        $(this).toggleClass('active');
    });

    if(config.is('dragAlign', true)) {
        $('#node-align').toggleClass('active');
    }

    $('#node-default-fill').val(config.val('node_settings')['fill']);

    $('#node-default-fill').on('change', function() {
        config.val('node_settings')['fill'] = $(this).val();
    });

    $('#node-stroke').val(config.val('node_settings')['stroke']);

    $('#node-stroke').on('change', function() {
        config.val('node_settings')['stroke'] = $(this).val();
    });

    $('#node-dash-select').val(config.val('node_settings')['stroke-dasharray']);

    $('#node-dash-select').msDropDown().on('change', function() {
        config.val('node_settings')['stroke-dasharray'] = $(this).val();
    });

    $('#node-stroke-width-input').val(config.val('node_settings')['stroke-width']);

    $('#node-stroke-width-input').on('change', function() {
        config.val('node_settings')['stroke-width'] = $(this).val();
    });

    /**
     * TODO: move to selectionmenu
     */
    $('#node-moveup').on('click', function() {
        event.trigger('node_moveup');
    });

    $('#node-movedown').on('click', function() {
        event.trigger('node_movedown');
    });
};
