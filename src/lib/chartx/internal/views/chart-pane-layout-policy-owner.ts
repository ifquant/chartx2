import {
  normalizePaneHeight,
} from "../model";
import { createChartPaneResizeBlockOwner } from "./chart-pane-resize-block-owner";

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

type PaneResizeStateLike = {
  startClientY: number;
  handle: {
    dividerAfterPaneId: string;
    dividerBeforePaneId: string;
    block: {
      controlledPaneId: string;
      blockPaneIds: readonly string[];
      startControlledHeight: number;
      startVariableSpan: number;
      minOpposingHeight: number;
    };
  };
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
      clientY: number,
      resizeState: PaneResizeStateLike | null,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
      },
    ): { paneId: string; nextHeight: number } | null {
      if (resizeState === null) {
        return null;
      }

      const delta = Math.round(clientY - resizeState.startClientY);
      const resizeGroup = paneResizeBlockOwner.resolvePaneResizeGroup(resizeState, deps);
      if (resizeGroup === null) {
        return null;
      }
      const controlledPane = deps.getPaneById(resizeGroup.controlledPaneId);
      if (controlledPane === undefined || controlledPane.kind !== "secondary" || !controlledPane.resizable) {
        return null;
      }
      const controlsUpperPane = resizeGroup.variablePaneIds[0] === controlledPane.id;

      const requestedHeight = controlsUpperPane
        ? resizeState.handle.block.startControlledHeight + delta
        : resizeState.handle.block.startControlledHeight - delta;
      const maxControlled =
        Math.max(
          MIN_CONTROLLED_HEIGHT,
          resizeState.handle.block.startVariableSpan - resizeState.handle.block.minOpposingHeight,
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
