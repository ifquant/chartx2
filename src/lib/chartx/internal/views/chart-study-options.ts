import type { MovingAverageIndicatorState, StudyInputContextState } from "../model";
import type {
  PhaseOneCompareSeriesOptions,
  PhaseOneMovingAverageStudyOptions,
} from "./chart-api-types";

type CompareStudyState = {
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
  inputContext: StudyInputContextState;
  data: readonly unknown[];
};

type MovingAverageStudyState = {
  indicator?: MovingAverageIndicatorState;
  inputContext: StudyInputContextState;
  data: readonly unknown[];
};

function movingAverageLength(indicator: MovingAverageIndicatorState | undefined): number | null {
  return indicator?.kind === "moving-average" ? indicator.length : null;
}

export function applyCompareStudyOptions(
  state: CompareStudyState,
  options: PhaseOneCompareSeriesOptions,
  deps: {
    defaultCompareOptions: Required<PhaseOneCompareSeriesOptions>;
    resolveDisplayData(state: CompareStudyState): readonly unknown[];
    render(): void;
  },
): void {
  if (options.affectMainScale !== undefined) {
    state.compareOptions = {
      ...(state.compareOptions ?? deps.defaultCompareOptions),
      affectMainScale: options.affectMainScale,
    };
  }

  state.inputContext = {
    ...state.inputContext,
    mode: options.inputContextMode ?? state.inputContext.mode,
    symbol:
      options.requestedSymbol !== undefined
        ? options.requestedSymbol
        : state.inputContext.symbol,
    resolution:
      options.requestedResolution !== undefined
        ? options.requestedResolution
        : state.inputContext.resolution,
    session:
      options.requestedSession !== undefined
        ? options.requestedSession
        : state.inputContext.session,
    timezone:
      options.requestedTimezone !== undefined
        ? options.requestedTimezone
        : state.inputContext.timezone,
    mergePolicy: options.mergePolicy ?? state.inputContext.mergePolicy,
  } satisfies StudyInputContextState;

  state.data = deps.resolveDisplayData(state);
  deps.render();
}

export function getCompareStudyOptions(
  state: CompareStudyState,
  defaultCompareOptions: Required<PhaseOneCompareSeriesOptions>,
): Required<PhaseOneCompareSeriesOptions> {
  return {
    ...(state.compareOptions ?? defaultCompareOptions),
    inputContextMode: state.inputContext.mode,
    requestedSymbol: state.inputContext.symbol,
    requestedResolution: state.inputContext.resolution,
    requestedSession: state.inputContext.session,
    requestedTimezone: state.inputContext.timezone,
    mergePolicy: state.inputContext.mergePolicy,
  };
}

export function applyMovingAverageStudyOptions(
  state: MovingAverageStudyState,
  options: PhaseOneMovingAverageStudyOptions,
  deps: {
    defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions>;
    resolveDisplayData(state: MovingAverageStudyState): readonly unknown[];
    render(): void;
  },
): void {
  state.indicator = {
    kind: "moving-average",
    length: Math.max(
      1,
      options.length ?? movingAverageLength(state.indicator) ?? deps.defaultMovingAverageOptions.length,
    ),
  };

  state.inputContext = {
    ...state.inputContext,
    mode: options.inputContextMode ?? state.inputContext.mode,
    symbol:
      options.requestedSymbol !== undefined ? options.requestedSymbol : state.inputContext.symbol,
    resolution:
      options.requestedResolution !== undefined ? options.requestedResolution : state.inputContext.resolution,
    session:
      options.requestedSession !== undefined ? options.requestedSession : state.inputContext.session,
    timezone:
      options.requestedTimezone !== undefined ? options.requestedTimezone : state.inputContext.timezone,
    mergePolicy: options.mergePolicy ?? state.inputContext.mergePolicy,
  };

  state.data = deps.resolveDisplayData(state);
  deps.render();
}

export function getMovingAverageStudyOptions(
  state: MovingAverageStudyState,
  defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions>,
): Required<PhaseOneMovingAverageStudyOptions> {
  return {
    length: movingAverageLength(state.indicator) ?? defaultMovingAverageOptions.length,
    inputContextMode: state.inputContext.mode,
    requestedSymbol: state.inputContext.symbol,
    requestedResolution: state.inputContext.resolution,
    requestedSession: state.inputContext.session,
    requestedTimezone: state.inputContext.timezone,
    mergePolicy: state.inputContext.mergePolicy,
  };
}
