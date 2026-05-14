import { describe, expect, it } from "vitest";

import {
  resolvePhaseOneMarketChartIndicatorPanes,
  type PhaseOneMarketChartSurfaceModel,
} from "../../src/lib/public/market-chart-surface";

describe("phase one market chart surface model", () => {
  it("normalizes attached indicator panes with readout metadata", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "5m",
      bars: [
        { time: 1, open: 3700, high: 3712, low: 3698, close: 3708 },
        { time: 2, open: 3708, high: 3720, low: 3702, close: 3718 },
      ],
      indicatorPanes: [
        {
          id: "vol",
          title: "VOL",
          subtitle: "Volume",
          height: 72,
          series: [
            {
              id: "vol",
              kind: "volume",
              label: "VOL",
              color: "#64748b",
              data: [
                { time: 1, value: 110, up: true },
                { time: 2, value: 116, up: true },
              ],
              latestLabel: "116K",
            },
          ],
        },
        {
          id: "macd",
          title: "MACD",
          subtitle: "12,26,9",
          height: 84,
          series: [
            {
              id: "hist",
              kind: "histogram",
              label: "HIST",
              color: "#94a3b8",
              data: [
                { time: 1, value: -0.02, up: false },
                { time: 2, value: 0.11, up: true },
              ],
              latestLabel: "0.11",
            },
            {
              id: "dif",
              kind: "line",
              label: "DIF",
              color: "#2563eb",
              data: [
                { time: 1, value: 0.12 },
                { time: 2, value: 0.2 },
              ],
              latestLabel: "0.20",
            },
          ],
        },
      ],
    };

    const panes = resolvePhaseOneMarketChartIndicatorPanes(model);

    expect(panes).toHaveLength(2);
    expect(panes[0]).toMatchObject({
      id: "vol",
      title: "VOL",
      height: 72,
      readouts: [{ id: "vol", label: "VOL", valueLabel: "116K", color: "#64748b" }],
    });
    expect(panes[1]).toMatchObject({
      id: "macd",
      title: "MACD",
      readouts: [
        { id: "hist", label: "HIST", valueLabel: "0.11", color: "#94a3b8" },
        { id: "dif", label: "DIF", valueLabel: "0.20", color: "#2563eb" },
      ],
    });
  });
});
