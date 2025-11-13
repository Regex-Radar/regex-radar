import type { Descriptor } from '../di/service-provider';

import { RegexRadarCodeLens } from './handlers/regex-radar';

export * from './message-handler';
export * from './events';

export const onCodeLensHandlers: Descriptor[] = [RegexRadarCodeLens];
