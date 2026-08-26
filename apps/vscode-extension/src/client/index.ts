import * as path from 'node:path';

import { ExtensionContext, LogLevel, window, type OutputChannel } from 'vscode';
import type { ServerOptions } from 'vscode-languageclient/node';

import { RegexRadarLanguageClient } from '@regex-radar/client';

import { displayName } from '../../package.json';

let client: RegexRadarLanguageClient | null = null;

export async function registerLanguageClient(context: ExtensionContext): Promise<RegexRadarLanguageClient> {
    if (client) {
        return client;
    }

    client = createLanguageClient(context);
    await client.start();

    if (client.isInDebugMode) {
        client.outputChannel.show(true);
    }

    context.subscriptions.push(client);

    return client;
}

/**
 * Local copy to avoid having to import the whole package
 * TODO: check if tree shaking helps here
 */
const TransportKind: typeof import('vscode-languageclient/node').TransportKind = {
    stdio: 0,
    ipc: 1,
    pipe: 2,
    socket: 3,
} as const;

/**
 * Create an adapter that converts the custom logging format from the language server to a proper `LogOutputChannel`.
 */
function createOutputChannelAdapter(context: ExtensionContext): OutputChannel {
    const channel = window.createOutputChannel(`${displayName} (Language Server)`, { log: true });
    context.subscriptions.push(channel);
    let lastLogLevel: LogLevel = LogLevel.Off;

    function extractLogLevelAndMessage(value: string): [logLevel: LogLevel, message: string] {
        // format is `[${name.padEnd(5)} - ${(new Date().toLocaleTimeString())}] ${message}`
        if (value.startsWith('[')) {
            const end = value.indexOf(' ');
            const level = value.slice(1, end);
            const logLevel = (lastLogLevel = LogLevel[level as keyof typeof LogLevel] ?? LogLevel.Off);
            return [logLevel, value.slice(value.indexOf(']') + 2)];
        } else {
            const logLevel = lastLogLevel;
            lastLogLevel = LogLevel.Off;
            return [logLevel, value];
        }
    }

    function logMessage(logLevel: LogLevel, message: string) {
        switch (logLevel) {
            case LogLevel.Trace: {
                channel.trace(message);
                break;
            }
            case LogLevel.Debug: {
                channel.debug(message);
                break;
            }
            case LogLevel.Info: {
                channel.info(message);
                break;
            }
            case LogLevel.Warning: {
                channel.warn(message);
                break;
            }
            case LogLevel.Error: {
                channel.error(message);
                break;
            }
        }
    }

    return {
        name: channel.name,
        append: function (value: string): void {
            this.appendLine(value.trimEnd());
        },
        appendLine: function (value: string): void {
            const [logLevel, message] = extractLogLevelAndMessage(value);
            logMessage(logLevel, message);
        },
        replace: function (value: string): void {
            channel.replace(value);
        },
        clear: function (): void {
            channel.clear();
        },
        show: function (...args): void {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            channel.show(...(args as any[]));
        },
        hide: function (): void {
            channel.hide();
        },
        dispose: function (): void {
            channel.dispose();
        },
    };
}

function createLanguageClient(context: ExtensionContext): RegexRadarLanguageClient {
    const serverModulePath =
        __BUILD_MODE__ === 'production'
            ? path.join('dist/server.min.js')
            : path.join('..', '..', 'packages', 'server', 'dist', 'server.js');
    const serverModule = context.asAbsolutePath(serverModulePath);
    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=9229', '--inspect-brk'] },
        },
    };
    const outputChannel = createOutputChannelAdapter(context);

    return new RegexRadarLanguageClient(serverOptions, {
        outputChannel,
        traceOutputChannel: outputChannel,
    });
}
