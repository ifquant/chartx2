import {
  normalizePaneHeight,
  resolvePaneResizeBlockSnapshot,
  resolvePaneResizeTargetId,
} from "../model";

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
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  controlledPaneId: string;
  startClientY: number;
  startControlledHeight: number;
  startVariableSpan: number;
  minOpposingHeight: number;
};

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;

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
      return resolvePaneResizeTargetId(deps.listPanes(), upperPaneId, lowerPaneId);
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
      return resolvePaneResizeBlockSnapshot(
        deps.listPanes(),
        deps.paneFrames(),
        upperPaneId,
        lowerPaneId,
        controlledPaneId,
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
      const upperPane = deps.getPaneById(resizeState.dividerAfterPaneId);
      const lowerPane = deps.getPaneById(resizeState.dividerBeforePaneId);
      if (upperPane === undefined || lowerPane === undefined) {
        return null;
      }

      const explicitControlledPane =
        resizeState.controlledPaneId === upperPane.id
          ? upperPane
          : resizeState.controlledPaneId === lowerPane.id
            ? lowerPane
            : null;
      const controlledPaneId =
        explicitControlledPane !== null
        && explicitControlledPane.kind === "secondary"
        && explicitControlledPane.resizable
          ? explicitControlledPane.id
          : this.resolveControlledPaneId(
            resizeState.dividerAfterPaneId,
            resizeState.dividerBeforePaneId,
            deps,
          );
      if (controlledPaneId === null) {
        return null;
      }
      const controlledPane = deps.getPaneById(controlledPaneId);
      if (controlledPane === undefined || controlledPane.kind !== "secondary" || !controlledPane.resizable) {
        return null;
      }
      const controlsUpperPane = controlledPane.id === upperPane.id;

      const requestedHeight = controlsUpperPane
        ? resizeState.startControlledHeight + delta
        : resizeState.startControlledHeight - delta;
      const maxControlled =
        Math.max(MIN_CONTROLLED_HEIGHT, resizeState.startVariableSpan - resizeState.minOpposingHeight);
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
