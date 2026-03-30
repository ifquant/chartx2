import { RangeImpl } from "./range-impl";
import type { Logical, TimePointIndex } from "./time-data";

export class TimeScaleVisibleRange {
  private readonly logical: RangeImpl<Logical> | null;

  public constructor(logicalRange: RangeImpl<Logical> | null) {
    this.logical = logicalRange;
  }

  public strictRange(): RangeImpl<TimePointIndex> | null {
    if (this.logical === null) {
      return null;
    }

    return new RangeImpl(
      Math.floor(this.logical.left()) as TimePointIndex,
      Math.ceil(this.logical.right()) as TimePointIndex,
    );
  }

  public logicalRange(): RangeImpl<Logical> | null {
    return this.logical;
  }

  public static invalid(): TimeScaleVisibleRange {
    return new TimeScaleVisibleRange(null);
  }
}
