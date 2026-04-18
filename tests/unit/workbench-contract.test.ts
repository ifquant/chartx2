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
    expect(model.rightSidebar.watchlist.items).toHaveLength(1);
    expect(model.rightSidebar.alerts.items).toHaveLength(1);
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
});
