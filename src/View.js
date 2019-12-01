
import { Model } from "./Model";

let binders = {};
let binderInfosByElement = new WeakMap();

function initializeBinders(context, rootElement) {
    let attributes = Object.keys(binders);
    let selector = '[' + attributes.join('], [') + ']';
    let elementsThatNeedBinding = [];
    if (rootElement.matches(selector)) {
        elementsThatNeedBinding.push(rootElement);
    }
    elementsThatNeedBinding = elementsThatNeedBinding.concat(rootElement.querySelectorAll(selector));

    attributes.forEach(attr => {
        elementsThatNeedBinding.forEach(el => {
            if (el.hasAttribute(attr)) {
                let attributeBinders = binders[attr];
                attributeBinders.forEach((binder, index) => {
                    let infos = binderInfosByElement.get(el) || [];
                    let binderInfo = { binder, index, context };
                    if (!infos.find(info =>
                        info.binder == binderInfo.binder &&
                        info.index == binderInfo.index &&
                        info.context == binderInfo.context)) {

                        binderInfo.unbind = binder.callback.call(context, el.getAttribute(attr), el);
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
            elements.forEach(el => this.initializeBinders(el));
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
    this.change(prop, (show) => {
        if (show == showVal) {
            mode.show();
        } else {
            mode.hide();
        }
    });
})

/// this binder sets the element instance to the property provided
View.addBinder('bind-child-elements', function (prop, element) {
    let prevElements = [];
    this.watch(prop, (elements) => {

        elements.forEach(el => element.appendChild(el));

        prevElements
            .filter(el => elements.indexOf(el) < 0)
            .forEach(el => element.removeChild(el));

        prevElements = [...elements];
    });
})