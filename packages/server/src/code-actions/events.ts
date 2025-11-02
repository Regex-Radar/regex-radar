import type { CodeAction, CodeActionKind, CodeActionParams } from 'vscode-languageserver';

import { createInterfaceId } from '@gitlab/needle';

import type { MaybePromise } from '../util/maybe';

export interface IOnCodeAction {
    kinds: CodeActionKind[];
    onCodeAction(params: CodeActionParams): MaybePromise<CodeAction[]>;
}

export const IOnCodeAction = createInterfaceId<IOnCodeAction>('IOnCodeAction');
