import isUndefined from "lodash/isUndefined";
import isString from "lodash/isString";
import isArray from "lodash/isArray";
import { BaseModel } from "./BaseModel";

let watchInt = 0;

export const WATCH = 'watch'
export const INJECT = 'inject'
export const CHANGE = 'change'
export const OPTIONAL = 'optional'

export class Model extends BaseModel {

    onDestroyCallbacks = []
    queuedPaths = []

    constructor() {
        super();
    }

    async get(path) {

        if (path) {
            return await super.get(path);
        }

        throw "get requires a path";
    }

    set(path, value) {

        if (!isUndefined(path) && !isUndefined(value)) {
            super.set(path, value);
            this.queuePath(path);
        }

        throw "set requires path and value";
    }

    queuePath(path, isSingle) {
        // get all paths
        let allPaths = Object.keys(this.watchesByPath);
        // get matching parents and children
        let matchedPaths = allPaths.filter((wp) => !wp || path == wp || path.startsWith(wp + '.') || wp.startsWith(path + '.'));
        // get all watchIds
        let watches = matchedPaths.flatMap(mp => this.watchesByPath[mp]);

        // filtering for watches with unique callbacks
        let uniqueWatches = watches.filter(wid =>
            !this.queuedWatches.find(qwid => this.watchById[qwid].callback === this.watchById[wid].callback))

        this.queuedWatches = this.queuedWatches.concat(uniqueWatches)

        this.processQueue();
    }

    processQueue() {
        if (!this.isSuspended && this.queuedWatches.length > 0) {

            this.suspend();

            let watchId = this.queuedWatches[0];
            let watch = this.watchById[watchId];
            if (watch) {
                watch.callback(watch.model.get(watch.path));
            }

            this.queuedWatches.shift();

            this.resume();

        }
    }

    suspend() {
        this.isSuspended = true;
    }

    resume() {
        this.isSuspended = false;
        this.processQueue();
    }

    watch(model, path, callback) {
        if (arguments.length == 2) {
            callback = path;
            path = model;
            model = this;
        }

        let watchId;
        if (model === this) {
            watchId = super.watch(path, callback)
            this.queuedWatches.push(watchId);
            this.processQueue();
        } else {
            watchId = model.watch(path, callback)
            this.onDestroyCallbacks.push(() => model.unwatch(watchId))
        }

        return watchId;
    }

    unwatch(watchId) {
        super.unwatch(watchId);
    }

    destroy() {
        this.onDestroyCallbacks.forEach(callback => callback && callback());
        super.destroy();
    }

    getInjectedCallback(pathSets, callback) {
        let models = [];
        let correctedPathSets = pathSets.map(set => {
            if (isString(set)) {
                return [WATCH, this, set, '']
            } else if (isArray(set)) {
                let temp = [...set];
                let res = [];
                let prop;

                prop = temp.shift()
                if (prop === WATCH || prop === CHANGE || prop === INJECT) {
                    res.push(prop);
                    prop = temp.shift()
                } else {
                    res.push(WATCH);
                }

                if (prop === this || prop instanceof Model) {
                    res.push(prop);
                    prop = temp.shift();
                } else {
                    res.push(this);
                }

                let model = res[res.length - 1];
                if (!models.find(m => m === model)) {
                    models.push(model);
                }

                if (isString(prop) && prop !== OPTIONAL) {
                    res.push(prop);
                    prop = temp.shift();
                } else {
                    throw "unexpected path set";
                }

                res.push(prop);
            }
        });

        let self = this;

        return {
            models,
            pathSets: correctedPathSets,
            callback: async function () {
                let args = [];
                for (let set in correctedPathSets) {
                    let val = await self.get(set[2])
                    if (isUndefined(val) && set[3] !== OPTIONAL) {
                        return;
                    }
                    args.push(val);
                }
                return callback.apply(self, args.concat(arguments));
            }
        }
    }

    // [[type:'watch|change|inject',] [model,] path, [isOptional]]
    compose(pathSets, callback) {
        let injectedSet = this.getInjectedCallback(pathSets, callback);

        injectedSet.models.forEach(m => m.suspend());

        let finalCallback = injectedSet.callback;
        // debounce callback because there can be trigger of same callback from multiple models
        if (injectedSet.models > 1) {
            let timeout;
            finalCallback = () => {
                if (timeout) clearTimeout(timeout)
                timeout = setTimeout(injectedSet.callback);
            }
            this.onDestroyCallbacks.push(() => timeout && clearTimeout(timeout));
        }

        let watchIds = injectedSet.pathSets.map(set => {
            if (set[0] === WATCH) {
                return this.watch(set[1], set[2], finalCallback);
            } else if (set[0] === CHANGE) {
                return this.change(set[1], set[2], finalCallback);
            }
        })

        injectedSet.models.forEach(m => m.resume());

        return watchIds;
    }

    inject(paths, callback, targetPath) {
        // callback.apply(this, paths.map(path => this.get(path)));
        let injectedCallback = this.getInjectedCallback(paths, callback).callback;

        if (targetPath && isString(targetPath)) {
            this[targetPath] = injectedCallback;
        }

        return injectedCallback;
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