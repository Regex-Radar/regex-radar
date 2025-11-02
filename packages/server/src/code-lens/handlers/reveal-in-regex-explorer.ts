import type { CodeLensParams, CodeLens, CancellationToken } from 'vscode-languageserver';

import { Implements, Service, ServiceLifetime } from '@gitlab/needle';

import { EntryType } from '@regex-radar/lsp-types';

import { IDiscoveryService } from '../../discovery';
import { IOnCodeLens } from '../events';

@Implements(IOnCodeLens)
@Service({
    dependencies: [IDiscoveryService],
    lifetime: ServiceLifetime.Singleton,
})
export class RevealInRegexExporerCodeLens implements IOnCodeLens {
    constructor(private readonly discovery: IDiscoveryService) {}

    async onCodeLens(params: CodeLensParams, token: CancellationToken): Promise<CodeLens[]> {
        const entry = await this.discovery.discover({
            uri: params.textDocument.uri,
            hint: EntryType.File,
        });
        if (!entry) {
            return [];
        }
        return entry.children.map((entry) => {
            return {
                isResolved: true,
                range: entry.location.range,
                command: {
                    command: 'regex-radar.tree-data-provider.reveal',
                    title: 'Regex Explorer',
                    tooltip: 'Reveal in the Regex Explorer',
                    arguments: [entry],
                },
            };
        });
    }
}
