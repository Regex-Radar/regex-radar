// @ts-check
import { writeFile } from 'node:fs/promises';
import { isatty } from 'node:tty';

/**
 * allows for analyzing the bundle
 * @see https://esbuild.github.io/analyze/
 * @param {boolean} enableMetaFile
 * @param {boolean} doAnalyze
 * @returns {import('esbuild').Plugin}
 */
export const writeMetaFilePlugin = (enableMetaFile = false, doAnalyze = false, verbose = false) => ({
    name: 'write-meta-file',
    setup(build) {
        build.initialOptions.metafile = enableMetaFile;
        if (enableMetaFile) {
            build.onEnd(async (result) => {
                if (result.metafile) {
                    const metaFilePath = 'dist/metafile.json';
                    await writeFile(metaFilePath, JSON.stringify(result.metafile, null, 2), {
                        encoding: 'utf-8',
                    });
                    console.log(
                        `generated metafile at: ${metaFilePath}, use https://esbuild.github.io/analyze/ to analyze the bundle`,
                    );
                    if (doAnalyze) {
                        const analytics = await build.esbuild.analyzeMetafile(result.metafile, {
                            color: isatty(process.stdout.fd),
                            verbose,
                        });
                        console.log(analytics);
                    }
                }
            });
        }
    },
});
