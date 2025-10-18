import { RegexRadarLanguageClient } from "@regex-radar/client";
import { EntryType, FileEntry, RegexEntry } from "@regex-radar/lsp-types";
import * as vscode from "vscode";

export class RegexRadarCodeLensProvider implements vscode.CodeLensProvider {
    constructor(private readonly client: RegexRadarLanguageClient) {}

    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const entry = (await this.client.discovery(
            document.uri.toString(),
            EntryType.File
        )) as FileEntry | null;
        if (!entry) {
            return [];
        }
        return entry.children.map((entry) => {
            return {
                isResolved: true,
                range: this.client.protocol2CodeConverter.asRange(entry.location.range),
                command: {
                    command: "regex-radar.tree-data-provider.reveal",
                    title: "Regex Explorer",
                    tooltip: "Reveal in the Regex Explorer",
                    arguments: [entry],
                },
            };
        });
    }
}
