type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
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

export function buildPrimaryPaneDecorations<
  Line extends PriceLineState,
  Source extends SourceWithPriceLines<Line>,
  Drawing extends HorizontalLineDrawing<Line> | OtherDrawing,
  Guide extends DrawingSnapGuideState,
  TradeState,
>(params: {
  sources: readonly Source[];
  drawings: readonly Drawing[];
  drawingSnapGuide: Guide | null;
  tradeLocationState: TradeState | null;
}): {
  priceLines: Map<string, Line>;
  drawings: readonly Drawing[];
  snapGuide: Guide | null;
  tradeLocationState: TradeState | null;
} {
  return {
    priceLines: collectPanePriceLines({
      sources: params.sources,
      drawings: params.drawings,
    }),
    drawings: params.drawings,
    snapGuide: selectPaneDrawingSnapGuide("primary", params.drawingSnapGuide),
    tradeLocationState: params.tradeLocationState,
  };
}

export function buildSecondaryPaneDecorations<
  Line extends PriceLineState,
  Source extends SourceWithPriceLines<Line>,
  Drawing extends HorizontalLineDrawing<Line> | OtherDrawing,
  Guide extends DrawingSnapGuideState,
>(params: {
  paneId: string;
  sources: readonly Source[];
  drawings: readonly Drawing[];
  drawingSnapGuide: Guide | null;
}): {
  priceLines: Map<string, Line>;
  drawings: readonly Drawing[];
  snapGuide: Guide | null;
} {
  return {
    priceLines: collectPanePriceLines({
      sources: params.sources,
      drawings: params.drawings,
    }),
    drawings: params.drawings,
    snapGuide: selectPaneDrawingSnapGuide(params.paneId, params.drawingSnapGuide),
  };
}

function isVisibleHorizontalLineDrawing<Line extends PriceLineState>(
  drawing: HorizontalLineDrawing<Line> | OtherDrawing,
): drawing is HorizontalLineDrawing<Line> {
  return drawing.visible && drawing.kind === "horizontal-line";
}
