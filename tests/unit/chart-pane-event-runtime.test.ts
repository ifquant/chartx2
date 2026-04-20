import { describe, expect, it, vi } from "vitest";

import {
  emitPaneEventRuntime,
  emitPaneResizeRuntime,
} from "../../src/lib/chartx/internal/views/chart-pane-event-runtime";

describe("chart pane event runtime", () => {
  it("routes pane resize composition through the shared runtime", () => {
    const emitPaneResize = vi.fn();

    emitPaneResizeRuntime(
      {
        emitPaneResize,
        emitPaneEvent: vi.fn(),
      },
      "pane-2",
      {
        getPaneById: () => ({ kind: "secondary" }),
        getPaneIndex: () => 1,
        getPaneHeight: () => 136,
      },
    );

    expect(emitPaneResize).toHaveBeenCalledWith("pane-2", {
      getPaneById: expect.any(Function),
      getPaneIndex: expect.any(Function),
      getPaneHeight: expect.any(Function),
    });
  });

  it("routes pane event composition through the shared runtime", () => {
    const emitPaneEvent = vi.fn();
    const explicitPaneState = {
      paneIndex: 1,
      height: 136,
      isPrimary: false,
      resizable: true,
      hasSeries: false,
      seriesCount: 0,
      seriesKinds: [],
      series: [],
    };

    emitPaneEventRuntime(
      {
        emitPaneResize: vi.fn(),
        emitPaneEvent,
      },
      "resized",
      "pane-2",
      {
        buildPaneState: () => explicitPaneState,
        buildPaneSnapshot: () => [explicitPaneState],
      },
      explicitPaneState,
      [explicitPaneState],
    );

    expect(emitPaneEvent).toHaveBeenCalledWith(
      "resized",
      "pane-2",
      {
        buildPaneState: expect.any(Function),
        buildPaneSnapshot: expect.any(Function),
      },
      explicitPaneState,
      [explicitPaneState],
    );
  });
});
