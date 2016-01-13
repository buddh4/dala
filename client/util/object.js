module.exports = {
    each: function() {
        return $.each(arguments[0], arguments[1], arguments[2]);
    },

    grep: function(arr, filter, invert) {
        return $.grep(arr, filter, invert);
    },

    isOneOf: function(search) {
        var i;
        for(i = 1;i < arguments.length;i++) {
          if(search === arguments[i]) {
              return true;
          }
        }
        return false;
    },

    isArray: function(obj) {
        return $.isArray(obj);
    },

    toArray : function(obj) {
        return $.map(obj, function(value, index) {
            return [value];
        });
    },

    removeFromArray: function(arr, item) {
        var index = arr.indexOf(item);
        if(index >= 0) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    },

    sort: function(obj, sort) {
        var arr;
        if(!obj) {
            return;
        } else if(this.isArray(obj)) {
            arr = obj;
        } else if(this.isObject(obj)) {
            arr = $.map(obj, function (index, val) {
                return obj[val];
            });
        }

        return arr.sort(sort);
    },

    valueByIndex: function(arr, index) {
        var index = this.getIndex(arr,index);
        return arr[index];
    },

    getIndex: function(arr, index) {
        var result = index;
        // for negative indexes we return values counted from the other side so -1 is the last index
        // if the negative index is out of range we return the last index.
        if(index < 0) {
            result = arr.length + index;
            result = (result > arr.length -1 || result < 0) ? arr.length -1 : result;
        }
        return result;
    },

    isFunction: function(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    },

    isObject: function(obj) {
        return $.isPlainObject(obj);
    },

    isJQuery: function(obj) {
        return obj.jquery;
    },

    isString: function(obj) {
        return typeof obj === 'string';
    },

    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    isBoolean: function(obj) {
        return typeof obj === 'boolean';
    },

    isDefined: function(obj) {
        if(arguments.length > 1) {
            var result = true;
            var that = this;
            this.each(arguments, function(index, value) {
                if(!that.isDefined(value)) {
                    result = false;
                    return false;
                }
            });

            return result;
        }
        return typeof obj !== 'undefined';
    },

    merge: function(target, toMerge) {
        return $.merge(target, toMerge);
    },


    addValue: function(target, newVal) {
        if(isArray(newVal)) {
            merge(target);
        } else {
            target.push(newVal);
        }
    },

    extend: function(target, obj1, obj2) {
        return $.extend(target,obj1,obj2);
    },

    cloneArray: function(arr) {
        return arr.slice(0);
    },

    cloneObject: function(oldObject, deep) {
        deep = deep || false;
        return $.extend(deep, {}, oldObject);
    }
    
};