AugustJS is a collection of structures and code that are repeatedly required for various purposes.

## AsyncQueue

This is a class that can be used to limit the number of parallel calls for asyncronous functions.

[AsyncQueue](src/AsyncQueue)

## BaseModel

This is a class implementing observer kind of pattern.
Mainly implementing get, set and watch functionalities.
A structure with get, set and watch has helped me a great deal.

[BaseModel.ts](src/BaseModel/BaseModel.ts)

## Model

This is an extension to BaseModel with few sugar functions.

[Model.ts](src/Model/Model.ts)

## View

This is the work that I am most proud of. Inspired by [youmightnotneedjquery](https://youmightnotneedjquery.com/), a view structure is made.

You can have html, css and controller for a component (like in angular), but this is far less size and easy to use. This thing gives you two way binding and web component support.

Please check the project in example folder for its usage.

[View.ts](src/View/View.ts)

## StyledWebComponents

Above ```View``` has ability to make web components. So few reasonable web components are made with it.

Also an asyncronous import is used so that initial load does not take too long.

### LayoutStandard

This web component can be used to make a very basic layout