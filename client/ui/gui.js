//require('jquery-ui');

require('./jqueryPlugins');

//jquery-ui / bootstrap conflicts
$.widget.bridge('uibutton', $.ui.button);
$.widget.bridge('uitooltip', $.ui.tooltip);

//require('jstree');

require('bootstrap');

if($.fn.button.noConflict) {
    $.fn.bootstrapBtn = $.fn.button.noConflict();
}

require('./templateNav').init();
require('./toolTip').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();
require('./fileMenu').init();
require('./stage').init();
require('./diagramMenu').init();
require('./../project/ui/fileBrowser').init();
require('./overviewBox').init();
require('./../user/ui/userLogin').init();
require('./svgTester').init();

var ClientSettingDialog = require('./clientSettingDialog');
new ClientSettingDialog();

var RegisterDialog = require('./../user/ui/registerDialog');
new RegisterDialog();

var XmlViewDialog = require('./xmlView');
new XmlViewDialog();

var event = require('../core/event');


var diagramManager = require('../diagram/diagramManager');

// Main Content Tabs
$('#contentTabs').tabs();

$('#dump_diagram').on('click', function() {
    $('#dump_container').html(diagramManager.getActiveDiagram().dump());
});

var buildValidationInfo = function(key, report, depth) {
    var result = '';
    depth = (depth) ? depth : 1;
    if(!require('../util/object').isString(report)) {

        if($.isEmptyObject(report)) {
            result += Array(depth).join(" ")+key+': [OK]\n';
            return result;
        }

        result += Array(depth).join(" ")+key+':\n';
        $.each(report, function(key, sub) {
            console.log(key);
            result += buildValidationInfo(key, sub, (depth + 1))
        })
    } else {
        result =  Array(depth).join(' ') + report + '\n';
    }
    return result;
};

$('#validate_diagram').on('click', function() {
    var activeDiagram = diagramManager.getActiveDiagram();
    var report = activeDiagram.validate();
    //console.log(report);
    $('#dump_container').html('<pre>'+buildValidationInfo('Diagram '+activeDiagram.id, report)+'</pre>');
});