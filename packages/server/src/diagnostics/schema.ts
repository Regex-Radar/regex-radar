import { defaultLinterConfiguration, type LinterConfigurationSchema } from './handlers/linter/schema';
import { defaultRedosConfiguration, type RedosConfigurationSchema } from './handlers/redos/schema';

type Language = 'javascript' | 'typescript';

export interface DiagnosticsConfigurationSchema {
    languages: Language[];
    linter: LinterConfigurationSchema;
    redos: RedosConfigurationSchema;
}

export const defaultDiagnosticsConfigurationSchema: DiagnosticsConfigurationSchema = {
    languages: ['javascript', 'typescript'],
    linter: defaultLinterConfiguration,
    redos: defaultRedosConfiguration,
};
