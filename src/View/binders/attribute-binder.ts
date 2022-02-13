import { View } from "../View"

export const AttributeBinder = {
    test: /\[attr\.(.*)\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let attributeName = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value) {
                el.setAttribute(attributeName, value)
            } else {
                el.removeAttribute(attributeName)
            }
        })
        return () => unwatch()
    },
}
