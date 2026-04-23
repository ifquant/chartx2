import {
  MIN_PRIMARY_PANE_HEIGHT,
  normalizePaneHeight,
  resolvePaneFrameAllocation,
} from "./pane-frame-policy";
import { resolvePaneResizeTargetId } from "./pane-linked-resize-policy";

export type PaneKind = "primary" | "secondary";

export type PaneModelState = {
  id: string;
  kind: PaneKind;
  preferredHeight: number | null;
  resizable: boolean;
};

export type PaneFrame = {
  id: string;
  kind: PaneKind;
  top: number;
  height: number;
};

export type PaneDivider = {
  upperPaneId: string;
  lowerPaneId: string;
  upperHeight: number;
  lowerHeight: number;
  position: number;
};

export class PaneCollection {
  private readonly panes: PaneModelState[] = [
    { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
  ];
  private nextPaneId = 1;

  public list(): readonly PaneModelState[] {
    return this.panes;
  }

  public addSecondaryPane(options: { height?: number; resizable?: boolean } = {}): PaneModelState {
    const pane: PaneModelState = {
      id: `pane-${this.nextPaneId}`,
      kind: "secondary",
      preferredHeight: normalizePaneHeight(options.height),
      resizable: options.resizable ?? true,
    };
    this.nextPaneId += 1;
    this.panes.push(pane);
    return pane;
  }

  public getById(id: string): PaneModelState | undefined {
    return this.panes.find((pane) => pane.id === id);
  }

  public getByIndex(index: number): PaneModelState | undefined {
    return this.panes[index];
  }

  public getIndex(id: string): number {
    return this.panes.findIndex((pane) => pane.id === id);
  }

  public removeById(id: string): PaneModelState | undefined {
    const index = this.getIndex(id);
    if (index === -1) {
      return undefined;
    }
    const [removed] = this.panes.splice(index, 1);
    return removed;
  }
}

export function buildPaneFrames(
  panes: readonly PaneModelState[],
  plotHeight: number,
  gap: number,
): PaneFrame[] {
  if (panes.length === 0) {
    return [];
  }

  const { effectiveGap, primaryHeight, secondaryHeights } = resolvePaneFrameAllocation(
    panes,
    plotHeight,
    gap,
  );

  const frames: PaneFrame[] = [];
  let top = 0;
  for (const pane of panes) {
    const height =
      pane.kind === "primary"
        ? primaryHeight
        : secondaryHeights.get(pane.id) ?? normalizePaneHeight(undefined);
    frames.push({
      id: pane.id,
      kind: pane.kind,
      top,
      height,
    });
    top += height + effectiveGap;
  }

  if (frames.length > 0) {
    const last = frames[frames.length - 1];
    last.height = Math.max(48, plotHeight - last.top);
  }

  return frames;
}

export function resolvePaneDivider(
  paneSpecs: readonly PaneModelState[],
  panes: readonly PaneFrame[],
  y: number | null,
  gap: number,
  hitSlop: number,
): PaneDivider | null {
  if (y === null) {
    return null;
  }

  for (let index = 0; index < panes.length - 1; index += 1) {
    const upper = panes[index];
    const lower = panes[index + 1];
    const canResize = resolvePaneResizeTargetId(paneSpecs, upper.id, lower.id) !== null;
    if (!canResize) {
      continue;
    }
    const dividerPosition = upper.top + upper.height + gap / 2;
    if (Math.abs(y - dividerPosition) <= hitSlop) {
      return {
        upperPaneId: upper.id,
        lowerPaneId: lower.id,
        upperHeight: upper.height,
        lowerHeight: lower.height,
        position: dividerPosition,
      };
    }
  }

  return null;
}

export function resolvePaneDividerByIds(
  panes: readonly PaneFrame[],
  upperPaneId: string,
  lowerPaneId: string,
  gap: number,
): PaneDivider | null {
  const upper = panes.find((pane) => pane.id === upperPaneId);
  const lower = panes.find((pane) => pane.id === lowerPaneId);
  if (upper === undefined || lower === undefined) {
    return null;
  }

  return {
    upperPaneId,
    lowerPaneId,
    upperHeight: upper.height,
    lowerHeight: lower.height,
    position: upper.top + upper.height + gap / 2,
  };
}
