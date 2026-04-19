type DrawingMagnetSources = {
  open: boolean;
  high: boolean;
  low: boolean;
  close: boolean;
};

type DrawingMagnetOverrides = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: Partial<DrawingMagnetSources>;
};

type DrawingMagnetState = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: Partial<DrawingMagnetSources>;
};

export function normalizeDrawingMagnetOverrides(
  options: DrawingMagnetOverrides,
): DrawingMagnetState {
  return {
    magnetEnabled: options.magnetEnabled,
    magnetTolerancePx: options.magnetTolerancePx !== undefined ? Math.max(0, options.magnetTolerancePx) : undefined,
    timeMagnetEnabled: options.timeMagnetEnabled,
    timeMagnetPolicy: options.timeMagnetPolicy,
    timeMagnetTolerancePx: options.timeMagnetTolerancePx !== undefined ? Math.max(0, options.timeMagnetTolerancePx) : undefined,
    magnetSources: options.magnetSources !== undefined ? { ...options.magnetSources } : undefined,
  };
}

export function applyDrawingMagnetOverrides(
  drawing: DrawingMagnetState,
  options: DrawingMagnetOverrides,
): void {
  if (options.magnetEnabled !== undefined) {
    drawing.magnetEnabled = options.magnetEnabled;
  }
  if (options.magnetTolerancePx !== undefined) {
    drawing.magnetTolerancePx = Math.max(0, options.magnetTolerancePx);
  }
  if (options.timeMagnetEnabled !== undefined) {
    drawing.timeMagnetEnabled = options.timeMagnetEnabled;
  }
  if (options.timeMagnetPolicy !== undefined) {
    drawing.timeMagnetPolicy = options.timeMagnetPolicy;
  }
  if (options.timeMagnetTolerancePx !== undefined) {
    drawing.timeMagnetTolerancePx = Math.max(0, options.timeMagnetTolerancePx);
  }
  if (options.magnetSources !== undefined) {
    drawing.magnetSources = {
      ...(drawing.magnetSources ?? {}),
      ...options.magnetSources,
    };
  }
}
