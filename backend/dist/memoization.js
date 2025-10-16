"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMemoizedAsyncFunction = void 0;
/**
 * Memoizes an async function.  The `makeMemoKey` function will be called to convert a function's
 * arguments to a string key that will be used to cache the results. The optional `maxCacheLength`
 * will trim the first item from the memoized cache whenever the limit is reached.
 */
const makeMemoizedAsyncFunction = (originalFunction, makeMemoKey, maxCacheLength) => {
    const cache = {};
    const memoizedFunction = async (...args) => {
        const key = makeMemoKey(...args);
        if (key && cache[key]) {
            return cache[key];
        }
        else {
            const response = await originalFunction(...args);
            if (key) {
                cache[key] = response;
                if (maxCacheLength !== undefined) {
                    // trim old cache entries
                    const cacheLength = Object.keys(cache).length;
                    if (cacheLength > maxCacheLength) {
                        const firstCacheKey = Object.keys(cache)[0];
                        delete cache[firstCacheKey];
                    }
                }
            }
            return response;
        }
    };
    return memoizedFunction;
};
exports.makeMemoizedAsyncFunction = makeMemoizedAsyncFunction;
