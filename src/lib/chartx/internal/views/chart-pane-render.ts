export function renderPrimaryPaneContent<Source, Rows, Drawing>(
  deps: {
    hasPrimaryData: boolean;
    mainSourceExists: boolean;
    primarySources: readonly Source[];
    primaryRowsFor(source: Source): Rows;
    renderSeries(source: Source, rows: Rows): void;
    drawPriceLines(): void;
    drawDrawings(drawings: readonly Drawing[]): void;
    primaryDrawings: readonly Drawing[];
    drawTradeLocationOverlay(): void;
    drawDrawingSnapGuide(): void;
    drawMarkers(source: Source, rows: Rows): void;
  },
): void {
  if (!deps.hasPrimaryData || !deps.mainSourceExists) {
    return;
  }

  for (const source of deps.primarySources) {
    deps.renderSeries(source, deps.primaryRowsFor(source));
  }

  deps.drawPriceLines();
  deps.drawDrawings(deps.primaryDrawings);
  deps.drawTradeLocationOverlay();
  deps.drawDrawingSnapGuide();

  for (const source of deps.primarySources) {
    deps.drawMarkers(source, deps.primaryRowsFor(source));
  }
}

export function renderSecondaryPaneContent<Source, Rows, Drawing>(
  deps: {
    paneSeries: readonly Source[];
    hasPriceScale: boolean;
    rowsFor(source: Source): Rows | undefined;
    hasRows(rows: Rows | undefined): boolean;
    applyPriceScaleRange(): void;
    renderSeries(source: Source, rows: Rows): void;
    drawPriceLines(): void;
    drawDrawings(drawings: readonly Drawing[]): void;
    paneDrawings: readonly Drawing[];
    drawDrawingSnapGuide(): void;
    drawMarkers(source: Source, rows: Rows): void;
  },
): void {
  if (deps.hasPriceScale) {
    deps.applyPriceScaleRange();
  }

  for (const source of deps.paneSeries) {
    const rows = deps.rowsFor(source);
    if (!deps.hasRows(rows)) {
      continue;
    }
    deps.renderSeries(source, rows as Rows);
  }

  if (deps.hasPriceScale) {
    deps.drawPriceLines();
    deps.drawDrawings(deps.paneDrawings);
    deps.drawDrawingSnapGuide();
  }

  for (const source of deps.paneSeries) {
    const rows = deps.rowsFor(source);
    if (!deps.hasRows(rows)) {
      continue;
    }
    deps.drawMarkers(source, rows as Rows);
  }
}
