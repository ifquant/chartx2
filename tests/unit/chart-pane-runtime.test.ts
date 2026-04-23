import { describe, expect, it, vi } from "vitest";

import {
  applyPaneOptions,
  applyPaneResize,
  getPaneByHandle,
  getPaneHeight,
  getPaneOptions,
  paneHasSeries,
  setPaneHeight,
  subscribePaneResize,
  unsubscribePaneResize,
} from "../../src/lib/chartx/internal/views/chart-pane-runtime";

describe("chart pane runtime use-cases", () => {
  it("manages pane resize subscriptions and pane handle resolution", () => {
    const handlers = new Map<string, Set<(event: { paneIndex: number; height: number; isPrimary: boolean }) => void>>();
    const handler = vi.fn<(event: { paneIndex: number; height: number; isPrimary: boolean }) => void>();

    subscribePaneResize("pane-2", handler, {
      hasPane: (paneId) => paneId === "pane-2",
      getHandlers: (paneId) => handlers.get(paneId),
      setHandlers: (paneId, nextHandlers) => {
        handlers.set(paneId, nextHandlers);
      },
    });
    expect(handlers.get("pane-2")?.has(handler)).toBe(true);

    unsubscribePaneResize("pane-2", handler, {
      getHandlers: (paneId) => handlers.get(paneId),
      deleteHandlers: (paneId) => {
        handlers.delete(paneId);
      },
    });
    expect(handlers.has("pane-2")).toBe(false);

    expect(getPaneByHandle("pane-handle", {
      getPaneId: (handle) => handle === "pane-handle" ? "pane-2" : undefined,
      getPaneById: (paneId) => paneId === "pane-2"
        ? { id: "pane-2", kind: "secondary" as const, preferredHeight: 136, resizable: true }
        : undefined,
    })).toMatchObject({
      id: "pane-2",
      kind: "secondary",
    });
  });

  it("builds pane measurements and applies pane option mutations through shared runtime", () => {
    const pane = { id: "pane-2", kind: "secondary" as const, preferredHeight: 136, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    const render = vi.fn();

    expect(getPaneHeight("pane-2", {
      getPaneById: () => pane,
      hasCanvas: () => false,
      getLayout: () => ({ width: 600, height: 400, top: 10, right: 10, bottom: 10, left: 10 }),
      listPanes: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }, pane],
      gap: 12,
    })).toBe(136);

    expect(getPaneOptions("pane-2", {
      getPaneById: () => pane,
    })).toEqual({
      height: 136,
      resizable: true,
    });

    setPaneHeight("pane-2", 180, {
      getPaneById: () => pane,
      emitPaneResize,
      emitPaneEvent,
      render,
    });
    expect(pane.preferredHeight).toBe(180);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");

    applyPaneOptions("pane-2", { resizable: false }, {
      getPaneById: () => pane,
      setPaneHeight: vi.fn(),
      emitPaneEvent,
      render,
    });
    expect(pane.resizable).toBe(false);
    expect(emitPaneEvent).toHaveBeenCalledWith("options", "pane-2");

    expect(paneHasSeries("pane-2", {
      getSeriesCount: () => 0,
      getDrawingCount: () => 1,
    })).toBe(true);
  });

  it("applies pane drag-resize and updates crosshair through shared runtime", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const secondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 136, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    let crosshair: { x: number; y: number } | null = { x: 10, y: 20 };

    applyPaneResize(40, {
      width: 600,
      height: 420,
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }, {
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
    }, {
      getPaneById: (paneId) => paneId === "primary" ? primary : paneId === "pane-2" ? secondary : undefined,
      emitPaneResize,
      emitPaneEvent,
      hasCanvas: () => true,
      listPanes: () => [primary, secondary],
      gap: 12,
      getCrosshair: () => crosshair,
      setCrosshair: (point) => {
        crosshair = point;
      },
    });

    expect(secondary.preferredHeight).not.toBe(136);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");
    expect(crosshair.x).toBe(10);
  });

  it("applies secondary-secondary divider drags to the lower pane when it is the only resizable side", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const upperSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const lowerSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    let crosshair: { x: number; y: number } | null = { x: 10, y: 20 };

    applyPaneResize(60, {
      width: 600,
      height: 520,
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }, {
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "pane-1",
          dividerBeforePaneId: "pane-2",
          block: {
            controlledPaneId: "pane-2",
            blockPaneIds: ["pane-1", "pane-2"],
            startControlledHeight: 120,
            startVariableSpan: 220,
            minOpposingHeight: 72,
          },
        },
        group: {
          controlledPaneId: "pane-2",
          opposingPaneId: "pane-1",
          blockPaneIds: ["pane-1", "pane-2"],
          participatingPaneIds: ["pane-1", "pane-2"],
          variablePaneIds: ["pane-2"],
          fixedPaneIds: ["pane-1"],
          mode: "adjacent-lower",
        },
        controlledPaneId: "pane-2",
        controlsUpperPane: false,
      },
    }, {
      getPaneById: (paneId) =>
        paneId === "primary"
          ? primary
          : paneId === "pane-1"
            ? upperSecondary
            : paneId === "pane-2"
              ? lowerSecondary
              : undefined,
      emitPaneResize,
      emitPaneEvent,
      hasCanvas: () => true,
      listPanes: () => [primary, upperSecondary, lowerSecondary],
      gap: 12,
      getCrosshair: () => crosshair,
      setCrosshair: (point) => {
        crosshair = point;
      },
    });

    expect(lowerSecondary.preferredHeight).toBe(80);
    expect(upperSecondary.preferredHeight).toBe(100);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");
    expect(crosshair?.x).toBe(10);
  });

  it("applies primary-divider drags to the first downstream resizable secondary pane", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const fixedSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const lowerSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();
    let crosshair: { x: number; y: number } | null = { x: 10, y: 20 };

    applyPaneResize(60, {
      width: 600,
      height: 520,
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }, {
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "primary",
          dividerBeforePaneId: "pane-1",
          block: {
            controlledPaneId: "pane-2",
            blockPaneIds: ["primary", "pane-1", "pane-2"],
            startControlledHeight: 120,
            startVariableSpan: 340,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-2",
          opposingPaneId: "primary",
          blockPaneIds: ["primary", "pane-1", "pane-2"],
          participatingPaneIds: ["primary", "primary", "pane-1", "pane-2"],
          variablePaneIds: ["primary", "pane-2"],
          fixedPaneIds: ["pane-1"],
          mode: "downstream",
        },
        controlledPaneId: "pane-2",
        controlsUpperPane: false,
      },
    }, {
      getPaneById: (paneId) =>
        paneId === "primary"
          ? primary
          : paneId === "pane-1"
            ? fixedSecondary
            : paneId === "pane-2"
              ? lowerSecondary
              : undefined,
      emitPaneResize,
      emitPaneEvent,
      hasCanvas: () => true,
      listPanes: () => [primary, fixedSecondary, lowerSecondary],
      gap: 12,
      getCrosshair: () => crosshair,
      setCrosshair: (point) => {
        crosshair = point;
      },
    });

    expect(lowerSecondary.preferredHeight).toBe(80);
    expect(fixedSecondary.preferredHeight).toBe(100);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");
    expect(crosshair?.x).toBe(10);
  });

  it("clamps downstream primary-divider growth against the controlled pane span", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const fixedSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const lowerSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();

    applyPaneResize(-100, {
      width: 600,
      height: 520,
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }, {
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "primary",
          dividerBeforePaneId: "pane-1",
          block: {
            controlledPaneId: "pane-2",
            blockPaneIds: ["primary", "pane-1", "pane-2"],
            startControlledHeight: 120,
            startVariableSpan: 340,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-2",
          opposingPaneId: "primary",
          blockPaneIds: ["primary", "pane-1", "pane-2"],
          participatingPaneIds: ["primary", "primary", "pane-1", "pane-2"],
          variablePaneIds: ["primary", "pane-2"],
          fixedPaneIds: ["pane-1"],
          mode: "downstream",
        },
        controlledPaneId: "pane-2",
        controlsUpperPane: false,
      },
    }, {
      getPaneById: (paneId) =>
        paneId === "primary"
          ? primary
          : paneId === "pane-1"
            ? fixedSecondary
            : paneId === "pane-2"
              ? lowerSecondary
              : undefined,
      emitPaneResize,
      emitPaneEvent,
      hasCanvas: () => false,
      listPanes: () => [primary, fixedSecondary, lowerSecondary],
      gap: 12,
      getCrosshair: () => null,
      setCrosshair: vi.fn(),
    });

    expect(lowerSecondary.preferredHeight).toBe(180);
    expect(fixedSecondary.preferredHeight).toBe(100);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-2");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-2");
  });

  it("applies fixed secondary-secondary divider drags to the first downstream resizable pane", () => {
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const fixedUpper = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const fixedLower = { id: "pane-2", kind: "secondary" as const, preferredHeight: 90, resizable: false };
    const lowerSecondary = { id: "pane-3", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const emitPaneResize = vi.fn();
    const emitPaneEvent = vi.fn();

    applyPaneResize(-160, {
      width: 600,
      height: 720,
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }, {
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "pane-1",
          dividerBeforePaneId: "pane-2",
          block: {
            controlledPaneId: "pane-3",
            blockPaneIds: ["pane-1", "pane-2", "pane-3"],
            startControlledHeight: 120,
            startVariableSpan: 420,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-3",
          opposingPaneId: "primary",
          blockPaneIds: ["pane-1", "pane-2", "pane-3"],
          participatingPaneIds: ["primary", "pane-1", "pane-2", "pane-3"],
          variablePaneIds: ["primary", "pane-3"],
          fixedPaneIds: ["pane-1", "pane-2"],
          mode: "downstream",
        },
        controlledPaneId: "pane-3",
        controlsUpperPane: false,
      },
    }, {
      getPaneById: (paneId) =>
        paneId === "primary"
          ? primary
          : paneId === "pane-1"
            ? fixedUpper
            : paneId === "pane-2"
              ? fixedLower
              : paneId === "pane-3"
                ? lowerSecondary
                : undefined,
      emitPaneResize,
      emitPaneEvent,
      hasCanvas: () => false,
      listPanes: () => [primary, fixedUpper, fixedLower, lowerSecondary],
      gap: 12,
      getCrosshair: () => null,
      setCrosshair: vi.fn(),
    });

    expect(lowerSecondary.preferredHeight).toBe(260);
    expect(fixedUpper.preferredHeight).toBe(100);
    expect(fixedLower.preferredHeight).toBe(90);
    expect(emitPaneResize).toHaveBeenCalledWith("pane-3");
    expect(emitPaneEvent).toHaveBeenCalledWith("resized", "pane-3");
  });
});
