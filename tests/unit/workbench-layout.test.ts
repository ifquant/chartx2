import { describe, expect, it } from "vitest";

import {
  createLocalStorageWorkbenchLayoutProvider,
  createWorkbenchLayoutState,
  isWorkbenchLayoutState,
} from "../../src/lib/chartx/public/workbench-layout";
import type { PhaseOneChartStateSnapshot } from "../../src/lib/chartx/internal/views/chart-api-types";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function createThrowingStorage(): Storage {
  return {
    get length() {
      return 0;
    },
    clear() {
      throw new Error("clear failed");
    },
    getItem() {
      throw new Error("getItem failed");
    },
    key() {
      return null;
    },
    removeItem() {
      throw new Error("removeItem failed");
    },
    setItem() {
      throw new Error("setItem failed");
    },
  };
}

const minimalChartStateSnapshot: PhaseOneChartStateSnapshot = {
  options: {},
  timeScale: {
    barSpacing: null,
    rightOffset: 0,
    visibleLogicalRange: null,
  },
  priceScale: {
    visibleRange: null,
    scaleSeriesOnly: false,
  },
  panes: [{ height: null, resizable: false }],
  mainSeries: null,
  series: [],
  studies: [],
  tradeLocation: null,
  drawings: [],
};

describe("workbench layout state", () => {
  it("creates a versioned layout state for the active chart", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
    });

    expect(state).toEqual({
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    });
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("rejects invalid layout payloads", () => {
    expect(isWorkbenchLayoutState(null)).toBe(false);
    expect(isWorkbenchLayoutState({ kind: "workbench-layout", version: 2 })).toBe(false);
    expect(
      isWorkbenchLayoutState({
        kind: "workbench-layout",
        version: 1,
        activeSymbol: "SPX",
        activeTimeframe: "1D",
        chartType: "unsupported-type",
        chartState: null,
        panels: {
          rightSidebar: "watchlist",
          bottomTab: "time-presets",
        },
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        kind: "workbench-layout",
        version: 1,
        activeSymbol: "",
        activeTimeframe: "1D",
        chartType: "candlestick",
        chartState: null,
        panels: {
          rightSidebar: "watchlist",
          bottomTab: "time-presets",
        },
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        kind: "workbench-layout",
        version: 1,
        activeSymbol: "SPX",
        activeTimeframe: "1D",
        chartType: "candlestick",
        chartState: {
          options: {},
          timeScale: {},
          priceScale: {},
          panes: [{}],
          mainSeries: null,
          series: [{}],
          studies: [{}],
          tradeLocation: {},
          drawings: [{}],
        },
        panels: {
          rightSidebar: "watchlist",
          bottomTab: "time-presets",
        },
      }),
    ).toBe(false);
  });

  it("accepts a minimal valid persisted layout snapshot", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
    });

    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("saves, loads, and clears layout state from localStorage", async () => {
    const storage = createMemoryStorage();
    const provider = createLocalStorageWorkbenchLayoutProvider(storage, "chartx2:test-layout");
    const state = createWorkbenchLayoutState({
      activeSymbol: "NDX",
      activeTimeframe: "1D",
      chartType: "renko",
      chartState: null,
    });

    await provider.saveWorkbenchLayout(state);
    await expect(provider.loadWorkbenchLayout()).resolves.toEqual(state);

    await provider.clearWorkbenchLayout();
    await expect(provider.loadWorkbenchLayout()).resolves.toBeNull();
  });

  it("returns null for invalid persisted JSON", async () => {
    const storage = createMemoryStorage();
    storage.setItem("chartx2:test-layout", "{bad json");
    const provider = createLocalStorageWorkbenchLayoutProvider(storage, "chartx2:test-layout");

    await expect(provider.loadWorkbenchLayout()).resolves.toBeNull();
  });

  it("treats storage access failures as empty layout state", async () => {
    const provider = createLocalStorageWorkbenchLayoutProvider(
      createThrowingStorage(),
      "chartx2:test-layout",
    );

    await expect(provider.loadWorkbenchLayout()).resolves.toBeNull();
    await expect(
      provider.saveWorkbenchLayout(
        createWorkbenchLayoutState({
          activeSymbol: "SPX",
          activeTimeframe: "1D",
          chartType: "candlestick",
          chartState: null,
        }),
      ),
    ).resolves.toBeUndefined();
    await expect(provider.clearWorkbenchLayout()).resolves.toBeUndefined();
  });
});
