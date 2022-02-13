import { View } from "../View"

export const EventBinder = {
    test: /\(event\.(.*)\)/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let eventName = attributeMatchArray[1]

        const listener = (event: Event): void => {
            view.set(attributeValue, event)
        }
        el.addEventListener(eventName, listener)

        return () => el.removeEventListener(eventName, listener)
    },
}
