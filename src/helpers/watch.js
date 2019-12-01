let watchCounter = 0;
let watchesByContext = new WeakMap();
let watchQueueByContext = new WeakMap();
let isSuspendedByContext = new WeakMap();

export function watch(context, path, callback) {

    let watches = watchesByContext.get(context) || [];

    let watch = { id: watchCounter++, path, callback };
    watches.push(watch);

    watchesByContext.set(context, watches);
    return watch.id;
}

export function queueWatchesForPath(context, path) {

    let watches = watchesByContext.get(context) || [];
    let watchesOnMatchedPaths = watches.filter(w =>
        w.path == path || w.path.startsWith(path + '.') || path.startsWith(w.path + '.'))

    let queue = watchQueueByContext.get(context) || [];
    queue = queue.concat(watchesOnMatchedPaths)
        // filtering for unique callbacks
        .filter((watch, index, queue) =>
            queue.findIndex(qw => watch.callback == qw.callback) == index
        );

    watchQueueByContext.set(context, queue);

    processQueue(context);
}

export function processQueue(context) {
    let isSuspended = isSuspendedByContext.get(context) || 0;
    let queue = watchQueueByContext.get(context) || [];

    if (isSuspended == 0 && queue.length > 0) {
        // suspend(context);
        let watch = queue[0];
        watch.callback(context.get(watch.path));
        // resume(context);
        processQueue();
    }
}

export function suspend(context) {
    let isSuspended = isSuspendedByContext.get(context) || 0;
    isSuspendedByContext.set(context, isSuspended + 1);
}

export function resume(context) {
    let isSuspended = (isSuspendedByContext.get(context) || 0) - 1;

    if (isSuspended < 1) {
        isSuspended = 0;
        isSuspendedByContext.set(context, isSuspended);
        processQueue(context);
    } else {   
        isSuspendedByContext.set(context, isSuspended);
    }
}

export function unwatch(context, identifier) {

    let watches = watchesByContext.get(context) || [];
    let queue = watchQueueByContext.get(context) || [];

    if (typeof identifier == "number") {
        watches = watches.filter(w => w.id != identifier);
        queue = queue.filter(w => w.id != identifier);
    } else if (typeof identifier == "string") {
        watches = watches.filter(w => w.path != identifier);
        queue = queue.filter(w => w.path != identifier);
    }

    watchesByContext.set(context, watches);
    watchQueueByContext.set(context, queue);

}

export function destroyWatches() {
    watchesByContext.set(context, []);
    isSuspendedByContext.set(context, false);
    watchQueueByContext.set(context, []);
}