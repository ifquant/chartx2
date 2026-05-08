import type { PhaseOneResolvedTradeOverlayOptions } from "../model";
import {
  clearTradeLocationCommand,
  locateTradeCommand,
} from "./chart-runtime-commands";
import { refreshTradeLocation } from "./chart-main-source-runtime";

type TradeLocationSession<State, Request, OverlayOptions> = {
  request: Request;
  options: OverlayOptions;
  state: State;
};

export function getTradeLocationState<State>(
  activeTradeLocation: { state: State } | null,
): State | null {
  return activeTradeLocation?.state ?? null;
}

export function locateTradeRuntime<
  Request,
  Options,
  State,
  Session extends TradeLocationSession<State | null, Request, PhaseOneResolvedTradeOverlayOptions>,
>(
  request: Request,
  options: Options | undefined,
  deps: {
    ensureMainSource(): void;
    setActiveTradeLocation(next: Session): void;
    refreshTradeLocation(): void;
    getTradeLocationState(): State | null;
  },
): State | null {
  return locateTradeCommand(request as never, options as never, deps as never) as State | null;
}

export function clearTradeLocationRuntime(
  deps: {
    clearActiveTradeLocation(): void;
    resetPrimaryPriceRangeOverride(): void;
    render(): void;
  },
): void {
  clearTradeLocationCommand(deps);
}

export function refreshTradeLocationRuntime<MainSource, Request, OverlayOptions, State>(
  activeTradeLocation: TradeLocationSession<State | null, Request, OverlayOptions> | null,
  deps: {
    getMainSource(): MainSource | null;
    setActiveTradeLocation(next: TradeLocationSession<State | null, Request, OverlayOptions>): void;
    setVisibleLogicalRange(range: { from: number; to: number }): void;
    setVisiblePriceRange(range: { minValue: number; maxValue: number }): void;
    render(): void;
  },
): void {
  refreshTradeLocation(activeTradeLocation as never, deps as never);
}
