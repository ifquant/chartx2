import { describe, expect, it } from "vitest";

import {
  collectPanePriceLines,
  selectPaneDrawingSnapGuide,
} from "../../src/lib/chartx/internal/views/chart-pane-decorations";

describe("chart pane decorations use-case", () => {
  it("merges source price lines with visible horizontal line drawings", () => {
    const lines = collectPanePriceLines({
      sources: [
        {
          priceLines: new Map([
            ["main-open", { id: "main-open", color: "#111" }],
            ["shared", { id: "shared", color: "#222" }],
          ]),
        },
        {
          priceLines: new Map([
            ["study-line", { id: "study-line", color: "#333" }],
          ]),
        },
      ],
      drawings: [
        { visible: false, kind: "horizontal-line" as const, line: { id: "hidden", color: "#444" } },
        { visible: true, kind: "trend-line" as const },
        { visible: true, kind: "horizontal-line" as const, line: { id: "shared", color: "#999" } },
      ],
    });

    expect(Array.from(lines.keys())).toEqual(["main-open", "shared", "study-line"]);
    expect(lines.get("shared")).toEqual({ id: "shared", color: "#999" });
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
});
