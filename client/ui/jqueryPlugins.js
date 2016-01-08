var SVG = require('../svg/svg');
var queryCache = require('../core/cache');

$.fn.svg = function(selector) {
    if(selector && selector.SVGElement) {
        return selector;
    }else if(selector) {
        return $(selector).svg();
    }

    if(!this.length) {
        return;
    } else if(this.length === 1) {
        return SVG.get(this);
    } else if(this.length > 1) {
        var result =  [];
        this.each(function() {
            result.push(SVG.get(this));
        })
        return result;
    }

    return this;
};

$.svg = $.fn.svg;

$.qCache = function(selector, preventCache) {
    if(selector) {
        return queryCache.$(selector, preventCache);
    } else {
        return queryCache;
    }
};

$.qUncache = function(selector) {
    return queryCache.remove(selector);
};

/**
 * The problem with ui-selectmenu is that it causes a second keydown trigger event when focused.
 * So global keydown events are triggered twiche like do/undo if focused. The following event
 * prevents the propagation if the control key is pressed.
 */
$(document, '.ui-selectmenu-button').on('keydown', function(evt) {
    if(evt.ctrlKey) {
        evt.stopPropagation();
    }
});

$.fn.growl = function(params) {
    var $root = this;

    // tooltip content and styling
    var $content = $(
        '<a class="icon-close" href="#"></a>'+
        '<h1 style="color: white; font-size: 12pt; font-weight: bold; padding-bottom: 5px;">' + params.title + '</h1>' +
        '<p style="margin: 0; padding: 5px 0 5px 0; font-size: 10pt;">' + params.text + '</p>');

    // add 'Close' button functionality
    var $close = $($content[0]);
    $close.click(function(e) {
        $root.uitooltip('close');
    });

    // prevent standard tooltip from closing
    $root.bind('focusout mouseleave', function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; });

    // build tooltip
    $root.uitooltip({
        content: function() { return $content; },
        items: $root.selector,
        tooltipClass: 'growl ' + params.growlClass,
        position: {
            my: 'right top',
            at: 'right-10 top+10'
        },
        close: function( event, ui ) {
            $root.uitooltip('destroy');
        }
    }).uitooltip('open');

    if(params.closeAfter) {
        setTimeout(function(){ $root.uitooltip('close'); }, params.closeAfter);
    }
};

if($.ui) {
    $.widget( "custom.iconselectmenu", $.ui.selectmenu, {
        _renderItem: function( ul, item ) {
            var li = $( "<li>", { text: item.label } );
            if ( item.disabled ) {
                li.addClass( "ui-state-disabled" );
            }
            $( "<span>", {
                style: item.element.attr( "data-style" ),
                "class": "ui-icon " + item.element.attr( "data-class" )
            })
                .appendTo( li );
            return li.appendTo( ul );
        }
    });
}
