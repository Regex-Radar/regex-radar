import { PreferRegexNewExpressionCodeAction } from './handlers/prefer-regex-new-expression';

export * from './events';
export * from './message-handler';

export const onCodeActionHandlers = [PreferRegexNewExpressionCodeAction];
