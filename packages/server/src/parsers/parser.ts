import { Range, URI } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";

export interface IParser {
    parse(document: TextDocument): Promise<ParseResult> | ParseResult;
}

export interface ParseResult {
    uri: URI;
    regexes: RegexMatch[];
}

export interface RegexMatch {
    pattern: string;
    flags: string;
    range: Range;
}
