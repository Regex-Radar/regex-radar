import * as vscode from "vscode";
import { EntryType, Entry, WorkspaceEntry } from "@regex-radar/lsp-types";
import { RegexRadarLanguageClient } from "@regex-radar/client";

/**
 * @see https://code.visualstudio.com/api/extension-guides/tree-view
 */
export class RegexRadarTreeDataProvider implements vscode.TreeDataProvider<Entry> {
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    constructor(
        private readonly client: RegexRadarLanguageClient,
        private readonly workspaceFolders: readonly vscode.WorkspaceFolder[]
    ) {}

    // TODO: implement this for `reveal` action
    // getParent(element: Entry): vscode.ProviderResult<Entry> {

    // }

    getTreeItem(entry: Entry): vscode.TreeItem {
        return createTreeItem(entry);
    }

    async getChildren(entry?: Entry): Promise<Entry[]> {
        if (!entry) {
            return this.getRoot();
        }
        switch (entry.type) {
            case EntryType.Workspace:
            case EntryType.Directory:
            case EntryType.File: {
                const response = await this.client.getTreeViewChildren(entry.uri, entry.type);
                return response;
            }
            case EntryType.Regex:
            default: {
                return [];
            }
        }
    }

    async getRoot(): Promise<Entry[]> {
        // if there is only 1 workspace, use it as root to skip 1 nesting level
        const workspaces = this.workspaceFolders.map((workspace): WorkspaceEntry => {
            return {
                type: EntryType.Workspace,
                uri: workspace.uri.toString(),
                children: [],
            };
        });
        if (workspaces.length === 1) {
            return this.getChildren(workspaces[0]);
        }
        return workspaces;
    }
}

const ThemeIcon: Record<EntryType, vscode.ThemeIcon> = {
    [EntryType.Uknown]: new vscode.ThemeIcon("circle-filled"),
    [EntryType.Workspace]: new vscode.ThemeIcon("root-folder"),
    [EntryType.Directory]: vscode.ThemeIcon.Folder,
    [EntryType.File]: vscode.ThemeIcon.File,
    [EntryType.Regex]: new vscode.ThemeIcon("regex"),
};

function createTreeItem(entry: Entry): vscode.TreeItem {
    const iconPath = ThemeIcon[entry.type] || ThemeIcon[EntryType.Uknown];
    switch (entry.type) {
        case EntryType.Workspace:
        case EntryType.Directory:
        case EntryType.File: {
            return {
                resourceUri: vscode.Uri.parse(entry.uri),
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                iconPath,
            };
        }
        case EntryType.Regex: {
            const args: [string, vscode.TextDocumentShowOptions] = [
                entry.location.uri,
                {
                    selection: new vscode.Range(
                        entry.location.range.start.line,
                        entry.location.range.start.character,
                        entry.location.range.end.line,
                        entry.location.range.end.character
                    ),
                },
            ];
            return {
                label: `/${entry.info.pattern}/${entry.info.flags}`,
                iconPath,
                command: {
                    command: "vscode.open",
                    title: "Open",
                    arguments: args,
                },
            };
        }
        default: {
            return {
                label: `<invalid entry with type ${EntryType[entry["type"]] || "<invalid>"}>`,
                iconPath,
            };
        }
    }
}
