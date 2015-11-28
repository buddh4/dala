require('./templateNav').init();
require('./toolTip').init();
require('./editNav').init();
require('./infobox').init();
require('./userNotificationBar').init();
require('./fileMenu').init();
require('./stage').init();
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


// Main Content Tabs
$('#contentTabs').tabs();