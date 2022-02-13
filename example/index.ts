import { View } from "../src/View/View"
import "../src/StyledWebComponents/index"

View.registerWebComponent({
    tagName: "aug-app",
    getView: async () => (await import("./App")).default,
    shadow: false,
})

View.registerWebComponent({
    tagName: "aug-header",
    getView: async () => (await import("./header/header")).default,
    shadow: true,
    propertyMap: { title: "title" },
})
