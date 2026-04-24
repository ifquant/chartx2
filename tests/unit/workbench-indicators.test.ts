import { describe, expect, it } from "vitest";

import {
  createWorkbenchIndicatorCatalog,
  getWorkbenchIndicatorCatalogEntry,
  WORKBENCH_INDICATOR_CATALOG,
} from "../../src/lib/chartx/public/workbench-indicators";
import { createWorkbenchCustomScriptDefinition } from "../../src/lib/chartx/public/workbench-scripts";

describe("workbench indicator catalog", () => {
  it("exposes the default catalog in deterministic order", () => {
    expect(WORKBENCH_INDICATOR_CATALOG.map((entry) => entry.id)).toEqual([
      "moving-average",
      "compare",
      "overlay-line",
      "scripted-close-sma",
      "scripted-hlc3-sma",
    ]);
    expect(WORKBENCH_INDICATOR_CATALOG.map((entry) => entry.enabled)).toEqual([
      true,
      true,
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
      expect(entry.family).toMatch(/^(trend|comparison|overlay|script)$/);
      expect(entry.placement).toMatch(/^(overlay|separate-pane)$/);
      expect(entry.engineKind).toMatch(/^(moving-average|compare|overlay|script)$/);
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
      {
        id: "scripted-close-sma",
        engineKind: "script",
        placement: "separate-pane",
      },
      {
        id: "scripted-hlc3-sma",
        engineKind: "script",
        placement: "separate-pane",
      },
    ]);
  });

  it("publishes script metadata for scripted catalog entries", () => {
    expect(getWorkbenchIndicatorCatalogEntry("scripted-close-sma")).toEqual({
      id: "scripted-close-sma",
      label: "Scripted SMA 20",
      shortLabel: "Script SMA",
      description: "Execute a sandboxed close-price SMA script in a separate indicator pane.",
      family: "script",
      placement: "separate-pane",
      engineKind: "script",
      enabled: true,
      scriptId: "close-sma-20-v0",
      scriptInputs: [
        {
          id: "length",
          label: "Length",
          min: 2,
          max: 60,
          step: 1,
          defaultValue: 20,
        },
      ],
      source: "builtin",
    });
    expect(getWorkbenchIndicatorCatalogEntry("scripted-hlc3-sma")).toEqual({
      id: "scripted-hlc3-sma",
      label: "Scripted HLC3 SMA 10",
      shortLabel: "HLC3 SMA",
      description: "Execute a sandboxed HLC3 SMA script in a separate indicator pane.",
      family: "script",
      placement: "separate-pane",
      engineKind: "script",
      enabled: true,
      scriptId: "hlc3-sma-10-v0",
      scriptInputs: [
        {
          id: "length",
          label: "Length",
          min: 2,
          max: 60,
          step: 1,
          defaultValue: 10,
        },
      ],
      source: "builtin",
    });
  });

  it("derives custom scripted catalog entries from the saved script library", () => {
    const catalog = createWorkbenchIndicatorCatalog([
      createWorkbenchCustomScriptDefinition("custom-script-1", {
        label: "My Close SMA",
        shortLabel: "My SMA",
        description: "Saved close-price SMA.",
        field: "close",
        placement: "separate-pane",
        defaultLength: 9,
      }),
    ]);

    expect(catalog.at(-1)).toEqual({
      id: "script-library:custom-script-1",
      label: "My Close SMA",
      shortLabel: "My SMA",
      description: "Saved close-price SMA.",
      family: "script",
      placement: "separate-pane",
      engineKind: "script",
      enabled: true,
      scriptId: "custom-script-1",
      scriptInputs: [
        {
          id: "length",
          label: "Length",
          min: 2,
          max: 60,
          step: 1,
          defaultValue: 9,
        },
      ],
      source: "custom",
    });
  });
});
