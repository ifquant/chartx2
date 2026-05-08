type DrawingLike<Api = unknown> = {
  id: string;
  paneId: string;
  api: Api;
};

type DrawingRegistryLike<Drawing extends DrawingLike> = {
  list(): readonly Drawing[];
  listByPane(paneId: string): readonly Drawing[];
  removeByApi(api: Drawing["api"]): Drawing | undefined;
};

export function getDrawingById<Drawing extends DrawingLike>(
  drawingId: string,
  deps: {
    listDrawings(): readonly Drawing[];
  },
): Drawing | undefined {
  return deps.listDrawings().find((drawing) => drawing.id === drawingId);
}

export function listAllDrawings<Drawing extends DrawingLike>(
  deps: {
    listDrawings(): readonly Drawing[];
  },
): readonly Drawing[] {
  return deps.listDrawings();
}

export function listDrawingsByPane<Drawing extends DrawingLike>(
  paneId: string,
  deps: {
    listByPane(nextPaneId: string): readonly Drawing[];
  },
): readonly Drawing[] {
  return deps.listByPane(paneId);
}

export function getDrawingCountForPane<Drawing extends DrawingLike>(
  paneId: string,
  deps: {
    listByPane(nextPaneId: string): readonly Drawing[];
  },
): number {
  return deps.listByPane(paneId).length;
}

export function clearDrawingRegistry<Drawing extends DrawingLike>(
  deps: {
    listDrawings(): readonly Drawing[];
    removeByApi(api: Drawing["api"]): Drawing | undefined;
  },
): void {
  for (const drawing of deps.listDrawings()) {
    deps.removeByApi(drawing.api);
  }
}
