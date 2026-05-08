import { describe, expect, it } from "vitest";

import { TimeScale, type TimePointIndex } from "../../src/lib/internal/model";
import {
  distanceToLineSegment,
  resolveDrawingTimeCoordinate,
} from "../../src/lib/internal/views/chart-drawing-geometry";

describe("chart drawing geometry helpers", () => {
  it("interpolates drawing time coordinates across axis bars", () => {
    const scale = new TimeScale();
    scale.applyOptions({
      width: 100,
      barSpacing: 10,
      pointCount: 3,
    });

    const x = resolveDrawingTimeCoordinate(2.5, [
      { time: 1, index: 0 as TimePointIndex },
      { time: 2, index: 1 as TimePointIndex },
      { time: 3, index: 2 as TimePointIndex },
    ], scale);

    expect(x).toBe(95);
  });

  it("measures line-segment distance through the shared geometry helper", () => {
    expect(distanceToLineSegment(5, 5, 0, 0, 10, 0)).toBe(5);
    expect(distanceToLineSegment(5, 0, 0, 0, 10, 0)).toBe(0);
  });
});
