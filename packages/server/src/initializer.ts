import { Injectable, Disposable, createInterfaceId } from "@gitlab/needle";
import { InitializeError, InitializeParams, InitializeResult } from "vscode-languageserver";
import { HandlesRequest } from "./handlers";

import { LsConnection } from "./di/external-interfaces";
import packageJson from "../package.json";

export interface IInitializeHandler
    extends HandlesRequest<InitializeParams, InitializeResult, InitializeError>,
        Disposable {}

export const IInitializeHandler = createInterfaceId<InitializeHandler>("IInitializeHandler");

@Injectable(IInitializeHandler, [LsConnection])
class InitializeHandler implements IInitializeHandler {
    private disposables: Disposable[] = [];

    constructor(private readonly connection: LsConnection) {
        this.disposables.push(connection.onInitialize(this.requestHandler));
    }

    requestHandler(params: InitializeParams) {
        const capabilities = params.capabilities;

        const result: InitializeResult = {
            capabilities: {},
            serverInfo: {
                name: packageJson.name,
                version: packageJson.version,
            },
        };
        return result;
    }

    dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
    }
}
