var config = require('../core/config');


exports.init = function() {
    //Transition Setting Menu
    $('#transition-default-stroke').on('change', function() {
        config.val('transition_settings')['stroke'] = $(this).val();
    });

    $('.transitionTypeOption').on('click', function() {
        var type = $(this).data('type');
        config.val('transition_settings')['type'] = type;
        $('.transitionTypeOption').removeClass('active');
        $(this).addClass('active');
    });

    $('#transition-type-'+config.val('transition_settings')['type']).addClass('active');

    $('#transion-marker-start-select').val(config.val('transition_settings')['marker-start']);
    $('#transion-marker-end-select').val(config.val('transition_settings')['marker-end']);

    $('.transition-marker-select').msDropDown().on('change', function() {
        config.val('transition_settings')['marker-'+$(this).data('type')] = $(this).val();
    });

    $('#transition-dash-select').msDropDown().on('change', function() {
        config.val('transition_settings')['stroke-dasharray'] = $(this).val();
    });

    $('#transition-stroke-width-input').val(config.val('transition_settings')['stroke-width']);

    $('#transition-stroke-width-input').on('change', function() {
        config.val('transition_settings')['stroke-width'] = $(this).val();
    });
};
