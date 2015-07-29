var event = require('../core/event');

var CONTAINER_SELECTOR = '#templateNav';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);
var TPML_SELECT_PREFIX = 'tmpl_select_';
var CLASS_ACTIVE = 'tmpl_select_active';
var EVT_TMPL_SELECT = 'template_select';

var initListener = function() {
    event.listen('node_selected', nodeSelectListener);

    event.on('.tmpl_select', 'click', function(evt) {
        var id = $(this).attr('id');
        var tmplId = id.substring(TPML_SELECT_PREFIX.length, id.length);
        event.trigger(EVT_TMPL_SELECT, tmplId);
        setActiveTemplate(tmplId);
    });
}

var nodeSelectListener = function(evt) {
    setActiveTemplate(evt.data.template.id);
};

var setActiveTemplate = function(tmplId) {
    $('.'+CLASS_ACTIVE).removeClass(CLASS_ACTIVE);
    $('#tmpl_select_'+tmplId).addClass(CLASS_ACTIVE);
};



module.exports.init = function() {
    $CONTAINER_NODE.accordion({collapsible: true});
    $('.tmpl_select').draggable({helper: "clone", appendTo: "body" ,zIndex: 1004});
    initListener();
}
