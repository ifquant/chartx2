import { normalizePaneHeight } from "../model";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

type PaneResizeStateLike = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  startClientY: number;
  startUpperHeight: number;
  startLowerHeight: number;
};

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;

export function createChartPaneLayoutPolicyOwner() {
  return {
    normalizePreferredHeight(height: number | undefined): number {
      return normalizePaneHeight(height);
    },

    resolveControlledResizeHeight(
      clientY: number,
      resizeState: PaneResizeStateLike | null,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
      },
    ): { paneId: string; nextHeight: number } | null {
      if (resizeState === null) {
        return null;
      }

      const delta = Math.round(clientY - resizeState.startClientY);
      const upperPane = deps.getPaneById(resizeState.dividerAfterPaneId);
      const lowerPane = deps.getPaneById(resizeState.dividerBeforePaneId);
      if (upperPane === undefined || lowerPane === undefined) {
        return null;
      }

      const controlsUpperPane = upperPane.kind === "secondary";
      const controlledPane = controlsUpperPane ? upperPane : lowerPane;
      if (!controlledPane.resizable) {
        return null;
      }

      const startControlled = controlsUpperPane
        ? resizeState.startUpperHeight
        : resizeState.startLowerHeight;
      const requestedHeight = controlsUpperPane
        ? startControlled + delta
        : startControlled - delta;
      const totalResizableSpan = resizeState.startUpperHeight + resizeState.startLowerHeight;
      const maxControlled = Math.max(MIN_CONTROLLED_HEIGHT, totalResizableSpan - MIN_PRIMARY_HEIGHT);
      const nextHeight = Math.max(
        MIN_CONTROLLED_HEIGHT,
        Math.min(maxControlled, Math.round(requestedHeight)),
      );

      return {
        paneId: controlledPane.id,
        nextHeight: this.normalizePreferredHeight(nextHeight),
      };
    },
  };
}
