var SVG = require('../svg/svg');
var event = require('../core/event');
var xml = require('../util/xml');

var svg;

var init = function() {
    svg = new SVG('#svgTestStage');

    $('#svgTestInput').on('change', function(evt) {
        update();
    });
};

var update = function() {
    var value = $('#svgTestInput').val();
    svg.empty();
    updateSVG(value);
};

var updateSVG = function(value, secondTry) {
    try {
        svg.import(value.trim());
        updateInputText();
        $('#svgTestStage_svg').find('g, rect, circle, ellipse').each(function (index, val) {
            svg.get(val).draggable({
                dragEnd: function () {
                    updateInputText();
                }
            });
        });
    } catch(e) {
        if(!secondTry) {
            updateSVG('<g>' + value.trim() + '</g>', true);
        } else {
            event.trigger('error', 'Could not render SVG!');
            console.error(e);
        }
    }
};

var updateInputText = function() {
    $('#svgTestInput').val(xml.format(svg.root.firstChild().toString()));
};

module.exports = {
    init : init
}