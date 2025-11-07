import {
    type DocumentDiagnosticParams,
    type CancellationToken,
    type Diagnostic,
    DiagnosticSeverity,
} from 'vscode-languageserver';

import { Implements, Service, ServiceLifetime } from '@gitlab/needle';

import { EntryType } from '@regex-radar/lsp-types';

import { IConfiguration } from '../../../configuration';
import { EXTENSION_ID } from '../../../constants';
import { IDiscoveryService } from '../../../discovery';
import { IRedosCheckService } from '../../../redos/service';
import { IOnDocumentDiagnostic } from '../../events';

@Implements(IOnDocumentDiagnostic)
@Service({
    dependencies: [IConfiguration, IDiscoveryService, IRedosCheckService],
    lifetime: ServiceLifetime.Singleton,
})
export class RedosDiagnostic implements IOnDocumentDiagnostic {
    constructor(
        private readonly configuration: IConfiguration,
        private readonly discovery: IDiscoveryService,
        private readonly redos: IRedosCheckService,
    ) {}

    async onDocumentDiagnostic(
        params: DocumentDiagnosticParams,
        token?: CancellationToken,
    ): Promise<Diagnostic[]> {
        const configuration = await this.configuration.get('regex-radar.diagnostics');
        if (!configuration.linter.enabled || token?.isCancellationRequested) {
            return [];
        }

        const entries = await this.discovery.discover({ uri: params.textDocument.uri, hint: EntryType.File });
        if (!entries || token?.isCancellationRequested) {
            return [];
        }

        const syncChecks = entries.children.map((entry) => [entry, this.redos.check(entry.match)] as const);
        const diagnostics = syncChecks.reduce<Diagnostic[]>((results, [entry, vulnerable]) => {
            switch (vulnerable?.complexity.type) {
                case 'exponential': {
                    results.push({
                        message: `This regular expression is vulnerable to a ReDoS attack with complexity: ${vulnerable.complexity.summary}`,
                        code: `redos-exponential`,
                        range: entry.location.range,
                        data: vulnerable,
                        severity: DiagnosticSeverity.Error,
                        source: EXTENSION_ID,
                    });
                    break;
                }
                case 'polynomial': {
                    results.push({
                        message: `This regular expression is vulnerable to a ReDoS attack with complexity: ${vulnerable.complexity.summary}`,
                        code: `redos-polynomial`,
                        range: entry.location.range,
                        data: vulnerable,
                        severity: DiagnosticSeverity.Warning,
                        source: EXTENSION_ID,
                    });
                }
            }
            return results;
        }, []);

        return diagnostics;
    }
}
