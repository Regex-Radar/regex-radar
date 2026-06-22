// TODO: make this a (peer) dependecy of @regex-radar/protocol (?)
import type { AST } from '@eslint-community/regexpp';

export type RegexAst = AST.RegExpLiteral;

/**
 * NOTE: the `parent` property is deleted, because it prevents serialization (recursive references)
 * TODO: fix the parent references in the LanguageClient
 */
export type RegexAstNode = AST.Node;
