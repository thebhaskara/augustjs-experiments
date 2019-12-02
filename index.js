import "./dist/August.js";

class Abc extends August.Model {
    constructor() { super() }
}

let a = new Abc();
a.watch('aa', (aa) => console.log(aa));

a.set('aa', 10);

class app extends August.View {

    constructor() { super([document.body]) }
}

let v = new app();
v.set('text', 'Hi!')