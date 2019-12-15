
import { Model } from "./Model";
import isString from "lodash/isString";
import isArray from "lodash/isArray";
import throttle from "lodash/throttle";
import { addBinder, bind, unbind } from './helpers/binder';
import { CompositeKeyWeakMap } from './helpers/CompositeKeyWeakMap';
import { RENDERED_PATH } from './helpers/constants';

export class View extends Model {

    static addBinder(attribute, callback) {
        return addBinder(attribute, callback);
    }

    static addAggregatedEventListener(eventName, element, cb) {

        let callbacks = callbacksByEventElement.get([element, eventName]);

        if (!callbacks) {
            document.addEventListener(eventName, ev => {
                let tgt = ev.target;
                while (tgt) {
                    let callbacks = callbacksByEventElement.get([tgt, eventName]);
                    callbacks && callbacks.forEach(cb => cb && cb(ev));
                    tgt = tgt.parentElement
                }
            })
            callbacks = [];
        }
        callbacks.push(cb);
        callbacksByEventElement.set([element, eventName], callbacks);

        return () => {
            let callbacks = callbacksByEventElement.get([element, eventName]);
            callbacksByEventElement.set([element, eventName], callbacks.filter(c => c != cb));
        }
    }

    static addEventBinder(eventName) {
        View.addBinder(`bind-${eventName}`, function (path, element) {

            let bindingMode = element.getAttribute(`var-${eventName}-mode`) || View.defaultEventMode;

            if (bindingMode == 'aggregated') {

                let cb = ev => this.set(path, ev);
                return View.addAggregatedEventListener(eventName, element, cb);

            } else {
                let fn = (ev) => this.set(path, ev);
                element.addEventListener(eventName, fn);
                return () => element.removeEventListener(eventName, fn);
            }
        })
    }

    constructor(elements) {
        super();
        this.elements = elements || this.elements;
        if (this.elements == 'body') {
            this.render();
        }
    }

    render() {
        let elements = this.elements;

        if (document && elements) {

            if (isString(elements)) {
                if (elements == 'body') {
                    elements = [document.body];
                } else {
                    let div = document.createElement('div');
                    div.innerHTML = elements;
                    elements = Array.from(div.children);
                }
            }

            if (isArray(elements)) {
                let ubs = elements.reduce((unbinders, el) => {
                    let ubs = bind(this, el);
                    return [...unbinders, ...ubs];
                }, []);
                this.onDestroyCallbacks = [...this.onDestroyCallbacks, ...ubs];
            }
        }

        this.set(RENDERED_PATH, true);
    }
}

/// this binder sets the element instance to the property provided
View.addBinder('bind-element', function (prop, element) {
    this.set(prop, element);
})

/// this binder shows or hides element
let showModesMap = {
    'display': {
        show: (el) => {
            if (el.style.getPropertyValue('display') == "none") {
                el.style.removeProperty('display');
            }
        },
        hide: (el) => {
            if (el.style.getPropertyValue('display') != "none") {
                el.style.setProperty('display', 'none');
            }
        }
    },
    'transform': {
        show: (el) => {
            if (el.style.getPropertyValue('transform') == "scale(0)") {
                el.style.setProperty('transform', 'scale(1)');
            }
        },
        hide: (el) => {
            if (el.style.getPropertyValue('transform') == "scale(1)") {
                el.style.setProperty('transform', 'scale(0)');
            }
        }
    },
}
View.addBinder('bind-show', function (prop, element) {
    let showVal = element.getAttribute('var-show-for-value') || true;
    let showMode = element.getAttribute('var-show-mode') || 'display';
    let mode = showModesMap[showMode] || showModesMap['display'];

    mode.hide(element);

    let watchId = this.change(prop, (show) => {
        if (show == showVal) {
            mode.show(element);
        } else {
            mode.hide(element);
        }
    });

    return () => this.unwatch(watchId);
})
View.addBinder('bind-hide', function (prop, element) {
    let hideVal = element.getAttribute('var-hide-for-value') || true;
    let hideMode = element.getAttribute('var-hide-mode') || 'display';
    let mode = showModesMap[hideMode] || showModesMap['display'];

    mode.show(element);

    let watchId = this.change(prop, (hide) => {
        if (hide == hideVal) {
            mode.hide(element);
        } else {
            mode.show(element);
        }
    });

    return () => this.unwatch(watchId);
})

View.addBinder('bind-class', function (prop, element) {
    let prevCls = {};
    let watchId = this.watch(prop, (cls) => {

        Object.keys(prevCls).forEach(cl => prevCls[cl] = false);

        if (isObject(cls)) {
            Object.keys(cls).forEach(cl => prevCls[cl] = cls[cl])
        } else if (isArray(cls)) {
            cls.forEach(cl => prevCls[cl] = true);
        } else if (isString(cls)) {
            prevCls[cls] = true;
        }

        Object.keys(prevCls).forEach(cl => {
            if (prevCls[cl]) {
                element.classList.add(cl);
            } else {
                element.classList.remove(cl);
            }
        });

    });

    return () => this.unwatch(watchId);
})

View.addBinder('bind-text', function (prop, element) {
    let watchId = this.watch(prop, (text) => {
        element.innerText = text
    });

    return () => this.unwatch(watchId);
})

/// this binder sets the element instance to the property provided
View.addBinder('bind-child-elements', function (prop, element) {
    let prevElements = [];
    let watchId = this.watch(prop, (elements) => {

        elements.forEach(el => element.appendChild(el));

        prevElements
            .filter(pel => !elements.find(el => pel == el))
            .forEach(pel => {
                unbind([pel])
                element.removeChild(pel)
            });

        prevElements = [...elements];
    });

    return () => this.unwatch(watchId);
})

const callbacksByEventElement = new CompositeKeyWeakMap();
View.defaultEventMode = 'aggregated';
let b = [
    // keyboard events
    "keydown", "keypress", "keyup",
    // mouse events
    "click", "dblclick", "mousedown", "mouseenter",
    "mouseleave", "mousemove", "mouseout",
    "mouseover", "mouseup", "mousewheel",
    // input events
    "focus", "blur", "change", "submit", "paste",
    // touch events
    "touchstart", "touchend", "touchmove", "touchcancel"
].forEach((eventName) => View.addEventBinder(eventName))

let getValueProperty = (el) => {
    let tagName = el.tagName;
    if (tagName == 'INPUT') {
        let type = el.getAttribute('type');
        if (type == 'checkbox') {
            return "checked";
        }
    } else if (tagName == 'SELECT') {
        return 'values';
    } else if (tagName == "DIV") {
        return 'innerHTML';
    }
    return 'value';
}
View.addBinder('bind-value', function (path, el) {

    let valueProperty = getValueProperty(el);

    var handler = throttle(() => {
        this.set(path, el[valueProperty]);
    }, 100);

    let unbindCbs = ['change', 'keyup'].map((eventName) => {
        // el.addEventListener(eventName, handler);
        return View.addAggregatedEventListener(eventName, el, handler)
    });

    let watchId = this.change(path, function (value) {
        el[valueProperty] = value;
    });

    return () => {
        unbindCbs.forEach(cb => cb && cb());
        this.unwatch(watchId);
    }
});

/// this binder sets the element instance to the property provided
View.addBinder('bind-component', function (prop, element) {

    let prevComponent;
    let watchId = this.watch(prop, (component) => {

        if (!component) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            return;
        } else if (component == prevComponent) {
            return;
        }

        if (!component.get(RENDERED_PATH)) {
            component.render();
        }

        component.elements.forEach(el => element.appendChild(el));

        prevComponent = component;
    });

    return () => this.unwatch(watchId);
})

/// this binder sets the element instance to the property provided
View.addBinder('bind-components', function (prop, element) {
    let prevComponents = [];
    let watchId = this.watch(prop, (components) => {

        if (!components) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            return;
        }

        components.forEach(component => {
            if (!component.get(RENDERED_PATH)) {
                component.render();
            }

            component.elements.forEach(el => element.appendChild(el));
            prevComponents = prevComponents.filter(c => component != c);
        });

        // remove remaining components
        prevComponents.forEach(comp => {
            comp.elements.forEach(el => {
                element.removeChild(el);
            })
        });

        prevComponents = components;
    });

    return () => this.unwatch(watchId);
})