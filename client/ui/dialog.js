var Dialog = function(cfg) {
    this.cfg = cfg;
    this.buttons = cfg.buttons || {};
    this.dialogId = cfg.dialogId;
    this.resetOnClose = cfg.resetOnClose || false;
    var that = this;

    if(cfg.cancelButton) {
        this.buttons['Cancel'] = function() {
            that.cancel();
        }
    }

    if(cfg.closeButton) {
        this.buttons['Close'] = function() {
            that.close();
        }
    }

    if(cfg.resetButton) {
        this.buttons['Reset'] = function() {
            that.reset();
        }
    }

    if(cfg.submit) {
        var label = cfg.submitLabel || 'Submit';
        this.buttons[label] = function() {
            if(cfg.submit()) {
                that.close();
            }
        }
    }

    this.dialog = $( cfg.dialogId ).dialog({
        autoOpen: false,
        height: cfg.height || 'auto',
        width: cfg.width || '300',
        modal: true,
        open: cfg.open,
        buttons: that.buttons,
        close: function() {
            if(cfg.close) {
                cfg.close();
            }
            $(cfg.triggerId).blur();
        }
    });

    this.dialog.find( "form" ).on( "submit", function(evt) {
        evt.preventDefault();
    });

    if(cfg.triggerId) {
        $(cfg.triggerId).on( "click", function() {
            that.dialog.dialog( "open" );
        });
    };
};

Dialog.prototype.shake = function() {
  $(this.dialogId).parent().effect('shake');
};

Dialog.prototype.open = function() {
    this.dialog.dialog( "open" );
}

Dialog.prototype.cancel = function() {
    this.close();
    this.reset();
}

Dialog.prototype.close = function() {
    $(this.cfg.triggerId).blur();
    this.dialog.dialog('close');

    if(this.resetOnClose) {
        this.reset();
    }
};

Dialog.prototype.reset = function() {
    $(this.dialogId).closest('form').find("input[type=text], textarea").val("");
};

module.exports = Dialog;