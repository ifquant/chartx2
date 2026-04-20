import {
  getDrawingById,
  getDrawingCountForPane,
  listAllDrawings,
  listDrawingsByPane,
} from "./chart-drawing-accessors";
import {
  removeActiveDrawing,
  removeSelectedActiveDrawing,
  selectActiveDrawing,
} from "./chart-drawing-runtime";

type DrawingLike<Api = unknown> = {
  id: string;
  kind: "horizontal-line" | "trend-line";
  paneId: string;
  visible: boolean;
  api: Api;
};

export function getDrawingByIdRuntime<Drawing extends DrawingLike>(
  drawingId: string,
  deps: {
    listDrawings(): readonly Drawing[];
  },
): Drawing | undefined {
  return getDrawingById(drawingId, deps);
}

export function listAllDrawingsRuntime<Drawing extends DrawingLike>(
  deps: {
    listDrawings(): readonly Drawing[];
  },
): readonly Drawing[] {
  return listAllDrawings(deps);
}

export function listDrawingsByPaneRuntime<Drawing extends DrawingLike>(
  paneId: string,
  deps: {
    listByPane(nextPaneId: string): readonly Drawing[];
  },
): readonly Drawing[] {
  return listDrawingsByPane(paneId, deps);
}

export function getDrawingCountForPaneRuntime<Drawing extends DrawingLike>(
  paneId: string,
  deps: {
    listByPane(nextPaneId: string): readonly Drawing[];
  },
): number {
  return getDrawingCountForPane(paneId, deps);
}

export function selectDrawingRuntime<Drawing extends DrawingLike>(
  params: {
    selectedDrawingId: string | null;
    nextId: string | null;
    shouldRender: boolean;
    getById(id: string): Drawing | undefined;
    getPaneIndex(paneId: string): number;
    notifySelectionChange(selection: {
      id: string;
      kind: "horizontal-line" | "trend-line";
      paneIndex: number;
    } | null): void;
    render(): void;
    setSelectedDrawingId(id: string | null): void;
  },
): void {
  selectActiveDrawing(params);
}

export function removeDrawingRuntime<Api, Drawing extends DrawingLike<Api>>(
  params: {
    api: Api;
    selectedDrawingId: string | null;
    removeByApi(nextApi: Api): Drawing | undefined;
    clearSelection(shouldRender: boolean): void;
    render(): void;
  },
): void {
  removeActiveDrawing(params);
}

export function removeSelectedDrawingRuntime<Drawing extends DrawingLike>(
  params: {
    selectedDrawingId: string | null;
    getById(id: string): Drawing | undefined;
    clearSelection(shouldRender: boolean): void;
    removeByApi(api: Drawing["api"]): void;
    render(): void;
  },
): void {
  removeSelectedActiveDrawing(params);
}
