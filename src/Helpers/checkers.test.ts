import { isClass, isInstance } from "./checkers"

describe("Testing isClass and isInstance", () => {
    it("should check isClass or instance", () => {
        class M {}
        let m = new M()
        expect(isClass(M)).toBeTruthy()
        expect(isClass(m)).toBeFalsy()
        expect(isInstance(m)).toBeTruthy()
        expect(isInstance(M)).toBeFalsy()
    })
    it("should check isClass or instance when there is a constructor", () => {
        class M {
            constructor() {
                // console.log("this is")
            }
        }
        let m = new M()
        expect(isClass(M)).toBeTruthy()
        expect(isClass(m)).toBeFalsy()
        expect(isInstance(m)).toBeTruthy()
        expect(isInstance(M)).toBeFalsy()
    })
    it("should check isClass or instance when it is inherited", () => {
        class MP {
            constructor() {
                // console.log("this is")
            }
        }
        class M extends MP {}
        let m = new M()
        expect(isClass(M)).toBeTruthy()
        expect(isClass(m)).toBeFalsy()
        expect(isInstance(m)).toBeTruthy()
        expect(isInstance(M)).toBeFalsy()
    })
})
