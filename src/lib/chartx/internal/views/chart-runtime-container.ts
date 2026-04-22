import {
  ChartModel,
  DrawingRegistry,
  PriceScale,
  type PhaseOneMainChartType,
  type PaneModelState,
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
    getDrawingRegistry: () => drawingRegistry,
    rendererRuntime: () => renderers,
    timeScaleApi: () => timeScale,
    primaryPriceScale: (): PriceScale => chartModel.primaryScale(),
    contextSnapshot: () => chartModel.context().snapshot(),
    clearMainSource: () => chartModel.clearMainSource(),
    bindMainSource: (mainSourceId: string, chartType: PhaseOneMainChartType, barSequence: unknown) =>
      chartModel.bindMainSource(mainSourceId, chartType, barSequence as never),
    mainSourceId: () => chartModel.mainSourceId(),
    registerSource: (source: SeriesSourceState) => chartModel.registerSource(source),
    removeSourceByApi: (api: ChartSeriesApi) => chartModel.removeSourceByApi(api),
    removeSourcesWhere: (predicate: (source: SeriesSourceState) => boolean) => chartModel.removeSourcesWhere(predicate),
    getSourceByIdAndRole: (id: string, role: SeriesSourceState["role"]) => chartModel.getSourceByIdAndRole(id, role),
    getSourceByApiOrThrow: (api: ChartSeriesApi, message: string) => chartModel.getSourceByApiOrThrow(api, message),
    listSourcesByRole: (role: SeriesSourceState["role"]) => chartModel.listSourcesByRole(role),
    listSourcesByPane: (paneId: string) => chartModel.listSourcesByPane(paneId),
    listSourcesByPaneAndRole: (paneId: string, role: SeriesSourceState["role"]) =>
      chartModel.listSourcesByPaneAndRole(paneId, role),
    listSources: () => chartModel.listSources(),
    hasSourceApi: (api: ChartSeriesApi) => chartModel.hasSourceApi(api),
    getOrCreateSecondaryScale: (paneId: string) => chartModel.getOrCreateSecondaryScale(paneId),
    getSecondaryScale: (paneId: string) => chartModel.getSecondaryScale(paneId),
    removeSecondaryScale: (paneId: string) => chartModel.removeSecondaryScale(paneId),
    secondaryScales: () => chartModel.secondaryScales(),
    getPaneById: (paneId: string) => chartModel.panes().getById(paneId),
    getPaneByIndex: (index: number) => chartModel.panes().getByIndex(index),
    getPaneIndex: (paneId: string) => chartModel.panes().getIndex(paneId),
    listPanes: (): readonly PaneModelState[] => chartModel.panes().list(),
    addSecondaryPane: (options?: { height?: number; resizable?: boolean }) =>
      chartModel.panes().addSecondaryPane(options),
    removePaneById: (paneId: string) => chartModel.panes().removeById(paneId),
    removeDrawingByApi: (api: ChartDrawingApi) => drawingRegistry.removeByApi(api),
  };
}
