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

    resolvePaneResizeGroup(
      resizeState: PaneResizeStateLike,
      deps: {
        listPanes(): readonly PaneLike[];
      },
    ) {
      const resizeBlock = resolvePaneResizeBlockFromState(deps.listPanes(), resizeState);
      return resizeBlock === null ? null : resolvePaneResizeGroupFromBlock(resizeBlock);
    },
  };
}
