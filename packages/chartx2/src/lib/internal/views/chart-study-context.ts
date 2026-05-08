import {
  buildMovingAverageStudyData,
  type MovingAverageIndicatorState,
  type OhlcDataPoint,
  type StudyInputContextState,
  type StudyMergePolicy,
} from "../model";

type StudyDisplayState<Data extends OhlcDataPoint<number>> = {
  studyKind: "series" | "indicator" | "overlay" | "compare";
  inputContext: StudyInputContextState;
  indicator?: MovingAverageIndicatorState;
  inputData: readonly Data[];
  data: readonly Data[];
};

type MainContextBarSequence<Data extends OhlcDataPoint<number>> = {
  kind: "time-based" | "price-based";
  bars: readonly Data[];
};

export function resolveStudyDisplayData(
  state: StudyDisplayState<OhlcDataPoint<number>>,
  deps: {
    contextBarSequence: MainContextBarSequence<OhlcDataPoint<number>>;
    mergeToChartContext(
      inputData: readonly OhlcDataPoint<number>[],
      mergePolicy: StudyMergePolicy,
    ): readonly OhlcDataPoint<number>[];
  },
): readonly OhlcDataPoint<number>[] {
  if (
    state.studyKind === "series" &&
    state.inputContext.mode === "chart-context" &&
    deps.contextBarSequence.kind === "price-based"
  ) {
    return deps.mergeToChartContext(state.inputData, "carry-forward");
  }

  if (state.studyKind === "indicator" && state.indicator?.kind === "moving-average") {
    const input =
      state.inputContext.mode === "requested-context"
        ? deps.mergeToChartContext(state.inputData, state.inputContext.mergePolicy)
        : deps.contextBarSequence.bars;
    return buildMovingAverageStudyData(input, state.indicator.length);
  }

  if (state.inputContext.mode === "requested-context" && state.studyKind === "compare") {
    return deps.mergeToChartContext(state.inputData, state.inputContext.mergePolicy);
  }

  return [...state.inputData];
}

export function syncStudyContextData<
  State extends StudyDisplayState<OhlcDataPoint<number>>,
>(
  states: readonly State[],
  deps: {
    resolveDisplayData(state: State): readonly OhlcDataPoint<number>[];
  },
): void {
  for (const state of states) {
    state.data = deps.resolveDisplayData(state);
  }
}
