var $toolTipContainer = $('#diagramToolTip');

var panels = {};
var sections = {};

var Panel = function($panel) {
    this.id = $panel.attr('id');
    this.$panel = $panel;
};

Panel.prototype.init = function() {
    this.$panel.accordion({
        collapsible: true
    });
    return this;
};

Panel.prototype.hide = function() {
    this.$panel.hide();
    return this;
};

Panel.prototype.show = function() {
    this.$panel.show();
    return this;
};

Panel.prototype.update = function() {
    this.$panel.accordion('refresh');
};

Section = function(id) {
    this.id = id;
    this.$content = $('#'+id);
    this.$head = this.$content.prev();
};

Section.prototype.hide = function(id) {
    this.$content.hide();
    this.$head.hide();
};

Section.prototype.show = function(id) {
    this.$content.show();
    this.$head.show();
};

var init = function() {
    scanForPanels();
};

var hide = function() {
    $toolTipContainer.hide();
};

var show = function() {
    $toolTipContainer.show();
};

var scanForPanels = function() {
    $toolTipContainer.children('div').each(function(index, elem) {
        var panel = new Panel($(elem));
        if(!panels[panel.id]) {
            panels[panel.id] = panel.init();

        }
    });
};

var getPanel = function(id) {
    return panels[id];
};

var getSection = function(id) {
    var section = sections[id];
    if(!section) {
        sections[id] = section = new Section(id);
    }
    return section;
};

module.exports = {
    init : init,
    show : show,
    hide : hide,
    scanForPanels : scanForPanels,
    getPanel : getPanel,
    getSection : getSection
};