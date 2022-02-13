# AsyncQueue

This is a helper class to provide queue like behaviour to asyncronous calls.
This can be used in situations like...

-   when you want to limit the number of requests that can parallely go to a certain rest api. Then you can create and instance of this class and add your calls using this
-   when you have have to fix the number of parallel database calls.
-   etc...

> Please refer the code for types and signature. It is written in Typescript, so it should be easy to understand.

## Usage

Pass parallelTasksNumber when more than one is needed.

```javascript
const queue = new AsyncQueue({ parallelTasksNumber: 5 })
```

You don't have to pass anything if you need only one parallel task.

```javascript
const queue = new AsyncQueue()
```

You can add your asyncronous call as following

```javascript
queue.add(() => {
    return Promise((res, rej) => {
        // your code
    })
})
```

or you can use async await

```javascript
queue.add(async () => {
    // your code that uses await
})
```

> Note: AsyncQueue does not pass any value to the callback.

Add returns a promise that resolves when the callback is executed and returns.

```javascript
let pr = queue.add(() => {
    return Promise((res, rej) => {
        // your code
    })
})

pr.then(() => {
    // you code when the callback is finished executing
})
```

Do not forget to call process after you add all your requests.

```javascript
queue.process()
```

Otherwise you could use addAndProcess so that you don't have to call it exclusively

```javascript
queue.addAndProcess(callback)
```

BTW... you can disable queue when you want processing to stop, and enable it back you want to start processing again.

```javascript
queue.disable()
...
queue.enable()
```

> Note: disable does not stop the running callbacks. But rather, when they are done, next callbacks will not be triggered.

## Things that I need to think about

-   should I add functionality to stop running callbacks when disable is called?
-   should I make `add()` to trigger the process, instead of having a different `addAndProcess()` function?
