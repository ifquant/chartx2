export { PerformanceDatasetRegistry } from "./datasets/dataset-registry";
export {
  OptimizationDatasetRegistry,
  computeRobustnessField,
  deriveOptimizationThresholdPlane,
  optimizationMetricLabel,
} from "./datasets/optimization-dataset-registry";
export { PerformanceMetricEngine } from "./metrics/metric-engine";
export { PerformanceReportModel, createPerformanceReportModel } from "./model/report-model";
export { createSampleStrategyRun } from "./fixtures/sample-run";
export { createSampleParameterSweep } from "./fixtures/sample-sweep";
export { createSampleStrategyRunFromSummary } from "./fixtures/sample-sweep";
export { createTradeLocationIntent } from "./model/trade-location";
export { createRunLocationIntent } from "./model/run-location";
export { PerformanceCanvasHarness } from "./views/performance-canvas-harness";
export { OptimizationCanvasHarness } from "./views/optimization-canvas-harness";
export type {
  AxisModel,
  BenchmarkSeries,
  BreakdownDataset,
  BreakdownSlice,
  BreakdownSpec,
  ClosedTrade,
  DistributionBin,
  DistributionDataset,
  DistributionSpec,
  EquityBasis,
  EquitySeries,
  EquitySeriesPoint,
  EquitySeriesSpec,
  EquitySnapshot,
  ExcursionPoint,
  ExcursionSeries,
  FillEvent,
  MeasureUnit,
  MetricCardModel,
  NormalizationMode,
  NumericScaleModel,
  OrderEvent,
  OrderSide,
  OrderType,
  OptimizationMetricKey,
  OptimizationSurfaceView,
  ParameterAssignment,
  RobustnessField,
  ParameterSurfaceDataset,
  ParameterSurfacePoint,
  ParameterSurfaceSpec,
  ParameterSweepModel,
  ParameterValue,
  PerformanceMetricKey,
  PerformanceReportSnapshot,
  PerformanceReportView,
  PerformanceScope,
  PerformanceVisualKind,
  RangeCompareDataset,
  RangeCompareDatum,
  RunLocationIntent,
  SideSlice,
  ScalarSeries,
  ScalarSeriesPoint,
  StrategyRunModel,
  StrategyRunSummary,
  ThresholdPlane,
  TradeListRow,
  TradeLocationIntent,
  TradeSide,
  XDomainKind,
} from "./model/types";
