import { createInterfaceId, Injectable } from "@gitlab/needle";

import { IServiceProvider } from "../di";
import type { IParser } from "./parser";

type LanguageID = string;

export interface IParserProvider {
    get(languageId: LanguageID): Promise<IParser>;
}

export const IParserProvider = createInterfaceId<IParserProvider>("IParserProvider");

@Injectable(IParserProvider, [IServiceProvider])
export class ParserProvider implements IParserProvider {
    private cache = new Map<LanguageID, IParser>();
    constructor(private provider: IServiceProvider) {}

    async get(languageId: LanguageID): Promise<IParser> {
        const cacheHit = this.cache.get(languageId);
        if (cacheHit) {
            return cacheHit;
        }
        const parser = await this.createParser(languageId);
        this.cache.set(languageId, parser);
        return parser;
    }

    async createParser(languageId: LanguageID): Promise<IParser> {
        switch (languageId) {
            default:
                throw new TypeError(`language ID: ${languageId} is not supported`);
        }
    }
}
