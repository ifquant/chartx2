import { describe, expect, it, vi } from "vitest";

import {
  createPaneApiHandle,
  subscribePaneResizeRuntime,
  unsubscribePaneResizeRuntime,
} from "../../src/lib/chartx/internal/views/chart-pane-api-runtime";

describe("chart pane api runtime", () => {
  it("builds pane handles through shared runtime composition", () => {
    const registerPaneHandle = vi.fn();
    const pane = createPaneApiHandle("pane-2", {
      getPaneIndex: () => 1,
      getPaneHeight: () => 240,
      getPaneOptions: () => ({ height: 240, resizable: true }),
      applyPaneOptions: () => undefined,
      setPaneHeight: () => undefined,
      isPrimary: () => false,
      isResizable: () => true,
      subscribeResize: () => undefined,
      unsubscribeResize: () => undefined,
      hasSeries: () => false,
      removePaneById: () => undefined,
      registerPaneHandle,
    });

    expect(pane.paneIndex()).toBe(1);
    expect(pane.getHeight()).toBe(240);
    expect(registerPaneHandle).toHaveBeenCalledTimes(1);
  });

  it("routes pane resize subscription through shared runtime composition", () => {
    const subscribePaneResize = vi.fn();
    const handler = vi.fn();

    subscribePaneResizeRuntime("pane-2", handler, {
      subscribePaneResize,
      hasPane: (paneId) => paneId === "pane-2",
    });

    expect(subscribePaneResize).toHaveBeenCalledTimes(1);
    const [paneId, passedHandler, options] = subscribePaneResize.mock.calls[0]!;
    expect(paneId).toBe("pane-2");
    expect(passedHandler).toBe(handler);
    expect(options.hasPane("pane-2")).toBe(true);
    expect(options.hasPane("pane-3")).toBe(false);
  });

  it("routes pane resize unsubscription through shared runtime composition", () => {
    const unsubscribePaneResize = vi.fn();
    const handler = vi.fn();

    unsubscribePaneResizeRuntime("pane-2", handler, {
      unsubscribePaneResize,
    });

    expect(unsubscribePaneResize).toHaveBeenCalledWith("pane-2", handler);
  });
});
