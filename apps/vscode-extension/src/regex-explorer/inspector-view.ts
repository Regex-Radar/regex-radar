import {
    window,
    type ExtensionContext,
    TreeDataProvider,
    type TreeItem,
    EventEmitter,
    type Event,
    TreeItemCollapsibleState,
    type Selection,
    type TextDocument,
} from 'vscode';

import { RegexRadarLanguageClient } from '@regex-radar/client';
import { EntryType, RegexEntry, type RegexAst, type RegexAstNode } from '@regex-radar/protocol';

import type { OnDidChangeTreeDataEventParams } from './OnDidChangeTreeDataEventParams';

enum InspectorViewEntryType {
    UNKNOWN,
    AST_NODE,
    FLAGS,
    FLAG,
}

type InspectorViewEntryFlags = {
    type: InspectorViewEntryType.FLAGS;
    flags: RegexAst['flags'];
};

type InspectorViewEntryFlag = {
    type: InspectorViewEntryType.FLAG;
    flag: 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'v' | 'y';
    description: string;
    property: keyof RegexAst['flags'];
};

type InspectorViewEntryAstNode<T extends RegexAstNode = RegexAstNode> = {
    type: InspectorViewEntryType.AST_NODE;
    node: T;
};

type InspectorViewEntry = InspectorViewEntryAstNode | InspectorViewEntryFlags | InspectorViewEntryFlag;

class InspectorViewTreeDataProvider implements TreeDataProvider<InspectorViewEntry> {
    private _onDidChangeTreeData = new EventEmitter<OnDidChangeTreeDataEventParams<InspectorViewEntry>>();
    readonly onDidChangeTreeData: Event<OnDidChangeTreeDataEventParams<InspectorViewEntry>> =
        this._onDidChangeTreeData.event;

    private ast: RegexAst | null = null;

    constructor(private readonly client: RegexRadarLanguageClient) {}

    async update(regex: RegexEntry | null) {
        this.ast = regex ? await this.client.regex.ast(regex) : null;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: InspectorViewEntry): TreeItem {
        switch (element.type) {
            case InspectorViewEntryType.AST_NODE: {
                return {
                    label: element.node.type,
                };
            }
            case InspectorViewEntryType.FLAGS: {
                return {
                    label: element.flags.type,
                    collapsibleState: TreeItemCollapsibleState.Collapsed,
                };
            }
            case InspectorViewEntryType.FLAG: {
                return {
                    label: element.flag,
                    description: element.property,
                    tooltip: element.description,
                };
            }
        }
    }

    getChildren(element?: InspectorViewEntry | undefined): InspectorViewEntry[] {
        if (!element) {
            return this.getRoot();
        }
        switch (element.type) {
            case InspectorViewEntryType.AST_NODE: {
                return [];
            }
            case InspectorViewEntryType.FLAGS: {
                return this.createFlagsChildren(element.flags);
            }
            default: {
                return [];
            }
        }
    }

    getRoot(): InspectorViewEntry[] {
        return this.ast
            ? [this.createInspectorViewEntry(this.ast.pattern), this.createInspectorViewEntry(this.ast.flags)]
            : [];
    }

    private createInspectorViewEntry<T extends RegexAstNode>(node: T): InspectorViewEntry {
        switch (node.type) {
            case 'Flags': {
                return {
                    type: InspectorViewEntryType.FLAGS,
                    flags: node,
                };
            }
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

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags
     */
    private createFlagsChildren(flags: RegexAst['flags']): InspectorViewEntryFlag[] {
        const entries: Omit<InspectorViewEntryFlag, 'type'>[] = [
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
                property: 'ignoreCase',
            },
            {
                flag: 's',
                description: 'Allows `.` to match newline characters',
                property: 'ignoreCase',
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
        return entries
            .filter((flag) => {
                return flags[flag.property];
            })
            .map((flag) => {
                return {
                    type: InspectorViewEntryType.FLAG,
                    ...flag,
                };
            });
    }
}

export function registerInspectorView(client: RegexRadarLanguageClient, context: ExtensionContext) {
    const treeDataProvider = new InspectorViewTreeDataProvider(client);
    const options = {
        treeDataProvider,
        showCollapseAll: true,
    };
    const treeView = window.createTreeView('regex-radar.regex-explorer.inspector-view', options);

    async function handleSelectionChange(document: TextDocument, selections: readonly Selection[]) {
        if (document.uri.scheme !== 'file') {
            return;
        }
        const result = await client.regex.discovery({
            uri: document.uri.toString(),
            hint: EntryType.File,
        });
        if (!result || result.type !== EntryType.File) {
            return;
        }
        const match = result.children.find((entry) => {
            const range = client.protocol2CodeConverter.asRange(entry.location.range);
            return selections.find((selection) => range.contains(selection));
        });
        if (match) {
            await treeDataProvider.update(match);
        }
    }

    context.subscriptions.push(
        treeView,
        window.onDidChangeTextEditorSelection(async (event) => {
            if (!treeView.visible) {
                return;
            }
            return handleSelectionChange(event.textEditor.document, event.selections);
        }),
    );

    if (window.activeTextEditor && window.activeTextEditor.selections.length > 0) {
        handleSelectionChange(window.activeTextEditor.document, window.activeTextEditor.selections);
    }
}
