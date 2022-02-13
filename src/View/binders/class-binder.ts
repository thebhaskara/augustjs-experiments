import { View } from "../View"

export const ClassBinder = {
    test: /\[class\.(.*)\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let className = attributeMatchArray[1]
        let unwatch = view.watch(attributeValue, (value) => {
            if (value) {
                el.classList.add(className)
            } else {
                el.classList.remove(className)
            }
        })
        return () => unwatch()
    },
}
