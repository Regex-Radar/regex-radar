import { expect, it, describe, vi } from 'vitest';

import { RegexRadarLanguageClient } from '../RegexRadarLanguageClient';

const mocks = vi.hoisted(() => {
    return {
        'vscode-languageclient/node': {
            LanguageClient: vi.fn(class {}),
        },
    };
});

vi.mock(import('vscode-languageclient/node'), () => {
    return mocks['vscode-languageclient/node'] as unknown as typeof import('vscode-languageclient/node');
});

describe('RegexRadarLanguageClient.ts', () => {
    it('should extend the LanguageClient of vscode-languageclient/node', () => {
        const instance = new RegexRadarLanguageClient({ module: '' }, {});
        expect(instance).toBeInstanceOf(mocks['vscode-languageclient/node'].LanguageClient);
    });
    it('should implement the discovery message handlers', () => {
        const instance = new RegexRadarLanguageClient({ module: '' }, {});
        expect(instance.discovery).toBeTypeOf('function');
        expect(instance.onDiscoveryDidChange).toBeTypeOf('function');
    });
});
