# View

This is the work that I am most proud of. Inspired by [youmightnotneedjquery](https://youmightnotneedjquery.com/), Angular and ES6 a view structure is made.

You can have html, css and controller for a component (like in angular), but this is far less size and easy to use. This thing gives you two way binding and web component support.

> Please check the project in example folder for its practical usage.

## Binding between HTML and Javascript

The binding way is inspired by Angular, but it is rather very inferior to its full functionality. It is not gonna evaluate any expression but rather have handle of a path.

In your HTML, you have to provide an attribute and assign it a value (like in Angular )

```html
<div>
    <img [attr.src]="card.image" />
    <h1 [prop.text-content]="card.title"></h1>
    <h2 [prop.text-content]="card.subtitle"></h2>
    <p [prop.text-content]="card.content"></p>
</div>
```

From the CardView instance, you can set card object and the respective fields will be set

```javascript
const cardView = new CardView()
cardView.set("card", {
    title: "My Title",
    subtitle: "My Subtitle",
    content: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sequi, libero?",
    image: "./path/to/image.png",
})
```

A convention is followed for the attribute enclosing.

For one way binding,

controller -> dom `[class.selected]="hero.isSelected"`

dom -> controller `(event.click)="hero.clicked"`

Two way binding can happen but I didnt have any good use case for it. One might argue about value of input can be two-way binding. But I felt there are too many cases, and can be handled very easily with above two. Will implement it in future.

A lot of binders are written. Please explore [binders](./binders) for more details.

## Basic Usage

You can join html, css and javascript... (following is an example from [header](./../../example/header) in example folder)

```html
<host>
    <h1 style-from="margin:0" [prop.text-content]="title"></h1>
    <slot />
</host>
```

```scss
:host {
    h1 {
        margin: 0;
    }
}
```

```javascript
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
```

Finally, register a webcomponent...

```javascript
View.registerWebComponent({
    tagName: "aug-header",
    getView: async () => (await import("./header/header")).default,
    shadow: true,
    propertyMap: { title: "title" },
})
```

## What can it do...

two way binding
[(ngModel)]="hero.name"

one way binding
controller -> dom
[class.selected]="hero === selectedHero"
[hero]="selectedHero"

one way binding
controller -> dom
+DOM tree is altered
*ngFor="let hero of heroes"
*ngIf="selectedHero

one way binding
dom -> controller
(click)="onSelect(hero)"

{{selectedHero.name | uppercase}}

<h2>My Heroes</h2>

<ul class="heroes" [(ngModel)]="hero.name">
  <li *ngfor="let hero of heroes" [class.selected]="hero === selectedHero" (click)="onSelect(hero)">
    <span class="badge" [class.asdf]="hero === selectedHero">{{hero.id}}</span> {{hero.name}}
  </li>
</ul>

<app-hero-detail [hero]="selectedHero"></app-hero-detail>
