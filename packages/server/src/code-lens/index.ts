import type { Descriptor } from '../di/service-provider';

import { RevealInRegexExporerCodeLens } from './handlers/reveal-in-regex-explorer';

export * from './message-handler';
export * from './events';

export const onCodeLensHandlers: Descriptor[] = [RevealInRegexExporerCodeLens];
