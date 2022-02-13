import { Model } from "../Model/Model"
import { AttributeBinder } from "./binders/attribute-binder"
import { ClassBinder } from "./binders/class-binder"
import { ComponentBinder, ComponentsBinder } from "./binders/component-binder"
import { ElementBinder } from "./binders/element-binder"
import { EventBinder } from "./binders/event-binder"
import { PropertyBinder } from "./binders/property-binder"
import { StyleBinder } from "./binders/style-binder"
import { StyleFromDynamicExpression, StyleFromStaticExpression } from "./binders/style-from-expression-binder"

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
interface ViewRegisterWebComponentOptions {
    tagName: string
    getView: () => Promise<typeof View>
    shadow?: boolean
    propertyMap?: Object
}
interface ViewRenderOptions {
    hostElement?: Element
    domContainerElement?: ShadowRoot | Element
}

export class View extends Model {
    name: string
    html: string
    css: string
    styleElement: HTMLElement
    container: ShadowRoot | HTMLElement

    render(container: ShadowRoot | HTMLElement = document.createElement("div")) {
        this.container = container

        let rootNode = container.getRootNode() as any
        rootNode = rootNode.head ?? rootNode

        let hostElement = container instanceof ShadowRoot ? container.host : container

        let viewName = (this.name = this.name ?? `august-view-${this.id}`)

        container.innerHTML = this.html

        const bindCallback = (el: Element, attributes: NamedNodeMap) => {
            Array.from(attributes).forEach((attr: Attr) => {
                View.binders.forEach((binder) => {
                    let attributeMatchArray: RegExpMatchArray[] = Array.from(attr.name.matchAll(binder.pattern))
                    if (attributeMatchArray.length == 1) {
                        let resetHandler = binder.callback(this, el, attributeMatchArray[0], attr.value)
                        this.onReset(resetHandler)
                    }
                })
            })
            el.setAttribute(viewName, "")
        }

        if (container.children[0].tagName == "HOST") {
            let host = container.children[0]
            host.classList.forEach((cls) => hostElement.classList.add(cls))
            bindCallback(hostElement, host.attributes)
            container.append(...Array.from(host.children))
            container.removeChild(host)
        }

        container.querySelectorAll("*").forEach((el) => bindCallback(el, el.attributes))

        let augustViewStyleId = `august-view-style-${viewName}`
        let styleElement = rootNode?.getElementById?.(augustViewStyleId)
        if (!styleElement) {
            styleElement = document.createElement("style")
            styleElement.id = augustViewStyleId
            styleElement.innerHTML = this.css.replace(/\[view\]/g, `[${viewName}]`)
            rootNode?.append?.(styleElement)
        }
        this.styleElement = styleElement

        return container
    }

    static binders: ViewBinderDefinition[] = []

    static addBinder(pattern: RegExp, callback: ViewBinderCallback) {
        this.binders.push({ pattern, callback })
    }

    static registerWebComponent(options: ViewRegisterWebComponentOptions) {
        window.customElements.define(
            options.tagName,
            class extends HTMLElement {
                viewInstance: View
                augustViewConnecting: boolean
                options: ViewRegisterWebComponentOptions

                connectedCallback() {
                    if (!this.augustViewConnecting) {
                        this.augustViewConnecting = true
                        this.options = options
                        options.getView().then((view: typeof View) => {
                            let viewInstance = (this.viewInstance = new view())
                            let container: HTMLElement | ShadowRoot = this
                            if (options.shadow) {
                                this.attachShadow({ mode: "open" })
                                container = this.shadowRoot
                            }
                            viewInstance.render(container)
                            if (options.propertyMap) {
                                Object.keys(options.propertyMap).forEach((property) => {
                                    let path = options.propertyMap[property]
                                    let value = this[property] ?? this.getAttribute(property)
                                    Object.defineProperty(this, property, {
                                        get: () => value,
                                        set: (_value) => {
                                            value = _value
                                            viewInstance.set(path, value)
                                        },
                                    })
                                    viewInstance.set(path, value)
                                    viewInstance.watch(path, (_value) => (value = _value))
                                })
                            }
                        })
                    }
                }

                disconnectedCallback() {
                    this.viewInstance?.reset()
                }

                attributeChangedCallback(name, _oldValue, newValue) {
                    let path
                    if (this.viewInstance && (path = this.options.propertyMap[name])) {
                        this.viewInstance.set(path, newValue)
                    }
                }
            }
        )
    }
}

View.addBinder(AttributeBinder.test, AttributeBinder.callback)
View.addBinder(ClassBinder.test, ClassBinder.callback)
View.addBinder(ComponentBinder.test, ComponentBinder.callback)
View.addBinder(ComponentsBinder.test, ComponentsBinder.callback)
View.addBinder(ElementBinder.test, ElementBinder.callback)
View.addBinder(EventBinder.test, EventBinder.callback)
View.addBinder(PropertyBinder.test, PropertyBinder.callback)
View.addBinder(StyleBinder.test, StyleBinder.callback)
View.addBinder(StyleFromDynamicExpression.test, StyleFromDynamicExpression.callback)
View.addBinder(StyleFromStaticExpression.test, StyleFromStaticExpression.callback)
