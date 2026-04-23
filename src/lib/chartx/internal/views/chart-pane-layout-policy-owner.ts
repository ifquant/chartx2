import {
  normalizePaneHeight,
} from "../model";
import {
  createChartPaneResizeBlockOwner,
  type PaneActiveResizeBlock,
} from "./chart-pane-resize-block-owner";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

type PaneFrameLike = {
  id: string;
  height: number;
};

const paneResizeBlockOwner = createChartPaneResizeBlockOwner();

export function createChartPaneLayoutPolicyOwner() {
  return {
    normalizePreferredHeight(height: number | undefined): number {
      return normalizePaneHeight(height);
    },

    resolveControlledPaneId(
      upperPaneId: string,
      lowerPaneId: string,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
      },
    ): string | null {
      const upperPane = deps.getPaneById(upperPaneId);
      const lowerPane = deps.getPaneById(lowerPaneId);
      if (upperPane === undefined || lowerPane === undefined) {
        return null;
      }
      return paneResizeBlockOwner.resolveControlledPaneId(upperPaneId, lowerPaneId, deps);
    },

    resolvePaneResizeBlock(
      upperPaneId: string,
      lowerPaneId: string,
      controlledPaneId: string,
      deps: {
        listPanes(): readonly PaneLike[];
        paneFrames(): readonly PaneFrameLike[];
      },
    ) {
      return paneResizeBlockOwner.resolvePaneResizeBlockSnapshot(
        upperPaneId,
        lowerPaneId,
        controlledPaneId,
        deps,
      );
    },

    resolveControlledResizeHeight(
      deltaY: number,
      activeResizeBlock: PaneActiveResizeBlock | null,
      deps: {
      },
    ): { paneId: string; nextHeight: number } | null {
      return paneResizeBlockOwner.resolveControlledResizeHeight(deltaY, activeResizeBlock, {
        normalizeHeight: (height) => this.normalizePreferredHeight(height),
      });
    },
  };
}
