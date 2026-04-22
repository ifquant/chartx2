import {
  ChartModel,
  DrawingRegistry,
  type PhaseOneMainChartType,
  TimeScale,
} from "../model";
import {
  AreaRenderer,
  BaselineRenderer,
  BarRenderer,
  CandlesticksRenderer,
  GridRenderer,
  HistogramRenderer,
  KagiRenderer,
  LineRenderer,
  PointFigureRenderer,
} from "../renderers";
import type {
  ChartDrawingApi,
  ChartDrawingDescriptor,
  ChartDrawingKind,
  ChartSeriesApi,
  ChartSeriesKind,
  SeriesSourceState,
} from "./chart-runtime-types";

export type ChartRendererRuntime = {
  areaRenderer: AreaRenderer;
  barRenderer: BarRenderer;
  baselineRenderer: BaselineRenderer;
  candlesRenderer: CandlesticksRenderer;
  gridRenderer: GridRenderer;
  histogramRenderer: HistogramRenderer;
  kagiRenderer: KagiRenderer;
  lineRenderer: LineRenderer;
  pointFigureRenderer: PointFigureRenderer;
};

export function createChartRuntimeContainer() {
  const chartModel = new ChartModel<
    ChartSeriesKind,
    ChartSeriesApi,
    SeriesSourceState,
    PhaseOneMainChartType
  >();
  const drawingRegistry = new DrawingRegistry<ChartDrawingKind, ChartDrawingApi, ChartDrawingDescriptor>();
  const timeScale = new TimeScale();
  const renderers: ChartRendererRuntime = {
    areaRenderer: new AreaRenderer(),
    barRenderer: new BarRenderer(),
    baselineRenderer: new BaselineRenderer(),
    candlesRenderer: new CandlesticksRenderer(),
    gridRenderer: new GridRenderer(),
    histogramRenderer: new HistogramRenderer(),
    kagiRenderer: new KagiRenderer(),
    lineRenderer: new LineRenderer(),
    pointFigureRenderer: new PointFigureRenderer(),
  };

  return {
    chartModel,
    drawingRegistry,
    timeScale,
    renderers,
    panes: () => chartModel.panes(),
    primaryPriceScale: () => chartModel.primaryScale(),
  };
}
