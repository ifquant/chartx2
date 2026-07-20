import { type PaneFrame, type PlotRow } from "../model";
import { PriceScale, TimeScale } from "../model";
import { buildCrosshairReadout } from "./chart-crosshair-readout";
import { resolveActivePane, resolveLocalPanePoint } from "./chart-layout-geometry";
import { projectRowsToTimeAxis } from "./chart-render-state";
import type {
  PhaseOneCandlestickData,
  PhaseOneReadoutSeriesDetail,
} from "./chart-api-types";

type PanePoint = {
  x: number;
  y: number;
};

type ReadoutBody = {
  active: boolean;
  paneIndex: number | null;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
  series: readonly PhaseOneReadoutSeriesDetail[];
};

type RowSet = readonly PlotRow<number>[];

type PrimaryStudyState = {
  id: string;
  data: readonly PhaseOneCandlestickData[];
  store: {
    setData(data: readonly PhaseOneCandlestickData[]): RowSet;
  };
};

type PaneSeriesState = {
  id: string;
  kind: string;
  priceScale: PriceScale;
  data: readonly PhaseOneCandlestickData[];
  store: {
    setData(data: readonly PhaseOneCandlestickData[]): RowSet;
  };
};

export function buildRawReadout<
  PrimarySource,
  PaneSource extends PaneSeriesState,
>(params: {
  point: PanePoint | null;
  paneFrames: readonly PaneFrame[];
  mainSourceId: string | null;
  primaryRows: RowSet;
  timeAxisRows: RowSet;
  primaryStudies: readonly PrimaryStudyState[];
  primarySources: readonly PrimarySource[];
  timeScale: TimeScale;
  primaryPriceScale: PriceScale;
  getPaneIndex(paneId: string): number;
  getSecondarySeriesForPane(paneId: string): readonly PaneSource[];
  buildReadoutSeriesForPrimary(
    primarySources: readonly PrimarySource[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildReadoutSeriesForPane(
    paneSeries: readonly PaneSource[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
}): ReadoutBody {
  const primaryRowSets = new Map<string, RowSet>();
  if (params.mainSourceId !== null) {
    primaryRowSets.set(params.mainSourceId, params.primaryRows);
  }
  for (const study of params.primaryStudies) {
    primaryRowSets.set(
      study.id,
      projectRowsToTimeAxis(study.store.setData(study.data), params.timeAxisRows),
    );
  }

  const activePane = params.point === null ? null : resolveActivePane(params.paneFrames, params.point.y);
  const logicalPoint = params.point === null ? null : resolveLocalPanePoint(activePane, params.point);
  const activePaneIndex = activePane === null ? null : params.getPaneIndex(activePane.id);

  if (params.primaryRows.length > 0) {
    const baseReadout = buildCrosshairReadout(
      params.primaryRows,
      logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
      params.timeScale,
      params.primaryPriceScale,
    );
    const baseSeries = params.buildReadoutSeriesForPrimary(
      params.primarySources,
      primaryRowSets,
      logicalPoint,
    );

    if (activePane !== null && activePane.kind === "secondary" && logicalPoint !== null) {
      const paneSeries = params.getSecondarySeriesForPane(activePane.id);
      const paneRowSets = buildPaneRowSets(paneSeries, params.timeAxisRows);
      const state = paneSeries[0];
      if (state !== undefined) {
        const paneSeriesReadout = params.buildReadoutSeriesForPane(paneSeries, paneRowSets, logicalPoint);
        if (state.kind === "candlestick" || state.kind === "bar") {
          const rows = paneRowSets.get(state.id) ?? [];
          return {
            ...buildCrosshairReadout(
              rows,
              { x: logicalPoint.x, y: logicalPoint.y },
              params.timeScale,
              state.priceScale,
            ),
            paneIndex: activePaneIndex,
            series: paneSeriesReadout,
          };
        }
        return {
          ...baseReadout,
          paneIndex: activePaneIndex,
          price: state.priceScale.coordinateToPrice(logicalPoint.y),
          series: paneSeriesReadout,
        };
      }
    }

    return {
      ...baseReadout,
      paneIndex: activePaneIndex ?? 0,
      series: baseSeries,
    };
  }

  if (activePane !== null && activePane.kind === "secondary") {
    const paneSeries = params.getSecondarySeriesForPane(activePane.id);
    const paneRowSets = buildPaneRowSets(paneSeries, params.timeAxisRows);
    const state = paneSeries[0];
    if (state !== undefined) {
      const rows = paneRowSets.get(state.id) ?? [];
      return {
        ...buildCrosshairReadout(
          rows,
          logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
          params.timeScale,
          state.priceScale,
        ),
        paneIndex: activePaneIndex,
        series: params.buildReadoutSeriesForPane(paneSeries, paneRowSets, logicalPoint),
      };
    }
  }

  return {
    active: false,
    paneIndex: activePaneIndex,
    time: null,
    open: null,
    high: null,
    low: null,
    close: null,
    price: null,
    series: [],
  };
}

function buildPaneRowSets<PaneSource extends PaneSeriesState>(
  paneSeries: readonly PaneSource[],
  timeAxisRows: RowSet,
): ReadonlyMap<string, RowSet> {
  const rowSets = new Map<string, RowSet>();
  for (const state of paneSeries) {
    rowSets.set(state.id, projectRowsToTimeAxis(state.store.setData(state.data), timeAxisRows));
  }
  return rowSets;
}
