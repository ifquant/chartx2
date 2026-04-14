export type DrawingValidationTarget =
  | {
      kind: "horizontal-line";
      price: number;
      lineWidth: number;
    }
  | {
      kind: "trend-line";
      startTime: number;
      startPrice: number;
      endTime: number;
      endPrice: number;
      lineWidth: number;
    };

type DrawingValidationRule<TKind extends DrawingValidationTarget["kind"]> = (
  target: Extract<DrawingValidationTarget, { kind: TKind }>,
) => void;

type DrawingValidatorRegistry = {
  [TKind in DrawingValidationTarget["kind"]]: DrawingValidationRule<TKind>;
};

export const DRAWING_VALIDATORS: DrawingValidatorRegistry = {
  "horizontal-line": (target) => {
    if (!Number.isFinite(target.price)) {
      throw new Error("chartx phase-one horizontal-line price must be finite");
    }
    if (!Number.isFinite(target.lineWidth) || target.lineWidth < 1) {
      throw new Error("chartx phase-one horizontal-line lineWidth must be at least 1");
    }
  },
  "trend-line": (target) => {
    if (
      !Number.isFinite(target.startTime) ||
      !Number.isFinite(target.startPrice) ||
      !Number.isFinite(target.endTime) ||
      !Number.isFinite(target.endPrice)
    ) {
      throw new Error("chartx phase-one trend-line geometry values must be finite");
    }
    if (!Number.isFinite(target.lineWidth) || target.lineWidth < 1) {
      throw new Error("chartx phase-one trend-line lineWidth must be at least 1");
    }
    if (target.startTime === target.endTime && target.startPrice === target.endPrice) {
      throw new Error("chartx phase-one trend-line endpoints must not overlap");
    }
    if (target.startTime >= target.endTime) {
      throw new Error("chartx phase-one trend-line startTime must be before endTime");
    }
  },
};

export function assertDrawingTargetValid(target: DrawingValidationTarget): void {
  const validator = DRAWING_VALIDATORS[target.kind] as (value: DrawingValidationTarget) => void;
  validator(target);
}
