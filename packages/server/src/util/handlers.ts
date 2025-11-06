import type {
    CancellationToken,
    ResultProgressReporter,
    WorkDoneProgressReporter,
} from 'vscode-languageserver';

import type { ILogger } from '../logger';

import { resultOrCancellation } from './cancellation-promise';
import type { MaybePromise } from './maybe';

export async function runHandlers<T>(
    handlers: (() => MaybePromise<T[]>)[],
    token?: CancellationToken,
    workDone?: WorkDoneProgressReporter,
    progress?: ResultProgressReporter<T[]>,
    logger?: ILogger,
): Promise<T[]> {
    const results: T[] = [];
    const pending: Promise<T[]>[] = [];

    // TODO: use work done progress reporter?
    for (const handler of handlers) {
        if (token?.isCancellationRequested) {
            break;
        }
        try {
            const result = handler();
            if (result instanceof Promise) {
                // TODO: use result progress reporter?
                pending.push(result);
            } else {
                results.push(...result);
            }
        } catch (error) {
            logger?.thrown(error);
        }
    }

    if (pending.length > 0 && !token?.isCancellationRequested) {
        const result = await resultOrCancellation(Promise.allSettled(pending), token);
        if (Array.isArray(result)) {
            for (const promise of result) {
                if (promise.status === 'fulfilled') {
                    results.push(...promise.value);
                } else {
                    logger?.thrown(promise.reason);
                }
            }
        }
    }

    return results;
}
