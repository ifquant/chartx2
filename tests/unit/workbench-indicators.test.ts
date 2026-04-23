import { describe, expect, it } from "vitest";

import {
  getWorkbenchIndicatorCatalogEntry,
  WORKBENCH_INDICATOR_CATALOG,
} from "../../src/lib/chartx/public/workbench-indicators";

describe("workbench indicator catalog", () => {
  it("exposes the default catalog in deterministic order", () => {
    expect(WORKBENCH_INDICATOR_CATALOG.map((entry) => entry.id)).toEqual([
      "moving-average",
      "compare",
      "overlay-line",
    ]);
    expect(WORKBENCH_INDICATOR_CATALOG.map((entry) => entry.enabled)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("looks up entries by id", () => {
    expect(getWorkbenchIndicatorCatalogEntry("compare")).toEqual({
      id: "compare",
      label: "Compare",
      shortLabel: "Compare",
      description: "Overlay a comparison series on the main chart.",
      family: "comparison",
      placement: "overlay",
      engineKind: "compare",
      enabled: true,
    });
  });

  it("returns null for unknown ids", () => {
    expect(getWorkbenchIndicatorCatalogEntry("unknown")).toBeNull();
  });

  it("includes the required metadata for every catalog entry", () => {
    for (const entry of WORKBENCH_INDICATOR_CATALOG) {
      expect(entry.label).toEqual(expect.any(String));
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.shortLabel).toEqual(expect.any(String));
      expect(entry.shortLabel.length).toBeGreaterThan(0);
      expect(entry.description).toEqual(expect.any(String));
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.family).toMatch(/^(trend|comparison|overlay)$/);
      expect(entry.placement).toMatch(/^(overlay|separate-pane)$/);
      expect(entry.engineKind).toMatch(/^(moving-average|compare|overlay)$/);
      expect(entry.enabled).toBe(true);
    }
  });

  it("maps catalog entries to the expected controller dispatch targets", () => {
    expect(
      WORKBENCH_INDICATOR_CATALOG.map((entry) => ({
        id: entry.id,
        engineKind: entry.engineKind,
        placement: entry.placement,
      })),
    ).toEqual([
      {
        id: "moving-average",
        engineKind: "moving-average",
        placement: "separate-pane",
      },
      {
        id: "compare",
        engineKind: "compare",
        placement: "overlay",
      },
      {
        id: "overlay-line",
        engineKind: "overlay",
        placement: "overlay",
      },
    ]);
  });
});
