/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getWordAtText(text: string, offset: number, wordDefinition: RegExp): { start: number; length: number } {
  let lineStart = offset;
  while (lineStart > 0 && !isNewlineCharacter(text.charCodeAt(lineStart - 1))) {
    lineStart--;
  }
  const offsetInLine = offset - lineStart;
  const lineText = text.substr(lineStart);

  // make a copy of the regex as to not keep the state
  const flags = wordDefinition.ignoreCase ? 'gi' : 'g';
  wordDefinition = new RegExp(wordDefinition.source, flags);

  let match = wordDefinition.exec(lineText);
  while (match && match.index + match[0].length < offsetInLine) {
    match = wordDefinition.exec(lineText);
  }
  if (match && match.index <= offsetInLine) {
    return { start: match.index + lineStart, length: match[0].length };
  }

  return { start: offset, length: 0 };
}

export function startsWith(haystack: string, needle: string): boolean {
  if (haystack.length < needle.length) {
    return false;
  }

  for (let i = 0; i < needle.length; i++) {
    if (haystack[i] !== needle[i]) {
      return false;
    }
  }

  return true;
}

export function endsWith(haystack: string, needle: string): boolean {
  const diff = haystack.length - needle.length;
  if (diff > 0) {
    return haystack.indexOf(needle, diff) === diff;
  } else if (diff === 0) {
    return haystack === needle;
  } else {
    return false;
  }
}

export function repeat(value: string, count: number) {
  let s = '';
  while (count > 0) {
    if ((count & 1) === 1) {
      s += value;
    }
    value += value;
    count = count >>> 1;
  }
  return s;
}

export function isWhitespaceOnly(str: string) {
  return /^\s*$/.test(str);
}

export function isEOL(content: string, offset: number) {
  return isNewlineCharacter(content.charCodeAt(offset));
}

const CR = '\r'.charCodeAt(0);
const NL = '\n'.charCodeAt(0);
export function isNewlineCharacter(charCode: number) {
  return charCode === CR || charCode === NL;
}

/**
 * Computes the difference score for two strings. More similar strings have a higher score.
 * We use largest common subsequence dynamic programming approach but penalize in the end for length differences.
 * Strings that have a large length difference will get a bad default score 0.
 * Complexity - both time and space O(first.length * second.length)
 * Dynamic programming LCS computation http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 *
 * @param first a string
 * @param second a string
 */
export function difference(first: string, second: string, maxLenDelta: number = 4): number {
  let lengthDifference = Math.abs(first.length - second.length);
  // We only compute score if length of the currentWord and length of entry.name are similar.
  if (lengthDifference > maxLenDelta) {
    return 0;
  }
  // Initialize LCS (largest common subsequence) matrix.
  let LCS: number[][] = [];
  let zeroArray: number[] = [];
  let i: number, j: number;
  for (i = 0; i < second.length + 1; ++i) {
    zeroArray.push(0);
  }
  for (i = 0; i < first.length + 1; ++i) {
    LCS.push(zeroArray);
  }
  for (i = 1; i < first.length + 1; ++i) {
    for (j = 1; j < second.length + 1; ++j) {
      if (first[i - 1] === second[j - 1]) {
        LCS[i][j] = LCS[i - 1][j - 1] + 1;
      } else {
        LCS[i][j] = Math.max(LCS[i - 1][j], LCS[i][j - 1]);
      }
    }
  }
  return LCS[first.length][second.length] - Math.sqrt(lengthDifference);
}

/**
 * Limit of string length.
 */
export function trim(str: string, regexp: RegExp): string {
  const m = regexp.exec(str);
  if (m && m[0].length) {
    return str.substr(0, str.length - m[0].length);
  }
  return str;
}

/**
 * Limit of string length.
 */
export function getLimitedString(str: string, ellipsis = true): string {
  if (!str) {
    return '';
  }
  if (str.length < 140) {
    return str;
  }
  return str.slice(0, 140) + (ellipsis ? '\u2026' : '');
}

const _a = 'a'.charCodeAt(0);
const _z = 'z'.charCodeAt(0);
const _A = 'A'.charCodeAt(0);
const _Z = 'Z'.charCodeAt(0);
const _0 = '0'.charCodeAt(0);
const _9 = '9'.charCodeAt(0);
export function isLetterOrDigit(text: string, index: number) {
  const c = text.charCodeAt(index);
  return (_a <= c && c <= _z) || (_A <= c && c <= _Z) || (_0 <= c && c <= _9);
}
