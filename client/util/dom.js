var xml = require('../xml/XML');
var object = require('../util/Object');

var elementCache = {};

var query = function(selector, cache) {
    var result;
    if(typeof elementCache[selector] === 'undefined') {
        result = $(selector);
        if(object.isDefined(cache) && cache) {
            elementCache[selector] = result;
        }
    } else {
        result = elementCache[selector];
    }
    return result;
};

var getJQueryNode = function(node) {
    // The node is either a dom node or a selector
    if(object.isString(node)) {
        return query(node);
    } else if(node.getAttribute){
        var cached = elementCache[node.getAttribute('id')];
        return object.isDefined(cached) ? cached : $(node);
    } else if(node.jQuery) {
        return node;
    } else {
        // e.g. document, window...
        return $(node);
    }
};

var index = function(node) {
    return getJQueryNode(node).index();
};

var clone = function(node) {
    return getJQueryNode(node).clone().get(0);
};

var parent = function(node, selector) {
    var result = $(node).parents(selector);
    if(result.length > 0) {
        return result.get(0);
    };
};

var moveDown = function(node) {
    var $node = getJQueryNode(node);
    $node.before($node.next());
};

var moveUp = function(node) {
    var $node = getJQueryNode(node);
    $node.after($node.prev());
};

var firstChild = function(node) {
    var result = $(node).children().first();
    if(result.length > 0) {
        return result.get(0);
    };
};

var prev = function(node, selector) {
    return $(node).prev(selector).get(0);
};

var draggable = function(instance) {
    $(instance).draggable();
};

var onDrag = function(instance, callback) {
    var test = $(instance);
    $(instance).on('drag', function(e) {
        alert('asdf');
    });
    //$(instance).on('drag', callback);
};

var empty = function(element) {
    $(element).empty();
};

var remove = function(element) {
    if(object.isDefined(element.root)) {
        if(element.root.instance) {
            element.root.instance().removeChild(element.instance());
        } else {
            element.root.removeChild(element.instance());
        }
    } else if(element.instance) {
        $(element.instance()).remove();
    } else {
        $(element).remove();
    }
};

var after = function(node, afterNode) {
    $(node).after(afterNode);
};

var before = function(node, beforeNode) {
    $(node).after(beforeNode);
};

var insertAfterIndex = function(node, index) {
    var $node = getJQueryNode(node);
    $node.parent().children().eq(index).after($node);
};

var insertSVGAfter = function(container, element, text, insertAfter) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,text,insertAfter);
};

var prependSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,true,text);
};

var appendSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,false,text);
};

var prependToRoot = function(element) {
    if(!element.root.hasChildNodes()) {
        element.instance(element.root.appendChild(element.instance()));
    } else {
        element.instance(element.root.insertBefore(element.instance(), element.root.childNodes[0]));
    }
};

var addSVGElement = function(container, element, prepend, text, insertAfter) {
    prepend = (object.isDefined(prepend))? prepend : false;
    // If only the container is given we assume its an SVGElement object with contained root node
    if(object.isDefined(container) && !object.isDefined(element)) {
        element = container;
        container = container.getRootNode();
    } else if(object.isString(container)) {
        container = query(container)[0];
    } else if(container.instance) {
        container = container.instance();
    }

    var instance;

    if(!element.instance || !object.isDefined(element.instance())) {
        instance = document.createElementNS("http://www.w3.org/2000/svg", element.name);
        $.each(element.attributes, function(key, value) {
            instance.setAttribute(key, value.toString());
        });
    } else {
        instance = element.instance();
    }

    if(object.isDefined(text)) {
        var txtNode = document.createTextNode(text);
        instance.appendChild(txtNode);
    }
    if(object.isDefined(insertAfter)) {
        //if the parents lastchild is the targetElement...
        if(container.lastchild == insertAfter) {
            //add the newElement after the target element.
            container.appendChild(instance);
        } else {
            // else the target has siblings, insert the new element between the target and it's next sibling.
            container.insertBefore(instance, insertAfter.nextSibling);
        }
    } else if(!prepend || !container.hasChildNodes() ) {
        instance = container.appendChild(instance);
    } else {
        instance = container.insertBefore(instance,container.childNodes[0]);
    }

    if(object.isFunction(element.instance)) {
        element.instance(instance);
    } else {
        element.instance = instance;
    }

    return element;
};

var importSVG = function(container, svgXML) {
    var $svgXML, name, attributes;

    if(svgXML.jquery) {
        $svgXML = svgXML;
    } else if(object.isString(svgXML)) {
        $svgXML = $(parseXML(svgXML.trim()))
        $svgXML = $($svgXML.get(0).documentElement);
    } else {
        $svgXML = $(svgXML);
    }

    if($svgXML.nodeName) {
        name = $svgXML.nodeName;
        attributes = getAttributes($svgXML);
    } else {
        name = $svgXML.get(0).tagName;
        attributes = getAttributes($svgXML.get(0));
    }

    //We create a dummy element object
    var element = {
        name : name,
        attributes : attributes,
        instance : function(inst) {
            if(object.isDefined(inst)) {
                this.instanceElement = inst;
            } else {
                return this.instanceElement;
            }
        }
    };

    appendSVGElement(container, element, getChildText($svgXML));

    $svgXML.children().each(function(index, child) {
        importSVG(element.instance(), child);
    });

    return element.instance();
};

var getChildText = function(node) {
    if(!node.jquery) {
        node = $(node);
    }

    var childText = node.contents().filter(function(){
        return this.nodeType === 3;
    });

    if(object.isDefined(childText) && childText.length > 0) {
        return childText[0].nodeValue;
    }
};

var cache = function(selector) {
    return query(selector, true)[0];
};

var getFirst = function(selector, cache) {
    return query(selector, cache)[0];
};

var children = function(node, selector) {
    return $(node).children(selector).get();
};

var getAttributes = function(node) {
    var result = {};
    $(node.attributes).each(function() {
        result[this.nodeName] = this.nodeValue;
    });
    return result;
};

var getAttribute = function(node, key) {
    return getJQueryNode(node).attr(key);
};

var setAttribute = function(node, key, value) {
    getJQueryNode(node).attr(key, value);
};

var find = function(node, selector) {
    return $(node).find(selector).get(0);
};

var get = function(selector) {
    return $(selector).get();
};

var findIncludeSelf = function(node, selector) {
    return $(node).find(selector).andSelf().filter(selector).get(0);
};

var text = function(node) {
    return getJQueryNode(node).text();
};

var setText = function(node, txt) {
    return getJQueryNode(node).text(txt);
};

var html = function(node, value) {
    return getJQueryNode(node).html(value);
};

var parseNodeXML = function(node) {
    return $.parseXML(text(node));
};

var parseXML = function(str) {
    return $.parseXML(str);
};

var parseNodeJSON = function(node) {
    return $.parseJSON(text(node));
};

var offset = function(node) {
    return getJQueryNode(node).offset();
};

var left = function(node, value) {
    return getJQueryNode(node).css({left: value});
};

var top = function(node, value) {
    return getJQueryNode(node).css({top: value});
};

var addClass = function(node, cssClass) {
    getJQueryNode(node).addClass(cssClass);
};

var removeClass = function(node, cssClass) {
    getJQueryNode(node).removeClass(cssClass);
};

module.exports = {
    index : index,
    remove : remove,
    empty : empty,
    appendSVGElement : appendSVGElement,
    prependSVGElement : prependSVGElement,
    after : after,
    before : before,
    insertSVGAfter : insertSVGAfter,
    insertAfterIndex : insertAfterIndex,
    prependToRoot : prependToRoot,
    importSVG : importSVG,
    cache : cache,
    draggable : draggable,
    onDrag : onDrag,
    text : text,
    setText : setText,
    html : html,
    find : find,
    clone : clone,
    get : get,
    firstChild : firstChild,
    parent : parent,
    moveDown : moveDown,
    moveUp : moveUp,
    prev : prev,
    findIncludeSelf : findIncludeSelf,
    parseNodeXML : parseNodeXML,
    parseNodeJSON : parseNodeJSON,
    getAttributes : getAttributes,
    getAttribute : getAttribute,
    setAttribute : setAttribute,
    getFirst : getFirst,
    children : children,
    getJQueryNode : getJQueryNode,
    offset : offset,
    top : top,
    left : left,
    addClass: addClass,
    removeClass: removeClass
};