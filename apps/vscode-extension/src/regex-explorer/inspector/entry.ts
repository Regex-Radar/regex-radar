import { type RegexAst, type RegexAstNode } from '@regex-radar/protocol';

export enum InspectorViewEntryType {
    UNKNOWN,
    AST_NODE,
    FLAG,
}

export type InspectorViewEntryFlag = {
    type: InspectorViewEntryType.FLAG;
    flag: 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'v' | 'y';
    description: string;
    property: keyof RegexAst['flags'];
};

export type InspectorViewEntryAstNode<T extends RegexAstNode = RegexAstNode> = {
    type: InspectorViewEntryType.AST_NODE;
    node: T;
};

export type InspectorViewEntry = InspectorViewEntryAstNode | InspectorViewEntryFlag;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags
 */
const flags: Omit<InspectorViewEntryFlag, 'type'>[] = [
    {
        flag: 'd',
        description: 'Generate indices for substring matches',
        property: 'hasIndices',
    },
    {
        flag: 'g',
        description: 'Global search',
        property: 'global',
    },
    {
        flag: 'i',
        description: 'Case-insensitive search',
        property: 'ignoreCase',
    },
    {
        flag: 'm',
        description:
            'Makes `^` and `$` match the start and end of each line instead of those of the entire string',
        property: 'multiline',
    },
    {
        flag: 's',
        description: 'Allows `.` to match newline characters',
        property: 'dotAll',
    },
    {
        flag: 'u',
        description: 'treat a pattern as a sequence of Unicode code points',
        property: 'unicode',
    },
    {
        flag: 'v',
        description: 'An upgrade to the `u` mode with more Unicode features.',
        property: 'unicodeSets',
    },
    {
        flag: 'y',
        description:
            'Perform a "sticky" search that matches starting at the current position in the target string.',
        property: 'sticky',
    },
];

export function createInspectorViewEntry<T extends RegexAstNode>(node: T): InspectorViewEntry {
    switch (node.type) {
        case 'Flags':
        case 'Pattern':
        case 'Alternative':
        case 'CapturingGroup':
        case 'CharacterClass':
        case 'CharacterClassRange':
        case 'ClassIntersection':
        case 'ClassStringDisjunction':
        case 'ClassSubtraction':
        case 'ExpressionCharacterClass':
        case 'Group':
        case 'Assertion':
        case 'Modifiers':
        case 'Quantifier':
        case 'RegExpLiteral':
        case 'StringAlternative':
        case 'Backreference':
        case 'Character':
        case 'CharacterSet':
        case 'ModifierFlags': {
            return {
                type: InspectorViewEntryType.AST_NODE,
                node,
            };
        }
    }
}

function getAstChildren(node: RegexAstNode): RegexAstNode[] {
    switch (node.type) {
        case 'Pattern': {
            return node.alternatives;
        }
        case 'Alternative': {
            return node.elements;
        }
        case 'CapturingGroup': {
            return node.alternatives;
        }
        case 'CharacterClass': {
            return node.elements;
        }
        case 'ClassIntersection': {
            return [node.left, node.right];
        }
        case 'ClassStringDisjunction': {
            return node.alternatives;
        }
        case 'ClassSubtraction': {
            return [node.left, node.right];
        }
        case 'ExpressionCharacterClass': {
            return [node.expression];
        }
        case 'Group': {
            return node.modifiers ? [...node.alternatives, node.modifiers] : node.alternatives;
        }
        case 'Modifiers': {
            return node.remove ? [node.add, node.remove] : [node.add];
        }
        case 'Quantifier': {
            return [node.element];
        }
        case 'StringAlternative': {
            return node.elements;
        }
        case 'Backreference': {
            return Array.isArray(node.resolved) ? node.resolved : [node.resolved];
        }
        case 'RegExpLiteral': {
            return [node.pattern, node.flags];
        }
        default: {
            return [];
        }
    }
}

export function getChildren(entry: InspectorViewEntry): InspectorViewEntry[] {
    switch (entry.type) {
        case InspectorViewEntryType.AST_NODE: {
            const node = entry.node;
            switch (node.type) {
                case 'Alternative': {
                    if (node.elements.length === 1) {
                        const entry = createInspectorViewEntry(node.elements[0]);
                        return getChildren(entry);
                    }
                    return node.elements.map((child) => createInspectorViewEntry(child));
                }
                case 'CapturingGroup':
                case 'CharacterClass':
                case 'CharacterClassRange':
                case 'ClassIntersection':
                case 'ClassStringDisjunction':
                case 'ClassSubtraction':
                case 'ExpressionCharacterClass':
                case 'Group':
                case 'Assertion':
                case 'Modifiers':
                case 'Pattern':
                case 'Quantifier':
                case 'RegExpLiteral':
                case 'StringAlternative':
                case 'Backreference':
                case 'Character':
                case 'CharacterSet': {
                    return getAstChildren(node).map((child) => {
                        return {
                            type: InspectorViewEntryType.AST_NODE,
                            node: child,
                        };
                    });
                }
                case 'Flags':
                case 'ModifierFlags': {
                    const children = flags.filter(
                        (flag) => flag.property in node && node[flag.property as keyof typeof node],
                    );
                    return children.map((child) => {
                        return {
                            ...child,
                            type: InspectorViewEntryType.FLAG,
                        };
                    });
                }
                default: {
                    return [];
                }
            }
        }
        default: {
            return [];
        }
    }
}

export function hasChildren(node: RegexAstNode): boolean {
    switch (node.type) {
        case 'Pattern': {
            return node.alternatives.length > 0;
        }
        case 'Alternative': {
            return node.elements.length > 0;
        }
        case 'CapturingGroup': {
            return node.alternatives.length > 0;
        }
        case 'CharacterClass': {
            return node.elements.length > 0;
        }
        case 'CharacterClassRange': {
            return false;
        }
        case 'ClassIntersection': {
            return true;
        }
        case 'ClassStringDisjunction': {
            return node.alternatives.length > 0;
        }
        case 'ClassSubtraction': {
            return true;
        }
        case 'ExpressionCharacterClass': {
            return true;
        }
        case 'Group': {
            return true;
        }
        case 'Assertion': {
            return false;
        }
        case 'Modifiers': {
            return true;
        }
        case 'Quantifier': {
            return true;
        }
        case 'StringAlternative': {
            return node.elements.length > 0;
        }
        case 'Backreference': {
            return true;
        }
        case 'Character': {
            return false;
        }
        case 'CharacterSet': {
            return false;
        }
        case 'ModifierFlags': {
            return flags.some((flag) => flag.property in node && node[flag.property as keyof typeof node]);
        }
        case 'RegExpLiteral': {
            return true;
        }
        case 'Flags': {
            return flags.some((flag) => node[flag.property]);
        }
    }
}
