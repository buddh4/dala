var Dialog = function(cfg) {
    this.cfg = cfg;
    var that = this;

    this.dialog = $( cfg.dialogId ).dialog({
        autoOpen: false,
        height: cfg.height || 300,
        width: cfg.width || 350,
        modal: true,
        open: cfg.open,
        buttons: cfg.buttons,
        close: function() {
            if(cfg.close) {
                cfg.close();
            }
            $(cfg.triggerId).blur();
        }
    });

    this.dialog.find( "form" ).on( "submit", cfg.submit);

    $(cfg.triggerId).on( "click", function() {
        that.dialog.dialog( "open" );
    });
};

Dialog.prototype.close = function() {
    $(this.cfg.triggerId).blur();
    this.dialog.dialog('close');
};

module.exports = Dialog;