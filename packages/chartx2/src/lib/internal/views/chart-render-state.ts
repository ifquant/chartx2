import {
  type ChartBarSequence,
  type PaneFrame,
  type PaneModelState,
  type PlotRow,
} from "../model";
import { createChartPaneLayoutOwner } from "./chart-pane-layout-owner";

type PanePoint = {
  x: number;
  y: number;
};

type RowSet = readonly PlotRow<number>[];

type StudySourceState = {
  id: string;
  paneId: string;
  data: unknown;
  store: {
    setData(data: unknown): RowSet;
  };
};

export function projectRowsToTimeAxis(
  rows: RowSet,
  timeAxisRows: readonly PlotRow<number>[],
): RowSet {
  if (rows.length === 0 || timeAxisRows.length === 0) {
    return rows;
  }

  const indexByTime = new Map(timeAxisRows.map((row) => [row.time, row.index] as const));
  const projected: PlotRow<number>[] = [];

  for (const row of rows) {
    const axisIndex = indexByTime.get(row.time);
    if (axisIndex === undefined) {
      // Studies can include warm-up or stale points outside the loaded primary
      // window. Those points have no valid logical coordinate in this chart and
      // must not force the remaining rows back onto study-local indices.
      continue;
    }
    projected.push({
      ...row,
      index: axisIndex,
    });
  }

  return projected;
}

export type ChartRenderState<PrimarySource, StudySource extends StudySourceState> = {
  primaryRows: readonly PlotRow<number>[];
  primaryTimeAxisRows: readonly PlotRow<number>[];
  primaryStudies: readonly StudySource[];
  primarySources: readonly PrimarySource[];
  primaryRowSets: ReadonlyMap<string, RowSet>;
  secondaryRows: ReadonlyMap<string, RowSet>;
  pointCount: number;
  paneFrames: readonly PaneFrame[];
  activePane: PaneFrame | null;
  barWidth: number;
};

export function buildChartRenderState<
  PrimarySource,
  StudySource extends StudySourceState,
>(params: {
  paneSpecs: readonly PaneModelState[];
  plotHeight: number;
  paneGap: number;
  paneWidth: number;
  crosshair: PanePoint | null;
  mainSourceId: string | null;
  mainSequence: ChartBarSequence<number>;
  primaryStudies: readonly StudySource[];
  primarySources: readonly PrimarySource[];
  studySources: readonly StudySource[];
}): ChartRenderState<PrimarySource, StudySource> {
  const primaryRowSets = new Map<string, RowSet>();
  if (params.mainSourceId !== null) {
    primaryRowSets.set(params.mainSourceId, params.mainSequence.bars);
  }
  for (const state of params.primaryStudies) {
    primaryRowSets.set(
      state.id,
      projectRowsToTimeAxis(state.store.setData(state.data), params.mainSequence.axisBars),
    );
  }

  const secondaryRows = new Map<string, RowSet>();
  let pointCount = params.mainSequence.logicalLength;
  for (const state of params.studySources) {
    const rows = state.paneId === "primary"
      ? (primaryRowSets.get(state.id) ?? state.store.setData(state.data))
      : state.store.setData(state.data);
    const projectedRows = projectRowsToTimeAxis(rows, params.mainSequence.axisBars);
    secondaryRows.set(state.id, projectedRows);
    const rowLogicalLength =
      projectedRows.length === 0 ? 0 : Math.ceil(projectedRows[projectedRows.length - 1]?.index ?? 0) + 1;
    pointCount = Math.max(pointCount, rowLogicalLength);
  }

  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => params.paneSpecs,
    paneGap: params.paneGap,
  });
  const paneFrames = paneLayoutOwner.paneFrames(params.plotHeight);
  const activePane = paneLayoutOwner.resolveActivePane(params.crosshair, params.plotHeight, paneFrames);
  const barWidth = params.paneWidth / Math.max(pointCount * 1.8, 24);

  return {
    primaryRows: params.mainSequence.bars,
    primaryTimeAxisRows: params.mainSequence.axisBars,
    primaryStudies: params.primaryStudies,
    primarySources: params.primarySources,
    primaryRowSets,
    secondaryRows,
    pointCount,
    paneFrames,
    activePane,
    barWidth,
  };
}
