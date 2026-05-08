import { describe, expect, it } from "vitest";

import { DrawingRegistry } from "../../src/lib/internal/model/drawing-registry";
import { createChartDrawingOwner } from "../../src/lib/internal/views/chart-drawing-owner";

describe("chart drawing owner regression", () => {
  it("creates default drawings through the registry wrapper without losing registry binding", () => {
    const registry = new DrawingRegistry<any, any, any>();
    let selectedDrawingId: string | null = null;

    const owner = createChartDrawingOwner({
      allocateDrawingOrdinal: () => 1,
      formatSeriesKindLabel: (kind: string) => kind,
      resolveTarget: () => ({ kind: "primary" as const }),
      getPaneById: () => ({ id: "primary" }),
      getPaneByIndex: () => ({ id: "primary" }),
      createPaneTarget: () => ({ pane: { id: "primary" } }),
      getRestorePaneId: () => "primary",
      getPaneIndex: () => 0,
      registry,
      createPriceLineState: (options = {}) => ({
        id: "line-1",
        price: Number(options.price ?? 0),
        color: String(options.color ?? "#000000"),
        lineWidth: Number(options.lineWidth ?? 1),
        title: String(options.title ?? ""),
      }),
      lineColor: "#2563eb",
      resolveTrendLineDefaults: () => ({
        startTime: 1,
        startPrice: 10,
        endTime: 2,
        endPrice: 12,
      }),
      resolveMagnetOptions: () => ({
        magnetEnabled: true,
        magnetTolerancePx: 12,
        timeMagnetEnabled: true,
        timeMagnetPolicy: "nearest",
        timeMagnetTolerancePx: 12,
        magnetSources: {
          open: true,
          high: true,
          low: true,
          close: true,
        },
      }),
      resolvePropertySchema: () => ({
        kind: "horizontal-line",
        sections: [],
      }),
      view: {
        selectedDrawingId: () => selectedDrawingId,
        setSelectedDrawingId: (id) => {
          selectedDrawingId = id;
        },
        notifySelectionChange: () => {},
        render: () => {},
      },
    });

    const drawing = owner.addHorizontalLine(undefined, {
      price: 18_000,
      title: "Swing low",
    });

    expect(drawing).toBeTruthy();
    expect(owner.listDrawings()).toHaveLength(1);
    expect(owner.getDrawingById(owner.listDrawings()[0]!.id)?.kind).toBe("horizontal-line");
  });
});
