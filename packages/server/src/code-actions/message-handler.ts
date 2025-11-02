import {
    type CancellationToken,
    type CodeAction,
    type CodeActionParams,
    CodeActionRequest,
    type Diagnostic,
} from 'vscode-languageserver';

import { Implements, Injectable, collection, createInterfaceId } from '@gitlab/needle';

import { IConfiguration } from '../configuration';
import { DOCUMENT_SELECTOR } from '../constants';
import { IServiceProvider } from '../di';
import { LsConnection } from '../di/external-interfaces';
import { IDiagnosticsService } from '../diagnostics';
import { IOnInitialized } from '../lifecycle';
import { IRequestMessageHandler } from '../message-handler';
import { Disposable } from '../util/disposable';
import type { MaybePromise } from '../util/maybe';
import { isInRange } from '../util/range';

import { IOnCodeAction } from './events';

export interface ICodeActionMessageHandler extends IRequestMessageHandler {
    onCodeAction(params: CodeActionParams, token?: CancellationToken): MaybePromise<CodeAction[]>;
    onCodeActionResolve?(params: CodeAction, token?: CancellationToken): MaybePromise<CodeAction>;
}

export const ICodeActionMessageHandler =
    createInterfaceId<ICodeActionMessageHandler>('ICodeActionMessageHandler');

@Implements(IOnInitialized)
@Implements(IRequestMessageHandler)
@Injectable(ICodeActionMessageHandler, [IConfiguration, IServiceProvider, LsConnection, IDiagnosticsService])
export class CodeActionMessageHandler
    extends Disposable
    implements ICodeActionMessageHandler, IOnInitialized
{
    private onCodeActionHandlers: IOnCodeAction[] = [];

    constructor(
        private readonly configuration: IConfiguration,
        private readonly provider: IServiceProvider,
        private readonly connection: LsConnection,
        private readonly diagnostics: IDiagnosticsService,
    ) {
        super();
    }

    async onInitialized(): Promise<void> {
        const capabilties = await this.configuration.get('client.capabilities');
        const codeActionCapabilities = capabilties.textDocument?.codeAction;

        if (codeActionCapabilities?.dynamicRegistration) {
            const onCodeActionHandlers = this.provider.getServices(collection(IOnCodeAction));

            const kinds = new Set(onCodeActionHandlers.flatMap((handler) => handler.kinds));
            this.onCodeActionHandlers = onCodeActionHandlers;

            // TODO: apply handler filtering based on `codeActionCapabilities`

            this.disposables.push(
                await this.connection.client.register(CodeActionRequest.type, {
                    codeActionKinds: [...kinds],
                    resolveProvider: false,
                    workDoneProgress: false,
                    documentSelector: DOCUMENT_SELECTOR,
                }),
            );
        }
    }

    register(connection: LsConnection) {
        this.disposables.push(this.connection.onCodeAction(this.onCodeAction.bind(this)));
    }

    async onCodeAction(params: CodeActionParams, token: CancellationToken): Promise<CodeAction[]> {
        // TODO: add caching
        const actions: CodeAction[] = [];
        params.context.diagnostics = await this.ensureDiagnostics(params);

        if (token.isCancellationRequested) {
            return actions;
        }

        this.onCodeActionHandlers.forEach(async (handler) => {
            if (token.isCancellationRequested) {
                return;
            }
            const result = handler.onCodeAction(params);
            if (result instanceof Promise) {
            } else {
                actions.push(...result);
            }
        });

        return actions;
    }

    private async ensureDiagnostics(params: CodeActionParams): Promise<Diagnostic[]> {
        if (params.context.diagnostics.length > 0) {
            return params.context.diagnostics;
        }
        const result = await this.diagnostics.onDiagnosticRequest(params);
        if (result.kind === 'full') {
            return result.items.filter((item) => isInRange(item.range, params.range));
        }
        return [];
    }
}
