import { resolve } from "../../webpack.config"

interface AsyncQueueOptions {
    parallelTasksNumber: number
}
interface AsyncQueueQueueOptions {
    fn: AsyncQueueCallback
    resolve: (value: any) => void
    reject: (value: any) => void
}

type AsyncQueueCallback = () => Promise<any>

export class AsyncQueue {
    options: AsyncQueueOptions
    pendingQueue: AsyncQueueQueueOptions[] = []
    currentQueue: AsyncQueueQueueOptions[] = []
    enabled: boolean = true

    constructor(options: AsyncQueueOptions = { parallelTasksNumber: 1 }) {
        this.options = options
    }

    async process() {
        if (
            this.enabled &&
            this.pendingQueue.length > 0 &&
            this.currentQueue.length < this.options.parallelTasksNumber
        ) {
            let opt = this.pendingQueue.shift()
            this.currentQueue.push(opt)
            try {
                let value = await opt.fn()
                opt.resolve(value)
            } catch (err) {
                opt.reject(err)
            }
            this.currentQueue = this.currentQueue.filter((x) => x !== opt)
            this.process()
        }
    }

    enable() {
        this.enabled = true
        this.process()
    }

    disable() {
        this.enabled = false
    }

    add(fn: AsyncQueueCallback): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pendingQueue.push({ fn, resolve, reject })
        })
    }

    addAndProcess(fn: AsyncQueueCallback): Promise<any> {
        let pr = this.add(fn)
        this.process()
        return pr
    }
}
