import {
    CodeLensRefreshRequest,
    CodeLensRequest,
    type CancellationToken,
    type CodeLens,
    type CodeLensParams,
    type ResultProgressReporter,
    type WorkDoneProgressReporter,
} from 'vscode-languageserver';

import { Implements, Injectable, createInterfaceId } from '@gitlab/needle';

import { IConfiguration } from '../configuration';
import { DOCUMENT_SELECTOR } from '../constants';
import { IServiceProvider, LsConnection } from '../di';
import { IOnInitialized } from '../lifecycle';
import { resultOrCancellation } from '../util/cancellation-promise';
import { Disposable } from '../util/disposable';
import type { MaybePromise } from '../util/maybe';

import { IOnCodeLens, IOnCodeLensResolve } from './events';

export interface ICodeLensMessageHandler {
    onCodeLens(
        params: CodeLensParams,
        token?: CancellationToken,
        workDone?: WorkDoneProgressReporter,
        progress?: ResultProgressReporter<CodeLens[]>,
    ): MaybePromise<CodeLens[]>;
    onCodeLensResolve(lens: CodeLens, token?: CancellationToken): MaybePromise<CodeLens>;
    refresh(): void;
}

export const ICodeLensMessageHandler = createInterfaceId<ICodeLensMessageHandler>('ICodeLensMessageHandler');

@Implements(IOnInitialized)
@Injectable(ICodeLensMessageHandler, [IConfiguration, IServiceProvider, LsConnection])
export class CodeLensMessageHandler extends Disposable implements ICodeLensMessageHandler {
    private supportsRefresh?: boolean;
    private onCodeLensHandlers: IOnCodeLens[] = [];
    private onCodeLensResolveHandlers: IOnCodeLensResolve[] = [];

    constructor(
        private readonly configuration: IConfiguration,
        private readonly provider: IServiceProvider,
        private readonly connection: LsConnection,
    ) {
        super();
    }

    async onInitialized() {
        const capabilties = await this.configuration.get('client.capabilities');
        const codeLensCapabilities = capabilties.textDocument?.codeLens;

        this.supportsRefresh = capabilties.workspace?.codeLens?.refreshSupport;

        if (!codeLensCapabilities?.dynamicRegistration) {
            return;
        }

        const onCodeLensHandlers = this.provider.getServices(IOnCodeLens);
        const onCodeLensResolveHandlers = this.provider.getServices(IOnCodeLensResolve);

        const hasCodeLensHandlers = onCodeLensHandlers.length > 0;
        const hasCodeLensResolveHandlers = onCodeLensResolveHandlers.length > 0;

        this.onCodeLensHandlers = onCodeLensHandlers;
        this.onCodeLensResolveHandlers = onCodeLensResolveHandlers;

        const registerParams: Record<string, any> = {
            documentSelector: DOCUMENT_SELECTOR,
            resolveProvider: hasCodeLensResolveHandlers,
        };
        if (capabilties.window?.workDoneProgress) {
            registerParams.workDoneProgress = true;
        }

        if (hasCodeLensHandlers) {
            this.disposables.push(this.connection.onCodeLens(this.onCodeLens.bind(this)));
        }

        if (hasCodeLensResolveHandlers) {
            this.disposables.push(this.connection.onCodeLensResolve(this.onCodeLensResolve.bind(this)));
        }

        const disposable = await this.connection.client.register(CodeLensRequest.type, registerParams);
        this.disposables.push(disposable);
    }

    async onCodeLens(
        params: CodeLensParams,
        token?: CancellationToken,
        workDone?: WorkDoneProgressReporter,
        progress?: ResultProgressReporter<CodeLens[]>,
    ): Promise<CodeLens[]> {
        const lenses: CodeLens[] = [];
        const handlers = this.onCodeLensHandlers;

        if (handlers.length === 0) {
            return lenses;
        }

        const pending: Promise<CodeLens[]>[] = [];
        for (const handler of handlers) {
            if (token?.isCancellationRequested) {
                break;
            }
            try {
                const result = handler.onCodeLens(params);
                if (result instanceof Promise) {
                    // TODO: use result progress reporter?
                    pending.push(result);
                } else {
                    lenses.push(...result);
                }
            } catch (error) {
                // TODO: log error
            }
        }

        if (pending.length > 0 && !token?.isCancellationRequested) {
            const result = await resultOrCancellation(Promise.allSettled(pending), token);
            if (Array.isArray(result)) {
                for (const promise of result) {
                    if (promise.status === 'fulfilled') {
                        lenses.push(...promise.value);
                    } else {
                        // TODO: log error
                    }
                }
            }
        }

        return lenses;
    }

    async onCodeLensResolve(lens: CodeLens, token?: CancellationToken): Promise<CodeLens> {
        // TODO: implement this
        return lens;
    }

    refresh(): void {
        if (this.supportsRefresh) {
            this.connection.sendRequest(CodeLensRefreshRequest.type);
        }
    }
}
