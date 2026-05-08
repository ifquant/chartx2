import { ensureNotNull, lowerBound, upperBound, type Nominal } from "../helpers";
import { PlotRowValueIndex, type PlotRow } from "./plot-data";
import type { TimePointIndex } from "./time-data";

export const enum MismatchDirection {
  NearestLeft = -1,
  None = 0,
  NearestRight = 1,
}

export interface MinMax {
  min: number;
  max: number;
}

type PlotRowIndex = Nominal<number, "PlotRowIndex">;

const CHUNK_SIZE = 30;

export class PlotList<TRow extends PlotRow = PlotRow> {
  private items: readonly TRow[] = [];
  private minMaxCache: Map<PlotRowValueIndex, Map<number, MinMax | null>> = new Map();
  private indicesCache: readonly TimePointIndex[] = [];

  public last(): TRow | null {
    return this.size() > 0 ? this.items[this.items.length - 1] : null;
  }

  public firstIndex(): TimePointIndex | null {
    return this.size() > 0 ? this.indexAt(0 as PlotRowIndex) : null;
  }

  public lastIndex(): TimePointIndex | null {
    return this.size() > 0 ? this.indexAt((this.items.length - 1) as PlotRowIndex) : null;
  }

  public size(): number {
    return this.items.length;
  }

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public rows(): readonly TRow[] {
    return this.items;
  }

  public indices(): readonly TimePointIndex[] {
    return this.indicesCache;
  }

  public setData(rows: readonly TRow[]): void {
    this.minMaxCache.clear();
    this.items = rows;
    this.indicesCache = rows.map((row) => row.index);
  }

  public contains(index: TimePointIndex): boolean {
    return this.search(index) !== null;
  }

  public search(
    index: TimePointIndex,
    searchMode: MismatchDirection = MismatchDirection.None,
  ): TRow | null {
    const position = this.searchPosition(index, searchMode);
    return position === null ? null : this.items[position];
  }

  public minMaxOnRangeCached(
    start: TimePointIndex,
    end: TimePointIndex,
    plots: readonly PlotRowValueIndex[],
  ): MinMax | null {
    if (this.isEmpty()) {
      return null;
    }

    let result: MinMax | null = null;

    for (const plot of plots) {
      result = mergeMinMax(result, this.minMaxOnRangeCachedImpl(start, end, plot));
    }

    return result;
  }

  private indexAt(offset: PlotRowIndex): TimePointIndex {
    return this.items[offset].index;
  }

  private searchPosition(
    index: TimePointIndex,
    searchMode: MismatchDirection,
  ): PlotRowIndex | null {
    const exact = this.binarySearch(index);

    if (exact === null && searchMode !== MismatchDirection.None) {
      switch (searchMode) {
        case MismatchDirection.NearestLeft:
          return this.searchNearestLeft(index);
        case MismatchDirection.NearestRight:
          return this.searchNearestRight(index);
        default:
          return null;
      }
    }

    return exact;
  }

  private searchNearestLeft(index: TimePointIndex): PlotRowIndex | null {
    let position = this.lowerbound(index);

    if (position > 0) {
      position -= 1;
    }

    return position !== this.items.length && this.indexAt(position as PlotRowIndex) < index
      ? (position as PlotRowIndex)
      : null;
  }

  private searchNearestRight(index: TimePointIndex): PlotRowIndex | null {
    const position = this.upperbound(index);
    return position !== this.items.length && index < this.indexAt(position as PlotRowIndex)
      ? (position as PlotRowIndex)
      : null;
  }

  private binarySearch(index: TimePointIndex): PlotRowIndex | null {
    const start = this.lowerbound(index);
    if (start !== this.items.length && !(index < this.items[start as PlotRowIndex].index)) {
      return start as PlotRowIndex;
    }

    return null;
  }

  private lowerbound(index: TimePointIndex): number {
    return lowerBound(this.items, index, (item, value) => item.index < value);
  }

  private upperbound(index: TimePointIndex): number {
    return upperBound(this.items, index, (item, value) => item.index > value);
  }

  private plotMinMax(
    startIndex: PlotRowIndex,
    endIndexExclusive: PlotRowIndex,
    plotIndex: PlotRowValueIndex,
  ): MinMax | null {
    let result: MinMax | null = null;

    for (let index = startIndex; index < endIndexExclusive; index++) {
      const value = this.items[index].value[plotIndex];

      if (Number.isNaN(value)) {
        continue;
      }

      if (result === null) {
        result = { min: value, max: value };
      } else {
        if (value < result.min) {
          result.min = value;
        }
        if (value > result.max) {
          result.max = value;
        }
      }
    }

    return result;
  }

  private minMaxOnRangeCachedImpl(
    start: TimePointIndex,
    end: TimePointIndex,
    plotIndex: PlotRowValueIndex,
  ): MinMax | null {
    if (this.isEmpty()) {
      return null;
    }

    let result: MinMax | null = null;
    const firstIndex = ensureNotNull(this.firstIndex());
    const lastIndex = ensureNotNull(this.lastIndex());
    const boundedStart = Math.max(start, firstIndex);
    const boundedEnd = Math.min(end, lastIndex);
    const cachedLow = Math.ceil(boundedStart / CHUNK_SIZE) * CHUNK_SIZE;
    const cachedHigh = Math.max(cachedLow, Math.floor(boundedEnd / CHUNK_SIZE) * CHUNK_SIZE);

    const headStart = this.lowerbound(boundedStart as TimePointIndex);
    const headEnd = this.upperbound(
      Math.min(boundedEnd, cachedLow, end) as TimePointIndex,
    );
    result = mergeMinMax(
      result,
      this.plotMinMax(headStart as PlotRowIndex, headEnd as PlotRowIndex, plotIndex),
    );

    let cache = this.minMaxCache.get(plotIndex);
    if (cache === undefined) {
      cache = new Map();
      this.minMaxCache.set(plotIndex, cache);
    }

    for (let chunk = Math.max(cachedLow + 1, boundedStart); chunk < cachedHigh; chunk += CHUNK_SIZE) {
      const chunkIndex = Math.floor(chunk / CHUNK_SIZE);
      let chunkMinMax = cache.get(chunkIndex);

      if (chunkMinMax === undefined) {
        const chunkStart = this.lowerbound((chunkIndex * CHUNK_SIZE) as TimePointIndex);
        const chunkEnd = this.upperbound(
          ((chunkIndex + 1) * CHUNK_SIZE - 1) as TimePointIndex,
        );
        chunkMinMax = this.plotMinMax(
          chunkStart as PlotRowIndex,
          chunkEnd as PlotRowIndex,
          plotIndex,
        );
        cache.set(chunkIndex, chunkMinMax);
      }

      result = mergeMinMax(result, chunkMinMax);
    }

    const tailStart = this.lowerbound(cachedHigh as TimePointIndex);
    const tailEnd = this.upperbound(boundedEnd as TimePointIndex);
    result = mergeMinMax(
      result,
      this.plotMinMax(tailStart as PlotRowIndex, tailEnd as PlotRowIndex, plotIndex),
    );

    return result;
  }
}

function mergeMinMax(first: MinMax | null, second: MinMax | null): MinMax | null {
  if (first === null) {
    return second;
  }

  if (second === null) {
    return first;
  }

  return {
    min: Math.min(first.min, second.min),
    max: Math.max(first.max, second.max),
  };
}
