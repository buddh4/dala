require('./uiAdditions');
require('./templateNav').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();
require('./stage').init();
require('./fileMenu').init();
require('./overviewBox').init();

var event = require('../core/event');


// Main Content Tabs
$('#contentTabs').tabs();