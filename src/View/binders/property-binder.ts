import { View } from "../View"
import camelCase from "lodash/camelCase"

export const PropertyBinder = {
    test: /\[prop\.(.*)\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let propertyName = camelCase(attributeMatchArray[1])
        let unwatch = view.watch(attributeValue, (value) => {
            if (value != el[propertyName]) {
                el[propertyName] = value
            }
        })
        return () => unwatch()
    },
}
