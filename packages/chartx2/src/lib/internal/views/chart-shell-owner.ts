import type { PhaseOneChartOptions } from "./chart-api-types";
import {
  applyChartOptions,
  resizeChart,
} from "./chart-shell-commands";

type LayoutOptions = Required<NonNullable<PhaseOneChartOptions["layout"]>>;
type CrosshairOptions = Required<NonNullable<PhaseOneChartOptions["crosshair"]>>;
type DrawingMagnetSources = Required<NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>>;

type DrawingOptions = Required<Omit<NonNullable<PhaseOneChartOptions["drawings"]>, "magnetSources">> & {
  magnetSources: DrawingMagnetSources;
};

export function createChartShellOwner(deps: {
  layoutOptions: LayoutOptions;
  crosshairOptions: CrosshairOptions;
  drawingOptions: DrawingOptions;
  setManualLayout(layout: { width: number; height: number }): void;
  clearDrawingSnapGuide(): void;
  clearDrawingSnapGuideTimeOnly(): void;
  render(): void;
}) {
  return {
    applyOptions(options: PhaseOneChartOptions): void {
      applyChartOptions(options, {
        setLayoutOption: (key, value) => {
          (deps.layoutOptions as Record<string, unknown>)[key] = value;
        },
        setCrosshairOption: (key, value) => {
          deps.crosshairOptions[key] = value;
        },
        setDrawingOption: (key, value) => {
          deps.drawingOptions[key] = value as never;
        },
        setDrawingMagnetSource: (key, value) => {
          deps.drawingOptions.magnetSources[key] = value;
        },
        clearDrawingSnapGuide: deps.clearDrawingSnapGuide,
        clearDrawingSnapGuideTimeOnly: deps.clearDrawingSnapGuideTimeOnly,
        render: deps.render,
      });
    },
    resize(width: number, height: number): void {
      resizeChart(width, height, {
        setManualLayout: deps.setManualLayout,
        render: deps.render,
      });
    },
  };
}
