import { Model } from "./Model";

let HTMLElement = (window && window.HTMLElement) || class {};

export class ModelElement extends HTMLElement {
    constructor() {
        super();
        Model.prototype.init.call(this);
    }

    get(path) {
        return Model.prototype.get.call(this, path);
    }

    set(path, value) {
        return Model.prototype.set.call(this, path, value);
    }

    wrap(path) {
        return Model.prototype.wrap.call(this, path);
    }

    trigger(path, watch) {
        return Model.prototype.trigger.call(this, path, watch);
    }

    addListener(listener, prop) {
        return Model.prototype.addListener.call(this, listener, prop);
    }

    removeListener(listener, prop) {
        return Model.prototype.removeListener.call(this, listener, prop);
    }

    watch(path, callback, behaviour) {
        return Model.prototype.watch.call(this, path, callback, behaviour);
    }

    // syntax path or path!change
    watchAll(watches, callback) {
        return Model.prototype.watchAll.call(this, watches, callback);
    }

    change(path, callback) {
        return Model.prototype.change.call(this, path, callback);
    }

    unwatch(identifier) {
        return Model.prototype.unwatch.call(this, identifier);
    }

    destroy() {
        return Model.prototype.destroy.call(this);
    }
}
