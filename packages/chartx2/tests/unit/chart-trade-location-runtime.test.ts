import { describe, expect, it, vi } from "vitest";

import {
  clearTradeLocationRuntime,
  getTradeLocationState,
  locateTradeRuntime,
  refreshTradeLocationRuntime,
} from "../../src/lib/internal/views/chart-trade-location-runtime";

describe("chart trade location runtime", () => {
  it("returns the active trade-location state", () => {
    expect(getTradeLocationState({ state: { kind: "located" } })).toEqual({ kind: "located" });
    expect(getTradeLocationState(null)).toBeNull();
  });

  it("routes locate-trade through shared runtime composition", () => {
    const ensureMainSource = vi.fn();
    const refreshTradeLocation = vi.fn();
    const recorded: Array<{ request: unknown; fitRange: boolean }> = [];

    const result = locateTradeRuntime({ id: "trade-1" } as never, { fitRange: true } as never, {
      ensureMainSource,
      setActiveTradeLocation: (next) => {
        recorded.push({ request: next.request, fitRange: next.options.fitRange });
      },
      refreshTradeLocation,
      getTradeLocationState: () => ({ kind: "located" }) as never,
    });

    expect(ensureMainSource).toHaveBeenCalledTimes(1);
    expect(refreshTradeLocation).toHaveBeenCalledTimes(1);
    expect(recorded).toEqual([{ request: { id: "trade-1" }, fitRange: true }]);
    expect(result).toEqual({ kind: "located" });
  });

  it("routes clear-trade through shared runtime composition", () => {
    const clearActiveTradeLocation = vi.fn();
    const resetPrimaryPriceRangeOverride = vi.fn();
    const render = vi.fn();

    clearTradeLocationRuntime({
      clearActiveTradeLocation,
      resetPrimaryPriceRangeOverride,
      render,
    });

    expect(clearActiveTradeLocation).toHaveBeenCalledTimes(1);
    expect(resetPrimaryPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("routes refresh-trade through shared runtime composition", () => {
    const setActiveTradeLocation = vi.fn();
    const setVisibleLogicalRange = vi.fn();
    const setVisiblePriceRange = vi.fn();
    const render = vi.fn();

    refreshTradeLocationRuntime(
      {
        request: { entryTime: 2 } as never,
        options: { fitRange: false } as never,
        state: null,
      },
      {
        getMainSource: () => null,
        setActiveTradeLocation,
        setVisibleLogicalRange,
        setVisiblePriceRange,
        render,
      },
    );

    expect(setActiveTradeLocation).toHaveBeenCalledTimes(1);
    expect(setVisibleLogicalRange).not.toHaveBeenCalled();
    expect(setVisiblePriceRange).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);
  });
});
