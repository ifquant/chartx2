import { describe, expect, it } from "vitest";

import {
  applyHorizontalLineDrawingOptions,
  applyTrendLineDrawingOptions,
} from "../../src/lib/internal/views/chart-drawing-options";

describe("chart drawing options use-case", () => {
  it("applies horizontal-line option updates with validation and magnet patching", () => {
    const drawing = {
      line: {
        price: 10,
        color: "#111111",
        lineWidth: 1,
        title: "Line 1",
      },
      magnetEnabled: false,
      magnetTolerancePx: 2,
      magnetSources: {
        open: true,
        close: true,
      },
    };

    applyHorizontalLineDrawingOptions(drawing, {
      price: 12,
      color: "#3b82f6",
      lineWidth: 0,
      title: "Updated",
      magnetEnabled: true,
      magnetSources: {
        close: false,
        high: true,
      },
    });

    expect(drawing).toEqual({
      line: {
        price: 12,
        color: "#3b82f6",
        lineWidth: 1,
        title: "Updated",
      },
      magnetEnabled: true,
      magnetTolerancePx: 2,
      magnetSources: {
        open: true,
        close: false,
        high: true,
      },
    });
  });

  it("applies trend-line option updates with geometry validation and partial color changes", () => {
    const drawing = {
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
      color: "#0c8f62",
      lineWidth: 2,
      timeMagnetPolicy: "nearest" as const,
      timeMagnetTolerancePx: 5,
    };

    applyTrendLineDrawingOptions(drawing, {
      endTime: 4,
      endPrice: 25,
      lineWidth: 0,
      color: "#c7543e",
      timeMagnetPolicy: "previous",
    });

    expect(drawing).toEqual({
      startTime: 1,
      startPrice: 10,
      endTime: 4,
      endPrice: 25,
      color: "#c7543e",
      lineWidth: 1,
      timeMagnetPolicy: "previous",
      timeMagnetTolerancePx: 5,
    });
  });
});
