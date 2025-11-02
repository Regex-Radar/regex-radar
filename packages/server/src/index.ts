import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DiscoveryService } from './discovery';

import { buildServiceProvider, createServiceCollection, LsConnection } from './di';
import { MessageHandler } from './message-handler';
import { LifecycleHandler } from './lifecycle';
import { DocumentsService } from './documents';
import { Logger } from './logger';
import { Connection, IConnection } from './connection';
import { ParserProvider } from './parsers';
import { DiagnosticsService } from './diagnostics';
import { CodeActionService } from './code-actions';
import { Configuration } from './configuration';

const collection = createServiceCollection({
    connection: createConnection(ProposedFeatures.all),
    documents: new TextDocuments(TextDocument),
});
const provider = buildServiceProvider(collection, {
    constructors: [
        Connection,
        LifecycleHandler,
        MessageHandler,
        Configuration,
        Logger,
        DiscoveryService,
        DocumentsService,
        ParserProvider,
        DiagnosticsService,
        CodeActionService,
    ],
});

// TODO: use dynamic registration (onInitialized), instead of static registration (onInitialize)

/**
 *`connection` is considered the root of the server application, calling `.listen()` will bootstrap and start the server.
 */
const connection = provider.getRequiredService(IConnection);
connection.listen();

// This *should* run `dispose` on all disposables registered in the service provider.
process.addListener('beforeExit', (code) => {
    provider.dispose();
});
