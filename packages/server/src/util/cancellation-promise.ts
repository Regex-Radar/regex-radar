import { CancellationToken, type Disposable } from 'vscode-languageserver';

import { createDeferred, type Deferred } from './deferred';

/**
 * Create a promise that will resolve with the result, or with a `CancellationError` if the cancellation was requested.
 *
 * @example
 * ```ts
 * declare const token: CancelationToken;
 * declare const computeCodeLens: () => Promise<CodeLens>;
 *
 * const result = await resultOrCancellation(computeCodeLens(), token);
 *
 * // Check for a `CancellationError`
 * if (result instanceof CancellationError) {
 *   // cancellation was requested before `computeCodeLens()` was fulfilled
 * } else {
 *   // `computeCodeLens` was fullfilled
 *   // `result` is the `CodeLens` value returned from `computeCodeLens`
 * }
 *
 * // or check for the `cause` property being equal to the intial CancellationToken
 * if ('cause' in result && result.cause === token) {
 *   // cancellation was requested before `computeCodeLens()` was fulfilled
 * }
 * ```
 *
 * Prefer `resultOrCancellation` over `createCancellationPromise`, as `resultOrCancellation` will call `dispose` on dangling promises automatically.
 */
export function resultOrCancellation<T>(
    promise: Promise<T>,
    token?: CancellationToken,
): Promise<T | CancellationError> {
    if (!token) {
        return promise;
    }
    const cancellationPromise = createCancellationPromise(token);
    return Promise.race([promise, cancellationPromise])
        .then((result) => {
            cancellationPromise.dispose();
            return result;
        })
        .catch((error) => {
            if (error instanceof CancellationError) {
                return error;
            } else {
                throw error;
            }
        }) as Promise<T>;
}

export type CancellationPromise = Promise<void> & Disposable;

export class CancellationError extends Error {
    readonly name: 'CancellationError' = 'CancellationError' as const;
    declare readonly cause: CancellationToken;

    constructor(token: CancellationToken) {
        super('cancellation was requested', {
            cause: token,
        });
    }
}

/**
 * Convert a cancellation token to a deffered promise that will reject if the cancellation is requested.
 * To prevent a dangling promise, the deferred should be resolved after the token is no longer needed.
 * This can be done with its `dispose` method.
 */
export function createCancellationPromise(token: CancellationToken): CancellationPromise {
    const deferred = createDeferred<void, CancellationError>() as Deferred<void, CancellationError> &
        Disposable;
    token.onCancellationRequested(() => deferred.reject(new CancellationError(token)));
    deferred['dispose'] = () => deferred.resolve();
    return deferred;
}
