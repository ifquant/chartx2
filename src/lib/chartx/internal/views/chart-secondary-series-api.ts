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
  PhaseOneCompareSeriesApi,
  PhaseOneCompareSeriesOptions,
  PhaseOneHistogramData,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineData,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOneMovingAverageStudyApi,
  PhaseOneMovingAverageStudyOptions,
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
  PhaseOneSeriesMarker,
  PhaseOneVolumeData,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesOptions,
} from "./chart-api-types";

type SecondarySeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

type SecondarySourceState<Options = unknown> = {
  options: Options;
  priceLines: Map<string, unknown>;
};

type SecondaryStudyState = SecondarySourceState & {
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
  inputContext: {
    mode: "chart-context" | "requested-context";
    symbol: string | null;
    resolution: string | null;
    session: string | null;
    timezone: string | null;
    mergePolicy: "carry-forward" | "gaps" | "exact";
  };
  indicator?: { kind: "moving-average"; length: number };
};

type SecondarySeriesApiDeps = {
  assertSeriesActive(api: unknown): void;
  getSource(api: unknown, kind: SecondarySeriesKind): SecondarySourceState;
  applySeriesFormatterOptions(seriesOptions: object, options: object): void;
  render(): void;
  setSecondaryData(api: unknown, data: readonly PhaseOneCandlestickData[], kind: SecondarySeriesKind): void;
  updateSecondary(api: unknown, bar: PhaseOneCandlestickData, kind: SecondarySeriesKind): void;
  setSecondaryHistogramLikeData(
    api: unknown,
    data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
    kind: "histogram" | "volume",
  ): void;
  updateSecondaryHistogramLike(
    api: unknown,
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: "histogram" | "volume",
  ): void;
  normalizeLineData(data: readonly PhaseOneLineData[]): readonly PhaseOneCandlestickData[];
  normalizeLineBar(bar: PhaseOneLineData): PhaseOneCandlestickData;
  setMarkers(api: unknown, markers: readonly PhaseOneSeriesMarker[], kind: SecondarySeriesKind): void;
  createPriceLine(api: unknown, kind: SecondarySeriesKind, options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(api: unknown, kind: SecondarySeriesKind, line: PhaseOnePriceLineApi): void;
  applyCompareOptions(api: unknown, options: PhaseOneCompareSeriesOptions): void;
  getCompareOptions(api: unknown): Required<PhaseOneCompareSeriesOptions>;
  applyMovingAverageStudyOptions(api: unknown, options: PhaseOneMovingAverageStudyOptions): void;
  getMovingAverageStudyOptions(api: unknown): Required<PhaseOneMovingAverageStudyOptions>;
};

export function createSecondaryCandlestickSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneCandlestickSeriesApi {
  const api: PhaseOneCandlestickSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryData(api, data, "candlestick");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondary(api, bar, "candlestick");
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

export function createSecondaryLineSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneLineSeriesApi {
  const api: PhaseOneLineSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryData(api, deps.normalizeLineData(data), "line");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondary(api, deps.normalizeLineBar(bar), "line");
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

export function createCompareStudySeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneCompareSeriesApi {
  const lineApi = createSecondaryLineSeriesApi(deps);
  return {
    ...lineApi,
    applyCompareOptions: (options) => {
      deps.assertSeriesActive(lineApi);
      deps.applyCompareOptions(lineApi, options);
    },
    getCompareOptions: () => {
      deps.assertSeriesActive(lineApi);
      return deps.getCompareOptions(lineApi);
    },
  };
}

export function createMovingAverageStudySeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneMovingAverageStudyApi {
  const lineApi = createSecondaryLineSeriesApi(deps);
  return {
    ...lineApi,
    applyStudyOptions: (options) => {
      deps.assertSeriesActive(lineApi);
      deps.applyMovingAverageStudyOptions(lineApi, options);
    },
    getStudyOptions: () => {
      deps.assertSeriesActive(lineApi);
      return deps.getMovingAverageStudyOptions(lineApi);
    },
  };
}

export function createSecondaryAreaSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneAreaSeriesApi {
  const api: PhaseOneAreaSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryData(api, deps.normalizeLineData(data), "area");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondary(api, deps.normalizeLineBar(bar), "area");
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

export function createSecondaryBaselineSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneBaselineSeriesApi {
  const api: PhaseOneBaselineSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryData(api, deps.normalizeLineData(data), "baseline");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondary(api, deps.normalizeLineBar(bar), "baseline");
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

export function createSecondaryBarSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneBarSeriesApi {
  const api: PhaseOneBarSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryData(api, data, "bar");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondary(api, bar, "bar");
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

export function createSecondaryHistogramSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneHistogramSeriesApi {
  const api: PhaseOneHistogramSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryHistogramLikeData(api, data, "histogram");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondaryHistogramLike(api, bar, "histogram");
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

export function createSecondaryVolumeSeriesApi(
  deps: SecondarySeriesApiDeps,
): PhaseOneVolumeSeriesApi {
  const api: PhaseOneVolumeSeriesApi = {
    setData: (data) => {
      deps.assertSeriesActive(api);
      deps.setSecondaryHistogramLikeData(api, data, "volume");
    },
    update: (bar) => {
      deps.assertSeriesActive(api);
      deps.updateSecondaryHistogramLike(api, bar, "volume");
    },
    applyOptions: (options) => {
      deps.assertSeriesActive(api);
      const state = deps.getSource(api, "volume");
      const seriesOptions = state.options as Required<PhaseOneVolumeSeriesOptions>;
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
      deps.setMarkers(api, markers, "volume");
    },
    createPriceLine: (options = {}) => {
      deps.assertSeriesActive(api);
      return deps.createPriceLine(api, "volume", options);
    },
    removePriceLine: (line) => {
      deps.assertSeriesActive(api);
      deps.removePriceLine(api, "volume", line);
    },
  };
  return api;
}
