import { createConnection, TextDocuments, ProposedFeatures } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { DiscoveryService } from "./discovery";

import { IMessageHandler, MessageHandler } from "./message-handler";
import { buildServiceProvider, createServiceCollection } from "./di";
import { DocumentsService } from "./documents";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const collection = createServiceCollection({
    connection,
    documents,
});
const provider = buildServiceProvider(collection, {
    constructors: [MessageHandler, DiscoveryService, DocumentsService],
});

// The message handler will register all message/lifecycle handlers that are registered with the service collection
const messageHandler = provider.getRequiredService(IMessageHandler);
messageHandler.register();

// Listen on the connection
connection.listen();
