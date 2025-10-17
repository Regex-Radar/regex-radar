import { LanguageClient, type LanguageClientOptions, type ServerOptions } from "vscode-languageclient/node";
import { displayName, name } from "../package.json";
import { Entry, EntryType } from "@regex-radar/lsp-types";

export class RegexRadarLanguageClient extends LanguageClient {
    constructor(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
        super(name, displayName, serverOptions, clientOptions);
    }

    async getTreeViewChildren(entry: Entry): Promise<Entry[]> {
        return await this.sendRequest("regexRadar/getTreeViewChildren", { entry });
    }
}
