import { describe, expect, it, vi } from "vitest";

import {
  addPaneCommand,
  createPaneHandle,
  removePaneByHandleCommand,
  removeSeriesCommand,
} from "../../src/lib/internal/views/chart-structure-commands";

describe("chart structure commands use-case", () => {
  it("removes series through chart owner side-effects", () => {
    const resetPrimaryRangeOverride = vi.fn();
    const resetViewportState = vi.fn();
    const clearCrosshair = vi.fn();
    const render = vi.fn();

    removeSeriesCommand("series-1", {
      removeSourceByApi: () => ({ role: "main-series" }),
      resetPrimaryRangeOverride,
      resetViewportState,
      clearCrosshair,
      render,
    });

    expect(resetPrimaryRangeOverride).toHaveBeenCalledTimes(1);
    expect(resetViewportState).toHaveBeenCalledTimes(1);
    expect(clearCrosshair).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("rejects removing a series that is no longer attached", () => {
    expect(() =>
      removeSeriesCommand("series-1", {
        removeSourceByApi: () => undefined,
        resetPrimaryRangeOverride: vi.fn(),
        resetViewportState: vi.fn(),
        clearCrosshair: vi.fn(),
        render: vi.fn(),
      })
    ).toThrow("chartx phase-one chart can remove only the currently attached series");
  });

  it("adds and removes panes through shared command routing", () => {
    const emitAdded = vi.fn();
    const render = vi.fn();
    const createPaneHandleSpy = vi.fn(() => ({ id: "pane-handle" }));

    expect(addPaneCommand({ height: 240 }, {
      addSecondaryPane: () => ({ id: "pane-3" }),
      emitAdded,
      render,
      createPaneHandle: createPaneHandleSpy,
    })).toEqual({ id: "pane-handle" });

    expect(emitAdded).toHaveBeenCalledWith("pane-3");
    expect(render).toHaveBeenCalledTimes(1);
    expect(createPaneHandleSpy).toHaveBeenCalledWith("pane-3");

    const removePaneById = vi.fn();
    removePaneByHandleCommand({ id: "pane-handle" }, {
      getPaneId: () => "pane-3",
      removePaneById,
    });
    expect(removePaneById).toHaveBeenCalledWith("pane-3");
  });

  it("rejects pane handles that do not belong to the chart", () => {
    expect(() =>
      removePaneByHandleCommand({ id: "pane-handle" }, {
        getPaneId: () => undefined,
        removePaneById: vi.fn(),
      })
    ).toThrow("chartx phase-one chart removePane requires a pane handle created by this chart");
  });

  it("builds pane api wrappers through the shared factory", () => {
    const registerPaneHandle = vi.fn();
    const subscribeResize = vi.fn();
    const unsubscribeResize = vi.fn();
    const applyPaneOptions = vi.fn();
    const setPaneHeight = vi.fn();
    const removePaneById = vi.fn();
    const resizeHandler = vi.fn();

    const pane = createPaneHandle("pane-2", {
      getPaneIndex: () => 1,
      getPaneHeight: () => 180,
      getPaneOptions: () => ({ height: 180, resizable: true }),
      applyPaneOptions,
      setPaneHeight,
      isPrimary: () => false,
      isResizable: () => true,
      subscribeResize,
      unsubscribeResize,
      hasSeries: () => true,
      removePaneById,
      registerPaneHandle,
    });

    expect(pane.paneIndex()).toBe(1);
    expect(pane.getHeight()).toBe(180);
    expect(pane.getOptions()).toEqual({ height: 180, resizable: true });
    expect(pane.isPrimary()).toBe(false);
    expect(pane.isResizable()).toBe(true);
    expect(pane.hasSeries()).toBe(true);

    pane.applyOptions({ height: 220 });
    pane.setHeight(200);
    pane.subscribeResize(resizeHandler);
    pane.unsubscribeResize(resizeHandler);
    pane.remove();

    expect(applyPaneOptions).toHaveBeenCalledWith("pane-2", { height: 220 });
    expect(setPaneHeight).toHaveBeenCalledWith("pane-2", 200);
    expect(subscribeResize).toHaveBeenCalledWith("pane-2", resizeHandler);
    expect(unsubscribeResize).toHaveBeenCalledWith("pane-2", resizeHandler);
    expect(removePaneById).toHaveBeenCalledWith("pane-2");
    expect(registerPaneHandle).toHaveBeenCalledTimes(1);
  });
});
