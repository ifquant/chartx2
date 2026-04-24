import { describe, expect, it } from "vitest";

import {
  createChartWorkbenchModel,
  type ChartWorkbenchModel,
} from "../../src/lib/chartx/public/workbench";

describe("chart workbench contract", () => {
  it("builds a single-chart workbench model with host integration friendly defaults", () => {
    const model = createChartWorkbenchModel({
      symbol: "NDX",
      exchangeLabel: "NASDAQ",
      timeframeLabel: "1D",
      chartTypeLabel: "Candles",
      activeWatchlistItemId: "ndx",
      activeRange: "1D",
      watchlistItems: [
        {
          id: "ndx",
          symbol: "NDX",
          lastLabel: "23,132.77",
          lastValue: 23132.77,
          changeLabel: "-1.93%",
          changePercent: -1.93,
          changeTone: "negative",
        },
      ],
      alertItems: [
        {
          id: "alert-1",
          label: "NDX breakout",
          conditionLabel: "Price crosses 23,250",
          status: "armed",
        },
      ],
    });

    expect(model.toolbar.activeSymbol).toBe("NDX");
    expect(model.layout.preset).toBe("single");
    expect(model.layout.symbolMode).toBe("shared");
    expect(model.layout.slots).toHaveLength(1);
    expect(model.layout.activeChartHostId).toBe("market-main");
    expect(model.chartHosts[0]).toMatchObject({
      family: "market",
      symbolLabel: "NDX",
      timeframeLabel: "1D",
      chartTypeLabel: "Candles",
      statusLabel: "Active",
    });
    expect(model.rightSidebar.watchlist.activeItemId).toBe("ndx");
    expect(model.rightSidebar.watchlist.items).toHaveLength(1);
    expect(model.rightSidebar.screener).toEqual({
      title: "Screener",
      modeLabel: "Local watchlist movers",
      summaryLabel: "0 matches",
      filters: [],
      results: [],
      emptyLabel: "No local screener matches",
    });
    expect(model.rightSidebar.alerts.items).toHaveLength(1);
    expect(model.rightSidebar.objectTree).toMatchObject({
      title: "Object Tree",
      summaryLabel: "1 object",
      emptyLabel: "No chart objects",
    });
    expect(model.rightSidebar.objectTree.nodes).toEqual([
      {
        id: "chart:NDX",
        kind: "chart",
        label: "NDX",
        detailLabel: "Candles",
        depth: 0,
      },
    ]);
    expect(model.bottomPanel.ranges[0]).toBe("1D");
    expect(model.bottomPanel.tabs.find((tab) => tab.id === "replay")).toEqual({
      id: "replay",
      label: "Replay",
      enabled: false,
    });
    expect(model.commandPalette).toEqual({
      title: "Workbench Commands",
      entries: [],
    });
    expect(model.workspaceTabs).toEqual([
      {
        id: "trade",
        label: "Trade",
        viewId: "trade",
        active: true,
        enabled: true,
        sidebarPanel: "watchlist",
        bottomTab: "time-presets",
      },
      {
        id: "scan",
        label: "Scan",
        viewId: "scan",
        active: false,
        enabled: true,
        sidebarPanel: "screener",
        bottomTab: "time-presets",
      },
      {
        id: "alerts",
        label: "Alerts",
        viewId: "alerts",
        active: false,
        enabled: true,
        sidebarPanel: "alerts",
        bottomTab: "logs",
      },
      {
        id: "inspect",
        label: "Inspect",
        viewId: "inspect",
        active: false,
        enabled: true,
        sidebarPanel: "object-tree",
        bottomTab: "logs",
      },
    ]);
    expect(model.activeRightSidebarPanel).toBe("watchlist");
    expect(model.layoutTransfer).toEqual({
      importLabel: "Import layout",
      exportLabel: "Export layout",
      importEnabled: false,
      exportEnabled: false,
    });
    expect(model.statusNotice).toBeNull();
    expect(model.adapterStatus).toEqual([]);
    expect(model.rightSidebar.watchlist.emptyLabel).toBe("No watchlist symbols loaded");
    expect(model.rightSidebar.alerts.emptyLabel).toBe("No active alerts");
  });

  it("allows the shell to opt into additional enabled bottom tabs", () => {
    const model = createChartWorkbenchModel({
      symbol: "AAPL",
      timeframeLabel: "1D",
      chartTypeLabel: "Candles",
      enabledBottomTabs: ["replay"],
      activeTab: "replay",
    });

    expect(model.bottomPanel.activeTab).toBe("replay");
    expect(model.bottomPanel.tabs.find((tab) => tab.id === "replay")).toEqual({
      id: "replay",
      label: "Replay",
      enabled: true,
    });
    expect(model.bottomPanel.tabs.find((tab) => tab.id === "time-presets")).toEqual({
      id: "time-presets",
      label: "Time presets",
      enabled: true,
    });
  });

  it("keeps screener panel state inside the public right-sidebar contract", () => {
    const model = createChartWorkbenchModel({
      symbol: "SPX",
      timeframeLabel: "1D",
      chartTypeLabel: "Candles",
      screener: {
        title: "Screener",
        modeLabel: "Local watchlist movers",
        summaryLabel: "2 matches · abs % move",
        filters: [
          {
            id: "screener-negative-only",
            label: "Falling",
            active: true,
            enabled: true,
          },
          {
            id: "screener-upside-only",
            label: "Upside only",
            active: false,
            enabled: false,
          },
        ],
        results: [
          {
            id: "screener-spx",
            symbol: "SPX",
            name: "S&P 500",
            lastLabel: "6,368.86",
            changeLabel: "-1.67%",
            rankLabel: "Rank 1",
            noteLabel: "1.67% below prior close",
            changeTone: "negative",
          },
        ],
        emptyLabel: "No local screener matches",
      },
    });

    expect(model.rightSidebar.screener.modeLabel).toBe("Local watchlist movers");
    expect(model.rightSidebar.screener.filters).toEqual([
      {
        id: "screener-negative-only",
        label: "Falling",
        active: true,
        enabled: true,
      },
      {
        id: "screener-upside-only",
        label: "Upside only",
        active: false,
        enabled: false,
      },
    ]);
    expect(model.rightSidebar.screener.results).toEqual([
      {
        id: "screener-spx",
        symbol: "SPX",
        name: "S&P 500",
        lastLabel: "6,368.86",
        changeLabel: "-1.67%",
        rankLabel: "Rank 1",
        noteLabel: "1.67% below prior close",
        changeTone: "negative",
      },
    ]);
  });

  it("keeps public command palette metadata on the workbench contract", () => {
    const model = createChartWorkbenchModel({
      symbol: "NQ",
      timeframeLabel: "15m",
      chartTypeLabel: "Candles",
      commandPalette: {
        title: "Workbench Commands",
        entries: [
          {
            id: "theme",
            label: "Switch theme to ink",
            enabled: true,
          },
          {
            id: "layout-split",
            label: "Use split layout",
            enabled: true,
            active: true,
            shortcutLabel: "Cmd/Ctrl+K",
          },
        ],
      },
    });

    expect(model.commandPalette).toEqual({
      title: "Workbench Commands",
      entries: [
        {
          id: "theme",
          label: "Switch theme to ink",
          enabled: true,
        },
        {
          id: "layout-split",
          label: "Use split layout",
          enabled: true,
          active: true,
          shortcutLabel: "Cmd/Ctrl+K",
        },
      ],
    });
  });

  it("keeps workspace focus, layout transfer, and status models on the public workbench contract", () => {
    const model = createChartWorkbenchModel({
      symbol: "BTCUSD",
      timeframeLabel: "4H",
      chartTypeLabel: "Candles",
      activeRightSidebarPanel: "object-tree",
      workspaceTabs: [
        {
          id: "workspace-1",
          label: "Trade",
          viewId: "trade",
          active: false,
          enabled: true,
          sidebarPanel: "watchlist",
          bottomTab: "time-presets",
        },
        {
          id: "workspace-2",
          label: "Inspect",
          viewId: "inspect",
          active: true,
          enabled: true,
          closeable: true,
          sidebarPanel: "object-tree",
          bottomTab: "logs",
          symbolLabel: "BTCUSD",
          timeframeLabel: "4H",
        },
      ],
      layoutTransfer: {
        importLabel: "Import layout",
        exportLabel: "Export layout",
        importEnabled: true,
        exportEnabled: true,
      },
      statusNotice: {
        tone: "warning",
        message: "Local layout save is unavailable.",
      },
      adapterStatus: [
        {
          id: "layout-persistence",
          label: "Layout persistence",
          state: "missing",
          detailLabel: "No provider attached",
        },
      ],
    });

    expect(model.activeRightSidebarPanel).toBe("object-tree");
    expect(model.workspaceTabs).toEqual([
      {
        id: "workspace-1",
        label: "Trade",
        viewId: "trade",
        active: false,
        enabled: true,
        sidebarPanel: "watchlist",
        bottomTab: "time-presets",
      },
      {
        id: "workspace-2",
        label: "Inspect",
        viewId: "inspect",
        active: true,
        enabled: true,
        closeable: true,
        sidebarPanel: "object-tree",
        bottomTab: "logs",
        symbolLabel: "BTCUSD",
        timeframeLabel: "4H",
      },
    ]);
    expect(model.layoutTransfer).toEqual({
      importLabel: "Import layout",
      exportLabel: "Export layout",
      importEnabled: true,
      exportEnabled: true,
    });
    expect(model.statusNotice).toEqual({
      tone: "warning",
      message: "Local layout save is unavailable.",
    });
    expect(model.adapterStatus).toEqual([
      {
        id: "layout-persistence",
        label: "Layout persistence",
        state: "missing",
        detailLabel: "No provider attached",
      },
    ]);
  });

  it("preserves watchlist and alerts empty-state labels on the public workbench contract", () => {
    const model = createChartWorkbenchModel({
      symbol: "GC",
      timeframeLabel: "1H",
      chartTypeLabel: "Candles",
      watchlistItems: [],
      watchlistEmptyLabel: "Watchlist feed unavailable.",
      alertItems: [],
      alertsEmptyLabel: "Local alerts persistence unavailable.",
    });

    expect(model.rightSidebar.watchlist.emptyLabel).toBe("Watchlist feed unavailable.");
    expect(model.rightSidebar.alerts.emptyLabel).toBe("Local alerts persistence unavailable.");
  });

  it("preserves typed watchlist numeric fields even when labels are localized presentation strings", () => {
    const model = createChartWorkbenchModel({
      symbol: "ES",
      timeframeLabel: "5m",
      chartTypeLabel: "Candles",
      watchlistItems: [
        {
          id: "es",
          symbol: "ES",
          name: "E-mini S&P 500",
          lastLabel: "$5.284,25 localized",
          lastValue: 5284.25,
          changeLabel: "−0,42 percent",
          changePercent: -0.42,
          changeTone: "negative",
        },
      ],
    });

    expect(model.rightSidebar.watchlist.items).toEqual([
      {
        id: "es",
        symbol: "ES",
        name: "E-mini S&P 500",
        lastLabel: "$5.284,25 localized",
        lastValue: 5284.25,
        changeLabel: "−0,42 percent",
        changePercent: -0.42,
        changeTone: "negative",
      },
    ]);
  });

  it("accepts explicit multi-chart hosts without collapsing them into pane semantics", () => {
    const model: ChartWorkbenchModel = createChartWorkbenchModel({
      symbol: "TSLA",
      timeframeLabel: "1H",
      chartTypeLabel: "Candles",
      layoutPreset: "grid-2x2",
      chartHosts: [
        {
          id: "market-main",
          family: "market",
          title: "Main chart",
          slotId: "slot-1",
          active: true,
          symbolLabel: "TSLA",
          timeframeLabel: "1H",
          chartTypeLabel: "Candles",
          statusLabel: "Active",
        },
        {
          id: "performance-main",
          family: "performance",
          title: "Performance report",
          slotId: "slot-2",
          active: false,
          symbolLabel: "TSLA",
          timeframeLabel: "1H",
          chartTypeLabel: "Performance",
        },
      ],
    });

    expect(model.layout.preset).toBe("grid-2x2");
    expect(model.layout.slots).toHaveLength(4);
    expect(model.layout.slots.filter((slot) => slot.chartHostId !== null)).toHaveLength(2);
    expect(model.chartHosts.map((host) => host.family)).toEqual([
      "market",
      "performance",
    ]);
    expect(model.chartHosts[0]).toMatchObject({
      symbolLabel: "TSLA",
      timeframeLabel: "1H",
      chartTypeLabel: "Candles",
      statusLabel: "Active",
    });
    expect(model.chartHosts[1]).toMatchObject({
      symbolLabel: "TSLA",
      timeframeLabel: "1H",
      chartTypeLabel: "Performance",
      statusLabel: undefined,
    });
    expect(model.layout.activeChartHostId).toBe("market-main");
  });

  it("keeps active-host routing metadata aligned with the selected host", () => {
    const model = createChartWorkbenchModel({
      symbol: "ES",
      timeframeLabel: "5m",
      chartTypeLabel: "Candles",
      chartHosts: [
        {
          id: "market-main",
          family: "market",
          title: "Primary chart",
          slotId: "slot-main",
          active: false,
        },
        {
          id: "performance-main",
          family: "performance",
          title: "Performance chart",
          slotId: "slot-side",
          active: true,
        },
      ],
      layoutPreset: "main-plus-secondary",
    });

    expect(model.layout.activeChartHostId).toBe("performance-main");
    expect(model.chartHosts).toEqual([
      {
        id: "market-main",
        family: "market",
        title: "Primary chart",
        slotId: "slot-main",
        active: false,
        symbolLabel: "ES",
        timeframeLabel: "5m",
        chartTypeLabel: "Candles",
        statusLabel: undefined,
      },
      {
        id: "performance-main",
        family: "performance",
        title: "Performance chart",
        slotId: "slot-side",
        active: true,
        symbolLabel: "ES",
        timeframeLabel: "5m",
        chartTypeLabel: "Candles",
        statusLabel: "Active",
      },
    ]);
    expect(model.layout.slots).toEqual([
      {
        id: "slot-main",
        title: "Primary chart",
        role: "primary",
        chartHostId: "market-main",
      },
      {
        id: "slot-side",
        title: "Performance chart",
        role: "secondary",
        chartHostId: "performance-main",
      },
    ]);
  });

  it("normalizes the first host as active when no host is marked active", () => {
    const model = createChartWorkbenchModel({
      symbol: "CL",
      timeframeLabel: "15m",
      chartTypeLabel: "Candles",
      chartHosts: [
        {
          id: "market-main",
          family: "market",
          title: "Primary chart",
          slotId: "slot-main",
          active: false,
          symbolLabel: "CL",
          timeframeLabel: "15m",
          chartTypeLabel: "Candles",
        },
        {
          id: "performance-main",
          family: "performance",
          title: "Performance chart",
          slotId: "slot-side",
          active: false,
          symbolLabel: "CL",
          timeframeLabel: "15m",
          chartTypeLabel: "Performance",
        },
      ],
      layoutPreset: "main-plus-secondary",
    });

    expect(model.layout.activeChartHostId).toBe("market-main");
    expect(model.chartHosts).toEqual([
      {
        id: "market-main",
        family: "market",
        title: "Primary chart",
        slotId: "slot-main",
        active: true,
        symbolLabel: "CL",
        timeframeLabel: "15m",
        chartTypeLabel: "Candles",
        statusLabel: "Active",
      },
      {
        id: "performance-main",
        family: "performance",
        title: "Performance chart",
        slotId: "slot-side",
        active: false,
        symbolLabel: "CL",
        timeframeLabel: "15m",
        chartTypeLabel: "Performance",
        statusLabel: undefined,
      },
    ]);
  });

  it("keeps the first active host active when multiple hosts are marked active", () => {
    const model = createChartWorkbenchModel({
      symbol: "NQ",
      timeframeLabel: "1H",
      chartTypeLabel: "Candles",
      chartHosts: [
        {
          id: "market-main",
          family: "market",
          title: "Primary chart",
          slotId: "slot-main",
          active: true,
          symbolLabel: "NQ",
          timeframeLabel: "1H",
          chartTypeLabel: "Candles",
        },
        {
          id: "performance-main",
          family: "performance",
          title: "Performance chart",
          slotId: "slot-side",
          active: true,
          symbolLabel: "NQ",
          timeframeLabel: "1H",
          chartTypeLabel: "Performance",
        },
      ],
      layoutPreset: "main-plus-secondary",
    });

    expect(model.layout.activeChartHostId).toBe("market-main");
    expect(model.chartHosts).toEqual([
      {
        id: "market-main",
        family: "market",
        title: "Primary chart",
        slotId: "slot-main",
        active: true,
        symbolLabel: "NQ",
        timeframeLabel: "1H",
        chartTypeLabel: "Candles",
        statusLabel: "Active",
      },
      {
        id: "performance-main",
        family: "performance",
        title: "Performance chart",
        slotId: "slot-side",
        active: false,
        symbolLabel: "NQ",
        timeframeLabel: "1H",
        chartTypeLabel: "Performance",
        statusLabel: undefined,
      },
    ]);
  });

  it("preserves an explicit object tree without affecting watchlist or alerts", () => {
    const objectTree = {
      title: "Objects",
      summaryLabel: "3 objects",
      emptyLabel: "No objects",
      nodes: [
        {
          id: "chart:ES",
          kind: "chart" as const,
          label: "ES",
          detailLabel: "Candles",
          depth: 0,
        },
        {
          id: "pane:main",
          kind: "pane" as const,
          label: "Main pane",
          badgeLabel: "2 series",
          depth: 1,
        },
        {
          id: "alert:es-breakout",
          kind: "alert" as const,
          label: "ES breakout",
          detailLabel: "Price crosses 5,300",
          depth: 1,
          muted: true,
        },
      ],
    };

    const model = createChartWorkbenchModel({
      symbol: "ES",
      timeframeLabel: "5m",
      chartTypeLabel: "Candles",
      watchlistItems: [
        {
          id: "es",
          symbol: "ES",
          lastLabel: "5,284.25",
          changeLabel: "+0.42%",
          changeTone: "positive",
        },
      ],
      alertItems: [
        {
          id: "alert-1",
          label: "ES support",
          conditionLabel: "Price crosses 5,250",
          status: "paused",
        },
      ],
      objectTree,
    });

    expect(model.rightSidebar.objectTree).toBe(objectTree);
    expect(model.rightSidebar.watchlist.items).toEqual([
      {
        id: "es",
        symbol: "ES",
        lastLabel: "5,284.25",
        changeLabel: "+0.42%",
        changeTone: "positive",
      },
    ]);
    expect(model.rightSidebar.alerts.items).toEqual([
      {
        id: "alert-1",
        label: "ES support",
        conditionLabel: "Price crosses 5,250",
        status: "paused",
      },
    ]);
  });
});
