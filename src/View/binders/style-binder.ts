import { View } from "../View"

export const StyleBinder = {
    test: /\[style\.(.*)\]/gm,
    callback: (view: View, el: HTMLElement, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let stylePropertyName = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value && value != el.style[stylePropertyName]) {
                el.style[stylePropertyName] = value
            } else {
                delete el.style[stylePropertyName]
            }
        })
        return () => unwatch()
    },
}
