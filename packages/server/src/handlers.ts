import { NotificationHandler, RequestHandler } from "vscode-languageserver-protocol";

export interface HandlesRequest<Params, Result, Error> {
    requestHandler: RequestHandler<Params, Result, Error>;
}

export interface HandlesNotification<P> {
    notificationHandler: NotificationHandler<P>;
}
