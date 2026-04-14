import type { PhaseOneMainStyleSchemaId } from "./main-series-chart-types";

export type RenkoStyleOptionsState = {
  boxSize: number | null;
  boxSizeMode: "auto" | "fixed";
};

export type PointFigureStyleOptionsState = {
  boxSize: number | null;
  boxSizeMode: "auto" | "fixed";
  boxSizeScale: number;
  reversalBoxes: number;
};

export type MainSeriesStyleOptionsTarget = {
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
};

export type MainSeriesStyleOptionsPatch = {
  renkoBoxSize?: number | null;
  renkoBoxSizeMode?: "auto" | "fixed";
  pointFigureBoxSize?: number | null;
  pointFigureBoxSizeMode?: "auto" | "fixed";
  pointFigureBoxSizeScale?: number;
  pointFigureReversalBoxes?: number;
};

type MainSeriesStyleOptionApplier = (
  target: MainSeriesStyleOptionsTarget,
  patch: MainSeriesStyleOptionsPatch,
) => boolean;

export const MAIN_SERIES_STYLE_OPTION_APPLIERS: Partial<
  Record<PhaseOneMainStyleSchemaId, MainSeriesStyleOptionApplier>
> = {
  renkoStyle: (target, patch) => {
    let changed = false;
    if (patch.renkoBoxSizeMode !== undefined) {
      target.renkoOptions.boxSizeMode = patch.renkoBoxSizeMode;
      changed = true;
    }
    if (patch.renkoBoxSize !== undefined) {
      target.renkoOptions.boxSize =
        patch.renkoBoxSize !== null && patch.renkoBoxSize > 0 ? patch.renkoBoxSize : null;
      changed = true;
    }
    return changed;
  },
  pnfStyle: (target, patch) => {
    let changed = false;
    if (patch.pointFigureBoxSizeMode !== undefined) {
      target.pointFigureOptions.boxSizeMode = patch.pointFigureBoxSizeMode;
      changed = true;
    }
    if (patch.pointFigureBoxSize !== undefined) {
      target.pointFigureOptions.boxSize =
        patch.pointFigureBoxSize !== null && patch.pointFigureBoxSize > 0 ? patch.pointFigureBoxSize : null;
      changed = true;
    }
    if (patch.pointFigureBoxSizeScale !== undefined) {
      target.pointFigureOptions.boxSizeScale = Math.min(4, Math.max(0.25, patch.pointFigureBoxSizeScale));
      changed = true;
    }
    if (patch.pointFigureReversalBoxes !== undefined) {
      target.pointFigureOptions.reversalBoxes = Math.max(1, Math.floor(patch.pointFigureReversalBoxes));
      changed = true;
    }
    return changed;
  },
};

export function applyMainSeriesStyleOptions(
  styleSchemaId: PhaseOneMainStyleSchemaId,
  target: MainSeriesStyleOptionsTarget,
  patch: MainSeriesStyleOptionsPatch,
): boolean {
  const applier = MAIN_SERIES_STYLE_OPTION_APPLIERS[styleSchemaId];
  if (applier === undefined) {
    return false;
  }
  return applier(target, patch);
}
