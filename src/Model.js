import get from "lodash/get";
import set from "lodash/set";
import isUndefined from "lodash/isUndefined";
import isString from "lodash/isString";
import isArray from "lodash/isArray";

let watchInt = 0;

export const WATCH = 'watch'
export const INJECT = 'inject'
export const CHANGE = 'change'
export const OPTIONAL = 'optional'

export class Model {

    constructor() {
        this.state = {};
        this._watchById = {};
        this._watchesByPath = {};
        this.onDestroyCallbacks = [];
    }

    get(path) {
        if (path) {
            return get(this.state, path);
        } else {
            return this.state;
        }
    }

    set(path, value) {
        if (arguments.length == 1) {
            value = path;
            path = '';
            this.state = value;
        } else {
            set(this.state, path, value);
        }
        this.trigger(path);
    }

    trigger(path) {
        let paths = Object.keys(this._watchesByPath)
            .filter((wp) => !wp || path == wp || path.startsWith(wp + '.') || wp.startsWith(path + '.'));
        let watches = paths.reduce((watches, path) => watches.concat(this._watchesByPath[path]), []);
        watches.forEach((watchId) => {
            let watch = this._watchById[watchId];
            if (watch) {
                watch.callback(watch.model.get(watch.path));
            }
        })
    }

    watch(model, path, callback, skipImmediateTrigger) {
        if (arguments.length == 2) {
            callback = path;
            path = model;
            model = this;
        }

        let watchId = 'watch' + watchInt++;
        let watches = model._watchesByPath[path] || (model._watchesByPath[path] = []);
        watches.push(watchId);
        model._watchById[watchId] = { watchId, model, path, callback };

        let val;
        if (!skipImmediateTrigger && !isUndefined(val = model.get(path))) {
            callback(val);
        }

        if (model != this) {
            this.onDestroyCallbacks.push(() => model.unwatch(watchId));
        }

        return watchId;
    }

    unwatch(watchId) {
        let watch = this._watchById[watchId];
        this._watchesByPath[watch.path] = this._watchesByPath[watch.path].filter(id => id != watchId);
        delete this._watchById[watchId]
    }

    destroy() {
        this.onDestroyCallbacks.forEach(callback => callback && callback());
        this._watchById = {};
        this._watchesByPath = {};
        this.state = {};
    }

    inject(paths, callback) {
        callback.apply(this, paths.map(path => this.get(path)));
    }

    change(model, path, callback, skipImmediateTrigger) {
        if (arguments.length == 2) {
            callback = path;
            path = model;
            model = this;
        }

        let prevVal = model.get(path);
        this.watch(model, path, (currentVal) => {
            if (currentVal != prevVal) {
                callback(currentVal, prevVal);
                prevVal = currentVal;
            }
        }, skipImmediateTrigger)
    }

    // [[type:'watch|change|inject',] [model,] path, [isOptional]]
    compose(list, callback) {
        // adjusting optional parameters
        list = list.map(arr => {
            if (isString(arr)) {
                return [WATCH, this, arr, false];
            } else if (isArray(arr)) {
                let res = [];

                if (arr[0] == WATCH || arr[0] == INJECT || arr[0] == CHANGE) {
                    res.push[arr[0]];
                    arr.unshift(arr);
                } else {
                    res.push(WATCH);
                }

                if (isString(arr[0])) {
                    res.push(this);
                    res.push(arr[0]);
                    res.push(arr[1]);
                } else {
                    res.push(arr[0]);
                    res.push(arr[1]);
                    res.push(arr[2]);
                }

                return res;
            }
        })

        // making injected callback
        let injectedCallback = () => {
            // get all argument values
            let args = list.map(arr => arr[1].get(arr[2]));

            // check for validity of value based on 'optional' provided.
            let valid = true;
            args.forEach((arg, index) => {
                if (isUndefined(arg) && list[index][3] != OPTIONAL) {
                    valid = false;
                    return false;
                }
            })

            if (valid) {
                // call the callback when all argument values are valid.
                callback.apply(this, args);
            }
        }

        // register all watch and change events
        list.forEach(arr => {
            if (arr[0] == WATCH) {
                this.watch(arr[1], arr[2], injectedCallback, true);
            } else if (arr[0] == CHANGE) {
                this.change(arr[1], arr[2], injectedCallback, true);
            }
        });

        // trigger immediate so that if all data is ready, callback can be called.
        injectedCallback();
    }
}