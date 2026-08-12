import { describe, expect, it, vi } from "vitest";
import {
  CHARTX_VISUAL_CSS_VARIABLES,
  DEFAULT_CHARTX_VISUAL_THEME,
  createChartxVisualProvider,
  mergeChartxMessages,
  resolveChartxVisualThemeFromStyle,
  serializeChartxVisualThemeStyle,
} from "../../src/lib/visual-theme";
import { PhaseOneChartHarness } from "../../src/lib/internal/views/chart-harness";

describe("chartx2 visual contract", () => {
  it("resolves every role once for a declared revision", () => {
    const getPropertyValue = vi.fn((name: string) => name === CHARTX_VISUAL_CSS_VARIABLES.surface ? " #071018 " : "");
    const theme = resolveChartxVisualThemeFromStyle({ getPropertyValue } as unknown as CSSStyleDeclaration, "dark-7");
    expect(theme.revision).toBe("dark-7");
    expect(theme.colors.surface).toBe("#071018");
    expect(theme.colors.positive).toBe(DEFAULT_CHARTX_VISUAL_THEME.colors.positive);
    expect(getPropertyValue).toHaveBeenCalledTimes(Object.keys(CHARTX_VISUAL_CSS_VARIABLES).length);
  });

  it("merges messages without leaking host implementation terms", () => {
    expect(mergeChartxMessages({ noChartData: "暂无行情" }).noChartData).toBe("暂无行情");
    expect(JSON.stringify(createChartxVisualProvider())).not.toMatch(/host|adapter|fixture|shell/i);
  });

  it("bridges an explicit public theme into DOM CSS variables", () => {
    const css = serializeChartxVisualThemeStyle(DEFAULT_CHARTX_VISUAL_THEME);
    expect(css).toContain(`--chartx-surface-canvas: ${DEFAULT_CHARTX_VISUAL_THEME.colors.surface}`);
    expect(css).toContain(`--chartx-font-ui: ${DEFAULT_CHARTX_VISUAL_THEME.typography.uiFont}`);
    expect(css).toContain(`--chartx-row-height: ${DEFAULT_CHARTX_VISUAL_THEME.metrics.rowHeight}`);
  });

  it("switches every themed renderer input without losing data, ranges, drawings, or explicit overrides", () => {
    const harness = new PhaseOneChartHarness();
    const chart = harness.publicApiSurface();
    const area = chart.addAreaSeries();
    const baseline = chart.addBaselineSeries({ pane: chart.addPane() });
    const explicitSeries = chart.addLineSeries({ pane: chart.addPane() });
    area.setData([{ time: 1, value: 10 }, { time: 2, value: 12 }]);
    baseline.setData([{ time: 1, value: 9 }, { time: 2, value: 11 }]);
    explicitSeries.setData([{ time: 1, value: 7 }, { time: 2, value: 8 }]);
    explicitSeries.applyOptions({ color: "#explicit-series" });
    area.setMarkers([
      { time: 1, text: "default marker" },
      { time: 2, text: "explicit marker", color: "#explicit-marker" },
    ]);
    const themedPriceLine = area.createPriceLine({ price: 11 });
    const explicitPriceLine = area.createPriceLine({ price: 12, color: "#explicit-price" });
    chart.addHorizontalLineDrawing(undefined, { price: 10 });
    chart.addTrendLineDrawing(undefined, { startTime: 1, startPrice: 9, endTime: 2, endPrice: 12 });
    chart.addTrendLineDrawing(undefined, { startTime: 1, startPrice: 8, endTime: 2, endPrice: 11, color: "#explicit-drawing" });
    chart.timeScaleApi().setVisibleLogicalRange({ from: 0, to: 1 });
    chart.priceScaleApi().setVisibleRange({ minValue: 8, maxValue: 13 });

    const before = chart.getChartState();
    const runtime = (harness as unknown as {
      runtime: { listSources(): Array<{ inputData: readonly unknown[]; options: Record<string, unknown>; priceLines: Map<string, { color: string }>; markers: readonly { color: string; usesDefaultColor?: boolean }[] }> };
    }).runtime;
    const dataBefore = runtime.listSources().map((source) => source.inputData);
    const theme = Object.freeze({
      ...DEFAULT_CHARTX_VISUAL_THEME,
      revision: "dark-2",
      colors: Object.freeze({
        ...DEFAULT_CHARTX_VISUAL_THEME.colors,
        surface: "#theme-surface",
        paneSurface: "#theme-pane",
        selection: "#theme-selection",
        crosshair: "#theme-price-line",
        positive: "#theme-positive",
        negative: "#theme-negative",
        primarySeries: "#theme-primary",
        paneLegendBackground: "#theme-legend-bg",
        paneLegendBorder: "#theme-legend-border",
        paneLegendText: "#theme-legend-text",
        magnetTagBackground: "#theme-magnet-bg",
        magnetTagBorder: "#theme-magnet-border",
        magnetTagText: "#theme-magnet-text",
        defaultMarker: "#theme-marker",
      }),
    });
    chart.applyVisualTheme(theme);

    const after = chart.getChartState();
    expect(runtime.listSources().map((source) => source.inputData)).toEqual(dataBefore);
    expect(after.timeScale.visibleLogicalRange).toEqual(before.timeScale.visibleLogicalRange);
    expect(after.priceScale.visibleRange).toEqual(before.priceScale.visibleRange);
    expect(after.drawings).toHaveLength(before.drawings.length);
    const baselineState = after.series.find((series) => series.kind === "baseline");
    const explicitSeriesState = after.series.find((series) => series.kind === "line");
    expect(after.mainSeries?.styleOptions).toMatchObject({ lineColor: "#theme-primary", topColor: "#theme-selection", bottomColor: "#theme-pane" });
    expect(baselineState?.options).toMatchObject({
      topLineColor: "#theme-positive", topFillTopColor: "#theme-selection", topFillBottomColor: "#theme-pane",
      bottomLineColor: "#theme-negative", bottomFillTopColor: "#theme-pane", bottomFillBottomColor: "#theme-selection",
    });
    expect(explicitSeriesState?.options).toMatchObject({ color: "#explicit-series" });
    expect(runtime.listSources().find((source) => source === runtime.listSources()[0])?.markers).toEqual([
      expect.objectContaining({ color: "#theme-marker", usesDefaultColor: true }),
      expect.objectContaining({ color: "#explicit-marker", usesDefaultColor: false }),
    ]);
    expect((harness as unknown as { visualTheme: typeof theme }).visualTheme.colors).toMatchObject({
      paneLegendBackground: "#theme-legend-bg",
      paneLegendBorder: "#theme-legend-border",
      paneLegendText: "#theme-legend-text",
      magnetTagBackground: "#theme-magnet-bg",
      magnetTagBorder: "#theme-magnet-border",
      magnetTagText: "#theme-magnet-text",
    });
    expect(after.drawings.map((drawing) => drawing.options.color)).toEqual([
      "#theme-price-line", "#theme-primary", "#explicit-drawing",
    ]);

    const sources = runtime.listSources();
    const lineColors = Array.from(sources.flatMap((source) => Array.from(source.priceLines.values())), (line) => line.color);
    expect(lineColors).toEqual(["#theme-price-line", "#explicit-price"]);
    // Keep handles alive to prove applyVisualTheme did not replace or remove them.
    expect(themedPriceLine).toBeDefined();
    expect(explicitPriceLine).toBeDefined();
  });
});
