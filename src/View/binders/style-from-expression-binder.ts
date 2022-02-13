import { createId } from "../../Helpers/createId"
import { View } from "../View"

let rootStyleElementMap = new Map()
let shortHandMap = {
    d: "display",

    f: "flex",
    fd: "flex-direction",
    fg: "flex-grow",
    fs: "flex-shrink",

    fw: "font-weight",

    m: "margin",
    mar: "margin",
    mb: "margin-bottom",
    ml: "margin-left",
    mr: "margin-right",
    mt: "margin-top",

    p: "padding",
    pad: "padding",
    pb: "padding-bottom",
    pl: "padding-left",
    pr: "padding-right",
    pt: "padding-top",

    ta: "text-align",

    w: "width",
    h: "height",
}
let breakpointsMap = {
    sm: "@media (min-width: 640px) { [content] }",
    md: "@media (min-width: 768px) { [content] }",
    lg: "@media (min-width: 1024px) { [content] }",
    xl: "@media (min-width: 1280px) { [content] }",
    xxl: "@media (min-width: 1536px) { [content] }",
}
let pseudoClassesMap = {
    hover: ":hover",
    focus: ":focus",
    "focus-within": ":focus-within",

    active: ":active",
    visited: ":visited",
    target: ":target",
    first: ":first-child",
    last: ":last-child",
    only: ":only-child",
    odd: ":nth-child(odd)",
    even: ":nth-child(even)",
    empty: ":empty",
    disabled: ":disabled",
    checked: ":checked",
    indeterminate: ":indeterminate",
    default: ":default",
    required: ":required",
    valid: ":valid",
    autofill: ":autofill",
    invalid: ":invalid",
    "focus-visible": ":focus-visible",
    "in-range": ":in-range",
    "placeholder-shown": ":placeholder-shown",
    "read-only": ":read-only",
    "out-of-range": ":out-of-range",
    "first-of-type": ":first-of-type",
    "last-of-type": ":last-of-type",
    "only-of-type": ":only-of-type",
}
const makeStyles = (view: View, el: Element, attributeValue: string) => {
    let root = view.container.getRootNode() as Document
    let rootStyle = rootStyleElementMap.get(root)
    if (!rootStyle) {
        let styleElement = document.createElement("style")
        let el = root.head ?? root
        el.append(styleElement)
        rootStyle = {
            styleElement,
            generatedClasses: new Map(),
        }
        rootStyleElementMap.set(root, rootStyle)
    }
    let list = attributeValue.split(/\s/)
    return list.map((propertySet) => {
        let className = rootStyle.generatedClasses.get(propertySet)
        if (!className) {
            className = `august-css-from-class-${createId()}`
            let splits = propertySet.split(/:/)

            // lets figure out value
            let value = splits.pop()
            if (value.startsWith("var")) {
                value = value.replace(/(var)-(.*)/, "$1(--$2)")
            } else {
                value = value.replace(/-/g, " ")
            }

            // lets figure out propertyName
            let propertyName = splits.pop()
            propertyName = shortHandMap[propertyName] ?? propertyName

            // lets figure out pseudoclass and breakpoint
            let pseudoClass = ""
            let breakpoint = "[content]"
            let prop
            while ((prop = splits.pop())) {
                if (pseudoClassesMap[prop]) {
                    pseudoClass = pseudoClassesMap[prop]
                } else if (breakpointsMap[prop]) {
                    breakpoint = breakpointsMap[prop]
                }
            }

            let content = `.${className}${pseudoClass}{${propertyName}: ${value}} `
            rootStyle.styleElement.innerHTML =
                rootStyle.styleElement.innerHTML + breakpoint.replace("[content]", content)

            rootStyle.generatedClasses.set(propertySet, className)
        }
        el.classList.add(className)
        return className
    })
}

export const StyleFromStaticExpression = {
    test: /style-from/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        makeStyles(view, el, attributeValue)
        return () => {}
    },
}

export const StyleFromDynamicExpression = {
    test: /\[style-from\]/gm,
    callback: (view: View, el: Element, attributeMatchArray: RegExpMatchArray, attributeValue: string) => {
        let previousClasses = []
        let unwatch = view.watch(attributeValue, (value: string | Array<string> | Object) => {
            let newClasses = []
            if (Array.isArray(value)) {
                newClasses = makeStyles(view, el, value.join(" "))
            } else if (typeof value == "string") {
                newClasses = makeStyles(view, el, value)
            } else {
                newClasses = makeStyles(
                    view,
                    el,
                    Object.keys(value)
                        .filter((key) => value[key])
                        .join(" ")
                )
            }

            previousClasses.forEach((cls) => {
                if (newClasses.indexOf(cls) < 0) {
                    el.classList.remove(cls)
                }
            })
            previousClasses = newClasses
        })
        return () => unwatch()
    },
}
