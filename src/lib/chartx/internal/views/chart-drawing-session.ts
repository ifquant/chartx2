import type { DrawingRegistry } from "../model";

import type { PhaseOneSelectedDrawing } from "./chart-harness";

type DrawingLike<Api> = {
  id: string;
  kind: "horizontal-line" | "trend-line";
  paneId: string;
  visible: boolean;
  api: Api;
};

export function requireDrawingByApi<Api, Drawing extends DrawingLike<Api>>(
  api: Api,
  registry: Pick<DrawingRegistry<string, Api, Drawing>, "getByApi">,
): Drawing {
  const drawing = registry.getByApi(api);
  if (drawing === undefined) {
    throw new Error("chartx phase-one drawing has been removed");
  }
  return drawing;
}

export function buildSelectedDrawingState<Drawing extends DrawingLike<unknown>>(
  selectedDrawingId: string | null,
  deps: {
    getById(id: string): Drawing | undefined;
    getPaneIndex(paneId: string): number;
  },
): PhaseOneSelectedDrawing {
  if (selectedDrawingId === null) {
    return null;
  }

  const drawing = deps.getById(selectedDrawingId);
  if (drawing === undefined) {
    return null;
  }

  return {
    id: drawing.id,
    kind: drawing.kind,
    paneIndex: drawing.paneId === "primary" ? 0 : deps.getPaneIndex(drawing.paneId),
  };
}

export function selectDrawing<Drawing extends DrawingLike<unknown>>(
  params: {
    selectedDrawingId: string | null;
    nextId: string | null;
    shouldRender: boolean;
    getById(id: string): Drawing | undefined;
    getPaneIndex(paneId: string): number;
    notifySelectionChange(selection: PhaseOneSelectedDrawing): void;
    render(): void;
  },
): string | null {
  const resolvedNextId =
    params.nextId !== null && params.getById(params.nextId) !== undefined ? params.nextId : null;
  if (params.selectedDrawingId === resolvedNextId) {
    return params.selectedDrawingId;
  }

  const selection = buildSelectedDrawingState(resolvedNextId, {
    getById: params.getById,
    getPaneIndex: params.getPaneIndex,
  });
  params.notifySelectionChange(selection);
  if (params.shouldRender) {
    params.render();
  }
  return resolvedNextId;
}

export function removeDrawing<Api, Drawing extends DrawingLike<Api>>(
  params: {
    api: Api;
    selectedDrawingId: string | null;
    registry: Pick<DrawingRegistry<string, Api, Drawing>, "removeByApi">;
    clearSelection(shouldRender: boolean): void;
    render(): void;
  },
): void {
  const removed = params.registry.removeByApi(params.api);
  if (removed === undefined) {
    throw new Error("chartx phase-one drawing has been removed");
  }
  if (params.selectedDrawingId === removed.id) {
    params.clearSelection(false);
  }
  params.render();
}

export function removeSelectedDrawing<Drawing extends DrawingLike<unknown>>(
  params: {
    selectedDrawingId: string | null;
    getById(id: string): Drawing | undefined;
    clearSelection(shouldRender: boolean): void;
    removeByApi(api: Drawing["api"]): void;
    render(): void;
  },
): void {
  if (params.selectedDrawingId === null) {
    return;
  }

  const drawing = params.getById(params.selectedDrawingId);
  if (drawing === undefined) {
    params.clearSelection(false);
    params.render();
    return;
  }

  params.removeByApi(drawing.api);
}
