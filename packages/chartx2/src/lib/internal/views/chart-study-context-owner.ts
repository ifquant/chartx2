import {
  DEFAULT_STUDY_MERGE_ENGINE,
  PlotRowValueIndex,
  type ChartContextState,
  type ChartBarSequence,
  type OhlcDataPoint,
  type PhaseOneMainChartType,
  type PlotRow,
  type StudyMergePolicy,
} from "../model";

import {
  createMainBarSequenceFromSource,
  syncChartContextFromMainSource,
} from "./chart-main-source-runtime";
import {
  resolveStudyDisplayData,
  syncStudyContextData,
} from "./chart-study-context";

type ContextSnapshot = ChartContextState<number, PhaseOneMainChartType>;

type StudyDisplaySource = Parameters<typeof resolveStudyDisplayData>[0];

type MainSourceLike = Parameters<typeof createMainBarSequenceFromSource>[0] & {
  id: string;
  chartType: PhaseOneMainChartType;
};

type StudyMergeEngine = {
  mergeToChartContext(args: {
    inputData: readonly OhlcDataPoint<number>[];
    axisBars: readonly PlotRow<number>[];
    mergePolicy: StudyMergePolicy;
  }): readonly OhlcDataPoint<number>[];
};

function buildContextBars(snapshot: ContextSnapshot): readonly OhlcDataPoint<number>[] {
  return snapshot.barSequence.bars.map((row) => ({
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
  }));
}

export function createChartStudyContextOwner<StudySource extends StudyDisplaySource>(deps: {
  getContextSnapshot(): ContextSnapshot;
  clearMainSource(): void;
  bindMainSource(mainSourceId: string, chartType: PhaseOneMainChartType, barSequence: ChartBarSequence<number>): void;
  listStudySources(): readonly StudySource[];
  refreshTradeLocation(): void;
  mergeEngine?: StudyMergeEngine;
}) {
  const mergeEngine = deps.mergeEngine ?? DEFAULT_STUDY_MERGE_ENGINE;

  const resolveDisplayData = (state: StudySource): readonly OhlcDataPoint<number>[] => {
    const snapshot = deps.getContextSnapshot();
    return resolveStudyDisplayData(state, {
      contextBarSequence: {
        kind: snapshot.barSequence.kind,
        bars: buildContextBars(snapshot),
      },
      mergeToChartContext: (inputData, mergePolicy) =>
        mergeEngine.mergeToChartContext({
          inputData,
          axisBars: snapshot.barSequence.axisBars,
          mergePolicy,
        }),
    });
  };

  const syncStudyData = (): void => {
    syncStudyContextData(deps.listStudySources(), {
      resolveDisplayData,
    });
  };

  const syncMainSource = (source: MainSourceLike | null): void => {
    syncChartContextFromMainSource(source, {
      clearMainSource: deps.clearMainSource,
      bindMainSource: deps.bindMainSource,
      createMainBarSequenceFromSource,
      syncStudyContextData: syncStudyData,
      refreshTradeLocation: deps.refreshTradeLocation,
    });
  };

  return {
    resolveDisplayData,
    syncStudyData,
    syncMainSource,
  };
}
