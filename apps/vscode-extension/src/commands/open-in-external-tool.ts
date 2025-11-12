import { commands, Uri, type ExtensionContext } from 'vscode';

import { RegexEntry } from '@regex-radar/lsp-types';

function buildQuery(params: Record<string, string>) {
    return Object.entries(params)
        .reduce((result, [key, value]) => {
            result += `${key}=${encodeURIComponent(value)}&`;
            return result;
        }, '')
        .slice(0, -1);
}

function createParams(entry: RegexEntry, expressionKey: string): Record<string, string> {
    const params: Record<string, string> = {
        [expressionKey]: entry.match.pattern,
    };
    if ('flags' in entry.match) {
        params['flags'] = entry.match.flags;
    }
    return params;
}

function createRegExrUri(entry: RegexEntry): Uri {
    return Uri.from({
        scheme: 'https',
        authority: 'regexr.com',
        path: '/',
        query: buildQuery(createParams(entry, 'expression')),
    });
}

function createRegex101Uri(entry: RegexEntry): Uri {
    return Uri.from({
        scheme: 'https',
        authority: 'regex101.com',
        path: '/',
        query: buildQuery(createParams(entry, 'regex')),
    });
}

export function registerOpenInExternalToolCommands(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('regex-radar.tree-data-provider.openInRegExr', (entry: RegexEntry) =>
            commands.executeCommand('vscode.open', createRegExrUri(entry).toString(true)),
        ),
        commands.registerCommand('regex-radar.tree-data-provider.openInRegex101', (entry: RegexEntry) =>
            commands.executeCommand('vscode.open', createRegex101Uri(entry).toString(true)),
        ),
    );
}
