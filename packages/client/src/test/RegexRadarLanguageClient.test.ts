import { expect, it, describe, vi } from 'vitest';

import { RegexRadarLanguageClient } from '../RegexRadarLanguageClient';

const mocks = vi.hoisted(() => {
    return {
        'vscode-languageclient/node': {
            LanguageClient: vi.fn(class {}),
        },
    };
});

type LanguageClientParams = ConstructorParameters<typeof RegexRadarLanguageClient>;
type LanguageClientParamsOptional = [] | [Partial<LanguageClientParams[0]>, Partial<LanguageClientParams[1]>];

function createInstance(...args: LanguageClientParamsOptional): RegexRadarLanguageClient {
    const defaultArgs: ConstructorParameters<typeof RegexRadarLanguageClient> = [{ module: '' }, {}];
    const params = defaultArgs.map((arg, index) => Object.assign(arg, args[index])) as typeof defaultArgs;
    return new RegexRadarLanguageClient(...params);
}

vi.mock(import('vscode-languageclient/node'), () => {
    return mocks['vscode-languageclient/node'] as unknown as typeof import('vscode-languageclient/node');
});

describe('RegexRadarLanguageClient.ts', () => {
    it('should extend the LanguageClient of vscode-languageclient/node', () => {
        const instance = createInstance();
        expect(instance).toBeInstanceOf(mocks['vscode-languageclient/node'].LanguageClient);
    });
});

describe('RegexRadarLanguageClient#discovery', () => {
    it('should implement the discovery message handlers', () => {
        const instance = createInstance();
        expect(instance.regex.discovery).toBeTypeOf('function');
        expect(instance.regex.onDiscoveryDidChange).toBeTypeOf('function');
    });
});

describe('RegexRadarLanguageClient#ast', () => {
    it('should implement the ast message handlers', () => {
        const instance = createInstance();
        expect(instance.regex.ast).toBeTypeOf('function');
    });
    it.todo('should repopulate the `parent` references', () => {});
});
