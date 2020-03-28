const isUndefined = (v) => v === undefined || v === null;

export class CompositeKeyWeakMap {

    constructor() {
        this._weakMap = new WeakMap();
    }

    set(keys, value) {
        let map = this._weakMap;

        for (let i = 0, len = keys.length - 1; i < len; i++) {
            const key = keys[i];
            let next = map.get(key);

            if (!next) {
                next = new Map();
                map.set(key, next);
            }

            map = next;
        }

        map.set(keys[keys.length - 1], value);
    }

    get(keys) {
        let next = this._weakMap;

        for (let i = 0, len = keys.length; i < len; i++) {
            next = next.get(keys[i]);

            if (isUndefined(next)) {
                break;
            }
        }

        return next;
    }

    has(keys) {
        return !isUndefined(this.get(keys));
    }

    delete(keys) {
        let map = this._weakMap;
        const paths = [map];

        for (let i = 0, len = keys.length - 1; i < len; i++) {
            const next = map.get(keys[i]);
            if (!next) return;
            paths.push(next);
            map = next;
        }

        let key, p;
        while ((p = paths.pop(), key = keys.pop())) {
            if (!p) break;
            p.delete(key);
            if (p.size) break;
        }
    }
}