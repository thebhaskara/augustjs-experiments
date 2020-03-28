import { dom } from './dom';


let binders = {};
let unbindCallbacksByElement = new WeakMap();
let selector = '';

export function addBinder(attribute, callback) {
    let attributeBinders = binders[attribute] || (binders[attribute] = []);
    let attributes = Object.keys(binders);
    selector = '[' + attributes.join('], [') + ']';
    attributeBinders.push(callback);
}

export function bind(context, rootElement) {

    let $root = new dom(rootElement);

    let matchingElements = [];

    $root.matches(selector) && matchingElements.push(rootElement);
    Array.prototype.push.apply(matchingElements, $root.getElements(selector));

    matchingElements.forEach(element => {

        unbind([element]);

        let unbindCallbacks = [];

        Array.from(element.attributes).forEach(attr => {
            let binderCallbacks = binders[attr.name];
            if (binderCallbacks) {
                let calls = binderCallbacks.map(callback => callback.call(context, attr.value, element));
                Array.prototype.push.apply(unbindCallbacks, calls);
            }
        });

        unbindCallbacksByElement.set(element, unbindCallbacks);
    });

    return matchingElements;
}

export function unbind(elements) {
    elements.forEach(el => {
        let cbs = unbindCallbacksByElement.get(el);
        cbs && cbs.forEach(cb => cb && cb());
        unbindCallbacksByElement.delete(el);
    });
}