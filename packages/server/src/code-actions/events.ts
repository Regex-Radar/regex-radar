import type {
    CancellationToken,
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Command,
} from 'vscode-languageserver';

import { createInterfaceId } from '@gitlab/needle';

import type { MaybePromise } from '../util/maybe';

export interface IOnCodeAction {
    kinds: CodeActionKind[];
    requiresResolveSupport?: boolean;
    onCodeAction(params: CodeActionParams, token?: CancellationToken): MaybePromise<CodeAction[]>;
}

export const IOnCodeAction = createInterfaceId<IOnCodeAction>('IOnCodeAction');

/**
 * TODO: support this
 */
export interface IOnCodeActionCommand {
    onCodeAction(params: CodeActionParams, token?: CancellationToken): MaybePromise<Command[]>;
}

export const IOnCodeActionCommand = createInterfaceId<IOnCodeActionCommand>('IOnCodeActionCommand');

export interface IOnCodeActionResolve {
    kinds: CodeActionKind[];
    IOnCodeActionResolve(action: CodeAction, token?: CancellationToken): MaybePromise<CodeAction>;
}

export const IOnCodeActionResolve = createInterfaceId<IOnCodeActionResolve>('IOnCodeActionResolve');
