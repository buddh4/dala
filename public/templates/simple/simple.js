(function() {
    dala.require('templateManager').registerPanel({
        id: 'simple',
        label: 'Simple',
        templates: {
            simple_circle : {id: 'simple_circle', label: 'Circle'},
            simple_ellipse :{id: 'simple_ellipse', label: 'Ellipse'},
            simple_rect: {id: 'simple_rect', label: 'Rectangle'}
        }
    });
})();