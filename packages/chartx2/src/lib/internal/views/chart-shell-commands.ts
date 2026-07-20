import type { PhaseOneChartOptions } from "./chart-api-types";

export function applyChartOptions(
  options: PhaseOneChartOptions,
  deps: {
    setLayoutOption<K extends keyof NonNullable<PhaseOneChartOptions["layout"]>>(
      key: K,
      value: NonNullable<NonNullable<PhaseOneChartOptions["layout"]>[K]>,
    ): void;
    setCrosshairOption<K extends keyof NonNullable<PhaseOneChartOptions["crosshair"]>>(
      key: K,
      value: NonNullable<NonNullable<PhaseOneChartOptions["crosshair"]>[K]>,
    ): void;
    setDrawingOption<K extends
      | "magnetEnabled"
      | "magnetGuideVisible"
      | "magnetLabelVisible"
      | "magnetTolerancePx"
      | "timeMagnetEnabled"
      | "timeMagnetPolicy"
      | "timeMagnetGuideVisible"
      | "timeMagnetLabelVisible"
      | "timeMagnetTolerancePx">(
      key: K,
      value: K extends "magnetTolerancePx" | "timeMagnetTolerancePx" ? number : K extends "timeMagnetPolicy"
        ? "nearest" | "previous" | "next"
        : boolean,
    ): void;
    setDrawingMagnetSource<K extends keyof NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>>(
      key: K,
      value: NonNullable<NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>[K]>,
    ): void;
    clearDrawingSnapGuide(): void;
    clearDrawingSnapGuideTimeOnly(): void;
    render(): void;
  },
): void {
  if (options.layout?.backgroundColor !== undefined) deps.setLayoutOption("backgroundColor", options.layout.backgroundColor);
  if (options.layout?.paneBackgroundColor !== undefined) deps.setLayoutOption("paneBackgroundColor", options.layout.paneBackgroundColor);
  if (options.layout?.gridColor !== undefined) deps.setLayoutOption("gridColor", options.layout.gridColor);
  if (options.layout?.frameColor !== undefined) deps.setLayoutOption("frameColor", options.layout.frameColor);
  if (options.layout?.fitContainerHeight !== undefined) deps.setLayoutOption("fitContainerHeight", options.layout.fitContainerHeight);
  if (options.layout?.paneGap !== undefined) deps.setLayoutOption("paneGap", Math.max(0, options.layout.paneGap));
  if (options.layout?.plotInsets !== undefined) deps.setLayoutOption("plotInsets", {
    top: Math.max(0, options.layout.plotInsets.top ?? 0),
    right: Math.max(0, options.layout.plotInsets.right ?? 0),
    bottom: Math.max(0, options.layout.plotInsets.bottom ?? 0),
    left: Math.max(0, options.layout.plotInsets.left ?? 0),
  });
  if (options.layout?.axisTextColor !== undefined) deps.setLayoutOption("axisTextColor", options.layout.axisTextColor);
  if (options.layout?.axisLabelBackground !== undefined) deps.setLayoutOption("axisLabelBackground", options.layout.axisLabelBackground);
  if (options.layout?.axisLabelBorder !== undefined) deps.setLayoutOption("axisLabelBorder", options.layout.axisLabelBorder);
  if (options.layout?.axisActiveBackground !== undefined) deps.setLayoutOption("axisActiveBackground", options.layout.axisActiveBackground);
  if (options.layout?.axisActiveText !== undefined) deps.setLayoutOption("axisActiveText", options.layout.axisActiveText);
  if (options.layout?.priceAxisPosition === "left" || options.layout?.priceAxisPosition === "right") {
    deps.setLayoutOption("priceAxisPosition", options.layout.priceAxisPosition);
  }

  if (options.crosshair?.lineColor !== undefined) deps.setCrosshairOption("lineColor", options.crosshair.lineColor);
  if (options.crosshair?.pointColor !== undefined) deps.setCrosshairOption("pointColor", options.crosshair.pointColor);

  if (options.drawings?.magnetEnabled !== undefined) {
    deps.setDrawingOption("magnetEnabled", options.drawings.magnetEnabled);
    if (!options.drawings.magnetEnabled) deps.clearDrawingSnapGuide();
  }
  if (options.drawings?.magnetGuideVisible !== undefined) {
    deps.setDrawingOption("magnetGuideVisible", options.drawings.magnetGuideVisible);
    if (!options.drawings.magnetGuideVisible) deps.clearDrawingSnapGuide();
  }
  if (options.drawings?.magnetLabelVisible !== undefined) {
    deps.setDrawingOption("magnetLabelVisible", options.drawings.magnetLabelVisible);
  }
  if (options.drawings?.magnetTolerancePx !== undefined) {
    deps.setDrawingOption("magnetTolerancePx", Math.max(0, options.drawings.magnetTolerancePx));
  }
  if (options.drawings?.timeMagnetEnabled !== undefined) {
    deps.setDrawingOption("timeMagnetEnabled", options.drawings.timeMagnetEnabled);
    if (!options.drawings.timeMagnetEnabled) deps.clearDrawingSnapGuideTimeOnly();
  }
  if (options.drawings?.timeMagnetPolicy !== undefined) {
    deps.setDrawingOption("timeMagnetPolicy", options.drawings.timeMagnetPolicy);
  }
  if (options.drawings?.timeMagnetGuideVisible !== undefined) {
    deps.setDrawingOption("timeMagnetGuideVisible", options.drawings.timeMagnetGuideVisible);
    if (!options.drawings.timeMagnetGuideVisible) deps.clearDrawingSnapGuideTimeOnly();
  }
  if (options.drawings?.timeMagnetLabelVisible !== undefined) {
    deps.setDrawingOption("timeMagnetLabelVisible", options.drawings.timeMagnetLabelVisible);
  }
  if (options.drawings?.timeMagnetTolerancePx !== undefined) {
    deps.setDrawingOption("timeMagnetTolerancePx", Math.max(0, options.drawings.timeMagnetTolerancePx));
  }
  if (options.drawings?.magnetSources !== undefined) {
    if (options.drawings.magnetSources.open !== undefined) deps.setDrawingMagnetSource("open", options.drawings.magnetSources.open);
    if (options.drawings.magnetSources.high !== undefined) deps.setDrawingMagnetSource("high", options.drawings.magnetSources.high);
    if (options.drawings.magnetSources.low !== undefined) deps.setDrawingMagnetSource("low", options.drawings.magnetSources.low);
    if (options.drawings.magnetSources.close !== undefined) deps.setDrawingMagnetSource("close", options.drawings.magnetSources.close);
  }

  deps.render();
}

export function resizeChart(
  width: number,
  height: number,
  deps: {
    setManualLayout(layout: { width: number; height: number }): void;
    render(): void;
  },
): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("chartx phase-one chart resize requires positive finite width and height");
  }

  deps.setManualLayout({
    width: Math.round(width),
    height: Math.round(height),
  });
  deps.render();
}
