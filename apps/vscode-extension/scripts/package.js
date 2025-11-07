// @ts-check
import * as path from 'node:path';
import { readFile, writeFile, constants, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { createVSIX } from '@vscode/vsce';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const serverModulePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'server',
    'dist',
    'server.min.js',
);
const serverModuleDestinationPath = path.join(__dirname, '..', 'dist', 'server.min.js');

let contents = '';

/**
 * A custom `vsce package` script, to support patching `package.json` manifest
 * @param {string[]} args
 * @returns {Promise<number>}
 */
async function main(...args) {
    // read original contents
    contents = await readFile(packageJsonPath, { encoding: 'utf-8' });
    try {
        await ensureServerModuleIsCopied();
        await patchPackageJson(contents);
        // package extension
        await createVSIX();
    } catch (error) {
        console.error(error);
        return 1;
    } finally {
        // restore original contents
        if (contents) {
            await writeFile(packageJsonPath, contents);
        }
    }
    return 0;
}

main(...process.argv.slice(2)).then((code) => (process.exitCode = code));

/**
 * @param {string} contents
 */

async function patchPackageJson(contents) {
    const patchedContents = contents.replace(
        `"main": "./dist/extension.js"`,
        `"main": "./dist/extension.min.js"`,
    );
    await writeFile(packageJsonPath, patchedContents);
}

async function ensureServerModuleIsCopied() {
    await copyFile(serverModulePath, serverModuleDestinationPath);
}
