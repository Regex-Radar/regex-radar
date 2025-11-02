import * as vscode from 'vscode';

import * as logger from './logger';
import { registerLanguageClient } from './client';
import { registerTreeView } from './tree-data-provider';

export async function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(logger);
    logger.info('activating');

    const client = await registerLanguageClient(context);
    registerTreeView(client, context);
}

export function deactivate() {
    logger.info('deactivating');
}
