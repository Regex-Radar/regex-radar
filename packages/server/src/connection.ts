import { createInterfaceId, Injectable, type Disposable } from "@gitlab/needle";
import { LsConnection } from "./di";
import { ILifecycleHandler } from "./lifecycle";
import { IMessageHandler } from "./message-handler";

export interface IConnection {
    listen(): void;
}

export const IConnection = createInterfaceId<IConnection>("IConnection");

@Injectable(IConnection, [LsConnection, ILifecycleHandler, IMessageHandler])
export class Connection implements IConnection, Disposable {
    private disposables: Disposable[] = [];
    dispose(): void {
        this.disposables.forEach((disposable) => disposable.dispose());
    }

    constructor(
        private connection: LsConnection,
        private lifecycle: ILifecycleHandler,
        private messages: IMessageHandler
    ) {}

    listen(): void {
        this.lifecycle.register();
        this.messages.register();
        this.connection.listen();
    }
}
