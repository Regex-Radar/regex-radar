import { defineProject, Plugin } from 'vitest/config';

const virtualIds = ['vscode-languageclient/node'];
const virtualPlugin: Plugin = {
    name: 'virtual-mocks-plugin',
    resolveId(source) {
        if (virtualIds.includes(source)) {
            return source;
        }
    },
};

export default defineProject({
    plugins: [virtualPlugin],
    test: {
        include: ['test/**/*.test.ts'],
    },
});
