import { TextDocument, DocumentUri } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";

import * as path from "path";
import * as fs from "fs/promises";

import { createInterfaceId, Disposable, Implements, Service, ServiceLifetime } from "@gitlab/needle";

import { LsConnection, LsTextDocuments } from "./di";
import { IRequestMessageHandler } from "./message-handler";
import { fileExtensionToLanguageId } from "./language-identifiers";

export interface IDocumentsService extends IRequestMessageHandler {
    get(uri: DocumentUri): Promise<TextDocument>;
}

export const IDocumentsService = createInterfaceId<IDocumentsService>("IDocumentsService");

@Implements(IRequestMessageHandler)
@Implements(IDocumentsService)
@Service({
    dependencies: [LsTextDocuments],
    lifetime: ServiceLifetime.Singleton,
})
export class DocumentsService implements IDocumentsService, Disposable {
    private disposables: Disposable[] = [];

    constructor(private documents: LsTextDocuments) {}

    register(connection: LsConnection): void {
        this.disposables.push(this.documents.listen(connection));
    }

    dispose(): void {}

    async get(uri: DocumentUri): Promise<TextDocument> {
        let document = this.documents.get(uri);

        if (!document) {
            const fsPath = URI.parse(uri).fsPath;
            // TODO: add a FileSystemService
            const contents = await fs.readFile(fsPath, { encoding: "utf-8" });
            const extension = path.extname(fsPath);
            const languageId = fileExtensionToLanguageId[extension] || "plaintext";
            // TODO: cache this document instance?
            //       this could be cached, as long as there is no didOpen event, and the file disk is being watched for changes
            document = TextDocument.create(uri, languageId, 0, contents);
        }

        return document;
    }
}
