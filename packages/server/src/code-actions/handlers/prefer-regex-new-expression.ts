import { CodeActionParams, CodeAction, CodeActionKind, type Diagnostic } from 'vscode-languageserver';

import { Implements, Service, ServiceLifetime } from '@gitlab/needle';

import type { MaybePromise } from '../../util/maybe';
import { IOnCodeAction } from '../events';

@Implements(IOnCodeAction)
@Service({ dependencies: [], lifetime: ServiceLifetime.Singleton })
export class PreferRegexNewExpressionCodeAction implements IOnCodeAction {
    kinds: string[] = [CodeActionKind.QuickFix];
    onCodeAction(params: CodeActionParams): MaybePromise<CodeAction[]> {
        const diagnostics = params.context.diagnostics.filter(
            (diagnostic) => diagnostic.code === 'prefer-regex-new-expression',
        );
        return diagnostics.map((diagnostic) => createCodeAction(diagnostic, params.textDocument.uri));
    }
}

function createCodeAction(diagnostic: Diagnostic, uri: string): CodeAction {
    return {
        title: 'Convert to new expression',
        diagnostics: [diagnostic],
        isPreferred: true,
        kind: CodeActionKind.QuickFix,
        // TODO: use Annotated Text Edit
        // see: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocumentEdit
        edit: {
            changes: {
                [uri]: [
                    {
                        newText: 'new ',
                        range: {
                            start: diagnostic.range.start,
                            end: diagnostic.range.start,
                        },
                    },
                ],
            },
        },
    };
}
