import { describe, expect, it } from "vitest";

import {
  buildPrimaryPaneDecorations,
  buildSecondaryPaneDecorations,
  collectPanePriceLines,
  selectPaneDrawingSnapGuide,
} from "../../src/lib/chartx/internal/views/chart-pane-decorations";

describe("chart pane decorations use-case", () => {
  it("merges source price lines with visible horizontal line drawings", () => {
    const lines = collectPanePriceLines({
      sources: [
        {
          priceLines: new Map([
            ["main-open", { id: "main-open", price: 1, color: "#111", lineWidth: 1, title: "main-open" }],
            ["shared", { id: "shared", price: 2, color: "#222", lineWidth: 1, title: "shared" }],
          ]),
        },
        {
          priceLines: new Map([
            ["study-line", { id: "study-line", price: 3, color: "#333", lineWidth: 1, title: "study-line" }],
          ]),
        },
      ],
      drawings: [
        { visible: false, kind: "horizontal-line" as const, line: { id: "hidden", price: 4, color: "#444", lineWidth: 1, title: "hidden" } },
        { visible: true, kind: "trend-line" as const },
        { visible: true, kind: "horizontal-line" as const, line: { id: "shared", price: 9, color: "#999", lineWidth: 1, title: "shared" } },
      ],
    });

    expect(Array.from(lines.keys())).toEqual(["main-open", "shared", "study-line"]);
    expect(lines.get("shared")).toEqual({ id: "shared", price: 9, color: "#999", lineWidth: 1, title: "shared" });
  });

  it("returns the pane-local snap guide only when the pane ids match", () => {
    expect(
      selectPaneDrawingSnapGuide("primary", { paneId: "primary", price: 12 }),
    ).toEqual({ paneId: "primary", price: 12 });
    expect(
      selectPaneDrawingSnapGuide("pane-2", { paneId: "pane-1", price: 12 }),
    ).toBeNull();
    expect(selectPaneDrawingSnapGuide("pane-2", null)).toBeNull();
  });

  it("builds primary pane decorations from shared pane visuals", () => {
    const sharedDrawings = [
      { visible: true, kind: "horizontal-line" as const, line: { id: "d1", price: 1, color: "#222", lineWidth: 1, title: "d1" } },
    ];

    const state = buildPrimaryPaneDecorations({
      sources: [
        {
          priceLines: new Map([["main", { id: "main", price: 1, color: "#111", lineWidth: 1, title: "main" }]]),
        },
      ],
      drawings: sharedDrawings,
      drawingSnapGuide: { paneId: "primary", price: 12 },
      tradeLocationState: { id: "trade-1" },
    });

    expect(Array.from(state.priceLines.keys())).toEqual(["main", "d1"]);
    expect(state.drawings).toBe(sharedDrawings);
    expect(state.snapGuide).toEqual({ paneId: "primary", price: 12 });
    expect(state.tradeLocationState).toEqual({ id: "trade-1" });
  });

  it("builds secondary pane decorations with pane-scoped snap guide selection", () => {
    const sharedDrawings = [
      { visible: true, kind: "horizontal-line" as const, line: { id: "d1", price: 1, color: "#222", lineWidth: 1, title: "d1" } },
    ];

    const state = buildSecondaryPaneDecorations({
      paneId: "pane-2",
      sources: [
        {
          priceLines: new Map([["series", { id: "series", price: 1, color: "#111", lineWidth: 1, title: "series" }]]),
        },
      ],
      drawings: sharedDrawings,
      drawingSnapGuide: { paneId: "pane-1", price: 12 },
    });

    expect(Array.from(state.priceLines.keys())).toEqual(["series", "d1"]);
    expect(state.drawings).toBe(sharedDrawings);
    expect(state.snapGuide).toBeNull();
  });
});
