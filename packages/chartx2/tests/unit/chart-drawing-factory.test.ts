import { describe, expect, it, vi } from "vitest";

import { DrawingRegistry } from "../../src/lib/internal/model";
import {
  createHorizontalLineDrawing,
  createTrendLineDrawing,
} from "../../src/lib/internal/views/chart-drawing-factory";

describe("chart drawing factory", () => {
  it("creates, registers, and renders a horizontal-line drawing", () => {
    const registry = new DrawingRegistry<
      string,
      ReturnType<typeof createHorizontalLineDrawing>,
      {
        id: string;
        kind: "horizontal-line";
        paneId: string;
        visible: boolean;
        api: ReturnType<typeof createHorizontalLineDrawing>;
        line: { id: string; price: number; color: string; lineWidth: number; title: string };
      }
    >();
    const render = vi.fn();

    const api = createHorizontalLineDrawing({
      paneId: "primary",
      options: { price: 12, color: "#3b82f6" },
      visible: true,
      drawingId: "drawing-1",
      drawingTitle: "Horizontal Line 1",
      registry,
      createPriceLineState: (options) => ({
        id: "price-line-1",
        price: options.price ?? 10,
        color: options.color ?? "#111111",
        lineWidth: Math.max(1, options.lineWidth ?? 1),
        title: options.title ?? "Line",
      }),
      assertDrawingActive: () => {},
      getDrawing: (entry) => {
        const drawing = registry.getByApi(entry);
        if (drawing === undefined) {
          throw new Error("missing");
        }
        return drawing;
      },
      selectDrawing: vi.fn(),
      removeDrawing: vi.fn(),
      getPaneIndex: () => 0,
      render,
    });

    const drawing = registry.getByApi(api);
    expect(drawing).toMatchObject({
      id: "drawing-1",
      kind: "horizontal-line",
      paneId: "primary",
      visible: true,
      line: {
        id: "price-line-1",
        price: 12,
        color: "#3b82f6",
        title: "Horizontal Line 1",
      },
    });
    expect(render).toHaveBeenCalledOnce();
  });

  it("creates, registers, and renders a trend-line drawing", () => {
    const registry = new DrawingRegistry<
      string,
      ReturnType<typeof createTrendLineDrawing>,
      {
        id: string;
        kind: "trend-line";
        paneId: string;
        visible: boolean;
        api: ReturnType<typeof createTrendLineDrawing>;
        startTime: number;
        startPrice: number;
        endTime: number;
        endPrice: number;
        color: string;
        lineWidth: number;
      }
    >();
    const render = vi.fn();

    const api = createTrendLineDrawing({
      paneId: "pane-2",
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
      assertDrawingActive: () => {},
      getDrawing: (entry) => {
        const drawing = registry.getByApi(entry);
        if (drawing === undefined) {
          throw new Error("missing");
        }
        return drawing;
      },
      selectDrawing: vi.fn(),
      removeDrawing: vi.fn(),
      getPaneIndex: () => 2,
      render,
    });

    const drawing = registry.getByApi(api);
    expect(drawing).toMatchObject({
      id: "drawing-2",
      kind: "trend-line",
      paneId: "pane-2",
      visible: false,
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 25,
      color: "#0c8f62",
      lineWidth: 2,
    });
    expect(render).toHaveBeenCalledOnce();
  });
});
