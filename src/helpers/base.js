import _get from "lodash/get";
import _set from "lodash/set";

export function initGetSet(context) {
    context.state = {};
}

export function get(context, path) {
    return _get(context.state, path);
}

export function set(context, path, value) {
    _set(context.state, path, value);
    return context;
}

export function destroyState(context) {
    context.state = undefined;
}