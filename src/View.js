
import { Model } from "./Model";
import isString from "lodash/isString";
import isArray from "lodash/isArray";
import throttle from "lodash/throttle";
import { addBinder, initializeBinders } from "./helpers/binder";

export class View extends Model {

    static addBinder(attribute, callback) {
        return addBinder(attribute, callback);
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

        if (isString(elements) && document && document.body) {
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
                let ubs = initializeBinders(this, el);
                return [...unbinders, ...ubs];
            }, []);
            this.onDestroyCallbacks = [...this.onDestroyCallbacks, ...ubs];
        }

        this.set('_internal.rendered', true);
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
    let watchId = this.change(prop, (show) => {
        if (show == showVal) {
            mode.show();
        } else {
            mode.hide();
        }
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
            .filter(el => elements.indexOf(el) < 0)
            .forEach(el => element.removeChild(el));

        prevElements = [...elements];
    });

    return () => this.unwatch(watchId);
})

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
].forEach(eventName => {
    View.addBinder(`bind-${eventName}`, function (path, element) {
        let fn = ev => this.set(path, ev);
        element.addEventListener(eventName, fn);

        return () => element.removeEventListener(eventName, fn);
    })
})

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

    ['change', 'keyup'].forEach((eventName) => {
        el.addEventListener(eventName, handler);
    });

    this.change(path, function (value) {
        el[valueProperty] = value;
    });

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

        if (!component.get('_internal.rendered')) {
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
            if (!component.get('_internal.rendered')) {
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