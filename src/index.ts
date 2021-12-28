import { View } from "./View/View"

class App extends View {
    html = `<div [prop.text-content]="huha" (event.click)="baha">Hi</div>`
}

let app = new App()
app.render().forEach((element) => {
    document.body.appendChild(element)
})
app.watch("baha", (ev) => {
    console.log(ev)
})
app.set("huha", "I am great!")
