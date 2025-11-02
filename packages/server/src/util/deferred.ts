export interface Deferred<T, E extends Error = Error> extends Promise<T> {
    resolve(value: T): void;
    reject(reason: E): void;
}

export function createDeferred<T = void, E extends Error = Error>(): Deferred<T, E> {
    const withResolvers = Promise.withResolvers<T>();
    const promise = withResolvers.promise as Deferred<T>;
    promise['resolve'] = withResolvers.resolve;
    promise['reject'] = withResolvers.reject;
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
