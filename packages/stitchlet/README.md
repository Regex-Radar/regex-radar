Maybe extract the @gitlab/needle DI part and publish it as a framework.

Biggest part is creating some helper functions like:

```ts
// entry.ts
const collection = createServiceCollection({
    connection: createConnection(ProposedFeatures.all),
    documents: new TextDocuments(TextDocument),
});
const provider = buildServiceProvider(collection);

const app = provider.getRequiredService(IApp);
// will call connection.listen()
app.start();
```

```ts
// An example of providing a code action
import { CodeActionParams, CodeAction, CodeActionKind, type Diagnostic } from 'vscode-languageserver';

import { Thread } from 'stitchlet';

import type { MaybePromise } from '../../util/maybe';
import { IOnCodeAction } from '../events';

@Thread(IOnCodeAction)
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
```

Probably even wrapping that in an object that kickstarts it.
`Connection` and `TextDocuments` should have sane defaults, but be configurable with a factory function

Availability:

```
npm view stitchlet
```
