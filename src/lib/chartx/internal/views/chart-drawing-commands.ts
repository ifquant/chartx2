import {
  buildDrawingStateSnapshots,
  type SnapshotDrawingLike,
} from "./chart-state-snapshot-builders";
import type {
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingStateSnapshot,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-harness";

type DrawingLike = SnapshotDrawingLike<string> & {
  id: string;
  api: {
    applyOptions(options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions): void;
  };
};

type DrawingSnapshotDeps<Drawing extends DrawingLike> = {
  getPaneIndex(paneId: Drawing["paneId"]): number;
  resolveMagnetOptions(drawing: Drawing): {
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
};

export function getSelectedDrawingState<Drawing extends DrawingLike>(
  params: {
    selectedDrawingId: string | null;
    getDrawingById(id: string): Drawing | undefined;
    snapshotDeps: DrawingSnapshotDeps<Drawing>;
  },
): PhaseOneDrawingStateSnapshot | null {
  if (params.selectedDrawingId === null) {
    return null;
  }
  const drawing = params.getDrawingById(params.selectedDrawingId);
  if (drawing === undefined) {
    return null;
  }
  return buildDrawingStateSnapshots([drawing], params.snapshotDeps)[0] ?? null;
}

export function getSelectedDrawingPropertySchema(
  snapshot: PhaseOneDrawingStateSnapshot | null,
  resolvePropertySchema: (type: PhaseOneDrawingStateSnapshot["type"]) => PhaseOneDrawingPropertySchema,
): PhaseOneDrawingPropertySchema | null {
  if (snapshot === null) {
    return null;
  }
  return resolvePropertySchema(snapshot.type);
}

export function applySelectedDrawingOptions<Drawing extends DrawingLike>(
  params: {
    selectedDrawingId: string | null;
    getDrawingById(id: string): Drawing | undefined;
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions;
  },
): void {
  if (params.selectedDrawingId === null) {
    throw new Error("chartx phase-one chart has no selected drawing to update");
  }
  const drawing = params.getDrawingById(params.selectedDrawingId);
  if (drawing === undefined) {
    throw new Error("chartx phase-one chart has no selected drawing to update");
  }
  drawing.api.applyOptions(params.options);
}

export function clearSelectedDrawing(
  clearSelection: () => void,
): void {
  clearSelection();
}
