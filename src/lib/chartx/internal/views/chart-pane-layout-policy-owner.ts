import {
  normalizePaneHeight,
} from "../model";
import {
  createChartPaneResizeBlockOwner,
  type PaneResizeHandle,
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

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;
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
      resizeHandle: PaneResizeHandle | null,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
      },
    ): { paneId: string; nextHeight: number } | null {
      if (resizeHandle === null) {
        return null;
      }

      const delta = Math.round(deltaY);
      const resizeGroup = paneResizeBlockOwner.resolvePaneResizeGroup(
        { startClientY: 0, handle: resizeHandle },
        deps,
      );
      if (resizeGroup === null) {
        return null;
      }
      const controlledPane = deps.getPaneById(resizeGroup.controlledPaneId);
      if (controlledPane === undefined || controlledPane.kind !== "secondary" || !controlledPane.resizable) {
        return null;
      }
      const controlsUpperPane = resizeGroup.variablePaneIds[0] === controlledPane.id;

      const requestedHeight = controlsUpperPane
        ? resizeHandle.block.startControlledHeight + delta
        : resizeHandle.block.startControlledHeight - delta;
      const maxControlled =
        Math.max(
          MIN_CONTROLLED_HEIGHT,
          resizeHandle.block.startVariableSpan - resizeHandle.block.minOpposingHeight,
        );
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
