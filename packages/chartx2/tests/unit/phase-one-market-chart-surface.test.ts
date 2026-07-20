import { describe, expect, it } from "vitest";

import {
  normalizePhaseOneMarketChartSurfaceLayout,
  resolvePhaseOneMarketChartActiveDataLength,
  resolvePhaseOneMarketChartDisplayMode,
  resolvePhaseOneMarketChartIndicatorPanes,
  resolvePhaseOneMarketChartOverlayLines,
  resolvePhaseOneMarketChartSurfaceMarkers,
  resolvePhaseOneMarketChartReadoutMode,
  resolvePhaseOneMarketChartVirtualRange,
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

  it("normalizes integrated terminal layout options independently from chart data", () => {
    expect(normalizePhaseOneMarketChartSurfaceLayout()).toEqual({
      chrome: "card",
      density: "default",
      readoutPosition: "bottom",
      rightDockMode: "none",
    });

    expect(
      normalizePhaseOneMarketChartSurfaceLayout({
        chrome: "integrated",
        density: "compact",
        readoutPosition: "top",
        rightDockMode: "inline",
      }),
    ).toEqual({
      chrome: "integrated",
      density: "compact",
      readoutPosition: "top",
      rightDockMode: "inline",
    });
  });

  it("defaults legacy market chart models to candlestick mode", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "5m",
      bars: [{ time: 1, open: 3700, high: 3710, low: 3690, close: 3708 }],
    };

    expect(resolvePhaseOneMarketChartDisplayMode(model)).toBe("candlestick");
    expect(resolvePhaseOneMarketChartReadoutMode(model)).toBe("ohlc");
    expect(resolvePhaseOneMarketChartActiveDataLength(model)).toBe(1);
  });

  it("allows hosts to provide a product-specific price formatter", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "Tick",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: {
        points: [{ time: 1, price: 1804 }],
      },
      priceFormatter: (value) => value.toFixed(0),
    };

    expect(model.priceFormatter?.(1_829.67)).toBe("1830");
  });

  it("allows hosts to override the visible price range", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "Tick",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: {
        points: [{ time: 1, price: 1804 }],
      },
      visiblePriceRange: { minValue: 1798, maxValue: 1810 },
    };

    expect(model.visiblePriceRange).toEqual({ minValue: 1798, maxValue: 1810 });
  });

  it("exposes host-provided trade markers for the primary price series", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "Tick",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: {
        points: [{ time: 1, price: 1804 }],
      },
      markers: [
        {
          time: 1,
          position: "belowBar",
          shape: "arrowUp",
          color: "#0f9f6e",
          text: "开多 1804",
        },
      ],
    };

    expect(resolvePhaseOneMarketChartSurfaceMarkers(model)).toEqual(model.markers);
  });

  it("resolves multi-overlay lines while preserving the legacy overlay field", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "5m",
      bars: [{ time: 1, open: 3700, high: 3710, low: 3690, close: 3708 }],
      overlayLine: [{ time: 1, value: 3705 }],
      overlayLines: [
        {
          id: "short1",
          label: "Short 1",
          color: "#2563eb",
          lineWidth: 1,
          data: [{ time: 1, value: 3707 }],
        },
        {
          id: "long2",
          label: "Long 2",
          color: "#7c3aed",
          lineWidth: 2,
          data: [{ time: 1, value: 3698 }],
        },
      ],
    };

    expect(resolvePhaseOneMarketChartOverlayLines(model)).toEqual([
      {
        id: "overlay",
        label: "Overlay",
        color: "#0f5964",
        lineWidth: 2,
        data: [{ time: 1, value: 3705 }],
      },
      ...model.overlayLines!,
    ]);
  });

  it("does not duplicate the legacy overlay when a host already owns the overlay id", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "5m",
      bars: [{ time: 1, open: 3700, high: 3710, low: 3690, close: 3708 }],
      overlayLine: [{ time: 1, value: 3705 }],
      overlayLines: [
        {
          id: "overlay",
          label: "Host Overlay",
          data: [{ time: 1, value: 3711 }],
        },
      ],
    };

    expect(resolvePhaseOneMarketChartOverlayLines(model)).toEqual(model.overlayLines);
  });

  it("resolves intraday-timeshare models from timeshare points instead of bars", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "分时",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: {
        points: [
          { time: 1, price: 3710, averagePrice: 3708, volume: 40 },
          { time: 2, price: 3718, averagePrice: 3711, volume: 58 },
        ],
        previousClose: 3700,
        sessionLabel: "day",
      },
    };

    expect(resolvePhaseOneMarketChartReadoutMode(model)).toBe("timeshare");
    expect(resolvePhaseOneMarketChartActiveDataLength(model)).toBe(2);
  });

  it("keeps intraday-timeshare volume optional so live ticks can arrive before volume", () => {
    const model: PhaseOneMarketChartSurfaceModel = {
      symbol: "rb2605",
      timeframeLabel: "分时",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: {
        points: [{ time: 1, price: 3718, averagePrice: 3711 }],
        previousClose: 3700,
      },
    };

    expect(resolvePhaseOneMarketChartActiveDataLength(model)).toBe(1);
    expect(resolvePhaseOneMarketChartReadoutMode(model)).toBe("timeshare");
  });

  it("resolves virtual range edge pressure for host-side lazy loading", () => {
    expect(
      resolvePhaseOneMarketChartVirtualRange(
        { from: 92.4, to: 105.1 },
        108,
        { enabled: true, edgeThreshold: 8 },
      ),
    ).toEqual({
      from: 92.4,
      to: 105.1,
      dataLength: 108,
      visibleCount: 14,
      nearStart: false,
      nearEnd: true,
    });

    expect(
      resolvePhaseOneMarketChartVirtualRange(
        { from: 3, to: 46 },
        108,
        { enabled: true, edgeThreshold: 8 },
      )?.nearStart,
    ).toBe(true);
    expect(resolvePhaseOneMarketChartVirtualRange({ from: 0, to: 10 }, 20, { enabled: false })).toBeNull();
  });
});
