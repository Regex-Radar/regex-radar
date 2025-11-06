import type { Constructor } from '../util/types';

import type { IOnDocumentDiagnostic, IOnWorkspaceDiagnostic } from './events';
import { Linter } from './handlers/linter';

export { IOnDocumentDiagnostic, IOnWorkspaceDiagnostic } from './events';
export { IDiagnosticsMessageHandler, DiagnosticsMessageHandler } from './message-handler';

export const onDiagnosticHandlers: (
    | Constructor<IOnDocumentDiagnostic>
    | Constructor<IOnWorkspaceDiagnostic>
)[] = [Linter];
