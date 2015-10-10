var dom = require('../dom/dom');
var object = require('../util/object');

EditPanel = function() {};

EditPanel.prototype.init = function(pageX, pageY, onclose) {
    var that = this;
    this.close();

    this.onclose = onclose;

    //Init Form
    this.$form = dom.create('form', {action : 'javascript:void(0);'})
        .on('submit', function() {
            that.close();
        });

    //Init Container
    this.$editDiv = dom.create('div', {id:'editPanel'})
        .offset({top: pageY, left: (pageX+5)})
        .css('position', 'absolute')
        .css('background-color', 'silver')
        .append(this.$form);

    //Append to body
    $('body').append(this.$editDiv);
    return this;
};

EditPanel.prototype.close = function() {
    if(this.onclose) {
        this.onclose.apply();
    }

    if(this.$editDiv) {
        this.$editDiv.remove();
    }
}

EditPanel.prototype.createTextEdit = function(pageX ,pageY, getter, setter) {
    var that = this;
    var $input = dom.create('input', {type:'text', value : getter()})
        .focus()
        .on('focus', function() {
            this.select();
        })
        .on('blur', function(evt) {
            that.close();
        })
        .on('change', function(evt) {
            setter($input.val());
        });

    this.init(pageX ,pageY);
    this.$form.append($input);
    $input.focus();
};

EditPanel.prototype.createTextAreaEdit = function(pageX ,pageY, getter, setter) {
    var that = this;
    var $input = dom.create('textarea')
        .val(getter())
        .on('change', function() {
            setter($input.val());
        })
        .on('blur', function(evt) {
            that.close();
        })
        .on('focus', function() {
            this.select();
        });

    this.init(pageX ,pageY);
    this.$form.append($input);
    $input.focus();
};

EditPanel.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
    $textAreaNode.empty();
    //TODO: we do not consider the text size for dy !
    var dy = 11;
    $.each(txtAreaContent.split('\n'), function(index, value) {
        if(object.isDefined(value) && value.trim().length > 0) {
            dom.appendSVGElement($textAreaNode.get(0), {
                name : 'tspan',
                attributes : {
                    dy : dy,
                    x : 2
                }
            }, value);
        }
    });
};

EditPanel.prototype.getTextAreaContent = function($textAreaNode) {
    var result = '';
    $textAreaNode.children().each(function() {
        result += $(this).text()+'\n';
    });
    return result;
};

module.exports = EditPanel;