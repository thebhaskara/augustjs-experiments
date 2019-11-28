
import { Model } from "./Model";

let binders = {};

export class View extends Model {

    static addBinder(attribute, callback) {
        let attributeBinders = binders[attribute] || (binders[attribute] = []);
        attributeBinders.push(callback);
    }

    constructor() {
        super();
        if (this.element) {
            this.initializeBinders(this.element);
        }
    }

    initializeBinders(rootElement) {
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
                    attributeBinders.forEach(binder =>
                        binder.callback.call(this, el.getAttribute(attr), el));
                }
            })
        })
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