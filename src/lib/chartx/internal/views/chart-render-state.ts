import {
  buildPaneFrames,
  type ChartBarSequence,
  type PaneFrame,
  type PaneModelState,
  type PlotRow,
} from "../model";
import { resolveActivePane } from "./chart-layout-geometry";

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
    primaryRowSets.set(state.id, state.store.setData(state.data));
  }

  const secondaryRows = new Map<string, RowSet>();
  let pointCount = params.mainSequence.logicalLength;
  for (const state of params.studySources) {
    const rows = state.paneId === "primary"
      ? (primaryRowSets.get(state.id) ?? state.store.setData(state.data))
      : state.store.setData(state.data);
    secondaryRows.set(state.id, rows);
    const rowLogicalLength =
      rows.length === 0 ? 0 : Math.ceil(rows[rows.length - 1]?.index ?? 0) + 1;
    pointCount = Math.max(pointCount, rowLogicalLength);
  }

  const paneFrames = buildPaneFrames(params.paneSpecs, params.plotHeight, params.paneGap);
  const activePane = params.crosshair === null ? null : resolveActivePane(paneFrames, params.crosshair.y);
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
