import {
  buildPaneFrames,
  resolvePaneDivider,
  resolvePaneDividerByIds,
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
  const paneFrameById = (
    paneId: string,
    plotHeight: number,
    provided?: readonly PaneFrame[],
  ): PaneFrame | null => resolvePaneFrames(plotHeight, provided).find((pane) => pane.id === paneId) ?? null;

  return {
    paneFrames,
    resolvePaneFrames,
    paneFrameById,
    primaryPaneFrame(plotHeight: number, provided?: readonly PaneFrame[]): PaneFrame | null {
      return resolvePaneFrames(plotHeight, provided).find((pane) => pane.kind === "primary") ?? null;
    },
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
    resolvePaneDividerByIds(
      upperPaneId: string,
      lowerPaneId: string,
      plotHeight: number,
      provided?: readonly PaneFrame[],
    ): PaneDivider | null {
      return resolvePaneDividerByIds(
        resolvePaneFrames(plotHeight, provided),
        upperPaneId,
        lowerPaneId,
        deps.paneGap,
      );
    },
  };
}
