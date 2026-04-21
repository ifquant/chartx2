import type {
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOnePaneApi,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
  PhaseOneSeriesTarget,
  PhaseOneVolumeSeriesTarget,
} from "./chart-api-types";

type ResolvedSeriesTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
};

export function resolveSeriesTarget(
  target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
  options: { defaultToSecondary: boolean; allowPrimary: boolean },
  deps: {
    listPanes(): readonly PaneLike[];
    getPaneByIndex(index: number): PaneLike | undefined;
    getPaneByHandle(handle: PhaseOnePaneApi): PaneLike | undefined;
    addPane(): PhaseOnePaneApi;
    getPaneId(handle: PhaseOnePaneApi): string | undefined;
  },
): ResolvedSeriesTarget {
  if (target?.pane === undefined) {
    if (!options.defaultToSecondary) {
      return { kind: "primary" };
    }

    const existing = deps.listPanes().find((pane) => pane.kind === "secondary")?.id;
    if (existing !== undefined) {
      return { kind: "secondary", paneId: existing };
    }

    const pane = deps.addPane();
    const paneId = deps.getPaneId(pane);
    if (paneId === undefined) {
      throw new Error("chartx phase-one chart failed to create a secondary pane");
    }
    return { kind: "secondary", paneId };
  }

  const pane =
    typeof target.pane === "number"
      ? deps.getPaneByIndex(target.pane)
      : deps.getPaneByHandle(target.pane);
  if (pane === undefined) {
    throw new Error("chartx phase-one chart series pane index is out of range");
  }

  if (pane.kind === "primary") {
    if (!options.allowPrimary) {
      throw new Error("chartx phase-one chart targeted series requires a secondary pane");
    }
    return { kind: "primary" };
  }
  return { kind: "secondary", paneId: pane.id };
}

export function addTargetedSeries<TSeries>(
  target: PhaseOneSeriesTarget | undefined,
  deps: {
    resolveTarget(
      target: PhaseOneSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedSeriesTarget;
    addPrimary(): TSeries;
    addSecondary(paneId: string): TSeries;
  },
): TSeries {
  const resolved = deps.resolveTarget(target, { defaultToSecondary: false, allowPrimary: true });
  if (resolved.kind === "primary") {
    return deps.addPrimary();
  }
  return deps.addSecondary(resolved.paneId);
}

export function addVolumeSeriesCommand<TSeries>(
  target: PhaseOneVolumeSeriesTarget | undefined,
  deps: {
    resolveTarget(
      target: PhaseOneVolumeSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedSeriesTarget;
    addSecondary(paneId: string): TSeries;
  },
): TSeries {
  const resolved = deps.resolveTarget(target, { defaultToSecondary: true, allowPrimary: false });
  if (resolved.kind === "primary") {
    throw new Error("chartx phase-one chart volume series requires a secondary pane");
  }
  return deps.addSecondary(resolved.paneId);
}

export function addTargetedStudy<TStudy>(
  target: PhaseOneSeriesTarget | undefined,
  deps: {
    resolveTarget(
      target: PhaseOneSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedSeriesTarget;
    addToPane(paneId: string): TStudy;
  },
  options: { defaultToSecondary: boolean; allowPrimary: boolean },
): TStudy {
  const resolved = deps.resolveTarget(target, options);
  return deps.addToPane(resolved.kind === "primary" ? "primary" : resolved.paneId);
}

export function addHorizontalLineDrawingCommand(
  target: PhaseOneSeriesTarget | undefined,
  options: PhaseOneHorizontalLineDrawingOptions,
  deps: {
    resolveTarget(
      target: PhaseOneSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedSeriesTarget;
    createDrawing(paneId: string, options: PhaseOneHorizontalLineDrawingOptions): PhaseOneHorizontalLineDrawingApi;
  },
): PhaseOneHorizontalLineDrawingApi {
  const resolved = deps.resolveTarget(target, { defaultToSecondary: false, allowPrimary: true });
  return deps.createDrawing(resolved.kind === "primary" ? "primary" : resolved.paneId, options);
}

export function addTrendLineDrawingCommand(
  target: PhaseOneSeriesTarget | undefined,
  options: PhaseOneTrendLineDrawingOptions,
  deps: {
    resolveTarget(
      target: PhaseOneSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedSeriesTarget;
    createDrawing(paneId: string, options: PhaseOneTrendLineDrawingOptions): PhaseOneTrendLineDrawingApi;
  },
): PhaseOneTrendLineDrawingApi {
  const resolved = deps.resolveTarget(target, { defaultToSecondary: false, allowPrimary: true });
  return deps.createDrawing(resolved.kind === "primary" ? "primary" : resolved.paneId, options);
}
