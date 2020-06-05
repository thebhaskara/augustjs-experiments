import { Model } from "./Model.js";
import { CompositeKeyWeakMap } from "./helpers/CompositeKeyWeakMap.js";
import { ModelElement } from "./ModelElement";

const importedContentByUrl = new Map();

const importContent = async (url) => {
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

const classGeneratorMap = {};

export class ViewElement extends ModelElement {
    constructor() {
        super();
        this.$$elementDestroyCallbacks = [];
        this.$$destroyCallbacks.push(() => {
            this.$$elementDestroyCallbacks &&
                this.$$elementDestroyCallbacks.forEach((callback) => callback && callback());
        });
    }

    async connectedCallback() {
        if (this.$$renderLock) {
            return await this.$$renderLock;
        } else {
            this.$$renderLock = new Promise((res) => {
                let watchID = this.watch("rendered", () => {
                    res(this.elements);
                    this.unwatch(watchID);
                });
            });
        }

        let { tagName, html, htmlUrl, elements, css, cssUrl, styleElement, shadow } = this;

        let el = this;

        if (!elements) {
            if (html) {
            } else if (htmlUrl) {
                html = await importContent(htmlUrl);
            }

            if (shadow) {
                el = this.attachShadow({ mode: shadow });
            }
            el.innerHTML = html;

            let host = el.firstChild;
            if (host.tagName == "HOST") {
                while (host.firstChild) {
                    el.appendChild(host.firstChild);
                }

                for (let i = 0, atts = host.attributes, n = atts.length; i < n; i++) {
                    // arr.push(atts[i].nodeName);
                    var attributeName = atts[i].nodeName;
                    if (attributeName == "class") {
                        this.className = this.className + " " + host.className;
                        // Array.from(host.classList).forEach(cls => this.classList.add(cls))
                    } else if (!host.hasAttribute(attributeName)) {
                        this.setAttribute(attributeName, host.getAttribute(attributeName));
                    }
                }

                host.remove();
            }
            // this.removeChild(host);
        }

        if (!shadow) {
            styleElement = styleElement || document.getElementById(`august-style-${tagName}`);
        }

        if (!styleElement) {
            if (css) {
            } else if (cssUrl) {
                css = await importContent(cssUrl);
            }

            if (css) {
                styleElement = this.styleElement = document.createElement("style");
                styleElement.innerHTML = css;
                if (shadow) {
                    el.appendChild(styleElement);
                } else {
                    styleElement.id = `august-style-${tagName}`;
                    document.head.appendChild(styleElement);
                }
            }

            // if (html && View.classGeneratorMap) {
            //     let classList = html.matchAll(/class[\s]*=[\s]*["']([^"']+)["']/g);
            //     classList = Array.from(classList).flatMap((m) => m[1].split(/[\s]+/g));
            //     classList = classList.filter((c) => View.classGeneratorMap[c.split(":")[0]]);
            //     classList = classList.filter((c, i, arr) => arr.indexOf(c) == i);
            //     classList = classList.map((c) => View.getClassString(c)).join("");
            //     let style;
            //     if (shadow) {
            //         style = document.createElement("style");
            //         el.appendChild(style);
            //     } else {
            //         style = document.getElementById("august-auto-generated-classes");
            //         if (!style) {
            //             style = document.createElement("style");
            //             style.id = "august-auto-generated-classes";
            //             document.head.appendChild(style);
            //         }
            //     }
            //     style.innerHTML = classList;
            // }
        }

        ViewElement.attachBinders(this, el);
        this.rendered = true;

        Array.from(this.attributes).forEach((attr) => this.attributeChangedCallback(attr.name, attr.value));
        return this;
    }

    attributeChangedCallback(attributeName, value) {
        if (value == "true") {
            value = true;
        } else if (value == "false") {
            value = false;
        } else if (Number.isFinite(+value)) {
            value = +value;
        }
        this[attributeName] = value;
    }

    static getClassString(className) {
        let map = ViewElement.classGeneratorMap || classGeneratorMap;

        let str = "";
        let arr = className.split(":");

        if (arr.length > 0) {
            let fn = map[arr[0]];
            if (fn) {
                str = fn.call(...arr);
            }
        }

        if (str) {
            return `.${className.replace(/\:/g, "\\:")}{${str}}`;
        } else {
            return "";
        }
    }

    static addBinder(tagName, callback) {
        binderByAttribute.set(tagName, callback);
        // console.log("View -> addBinder -> binderByAttribute", binderByAttribute);
        bindersList = Array.from(binderByAttribute.keys());
        binderSelector = `[${bindersList.join("],[")}]`;
    }

    // static attachBinders(context, baseElement) {
    static attachBinders(element, baseElement) {
        let elementsToBeBound = [element, ...Array.from(baseElement.querySelectorAll(binderSelector))];
        let elementDestroyCallbacks = element.$$elementDestroyCallbacks;
        if (elementDestroyCallbacks) {
            elementDestroyCallbacks.forEach((callback) => callback && callback());
        }
        elementDestroyCallbacks = element.$$elementDestroyCallbacks = [];
        bindersList.forEach((attributeName) => {
            elementsToBeBound.forEach((el) => {
                if (el.hasAttribute(attributeName)) {
                    let prop = el.getAttribute(attributeName);
                    let callback = binderByAttribute.get(attributeName);
                    // if (el.tagName.toLowerCase() == "host") {
                    //     el = element;
                    // }
                    elementDestroyCallbacks.push(callback.call(element, prop, el));
                }
            });
        });
    }

    static addAggregatedEventListener(eventName, element, cb) {
        // should help for shadow components
        let doc = element.getRootNode() || document;
        let callbacks = callbacksByEventElement.get([doc, element, eventName]);

        if (!callbacks) {
            doc.addEventListener(eventName, (ev) => {
                Array.from(ev.path).forEach((tgt) => {
                    let callbacks = callbacksByEventElement.get([doc, tgt, eventName]);
                    callbacks && callbacks.forEach((cb) => cb && cb(ev));
                });
            });
            callbacks = [];
        }
        callbacks.push(cb);
        callbacksByEventElement.set([doc, element, eventName], callbacks);

        return () => {
            let callbacks = callbacksByEventElement.get([doc, element, eventName]);
            callbacksByEventElement.set(
                [element, eventName],
                callbacks.filter((c) => c != cb)
            );
        };
    }

    static addEventBinder(eventName) {
        ViewElement.addBinder(`bind-${eventName}`, function (path, element) {
            let bindingMode = element.getAttribute(`var-${eventName}-mode`) || ViewElement.defaultEventMode;
            // console.log("View -> addEventBinder -> path, element", path, element);

            let cb = (ev) => {
                // console.log("View -> addEventBinder -> cb -> path, element", path, element);
                this.set(path, ev);
            };
            if (bindingMode == "aggregated") {
                return ViewElement.addAggregatedEventListener(eventName, element, cb);
            } else {
                // let fn = ev => this.set(path, ev);
                element.addEventListener(eventName, cb);
                return () => element.removeEventListener(eventName, cb);
            }
        });
    }
}

/// this binder sets the element instance to the property provided
ViewElement.addBinder("bind-element", function (prop, element) {
    this.set(prop, element);
});

const emptyElement = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

/// this binder sets the element instance to the property provided
ViewElement.addBinder("bind-child-element", function (prop, element) {
    this.watch(prop, (el) => {
        if (el && el instanceof HTMLElement) {
            emptyElement(element);
            element.appendChild(el);
        }
    });
});

/// this binder shows or hides element
let showModesMap = {
    display: {
        show: (el) => {
            if (el.style.getPropertyValue("display") == "none") {
                el.style.removeProperty("display");
            }
        },
        hide: (el) => {
            if (el.style.getPropertyValue("display") != "none") {
                el.style.setProperty("display", "none");
            }
        },
    },
    transform: {
        show: (el) => {
            if (el.style.getPropertyValue("transform") != "scale(1)") {
                el.style.setProperty("transform", "scale(1)");
            }
        },
        hide: (el) => {
            if (el.style.getPropertyValue("transform") != "scale(0)") {
                el.style.setProperty("transform", "scale(0)");
            }
        },
    },
};

ViewElement.addBinder("bind-show", function (prop, element) {
    let showVal = element.getAttribute("var-show-for-value") || true;
    let showMode = element.getAttribute("var-show-mode") || "display";
    let mode = showModesMap[showMode] || showModesMap["display"];

    mode.hide(element);

    let watchId = this.watch(prop, (show) => {
        if (show == showVal) {
            mode.show(element);
        } else {
            mode.hide(element);
        }
    });

    return () => this.unwatch(watchId);
});

ViewElement.addBinder("bind-hide", function (prop, element) {
    let hideVal = element.getAttribute("var-hide-for-value") || true;
    let hideMode = element.getAttribute("var-hide-mode") || "display";
    let mode = showModesMap[hideMode] || showModesMap["display"];

    mode.show(element);

    let watchId = this.change(prop, (hide) => {
        if (hide == hideVal) {
            mode.hide(element);
        } else {
            mode.show(element);
        }
    });

    return () => this.unwatch(watchId);
});

ViewElement.addBinder("bind-class", function (prop, element) {
    let prevCls = {};
    let watchId = this.watch(prop, (cls) => {
        Object.keys(prevCls).forEach((cl) => (prevCls[cl] = false));

        if (isObject(cls)) {
            Object.keys(cls).forEach((cl) => (prevCls[cl] = cls[cl]));
        } else if (isArray(cls)) {
            cls.forEach((cl) => (prevCls[cl] = true));
        } else if (isString(cls)) {
            prevCls[cls] = true;
        }

        Object.keys(prevCls).forEach((cl) => {
            if (prevCls[cl]) {
                element.classList.add(cl);
            } else {
                element.classList.remove(cl);
            }
        });
    });

    return () => this.unwatch(watchId);
});

ViewElement.addBinder("bind-text", function (prop, element) {
    let watchId = this.watch(prop, (text) => {
        element.innerText = text;
    });

    return () => this.unwatch(watchId);
});

/// this binder sets the element instance to the property provided
ViewElement.addBinder("bind-child-elements", function (prop, element) {
    let prevElements = [];
    let watchId = this.watch(prop, (elements) => {
        elements.forEach((el) => element.appendChild(el));

        prevElements
            .filter((pel) => !elements.find((el) => pel == el))
            .forEach((pel) => {
                unbind([pel]);
                element.removeChild(pel);
            });

        prevElements = [...elements];
    });

    return () => this.unwatch(watchId);
});

const callbacksByEventElement = new CompositeKeyWeakMap();
// View.defaultEventMode = "aggregated";
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
    "touchcancel",
].forEach((eventName) => ViewElement.addEventBinder(eventName));

let getValueProperty = (el) => {
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
ViewElement.addBinder("bind-value", function (path, el) {
    let valueProperty = getValueProperty(el);

    // var handler = throttle(() => {
    //     this.set(path, el[valueProperty]);
    // }, 100);
    let handler = () => {
        this.set(path, el[valueProperty]);
    };

    let unbindCbs = ["input"].map((eventName) => {
        // el.addEventListener(eventName, handler);
        return ViewElement.addAggregatedEventListener(eventName, el, handler);
    });

    let watchId = this.change(path, function (value) {
        el[valueProperty] = value;
    });

    return () => {
        unbindCbs.forEach((cb) => cb && cb());
        this.unwatch(watchId);
    };
});

ViewElement.addBinder("bind-href", function (prop, element) {
    this.watch(prop, (href) => {
        element.setAttribute("href", href);
    });
});

// /// this binder sets the element instance to the property provided
// ViewElement.addBinder("bind-component", function (prop, element) {
//     let prevComponent;
//     let watchId = this.watch(prop, async (component) => {
//         if (component != prevComponent) {
//             while (element.firstChild) {
//                 element.removeChild(element.firstChild);
//             }
//         } else if (component == prevComponent) {
//             return;
//         }
//         if (!component) return;

//         let { elements } = component;
//         if (!elements) {
//             elements = await component.render();
//         }

//         elements.forEach((el) => element.appendChild(el));

//         prevComponent = component;
//     });

//     return () => this.unwatch(watchId);
// });

// /// this binder sets the element instance to the property provided
// ViewElement.addBinder("bind-components", function (prop, element) {
//     let prevComponents = [];
//     let watchId = this.watch(prop, (components) => {
//         if (!components) {
//             while (element.firstChild) {
//                 element.removeChild(element.firstChild);
//             }
//             return;
//         }

//         components.forEach((component) => {
//             if (!component.get(RENDERED_PATH)) {
//                 component.render();
//             }

//             component.elements.forEach((el) => element.appendChild(el));
//             prevComponents = prevComponents.filter((c) => component != c);
//         });

//         // remove remaining components
//         prevComponents.forEach((comp) => {
//             comp.elements.forEach((el) => {
//                 element.removeChild(el);
//             });
//         });

//         prevComponents = components;
//     });

//     return () => this.unwatch(watchId);
// });
