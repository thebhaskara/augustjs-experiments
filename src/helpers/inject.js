import { WATCH, CHANGE, INJECT, OPTIONAL } from './constants';


export function formatCallback(context, pathSets, callback, Model) {
    let watchedModels = [];
    let models = [];
    let correctedPathSets = pathSets.map(set => {
        if (isString(set)) {
            return [WATCH, context, set, '']
        } else if (isArray(set)) {
            let temp = [...set];
            let res = [];
            let prop;

            prop = temp.shift()
            if (prop === WATCH || prop === CHANGE || prop === INJECT) {
                res.push(prop);
                prop = temp.shift()
            } else {
                res.push(WATCH);
            }

            if (prop === context || prop instanceof Model) {
                res.push(prop);
                prop = temp.shift();
            } else {
                res.push(context);
            }

            let isWatch = res[0] === WATCH;
            let model = res[res.length - 1];
            if (!models.find(m => m === model)) {
                models.push(model);
                if (isWatch) {
                    watchedModels.push(model);
                }
            }

            if (isString(prop) && prop !== OPTIONAL) {
                res.push(prop);
                prop = temp.shift();
            } else {
                throw "unexpected path set";
            }

            res.push(prop);
        }
    });

    return {
        models,
        watchedModels,
        pathSets: correctedPathSets,
        injectedCallback() {
            let args = [];
            for (let set in correctedPathSets) {
                let val = context.get(set[2])
                if (isUndefined(val) && set[3] !== OPTIONAL) {
                    return;
                }
                args.push(val);
            }
            return callback.apply(context, args.concat(arguments));
        }
    }
}