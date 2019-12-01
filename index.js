import "./dist/August.js";

class Abc extends August.Model {
    constructor() { super() }
}

let a = new Abc();
a.watch('aa', (aa) => console.log(aa));

a.set('aa', 10);