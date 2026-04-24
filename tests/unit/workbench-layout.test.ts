import { describe, expect, it } from "vitest";

import {
  createLocalStorageWorkbenchLayoutProvider,
  createWorkbenchLayoutState,
  isWorkbenchLayoutState,
  normalizeWorkbenchLayoutScriptedIndicatorDescriptor,
  normalizeWorkbenchLayoutScriptedIndicatorDescriptors,
  stripWorkbenchLayoutScriptedStudiesFromChartState,
} from "../../src/lib/chartx/public/workbench-layout";
import { createWorkbenchCustomScriptDefinition } from "../../src/lib/chartx/public/workbench-scripts";
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

const scriptedIndicators = [
  {
    id: "scripted-close-sma",
    label: "Scripted SMA 20",
    kind: "script" as const,
    placement: "separate-pane" as const,
    studyOptions: {
      scriptId: "close-sma-20-v0",
      inputValues: {
        length: 8,
      },
      inputContextMode: "chart-context" as const,
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward" as const,
    },
  },
] as const;

const customScripts = [
  createWorkbenchCustomScriptDefinition("custom-script-1", {
    label: "My Close Spread",
    shortLabel: "My Spread",
    description: "Close minus close SMA.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: 9,
  }),
] as const;

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

  it("accepts a layout snapshot with persisted workspace documents", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
      customScripts,
      scriptedIndicators,
      workspace: {
        activeTabId: "workspace-2",
        tabs: [
          {
            id: "workspace-1",
            label: "Trade",
            viewId: "trade",
            activeSymbol: "NDX",
            activeTimeframe: "1D",
            chartType: "candlestick",
            chartState: null,
            scriptedIndicators,
            panels: {
              rightSidebar: "watchlist",
              bottomTab: "time-presets",
            },
          },
          {
            id: "workspace-2",
            label: "Inspect",
            viewId: "inspect",
            activeSymbol: "SPX",
            activeTimeframe: "1D",
            chartType: "candlestick",
            chartState: minimalChartStateSnapshot,
            scriptedIndicators: [],
            panels: {
              rightSidebar: "object-tree",
              bottomTab: "logs",
            },
          },
        ],
      },
    });

    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("preserves scripted indicator layout metadata outside engine chart state", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
      customScripts,
      scriptedIndicators,
      workspace: {
        activeTabId: "workspace-1",
        tabs: [
          {
            id: "workspace-1",
            label: "Trade",
            viewId: "trade",
            activeSymbol: "SPX",
            activeTimeframe: "1D",
            chartType: "candlestick",
            chartState: minimalChartStateSnapshot,
            scriptedIndicators,
            panels: {
              rightSidebar: "watchlist",
              bottomTab: "time-presets",
            },
          },
        ],
      },
    });

    expect(state.scriptedIndicators).toEqual(scriptedIndicators);
    expect(state.customScripts).toEqual(customScripts);
    expect(state.workspace?.tabs[0]?.scriptedIndicators).toEqual(scriptedIndicators);
    expect(state.chartState).toEqual(minimalChartStateSnapshot);
    expect(state.chartState).not.toHaveProperty("scriptedIndicators");
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("strips engine scripted-study snapshots back out of chart state when the descriptor bridge is present", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: {
        ...minimalChartStateSnapshot,
        panes: [
          { height: null, resizable: false },
          { height: 126, resizable: false },
        ],
        studies: [
          {
            type: "scripted-study",
            paneIndex: 1,
            seriesOptions: {},
            studyOptions: {
              scriptId: "close-sma-20-v0",
              inputValues: {
                length: 8,
              },
              inputContextMode: "chart-context",
              requestedSymbol: null,
              requestedResolution: null,
              requestedSession: null,
              requestedTimezone: null,
              mergePolicy: "carry-forward",
            },
          },
        ],
      },
      scriptedIndicators,
    });

    expect(state.chartState).toEqual(minimalChartStateSnapshot);
    expect(state.scriptedIndicators).toEqual(scriptedIndicators);
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("normalizes a scripted study descriptor into the workbench-owned bridge shape", () => {
    expect(
      normalizeWorkbenchLayoutScriptedIndicatorDescriptor({
        id: " scripted-close-sma ",
        label: " Scripted SMA 20 ",
        kind: "script",
        placement: "separate-pane",
        studyOptions: {
          scriptId: " custom-script-1 ",
          inputValues: {
            length: 8,
            bad: Number.NaN,
            " ": 5,
          },
        },
      }),
    ).toEqual({
      id: "scripted-close-sma",
      label: "Scripted SMA 20",
      kind: "script",
      placement: "separate-pane",
      studyOptions: {
        scriptId: "custom-script-1",
        inputValues: {
          length: 8,
        },
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
    });
  });

  it("drops malformed scripted study descriptors while preserving valid order", () => {
    expect(
      normalizeWorkbenchLayoutScriptedIndicatorDescriptors([
        {
          id: " scripted-close-sma ",
          label: " Scripted SMA 20 ",
          kind: "script",
          placement: "separate-pane",
          studyOptions: {
            scriptId: " custom-script-1 ",
            inputValues: {
              length: 8,
            },
          },
        },
        {
          id: "bad-kind",
          label: "Broken",
          kind: "overlay",
          placement: "separate-pane",
          studyOptions: {
            scriptId: "custom-script-2",
          },
        },
        {
          id: "bad-placement",
          label: "Broken placement",
          kind: "script",
          placement: "floating-pane",
          studyOptions: {
            scriptId: "custom-script-3",
          },
        },
      ] as unknown as typeof scriptedIndicators),
    ).toEqual([
      {
        id: "scripted-close-sma",
        label: "Scripted SMA 20",
        kind: "script",
        placement: "separate-pane",
        studyOptions: {
          scriptId: "custom-script-1",
          inputValues: {
            length: 8,
          },
          inputContextMode: "chart-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      },
    ]);
  });

  it("sanitizes scripted study descriptors during layout creation", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
      scriptedIndicators: [
        {
          id: " scripted-close-sma ",
          label: " Scripted SMA 20 ",
          kind: "script",
          placement: "separate-pane",
          studyOptions: {
            scriptId: " custom-script-1 ",
            inputValues: {
              length: 8,
              bad: Number.NaN,
            },
          },
        },
        {
          id: "bad-placement",
          label: "Broken placement",
          kind: "script",
          placement: "floating-pane",
          studyOptions: {
            scriptId: "custom-script-2",
          },
        },
      ] as unknown as readonly typeof scriptedIndicators[number][],
      workspace: {
        activeTabId: "workspace-1",
        tabs: [
          {
            id: "workspace-1",
            label: "Trade",
            viewId: "trade",
            activeSymbol: "SPX",
            activeTimeframe: "1D",
            chartType: "candlestick",
            chartState: minimalChartStateSnapshot,
            scriptedIndicators: [
              {
                id: " workspace-script ",
                label: " Workspace Script ",
                kind: "script",
                placement: "separate-pane",
                studyOptions: {
                  scriptId: " custom-script-3 ",
                  inputValues: {
                    length: 5,
                    invalid: Number.POSITIVE_INFINITY,
                  },
                },
              },
            ] as unknown as readonly typeof scriptedIndicators[number][],
            panels: {
              rightSidebar: "watchlist",
              bottomTab: "time-presets",
            },
          },
        ],
      },
    });

    expect(state.scriptedIndicators).toEqual([
      {
        id: "scripted-close-sma",
        label: "Scripted SMA 20",
        kind: "script",
        placement: "separate-pane",
        studyOptions: {
          scriptId: "custom-script-1",
          inputValues: {
            length: 8,
          },
          inputContextMode: "chart-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      },
    ]);
    expect(state.workspace?.tabs[0]?.scriptedIndicators).toEqual([
      {
        id: "workspace-script",
        label: "Workspace Script",
        kind: "script",
        placement: "separate-pane",
        studyOptions: {
          scriptId: "custom-script-3",
          inputValues: {
            length: 5,
          },
          inputContextMode: "chart-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      },
    ]);
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("migrates legacy scripted study descriptors into engine-owned study options", () => {
    expect(
      normalizeWorkbenchLayoutScriptedIndicatorDescriptor({
        id: " legacy-scripted-close-sma ",
        label: " Legacy Scripted SMA ",
        kind: "script",
        placement: "separate-pane",
        scriptId: " custom-script-7 ",
        inputValues: {
          length: 13,
        },
      }),
    ).toEqual({
      id: "legacy-scripted-close-sma",
      label: "Legacy Scripted SMA",
      kind: "script",
      placement: "separate-pane",
      studyOptions: {
        scriptId: "custom-script-7",
        inputValues: {
          length: 13,
        },
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
    });
  });

  it("rejects persisted series and study data arrays with invalid rows", () => {
    const invalidSeriesState = {
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: {
        ...minimalChartStateSnapshot,
        series: [{ kind: "line", paneIndex: 0, options: {}, data: [{}] }],
      },
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    };
    const invalidStudyState = {
      ...invalidSeriesState,
      chartState: {
        ...minimalChartStateSnapshot,
        series: [],
        studies: [{ type: "overlay", paneIndex: 0, seriesOptions: {}, data: [{}] }],
      },
    };

    expect(isWorkbenchLayoutState(invalidSeriesState)).toBe(false);
    expect(isWorkbenchLayoutState(invalidStudyState)).toBe(false);
  });

  it("accepts valid minimal persisted data rows for restored chart content", () => {
    const state = {
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: {
        ...minimalChartStateSnapshot,
        series: [
          {
            kind: "candlestick",
            paneIndex: 0,
            options: {},
            data: [{ time: 1, open: 1, high: 2, low: 0.5, close: 1.5 }],
          },
          {
            kind: "bar",
            paneIndex: 0,
            options: {},
            data: [{ time: 1, open: 1, high: 2, low: 0.5, close: 1.5 }],
          },
          { kind: "line", paneIndex: 0, options: {}, data: [{ time: 1, value: 1.5 }] },
          { kind: "area", paneIndex: 0, options: {}, data: [{ time: 1, value: 1.5 }] },
          { kind: "baseline", paneIndex: 0, options: {}, data: [{ time: 1, value: 1.5 }] },
          { kind: "histogram", paneIndex: 0, options: {}, data: [{ time: 1, value: 1.5 }] },
          {
            kind: "volume",
            paneIndex: 0,
            options: {},
            data: [{ time: 1, value: 100, color: "#123456", isUp: true }],
          },
        ],
        studies: [
          {
            type: "overlay",
            paneIndex: 0,
            seriesOptions: {},
            data: [{ time: 1, value: 1.5 }],
          },
          {
            type: "compare",
            paneIndex: 0,
            seriesOptions: {},
            compareOptions: {},
            data: [{ time: 1, value: 1.5 }],
          },
        ],
      },
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    };

    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("keeps backward compatibility when scripted indicator metadata is absent", () => {
    const legacyState = {
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
      workspace: {
        activeTabId: "workspace-1",
        tabs: [
          {
            id: "workspace-1",
            label: "Trade",
            viewId: "trade",
            activeSymbol: "SPX",
            activeTimeframe: "1D",
            chartType: "candlestick",
            chartState: null,
            panels: {
              rightSidebar: "watchlist",
              bottomTab: "time-presets",
            },
          },
        ],
      },
    };

    expect(isWorkbenchLayoutState(legacyState)).toBe(true);
  });

  it("rejects malformed scripted indicator payloads", () => {
    const baseState = {
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: minimalChartStateSnapshot,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    };

    expect(
      isWorkbenchLayoutState({
        ...baseState,
        scriptedIndicators: [{ ...scriptedIndicators[0], kind: "overlay" }],
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        ...baseState,
        scriptedIndicators: [
          {
            ...scriptedIndicators[0],
            studyOptions: {
              ...scriptedIndicators[0].studyOptions,
              scriptId: "",
            },
          },
        ],
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        ...baseState,
        workspace: {
          activeTabId: "workspace-1",
          tabs: [
            {
              id: "workspace-1",
              label: "Trade",
              viewId: "trade",
              activeSymbol: "SPX",
              activeTimeframe: "1D",
              chartType: "candlestick",
              chartState: null,
              scriptedIndicators: [{ ...scriptedIndicators[0], placement: "floating-pane" }],
              panels: {
                rightSidebar: "watchlist",
                bottomTab: "time-presets",
              },
            },
          ],
        },
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        ...baseState,
        scriptedIndicators: [
          {
            ...scriptedIndicators[0],
            studyOptions: {
              ...scriptedIndicators[0].studyOptions,
              inputValues: { length: Number.NaN },
            },
          },
        ],
      }),
    ).toBe(false);
    expect(
      isWorkbenchLayoutState({
        ...baseState,
        customScripts: [{ ...customScripts[0], label: "" }],
      }),
    ).toBe(false);
  });

  it("preserves the controller-saved symbol, timeframe, chart type, and chart snapshot", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "4H",
      chartType: "renko",
      chartState: minimalChartStateSnapshot,
    });

    expect(state).toEqual({
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "4H",
      chartType: "renko",
      chartState: minimalChartStateSnapshot,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    });
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("preserves the controller-saved null chart snapshot", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "NDX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
    });

    expect(state.chartState).toBeNull();
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
      scriptedIndicators,
    });

    await expect(provider.saveWorkbenchLayout(state)).resolves.toBe(true);
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

  it("loads legacy persisted scripted descriptors through the canonical study-options bridge", async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      "chartx2:test-layout",
      JSON.stringify({
        kind: "workbench-layout",
        version: 1,
        activeSymbol: "NDX",
        activeTimeframe: "1D",
        chartType: "renko",
        chartState: null,
        scriptedIndicators: [
          {
            id: "legacy-scripted-close-sma",
            label: "Legacy Scripted SMA",
            kind: "script",
            placement: "separate-pane",
            scriptId: "custom-script-8",
            inputValues: {
              length: 21,
            },
          },
        ],
        panels: {
          rightSidebar: "watchlist",
          bottomTab: "time-presets",
        },
      }),
    );
    const provider = createLocalStorageWorkbenchLayoutProvider(storage, "chartx2:test-layout");

    await expect(provider.loadWorkbenchLayout()).resolves.toEqual(
      createWorkbenchLayoutState({
        activeSymbol: "NDX",
        activeTimeframe: "1D",
        chartType: "renko",
        chartState: null,
        scriptedIndicators: [
          {
            id: "legacy-scripted-close-sma",
            label: "Legacy Scripted SMA",
            kind: "script",
            placement: "separate-pane",
            studyOptions: {
              scriptId: "custom-script-8",
              inputValues: {
                length: 21,
              },
              inputContextMode: "chart-context",
              requestedSymbol: null,
              requestedResolution: null,
              requestedSession: null,
              requestedTimezone: null,
              mergePolicy: "carry-forward",
            },
          },
        ],
      }),
    );
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
    ).resolves.toBe(false);
    await expect(provider.clearWorkbenchLayout()).resolves.toBeUndefined();
  });
});
