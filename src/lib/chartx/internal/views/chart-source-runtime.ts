import {
  buildPrimaryPaneSeries,
  getCompareStudyState,
  getMovingAverageStudyState,
  getOrCreateSecondaryPanePriceScale,
  getSecondarySeriesForPane,
  getSourceByApi,
  getStudySourcesForPane,
} from "./chart-source-accessors";
import type {
  PhaseOneCompareSeriesApi,
  PhaseOneMovingAverageStudyApi,
} from "./chart-harness";

type SeriesKind = string;

type SeriesSourceLike = {
  kind: SeriesKind;
};

type StudySourceLike = SeriesSourceLike & {
  role: "study";
  studyKind: string;
  indicator?: {
    kind: string;
  };
};

export function getStudySourcesForPaneRuntime<Source extends StudySourceLike>(
  paneId: string,
  deps: {
    listSourcesByPaneAndRole(paneId: string, role: "study"): readonly Source[];
  },
): Source[] {
  return getStudySourcesForPane(paneId, deps);
}

export function getSecondarySeriesForPaneRuntime<Source extends StudySourceLike>(
  paneId: string,
  deps: {
    getStudySourcesForPane(paneId: string): Source[];
  },
): Source[] {
  return getSecondarySeriesForPane(paneId, deps);
}

export function getSourceByApiRuntime<Source extends SeriesSourceLike>(
  api: unknown,
  deps: {
    getSourceByApiOrThrow(api: unknown, message: string): Source;
  },
  kind?: Source["kind"],
): Source {
  return getSourceByApi<Source, Source["kind"]>(api, deps, kind);
}

export function getCompareStudyStateRuntime<Source extends StudySourceLike>(
  api: PhaseOneCompareSeriesApi,
  deps: {
    getSourceByApi(api: unknown, kind?: "line"): Source;
  },
): Source {
  return getCompareStudyState<Source>(api, {
    getSourceByApi: deps.getSourceByApi,
  });
}

export function getMovingAverageStudyStateRuntime<Source extends StudySourceLike>(
  api: PhaseOneMovingAverageStudyApi,
  deps: {
    getSourceByApi(api: unknown, kind?: "line"): Source;
  },
): Source {
  return getMovingAverageStudyState<Source>(api, {
    getSourceByApi: deps.getSourceByApi,
  });
}

export function getOrCreateSecondaryPanePriceScaleRuntime<Scale>(
  paneId: string,
  deps: {
    getOrCreateSecondaryScale(paneId: string): Scale;
  },
): Scale {
  return getOrCreateSecondaryPanePriceScale(paneId, deps);
}

export function buildPrimaryPaneSeriesRuntime<MainSource extends SeriesSourceLike, StudySource extends StudySourceLike>(
  mainSource: MainSource | null,
  deps: {
    getStudySourcesForPane(paneId: string): StudySource[];
  },
): readonly (MainSource | StudySource)[] {
  return buildPrimaryPaneSeries(mainSource, deps);
}
