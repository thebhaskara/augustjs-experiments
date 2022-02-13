import { View } from "../src/View/View"
import html from "./App.html"
import css from "./App.scss"

export default class extends View {
    html = html
    css = css

    constructor() {
        super()

        this.watch("baha", (ev) => {
            console.log(ev)
        })
        this.set("huha", "I am great!")
    }
}

// document.body.append(document.createElement("aug-app"))
