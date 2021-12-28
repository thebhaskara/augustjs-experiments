import _ from "lodash"
import { emptyElement } from "../Helpers/emptyElement"
import { Model } from "../Model/Model"

type ViewBinderCallback = (
    view: View,
    el: Element,
    attributeMatchArray: RegExpMatchArray,
    attributeValue: string
) => Function
interface ViewBinderDefinition {
    pattern: RegExp
    callback: Function
}

export class View extends Model {
    html: string
    css: string
    elements: Element[]

    render() {
        if (this.elements) return this.elements

        let container = document.createElement("div")
        container.innerHTML = this.html

        container.querySelectorAll("*").forEach((el: Element) => {
            Array.from(el.attributes).forEach((attr: Attr) => {
                View.binders.forEach((binder) => {
                    let attributeMatchArray: RegExpMatchArray[] = Array.from(attr.name.matchAll(binder.pattern))
                    if (attributeMatchArray.length == 1) {
                        let resetHandler = binder.callback(this, el, attributeMatchArray[0], attr.value)
                        this.onReset(resetHandler)
                    }
                })
            })
        })

        let styleElement = document.createElement("style")
        styleElement.innerHTML = this.css
        container.appendChild(styleElement)

        return (this.elements = Array.from(container.children))
    }

    static binders: ViewBinderDefinition[] = []

    static addBinder(pattern: RegExp, callback: ViewBinderCallback) {
        this.binders.push({ pattern, callback })
    }
}

View.addBinder(
    /\[class\.(.*)\]/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let className = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value) {
                el.classList.add(className)
            } else {
                el.classList.remove(className)
            }
        })
        return () => unwatch()
    }
)

View.addBinder(
    /\[style\.(.*)\]/gm,
    (view: View, el: HTMLElement, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let stylePropertyName = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value && value != el.style[stylePropertyName]) {
                el.style[stylePropertyName] = value
            } else {
                delete el.style[stylePropertyName]
            }
        })
        return () => unwatch()
    }
)

View.addBinder(
    /\[attr\.(.*)\]/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let attributeName = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value) {
                el.setAttribute(attributeName, value)
            } else {
                el.removeAttribute(attributeName)
            }
        })
        return () => unwatch()
    }
)

View.addBinder(
    /\[prop\.(.*)\]/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let propertyName = _.camelCase(attributeMatchArray[1])
        let unwatch = view.watch(attributeValue, (value) => {
            if (value != el[propertyName]) {
                el[propertyName] = value
            }
        })
        return () => unwatch()
    }
)

View.addBinder(
    /\(event\.(.*)\)/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let eventName = attributeMatchArray[1]

        const listener = (event: Event): void => {
            view.set(attributeValue, event)
        }
        el.addEventListener(eventName, listener)

        return () => el.removeEventListener(eventName, listener)
    }
)

View.addBinder(
    /\(element\)/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        view.set(attributeValue, el)
        return () => {}
    }
)

View.addBinder(
    /\[component\]/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        emptyElement(el)
        let unwatch = view.watch(attributeValue, (child: View) => {
            emptyElement(el)
            let elements = child.render()
            elements.forEach((elm) => el.append(elm))
        })
        return () => unwatch()
    }
)

View.addBinder(
    /\[components\]/gm,
    (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        emptyElement(el)
        let previousChildren = {}
        let unwatch = view.watch(attributeValue, (children: View[]) => {
            let currentChildren = {}
            children.forEach((child) => {
                let elements = child.render()
                elements.forEach((elm) => el.append(elm))
                delete previousChildren[child.id]
                currentChildren[child.id] = child
            })
            Object.keys(previousChildren).forEach((key) => {
                let previousChild = previousChildren[key]
                if (previousChild) {
                    previousChild.elements.forEach((elm) => el.removeChild(elm))
                }
            })
            previousChildren = currentChildren
        })
        return () => unwatch()
    }
)
