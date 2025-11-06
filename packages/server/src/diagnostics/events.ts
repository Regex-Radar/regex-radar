import {
    type CancellationToken,
    type Diagnostic,
    type DocumentDiagnosticParams,
    type WorkspaceDiagnosticParams,
} from 'vscode-languageserver';

import { createInterfaceId } from '@gitlab/needle';

export interface IOnDocumentDiagnostic {
    interFileDependencies?: boolean;
    onDocumentDiagnostic(
        params: DocumentDiagnosticParams,
        token?: CancellationToken,
    ): Diagnostic[] | Promise<Diagnostic[]>;
}

export const IOnDocumentDiagnostic = createInterfaceId<IOnDocumentDiagnostic>('IOnDocumentDiagnostic');

export type IOnWorkspaceDiagnosticResult = Record<string, Diagnostic[]>;

export interface IOnWorkspaceDiagnostic {
    interFileDependencies?: boolean;
    onWorkspaceDiagnostic(
        params: WorkspaceDiagnosticParams,
        token?: CancellationToken,
    ): IOnWorkspaceDiagnosticResult | Promise<IOnWorkspaceDiagnosticResult>;
}

export const IOnWorkspaceDiagnostic = createInterfaceId<IOnWorkspaceDiagnostic>('IOnWorkspaceDiagnostic');
