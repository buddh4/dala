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
};
