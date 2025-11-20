import type { CancellationToken } from 'vscode-languageserver';

import { Injectable, createInterfaceId } from '@gitlab/needle';

import type { Diagnostics as RecheckDiagnostics } from '@regex-radar/recheck-esm';
import { createCheck, threadWorker as backend, type CheckFn } from '@regex-radar/recheck-esm/core';

import { ILogger } from '../logger';
import { createAbortSignal } from '../util/abort-signal';

type CheckParam = {
    pattern: string;
    flags?: string;
};

type CheckResult =
    | { sync: true; diagnostics: RecheckDiagnostics }
    | { sync: false; promise: Promise<RecheckDiagnostics> };

export interface IRedosCheckService {
    check(param: CheckParam, token?: CancellationToken): CheckResult;
}

export const IRedosCheckService = createInterfaceId<IRedosCheckService>('IRedosCheckService');

// TODO: event emitter, push diagnostics

@Injectable(IRedosCheckService, [ILogger])
export class RedosCheckService implements IRedosCheckService {
    /**
     * TODO: LRU cache, persistent cache between sessions.
     */
    private cache = new Map<string, RecheckDiagnostics>();

    constructor(private readonly logger: ILogger) {}

    check(param: CheckParam, token?: CancellationToken): CheckResult {
        const diagnostics = this.cache.get(`/${param.pattern}/${param.flags}`);
        if (diagnostics) {
            return {
                sync: true,
                diagnostics,
            };
        } else {
            return {
                sync: false,
                /**
                 * `recheck` should have its own queuing implementation, and uses threads in native binaries, test for what is optimal performance / speed tradeoff
                 */
                promise: this.getCheck().then(async (check) => {
                    const result = await this.logger.time(
                        `recheck for '/${param.pattern}/${param.flags}' took $durationms`,
                        () => {
                            return check(param.pattern, param.flags ?? '', {
                                signal: token ? createAbortSignal(token) : token,
                            });
                        },
                    );
                    this.cache.set(`/${param.pattern}/${param.flags}`, result);
                    return result;
                }),
            };
        }
    }

    private checkFn: Promise<CheckFn> | undefined;
    private async getCheck(): Promise<CheckFn> {
        if (!this.checkFn) {
            const workerPath = import.meta.resolve('#workers/recheck/thread.worker');
            this.checkFn = createCheck(backend, workerPath);
        }
        return await this.checkFn;
    }
}
