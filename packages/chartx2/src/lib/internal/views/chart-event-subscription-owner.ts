import type {
  PhaseOneChartTypeChangeHandler,
  PhaseOneClickHandler,
  PhaseOneCrosshairMoveHandler,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOnePaneEventHandler,
} from "./chart-api-types";

export function createChartEventSubscriptionOwner(deps: {
  subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  subscribeClick(handler: PhaseOneClickHandler): void;
  unsubscribeClick(handler: PhaseOneClickHandler): void;
  subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  subscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void;
  unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void;
}) {
  return {
    subscribeCrosshairMove: deps.subscribeCrosshairMove,
    unsubscribeCrosshairMove: deps.unsubscribeCrosshairMove,
    subscribeClick: deps.subscribeClick,
    unsubscribeClick: deps.unsubscribeClick,
    subscribeDrawingSelectionChange: deps.subscribeDrawingSelectionChange,
    unsubscribeDrawingSelectionChange: deps.unsubscribeDrawingSelectionChange,
    subscribePaneEvents: deps.subscribePaneEvents,
    unsubscribePaneEvents: deps.unsubscribePaneEvents,
    subscribeChartTypeChange: deps.subscribeChartTypeChange,
    unsubscribeChartTypeChange: deps.unsubscribeChartTypeChange,
  };
}

