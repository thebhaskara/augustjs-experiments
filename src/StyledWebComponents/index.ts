import { View } from "../View/View"

View.registerWebComponent({
    tagName: "aug-layout-standard",
    getView: async () => (await import("./LayoutStandard/LayoutStandard")).default,
    shadow: true,
})