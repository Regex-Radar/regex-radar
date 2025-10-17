import { LanguageClient, type LanguageClientOptions, type ServerOptions } from "vscode-languageclient/node";
import { displayName, name } from "../package.json";
import { Entry, EntryType } from "@regex-radar/lsp-types";

export class RegexRadarLanguageClient extends LanguageClient {
    constructor(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
        super(name, displayName, serverOptions, clientOptions);
    }

    async getTreeViewChildren(uri: string, type: EntryType): Promise<Entry[]> {
        return await this.sendRequest("regexRadar/getTreeViewChildren", { uri: uri, type });
    }
}
