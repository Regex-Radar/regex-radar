import {
    LanguageClient,
    URI as Uri,
    type LanguageClientOptions,
    type ServerOptions,
} from "vscode-languageclient/node";
import { displayName, name } from "../package.json";
import { Entry, EntryType } from "@regex-radar/lsp-types";

export class RegexRadarLanguageClient extends LanguageClient {
    constructor(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
        super(name, displayName, serverOptions, clientOptions);
    }

    async discovery(uri: Uri, hint?: EntryType): Promise<Entry | null> {
        return await this.sendRequest("regexRadar/discovery", { uri, hint });
    }
}
