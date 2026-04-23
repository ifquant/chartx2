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
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  startClientY: number;
  block: PaneResizeBlockSnapshotState;
};

type PaneResizeStateLike = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  controlledPaneId: string;
  blockPaneIds: readonly string[];
};

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
        startClientY,
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
        dividerAfterPaneId: resizeState.dividerAfterPaneId,
        dividerBeforePaneId: resizeState.dividerBeforePaneId,
        controlledPaneId: resizeState.block.controlledPaneId,
        blockPaneIds: resizeState.block.blockPaneIds,
      });
      return resizeBlock === null ? null : resolvePaneResizeGroupFromBlock(resizeBlock);
    },
  };
}
