
import { Model } from "./Model";
import isString from "lodash/isString";
import throttle from "lodash/throttle";

let binders = {};
let binderInfosByElement = new WeakMap();

function initializeBinders(context, rootElement) {
    let attributes = Object.keys(binders);
    let selector = '[' + attributes.join('], [') + ']';
    let elementsThatNeedBinding = [];
    if (rootElement.matches(selector)) {
        elementsThatNeedBinding.push(rootElement);
    }
    elementsThatNeedBinding = elementsThatNeedBinding.concat(Array.from(rootElement.querySelectorAll(selector)));

    attributes.forEach(attribute => {
        elementsThatNeedBinding.forEach(el => {
            if (el.hasAttribute(attribute)) {
                let attributeBinders = binders[attribute];
                attributeBinders.forEach((binder, index) => {
                    let infos = binderInfosByElement.get(el) || [];
                    let binderInfo = { attribute, index, context };
                    if (!infos.find(info =>
                        info.attribute == binderInfo.attribute &&
                        info.index == binderInfo.index &&
                        info.context == binderInfo.context)) {
                        binderInfo.unbind = binder.call(context, el.getAttribute(attribute), el);
                        context.onDestroyCallbacks.push(binderInfo.unbind);
                        infos.push(binderInfo);
                        binderInfosByElement.set(el, infos);
                    }
                });
            }
        })
    })
}

export class View extends Model {

    static addBinder(attribute, callback) {
        let attributeBinders = binders[attribute] || (binders[attribute] = []);
        attributeBinders.push(callback);
    }

    constructor(elements) {
        super();
        elements = elements || this.elements;

        if (isString(elements)) {
            let div = document.createElement('div');
            div.innerHTML = elements;
            elements = Array.from(div.children);
        }

        if (elements) {
            elements.forEach(el => initializeBinders(this, el));
        }
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