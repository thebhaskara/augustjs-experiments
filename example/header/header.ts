import { View } from "../../src/View/View"
import html from "./header.html"
import css from "./header.scss"

export default class extends View {
    html = html
    css = css

    constructor() {
        super()

        this.watch("title", (title) => console.log("title", title))
    }
}
