import type { MainSeriesStyleOptionsPatch, PhaseOneMainChartType } from "../model";
import type {
  PhaseOneAreaSeriesApi,
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesApi,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesApi,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneHistogramData,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineData,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOneMainSeriesApi,
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
  PhaseOneSeriesMarker,
} from "./chart-harness";

type PrimarySeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram";

type PrimarySeriesState<Options = unknown> = {
  role: "main-series" | "study";
  options: Options;
  inputData: readonly unknown[];
  data: readonly unknown[];
  priceLines: Map<string, unknown>;
};

type PrimarySeriesApiDeps = {
  assertSeriesActive(api: PhaseOneMainSeriesApi): void;
  getSource(api: PhaseOneMainSeriesApi, kind: PrimarySeriesKind): PrimarySeriesState;
  applySeriesFormatterOptions(seriesOptions: object, options: object): void;
  applyMainSeriesTypeSpecificOptions(source: PrimarySeriesState, options: MainSeriesStyleOptionsPatch): boolean;
  rebuildMainSource(source: PrimarySeriesState): void;
  render(): void;
  setPrimaryData(data: readonly PhaseOneCandlestickData[]): void;
  updatePrimary(bar: PhaseOneCandlestickData): void;
  setPrimaryHistogramLikeData(data: readonly PhaseOneHistogramData[]): void;
  updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void;
  normalizeLineData(data: readonly PhaseOneLineData[]): readonly PhaseOneCandlestickData[];
  normalizeLineBar(bar: PhaseOneLineData): PhaseOneCandlestickData;
  setMarkers(api: PhaseOneMainSeriesApi, markers: readonly PhaseOneSeriesMarker[], kind: PrimarySeriesKind): void;
  createPriceLine(api: PhaseOneMainSeriesApi, kind: PrimarySeriesKind, options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(api: PhaseOneMainSeriesApi, kind: PrimarySeriesKind, line: PhaseOnePriceLineApi): void;
};

export function createPrimarySeriesApi(
  kind: PhaseOneMainChartType,
  deps: PrimarySeriesApiDeps,
): PhaseOneMainSeriesApi {
  switch (kind) {
    case "candlestick":
    case "line-break":
    case "point-figure":
    case "columns":
    case "volume-candles":
    case "hollow-candles":
    case "hlc-area":
    case "heikin-ashi":
    case "renko":
      return createPrimaryCandlestickSeriesApi(deps);
    case "bar":
    case "hlc-bars":
    case "high-low":
      return createPrimaryBarSeriesApi(deps);
    case "kagi":
    case "line":
    case "line-markers":
    case "stepline":
      return createPrimaryLineSeriesApi(deps);
    case "area":
      return createPrimaryAreaSeriesApi(deps);
    case "baseline":
      return createPrimaryBaselineSeriesApi(deps);
    case "histogram":
      return createPrimaryHistogramSeriesApi(deps);
  }

  throw new Error(`unsupported primary series chart type: ${String(kind)}`);
}

function createPrimaryCandlestickSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneCandlestickSeriesApi {
  const api: PhaseOneCandlestickSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryData(data);
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimary(bar);
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "candlestick");
      const seriesOptions = state.options as Required<PhaseOneCandlestickSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.upColor !== undefined) {
        seriesOptions.upColor = options.upColor;
      }
      if (options.downColor !== undefined) {
        seriesOptions.downColor = options.downColor;
      }
      if (options.wickColor !== undefined) {
        seriesOptions.wickColor = options.wickColor;
      }
      if (state.role === "main-series" && deps.applyMainSeriesTypeSpecificOptions(state, options)) {
        deps.rebuildMainSource(state);
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "candlestick");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "candlestick", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "candlestick", line);
    },
  };
  return api;
}

function createPrimaryLineSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneLineSeriesApi {
  const api: PhaseOneLineSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryData(deps.normalizeLineData(data));
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimary(deps.normalizeLineBar(bar));
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "line");
      const seriesOptions = state.options as Required<PhaseOneLineSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.color !== undefined) {
        seriesOptions.color = options.color;
      }
      if (options.lineWidth !== undefined) {
        seriesOptions.lineWidth = Math.max(1, options.lineWidth);
      }
      if (options.kagiYangColor !== undefined) {
        seriesOptions.kagiYangColor = options.kagiYangColor;
      }
      if (options.kagiYinColor !== undefined) {
        seriesOptions.kagiYinColor = options.kagiYinColor;
      }
      if (options.kagiYangLineWidth !== undefined) {
        seriesOptions.kagiYangLineWidth = Math.max(1, options.kagiYangLineWidth);
      }
      if (options.kagiYinLineWidth !== undefined) {
        seriesOptions.kagiYinLineWidth = Math.max(1, options.kagiYinLineWidth);
      }
      if (state.role === "main-series" && deps.applyMainSeriesTypeSpecificOptions(state, options)) {
        deps.rebuildMainSource(state);
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "line");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "line", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "line", line);
    },
  };
  return api;
}

function createPrimaryAreaSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneAreaSeriesApi {
  const api: PhaseOneAreaSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryData(deps.normalizeLineData(data));
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimary(deps.normalizeLineBar(bar));
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "area");
      const seriesOptions = state.options as Required<PhaseOneAreaSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.lineColor !== undefined) {
        seriesOptions.lineColor = options.lineColor;
      }
      if (options.lineWidth !== undefined) {
        seriesOptions.lineWidth = Math.max(1, options.lineWidth);
      }
      if (options.topColor !== undefined) {
        seriesOptions.topColor = options.topColor;
      }
      if (options.bottomColor !== undefined) {
        seriesOptions.bottomColor = options.bottomColor;
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "area");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "area", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "area", line);
    },
  };
  return api;
}

function createPrimaryBaselineSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneBaselineSeriesApi {
  const api: PhaseOneBaselineSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryData(deps.normalizeLineData(data));
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimary(deps.normalizeLineBar(bar));
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "baseline");
      const seriesOptions = state.options as Required<PhaseOneBaselineSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.baseValue !== undefined) {
        seriesOptions.baseValue = options.baseValue;
      }
      if (options.lineWidth !== undefined) {
        seriesOptions.lineWidth = Math.max(1, options.lineWidth);
      }
      if (options.topLineColor !== undefined) {
        seriesOptions.topLineColor = options.topLineColor;
      }
      if (options.topFillTopColor !== undefined) {
        seriesOptions.topFillTopColor = options.topFillTopColor;
      }
      if (options.topFillBottomColor !== undefined) {
        seriesOptions.topFillBottomColor = options.topFillBottomColor;
      }
      if (options.bottomLineColor !== undefined) {
        seriesOptions.bottomLineColor = options.bottomLineColor;
      }
      if (options.bottomFillTopColor !== undefined) {
        seriesOptions.bottomFillTopColor = options.bottomFillTopColor;
      }
      if (options.bottomFillBottomColor !== undefined) {
        seriesOptions.bottomFillBottomColor = options.bottomFillBottomColor;
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "baseline");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "baseline", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "baseline", line);
    },
  };
  return api;
}

function createPrimaryBarSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneBarSeriesApi {
  const api: PhaseOneBarSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryData(data);
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimary(bar);
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "bar");
      const seriesOptions = state.options as Required<PhaseOneBarSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.upColor !== undefined) {
        seriesOptions.upColor = options.upColor;
      }
      if (options.downColor !== undefined) {
        seriesOptions.downColor = options.downColor;
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "bar");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "bar", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "bar", line);
    },
  };
  return api;
}

function createPrimaryHistogramSeriesApi(
  deps: PrimarySeriesApiDeps,
): PhaseOneHistogramSeriesApi {
  const api: PhaseOneHistogramSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setPrimaryHistogramLikeData(data);
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updatePrimaryHistogramLike(bar);
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "histogram");
      const seriesOptions = state.options as Required<PhaseOneHistogramSeriesOptions>;
      deps.applySeriesFormatterOptions(seriesOptions, options);
      if (options.upColor !== undefined) {
        seriesOptions.upColor = options.upColor;
      }
      if (options.downColor !== undefined) {
        seriesOptions.downColor = options.downColor;
      }
      deps.render();
    },
    setMarkers: (markers) => {
      deps.assertSeriesActive(api);
      deps.setMarkers(api, markers, "histogram");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "histogram", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "histogram", line);
    },
  };
  return api;
}
