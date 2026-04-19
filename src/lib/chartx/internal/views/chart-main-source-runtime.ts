import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  createTimeBasedChartBarSequence,
  resolveTradeLocationState,
} from "../model";
import type {
  ChartBarSequence,
  PhaseOneMainChartType,
  PhaseOneMainSeriesBuilder,
  PhaseOneResolvedTradeOverlayOptions,
  PhaseOneTradeLocationRequest,
  PhaseOneTradeLocationState,
} from "../model";

type MainSourceLike = {
  id: string;
  chartType: PhaseOneMainChartType;
  inputData: readonly {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  data: readonly any[];
  builder: PhaseOneMainSeriesBuilder;
  lineBreakOptions: { lineCount: number };
  renkoOptions: {
    boxSize: number | null;
    boxSizeMode: "auto" | "fixed";
  };
  pointFigureOptions: {
    boxSize: number | null;
    boxSizeMode: "auto" | "fixed" | "atr" | "percentage" | "traditional";
    boxSizeScale: number;
    reversalBoxes: number;
    atrLength: number;
    percentageValue: number;
  };
  kagiOptions: {
    reversalMode: "auto" | "fixed" | "atr" | "percentage";
    reversalSize: number | null;
    reversalScale: number;
    atrLength: number;
    percentageValue: number;
  };
  store: {
    setData(data: readonly any[]): readonly any[];
  };
};

type ActiveTradeLocation = {
  request: PhaseOneTradeLocationRequest;
  options: PhaseOneResolvedTradeOverlayOptions;
  state: PhaseOneTradeLocationState | null;
};

export function createMainBarSequenceFromSource(
  source: MainSourceLike,
): ChartBarSequence<number> {
  const rows = source.store.setData(source.data) as any;
  if (source.builder === "point-figure") {
    return createDirectionColumnPriceBasedChartBarSequence(rows);
  }

  if (
    source.builder === "line-break" ||
    source.builder === "renko" ||
    source.builder === "kagi"
  ) {
    return createCompressedPriceBasedChartBarSequence(rows);
  }

  return createTimeBasedChartBarSequence(rows);
}

export function getMainSource<Source>(
  deps: {
    mainSourceId(): string | null;
    getSourceByIdAndRole(id: string, role: "main-series"): Source | undefined;
  },
): Source | null {
  const mainSourceId = deps.mainSourceId();
  return mainSourceId === null
    ? null
    : (deps.getSourceByIdAndRole(mainSourceId, "main-series") ?? null);
}

export function getMainSourceOrThrow<Source>(
  deps: {
    getMainSource(): Source | null;
  },
): Source {
  const source = deps.getMainSource();
  if (source === null) {
    throw new Error("chartx phase-one chart requires a primary series before this operation");
  }
  return source;
}

export function syncChartContextFromMainSource<Source extends MainSourceLike>(
  source: Source | null,
  deps: {
    clearMainSource(): void;
    bindMainSource(mainSourceId: string, chartType: PhaseOneMainChartType, barSequence: ChartBarSequence<number>): void;
    createMainBarSequenceFromSource(source: Source): ChartBarSequence<number>;
    syncStudyContextData(): void;
    refreshTradeLocation(): void;
  },
): void {
  if (source === null) {
    deps.clearMainSource();
    deps.syncStudyContextData();
    deps.refreshTradeLocation();
    return;
  }

  deps.bindMainSource(
    source.id,
    source.chartType,
    deps.createMainBarSequenceFromSource(source),
  );
  deps.syncStudyContextData();
  deps.refreshTradeLocation();
}

export function refreshTradeLocation(
  activeTradeLocation: ActiveTradeLocation | null,
  deps: {
      getMainSource(): MainSourceLike | null;
      setActiveTradeLocation(next: ActiveTradeLocation): void;
      setVisibleLogicalRange(range: { from: number; to: number }): void;
      setVisiblePriceRange(range: { minValue: number; maxValue: number }): void;
      render(): void;
    },
): void {
  if (activeTradeLocation === null) {
    return;
  }

  const source = deps.getMainSource();
  const state =
    source === null
      ? null
      : resolveTradeLocationState(
          activeTradeLocation.request,
          {
            chartType: source.chartType,
            inputData: source.inputData,
            lineBreakOptions: source.lineBreakOptions,
            renkoOptions: source.renkoOptions,
            pointFigureOptions: source.pointFigureOptions,
            kagiOptions: source.kagiOptions,
          },
          activeTradeLocation.options,
        );
  const next = {
    ...activeTradeLocation,
    state,
  };
  deps.setActiveTradeLocation(next);

  if (next.options.fitRange && state !== null) {
    deps.setVisibleLogicalRange(state.logicalRange);
    deps.setVisiblePriceRange(state.priceRange);
    return;
  }

  deps.render();
}
