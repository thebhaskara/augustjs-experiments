import { BaseModel } from "./BaseModel"

describe("Basic stuff", () => {
    it("should be able to create an instance", () => {
        let model = new BaseModel()
        expect(model).toBeInstanceOf(BaseModel)
    })

    it("should be able to set a object while creating an instance", () => {
        let model = new BaseModel({ prop1: 10, prop2: 20 })
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(20)
    })

    it("should be able to set a complex object while creating an instance", () => {
        let model = new BaseModel({ prop1: 10, prop2: 20, prop3: { p3p1: 23 } })
        expect(model.get("prop1")).toBe(10)
        expect(model.get("prop2")).toBe(20)
        expect(model.get("prop3.p3p1")).toBe(23)
    })
})

describe("Testing setting and getting values from simple paths", () => {
    let model = new BaseModel()

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
    let model = new BaseModel()

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
    let model = new BaseModel()
    let child = new BaseModel()
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
    let model = new BaseModel()

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
    let model = new BaseModel()
    let child = new BaseModel()
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
        let model = new BaseModel()
        model.set("prop1", 10)
        model.reset()
        expect(model.get("prop1")).toBeUndefined()
    })

    it("should be able to trigger onReset", () => {
        let model = new BaseModel()
        let isReset = false
        model.onReset(() => (isReset = true))
        model.reset()
        expect(isReset).toBeTruthy()
    })

    it("should be able to unwatch all", () => {
        let model = new BaseModel()
        let watchedValue
        model.watch("prop1", (value) => (watchedValue = value))
        model.reset()
        model.set("prop1", 10)
        expect(watchedValue).toBeUndefined()
    })
})
