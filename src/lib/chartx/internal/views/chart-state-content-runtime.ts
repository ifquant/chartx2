type StudyLikeSource = {
  role: string;
  studyKind?: string;
  indicator?: { kind?: string } | null;
};

type DrawingLike<Api = unknown> = {
  api: Api;
};

export function clearRestorableStudies<Source extends StudyLikeSource>(
  deps: {
    removeSourcesWhere(predicate: (source: Source) => boolean): void;
  },
): void {
  deps.removeSourcesWhere((source) =>
    source.role === "study" &&
    (
      source.studyKind === "overlay" ||
      source.studyKind === "compare" ||
      (
        source.studyKind === "indicator" &&
        (
          source.indicator?.kind === "moving-average" ||
          source.indicator?.kind === "scripted-study"
        )
      )
    ));
}

export function clearRestorableSeries<Source extends StudyLikeSource>(
  deps: {
    removeSourcesWhere(predicate: (source: Source) => boolean): void;
  },
): void {
  deps.removeSourcesWhere((source) =>
    source.role === "study" && source.studyKind === "series");
}

export function clearRestorableDrawings<Drawing extends DrawingLike>(
  deps: {
    listDrawings(): readonly Drawing[];
    removeByApi(api: Drawing["api"]): Drawing | undefined;
  },
): void {
  for (const drawing of deps.listDrawings()) {
    deps.removeByApi(drawing.api);
  }
}
