var object = require('../util/Util').object;
var dom = require('../util/Util').dom;

var Element = function(tagName, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributes = {};

    if(object.isObject(tagName)) {
        cfg = tagName;
        tagName = cfg.name;
        delete cfg.name;
    }

    this.name = tagName;

    if(object.isObject(cfg)) {
        if(cfg.children) {
            this.children = cfg.children;
            delete cfg.children;
        }

        this.single = cfg.single || false;
        delete cfg.single;

        //We assume all remaining cfg entries are attributes
        for(var attributeKey in cfg) {
            if(cfg.hasOwnProperty(attributeKey)) {
                this.setSecureAttribute(attributeKey, cfg[attributeKey]);
            }
        }
    }
};

Element.prototype.getType = function(instance) {
    return this.name.toLowerCase();
};

Element.prototype.instance = function(instance) {
    if(object.isDefined(instance)) {
        this.domInstance = instance;
        return this;
    } else {
        return this.domInstance;
    }
};

Element.prototype.id = function(newId) {
    if(object.isString(newId)) {
        setSecureAttribute('id',newId);
        return this;
    } else {
        return this.attr('id');
    }
};

Element.prototype.update = function() {
    for(attributeKey in this.attributeSetter) {
        if(this.attributeSetter.hasOwnProperty(attributeKey)) {
            this.setSecureAttribute(attributeKey, this.attributes[attributeKey]);
        }
    }
};

Element.prototype.setSecureAttribute = function(key, value) {
    // If first arg is object handle its properties as attributes
    if(object.isObject(key)) {
        for(var attribute in key) {
            if(object.isDefined(attribute) && key.hasOwnProperty(attribute)) {
                this.setSecureAttribute(attribute, key[attribute]);
            }
        }
    } else{

        // Some elementtypes can transform specific types of attributes to special objects
        // which are able to render and set the values in a special way.
        if(object.isString(value) && object.isDefined(this.attributeSetter[key])) {
            value = this.attributeSetter[key](value);
        }

        if(!object.isDefined(value) || value.length === 0) {
            return;
        }

        // Just transform stringlits values to arrays in case its a string list
        this.attributes[key] = value;



        // Directly set it to the SVG instance if already rendered
        if(this.domInstance) {
            var val = Element.getAttributeString(value);
            this.domInstance.setAttribute(key,val);
        }
    }
};

Element.prototype.nodeText = function(value) {
    if(value) {
        return dom.setText(this.domInstance, value);
    } else {
        return dom.text(this.domInstance);
    }
};

Element.getAttributeString = function(value) {
    var result = '';

    if(!object.isDefined(value)) {
        return '';
    }

    if(object.isArray(value)) {
        object.each(value, function(index, part) {
            result += (++index === value.length) ? part : part+' ';
        });
    } else {
        result = value.toString();
    }
    return result;
};

Element.getAttributeValueFromStringList = function(value) {
    if(object.isString(value) && value.indexOf(' ') > -1) {
        return value.split(/[\s]+/);
    } else {
        return value;
    }
};

Element.prototype.addClass = function(newClass) {
    if(!this.attributes.cssClass) {
        this.attributes.cssClass = [];
    }
    object.addValue(this.attributes.cssClass, newClass);
};

Element.prototype.removeClass = function(classToRemove) {
    var index = this.tag.cssClass.indexOf(classToRemove);
    if(index > -1) {
        this.tag.cssClass.splice(index,1);
    }
    return this;
};

Element.prototype.hasClass = function(searchClass) {
    if(this.tag.attributes && this.tag.attributes['class']) {
        return this.tag.attributes['class'].indexOf(searchClass) > -1;
    }
};

Element.prototype.attr = function(attribute) {
    if(arguments.length > 1) {
        //TODO: implement for mor thant 2
        var obj = {};
        obj[arguments[0]] = arguments[1];
        return this.attr(obj);
    } else if(object.isString(attribute)) {
        if(this.attributes) {
            return this.attributes[attribute];
        } else {
            return '';
        }
    } else {
        this.setSecureAttribute(attribute);
    }
    return this;
};

module.exports =  Element;


