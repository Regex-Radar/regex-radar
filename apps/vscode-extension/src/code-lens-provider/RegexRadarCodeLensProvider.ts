import { RegexRadarLanguageClient } from "@regex-radar/client";
import { EntryType, RegexEntry } from "@regex-radar/lsp-types";
import * as vscode from "vscode";

export class RegexRadarCodeLensProvider implements vscode.CodeLensProvider {
    constructor(private readonly client: RegexRadarLanguageClient) {}

    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const regexes = (await this.client.getTreeViewChildren({
            type: EntryType.File,
            uri: document.uri.toString(),
            children: [],
        })) as RegexEntry[];
        return regexes.map((entry) => {
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
