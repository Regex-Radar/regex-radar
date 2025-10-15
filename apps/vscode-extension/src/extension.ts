import * as vscode from "vscode";
import * as logger from "./logger";
import { RegexRadarTreeDataProvider } from "./tree-data-provider";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(logger);
    logger.info("activating");

    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    const treeView = vscode.window.createTreeView("regex-radar", {
        treeDataProvider: new RegexRadarTreeDataProvider(workspaceFolders),
        showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            // TODO: refresh treeView with new workspace folders
        })
    );
}

export function deactivate() {
    logger.info("deactivating");
}
