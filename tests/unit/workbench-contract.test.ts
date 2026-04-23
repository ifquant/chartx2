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
    expect(model.chartHosts[0]?.family).toBe("market");
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
        },
        {
          id: "performance-main",
          family: "performance",
          title: "Performance report",
          slotId: "slot-2",
          active: false,
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
    expect(model.layout.activeChartHostId).toBe("market-main");
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
