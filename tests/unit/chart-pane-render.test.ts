import { describe, expect, it } from "vitest";

import {
  renderPrimaryPaneContent,
  renderSecondaryPaneContent,
} from "../../src/lib/chartx/internal/views/chart-pane-render";

describe("chart pane render use-case", () => {
  it("renders primary-pane content in the expected order", () => {
    const calls: string[] = [];
    const sources = ["main", "overlay"];

    renderPrimaryPaneContent({
      hasPrimaryData: true,
      mainSourceExists: true,
      primarySources: sources,
      primaryRowsFor: (source) => `${source}-rows`,
      renderSeries: (source, rows) => calls.push(`series:${source}:${rows}`),
      drawPriceLines: () => calls.push("price-lines"),
      drawDrawings: (drawings) => calls.push(`drawings:${drawings.join(",")}`),
      primaryDrawings: ["d1", "d2"],
      drawTradeLocationOverlay: () => calls.push("trade-overlay"),
      drawDrawingSnapGuide: () => calls.push("snap-guide"),
      drawMarkers: (source, rows) => calls.push(`markers:${source}:${rows}`),
    });

    expect(calls).toEqual([
      "series:main:main-rows",
      "series:overlay:overlay-rows",
      "price-lines",
      "drawings:d1,d2",
      "trade-overlay",
      "snap-guide",
      "markers:main:main-rows",
      "markers:overlay:overlay-rows",
    ]);
  });

  it("renders secondary-pane content only for sources with rows and only draws overlays when a price scale exists", () => {
    const calls: string[] = [];
    const paneSeries = ["s1", "s2", "s3"];

    renderSecondaryPaneContent({
      paneSeries,
      hasPriceScale: true,
      rowsFor: (source) => (source === "s2" ? undefined : `${source}-rows`),
      hasRows: (rows) => rows !== undefined,
      applyPriceScaleRange: () => calls.push("apply-scale"),
      renderSeries: (source, rows) => calls.push(`series:${source}:${rows}`),
      drawPriceLines: () => calls.push("price-lines"),
      drawDrawings: (drawings) => calls.push(`drawings:${drawings.join(",")}`),
      paneDrawings: ["d1"],
      drawDrawingSnapGuide: () => calls.push("snap-guide"),
      drawMarkers: (source, rows) => calls.push(`markers:${source}:${rows}`),
    });

    expect(calls).toEqual([
      "apply-scale",
      "series:s1:s1-rows",
      "series:s3:s3-rows",
      "price-lines",
      "drawings:d1",
      "snap-guide",
      "markers:s1:s1-rows",
      "markers:s3:s3-rows",
    ]);
  });

  it("skips secondary overlays when no price scale is available", () => {
    const calls: string[] = [];

    renderSecondaryPaneContent({
      paneSeries: ["only"],
      hasPriceScale: false,
      rowsFor: () => "rows",
      hasRows: () => true,
      applyPriceScaleRange: () => calls.push("apply-scale"),
      renderSeries: (_source, rows) => calls.push(`series:${rows}`),
      drawPriceLines: () => calls.push("price-lines"),
      drawDrawings: () => calls.push("drawings"),
      paneDrawings: ["d1"],
      drawDrawingSnapGuide: () => calls.push("snap-guide"),
      drawMarkers: (_source, rows) => calls.push(`markers:${rows}`),
    });

    expect(calls).toEqual([
      "series:rows",
      "markers:rows",
    ]);
  });
});
