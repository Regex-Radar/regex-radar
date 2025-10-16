import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { displayName, name } from "../package.json";

export class RegexRadarLanguageClient extends LanguageClient {
    constructor(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
        super(name, displayName, serverOptions, clientOptions);
    }

    async getTreeViewChildren(uri: string, type: unknown): Promise<unknown> {
        return await this.sendRequest("regexRadar/getTreeViewChildren", { uri: uri.toString(), type });
    }
}
