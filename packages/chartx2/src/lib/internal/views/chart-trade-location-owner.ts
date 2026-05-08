import type { PhaseOneResolvedTradeOverlayOptions } from "../model";

import {
  clearTradeLocationRuntime,
  getTradeLocationState,
  locateTradeRuntime,
  refreshTradeLocationRuntime,
} from "./chart-trade-location-runtime";

type TradeLocationSession<Request, State> = {
  request: Request;
  options: PhaseOneResolvedTradeOverlayOptions;
  state: State | null;
};

export function createChartTradeLocationOwner<Request, Options, State, MainSource>(deps: {
  ensureMainSource(): void;
  getMainSource(): MainSource | null;
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  setVisiblePriceRange(range: { minValue: number; maxValue: number }): void;
  resetPrimaryPriceRangeOverride(): void;
  render(): void;
}) {
  let activeTradeLocation: TradeLocationSession<Request, State> | null = null;

  const refresh = (): void => {
    refreshTradeLocationRuntime<MainSource, Request, PhaseOneResolvedTradeOverlayOptions, State>(
      activeTradeLocation,
      {
        getMainSource: deps.getMainSource,
        setActiveTradeLocation: (next) => {
          activeTradeLocation = next;
        },
        setVisibleLogicalRange: deps.setVisibleLogicalRange,
        setVisiblePriceRange: deps.setVisiblePriceRange,
        render: deps.render,
      },
    );
  };

  return {
    getActiveSession(): TradeLocationSession<Request, State> | null {
      return activeTradeLocation;
    },
    setActiveSession(next: TradeLocationSession<Request, State>): void {
      activeTradeLocation = next;
    },
    locate(request: Request, options: Options | undefined): State | null {
      return locateTradeRuntime<Request, Options, State, TradeLocationSession<Request, State>>(
        request,
        options,
        {
          ensureMainSource: deps.ensureMainSource,
          setActiveTradeLocation: (next) => {
            activeTradeLocation = next;
          },
          refreshTradeLocation: () => {
            refresh();
          },
          getTradeLocationState: () => activeTradeLocation?.state ?? null,
        },
      );
    },
    clear(): void {
      clearTradeLocationRuntime({
        clearActiveTradeLocation: () => {
          activeTradeLocation = null;
        },
        resetPrimaryPriceRangeOverride: deps.resetPrimaryPriceRangeOverride,
        render: deps.render,
      });
    },
    getState(): State | null {
      return getTradeLocationState(activeTradeLocation);
    },
    refresh,
  };
}
