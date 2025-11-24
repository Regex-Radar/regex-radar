import { expect, it, describe, vi } from 'vitest';

import * as index from '../src/index';
import { RegexRadarLanguageClient } from '../src/RegexRadarLanguageClient';

vi.mock('vscode-languageclient/node', async () => {
    return {
        LanguageClient: vi.fn(class {}),
    };
});

describe('index.ts', () => {
    it('should should export the RegexRadarLanguageClient', () => {
        expect(index.RegexRadarLanguageClient).toBe(RegexRadarLanguageClient);
    });
});
