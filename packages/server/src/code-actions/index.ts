import { PreferRegexNewExpressionCodeAction } from './diagnostics/prefer-regex-new-expression';

export * from './events';
export * from './message-handler';

export const codeActions = [PreferRegexNewExpressionCodeAction];
