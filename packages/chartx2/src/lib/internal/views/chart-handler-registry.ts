import { emitChartTypeChangeRuntime, emitCrosshairMoveEventRuntime, emitPaneResizeEvent } from "./chart-event-runtime";
import { subscribePublicHandler, unsubscribePublicHandler } from "./chart-public-state";
import { emitPaneEvent } from "./chart-pane-management";
import { subscribePaneResize, unsubscribePaneResize } from "./chart-pane-runtime";
import type {
  PhaseOneChartTypeChangeHandler,
  PhaseOneClickHandler,
  PhaseOneCrosshairMoveHandler,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneMarkerGeometryHandler,
  PhaseOneMarkerGeometrySnapshot,
  PhaseOnePaneEvent,
  PhaseOnePaneEventHandler,
  PhaseOnePaneEventType,
  PhaseOnePaneResizeEvent,
  PhaseOnePaneResizeHandler,
  PhaseOnePaneState,
  PhaseOneReadoutDetail,
  PhaseOneSelectedDrawing,
} from "./chart-api-types";
import type { PanePoint } from "./chart-layout-geometry";

export function createChartHandlerRegistry() {
  const crosshairMoveHandlers = new Set<PhaseOneCrosshairMoveHandler>();
  const clickHandlers = new Set<PhaseOneClickHandler>();
  const drawingSelectionHandlers = new Set<PhaseOneDrawingSelectionChangeHandler>();
  const paneEventHandlers = new Set<PhaseOnePaneEventHandler>();
  const chartTypeChangeHandlers = new Set<PhaseOneChartTypeChangeHandler>();
  const markerGeometryHandlers = new Set<PhaseOneMarkerGeometryHandler>();
  const paneResizeHandlers = new Map<string, Set<PhaseOnePaneResizeHandler>>();

  return {
    subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
      subscribePublicHandler(crosshairMoveHandlers, handler);
    },
    unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
      unsubscribePublicHandler(crosshairMoveHandlers, handler);
    },
    subscribeClick(handler: PhaseOneClickHandler): void {
      subscribePublicHandler(clickHandlers, handler);
    },
    unsubscribeClick(handler: PhaseOneClickHandler): void {
      unsubscribePublicHandler(clickHandlers, handler);
    },
    subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
      subscribePublicHandler(drawingSelectionHandlers, handler);
    },
    unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
      unsubscribePublicHandler(drawingSelectionHandlers, handler);
    },
    subscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
      subscribePublicHandler(paneEventHandlers, handler);
    },
    unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
      unsubscribePublicHandler(paneEventHandlers, handler);
    },
    subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
      subscribePublicHandler(chartTypeChangeHandlers, handler);
    },
    unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
      unsubscribePublicHandler(chartTypeChangeHandlers, handler);
    },
    subscribeMarkerGeometry(handler: PhaseOneMarkerGeometryHandler): void {
      subscribePublicHandler(markerGeometryHandlers, handler);
    },
    unsubscribeMarkerGeometry(handler: PhaseOneMarkerGeometryHandler): void {
      unsubscribePublicHandler(markerGeometryHandlers, handler);
    },
    emitMarkerGeometry(snapshot: PhaseOneMarkerGeometrySnapshot): void {
      for (const handler of markerGeometryHandlers) handler(snapshot);
    },
    subscribePaneResize(
      paneId: string,
      handler: PhaseOnePaneResizeHandler,
      deps: {
        hasPane(nextPaneId: string): boolean;
      },
    ): void {
      subscribePaneResize(paneId, handler, {
        hasPane: deps.hasPane,
        getHandlers: (nextPaneId) => paneResizeHandlers.get(nextPaneId),
        setHandlers: (nextPaneId, handlers) => {
          paneResizeHandlers.set(nextPaneId, handlers);
        },
      });
    },
    unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
      unsubscribePaneResize(paneId, handler, {
        getHandlers: (nextPaneId) => paneResizeHandlers.get(nextPaneId),
        deleteHandlers: (nextPaneId) => {
          paneResizeHandlers.delete(nextPaneId);
        },
      });
    },
    clearPaneResizeHandlers(paneId: string): void {
      paneResizeHandlers.delete(paneId);
    },
    emitPaneResize(
      paneId: string,
      deps: {
        getPaneById(nextPaneId: string): { kind: "primary" | "secondary" } | undefined;
        getPaneIndex(nextPaneId: string): number;
        getPaneHeight(nextPaneId: string): number;
      },
    ): void {
      emitPaneResizeEvent(paneResizeHandlers.get(paneId), paneId, deps);
    },
    emitPaneEvent(
      type: PhaseOnePaneEventType,
      paneId: string,
      deps: {
        buildPaneState(nextPaneId: string): PhaseOnePaneState | null;
        buildPaneSnapshot(): readonly PhaseOnePaneState[];
      },
      explicitPaneState?: PhaseOnePaneState | null,
      explicitSnapshot?: readonly PhaseOnePaneState[],
    ): void {
      emitPaneEvent(paneEventHandlers, type, paneId, deps, explicitPaneState, explicitSnapshot);
    },
    emitCrosshairMove(
      readout: PhaseOneReadoutDetail,
      crosshair: PanePoint | null,
    ): void {
      emitCrosshairMoveEventRuntime(crosshairMoveHandlers, readout, crosshair);
    },
    emitClick(
      readout: PhaseOneReadoutDetail,
      point: PanePoint | null,
    ): void {
      for (const handler of clickHandlers) {
        handler({
          ...readout,
          point,
        });
      }
    },
    emitChartTypeChange(type: Parameters<PhaseOneChartTypeChangeHandler>[0]): void {
      emitChartTypeChangeRuntime(chartTypeChangeHandlers, type);
    },
    notifyDrawingSelectionChange(state: PhaseOneSelectedDrawing): void {
      for (const handler of drawingSelectionHandlers) {
        handler(state);
      }
    },
    clearAll(): void {
      crosshairMoveHandlers.clear();
      clickHandlers.clear();
      drawingSelectionHandlers.clear();
      paneEventHandlers.clear();
      chartTypeChangeHandlers.clear();
      markerGeometryHandlers.clear();
      paneResizeHandlers.clear();
    },
  };
}
