import type {
  PhaseOneChartStateSnapshot,
  PhaseOneCompareSeriesOptions,
  PhaseOneMovingAverageStudyOptions,
  PhaseOneScriptedStudyOptions,
} from "./chart-api-types";

type SnapshotInputBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type SnapshotVisual = {
  color?: string;
  isUp?: boolean;
};

type SnapshotInputContext = {
  mode: "chart-context" | "requested-context";
  symbol: string | null;
  resolution: string | null;
  session: string | null;
  timezone: string | null;
  mergePolicy: "carry-forward" | "gaps" | "exact";
};

type SnapshotCompareOptions = Required<PhaseOneCompareSeriesOptions>;

type SnapshotIndicator = {
  kind: "moving-average";
  length: number;
} | {
  kind: "scripted-study";
  scriptId: string;
  inputValues?: Readonly<Record<string, number>>;
};

type SnapshotDrawingMagnetOptions = {
  magnetEnabled: boolean;
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetTolerancePx: number;
  magnetSources: {
    open: boolean;
    high: boolean;
    low: boolean;
    close: boolean;
  };
};

type SnapshotHorizontalLineDrawingLike<PaneId> = {
  kind: "horizontal-line";
  paneId: PaneId;
  visible: boolean;
  line: {
    price: number;
    color: string;
    lineWidth: number;
    title: string;
  };
};

type SnapshotTrendLineDrawingLike<PaneId> = {
  kind: "trend-line";
  paneId: PaneId;
  visible: boolean;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
};

export type SnapshotDrawingLike<PaneId> =
  | SnapshotHorizontalLineDrawingLike<PaneId>
  | SnapshotTrendLineDrawingLike<PaneId>;

export type SnapshotStudySourceLike<PaneId> = {
  paneId: PaneId;
  studyKind: "overlay" | "compare" | "indicator" | "series";
  options: unknown;
  inputData: readonly SnapshotInputBar[];
  inputContext: SnapshotInputContext;
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
  indicator?: SnapshotIndicator;
};

export type SnapshotSeriesSourceLike<PaneId> = {
  paneId: PaneId;
  studyKind: "series" | "overlay" | "compare" | "indicator";
  kind: "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram" | "volume";
  options: unknown;
  inputData: readonly SnapshotInputBar[];
  visuals: ReadonlyMap<number, SnapshotVisual>;
};

function sanitizeSeriesOptions(
  kind: SnapshotSeriesSourceLike<unknown>["kind"],
  options: unknown,
): Record<string, unknown> {
  const snapshot = { ...(options as Record<string, unknown>) };

  if (snapshot.valueFormatter === null) {
    delete snapshot.valueFormatter;
  }

  if (kind === "line") {
    delete snapshot.kagiYangColor;
    delete snapshot.kagiYinColor;
    delete snapshot.kagiYangLineWidth;
    delete snapshot.kagiYinLineWidth;
    delete snapshot.kagiReversalMode;
    delete snapshot.kagiReversalSize;
    delete snapshot.kagiReversalScale;
    delete snapshot.kagiAtrLength;
    delete snapshot.kagiPercentageValue;
  }

  return snapshot;
}

export function buildDrawingStateSnapshots<PaneId>(
  drawings: readonly SnapshotDrawingLike<PaneId>[],
  deps: {
    getPaneIndex(paneId: PaneId): number;
    resolveMagnetOptions(drawing: SnapshotDrawingLike<PaneId>): SnapshotDrawingMagnetOptions;
  },
): PhaseOneChartStateSnapshot["drawings"] {
  return drawings.map((drawing) => {
    const magnetOptions = deps.resolveMagnetOptions(drawing);
    const paneIndex = deps.getPaneIndex(drawing.paneId);

    if (drawing.kind === "horizontal-line") {
      return {
        type: "horizontal-line",
        paneIndex,
        options: {
          price: drawing.line.price,
          color: drawing.line.color,
          lineWidth: drawing.line.lineWidth,
          title: drawing.line.title,
          visible: drawing.visible,
          magnetEnabled: magnetOptions.magnetEnabled,
          magnetTolerancePx: magnetOptions.magnetTolerancePx,
          timeMagnetEnabled: magnetOptions.timeMagnetEnabled,
          timeMagnetPolicy: magnetOptions.timeMagnetPolicy,
          timeMagnetTolerancePx: magnetOptions.timeMagnetTolerancePx,
          magnetSources: { ...magnetOptions.magnetSources },
        },
      };
    }

    return {
      type: "trend-line",
      paneIndex,
      options: {
        startTime: drawing.startTime,
        startPrice: drawing.startPrice,
        endTime: drawing.endTime,
        endPrice: drawing.endPrice,
        color: drawing.color,
        lineWidth: drawing.lineWidth,
        visible: drawing.visible,
        magnetEnabled: magnetOptions.magnetEnabled,
        magnetTolerancePx: magnetOptions.magnetTolerancePx,
        timeMagnetEnabled: magnetOptions.timeMagnetEnabled,
        timeMagnetPolicy: magnetOptions.timeMagnetPolicy,
        timeMagnetTolerancePx: magnetOptions.timeMagnetTolerancePx,
        magnetSources: { ...magnetOptions.magnetSources },
      },
    };
  });
}

export function buildStudyStateSnapshots<PaneId>(
  sources: readonly SnapshotStudySourceLike<PaneId>[],
  deps: {
    getPaneIndex(paneId: PaneId): number;
    defaultCompareOptions: SnapshotCompareOptions;
  },
): PhaseOneChartStateSnapshot["studies"] {
  const snapshots: PhaseOneChartStateSnapshot["studies"] = [];

  for (const source of sources) {
    if (source.studyKind === "series") {
      continue;
    }

    const paneIndex = deps.getPaneIndex(source.paneId);
    const seriesOptions = sanitizeSeriesOptions("line", source.options) as never;

    if (source.studyKind === "overlay") {
      snapshots.push({
        type: "overlay",
        paneIndex,
        seriesOptions,
        data: source.inputData.map((item) => ({
          time: item.time,
          value: item.close,
        })),
      });
      continue;
    }

    if (source.studyKind === "compare") {
      snapshots.push({
        type: "compare",
        paneIndex,
        seriesOptions,
        compareOptions: {
          ...(source.compareOptions ?? deps.defaultCompareOptions),
          inputContextMode: source.inputContext.mode,
          requestedSymbol: source.inputContext.symbol,
          requestedResolution: source.inputContext.resolution,
          requestedSession: source.inputContext.session,
          requestedTimezone: source.inputContext.timezone,
          mergePolicy: source.inputContext.mergePolicy,
        },
        data: source.inputData.map((item) => ({
          time: item.time,
          value: item.close,
        })),
      });
      continue;
    }

    if (source.studyKind === "indicator" && source.indicator?.kind === "moving-average") {
      snapshots.push({
        type: "moving-average",
        paneIndex,
        seriesOptions,
        studyOptions: {
          length: source.indicator.length,
          inputContextMode: source.inputContext.mode,
          requestedSymbol: source.inputContext.symbol,
          requestedResolution: source.inputContext.resolution,
          requestedSession: source.inputContext.session,
          requestedTimezone: source.inputContext.timezone,
          mergePolicy: source.inputContext.mergePolicy,
        } satisfies Required<PhaseOneMovingAverageStudyOptions>,
      });
      continue;
    }

    if (source.studyKind === "indicator" && source.indicator?.kind === "scripted-study") {
      snapshots.push({
        type: "scripted-study",
        paneIndex,
        seriesOptions,
        studyOptions: {
          scriptId: source.indicator.scriptId,
          inputValues: { ...(source.indicator.inputValues ?? {}) },
          inputContextMode: source.inputContext.mode,
          requestedSymbol: source.inputContext.symbol,
          requestedResolution: source.inputContext.resolution,
          requestedSession: source.inputContext.session,
          requestedTimezone: source.inputContext.timezone,
          mergePolicy: source.inputContext.mergePolicy,
        } satisfies Required<PhaseOneScriptedStudyOptions>,
      });
    }
  }

  return snapshots;
}

export function buildSeriesStateSnapshots<PaneId>(
  sources: readonly SnapshotSeriesSourceLike<PaneId>[],
  deps: {
    getPaneIndex(paneId: PaneId): number;
  },
): PhaseOneChartStateSnapshot["series"] {
  const snapshots: PhaseOneChartStateSnapshot["series"] = [];

  for (const source of sources) {
    if (source.studyKind !== "series") {
      continue;
    }

    const paneIndex = deps.getPaneIndex(source.paneId);

    if (source.kind === "candlestick" || source.kind === "bar") {
      snapshots.push({
        kind: source.kind,
        paneIndex,
        options: sanitizeSeriesOptions(source.kind, source.options) as never,
        data: [...source.inputData],
      } as PhaseOneChartStateSnapshot["series"][number]);
      continue;
    }

    if (source.kind === "line" || source.kind === "area" || source.kind === "baseline") {
      snapshots.push({
        kind: source.kind,
        paneIndex,
        options: sanitizeSeriesOptions(source.kind, source.options) as never,
        data: source.inputData.map((item) => ({
          time: item.time,
          value: item.close,
        })),
      } as PhaseOneChartStateSnapshot["series"][number]);
      continue;
    }

    if (source.kind === "histogram" || source.kind === "volume") {
      snapshots.push({
        kind: source.kind,
        paneIndex,
        options: sanitizeSeriesOptions(source.kind, source.options) as never,
        data: source.inputData.map((item) => {
          const visual = source.visuals.get(item.time);
          return {
            time: item.time,
            value: item.close,
            ...(visual?.color !== undefined ? { color: visual.color } : {}),
            ...(visual?.isUp !== undefined ? { up: visual.isUp } : {}),
          };
        }),
      });
    }
  }

  return snapshots;
}
