import {
    type CancellationToken,
    type Disposable,
    LanguageClient,
    type LanguageClientOptions,
    type ServerOptions,
} from 'vscode-languageclient/node';

import type {
    DiscoveryDidChangeParams,
    DiscoveryParams,
    DiscoveryResult,
    RegexAst,
    RegexEntry,
} from '@regex-radar/protocol';

import { displayName, name } from '../package.json';

export class RegexRadarLanguageClientNamespace implements Disposable {
    private disposables: Disposable[] = [];
    constructor(private readonly client: RegexRadarLanguageClient) {}

    discovery(param: DiscoveryParams, token?: CancellationToken): Promise<DiscoveryResult> {
        return this.client.sendRequest('regexRadar/discovery', param, token);
    }

    onDiscoveryDidChange(handler: (param: DiscoveryDidChangeParams) => void | Promise<void>) {
        const disposable = this.client.onNotification('regexRadar/discovery/didChange', handler);
        this.disposables.push(disposable);
        return disposable;
    }

    ast(param: RegexEntry, token?: CancellationToken): Promise<RegexAst> {
        return this.client.sendRequest('regexRadar/ast', param, token);
    }

    dispose(): void {
        this.disposables.forEach((disposable) => disposable.dispose());
    }
}

export class RegexRadarLanguageClient extends LanguageClient implements Disposable {
    readonly regex = new RegexRadarLanguageClientNamespace(this);

    constructor(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
        super(name, displayName, serverOptions, clientOptions);
    }

    dispose(...args: Parameters<LanguageClient['dispose']>) {
        this.regex.dispose();
        return super.dispose(...args);
    }
}
