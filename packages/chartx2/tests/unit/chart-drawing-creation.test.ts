import { describe, expect, it, vi } from "vitest";

import { DrawingRegistry } from "../../src/lib/internal/model";
import {
  createHorizontalLineDrawingForPane,
  createTrendLineDrawingForPane,
} from "../../src/lib/internal/views/chart-drawing-creation";

describe("chart drawing creation runtime", () => {
  it("creates a horizontal-line drawing through shared pane-aware creation glue", () => {
    const registry = new DrawingRegistry<
      string,
      ReturnType<typeof createHorizontalLineDrawingForPane>,
      {
        id: string;
        kind: "horizontal-line";
        paneId: string;
        visible: boolean;
        api: ReturnType<typeof createHorizontalLineDrawingForPane>;
        line: { id: string; price: number; color: string; lineWidth: number; title: string };
      }
    >();
    const render = vi.fn();

    const api = createHorizontalLineDrawingForPane({
      paneId: "primary",
      paneExists: true,
      options: { price: 12, color: "#3b82f6" },
      visible: true,
      drawingId: "drawing-1",
      drawingTitle: "Horizontal Line 1",
      registry,
      createPriceLineState: (options) => ({
        id: "price-line-1",
        price: options.price ?? 0,
        color: options.color ?? "#111111",
        lineWidth: options.lineWidth ?? 1,
        title: options.title ?? "Line",
      }),
      selectDrawing: vi.fn(),
      removeDrawing: vi.fn(),
      getPaneIndex: () => 0,
      render,
    });

    expect(registry.getByApi(api)).toMatchObject({
      id: "drawing-1",
      kind: "horizontal-line",
      paneId: "primary",
      line: {
        id: "price-line-1",
        price: 12,
        color: "#3b82f6",
        title: "Horizontal Line 1",
      },
    });
    expect(render).toHaveBeenCalledOnce();
  });

  it("creates a trend-line drawing and rejects missing panes through shared creation glue", () => {
    const registry = new DrawingRegistry<
      string,
      ReturnType<typeof createTrendLineDrawingForPane>,
      {
        id: string;
        kind: "trend-line";
        paneId: string;
        visible: boolean;
        api: ReturnType<typeof createTrendLineDrawingForPane>;
        startTime: number;
        startPrice: number;
        endTime: number;
        endPrice: number;
        color: string;
        lineWidth: number;
      }
    >();
    const render = vi.fn();

    const api = createTrendLineDrawingForPane({
      paneId: "pane-2",
      paneExists: true,
      options: { endPrice: 25 },
      visible: false,
      drawingId: "drawing-2",
      registry,
      lineColor: "#0c8f62",
      resolveDefaults: () => ({
        startTime: 1,
        startPrice: 10,
        endTime: 3,
        endPrice: 20,
      }),
      selectDrawing: vi.fn(),
      removeDrawing: vi.fn(),
      getPaneIndex: () => 2,
      render,
    });

    expect(registry.getByApi(api)).toMatchObject({
      id: "drawing-2",
      kind: "trend-line",
      paneId: "pane-2",
      visible: false,
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 25,
    });

    expect(() =>
      createTrendLineDrawingForPane({
        paneId: "missing",
        paneExists: false,
        options: {},
        visible: true,
        drawingId: "drawing-3",
        registry,
        lineColor: "#0c8f62",
        resolveDefaults: () => ({
          startTime: 1,
          startPrice: 10,
          endTime: 3,
          endPrice: 20,
        }),
        selectDrawing: vi.fn(),
        removeDrawing: vi.fn(),
        getPaneIndex: () => 0,
        render,
      })
    ).toThrow("chartx phase-one drawing target pane has been removed");
  });
});
