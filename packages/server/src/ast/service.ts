import type { CancellationToken } from 'vscode-languageserver';

import { Injectable, createInterfaceId } from '@gitlab/needle';

import { RegExpParser, visitRegExpAST } from '@eslint-community/regexpp';
import type { RegExpVisitor } from '@eslint-community/regexpp/visitor';

import { RegexAst, RegexEntry, RegexMatchType, type RegexAstNode } from '@regex-radar/protocol';

export interface IAstService {
    ast(param: RegexEntry, token?: CancellationToken): RegexAst;
}

export const IAstService = createInterfaceId<IAstService>('IAstService');

@Injectable(IAstService, [])
export class AstService implements IAstService {
    private readonly parser = new RegExpParser({
        strict: true,
    });

    ast(param: RegexEntry, _token?: CancellationToken): RegexAst {
        const entry = param.match;
        const rawFlags = entry.type !== RegexMatchType.String ? entry.flags : '';
        const flags = this.parser.parseFlags(rawFlags);
        const pattern = this.parser.parsePattern(entry.pattern, void 0, void 0, {
            unicode: flags.unicode,
            unicodeSets: flags.unicodeSets,
        });
        removeParentReferences(pattern);
        return {
            pattern,
            flags,
        };
    }
}

/**
 * To serialize pattern, all `parent` (circular) references need to be removed
 */
function removeParentReferences(pattern: RegexAstNode) {
    visitRegExpAST(pattern, handlers);
}

const handlers: RegExpVisitor.Handlers = {
    onAlternativeEnter: deleteParentProperty,
    onAssertionEnter: deleteParentProperty,
    onBackreferenceEnter: deleteParentProperty,
    onCapturingGroupEnter: deleteParentProperty,
    onCharacterClassEnter: deleteParentProperty,
    onCharacterClassRangeEnter: deleteParentProperty,
    onCharacterEnter: deleteParentProperty,
    onCharacterSetEnter: deleteParentProperty,
    onClassIntersectionEnter: deleteParentProperty,
    onClassStringDisjunctionEnter: deleteParentProperty,
    onClassSubtractionEnter: deleteParentProperty,
    onExpressionCharacterClassEnter: deleteParentProperty,
    onFlagsEnter: deleteParentProperty,
    onGroupEnter: deleteParentProperty,
    onModifierFlagsEnter: deleteParentProperty,
    onModifiersEnter: deleteParentProperty,
    onPatternEnter: deleteParentProperty,
    onQuantifierEnter: deleteParentProperty,
    onRegExpLiteralEnter: deleteParentProperty,
    onStringAlternativeEnter: deleteParentProperty,
};
function deleteParentProperty(object: { parent?: unknown | null }) {
    delete object.parent;
}
