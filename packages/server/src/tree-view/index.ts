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
import { ParseResult } from "../parse/ParseResult";

const cache = new Map<Uri, Exclude<Entry, RegexEntry>>();

export function registerTreeViewHandlers(connection: Connection, documents: TextDocuments<TextDocument>) {
    connection.onRequest(
        "regexRadar/getTreeViewChildren",
        async ({ entry }: { entry: Entry }): Promise<Entry[]> => {
            if (entry.type === EntryType.Regex) {
                return [];
            }
            if (isUriIgnored(entry.uri)) {
                return [];
            }
            switch (entry.type) {
                case EntryType.Workspace: {
                    const tree = await buildTreeFromWorkspace(entry.uri, documents);
                    return tree.children.filter((child) => deeplyContainsRegexEntry(child));
                }
                case EntryType.Directory: {
                    const tree = await buildTreeFromDirectory(entry.uri, documents);
                    return tree.children.filter((child) => deeplyContainsRegexEntry(child));
                }
                case EntryType.File: {
                    if (!isUriSupported(entry.uri)) {
                        return [];
                    }
                    const tree = await buildTreeFromFile(entry.uri, documents);
                    return tree.children;
                }
                default: {
                    throw new Error("unreachable");
                }
            }
        }
    );
}

function deeplyContainsRegexEntry(entry: Entry): boolean {
    if (entry.type === EntryType.Regex) {
        return false;
    }
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
    uri: string,
    documents: TextDocuments<TextDocument>
): Promise<WorkspaceEntry> {
    const uriAsString = uri.toString();
    const memo = cache.get(uriAsString);
    if (memo && memo.type === EntryType.Workspace) {
        return memo;
    }
    const result = await buildTreeFromDirectory(uri, documents);
    cache.set(uriAsString, result);
    return {
        ...result,
        type: EntryType.Workspace,
    };
}

async function buildTreeFromDirectory(
    uri: string | URI,
    documents: TextDocuments<TextDocument>
): Promise<DirectoryEntry> {
    const uriAsString = uri.toString();
    const memo = cache.get(uriAsString);
    if (memo && memo.type === EntryType.Directory) {
        return memo;
    }
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
                    return buildTreeFromFile(uri.toString(), documents);
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
    const result: DirectoryEntry = {
        uri: uri.toString(),
        type: EntryType.Directory,
        children,
    };
    cache.set(uriAsString, result);
    return result;
}

/**
 * Should only be called on paths that are supported
 * @see isUriSupported
 */
async function buildTreeFromFile(uri: string, documents: TextDocuments<TextDocument>): Promise<FileEntry> {
    const memo = cache.get(uri);
    if (memo && memo.type === EntryType.File) {
        return memo;
    }
    const document = await uriToDocument(uri, documents);
    const parseResult = parseJs(document);
    const result: FileEntry = {
        uri: uri.toString(),
        type: EntryType.File,
        children: parseResult.regexes.map((regex) => createRegexEntry(regex, uri)),
    };
    cache.set(uri, result);
    return result;
}

function createRegexEntry(regex: ParseResult["regexes"][number], uri: string): RegexEntry {
    return {
        type: EntryType.Regex,
        location: Location.create(uri, regex.node.range),
        info: {
            pattern: regex.pattern,
            flags: regex.flags,
        },
    };
}
