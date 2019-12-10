

let binders = {};
let binderInfosByElement = new WeakMap();
let selector = '';

export function addBinder(attribute, callback) {
    let attributeBinders = binders[attribute] || (binders[attribute] = []);
    let attributes = Object.keys(binders);
    selector = '[' + attributes.join('], [') + ']';
    attributeBinders.push(callback);
}

export function initializeBinders(context, rootElement) {
    // let attributes = Object.keys(binders);
    // let selector = '[' + attributes.join('], [') + ']';
    let elementsThatNeedBinding = [];
    if (rootElement.matches(selector)) {
        elementsThatNeedBinding.push(rootElement);
    }
    elementsThatNeedBinding = elementsThatNeedBinding.concat(Array.from(rootElement.querySelectorAll(selector)));

    let unbindCalls = [];
    attributes.forEach(attribute => {

        elementsThatNeedBinding.forEach(el => {

            if (el.hasAttribute(attribute)) {

                let attributeBinders = binders[attribute];
                attributeBinders.reduce((unbindCalls, binder, index) => {

                    let infos = binderInfosByElement.get(el) || [];
                    let binderInfo = { attribute, index, context };

                    if (!infos.find(info =>
                        info.attribute == binderInfo.attribute &&
                        info.index == binderInfo.index &&
                        info.context == binderInfo.context)) {

                        binderInfo.unbind = binder.call(context, el.getAttribute(attribute), el);
                        // context.onDestroyCallbacks.push(binderInfo.unbind);
                        infos.push(binderInfo);
                        binderInfosByElement.set(el, infos);
                        
                        unbindCalls.push(binderInfo.unbind);

                    }

                    return unbindCalls;
                }, unbindCalls);
            }
        })
    })

    return unbindCalls;
}