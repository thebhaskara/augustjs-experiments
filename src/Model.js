import {
    queueWatchesForPath,
    suspend,
    resume,
    watch,
    unwatch,
    destroyWatches
} from './helpers/watch';
import { initGetSet, get, set, destroyState } from './helpers/base';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import isFunction from 'lodash/isFunction';
import { formatCallback } from './helpers/inject';
import { WATCH, CHANGE } from './helpers/constants';



export class Model {

    constructor() {
        this.onDestroyCallbacks = [];
        initGetSet(this);
    }

    get(path) {

        if (path) {
            if (isArray(path)) {
                return path.map(p => this.get(p));
            } else {
                return get(this, path);
            }
        }

    }

    set(path, value) {

        if (!isUndefined(path) && !isUndefined(value)) {
            set(this, path, value);
            queueWatchesForPath(this, path);
        }

    }

    suspend() {
        suspend(this);
    }

    resume() {
        resume(this);
    }

    watch(model, path, callback) {
        if (arguments.length == 2) {
            callback = path;
            path = model;
            model = this;
        }

        let watchId;
        if (model === this) {
            watchId = watch(this, path, callback)
        } else {
            watchId = model.watch(path, callback)
            this.onDestroyCallbacks.push(() => model.unwatch(watchId))
        }

        return watchId;
    }

    unwatch(identifier) {
        unwatch(context, identifier);
    }

    destroy() {
        this.onDestroyCallbacks.forEach(callback => callback && callback());
        destroyState(this);
        destroyWatches(this);
    }

    // [[type:'watch|change|inject',] [model,] path, [isOptional]]
    compose(pathSets, callback) {
        let formatted = formatCallback(this, pathSets, callback, Model);

        formatted.watchedModels.forEach(m => m.suspend());

        let watchIds = formatted.pathSets.map(set => {
            if (set[0] === WATCH) {
                return this.watch(set[1], set[2], formatted.injectedCallback);
            } else if (set[0] === CHANGE) {
                return this.change(set[1], set[2], formatted.injectedCallback);
            }
        }).filter(id => id);

        formatted.watchedModels.forEach(m => m.resume());

        return watchIds;
    }

    inject(pathSets, callback) {

        if (isString(callback)) {
            let targetPath = callback;
            if (isFunction(this[targetPath])) {
                return this[targetPath] = this.inject(pathSets, this[targetPath]);
            }
        } else {
            let formatted = formatCallback(this, pathSets, callback, Model);
            return formatted.injectedCallback;
        }
    }

    change(model, path, callback) {

        if (arguments.length == 2) {
            callback = path;
            path = model;
            model = this;
        }

        let prevVal = model.get(path);

        return this.watch(model, path, (currentVal) => {
            if (currentVal != prevVal) {
                callback(currentVal, prevVal);
                prevVal = currentVal;
            }
        });
    }
}