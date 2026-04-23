import {
  resolvePaneResizeBlockFromState,
  resolvePaneResizeBlockSnapshot,
  resolvePaneResizeGroupFromBlock,
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

export type PaneResizeBlockSnapshotState = {
  controlledPaneId: string;
  blockPaneIds: readonly string[];
  startControlledHeight: number;
  startVariableSpan: number;
  minOpposingHeight: number;
};

export type PaneResizeInteractionState = {
  startClientY: number;
  handle: PaneResizeHandle;
};

export type PaneResizeHandle = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  block: PaneResizeBlockSnapshotState;
};

type PaneResizeStateLike = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  controlledPaneId: string;
  blockPaneIds: readonly string[];
};

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;

export function createChartPaneResizeBlockOwner() {
  return {
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

    resolvePaneResizeBlockSnapshot(
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

    resolvePaneResizeState(
      upperPaneId: string,
      lowerPaneId: string,
      startClientY: number,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
        paneFrames(): readonly PaneFrameLike[];
      },
    ): PaneResizeInteractionState | null {
      const handle = this.resolvePaneResizeHandle(upperPaneId, lowerPaneId, deps);
      if (handle === null) {
        return null;
      }
      return {
        startClientY,
        handle,
      };
    },

    resolvePaneResizeHandle(
      upperPaneId: string,
      lowerPaneId: string,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
        paneFrames(): readonly PaneFrameLike[];
      },
    ): PaneResizeHandle | null {
      const controlledPaneId = this.resolveControlledPaneId(upperPaneId, lowerPaneId, deps);
      if (controlledPaneId === null) {
        return null;
      }
      const block = this.resolvePaneResizeBlockSnapshot(upperPaneId, lowerPaneId, controlledPaneId, deps);
      if (block === null) {
        return null;
      }
      return {
        dividerAfterPaneId: upperPaneId,
        dividerBeforePaneId: lowerPaneId,
        block,
      };
    },

    resolvePaneResizeGroup(
      resizeState: PaneResizeInteractionState,
      deps: {
        listPanes(): readonly PaneLike[];
      },
    ) {
      const resizeBlock = resolvePaneResizeBlockFromState(deps.listPanes(), {
        dividerAfterPaneId: resizeState.handle.dividerAfterPaneId,
        dividerBeforePaneId: resizeState.handle.dividerBeforePaneId,
        controlledPaneId: resizeState.handle.block.controlledPaneId,
        blockPaneIds: resizeState.handle.block.blockPaneIds,
      });
      return resizeBlock === null ? null : resolvePaneResizeGroupFromBlock(resizeBlock);
    },

    resolveControlledResizeHeight(
      deltaY: number,
      resizeHandle: PaneResizeHandle | null,
      deps: {
        getPaneById(paneId: string): PaneLike | undefined;
        listPanes(): readonly PaneLike[];
        normalizeHeight(height: number): number;
      },
    ): { paneId: string; nextHeight: number } | null {
      if (resizeHandle === null) {
        return null;
      }

      const delta = Math.round(deltaY);
      const resizeGroup = this.resolvePaneResizeGroup(
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
        nextHeight: deps.normalizeHeight(nextHeight),
      };
    },
  };
}
