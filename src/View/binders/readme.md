# Binders

## attribute-binder

`[attr.<attribute_name>]="path.for.value"`

This binder will set value of the specified attribute from the model. This uses `setAttribute` of the Element internally. _`attribute_name`_ can be any system attributes like src, title, etc... or they can be custom attributes also.

Eg...

```html
<img [attr.src]="user.avatar" />
```

```html
<h1 [attr.title]="my.title">My Heading</h1>
```

> Note: capital case attribute names will not work. like... `[attr.myCapitalAttribute]="my.path"`

## class-binder

`[class.<class_name>]="path.for.toggle.value"`

This binder will add or remove `<class_name>` to the Element, based on truthyness of the the value at `path.for.toggle.value`. This internally uses the `classList.add()` and `classList.remove()`

Eg...

```html
<img [class.avatar]="user.avatar" />
```

```html
<h1 [class.title]="my.title">My Heading</h1>
```

> Note: capital case attribute names will not work. like... `[class.myCapitalClass]="my.path"`

## component-binder

These binders can be used to bind another View instance to this View at a certain element.

### single component binder

`[component]="path.for.component"`

This binder will add or remove View instance available at `path.for.component`. This internally uses `firstChild`, `removeChild()` and `append()` of the element.

Eg...

```html
<div [component]="graphComponent" />
```

### multiple component binder

`[components]="path.for.components.list"`

This binder will add or remove View instances available at `path.for.components.list`. This internally uses `firstChild`, `removeChild()` and `append()` of the element.

Eg...

```html
<div [components]="cardComponents" />
```

## element-binder

`(element)="path.for.component"`

This binder is used to get handle of the DOM element.

Eg...

```html
<div (element)="containerElement" />
```

## event-binder

`(event.<event_name>)="path.for.event.obj"`

This binder will do `addEventListener(<event_name>, ...)` on the provided `event-name`. It will set the event object to `path.for.event.obj` when event happens.

It will take the responsibility to do `removeEventListener` when resetting the View.

Custom event names can also be used as long as capital case is not used.

Eg...

```html
<img (event.click)="image.clicked" />
```

```html
<input (event.change)="input.changed" (event.keyup)="input.changed" />
```

> Note: capital case attribute names will not work. like... `(event.myCustomEvent)="my.path"`

## property-binder

`[prop.<property_name>]="path.for.value"`

This binder will set value of the specified property from the model. This direclty sets value to the `property_name` of Element internally. _`property_name`_ can be any system properties like textContent, innerText, etc... or they can be custom attributes also.

> Note: `property_name` has to be hiphenated for camel case. Like... for using `innerText` should be `[prop.inner-text]="path"`

Eg...

```html
<h1 [prop.text-content]="my.title"></h1>
```

## style-binder

`[style.<property_name>]="path.for.value"`

This binder will set value of the specified property from the model.

Eg...

```html
<h1 [style.color]="my.title.color"></h1>
```

## style-from-expression-binder

`style-from="style-expression"` (static)

`[style-from]="path.for.value"` (dynamic)

This binder is trying to imitate tailwind css and JSS together. But this is very inferior to either.

Few combinations are available like...

`<breakpoint>:<pseudo_class>:<property_name>:<value>`

`pseudo_class` and `breakpoint` parts are interchangeable

`<pseudo_class>:<breakpoint>:<property_name>:<value>`

both `pseudo_class` and `breakpoint` are optional

`<property_name>:<value>`

Also, you can use a css variable for value. Eg... `var-light-color` will be `var(--light-color)`

Please go through the [style-from-expression-binder.ts](./style-from-expression-binder.ts) for the values to be used for each.

Eg 1...

```html
<h1 style-from="margin:0"></h1>
```

this will add class...

```css
.class-randomid {
    margin: 0;
}
```

Eg 2...

```html
<h1 style-from="color:var-light-color"></h1>
```

this will add class...

```css
.class-randomid {
    color: var(--light-color);
}
```

Eg 3...

```html
<h1 style-from="hover:color:var-light-color"></h1>
```

this will add class...

```css
.class-randomid:hover {
    color: var(--light-color);
}
```

Eg 3...

```html
<h1 style-from="hover:sm:gap:var-small-gap"></h1>
```

this will add class...

```css
@media (min-width: 640px) {
    .class-randomid:hover {
        gap: var(--small-gap);
    }
}
```

Eg 4...

`sm` and `hover` are interchangeable.

```html
<h1 style-from="sm:hover:gap:var-small-gap"></h1>
```

this will add class...

```css
@media (min-width: 640px) {
    .class-randomid:hover {
        gap: var(--small-gap);
    }
}
```