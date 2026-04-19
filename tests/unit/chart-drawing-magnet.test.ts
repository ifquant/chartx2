import { describe, expect, it } from "vitest";

import {
  applyDrawingMagnetOverrides,
  normalizeDrawingMagnetOverrides,
} from "../../src/lib/chartx/internal/views/chart-drawing-magnet";

describe("chart drawing magnet use-case", () => {
  it("normalizes magnet override inputs without mutating the caller payload", () => {
    const input = {
      magnetEnabled: true,
      magnetTolerancePx: -4,
      timeMagnetEnabled: false,
      timeMagnetPolicy: "previous" as const,
      timeMagnetTolerancePx: -7,
      magnetSources: {
        open: true,
        close: false,
      },
    };

    const normalized = normalizeDrawingMagnetOverrides(input);

    expect(normalized).toEqual({
      magnetEnabled: true,
      magnetTolerancePx: 0,
      timeMagnetEnabled: false,
      timeMagnetPolicy: "previous",
      timeMagnetTolerancePx: 0,
      magnetSources: {
        open: true,
        close: false,
      },
    });
    expect(normalized.magnetSources).not.toBe(input.magnetSources);
    expect(input.magnetTolerancePx).toBe(-4);
  });

  it("applies override patches onto an existing drawing magnet state", () => {
    const drawing = {
      magnetEnabled: false,
      magnetTolerancePx: 2,
      timeMagnetEnabled: true,
      timeMagnetPolicy: "nearest" as const,
      timeMagnetTolerancePx: 5,
      magnetSources: {
        open: true,
        high: false,
        low: false,
        close: true,
      },
    };

    applyDrawingMagnetOverrides(drawing, {
      magnetEnabled: true,
      magnetTolerancePx: -3,
      timeMagnetPolicy: "next",
      magnetSources: {
        high: true,
        close: false,
      },
    });

    expect(drawing).toEqual({
      magnetEnabled: true,
      magnetTolerancePx: 0,
      timeMagnetEnabled: true,
      timeMagnetPolicy: "next",
      timeMagnetTolerancePx: 5,
      magnetSources: {
        open: true,
        high: true,
        low: false,
        close: false,
      },
    });
  });
});
