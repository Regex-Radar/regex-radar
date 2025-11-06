import { Implements, Injectable, createInterfaceId } from '@gitlab/needle';

import type { LsConnection } from '../di/external-interfaces';
import { IRequestMessageHandler } from '../message-handler';
import { Disposable } from '../util/disposable';

import { IDiscoveryService } from './service';

export interface IDiscoveryRequestMessageHandler {}

export const IDiscoveryRequestMessageHandler = createInterfaceId<IDiscoveryRequestMessageHandler>(
    'IDiscoveryRequestMessageHandler',
);

@Implements(IRequestMessageHandler)
@Injectable(IDiscoveryRequestMessageHandler, [IDiscoveryService])
export class DiscoveryRequestMessageHandler
    extends Disposable
    implements IRequestMessageHandler, IDiscoveryRequestMessageHandler
{
    constructor(private readonly service: IDiscoveryService) {
        super();
    }

    register(connection: LsConnection): void {
        this.disposables.push(
            connection.onRequest('regexRadar/discovery', this.service.discover.bind(this.service)),
        );
    }
}
