type KindedSource<Kind extends string = string> = {
  kind: Kind;
};

type StudyLike = {
  role: "study";
  studyKind: string;
  indicator?: {
    kind: string;
  };
};

export function getStudySourcesForPane<Source>(
  paneId: string,
  deps: {
    listSourcesByPaneAndRole(paneId: string, role: "study"): readonly Source[];
  },
): Source[] {
  return [...deps.listSourcesByPaneAndRole(paneId, "study")];
}

export function getSecondarySeriesForPane<Source>(
  paneId: string,
  deps: {
    getStudySourcesForPane(paneId: string): Source[];
  },
): Source[] {
  return deps.getStudySourcesForPane(paneId);
}

export function getSourceByApi<Source extends KindedSource<Kind>, Kind extends string>(
  api: unknown,
  deps: {
    getSourceByApiOrThrow(api: unknown, message: string): Source;
  },
  kind?: Kind,
): Source {
  const source = deps.getSourceByApiOrThrow(api, "chartx phase-one series has been removed");
  if (kind !== undefined && source.kind !== kind) {
    throw new Error("chartx phase-one series is attached to an unexpected pane/source kind");
  }
  return source;
}

export function getCompareStudyState<Source extends KindedSource<string> & StudyLike>(
  api: unknown,
  deps: {
    getSourceByApi(api: unknown, kind?: "line"): Source;
  },
): Source {
  const source = deps.getSourceByApi(api, "line");
  if (source.kind !== "line" || source.role !== "study" || source.studyKind !== "compare") {
    throw new Error("chartx phase-one compare api is attached to an unexpected source kind");
  }
  return source;
}

export function getMovingAverageStudyState<Source extends KindedSource<string> & StudyLike>(
  api: unknown,
  deps: {
    getSourceByApi(api: unknown, kind?: "line"): Source;
  },
): Source {
  const source = deps.getSourceByApi(api, "line");
  if (
    source.kind !== "line" ||
    source.role !== "study" ||
    source.studyKind !== "indicator" ||
    source.indicator?.kind !== "moving-average"
  ) {
    throw new Error("chartx phase-one moving average api is attached to an unexpected source kind");
  }
  return source;
}

export function getOrCreateSecondaryPanePriceScale<Scale>(
  paneId: string,
  deps: {
    getOrCreateSecondaryScale(paneId: string): Scale;
  },
): Scale {
  return deps.getOrCreateSecondaryScale(paneId);
}

export function buildPrimaryPaneSeries<MainSource, StudySource>(
  mainSource: MainSource | null,
  deps: {
    getStudySourcesForPane(paneId: string): StudySource[];
  },
): readonly (MainSource | StudySource)[] {
  const studies = deps.getStudySourcesForPane("primary");
  return mainSource === null ? studies : [mainSource, ...studies];
}
