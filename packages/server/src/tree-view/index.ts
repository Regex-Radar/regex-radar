import { Connection, Location, TextDocuments } from "vscode-languageserver";
import { URI } from "vscode-uri";
import * as fs from "fs/promises";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { parseJs } from "../parse/parseJs";
import { uriToDocument } from "../documents";
import {
    Entry,
    EntryType,
    DirectoryEntry,
    FileEntry,
    RegexEntry,
    WorkspaceEntry,
} from "@regex-radar/lsp-types";

export function registerTreeViewHandlers(connection: Connection, documents: TextDocuments<TextDocument>) {
    connection.onRequest(
        "regexRadar/getTreeViewChildren",
        async ({ uri, type }: { uri: string; type: EntryType }): Promise<Entry[]> => {
            switch (type) {
                case EntryType.Workspace: {
                    return [await buildTreeFromWorkspace(uri, documents)];
                }
                case EntryType.Directory: {
                    return [await buildTreeFromDirectory(uri, documents)];
                }
                case EntryType.File: {
                    return [await buildTreeFromFile(uri, documents)];
                }
                default: {
                    return [];
                }
            }
        }
    );
}

async function buildTreeFromWorkspace(
    uri: string | URI,
    documents: TextDocuments<TextDocument>
): Promise<WorkspaceEntry> {
    const result = await buildTreeFromDirectory(uri, documents);
    return {
        ...result,
        type: EntryType.Workspace,
    };
}

async function buildTreeFromDirectory(
    uri: string | URI,
    documents: TextDocuments<TextDocument>
): Promise<DirectoryEntry> {
    uri = typeof uri === "string" ? URI.parse(uri) : uri;
    const fsPath = uri.fsPath;
    const entries = await fs.readdir(fsPath, { withFileTypes: true });
    const children = (
        await Promise.all(
            entries.map((entry) => {
                if (entry.isFile()) {
                    const entryPath = path.join(fsPath, entry.name);
                    const uri = URI.file(entryPath);
                    return buildTreeFromFile(uri, documents);
                } else if (entry.isDirectory()) {
                    const entryPath = path.join(fsPath, entry.name);
                    const uri = URI.file(entryPath);
                    return buildTreeFromDirectory(uri, documents);
                }
            })
        )
    ).filter((child) => child != null);
    return {
        uri: uri.toString(),
        type: EntryType.Directory,
        children,
    };
}

async function buildTreeFromFile(
    uri: string | URI,
    documents: TextDocuments<TextDocument>
): Promise<FileEntry> {
    uri = typeof uri === "string" ? URI.parse(uri) : uri;
    const document = await uriToDocument(uri.toString(), documents);
    const parseResult = parseJs(document);
    return {
        uri: uri.toString(),
        type: EntryType.File,
        children: parseResult.regexes.map((entry): RegexEntry => {
            return {
                type: EntryType.Regex,
                location: Location.create(uri.toString(), entry.node.range),
                info: {
                    pattern: entry.pattern,
                    flags: entry.flags,
                },
            };
        }),
    };
}
