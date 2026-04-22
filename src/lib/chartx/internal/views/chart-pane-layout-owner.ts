import {
  buildPaneFrames,
  resolvePaneDivider,
  type PaneDivider,
  type PaneFrame,
  type PaneModelState,
} from "../model";
import { resolveActivePane } from "./chart-layout-geometry";

type PanePoint = {
  x: number;
  y: number;
} | null;

export function createChartPaneLayoutOwner(deps: {
  listPanes(): readonly PaneModelState[];
  paneGap: number;
}) {
  const paneFrames = (plotHeight: number): readonly PaneFrame[] =>
    buildPaneFrames(deps.listPanes(), plotHeight, deps.paneGap);
  const resolvePaneFrames = (plotHeight: number, provided?: readonly PaneFrame[]): readonly PaneFrame[] =>
    provided ?? paneFrames(plotHeight);

  return {
    paneFrames,
    resolvePaneFrames,
    resolveActivePane(crosshair: PanePoint, plotHeight: number, provided?: readonly PaneFrame[]): PaneFrame | null {
      if (crosshair === null) {
        return null;
      }
      return resolveActivePane(resolvePaneFrames(plotHeight, provided), crosshair.y);
    },
    resolvePaneDivider(
      y: number | null,
      plotHeight: number,
      hitSlop: number,
      provided?: readonly PaneFrame[],
    ): PaneDivider | null {
      return resolvePaneDivider(
        deps.listPanes(),
        resolvePaneFrames(plotHeight, provided),
        y,
        deps.paneGap,
        hitSlop,
      );
    },
  };
}
