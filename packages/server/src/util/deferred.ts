export interface Deferred<T, E extends Error = Error> extends Promise<T> {
    resolve(value: T): void;
    reject(reason: E): void;
}

export function createDeferred<T, E extends Error = Error>(): Deferred<T, E> {
    const { promise, resolve, reject } = Promise.withResolvers<T>();
    (promise as Deferred<T>)['resolve'] = resolve;
    (promise as Deferred<T>)['reject'] = reject;
    return promise as Deferred<T>;
}

export function isDeferred(promise: Promise<unknown>): promise is Deferred<unknown> {
    return (
        promise != null &&
        'resolve' in promise &&
        typeof promise['resolve'] === 'function' &&
        'reject' in promise &&
        typeof promise['reject'] === 'function'
    );
}
