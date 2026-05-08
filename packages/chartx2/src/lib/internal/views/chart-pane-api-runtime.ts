import { createPaneHandle } from "./chart-structure-commands";
import type {
  PhaseOnePaneApi,
  PhaseOnePaneOptions,
  PhaseOnePaneResizeHandler,
} from "./chart-api-types";

export function createPaneApiHandle(
  paneId: string,
  deps: {
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
    getPaneOptions(paneId: string): Required<PhaseOnePaneOptions>;
    applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void;
    setPaneHeight(paneId: string, height: number): void;
    isPrimary(paneId: string): boolean;
    isResizable(paneId: string): boolean;
    subscribeResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
    unsubscribeResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
    hasSeries(paneId: string): boolean;
    removePaneById(paneId: string): void;
    registerPaneHandle(handle: PhaseOnePaneApi, paneId: string): void;
  },
): PhaseOnePaneApi {
  return createPaneHandle(paneId, deps);
}

export function subscribePaneResizeRuntime(
  paneId: string,
  handler: PhaseOnePaneResizeHandler,
  deps: {
    subscribePaneResize(
      paneId: string,
      handler: PhaseOnePaneResizeHandler,
      options: {
        hasPane(nextPaneId: string): boolean;
      },
    ): void;
    hasPane(paneId: string): boolean;
  },
): void {
  deps.subscribePaneResize(paneId, handler, {
    hasPane: (nextPaneId) => deps.hasPane(nextPaneId),
  });
}

export function unsubscribePaneResizeRuntime(
  paneId: string,
  handler: PhaseOnePaneResizeHandler,
  deps: {
    unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
  },
): void {
  deps.unsubscribePaneResize(paneId, handler);
}
