import { Connection, Location, TextDocuments, URI as Uri } from "vscode-languageserver";
import { URI } from "vscode-uri";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as fs from "fs/promises";
import * as path from "path";
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

// let c!: Connection;

export function registerTreeViewHandlers(connection: Connection, documents: TextDocuments<TextDocument>) {
    // c = connection;
    connection.onRequest(
        "regexRadar/getTreeViewChildren",
        async ({ uri, type }: { uri: Uri; type: EntryType }): Promise<Entry[]> => {
            if (isUriIgnored(uri)) {
                return [];
            }
            switch (type) {
                case EntryType.Workspace: {
                    return (await buildTreeFromWorkspace(uri, documents)).children.filter((child) =>
                        deeplyContainsRegexEntry(child)
                    );
                }
                case EntryType.Directory: {
                    return (await buildTreeFromDirectory(uri, documents)).children.filter((child) =>
                        deeplyContainsRegexEntry(child)
                    );
                }
                case EntryType.File: {
                    if (!isUriSupported(uri)) {
                        return [];
                    }
                    return (await buildTreeFromFile(uri, documents)).children;
                }
                default: {
                    return [];
                }
            }
        }
    );
}

function deeplyContainsRegexEntry(entry: WorkspaceEntry | DirectoryEntry | FileEntry): boolean {
    if (entry.type === EntryType.File) {
        return entry.children.length > 0;
    }
    return !!entry.children.find((child) => deeplyContainsRegexEntry(child));
}

// TODO: implement this with some kind of .ignore configuration
const ALWAYS_IGNORE = ["node_modules", ".git", ".github", ".turbo", ".vscode", ".vscode-test", "dist", "out"];

/**
 * Returns `true` if the given `uri` is ignored.
 */
function isUriIgnored(uri: Uri): boolean {
    const fsPath = URI.parse(uri).fsPath;
    return isFsPathIgnored(fsPath);
}

/**
 * Returns `true` if the given `fsPath` is ignored.
 */
function isFsPathIgnored(fsPath: string): boolean {
    const dirname = path.basename(fsPath);
    if (ALWAYS_IGNORE.includes(dirname)) {
        return true;
    }
    const pathContainsIgnoredDirectory = !!ALWAYS_IGNORE.find((ignore) =>
        fsPath.includes(`${path.sep}${ignore}${path.sep}`)
    );
    return pathContainsIgnoredDirectory;
}

// TODO: implement this through configuration (partially)
const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/**
 * Returns `true` if the given `uri` can be parsed for regexes, `false` if otherwise.
 */
function isUriSupported(uri: Uri): boolean {
    const fsPath = URI.parse(uri).fsPath;
    return isFsPathSupported(fsPath);
}

/**
 * Returns `true` if the given `fsPath` can be parsed for regexes, `false` if otherwise.
 */
function isFsPathSupported(fsPath: string): boolean {
    const extension = path.extname(fsPath);
    const result = SUPPORTED_EXTENSIONS.includes(extension);
    return result;
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
                    if (isFsPathIgnored(entryPath) || !isFsPathSupported(entryPath)) {
                        return;
                    }
                    const uri = URI.file(entryPath);
                    return buildTreeFromFile(uri, documents);
                } else if (entry.isDirectory()) {
                    const entryPath = path.join(fsPath, entry.name);
                    if (isFsPathIgnored(entryPath)) {
                        return;
                    }
                    const uri = URI.file(entryPath);
                    return buildTreeFromDirectory(uri, documents);
                }
            })
        )
    ).filter((child) => !!child);
    return {
        uri: uri.toString(),
        type: EntryType.Directory,
        children,
    };
}

/**
 * Should only be called on paths that are supported
 * @see isUriSupported
 */
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
