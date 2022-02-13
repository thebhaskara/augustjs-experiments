import { emptyElement } from "../../Helpers/emptyElement"
import { View } from "../View"

export const ComponentBinder = {
    test: /\[component\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        emptyElement(el)
        let unwatch = view.watch(attributeValue, (child: View) => {
            emptyElement(el)
            el.append(child.render())
            // let elements = child.render()
            // elements.forEach((elm) => el.append(elm))
        })
        return () => unwatch()
    },
}

export const ComponentsBinder = {
    test: /\[components\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        emptyElement(el)
        let previousChildren = {}
        let unwatch = view.watch(attributeValue, (children: View[]) => {
            let currentChildren = {}
            children.forEach((child) => {
                el.append(child.render())
                // let elements = child.render()
                // elements.forEach((elm) => el.append(elm))
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
    },
}
