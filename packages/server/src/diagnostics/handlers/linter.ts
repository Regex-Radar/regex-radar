import {
    type CancellationToken,
    type Diagnostic,
    DiagnosticSeverity,
    type DocumentDiagnosticParams,
} from 'vscode-languageserver';

import { Implements, Injectable, createInterfaceId } from '@gitlab/needle';

import { EntryType, RegexMatchType } from '@regex-radar/lsp-types';

import { EXTENSION_ID } from '../../constants';
import { IDiscoveryService } from '../../discovery';
import { IOnDocumentDiagnostic } from '../events';

export interface ILinter {}

export const ILinter = createInterfaceId<ILinter>('ILinter');

@Implements(IOnDocumentDiagnostic)
@Injectable(ILinter, [IDiscoveryService])
export class Linter implements ILinter, IOnDocumentDiagnostic {
    constructor(private readonly discovery: IDiscoveryService) {}

    async onDocumentDiagnostic(
        params: DocumentDiagnosticParams,
        token?: CancellationToken,
    ): Promise<Diagnostic[]> {
        const entries = await this.discovery.discover({ uri: params.textDocument.uri, hint: EntryType.File });
        if (!entries || token?.isCancellationRequested) {
            return [];
        }
        return entries.children.reduce<Diagnostic[]>((results, entry) => {
            if (entry.match.type === RegexMatchType.Function) {
                results.push({
                    range: entry.location.range,
                    source: EXTENSION_ID,
                    message: DO_NOT_USE_REGEXP_AS_FUNCTION_MESSAGE,
                    severity: DiagnosticSeverity.Warning,
                    code: 'prefer-regex-new-expression',
                });
            }
            return results;
        }, []);
    }
}

/**
 * TODO: implement these + configuration to enable/disable
 */
const codeToMessage: Record<string, string> = {
    /**
     * @see https://eslint.org/docs/latest/rules/prefer-regex-literals
     */
    'prefer-regex-literals': '',
    /**
     * @see https://eslint.org/docs/latest/rules/no-invalid-regexp
     */
    'no-invalid-regexp': '',
    /**
     * @see https://eslint.org/docs/latest/rules/no-control-regex
     */
    'no-control-regex': '',
    /**
     * @see https://eslint.org/docs/latest/rules/no-regex-spaces
     */
    'no-regex-spaces': '',
    /**
     *
     */
    'prefer-regex-new-expression': '',
};

const DO_NOT_USE_REGEXP_AS_FUNCTION_MESSAGE = `
'RegExp()' can be called with or without 'new', but sometimes with different effects.
Consider using a new expression.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp#return_value for the edge case.
`.trim();
