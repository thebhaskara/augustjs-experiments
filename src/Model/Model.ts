import { BaseModel } from "../BaseModel/BaseModel"
import { isClass } from "../Helpers/checkers"

interface ModelPathValueSet extends Array<string | any> {
    0: string
    1: any
}

export class Model extends BaseModel {
    getAll(...paths: string[]) {
        paths = paths.flatMap((path) => path)
        return paths.map((path) => super.get(path))
    }

    setAll(pathValueSets: ModelPathValueSet[] | any) {
        if (Array.isArray(pathValueSets)) {
            pathValueSets.forEach((pvSet) => {
                if (Array.isArray(pvSet)) {
                    this.set(pvSet[0], pvSet[1])
                } else {
                    this.setAll(pvSet)
                }
            })
        } else {
            Object.keys(pathValueSets).forEach((path) => {
                this.set(path, pathValueSets[path])
            })
        }
    }

    watchAll(paths: string[], callback: (...values: any[]) => void) {
        let cb = () => {
            let values = this.getAll(...paths)
            if (values.every((value) => value !== undefined)) {
                callback(...values)
            }
        }

        let unwatches = paths.map((path) => this.watch(path, cb))

        return () => unwatches.forEach((unwatch) => unwatch())
    }

    addChild(child: BaseModel | any) {
        if (isClass(child)) {
            child = new child()
        }
        this.onReset(() => child.reset())
        return child
    }
}
