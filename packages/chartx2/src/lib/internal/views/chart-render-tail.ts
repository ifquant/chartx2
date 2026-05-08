type PanePoint = {
  x: number;
  y: number;
};

export function finishChartRender<Rows, Readout>(
  params: {
    primaryRows: Rows;
    firstSecondaryRows: Rows | undefined;
    hasRows(rows: Rows | undefined): boolean;
    renderTimeAxis(rows: Rows): void;
    buildReadout(): Readout;
    publishReadout(readout: Readout): void;
    publishCrosshairMove(readout: Readout): void;
  },
): Readout {
  const axisRows = params.hasRows(params.primaryRows)
    ? params.primaryRows
    : params.firstSecondaryRows;
  if (axisRows !== undefined && params.hasRows(axisRows)) {
    params.renderTimeAxis(axisRows);
  }

  const readout = params.buildReadout();
  params.publishReadout(readout);
  params.publishCrosshairMove(readout);
  return readout;
}

export function buildCrosshairMoveEvent<Readout extends object>(
  readout: Readout,
  crosshair: PanePoint | null,
): Readout & {
  point: PanePoint | null;
} {
  return {
    ...readout,
    point:
      crosshair === null
        ? null
        : {
            x: crosshair.x,
            y: crosshair.y,
          },
  };
}

export function emitReadoutEvent<Readout>(
  canvas: { dispatchEvent(event: Event): boolean },
  detail: Readout,
): void {
  canvas.dispatchEvent(
    new CustomEvent<Readout>("chartx:readout", {
      detail,
    }),
  );
}
