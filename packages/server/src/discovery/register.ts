import { Connection, TextDocuments, URI as Uri } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Entry, EntryType } from "@regex-radar/lsp-types";
import { buildTreeFromUri, isUriIgnored } from "../discovery/build";

export type DiscoveryParams = {
    uri: Uri;
    hint?: EntryType;
};

export function registerDiscoveryCommands(connection: Connection, documents: TextDocuments<TextDocument>) {
    connection.onRequest("regexRadar/discovery", async ({ uri }: DiscoveryParams): Promise<Entry | null> => {
        if (isUriIgnored(uri)) {
            return null;
        }
        return buildTreeFromUri(uri, documents);
    });
    // TODO: figure out what and how the client sends this
    connection.onNotification("regexRadar/discovery/refresh", async (): Promise<void> => {});
}
