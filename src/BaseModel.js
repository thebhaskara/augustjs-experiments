import get from "lodash/get";
import set from "lodash/set";

let watchInt = 0;

export class BaseModel {

    state = {}
    watchById = {}
    watchesByPath = {}

    get(path) {
        return get(this.state, path);
    }

    set(path, value) {
        set(this.state, path, value);
    }

    watch(path, callback) {
        let watchId = 'watch' + watchInt++;
        this.watchById[watchId] = { watchId, model: this, path, callback };
        let watchesByPath = this.watchesByPath[path] || (this.watchesByPath[path] = []);
        watchesByPath.push(watchId);
        return watchId;
    }

    unwatch(watchId) {
        let watch = this.watchById[watchId];
        this.watchesByPath[watch.path] = this.watchesByPath[watch.path].filter(id => id != watchId);
        delete this.watchById[watchId]
    }

    destroy() {
        this.watchById = {};
        this.watchesByPath = {};
        this.state = {};
    }
}