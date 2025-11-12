import type { ExtensionContext } from 'vscode';

import * as logger from './logger';
import { registerLanguageClient } from './client';
import { registerOpenInExternalToolCommands } from './commands/open-in-external-tool';
import { registerTreeView } from './regex-explorer';

export async function activate(context: ExtensionContext) {
    context.subscriptions.push(logger);
    logger.info('activating');

    const client = await registerLanguageClient(context);
    registerTreeView(client, context);
    registerOpenInExternalToolCommands(context);
}

export function deactivate() {
    logger.info('deactivating');
}
