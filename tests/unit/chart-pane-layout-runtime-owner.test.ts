import { describe, expect, it, vi } from "vitest";

import { createChartPaneLayoutRuntimeOwner } from "../../src/lib/chartx/internal/views/chart-pane-layout-runtime-owner";

describe("chart pane layout runtime owner", () => {
  it("owns pane height reads, option reads, and option mutation composition", () => {
    const pane = { id: "pane-2", kind: "secondary" as const, preferredHeight: 136, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    const render = vi.fn();

    const owner = createChartPaneLayoutRuntimeOwner({
      getPaneById: () => pane,
      hasCanvas: () => false,
      getLayout: () => ({ width: 600, height: 400, top: 10, right: 10, bottom: 10, left: 10 }),
      listPanes: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }, pane],
      gap: 12,
      emitPaneResize,
      emitPaneEvent,
      render,
      getCrosshair: () => null,
      setCrosshair: vi.fn(),
    });

    expect(owner.getPaneHeight("pane-2")).toBe(136);
    expect(owner.getPaneOptions("pane-2")).toEqual({ height: 136, resizable: true });

    owner.setPaneHeight("pane-2", 180);
    expect(pane.preferredHeight).toBe(180);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");

    owner.applyPaneOptions("pane-2", { resizable: false });
    expect(pane.resizable).toBe(false);
    expect(emitPaneEvent).toHaveBeenCalledWith("options", "pane-2");
  });

  it("owns pane drag-resize composition and preserves crosshair on the divider", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const secondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 136, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    let crosshair: { x: number; y: number } | null = { x: 10, y: 20 };

    const owner = createChartPaneLayoutRuntimeOwner({
      getPaneById: (paneId) => paneId === "primary" ? primary : paneId === "pane-2" ? secondary : undefined,
      hasCanvas: () => true,
      getLayout: () => ({ width: 600, height: 420, top: 10, right: 10, bottom: 10, left: 10 }),
      listPanes: () => [primary, secondary],
      gap: 12,
      emitPaneResize,
      emitPaneEvent,
      render: vi.fn(),
      getCrosshair: () => crosshair,
      setCrosshair: (point) => {
        crosshair = point;
      },
    });

    owner.applyPaneResize(
      40,
      { width: 600, height: 420, top: 10, right: 10, bottom: 10, left: 10 },
      {
        startClientY: 20,
        activeBlock: {
          handle: {
            dividerAfterPaneId: "primary",
            dividerBeforePaneId: "pane-2",
            block: {
              controlledPaneId: "pane-2",
              blockPaneIds: ["primary", "pane-2"],
              startControlledHeight: 136,
              startVariableSpan: 356,
              minOpposingHeight: 160,
            },
          },
          group: {
            controlledPaneId: "pane-2",
            opposingPaneId: "primary",
            blockPaneIds: ["primary", "pane-2"],
            participatingPaneIds: ["primary", "pane-2"],
            variablePaneIds: ["primary", "pane-2"],
            fixedPaneIds: [],
            mode: "adjacent-lower",
          },
          controlledPaneId: "pane-2",
          controlsUpperPane: false,
        },
      },
    );

    expect(secondary.preferredHeight).not.toBe(136);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");
    expect(crosshair).toEqual({ x: 10, y: expect.any(Number) });
  });
});
