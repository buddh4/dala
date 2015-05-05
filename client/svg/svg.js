var SVGElement = require('./svgElement');
var SVGText = require('./svgText');
var util = require('../util/Util');

var dom = util.dom;
var object = util.object;

var instances = {};

var SVG = function(cID, cfg) {
    this.containerNode = $(cID).get(0);
    if(cID.indexOf('#') === 0) {
        cID = cID.substring(1, cID.length);
    }
    var svgId = cID+'_svg';

    cfg = cfg || {};

    // If no size is set we adopt the container size
    if(!cfg.height) {
        cfg.height = '100%';
    }

    if(!cfg.width) {
        cfg.width = '100%';
    }

    this.root = new SVGElement('svg', this.containerNode, {
        xmlns : 'http://www.w3.org/2000/svg',
        'xmlns:xlink' : 'http://www.w3.org/1999/xlink',
        version : '1.1',
        id : svgId
    });

    // Set remaining cfg values as attributes
    this.root.attr(cfg);

    // Add the svg root element to the container
    dom.appendSVGElement(this.containerNode, this.root);

    instances[svgId] = this;
};

SVG.prototype.getRootNode = function(element) {
    return this.root.instance();
};

SVG.prototype.setRoot = function(element) {
    //TODO: This is rather a hack we just overwrite the instance and id here
    var newId = dom.getAttributes(element)['id'];
    this.root.instance(element);
    this.root.attr({id : newId});
    instances[newId] = this;
};

SVG.prototype.getRoot = function(element) {
    return this.root;
};

SVG.prototype.addToRoot = function(element, prepend, text) {
    if(prepend) {
        return dom.prependSVGElement(this.getRoot(), element, text);
    } else {
        return dom.appendSVGElement(this.getRoot(), element, text);
    }

};

SVG.prototype.import = function(elementXML) {
    return dom.importSVG(this.getRoot(), elementXML);
};

SVG.prototype.rect = function(cfg) {
    return this.addToRoot(new SVGElement('rect',this.getRoot(), cfg));
};

SVG.prototype.text = function(text, cfg) {
    return this.addToRoot(new SVGText(text, this.getRoot(), cfg), false);
};

SVG.prototype.circle = function(cfg) {
    return this.addToRoot(new SVGElement('circle', this.getRoot(), cfg));
};

SVG.prototype.g = function(cfg) {
    var prepend = (object.isDefined(cfg.prepend))?cfg.prepend:false;
    delete cfg.prepend;

    var group = this.addToRoot(new SVGElement('g', this.getRoot(), cfg));

    if(arguments.length > 1) {
        for(var i = 1;i < arguments.length; i++) {
            dom.appendSVGElement(group.instance(), arguments[i]);
        }
    }

    return group;
};

SVG.prototype.addToGroup = function(group, element) {
    return dom.appendSVGElement(group.instance(), element);
};

SVG.prototype.path = function(cfg) {
    return this.addToRoot(new SVGElement('path', this.getRootNode(), cfg));
};

SVG.get = function(elementIDSelector) {
    var node;

    if(!object.isDefined(elementIDSelector)) {
        console.warn('call SVG.get on a non undefined id/node');
        return;
    }

    if(object.isString(elementIDSelector)) {
        if(elementIDSelector[0] !== '#') {
            elementIDSelector = '#'+elementIDSelector;
        }

        node = dom.getFirst(elementIDSelector);
    } else {
        node = elementIDSelector;
    }

    if(object.isDefined(node)) {
        var svgRootNode = dom.parent(node, 'svg');
        if(object.isDefined(svgRootNode)) {
            var id = dom.getAttributes(svgRootNode)['id'];
            var svgRootElement = instances[id];
            return new SVGElement(node, svgRootElement.getRoot());
        } else {
            return new SVGElement(node);
        }
    } else {
        console.warn('call SVG.get on a non existing node: '+elementIDSelector);
    }
};

SVG.prototype.get = SVG.get;

module.exports = SVG;
