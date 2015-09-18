EditPanel = function() {};

EditPanel.prototype.init = function(pageX, pageY, onclose) {
    this.close();

    //Init Close Button
    var $close = dom.create('input', {type:'button', value : 'x'})
        .on('mouseup',function() {
            if(object.isDefined(onclose)) {
                onclose.apply();
            }
            //that.node.executeAddition('contentChanged');
            this.close();
        });

    //Init Form
    this.$form = dom.create('form', {action : 'javascript:void(0);'})
        .on('submit', function() {
            $close.trigger('mouseup');
        })
        .append($close);

    //Init Container
    this.$editDiv = dom.create('div', {id:'editPanel'})
        .offset({top: pageY, left: (pageX+5)})
        .css('position', 'absolute')
        .css('background-color', 'silver')
        .append(this.$form);

    //Append to body
    document.getElementsByTagName('body')[0].appendChild($editDiv.get(0));
    return this;
};

EditPanel.prototype.close = function() {
    if(this.$editDiv) {
        this.$editDiv.remove();
    }
}

EditPanel.prototype.createTextEdit = function(pageX ,pageY, getter, setter) {
    var $input = dom.create('input', {type:'text', value : getter()})
        .focus()
        .on('focus', function() {
            this.select();
        })
        .on('change', function(evt) {
            setter($input.val());
        });

    this.initEditPanel(pageX ,pageY);
    this.$form.append($input);
    $input.focus();
};

EditPanel.prototype.createTextAreaEdit = function(pageX ,pageY, getter, setter) {
    var $input = dom.create('textarea')
        .val(getter())
        .on('change', function() {
            setter($input.val());
        })
        .on('focus', function() {
            this.select();
        });

    this.initEditPanel(pageX ,pageY);
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