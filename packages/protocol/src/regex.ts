import type { lsp } from './lsp';

export type RegexMatch = RegexMatchLiteral | RegexMatchConstructor | RegexMatchFunction | RegexMatchString;

export enum RegexMatchType {
    Unknown = 0,
    Literal = 1,
    Constructor = 2,
    Function = 3,
    String = 4,
}

interface RegexMatchBase {
    type: RegexMatchType;
    range: lsp.Range;
}

export interface RegexMatchLiteral extends RegexMatchBase {
    type: RegexMatchType.Literal;
    pattern: string;
    flags: string;
}

export interface RegexMatchConstructor extends RegexMatchBase {
    type: RegexMatchType.Constructor;
    pattern: string;
    flags: string;
}

export interface RegexMatchFunction extends RegexMatchBase {
    type: RegexMatchType.Function;
    pattern: string;
    flags: string;
}

export interface RegexMatchString extends RegexMatchBase {
    type: RegexMatchType.String;
    pattern: string;
}
