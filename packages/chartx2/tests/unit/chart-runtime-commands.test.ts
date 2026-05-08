import { describe, expect, it, vi } from "vitest";

import {
  clearTradeLocationCommand,
  locateTradeCommand,
  subscribeHandler,
  unsubscribeHandler,
} from "../../src/lib/internal/views/chart-runtime-commands";

describe("chart runtime commands use-case", () => {
  it("routes generic subscription helpers through shared set mutation", () => {
    const handlers = new Set<() => void>();
    const handler = vi.fn();

    subscribeHandler(handlers, handler);
    expect(handlers.has(handler)).toBe(true);

    unsubscribeHandler(handlers, handler);
    expect(handlers.has(handler)).toBe(false);
  });

  it("locates trades through shared command routing", () => {
    const recorded: Array<{ request: unknown; fitRange: boolean }> = [];
    const locatedState = { kind: "located" } as never;

    const result = locateTradeCommand({ id: "trade-1" } as never, { fitRange: true }, {
      ensureMainSource: vi.fn(),
      setActiveTradeLocation: (next) => {
        recorded.push({
          request: next.request,
          fitRange: next.options.fitRange,
        });
      },
      refreshTradeLocation: vi.fn(),
      getTradeLocationState: () => locatedState,
    });

    expect(recorded).toEqual([{ request: { id: "trade-1" }, fitRange: true }]);
    expect(result).toBe(locatedState);
  });

  it("clears trade location through shared side-effects", () => {
    const clearActiveTradeLocation = vi.fn();
    const resetPrimaryPriceRangeOverride = vi.fn();
    const render = vi.fn();

    clearTradeLocationCommand({
      clearActiveTradeLocation,
      resetPrimaryPriceRangeOverride,
      render,
    });

    expect(clearActiveTradeLocation).toHaveBeenCalledTimes(1);
    expect(resetPrimaryPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
