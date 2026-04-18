import { describe, expect, it } from "vitest";

import {
  type RestorableHorizontalLineDrawingSnapshot,
  type RestorableTrendLineDrawingSnapshot,
  restoreDrawingCollection,
} from "../../src/lib/chartx/internal/views/chart-drawing-restore";

type TestDrawingSnapshot =
  | (RestorableHorizontalLineDrawingSnapshot & {
      options: { price?: number; color?: string };
    })
  | (RestorableTrendLineDrawingSnapshot & {
      options: { startTime?: number; startPrice?: number; endTime?: number; endPrice?: number; color?: string };
    });

describe("chart drawing restore", () => {
  it("routes drawing snapshots by type through the correct restore handlers", () => {
    const calls: string[] = [];
    const drawings: readonly TestDrawingSnapshot[] = [
      { type: "horizontal-line", paneIndex: 1, options: { price: 10, color: "#1" } },
      {
        type: "trend-line",
        paneIndex: 2,
        options: { startTime: 1, startPrice: 10, endTime: 2, endPrice: 20, color: "#2" },
      },
    ];

    restoreDrawingCollection(drawings, {
      resolvePaneTarget: (paneIndex) => `pane-${paneIndex}`,
      restoreHorizontalLine: (target, snapshot) => calls.push(`horizontal-line:${target}:${snapshot.options.price}`),
      restoreTrendLine: (target, snapshot) => calls.push(`trend-line:${target}:${snapshot.options.startTime}`),
    });

    expect(calls).toEqual([
      "horizontal-line:pane-1:10",
      "trend-line:pane-2:1",
    ]);
  });
});
