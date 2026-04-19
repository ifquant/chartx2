import { resolveTradeOverlayOptions } from "../model";
import type { PhaseOneChartApi } from "./chart-harness";

type TradeLocationSession = {
  request: Parameters<PhaseOneChartApi["locateTrade"]>[0];
  options: NonNullable<ReturnType<typeof resolveTradeOverlayOptions>>;
  state: ReturnType<PhaseOneChartApi["locateTrade"]>;
};

export function subscribeHandler<T>(handlers: Set<T>, handler: T): void {
  handlers.add(handler);
}

export function unsubscribeHandler<T>(handlers: Set<T>, handler: T): void {
  handlers.delete(handler);
}

export function locateTradeCommand(
  request: Parameters<PhaseOneChartApi["locateTrade"]>[0],
  options: Parameters<PhaseOneChartApi["locateTrade"]>[1] | undefined,
  deps: {
    ensureMainSource(): void;
    setActiveTradeLocation(next: TradeLocationSession): void;
    refreshTradeLocation(): void;
    getTradeLocationState(): ReturnType<PhaseOneChartApi["locateTrade"]>;
  },
): ReturnType<PhaseOneChartApi["locateTrade"]> {
  deps.ensureMainSource();
  deps.setActiveTradeLocation({
    request,
    options: resolveTradeOverlayOptions(options ?? {}),
    state: null,
  });
  deps.refreshTradeLocation();
  return deps.getTradeLocationState();
}

export function clearTradeLocationCommand(
  deps: {
    clearActiveTradeLocation(): void;
    resetPrimaryPriceRangeOverride(): void;
    render(): void;
  },
): void {
  deps.clearActiveTradeLocation();
  deps.resetPrimaryPriceRangeOverride();
  deps.render();
}
