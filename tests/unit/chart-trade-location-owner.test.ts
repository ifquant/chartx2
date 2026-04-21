import { describe, expect, it, vi } from "vitest";

import { createChartTradeLocationOwner } from "../../src/lib/chartx/internal/views/chart-trade-location-owner";

describe("chart trade location owner", () => {
  it("owns locate state and refreshes through the shared runtime", () => {
    const ensureMainSource = vi.fn();
    const render = vi.fn();
    const owner = createChartTradeLocationOwner<
      { entryTime: number },
      { fitRange?: boolean },
      { kind: "located" },
      unknown
    >({
      ensureMainSource,
      getMainSource: () => null,
      setVisibleLogicalRange: vi.fn(),
      setVisiblePriceRange: vi.fn(),
      resetPrimaryPriceRangeOverride: vi.fn(),
      render,
    });

    const state = owner.locate({ entryTime: 10 }, { fitRange: true });

    expect(state).toBeNull();
    expect(owner.getState()).toBeNull();
    expect(owner.getActiveSession()?.request).toEqual({ entryTime: 10 });
    expect(owner.getActiveSession()?.options.fitRange).toBe(true);
    expect(ensureMainSource).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("clears active state, price override, and renders", () => {
    const resetPrimaryPriceRangeOverride = vi.fn();
    const render = vi.fn();
    const owner = createChartTradeLocationOwner<
      { entryTime: number },
      { fitRange?: boolean },
      { kind: "located" },
      unknown
    >({
      ensureMainSource: vi.fn(),
      getMainSource: () => null,
      setVisibleLogicalRange: vi.fn(),
      setVisiblePriceRange: vi.fn(),
      resetPrimaryPriceRangeOverride,
      render,
    });

    owner.setActiveSession({
      request: { entryTime: 10 },
      options: {
        fitRange: false,
        showMarkers: true,
        showSpan: true,
        showConnector: true,
        entryLabel: "Entry",
        exitLabel: "Exit",
        longColor: "#059669",
        shortColor: "#dc2626",
        spanOpacity: 0.12,
        connectorLineWidth: 2,
      },
      state: { kind: "located" },
    });

    owner.clear();

    expect(owner.getActiveSession()).toBeNull();
    expect(owner.getState()).toBeNull();
    expect(resetPrimaryPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
