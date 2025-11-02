import { createInterfaceId } from '@gitlab/needle';
import { Connection, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export type LsConnection = Connection;
export const LsConnection = createInterfaceId<LsConnection>('LsConnection');

export type LsTextDocuments = TextDocuments<TextDocument>;
export const LsTextDocuments = createInterfaceId<LsTextDocuments>('LsTextDocuments');
