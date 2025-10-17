import * as vscode from "vscode";
import { RegexRadarTreeDataProvider } from "./RegexRadarTreeDataProvider";
import { RegexRadarLanguageClient } from "@regex-radar/client";

export function registerTreeView(client: RegexRadarLanguageClient, context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    const treeView = vscode.window.createTreeView("regex-radar-tree-view", {
        treeDataProvider: new RegexRadarTreeDataProvider(client, workspaceFolders),
        showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // treeView.onDidChangeSelection((event) => {
    //     const selection = event.selection;
    //     if (selection.length === 1) {
    //         const entry = selection[0];
    //         if (entry.type === EntryType.Regex) {
    //             const [start, end] = entry
    //                 .resourceUri!.fragment.split(",")
    //                 .map((part) => part.split(":").map((part) => Number.parseInt(part)));
    //             vscode.window.showTextDocument(entry.resourceUri!, {
    //                 selection: new vscode.Range(start[0], start[1], end[0], end[1]),
    //             });
    //         }
    //     }
    // });

    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            // TODO: refresh treeView with new workspace folders
            // @see https://github.com/microsoft/vscode/wiki/Adopting-Multi-Root-Workspace-APIs
        })
    );
}
