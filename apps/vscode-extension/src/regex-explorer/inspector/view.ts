import {
    CancellationTokenSource,
    window,
    type ExtensionContext,
    TreeDataProvider,
    type TreeItem,
    EventEmitter,
    type Event,
    TreeItemCollapsibleState,
    type Selection,
    type TextDocument,
    ThemeIcon,
} from 'vscode';

import { RegexRadarLanguageClient } from '@regex-radar/client';
import { EntryType, RegexEntry, type RegexAst, type RegexAstNode } from '@regex-radar/protocol';

import type { OnDidChangeTreeDataEventParams } from '../OnDidChangeTreeDataEventParams';

import {
    createInspectorViewEntry,
    getChildren,
    hasChildren,
    InspectorViewEntryType,
    type InspectorViewEntry,
} from './entry';

type IconPathKey = RegexAstNode['type'] | 'Flag';

const IconPath: Partial<Record<IconPathKey, ThemeIcon>> = {
    Pattern: new ThemeIcon('regex'),
    Flags: new ThemeIcon('symbol-object'),
    Flag: new ThemeIcon('symbol-property'),
};

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
            case InspectorViewEntryType.FLAG: {
                return {
                    label: element.flag,
                    iconPath: IconPath.Flag,
                    description: element.property,
                    tooltip: element.description,
                };
            }
            case InspectorViewEntryType.AST_NODE: {
                const collapsibleState = hasChildren(element.node)
                    ? TreeItemCollapsibleState.Collapsed
                    : TreeItemCollapsibleState.None;
                const item: TreeItem = {
                    iconPath: IconPath[element.node.type],
                    collapsibleState,
                };
                switch (element.node.type) {
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
                    case 'Pattern':
                    case 'Quantifier':
                    case 'RegExpLiteral':
                    case 'StringAlternative':
                    case 'Backreference':
                    case 'Character':
                    case 'CharacterSet':
                    case 'Flags':
                    case 'ModifierFlags': {
                        return {
                            ...item,
                            label: element.node.type,
                        };
                    }
                }
            }
        }
    }

    getChildren(element?: InspectorViewEntry | undefined): InspectorViewEntry[] {
        if (!element) {
            return this.getRoot();
        }
        return getChildren(element);
    }

    getRoot(): InspectorViewEntry[] {
        if (!this.ast) {
            return [];
        }
        const root = [createInspectorViewEntry(this.ast.pattern)];
        if (hasChildren(this.ast.flags)) {
            root.push(createInspectorViewEntry(this.ast.flags));
        }
        return root;
    }
}

const SUPPORTED_LANGUAGE_IDS = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'];

interface HandleSelectionChangeParams {
    client: RegexRadarLanguageClient;
    treeDataProvider: InspectorViewTreeDataProvider;
    document: TextDocument;
    selection: Selection;
}

// TODO: move this pattern to a debounce decorator? Maybe as utility package
let cancellationSource: CancellationTokenSource | null = null;

async function handleSelectionChange({
    client,
    treeDataProvider,
    document,
    selection,
}: HandleSelectionChangeParams) {
    if (!SUPPORTED_LANGUAGE_IDS.includes(document.languageId)) {
        return;
    }

    if (cancellationSource) {
        cancellationSource.cancel();
        cancellationSource.dispose();
    }

    cancellationSource = new CancellationTokenSource();
    const token = cancellationSource.token;

    const result = await client.regex.discovery(
        {
            uri: document.uri.toString(),
            hint: EntryType.File,
        },
        token,
    );

    if (token === cancellationSource.token) {
        cancellationSource.dispose();
        cancellationSource = null;
        if (token.isCancellationRequested) {
            return;
        }
    }

    if (!result || result.type !== EntryType.File) {
        return;
    }

    const match = result.children.find((entry) => {
        const range = client.protocol2CodeConverter.asRange(entry.location.range);
        return range.contains(selection);
    });
    if (match) {
        await treeDataProvider.update(match);
        // TODO: reveal the item that matches the selection best
    }
}

export function registerInspectorView(client: RegexRadarLanguageClient, context: ExtensionContext) {
    const treeDataProvider = new InspectorViewTreeDataProvider(client);
    const options = {
        treeDataProvider,
        showCollapseAll: true,
    };
    const treeView = window.createTreeView('regex-radar.regex-explorer.inspector-view', options);

    const disposable = window.onDidChangeTextEditorSelection((event) => {
        if (!treeView.visible) {
            return;
        }
        return handleSelectionChange({
            client,
            treeDataProvider,
            document: event.textEditor.document,
            selection: event.selections[0],
        });
    });
    context.subscriptions.push(treeView, disposable);

    if (window.activeTextEditor && window.activeTextEditor.selection) {
        handleSelectionChange({
            client,
            treeDataProvider,
            document: window.activeTextEditor.document,
            selection: window.activeTextEditor.selection,
        });
    }
}
