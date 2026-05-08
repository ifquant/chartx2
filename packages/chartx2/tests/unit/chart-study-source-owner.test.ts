import { describe, expect, it } from "vitest";

import type { PriceScale } from "../../src/lib/internal/model";
import { createChartStudySourceOwner } from "../../src/lib/internal/views/chart-study-source-owner";

describe("chart study source owner", () => {
  it("creates and registers primary compare study source state", () => {
    const registered: unknown[] = [];
    const primaryScale = { id: "primary-scale" } as unknown as PriceScale;
    const owner = createChartStudySourceOwner({
      getPrimaryPriceScale: () => primaryScale,
      getOrCreateSecondaryPriceScale: (paneId) => ({ id: `${paneId}-scale` }) as unknown as PriceScale,
      createMeta: (kind) => ({ id: `${kind}-1`, label: `${kind} 1` }),
      createOptions: (kind) => ({ kind, color: "#2563eb" }),
      registerSource: (source) => {
        registered.push(source);
      },
      defaultCompareOptions: {
        affectMainScale: false,
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
    });

    const meta = owner.studySources.createMeta("line");
    const source = owner.studySources.createSourceState({
      paneId: "primary",
      kind: "line",
      api: { id: "api-1" },
      meta,
      priceScale: owner.studySources.primaryPriceScale,
      priceScaleId: "primary-right",
      studyKind: "compare",
    }) as {
      id: string;
      label: string;
      role: string;
      studyKind: string;
      priceScaleId: string;
      compareOptions?: { affectMainScale: boolean };
      options: { kind: string; color: string };
    };
    owner.studySources.registerSource(source);

    expect(source).toMatchObject({
      id: "line-1",
      label: "line 1",
      role: "study",
      studyKind: "compare",
      priceScaleId: "primary-right",
      compareOptions: { affectMainScale: false },
      options: { kind: "line", color: "#2563eb" },
    });
    expect(registered).toEqual([source]);
  });

  it("uses secondary pane price scales for non-primary study sources", () => {
    const owner = createChartStudySourceOwner({
      getPrimaryPriceScale: () => ({ id: "primary-scale" }) as unknown as PriceScale,
      getOrCreateSecondaryPriceScale: (paneId) => ({ id: `${paneId}-scale` }) as unknown as PriceScale,
      createMeta: (kind) => ({ id: `${kind}-1`, label: `${kind} 1` }),
      createOptions: () => ({}),
      registerSource: () => {},
      defaultCompareOptions: {},
    });

    const priceScale = owner.studySources.getOrCreateSecondaryPriceScale("pane-2") as unknown as { id: string };
    const source = owner.studySources.createSourceState({
      paneId: "pane-2",
      kind: "histogram",
      api: { id: "api-2" },
      meta: { id: "histogram-1", label: "Histogram 1" },
      priceScale,
      priceScaleId: "pane-2-right",
    }) as {
      paneId: string;
      priceScaleId: string;
      priceScale: { id: string };
    };

    expect(priceScale).toEqual({ id: "pane-2-scale" });
    expect(source).toMatchObject({
      paneId: "pane-2",
      priceScaleId: "pane-2-right",
      priceScale: { id: "pane-2-scale" },
    });
  });
});
