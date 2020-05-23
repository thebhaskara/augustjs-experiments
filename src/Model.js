function isPrimitive(test) {
    return test !== Object(test);
}

let HTMLElement = (window && window.HTMLElement) || class {};

export class Model extends HTMLElement {
    constructor() {
        super();
        // TODO: change this to private
        this.$$watchesByPath = {};
        this.$$modelOnPath = {};
        this.$$listeners = [];
        this.$$destroyCallbacks = [];
        this.$$lockByCallback = new WeakMap();
        this.$$prevValueMap = new Map();
    }

    get(path) {
        let props = path.split(".");

        let result = this;

        for (let i = 0, len = props.length; i < len; i++) {
            let prop = props[i];
            let value = result[prop];

            if (isPrimitive(value) && i < len - 1) {
                return;
            } else {
                result = result[prop];
            }
        }

        return result;
    }

    set(path, value) {
        let props = path.split(".");

        let result = this;

        for (let i = 0, len = props.length; i < len - 1; i++) {
            let prop = props[i];
            let _value = result[prop];

            if (isPrimitive(_value)) {
                _value = result[prop] = new Model();
            }

            result = _value;
        }

        let prop = props.pop();
        result[prop] = value;

        if (props.length > 1) {
            let descriptor = Object.getOwnPropertyDescriptor(result, prop);
            if (!descriptor || !descriptor.get) {
                this.trigger(path);
            }
        }
    }

    wrap(path) {
        let props = path.split(".");
        let prop = props.shift();

        let descriptor = Object.getOwnPropertyDescriptor(this, prop);

        if (!descriptor || !descriptor.get) {
            // set activity while initializing was not attaching listeners
            // because the values are same
            let prevvalue = this[prop];
            let value;// = this[prop];
            Object.defineProperty(this, prop, {
                get: () => value,
                set: _value => {
                    if (value != _value && value instanceof Model) {
                        value.removeListener(this, prop);
                    }

                    if (value != _value && _value instanceof Model) {
                        _value.addListener(this, prop);
                        this.$$modelOnPath[prop] = _value;

                        // achieves reccursive wrapping and watching
                        Object.keys(this.$$watchesByPath)
                            .filter(_path => _path.startsWith(`${prop}.`))
                            .map(p => p.replace(`${prop}.`, ""))
                            // .forEach(path => _value.watch(path, () => {}));
                            .forEach(path => _value.wrap(path));
                    } else {
                        this.$$modelOnPath[prop] = false;
                    }

                    value = _value;

                    this.trigger(prop);
                }
            });

            this[prop] = prevvalue;
        }
    }

    trigger(path, watch) {
        let callback = ({ path, callback, behaviour }) => {
            let prevValue = this.$$prevValueMap.get(path);
            let value = this.get(path);
            if (behaviour == "change") {
                if (value !== prevValue) {
                    callback(value);
                }
                // need to trigger if value is changing to undefined
            } else if (value !== prevValue || value !== undefined) {
                callback(value);
            }
            this.$$prevValueMap.set(path, value);
            this.$$lockByCallback.set(callback, false);
        };

        if (watch) {
            callback(watch);
            return;
        }

        // filtering watches
        let watches = Object.keys(this.$$watchesByPath)
            // .filter(_path => _path == path || _path.startsWith(`${path}.`) || path.startsWith(`${_path}.`))
            .filter(_path => _path == path)
            .flatMap(p => this.$$watchesByPath[p]);

        // executing watches
        watches.forEach(callback);

        // propagating to listeners
        this.$$listeners.forEach(({ listener, prop }) => listener.trigger(`${prop}.${path}`));
    }

    addListener(listener, prop) {
        this.$$listeners.push({ listener, prop });
    }

    removeListener(listener, prop) {
        this.$$listeners = this.$$listeners.filter((_listener, _prop) => _listener != listener || _prop != prop);
    }

    watch(path, callback, behaviour) {
        let watches = (this.$$watchesByPath[path] = this.$$watchesByPath[path] || []);
        let watch = { path, callback, behaviour };
        watches.push(watch);
        this.wrap(path);
        this.trigger(path, watch);
        return watch;
    }

    change(path, callback) {
        return this.watch(path, callback, "change");
    }

    unwatch(identifier) {
        let watches = this.$$watchesByPath[identifier];
        if (watches) {
            this.$$watchesByPath[identifier] = [];
        } else {
            Object.keys(this.$$watchesByPath).forEach(path => {
                this.$$watchesByPath[path] = this.$$watchesByPath[path].filter(watch => watch !== identifier && watch.callback !== identifier);
            });
        }
    }

    destroy() {
        this.$$destroyCallbacks && this.$$destroyCallbacks.forEach(callback => callback && callback());
        Object.keys(this.$$modelOnPath).forEach(path => {
            let model = this.$$modelOnPath[path];
            model && model.removeListener(this, path);
        });
        this.$$watchesByPath = {};
        this.$$listeners = [];
    }
}
