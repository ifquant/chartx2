type PriceLineState = {
  id: string;
};

type SourceWithPriceLines<Line extends PriceLineState> = {
  priceLines: ReadonlyMap<string, Line>;
};

type HorizontalLineDrawing<Line extends PriceLineState> = {
  visible: boolean;
  kind: "horizontal-line";
  line: Line;
};

type OtherDrawing = {
  visible: boolean;
  kind: string;
};

type DrawingSnapGuideState = {
  paneId: string;
};

export function collectPanePriceLines<
  Line extends PriceLineState,
  Source extends SourceWithPriceLines<Line>,
  Drawing extends HorizontalLineDrawing<Line> | OtherDrawing,
>(
  params: {
    sources: readonly Source[];
    drawings: readonly Drawing[];
  },
): Map<string, Line> {
  const lines = new Map<string, Line>();

  for (const source of params.sources) {
    for (const [lineId, line] of source.priceLines.entries()) {
      lines.set(lineId, line);
    }
  }

  for (const drawing of params.drawings) {
    if (isVisibleHorizontalLineDrawing(drawing)) {
      lines.set(drawing.line.id, drawing.line);
    }
  }

  return lines;
}

export function selectPaneDrawingSnapGuide<Guide extends DrawingSnapGuideState>(
  paneId: string,
  guide: Guide | null,
): Guide | null {
  return guide?.paneId === paneId ? guide : null;
}

function isVisibleHorizontalLineDrawing<Line extends PriceLineState>(
  drawing: HorizontalLineDrawing<Line> | OtherDrawing,
): drawing is HorizontalLineDrawing<Line> {
  return drawing.visible && drawing.kind === "horizontal-line";
}
