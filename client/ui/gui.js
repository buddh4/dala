require('./uiAdditions');
require('./templateNav').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();
require('./fileMenu').init();
require('./stage').init();
require('./fileBrowser').init();
require('./overviewBox').init();
require('./userLogin').init();

var ClientSettingDialog = require('./clientSettingDialog');
new ClientSettingDialog();

var RegisterDialog = require('./registerDialog');
new RegisterDialog();

var XmlViewDialog = require('./xmlViewDialog');
new XmlViewDialog();

var event = require('../core/event');




// Main Content Tabs
$('#contentTabs').tabs();