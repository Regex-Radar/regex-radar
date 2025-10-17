import * as vscode from "vscode";
import { RegexRadarTreeDataProvider } from "./RegexRadarTreeDataProvider";
import { RegexRadarLanguageClient } from "@regex-radar/client";
import { Entry } from "@regex-radar/lsp-types";

export function registerTreeView(client: RegexRadarLanguageClient, context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    const treeDataProvider = new RegexRadarTreeDataProvider(client, workspaceFolders);
    const options: vscode.TreeViewOptions<Entry> = {
        treeDataProvider,
        showCollapseAll: true,
    };
    context.subscriptions.push(
        vscode.window.createTreeView("regex-radar.explorer.tree-view", options),
        vscode.window.createTreeView("regex-radar.regex-explorer.tree-view", options)
    );

    vscode.commands.registerCommand("regex-radar.tree-data-provider.refresh", () =>
        treeDataProvider.refresh()
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            // TODO: refresh treeView with new workspace folders
            // @see https://github.com/microsoft/vscode/wiki/Adopting-Multi-Root-Workspace-APIs
        })
    );
}
