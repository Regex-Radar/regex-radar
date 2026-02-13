import { Implements, Injectable, createInterfaceId } from '@gitlab/needle';

import type { LsConnection } from '../di/external-interfaces';
import { IRequestMessageHandler } from '../message-handler';
import { Disposable } from '../util/disposable';

import { IAstService } from './service';

export type IAstRequestMessageHandler = object;

export const IAstRequestMessageHandler =
    createInterfaceId<IAstRequestMessageHandler>('IAstRequestMessageHandler');

@Implements(IRequestMessageHandler)
@Injectable(IAstRequestMessageHandler, [IAstService])
export class AstRequestMessageHandler
    extends Disposable
    implements IRequestMessageHandler, IAstRequestMessageHandler
{
    constructor(private readonly service: IAstService) {
        super();
    }

    register(connection: LsConnection): void {
        this.disposables.push(connection.onRequest('regexRadar/ast', this.service.ast.bind(this.service)));
    }
}
