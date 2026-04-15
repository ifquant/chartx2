import type { PhaseOneMainStyleSchemaId } from "./main-series-chart-types";

export type RenkoStyleOptionsState = {
  boxSize: number | null;
  boxSizeMode: "auto" | "fixed";
};

export type LineBreakStyleOptionsState = {
  lineCount: number;
};

export type PointFigureStyleOptionsState = {
  boxSize: number | null;
  boxSizeMode: "auto" | "fixed" | "atr" | "percentage" | "traditional";
  boxSizeScale: number;
  reversalBoxes: number;
  atrLength: number;
  percentageValue: number;
};

export type KagiStyleOptionsState = {
  reversalMode: "auto" | "fixed" | "atr" | "percentage";
  reversalSize: number | null;
  reversalScale: number;
  atrLength: number;
  percentageValue: number;
};

export type MainSeriesStyleOptionsTarget = {
  lineBreakOptions: LineBreakStyleOptionsState;
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
  kagiOptions: KagiStyleOptionsState;
};

export type MainSeriesStyleOptionsPatch = {
  lineBreakCount?: number;
  renkoBoxSize?: number | null;
  renkoBoxSizeMode?: "auto" | "fixed";
  pointFigureBoxSize?: number | null;
  pointFigureBoxSizeMode?: "auto" | "fixed" | "atr" | "percentage" | "traditional";
  pointFigureBoxSizeScale?: number;
  pointFigureReversalBoxes?: number;
  pointFigureAtrLength?: number;
  pointFigurePercentageValue?: number;
  kagiReversalMode?: "auto" | "fixed" | "atr" | "percentage";
  kagiReversalSize?: number | null;
  kagiReversalScale?: number;
  kagiAtrLength?: number;
  kagiPercentageValue?: number;
};

type MainSeriesStyleOptionApplier = (
  target: MainSeriesStyleOptionsTarget,
  patch: MainSeriesStyleOptionsPatch,
) => boolean;

export const MAIN_SERIES_STYLE_OPTION_APPLIERS: Partial<
  Record<PhaseOneMainStyleSchemaId, MainSeriesStyleOptionApplier>
> = {
  lineBreakStyle: (target, patch) => {
    let changed = false;
    if (patch.lineBreakCount !== undefined) {
      target.lineBreakOptions.lineCount = Math.max(1, Math.floor(patch.lineBreakCount));
      changed = true;
    }
    return changed;
  },
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
  kagiStyle: (target, patch) => {
    let changed = false;
    if (patch.kagiReversalMode !== undefined) {
      target.kagiOptions.reversalMode = patch.kagiReversalMode;
      changed = true;
    }
    if (patch.kagiReversalSize !== undefined) {
      target.kagiOptions.reversalSize =
        patch.kagiReversalSize !== null && patch.kagiReversalSize > 0 ? patch.kagiReversalSize : null;
      changed = true;
    }
    if (patch.kagiReversalScale !== undefined) {
      target.kagiOptions.reversalScale = Math.min(4, Math.max(0.25, patch.kagiReversalScale));
      changed = true;
    }
    if (patch.kagiAtrLength !== undefined) {
      target.kagiOptions.atrLength = Math.max(2, Math.floor(patch.kagiAtrLength));
      changed = true;
    }
    if (patch.kagiPercentageValue !== undefined) {
      target.kagiOptions.percentageValue = Math.min(25, Math.max(0.1, patch.kagiPercentageValue));
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
    if (patch.pointFigureAtrLength !== undefined) {
      target.pointFigureOptions.atrLength = Math.max(2, Math.floor(patch.pointFigureAtrLength));
      changed = true;
    }
    if (patch.pointFigurePercentageValue !== undefined) {
      target.pointFigureOptions.percentageValue = Math.min(25, Math.max(0.1, patch.pointFigurePercentageValue));
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
