import * as vscode from "vscode";
import { EntryType, Entry, WorkspaceEntry } from "@regex-radar/lsp-types";
import { RegexRadarLanguageClient } from "@regex-radar/client";

/**
 * @see https://code.visualstudio.com/api/extension-guides/tree-view
 */
export class RegexRadarTreeDataProvider implements vscode.TreeDataProvider<Entry> {
    constructor(
        private readonly client: RegexRadarLanguageClient,
        private readonly workspaceFolders: readonly vscode.WorkspaceFolder[]
    ) {}

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

const ThemeIcon = {
    Regex: new vscode.ThemeIcon("regex"),
};

function createTreeItem(entry: Entry): vscode.TreeItem {
    switch (entry.type) {
        case EntryType.Workspace:
        case EntryType.Directory:
        case EntryType.File: {
            return {
                resourceUri: vscode.Uri.parse(entry.uri),
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            };
        }
        case EntryType.Regex: {
            return {
                label: `/${entry.info.pattern}/${entry.info.flags}`,
                iconPath: ThemeIcon.Regex,
            };
        }
    }
}
