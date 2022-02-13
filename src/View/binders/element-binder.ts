import { View } from "../View"

export const ElementBinder = {
    test: /\(element\)/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        view.set(attributeValue, el)
        return () => {}
    },
}
