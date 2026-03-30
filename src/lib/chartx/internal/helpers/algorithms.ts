export type BoundComparatorType<TArrayElementType, TValueType> = (
  item: TArrayElementType,
  value: TValueType,
) => boolean;

function boundCompare<TArrayElementType, TValueType>(
  lower: boolean,
  items: readonly TArrayElementType[],
  value: TValueType,
  compare: BoundComparatorType<TArrayElementType, TValueType>,
  start = 0,
  end = items.length,
): number {
  let count = end - start;

  while (count > 0) {
    const half = count >> 1;
    const middle = start + half;

    if (compare(items[middle], value) === lower) {
      start = middle + 1;
      count -= half + 1;
    } else {
      count = half;
    }
  }

  return start;
}

type BoundCompareFunction = <TArrayElementType, TValueType>(
  items: readonly TArrayElementType[],
  value: TValueType,
  compare: BoundComparatorType<TArrayElementType, TValueType>,
  start?: number,
  end?: number,
) => number;

export const lowerBound = boundCompare.bind(null, true) as BoundCompareFunction;
export const upperBound = boundCompare.bind(null, false) as BoundCompareFunction;
