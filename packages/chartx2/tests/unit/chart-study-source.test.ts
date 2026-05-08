import { describe, expect, it } from "vitest";

import { PriceScale } from "../../src/lib/internal/model";
import {
  attachStudySource,
  createStudySourceState,
} from "../../src/lib/internal/views/chart-study-source";

describe("chart study source use-case", () => {
  it("creates compare study source state with default input context and compare options", () => {
    const primaryPriceScale = new PriceScale();
    const api = { id: "compare-api" };

    const source = createStudySourceState<
      { time: number; open: number; high: number; low: number; close: number },
      typeof api,
      "line",
      { color: string },
      { color: string },
      { price: number },
      { time: number },
      { affectMainScale: boolean }
    >({
      paneId: "primary",
      kind: "line",
      api,
      meta: { id: "study-1", label: "Study 1" },
      priceScale: primaryPriceScale,
      priceScaleId: "primary-right",
      studyKind: "compare",
      defaultCompareOptions: { affectMainScale: false },
      createOptions: () => ({ color: "#3b82f6" }),
    });

    expect(source.role).toBe("study");
    expect(source.studyKind).toBe("compare");
    expect(source.priceScale).toBe(primaryPriceScale);
    expect(source.priceScaleId).toBe("primary-right");
    expect(source.inputContext).toEqual({
      mode: "chart-context",
      symbol: null,
      resolution: null,
      session: null,
      timezone: null,
      mergePolicy: "carry-forward",
    });
    expect(source.compareOptions).toEqual({ affectMainScale: false });
    expect(source.options).toEqual({ color: "#3b82f6" });
  });

  it("attaches secondary study sources through pane-specific scale selection and registration", () => {
    const primaryPriceScale = new PriceScale();
    const secondaryPriceScale = new PriceScale();
    const calls: string[] = [];
    const registered: Array<{ paneId: string; priceScale: PriceScale; priceScaleId: string }> = [];

    attachStudySource(
      {
        paneId: "pane-2",
        kind: "line",
        api: { id: "study-api" },
        meta: { id: "study-2", label: "Study 2" },
        studyKind: "indicator",
        indicator: { kind: "moving-average", length: 20 },
      },
      {
        primaryPriceScale,
        getOrCreateSecondaryPriceScale: (paneId) => {
          calls.push(`scale:${paneId}`);
          return secondaryPriceScale;
        },
        createSourceState: ({ paneId, priceScale, priceScaleId, studyKind, indicator }) => {
          calls.push(`create:${paneId}:${priceScaleId}:${studyKind}:${indicator?.kind ?? "none"}`);
          const source = { paneId, priceScale, priceScaleId };
          registered.push(source);
          return source;
        },
        registerSource: (source) => {
          calls.push(`register:${source.paneId}:${source.priceScaleId}`);
        },
      },
    );

    expect(registered).toEqual([
      {
        paneId: "pane-2",
        priceScale: secondaryPriceScale,
        priceScaleId: "pane-2-right",
      },
    ]);
    expect(calls).toEqual([
      "scale:pane-2",
      "create:pane-2:pane-2-right:indicator:moving-average",
      "register:pane-2:pane-2-right",
    ]);
  });
});
