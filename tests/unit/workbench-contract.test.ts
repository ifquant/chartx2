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
          changeLabel: "-1.93%",
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
