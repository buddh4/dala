require('./../diagram/ui/templateNav').init();
require('./toolTip').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();
require('./fileMenu').init();
require('./../diagram/ui/stage').init();
require('./../project/ui/fileBrowser').init();
require('./overviewBox').init();
require('./../user/ui/userLogin').init();

var ClientSettingDialog = require('./clientSettingDialog');
new ClientSettingDialog();

var RegisterDialog = require('./../user/ui/registerDialog');
new RegisterDialog();

var XmlViewDialog = require('./xmlViewDialog');
new XmlViewDialog();

var event = require('../core/event');




// Main Content Tabs
$('#contentTabs').tabs();