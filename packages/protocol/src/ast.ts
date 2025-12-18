// TODO: make this a (peer) dependecy of @regex-radar/protocol (?)
import type { AST } from '@eslint-community/regexpp';

export type RegexAst = {
    pattern: AST.Pattern;
    flags: AST.Flags;
};

export type RegexAstNode = AST.Node;
