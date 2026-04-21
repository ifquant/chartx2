import { describe, expect, it } from "vitest";

import { DRAWING_PROPERTY_SCHEMAS } from "../../src/lib/chartx/internal/views/chart-drawing-property-schema";

describe("chart drawing property schema", () => {
  it("exposes pane drawing schemas with magnet controls", () => {
    expect(DRAWING_PROPERTY_SCHEMAS["horizontal-line"].sections.map((section) => section.id)).toEqual([
      "appearance",
      "geometry",
      "magnet",
    ]);
    expect(DRAWING_PROPERTY_SCHEMAS["trend-line"].sections.map((section) => section.id)).toEqual([
      "appearance",
      "geometry",
      "magnet",
    ]);

    const magnetFields = DRAWING_PROPERTY_SCHEMAS["trend-line"].sections
      .find((section) => section.id === "magnet")
      ?.fields.map((field) => field.key);

    expect(magnetFields).toContain("magnetSources.close");
    expect(magnetFields).toContain("timeMagnetPolicy");
  });
});
