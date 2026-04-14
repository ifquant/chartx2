import {
  mainSeriesChartTypeSpec,
  type PhaseOneMainChartType,
  type PhaseOneMainSeriesBuilder,
  type PhaseOneMainSeriesInputCapability,
  type PhaseOneMainSeriesRenderer,
  type PhaseOneMainStyleSchemaId,
} from "./main-series-chart-types";
import {
  mainSeriesStyleSchemaSpec,
  type MainSeriesStyleOptionSurfaceKind,
} from "./main-series-style-schemas";
import type {
  LineBreakStyleOptionsState,
  PointFigureStyleOptionsState,
  RenkoStyleOptionsState,
} from "./main-series-style-options";

export type MainSeriesStyleOptionsSnapshot = Record<string, unknown>;

export type MainSeriesStateTarget = {
  chartType: PhaseOneMainChartType;
  options: Record<string, unknown>;
  lineBreakOptions: LineBreakStyleOptionsState;
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
};

export type MainSeriesStateSnapshot = {
  chartType: PhaseOneMainChartType;
  inputCapability: PhaseOneMainSeriesInputCapability;
  builder: PhaseOneMainSeriesBuilder;
  renderer: PhaseOneMainSeriesRenderer;
  styleSchemaId: PhaseOneMainStyleSchemaId;
  styleOptionSurface: MainSeriesStyleOptionSurfaceKind;
  styleOptions: MainSeriesStyleOptionsSnapshot;
  lineBreakOptions: LineBreakStyleOptionsState;
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
};

export function createMainSeriesStateSnapshot(
  target: MainSeriesStateTarget,
): MainSeriesStateSnapshot {
  const chartTypeSpec = mainSeriesChartTypeSpec(target.chartType);
  const styleSchema = mainSeriesStyleSchemaSpec(chartTypeSpec.styleSchemaId);
  const styleOptions = Object.fromEntries(
    styleSchema.optionKeys
      .filter((key) => key in target.options)
      .map((key) => [key, target.options[key]]),
  );

  if (chartTypeSpec.styleSchemaId === "lineBreakStyle") {
    styleOptions.lineBreakCount = target.lineBreakOptions.lineCount;
  }

  if (chartTypeSpec.styleSchemaId === "renkoStyle") {
    styleOptions.renkoBoxSize = target.renkoOptions.boxSize;
    styleOptions.renkoBoxSizeMode = target.renkoOptions.boxSizeMode;
  }

  if (chartTypeSpec.styleSchemaId === "pnfStyle") {
    styleOptions.pointFigureBoxSize = target.pointFigureOptions.boxSize;
    styleOptions.pointFigureBoxSizeMode = target.pointFigureOptions.boxSizeMode;
    styleOptions.pointFigureBoxSizeScale = target.pointFigureOptions.boxSizeScale;
    styleOptions.pointFigureReversalBoxes = target.pointFigureOptions.reversalBoxes;
    styleOptions.pointFigureAtrLength = target.pointFigureOptions.atrLength;
    styleOptions.pointFigurePercentageValue = target.pointFigureOptions.percentageValue;
  }

  return {
    chartType: target.chartType,
    inputCapability: chartTypeSpec.inputCapability,
    builder: chartTypeSpec.builder,
    renderer: chartTypeSpec.renderer,
    styleSchemaId: chartTypeSpec.styleSchemaId,
    styleOptionSurface: styleSchema.optionSurface,
    styleOptions,
    lineBreakOptions: {
      lineCount: target.lineBreakOptions.lineCount,
    },
    renkoOptions: {
      boxSize: target.renkoOptions.boxSize,
      boxSizeMode: target.renkoOptions.boxSizeMode,
    },
    pointFigureOptions: {
      boxSize: target.pointFigureOptions.boxSize,
      boxSizeMode: target.pointFigureOptions.boxSizeMode,
      boxSizeScale: target.pointFigureOptions.boxSizeScale,
      reversalBoxes: target.pointFigureOptions.reversalBoxes,
      atrLength: target.pointFigureOptions.atrLength,
      percentageValue: target.pointFigureOptions.percentageValue,
    },
  };
}
