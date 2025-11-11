import type {
    CancellationToken,
    InitializeParams,
    InitializeResult,
    SetTraceParams,
} from 'vscode-languageserver';

import { createInterfaceId } from '@gitlab/needle';

import type { LsConnection } from '../di';

/**
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize
 */
export interface IOnInitialize {
    /**
     * This function is sync on purpose,
     */
    onInitialize(
        params: InitializeParams,
        token?: CancellationToken,
    ): InitializeResult['capabilities'] | void;
}

export const IOnInitialize = createInterfaceId<IOnInitialize>('IOnInitialize');

/**
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialized
 */
export interface IOnInitialized {
    onInitialized(connection?: LsConnection): void | Promise<void>;
}

export const IOnInitialized = createInterfaceId<IOnInitialized>('IOnInitialized');

/**
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#setTrace
 */
export interface IOnSetTrace {
    onSetTrace(params: SetTraceParams): void | Promise<void>;
}

export const IOnSetTrace = createInterfaceId<IOnSetTrace>('IOnSetTrace');

/**
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#shutdown
 */
export interface IOnShutdown {
    onShutdown(token?: CancellationToken): void | Promise<void>;
}

export const IOnShutdown = createInterfaceId<IOnShutdown>('IOnShutdown');

/**
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#logTrace
 */
export interface IOnExit {
    onExit(): void | Promise<void>;
}

export const IOnExit = createInterfaceId<IOnExit>('IOnExit');
