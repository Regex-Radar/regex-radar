import type { Descriptor } from '../di/service-provider';
import type { Constructor } from '../util/types';

import type { IOnCodeAction, IOnCodeActionResolve } from './events';
import { PreferRegexNewExpressionCodeAction } from './handlers/prefer-regex-new-expression';

export * from './events';
export * from './message-handler';

export const onCodeActionHandlers: Descriptor[] = [PreferRegexNewExpressionCodeAction];
