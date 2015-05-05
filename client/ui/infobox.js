var event = require('../core/event');

var CONTAINER_SELECTOR = '#infoBox';
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);


var initListener = function() {
    event.listen('node_selected', viewNodeInfo);
    //TODO: transition_select listener
    event.listen('selection_clear', clearInfo);
    event.listen('transition_select', clearInfo);
}

/**
 * Displays the node information
 */
var viewNodeInfo = function(evt) {
    if(evt.data) {
        var node = evt.data;
        var corners = node.getCorners();
        var center = node.getCenter();
        //TODO: show outgoing / incomming trnasition or nodes
        viewObject({
            id : node.id,
            tmpl : node.template.id,
            x : node.x(),
            y : node.y(),
            right_x : node.getRightX(),
            bottom_y : node.getBottomY(),
            width : node.width(),
            height: node.height(),
            cX : center.x,
            cY : center.y,
            p1 : pToStr(corners[0]),
            p2 : pToStr(corners[1]),
            p3 : pToStr(corners[2]),
            p4 : pToStr(corners[3])
        });
    }
};

var clearInfo = function() {
    $CONTAINER_NODE.html('');
    $CONTAINER_NODE.hide();
};

var pToStr = function(p) {
    return '('+p.x+'/'+p.y+')';
};

var viewObject = function(obj) {
    var result = '<ul>';
    for(attr in obj) {
        if(obj.hasOwnProperty(attr)) {
            result += '<li>'+attr+': '+obj[attr]+'</li>';
        }
    }
    result += '</ul>';
    $CONTAINER_NODE.html(result);
    $CONTAINER_NODE.show();
};

module.exports.init = function() {
    clearInfo();
    initListener();
}
