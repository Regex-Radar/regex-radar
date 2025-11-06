import type { FileSystemProvider } from 'vscode';

export type OnDidChangeFileHandler = Parameters<FileSystemProvider['onDidChangeFile']>[0];
