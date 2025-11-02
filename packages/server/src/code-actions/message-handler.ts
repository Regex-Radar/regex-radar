import {
    type CancellationToken,
    type CodeAction,
    type CodeActionKind,
    type CodeActionParams,
    CodeActionRequest,
    type Diagnostic,
    type ResultProgressReporter,
    type WorkDoneProgressReporter,
} from 'vscode-languageserver';

import { Implements, Injectable, collection, createInterfaceId } from '@gitlab/needle';

import { IConfiguration } from '../configuration';
import { DOCUMENT_SELECTOR } from '../constants';
import { IServiceProvider } from '../di';
import { LsConnection } from '../di/external-interfaces';
import { IDiagnosticsService } from '../diagnostics';
import { IOnInitialized } from '../lifecycle';
import { unique } from '../util/array';
import { resultOrCancellation } from '../util/cancellation-promise';
import { Disposable } from '../util/disposable';
import type { MaybePromise } from '../util/maybe';
import { isInRange } from '../util/range';

import { IOnCodeAction, IOnCodeActionResolve } from './events';

export interface ICodeActionMessageHandler {
    onCodeAction(
        param: CodeActionParams,
        token?: CancellationToken,
        workDone?: WorkDoneProgressReporter,
        progress?: ResultProgressReporter<CodeAction[]>,
    ): MaybePromise<CodeAction[]>;
    onCodeActionResolve(params: CodeAction, token?: CancellationToken): MaybePromise<CodeAction>;
}

export const ICodeActionMessageHandler =
    createInterfaceId<ICodeActionMessageHandler>('ICodeActionMessageHandler');

@Implements(IOnInitialized)
@Injectable(ICodeActionMessageHandler, [IConfiguration, IServiceProvider, LsConnection, IDiagnosticsService])
export class CodeActionMessageHandler
    extends Disposable
    implements ICodeActionMessageHandler, IOnInitialized
{
    private onCodeActionHandlers: IOnCodeAction[] = [];
    private onCodeActionResolveHandlers: IOnCodeActionResolve[] = [];

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

        if (!codeActionCapabilities?.dynamicRegistration) {
            return;
        }

        if (!codeActionCapabilities.codeActionLiteralSupport) {
            // TODO: maybe allow for command based implementations?
            return;
        }

        let onCodeActionHandlers = this.provider.getServices(collection(IOnCodeAction)).filter((handler) => {
            const canHandleResolve = codeActionCapabilities.resolveSupport || !handler.requiresResolveSupport;
            const kindMatches = kindIntersects(
                handler.kinds,
                codeActionCapabilities.codeActionLiteralSupport!.codeActionKind.valueSet,
            );
            return canHandleResolve && kindMatches;
        });

        let onCodeActionResolveHandlers = codeActionCapabilities.resolveSupport
            ? this.provider.getServices(collection(IOnCodeActionResolve))
            : [];

        const registerParams: Record<string, any> = {
            codeActionKinds: unique(onCodeActionHandlers.flatMap((handler) => handler.kinds)),
            // TODO: dynamic document selector
            documentSelector: DOCUMENT_SELECTOR,
        };

        this.onCodeActionHandlers = onCodeActionHandlers;
        this.onCodeActionResolveHandlers = onCodeActionResolveHandlers;

        const hasCodeActionHandlers = onCodeActionHandlers.length > 0;
        const hasCodeActionResolveHandlers = onCodeActionResolveHandlers.length > 0;

        if (hasCodeActionHandlers) {
            this.disposables.push(this.connection.onCodeAction(this.onCodeAction.bind(this)));
        }

        if (hasCodeActionResolveHandlers) {
            this.disposables.push(this.connection.onCodeActionResolve(this.onCodeActionResolve.bind(this)));
        }

        if (hasCodeActionHandlers || hasCodeActionResolveHandlers) {
            if (codeActionCapabilities.resolveSupport) {
                registerParams.resolveProvider = hasCodeActionResolveHandlers;
            }
            if (capabilties.window?.workDoneProgress) {
                registerParams.workDoneProgress = true;
            }
            const disposable = await this.connection.client.register(CodeActionRequest.type, registerParams);
            this.disposables.push(disposable);
        }
    }

    async onCodeAction(
        params: CodeActionParams,
        token?: CancellationToken,
        workDone?: WorkDoneProgressReporter,
        progress?: ResultProgressReporter<CodeAction[]>,
    ): Promise<CodeAction[]> {
        const actions: CodeAction[] = [];
        const handlers = params.context.only
            ? this.onCodeActionHandlers.filter((handler) =>
                  kindIntersects(handler.kinds, params.context.only!),
              )
            : this.onCodeActionHandlers;

        if (handlers.length === 0) {
            return actions;
        }

        const pending: Promise<CodeAction[]>[] = [];
        params.context.diagnostics = await this.ensureDiagnostics(params);

        // TODO: use work done progress reporter?

        for (const handler of handlers) {
            if (token?.isCancellationRequested) {
                break;
            }
            try {
                const result = handler.onCodeAction(params);
                if (result instanceof Promise) {
                    // TODO: use result progress reporter?
                    pending.push(result);
                } else {
                    actions.push(...result);
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
                        actions.push(...promise.value);
                    } else {
                        // TODO: log error
                    }
                }
            }
        }

        return actions;
    }

    onCodeActionResolve(action: CodeAction): MaybePromise<CodeAction> {
        // TODO: implement this
        return action;
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

/**
 * returns `true` if any kind in `b` intersects with any kind in `a`
 * TODO: callers should implement a cache or sorted resultset with the return value
 */
function kindIntersects(a: CodeActionKind[], b: CodeActionKind[]): boolean {
    return a.some((kind) => b.some((requested) => kind.startsWith(requested)));
}
