require('./uiAdditions');
require('./templateNav').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();

var event = require('../core/event');


// Main Content Tabs
$('#contentTabs').tabs();

// Download Button
event.on('#downloadDiagram', 'click', function(evt) {
    event.trigger('diagram_download');
});