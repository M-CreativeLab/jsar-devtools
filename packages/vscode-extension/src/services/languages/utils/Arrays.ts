/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
export function findFirst<T>(array: T[], p: (x: T) => boolean): number {
  let low = 0, high = array.length;
  if (high === 0) {
    return 0; // no children
  }
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (p(array[mid])) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

export function pushAll<T>(to: T[], from: T[]) {
  if (from) {
    for (const e of from) {
      to.push(e);
    }
  }
}

export function contains<T>(arr: T[], val: T) {
  return arr.indexOf(val) !== -1;
}

/**
 * Like `Array#sort` but always stable. Usually runs a little slower `than Array#sort`
 * so only use this when actually needing stable sort.
 */
export function mergeSort<T>(data: T[], compare: (a: T, b: T) => number): T[] {
  _divideAndMerge(data, compare);
  return data;
}

function _divideAndMerge<T>(data: T[], compare: (a: T, b: T) => number): void {
  if (data.length <= 1) {
    // sorted
    return;
  }
  const p = (data.length / 2) | 0;
  const left = data.slice(0, p);
  const right = data.slice(p);

  _divideAndMerge(left, compare);
  _divideAndMerge(right, compare);

  let leftIdx = 0;
  let rightIdx = 0;
  let i = 0;
  while (leftIdx < left.length && rightIdx < right.length) {
    const ret = compare(left[leftIdx], right[rightIdx]);
    if (ret <= 0) {
      // smaller_equal -> take left to preserve order
      data[i++] = left[leftIdx++];
    } else {
      // greater -> take right
      data[i++] = right[rightIdx++];
    }
  }
  while (leftIdx < left.length) {
    data[i++] = left[leftIdx++];
  }
  while (rightIdx < right.length) {
    data[i++] = right[rightIdx++];
  }
}

export function binarySearch<T>(array: T[], key: T, comparator: (op1: T, op2: T) => number): number {
  let low = 0,
    high = array.length - 1;

  while (low <= high) {
    const mid = ((low + high) / 2) | 0;
    const comp = comparator(array[mid], key);
    if (comp < 0) {
      low = mid + 1;
    } else if (comp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -(low + 1);
}

export function includes<T>(array: T[], item: T): boolean {
  return array.indexOf(item) !== -1;
}

export function union<T>(...arrays: T[][]): T[] {
  const result: T[] = [];
  for (const array of arrays) {
    for (const item of array) {
      if (!includes(result, item)) {
        result.push(item);
      }
    }
  }
  return result;
}
