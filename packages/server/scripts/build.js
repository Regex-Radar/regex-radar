// @ts-check
import { context } from 'esbuild';

import { banner, sharedOptions } from '../../../esbuild/shared-options.js';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

async function main() {
    const ctx = await context({
        ...sharedOptions,
        /**
         * VS Code extensions are recommended to be bundled, Web version has to be a single file
         * Other packages don't need to be
         */
        bundle: true,
        banner: {
            js: banner,
        },
        entryPoints: ['src/server.ts'],
        outfile: isProduction ? 'dist/server.min.js' : 'dist/server.js',
        platform: 'node',
        define: {
            // TODO: perf test this
            'process.env.RECHECK_BACKEND': '"worker"',
        },
        external: ['vscode'],
    });
    if (isWatch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
