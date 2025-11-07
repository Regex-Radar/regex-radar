import type { CancellationToken } from 'vscode-languageserver';

import { Injectable, createInterfaceId } from '@gitlab/needle';

import {
    check,
    VulnerableDiagnostics as VulnerableRecheckDiagnostics,
    type Diagnostics as RecheckDiagnostics,
} from 'recheck';

type CheckParam = {
    pattern: string;
    flags?: string;
};

type QueueParam = CheckParam & {
    token?: CancellationToken;
};

export interface IRedosCheckService {
    check(param: CheckParam): VulnerableRecheckDiagnostics | undefined;
    queue(param: QueueParam): Promise<RecheckDiagnostics>;
}

export const IRedosCheckService = createInterfaceId<IRedosCheckService>('IRedosCheckService');

// TODO: runtime, scala jvm, scala.js, webworker?
// TODO: event emitter, push diagnostics

@Injectable(IRedosCheckService, [])
export class RedosCheckService implements IRedosCheckService {
    /**
     * Use a queue to only have a single check running at a time
     */
    private pending: Promise<unknown> = Promise.resolve();
    /**
     * TODO: LRU cache, persistent cache between sessions.
     */
    private cache = new Map<string, VulnerableRecheckDiagnostics>();

    check(param: CheckParam): VulnerableRecheckDiagnostics | undefined {
        const hit = this.cache.get(`/${param.pattern}/${param.flags}`);
        if (hit) {
            return hit;
        }
        this.queue(param);
    }

    async queue(param: QueueParam): Promise<RecheckDiagnostics> {
        // update the queue, keep a reference to the promise
        const promise = ((this.pending as Promise<RecheckDiagnostics>) = this.pending.then(async () => {
            const result = await check(param.pattern, param.flags ?? '');
            if (result.status === 'vulnerable') {
                // if its a vulnerable regex, cache the result
                this.cache.set(`/${param.pattern}/${param.flags}`, result);
            }
            return result;
        }));
        // return the promise that will eventually resolve to a diagnostics
        return promise;
    }
}
