var DragConfig = function() {
    this.hooks = {};
};

DragConfig.prototype.xOnly = function() {
    this.hooks.restrictionY = function(event, dx, dy) {
        return 0;
    };
    return this;
};

DragConfig.prototype.yOnly = function() {
    this.hooks.restrictionX = function(event, dx, dy) {
        return 0;
    };
    return this;
};

DragConfig.prototype.getScale = function(gsHook) {
    this.hooks.getScale = gsHook;
    return this;
};

DragConfig.prototype.dragMove = function(drmHook) {
    this.hooks.dragMove = drmHook;
    return this;
};

DragConfig.prototype.dragStart = function(drsHook) {
    this.hooks.dragStart = drsHook;
    return this;
};

DragConfig.prototype.dragEnd = function(dreHook) {
    this.hooks.dragEnd = dreHook;
    return this;
};

DragConfig.prototype.get = function() {
    return this.hooks;
};

module.exports = DragConfig;