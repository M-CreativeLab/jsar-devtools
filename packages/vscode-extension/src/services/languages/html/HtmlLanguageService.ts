/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createScanner } from './parser/HtmlScanner';
import { HTMLParser } from './parser/HtmlParser';
import { HTMLCompletion } from './services/HtmlCompletion';
import { HTMLHover } from './services/HtmlHover';
import { format } from './services/HtmlFormatter';
import { HTMLDocumentLinks } from './services/HtmlLinks';
import { findDocumentHighlights } from './services/HtmlHighlighting';
import { findDocumentSymbols, findDocumentSymbols2 } from './services/HtmlSymbolsProvider';
import { doRename } from './services/HtmlRename';
import { findMatchingTagPosition } from './services/HtmlMatchingTagPosition';
import { findLinkedEditingRanges } from './services/HtmlLinkedEditing';
import {
  Scanner, HTMLDocument, CompletionConfiguration, ICompletionParticipant, HTMLFormatConfiguration, DocumentContext, DocumentSymbol,
  IHTMLDataProvider, HTMLDataV1, LanguageServiceOptions, TextDocument, SelectionRange, WorkspaceEdit,
  Position, CompletionList, Hover, Range, SymbolInformation, TextEdit, DocumentHighlight, DocumentLink, FoldingRange, HoverSettings,
} from './HtmlLanguageTypes';
import { HTMLFolding } from './services/HtmlFolding';
import { HTMLSelectionRange } from './services/HtmlSelectionRange';
import { HTMLDataProvider } from './languageFacts/DataProvider';
import { HTMLDataManager } from './languageFacts/DataManager';
import { htmlData } from './languageFacts/data/WebCustomData';

export * from './HtmlLanguageTypes';

export interface LanguageService {
  setDataProviders(useDefaultDataProvider: boolean, customDataProviders: IHTMLDataProvider[]): void;
  createScanner(input: string, initialOffset?: number): Scanner;
  parseHTMLDocument(document: TextDocument): HTMLDocument;
  findDocumentHighlights(document: TextDocument, position: Position, htmlDocument: HTMLDocument): DocumentHighlight[];
  doComplete(document: TextDocument, position: Position, htmlDocument: HTMLDocument, options?: CompletionConfiguration): CompletionList;
  doComplete2(document: TextDocument, position: Position, htmlDocument: HTMLDocument, documentContext: DocumentContext, options?: CompletionConfiguration): Promise<CompletionList>;
  setCompletionParticipants(registeredCompletionParticipants: ICompletionParticipant[]): void;
  doHover(document: TextDocument, position: Position, htmlDocument: HTMLDocument, options?: HoverSettings): Hover | null;
  format(document: TextDocument, range: Range | undefined, options: HTMLFormatConfiguration): TextEdit[];
  findDocumentLinks(document: TextDocument, documentContext: DocumentContext): DocumentLink[];
  findDocumentSymbols(document: TextDocument, htmlDocument: HTMLDocument): SymbolInformation[];
  findDocumentSymbols2(document: TextDocument, htmlDocument: HTMLDocument): DocumentSymbol[];
  doQuoteComplete(document: TextDocument, position: Position, htmlDocument: HTMLDocument, options?: CompletionConfiguration): string | null;
  doTagComplete(document: TextDocument, position: Position, htmlDocument: HTMLDocument): string | null;
  getFoldingRanges(document: TextDocument, context?: { rangeLimit?: number }): FoldingRange[];
  getSelectionRanges(document: TextDocument, positions: Position[]): SelectionRange[];
  doRename(document: TextDocument, position: Position, newName: string, htmlDocument: HTMLDocument): WorkspaceEdit | null;
  findMatchingTagPosition(document: TextDocument, position: Position, htmlDocument: HTMLDocument): Position | null;
  /** Deprecated, Use findLinkedEditingRanges instead */
  findOnTypeRenameRanges(document: TextDocument, position: Position, htmlDocument: HTMLDocument): Range[] | null;
  findLinkedEditingRanges(document: TextDocument, position: Position, htmlDocument: HTMLDocument): Range[] | null;
}

const defaultLanguageServiceOptions = {};

export function getLanguageService(options: LanguageServiceOptions = defaultLanguageServiceOptions): LanguageService {
  const dataManager = new HTMLDataManager(options);

  const htmlHover = new HTMLHover(options, dataManager);
  const htmlCompletion = new HTMLCompletion(options, dataManager);
  const htmlParser = new HTMLParser(dataManager);
  const htmlSelectionRange = new HTMLSelectionRange(htmlParser);
  const htmlFolding = new HTMLFolding(dataManager);
  const htmlDocumentLinks = new HTMLDocumentLinks(dataManager);

  return {
    setDataProviders: dataManager.setDataProviders.bind(dataManager),
    createScanner,
    parseHTMLDocument: htmlParser.parseDocument.bind(htmlParser),
    doComplete: htmlCompletion.doComplete.bind(htmlCompletion),
    doComplete2: htmlCompletion.doComplete2.bind(htmlCompletion),
    setCompletionParticipants: htmlCompletion.setCompletionParticipants.bind(htmlCompletion),
    doHover: htmlHover.doHover.bind(htmlHover),
    format,
    findDocumentHighlights,
    findDocumentLinks: htmlDocumentLinks.findDocumentLinks.bind(htmlDocumentLinks),
    findDocumentSymbols,
    findDocumentSymbols2,
    getFoldingRanges: htmlFolding.getFoldingRanges.bind(htmlFolding),
    getSelectionRanges: htmlSelectionRange.getSelectionRanges.bind(htmlSelectionRange),
    doQuoteComplete: htmlCompletion.doQuoteComplete.bind(htmlCompletion),
    doTagComplete: htmlCompletion.doTagComplete.bind(htmlCompletion),
    doRename,
    findMatchingTagPosition,
    findOnTypeRenameRanges: findLinkedEditingRanges,
    findLinkedEditingRanges
  };
}

export function newHTMLDataProvider(id: string, customData: HTMLDataV1): IHTMLDataProvider {
  return new HTMLDataProvider(id, customData);
}

export function getDefaultHTMLDataProvider(): IHTMLDataProvider {
  return newHTMLDataProvider('default', htmlData);
}
