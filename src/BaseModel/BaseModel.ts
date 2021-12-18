import _ from "lodash"
import { createId } from "../Helpers/createId"

type BaseModelWatchCallback = (value: any) => void
interface BaseModelSplitReturn extends Array<string | BaseModel> {
    0: string
    1: BaseModel
    2: string
}
interface BaseModelWatch {
    id: number
    path: string
    normalPath: string
    callback: BaseModelWatchCallback
}

// please do not change the normalizing character value
// because it is being used for paths
const NORMALIZING_CHARACTER = "."
const getNormalPath = (path: string) => path?.replace(/[\[\]\"']+/g, NORMALIZING_CHARACTER)

export class BaseModel {
    id: number
    _data: any = {}
    // should we change it to a map?
    // because a filter executes on each unwatch
    _watches: Map<number, BaseModelWatch> = new Map()
    _modelByPath: Map<string, BaseModel> = new Map()
    _resetCallbacks: Function[] = []

    constructor(data: any = {}) {
        this.id = createId()
        // see if you can fix it to realize models while constructing
        this._data = data
    }

    splitPathByModel(path: string): BaseModelSplitReturn {
        let normalPath = getNormalPath(path)
        let splits = normalPath.split(NORMALIZING_CHARACTER)
        let firstPath: string = splits.shift()
        let model: BaseModel = null
        while (splits.length > 0) {
            model = this._modelByPath.get(firstPath)
            if (model) {
                break
            }
            firstPath = firstPath + NORMALIZING_CHARACTER + splits.shift()
        }
        let restOfThePath = splits.join(NORMALIZING_CHARACTER)
        return [firstPath, model, restOfThePath]
    }

    get(path: string): any {
        let [firstPath, model, restOfThePath] = this.splitPathByModel(path)
        if (model && restOfThePath) {
            return model.get(restOfThePath)
        } else {
            return _.get(this._data, path)
        }
    }

    set(path: string, value: any) {
        let [firstPath, model, restOfThePath] = this.splitPathByModel(path)
        if (model && restOfThePath) {
            model.set(restOfThePath, value)
        } else {
            this._modelByPath.set(firstPath, value instanceof BaseModel ? value : null)
            _.set(this._data, path, value)
            this.trigger(path)
        }
    }

    watch(path: string, callback: BaseModelWatchCallback) {
        let [simplePath, model, restOfThePath] = this.splitPathByModel(path)
        if (model && restOfThePath) {
            let unwatch = model.watch(restOfThePath, callback)
            this.onReset(unwatch)
            return unwatch
        } else {
            let watch = { id: createId(), path, normalPath: simplePath, callback }
            this._watches.set(watch.id, watch)
            this.triggerWatch(watch)
            return () => this._watches.delete(watch.id)
        }
    }

    trigger(path: string) {
        let normalPath = getNormalPath(path)
        this._watches.forEach((watch) => {
            if (
                watch.normalPath == normalPath ||
                watch.normalPath.startsWith(`${normalPath}${NORMALIZING_CHARACTER}`) ||
                normalPath.startsWith(`${watch.normalPath}${NORMALIZING_CHARACTER}`)
            ) {
                this.triggerWatch(watch)
            }
        })
    }

    triggerWatch(watch: BaseModelWatch) {
        let value = this.get(watch.path)
        if (value !== undefined) {
            watch?.callback?.(value)
        }
    }

    onReset(...callbacks: Function[]) {
        callbacks.forEach((callback) => this._resetCallbacks.push(callback))
    }

    reset() {
        this._resetCallbacks.forEach((callback) => callback?.())
        this._modelByPath.forEach((model, path) => this.set(path, null))

        // clearing out all things that are stored
        this._resetCallbacks = []
        this._modelByPath = new Map()
        this._data = {}
        this._watches = new Map()
    }
}
