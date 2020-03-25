import { Model } from "./Model.js";
import { CompositeKeyWeakMap } from "./helpers/CompositeKeyWeakMap.js";

const importedContentByUrl = new Map();

const importContent = async url => {
    let content = importedContentByUrl.get(url);
    if (!content) {
        let res = await fetch(url);
        if (res.status < 400) {
            content = await res.text();
            importedContentByUrl.set(url, content);
        }
    }
    return content;
};

const binderByAttribute = new Map();
let binderSelector = "";
let bindersList = "";

export class View extends Model {
    constructor() {
        super();
        this.elementDestroyCallbacks = [];
        this.destroyCallbacks.push(() => {
            this.elementDestroyCallbacks && this.elementDestroyCallbacks.forEach(callback => callback && callback());
        });
    }

    async render() {
        if (this.$$renderLock) {
            return await this.$$renderLock;
        } else {
            this.$$renderLock = new Promise(res => {
                let watchID = this.watch("rendered", () => {
                    res(this.elements);
                    this.unwatch(watchID);
                });
            });
        }

        let { tagName, html, htmlUrl, elements, name, css, cssUrl, styleElement } = this;

        if (!elements) {
            if (html) {
            } else if (htmlUrl) {
                html = await importContent(htmlUrl);
            }

            let element = document.createElement(tagName || "div");
            element.innerHTML = html;

            View.attachBinders(this, element);

            elements = this.elements = Array.from(element.children);
            elements.forEach(el => el.classList.add(name));
        }

        if (!styleElement) {
            if (css) {
            } else if (cssUrl) {
                css = await importContent(cssUrl);
            }

            if (css) {
                styleElement = this.styleElement = document.createElement("style");
                // styleElement.id = `august-style-${name}`;
                styleElement.innerHTML = css;
                element.appendChild(styleElement);
            }
        }

        this.rendered = true;

        return elements;
    }

    static addBinder(tagName, callback) {
        binderByAttribute.set(tagName, callback);
        // console.log("View -> addBinder -> binderByAttribute", binderByAttribute);
        bindersList = Array.from(binderByAttribute.keys());
        binderSelector = `[${bindersList.join("],[")}]`;
    }

    static attachBinders(context, baseElement) {
        let elementsToBeBound = Array.from(baseElement.querySelectorAll(binderSelector));
        let elementDestroyCallbacks = context.elementDestroyCallbacks;
        if (elementDestroyCallbacks) {
            elementDestroyCallbacks.forEach(callback => callback && callback());
        }
        elementDestroyCallbacks = context.elementDestroyCallbacks = [];
        bindersList.forEach(attributeName => {
            elementsToBeBound.forEach(el => {
                if (el.hasAttribute(attributeName)) {
                    let prop = el.getAttribute(attributeName);
                    let callback = binderByAttribute.get(attributeName);
                    elementDestroyCallbacks.push(callback.call(context, prop, el));
                }
            });
        });
    }

    static addAggregatedEventListener(eventName, element, cb) {
        let callbacks = callbacksByEventElement.get([element, eventName]);

        if (!callbacks) {
            document.addEventListener(eventName, ev => {
                // let tgt = ev.target;
                // while (tgt) {
                //     let callbacks = callbacksByEventElement.get([tgt, eventName]);
                //     callbacks && callbacks.forEach(cb => cb && cb(ev));
                //     tgt = tgt.parentElement;
                // }
                Array.from(ev.path).forEach(tgt => {
                    let callbacks = callbacksByEventElement.get([tgt, eventName]);
                    callbacks && callbacks.forEach(cb => cb && cb(ev));
                });
            });
            callbacks = [];
        }
        callbacks.push(cb);
        callbacksByEventElement.set([element, eventName], callbacks);

        return () => {
            let callbacks = callbacksByEventElement.get([element, eventName]);
            callbacksByEventElement.set(
                [element, eventName],
                callbacks.filter(c => c != cb)
            );
        };
    }

    static addEventBinder(eventName) {
        View.addBinder(`bind-${eventName}`, function(path, element) {
            let bindingMode = element.getAttribute(`var-${eventName}-mode`) || View.defaultEventMode;
            // console.log("View -> addEventBinder -> path, element", path, element);

            let cb = ev => {
                // console.log("View -> addEventBinder -> cb -> path, element", path, element);
                this.set(path, ev);
            };
            if (bindingMode == "aggregated") {
                return View.addAggregatedEventListener(eventName, element, cb);
            } else {
                // let fn = ev => this.set(path, ev);
                element.addEventListener(eventName, cb);
                return () => element.removeEventListener(eventName, cb);
            }
        });
    }
}

/// this binder sets the element instance to the property provided
View.addBinder("bind-element", function(prop, element) {
    this.set(prop, element);
});

/// this binder shows or hides element
let showModesMap = {
    display: {
        show: el => {
            if (el.style.getPropertyValue("display") == "none") {
                el.style.removeProperty("display");
            }
        },
        hide: el => {
            if (el.style.getPropertyValue("display") != "none") {
                el.style.setProperty("display", "none");
            }
        }
    },
    transform: {
        show: el => {
            if (el.style.getPropertyValue("transform") == "scale(0)") {
                el.style.setProperty("transform", "scale(1)");
            }
        },
        hide: el => {
            if (el.style.getPropertyValue("transform") == "scale(1)") {
                el.style.setProperty("transform", "scale(0)");
            }
        }
    }
};

View.addBinder("bind-show", function(prop, element) {
    let showVal = element.getAttribute("var-show-for-value") || true;
    let showMode = element.getAttribute("var-show-mode") || "display";
    let mode = showModesMap[showMode] || showModesMap["display"];

    mode.hide(element);

    let watchId = this.change(prop, show => {
        if (show == showVal) {
            mode.show(element);
        } else {
            mode.hide(element);
        }
    });

    return () => this.unwatch(watchId);
});

View.addBinder("bind-hide", function(prop, element) {
    let hideVal = element.getAttribute("var-hide-for-value") || true;
    let hideMode = element.getAttribute("var-hide-mode") || "display";
    let mode = showModesMap[hideMode] || showModesMap["display"];

    mode.show(element);

    let watchId = this.change(prop, hide => {
        if (hide == hideVal) {
            mode.hide(element);
        } else {
            mode.show(element);
        }
    });

    return () => this.unwatch(watchId);
});

View.addBinder("bind-class", function(prop, element) {
    let prevCls = {};
    let watchId = this.watch(prop, cls => {
        Object.keys(prevCls).forEach(cl => (prevCls[cl] = false));

        if (isObject(cls)) {
            Object.keys(cls).forEach(cl => (prevCls[cl] = cls[cl]));
        } else if (isArray(cls)) {
            cls.forEach(cl => (prevCls[cl] = true));
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
});

View.addBinder("bind-text", function(prop, element) {
    let watchId = this.watch(prop, text => {
        element.innerText = text;
    });

    return () => this.unwatch(watchId);
});

/// this binder sets the element instance to the property provided
View.addBinder("bind-child-elements", function(prop, element) {
    let prevElements = [];
    let watchId = this.watch(prop, elements => {
        elements.forEach(el => element.appendChild(el));

        prevElements
            .filter(pel => !elements.find(el => pel == el))
            .forEach(pel => {
                unbind([pel]);
                element.removeChild(pel);
            });

        prevElements = [...elements];
    });

    return () => this.unwatch(watchId);
});

const callbacksByEventElement = new CompositeKeyWeakMap();
View.defaultEventMode = "aggregated";
let b = [
    // keyboard events
    "keydown",
    "keypress",
    "keyup",
    // mouse events
    "click",
    "dblclick",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "mousewheel",
    // input events
    "input",
    "focus",
    "blur",
    "change",
    "submit",
    "paste",
    // touch events
    "touchstart",
    "touchend",
    "touchmove",
    "touchcancel"
].forEach(eventName => View.addEventBinder(eventName));

let getValueProperty = el => {
    let tagName = el.tagName;
    if (tagName == "INPUT") {
        let type = el.getAttribute("type");
        if (type == "checkbox") {
            return "checked";
        }
    } else if (tagName == "SELECT") {
        return "values";
    } else if (tagName == "DIV") {
        return "innerHTML";
    }
    return "value";
};
View.addBinder("bind-value", function(path, el) {
    let valueProperty = getValueProperty(el);

    // var handler = throttle(() => {
    //     this.set(path, el[valueProperty]);
    // }, 100);
    let handler = () => {
        this.set(path, el[valueProperty]);
    };

    let unbindCbs = ["input"].map(eventName => {
        // el.addEventListener(eventName, handler);
        return View.addAggregatedEventListener(eventName, el, handler);
    });

    let watchId = this.change(path, function(value) {
        el[valueProperty] = value;
    });

    return () => {
        unbindCbs.forEach(cb => cb && cb());
        this.unwatch(watchId);
    };
});

/// this binder sets the element instance to the property provided
View.addBinder("bind-component", function(prop, element) {
    let prevComponent;
    let watchId = this.change(prop, async component => {
        console.log("component", component, prop, element);

        if (component != prevComponent) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        } else if (component == prevComponent) {
            return;
        }
        if (!component) return;

        let { elements } = component;
        console.log("elements", elements);
        if (!elements) {
            elements = await component.render();
            console.log("elements", elements);
        }

        elements.forEach(el => element.appendChild(el));

        prevComponent = component;
    });

    return () => this.unwatch(watchId);
});

/// this binder sets the element instance to the property provided
View.addBinder("bind-components", function(prop, element) {
    let prevComponents = [];
    let watchId = this.watch(prop, components => {
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
            });
        });

        prevComponents = components;
    });

    return () => this.unwatch(watchId);
});
