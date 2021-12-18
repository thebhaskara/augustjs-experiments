import { Model } from "./Model"

describe("Basic stuff", () => {
    it("should be able to create an instance", () => {
        let model = new Model()
        expect(model).toBeInstanceOf(Model)
    })

    it("should be able to set a object while creating an instance", () => {
        let model = new Model({ prop1: 10, prop2: 20 })
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(20)
    })

    it("should be able to set a complex object while creating an instance", () => {
        let model = new Model({ prop1: 10, prop2: 20, prop3: { p3p1: 23 } })
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(20)
        expect(model.get("prop3.p3p1")).toBe(23)
    })
})

describe("Testing setting and getting values from simple paths", () => {
    let model = new Model()

    it("should be able to set and get", () => {
        model.set("prop1", 10)
        expect(model.get("prop1")).toBe(10)
    })

    it("should be able to set and get from another path", () => {
        model.set("prop2", 20)
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(20)
    })

    it("should be able to overrite a path", () => {
        model.set("prop2", 30)
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(30)
    })
})

describe("Testing setting and getting values from 2nd order path", () => {
    let model = new Model()

    it("should be able to set and get", () => {
        model.set("prop1.pp", 10)
        expect(model.get("prop1.pp")).toBe(10)
    })

    it("should be able to set and get from another path", () => {
        model.set("prop1.aa", 20)
        expect(model.get("prop1.pp")).toBe(10)
        expect(model.get("prop1.aa")).toBe(20)
    })

    it("should be able to overrite a path", () => {
        model.set("prop1.aa", 30)
        expect(model.get("prop1.pp")).toBe(10)
        expect(model.get("prop1.aa")).toBe(30)
    })
})

describe("Testing setting and getting values from a model set on path", () => {
    let model = new Model()
    let child = new Model()
    model.set("child", child)

    it("should be able to set and get model2", () => {
        child.set("prop1", 10)
        expect(model.get("child.prop1")).toBe(10)
    })

    it("should be able to set and get from parent to child", () => {
        model.set("child.prop2", 20)
        expect(model.get("child.prop2")).toBe(20)
    })

    it("should be able to overrite a 2nd order path", () => {
        model.set("child.prop1", 30)
        expect(model.get("child.prop1")).toBe(30)
    })
})

describe("Testing watch on simple path", () => {
    let model = new Model()

    it("should be able to watch", () => {
        let watchedValue
        model.watch("prop1", (value) => (watchedValue = value))
        model.set("prop1", 10)
        expect(watchedValue).toBe(10)
    })

    it("should be able to watch even if it was set already", () => {
        let watchedValue
        model.watch("prop1", (value) => (watchedValue = value))
        expect(watchedValue).toBe(10)
    })

    it("should be able to unwatch", () => {
        let watchedValue
        let unwatch = model.watch("prop2", (value) => (watchedValue = value))
        unwatch()
        model.set("prop2", 10)
        expect(watchedValue).toBeUndefined()
    })
})

describe("Testing watch on child", () => {
    let model = new Model()
    let child = new Model()
    model.set("child", child)

    it("should be able to watch", () => {
        let watchedValue
        model.watch("child.prop1", (value) => (watchedValue = value))
        model.set("child.prop1", 10)
        expect(watchedValue).toBe(10)
    })

    it("should be able to watch even if it was set already", () => {
        let watchedValue
        model.watch("child.prop1", (value) => (watchedValue = value))
        expect(watchedValue).toBe(10)
    })

    it("should be able to unwatch", () => {
        let watchedValue
        let unwatch = model.watch("child.prop2", (value) => (watchedValue = value))
        unwatch()
        model.set("child.prop2", 10)
        expect(watchedValue).toBeUndefined()
    })
})

describe("Testing reset", () => {
    it("should be able to reset", () => {
        let model = new Model()
        model.set("prop1", 10)
        model.reset()
        expect(model.get("prop1")).toBeUndefined()
    })

    it("should be able to trigger onReset", () => {
        let model = new Model()
        let isReset = false
        model.onReset(() => (isReset = true))
        model.reset()
        expect(isReset).toBeTruthy()
    })

    it("should be able to unwatch all", () => {
        let model = new Model()
        let watchedValue
        model.watch("prop1", (value) => (watchedValue = value))
        model.reset()
        model.set("prop1", 10)
        expect(watchedValue).toBeUndefined()
    })
})

describe("Testing getting all and setting all", () => {
    it("should be able to set all and get all", () => {
        let model = new Model()
        model.setAll({ prop1: 10, prop2: 20 })
        let [prop1, prop2] = model.getAll("prop1", "prop2")
        expect(prop1).toBe(10)
        expect(prop2).toBe(20)
    })

    it("should be able to set all and get all as pathsets", () => {
        let model = new Model()
        model.setAll([
            ["prop1", 10],
            ["prop2", 20],
        ])
        let [prop1, prop2] = model.getAll("prop1", "prop2")
        expect(prop1).toBe(10)
        expect(prop2).toBe(20)
    })

    it("should be able to set all and get all as pathsets", () => {
        let model = new Model()
        model.setAll([{ prop1: 10 }, { prop2: 20 }])
        let [prop1, prop2] = model.getAll("prop1", "prop2")
        expect(prop1).toBe(10)
        expect(prop2).toBe(20)
    })
})

describe("Testing watch all", () => {
    it("should be able to watch multiple pathsets", () => {
        let model = new Model()
        model.setAll({ prop1: 10, prop2: 20 })
        let prop1, prop2
        model.watchAll(["prop1", "prop2"], (_prop1, _prop2) => {
            prop1 = _prop1
            prop2 = _prop2
        })
        expect(prop1).toBe(10)
        expect(prop2).toBe(20)
    })

    it("should be able to watch multiple pathsets but should not trigger if only one is set", () => {
        let model = new Model()
        model.setAll({ prop1: 10 })
        let prop1, prop2
        model.watchAll(["prop1", "prop2"], (_prop1, _prop2) => {
            prop1 = _prop1
            prop2 = _prop2
        })
        expect(prop1).toBeUndefined()
        expect(prop2).toBeUndefined()
    })

    it("should be able to watch multiple pathsets", () => {
        let model = new Model()
        let prop1, prop2
        let unwatch = model.watchAll(["prop1", "prop2"], (_prop1, _prop2) => {
            prop1 = _prop1
            prop2 = _prop2
        })
        unwatch()
        model.setAll({ prop1: 10, prop2: 20 })
        expect(prop1).toBeUndefined()
        expect(prop2).toBeUndefined()
    })
})

describe("Testing addChild", () => {
    it("should be able to add child from instance", () => {
        let model = new Model()
        let child = new Model()
        model.addChild(child)
        let isChildResetted = false
        child.onReset(() => (isChildResetted = true))
        model.reset()
        expect(isChildResetted).toBeTruthy()
    })

    it("should be able to create and add child from class", () => {
        let model = new Model()
        let Child = class extends Model {}
        let child = model.addChild(Child)
        let isChildResetted = false
        child.onReset(() => (isChildResetted = true))
        model.reset()
        expect(isChildResetted).toBeTruthy()
    })
})
