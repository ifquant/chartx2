import type { Coordinate } from "./coordinate";
import { RangeImpl } from "./range-impl";
import type { Logical, TimePointIndex } from "./time-data";
import { TimeScaleVisibleRange } from "./time-scale-visible-range";

export class TimeScale {
  private width = 0;
  private barSpacing = 6;
  private rightOffset = 0;
  private pointCount = 0;

  public applyOptions(options: {
    width?: number;
    barSpacing?: number;
    rightOffset?: number;
    pointCount?: number;
  }): void {
    if (options.width !== undefined) {
      this.width = options.width;
    }

    if (options.barSpacing !== undefined) {
      this.barSpacing = options.barSpacing;
    }

    if (options.rightOffset !== undefined) {
      this.rightOffset = options.rightOffset;
    }

    if (options.pointCount !== undefined) {
      this.pointCount = options.pointCount;
    }
  }

  public setPointCount(pointCount: number): void {
    this.pointCount = pointCount;
  }

  public indexToCoordinate(index: TimePointIndex): Coordinate {
    const lastIndex = this.pointCount - 1;
    const distanceFromRight = lastIndex - index + this.rightOffset;
    return (this.width - distanceFromRight * this.barSpacing) as Coordinate;
  }

  public logicalToCoordinate(logical: Logical): Coordinate {
    const lastIndex = this.pointCount - 1;
    const distanceFromRight = lastIndex - logical + this.rightOffset;
    return (this.width - distanceFromRight * this.barSpacing) as Coordinate;
  }

  public coordinateToLogical(coordinate: number): Logical {
    const lastIndex = this.pointCount - 1;
    const distanceFromRight = (this.width - coordinate) / this.barSpacing;
    return (lastIndex - distanceFromRight + this.rightOffset) as Logical;
  }

  public visibleLogicalRange(): TimeScaleVisibleRange {
    if (this.pointCount <= 0 || this.width <= 0 || this.barSpacing <= 0) {
      return TimeScaleVisibleRange.invalid();
    }

    const from = this.coordinateToLogical(0);
    const to = this.coordinateToLogical(this.width);
    return new TimeScaleVisibleRange(new RangeImpl(from, to));
  }

  public visibleStrictRange(): RangeImpl<TimePointIndex> | null {
    return this.visibleLogicalRange().strictRange();
  }
}
