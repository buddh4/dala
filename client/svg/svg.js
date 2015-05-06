var SVGElement = require('./svgElement');
var SVGText = require('./svgText');
var util = require('../util/Util');

var dom = util.dom;
var object = util.object;

var instances = {};


var SVG = function(cID, cfg) {
    if(cID.indexOf('#') === 0) {
        this.containerNode = $(cID).get(0);
        cID = cID.substring(1, cID.length);
    } else {
        this.containerNode = $('#'+cID).get(0);
    }

    if(!this.containerNode) {
        console.error('Attempt to initiate svg stage for invalid id setting: '+cID);
        //TODO: throw error
    }

    this.svgId = cID+'_svg';

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
        id : this.svgId
    });

    // Set remaining cfg values as attributes
    this.root.attr(cfg);

    // Add the svg root element to the container
    dom.appendSVGElement(this.containerNode, this.root);

    this.svgParts = {'root':this.root};
    this.defaultPart = this.root;

    instances[this.svgId] = this;
};

SVG.prototype.getRootNode = function() {
    return this.root.instance();
};

SVG.prototype.getDefaultPart = function() {
    return this.defaultPart;
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

SVG.prototype.createPart = function(part, isDefault) {
    //New parts are always added to the root part
    this.svgParts[part] = this.g({id: this.svgId+'_'+part, part: 'root'});
    if(isDefault) {
        this.defaultPart = this.svgParts[part];
    }
    return this.svgParts[part];
};

SVG.prototype.part = function(id) {
    return this.svgParts[id];
};

SVG.prototype.addToPart = function(part, element) {
    this.addToGroup(this.svgParts[part], element);
};

SVG.prototype.addToRoot = function(element, prepend, text) {
    if(prepend) {
        return dom.prependSVGElement(this.getRoot(), element, text);
    } else {
        return dom.appendSVGElement(this.getRoot(), element, text);
    }
};

SVG.prototype.add = function(element, part, prepend, text) {
    part = part || this.getDefaultPart();
    element.parent = part;
    if(prepend) {
        return dom.prependSVGElement(part, element, text);
    } else {
        return dom.appendSVGElement(part, element, text);
    }
};

SVG.prototype.import = function(elementXML, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return dom.importSVG(part, elementXML);
};

SVG.prototype.rect = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new SVGElement('rect', this.root, cfg), part);
};

SVG.prototype.text = function(text, cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new SVGText(text, this.root, cfg), part, false);
};

SVG.prototype.circle = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new SVGElement('circle', this.root, cfg), part);
};

SVG.prototype.g = function(cfg) {
    var prepend = (object.isDefined(cfg.prepend))?cfg.prepend:false;
    delete cfg.prepend;

    part = this.svgParts[cfg.part] || this.getDefaultPart();

    delete cfg.part;

    var group = this.add(new SVGElement('g', this.root, cfg), part);

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

SVG.prototype.path = function(cfg, part) {
    var part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new SVGElement('path', this.root, cfg), part);
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
