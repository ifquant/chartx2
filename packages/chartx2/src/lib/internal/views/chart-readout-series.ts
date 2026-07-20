import { findNearestRowByLogical, TimeScale, type PlotRow } from "../model";
import type {
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineSeriesOptions,
  PhaseOneReadoutSeriesDetail,
  PhaseOneVolumeSeriesOptions,
} from "./chart-api-types";

type PanePoint = {
  x: number;
  y: number;
};

type RowSet = readonly PlotRow<number>[];

type ReadoutSeriesState = {
  id: string;
  label: string;
  kind: string;
  data: readonly PhaseOneCandlestickData[];
  options: unknown;
  visuals: Map<number, { color?: string; isUp: boolean }>;
  store: {
    setData(data: readonly PhaseOneCandlestickData[]): RowSet;
  };
};

export function buildReadoutSeriesForPrimary<
  State extends ReadoutSeriesState,
>(
  primarySources: readonly State[],
  rowSets: ReadonlyMap<string, RowSet>,
  crosshair: PanePoint | null,
  deps: {
    timeScale: TimeScale;
    formatValue(state: State, value: number | null): string;
  },
): readonly PhaseOneReadoutSeriesDetail[] {
  return primarySources.flatMap((source) => {
    const rows = rowSets.get(source.id);
    if (rows === undefined) {
      return [];
    }
    const value = resolveSeriesReadoutValue(rows, crosshair, deps.timeScale);
    return [{
      id: source.id,
      label: source.label,
      kind: source.kind,
      value,
      formattedValue: deps.formatValue(source, value),
      color: resolveSeriesColor(source),
    }];
  });
}

export function buildReadoutSeriesForPane<
  State extends ReadoutSeriesState,
>(
  paneSeries: readonly State[],
  rowSets: ReadonlyMap<string, RowSet>,
  crosshair: PanePoint | null,
  deps: {
    timeScale: TimeScale;
    formatValue(state: State, value: number | null): string;
  },
): readonly PhaseOneReadoutSeriesDetail[] {
  return paneSeries.map((state) => {
    const rows = rowSets.get(state.id) ?? state.store.setData(state.data);
    const value = resolveSeriesReadoutValue(rows, crosshair, deps.timeScale);
    return {
      id: state.id,
      label: state.label,
      kind: state.kind,
      value,
      formattedValue: deps.formatValue(state, value),
      color: resolveSeriesColor(state),
    };
  });
}

function resolveSeriesReadoutValue(
  rows: RowSet,
  crosshair: PanePoint | null,
  timeScale: TimeScale,
): number | null {
  if (rows.length === 0) {
    return null;
  }

  if (crosshair === null) {
    return rows[rows.length - 1]?.value[3] ?? null;
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = findNearestRowByLogical(rows, logical);
  return row?.value[3] ?? null;
}

function resolveSeriesColor(state: ReadoutSeriesState): string {
  const last = state.data[state.data.length - 1];
  switch (state.kind) {
    case "line": {
      const options = state.options as Required<PhaseOneLineSeriesOptions>;
      return options.color;
    }
    case "area": {
      const options = state.options as Required<PhaseOneAreaSeriesOptions>;
      return options.lineColor;
    }
    case "baseline": {
      const options = state.options as Required<PhaseOneBaselineSeriesOptions>;
      return last !== undefined && last.close >= options.baseValue
        ? options.topLineColor
        : options.bottomLineColor;
    }
    case "bar": {
      const options = state.options as Required<PhaseOneBarSeriesOptions>;
      return last !== undefined && last.close >= last.open ? options.upColor : options.downColor;
    }
    case "candlestick": {
      const options = state.options as Required<PhaseOneCandlestickSeriesOptions>;
      return last !== undefined && last.close >= last.open ? options.upColor : options.downColor;
    }
    case "histogram":
    case "volume": {
      const options = state.options as Required<PhaseOneHistogramSeriesOptions | PhaseOneVolumeSeriesOptions>;
      if (last === undefined) {
        return options.upColor;
      }
      const visual = state.visuals.get(last.time);
      return visual?.color ?? (visual?.isUp ?? (last.close >= last.open) ? options.upColor : options.downColor);
    }
    default:
      return "#101010";
  }
}
