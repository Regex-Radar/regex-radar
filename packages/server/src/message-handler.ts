import { collection, createInterfaceId, Disposable, Injectable } from "@gitlab/needle";
import { LsConnection } from "./di/external-interfaces";
import { IOnExit, IOnInitialize, IOnInitialized, IOnShutdown } from "./lifecycle";
import { InitializeResult, TextDocumentSyncKind } from "vscode-languageserver";

export interface IRequestMessageHandler {
    register(connection: LsConnection): void;
}

export const IRequestMessageHandler = createInterfaceId<IRequestMessageHandler>("IRequestMessageHandler");

export interface INotificationMessageHandler {
    register(connection: LsConnection): void;
}

export const INotificationMessageHandler = createInterfaceId<INotificationMessageHandler>(
    "INotificationMessageHandler"
);

export interface IMessageHandler {
    register(): void;
}

export const IMessageHandler = createInterfaceId<IMessageHandler>("IMessageHandler");

@Injectable(IMessageHandler, [
    LsConnection,
    collection(IRequestMessageHandler),
    collection(INotificationMessageHandler),
    collection(IOnInitialize),
    collection(IOnInitialized),
    collection(IOnShutdown),
    collection(IOnExit),
])
export class MessageHandler implements IMessageHandler, Disposable {
    private disposables: Disposable[] = [];

    dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
    }

    constructor(
        private connection: LsConnection,
        private requestHandlers: IRequestMessageHandler[],
        private notificationHandlers: INotificationMessageHandler[],
        private onInitializeHandlers: IOnInitialize[],
        private onInitializedHandlers: IOnInitialized[],
        private onShutdownHandlers: IOnShutdown[],
        private onExitHandlers: IOnExit[]
    ) {}

    register() {
        this.requestHandlers.forEach((requestHandler) => requestHandler.register(this.connection));
        this.notificationHandlers.forEach((notificationHandler) =>
            notificationHandler.register(this.connection)
        );

        this.disposables.push(
            /**
             * @see https://microsoft.github.io/language-server-protocol/specifications/specification-current#initialize
             */
            this.connection.onInitialize(async (params, token) => {
                const results = await Promise.all(
                    this.onInitializeHandlers.map(async ({ onInitialize }) => {
                        try {
                            return onInitialize(params, token);
                        } catch (error: unknown) {
                            this.handleError("onInitialize", error);
                            return {};
                        }
                    })
                );
                return results.reduce<InitializeResult>(
                    (previous, current) => {
                        // TODO: implement this properly
                        return previous;
                    },
                    {
                        capabilities: {
                            textDocumentSync: {
                                change: TextDocumentSyncKind.Incremental,
                                openClose: true,
                            },
                        },
                    }
                );
            }),
            /**
             * @see https://microsoft.github.io/language-server-protocol/specifications/specification-current#initialized
             */
            this.connection.onInitialized(async (params) => {
                await Promise.all(
                    this.onInitializedHandlers.map(({ onInitialized }) => {
                        try {
                            return onInitialized(params);
                        } catch (error: unknown) {
                            this.handleError("onInitialized", error);
                        }
                    })
                );
            }),
            /**
             * @see https://microsoft.github.io/language-server-protocol/specifications/specification-current#initialized
             *
             */
            this.connection.onShutdown(async () => {
                await Promise.all(
                    this.onShutdownHandlers.map(({ onShutdown }) => {
                        try {
                            return onShutdown();
                        } catch (error: unknown) {
                            this.handleError("onShutdown", error);
                        }
                    })
                );
            }),
            /**
             *
             * @see https://microsoft.github.io/language-server-protocol/specifications/specification-current#initialized
             */
            this.connection.onExit(async () => {
                await Promise.all(
                    this.onExitHandlers.map(({ onExit }) => {
                        try {
                            return onExit();
                        } catch (error: unknown) {
                            this.handleError("onExit", error);
                        }
                    })
                );
            })
        );
    }

    private handleError(name: string, error: unknown) {
        if (error instanceof Error) {
            this.connection.console.error(error.toString());
        } else if (error != null && typeof error["toString"] === "function") {
            this.connection.console.error(`caught thrown value: ${error}`);
        } else {
            this.connection.console.error(`unknown error occured in lifecycle event: ${name}`);
        }
    }
}
