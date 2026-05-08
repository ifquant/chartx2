import { describe, expect, it } from "vitest";

import {
  addSecondarySeries,
  attachStudySeries,
  createSecondarySeriesApiDeps,
} from "../../src/lib/internal/views/chart-secondary-series-factory";

describe("chart secondary series factory use-cases", () => {
  it("builds secondary api deps without changing the builder contract", () => {
    const deps = {
      assertSeriesActive: () => "assert",
      getSource: () => ({ options: {}, priceLines: new Map<string, unknown>() }),
      applySeriesFormatterOptions: () => {},
      render: () => {},
      setSecondaryData: () => {},
      updateSecondary: () => {},
      setSecondaryHistogramLikeData: () => {},
      updateSecondaryHistogramLike: () => {},
      normalizeLineData: (data: readonly unknown[]) => data,
      normalizeLineBar: (bar: unknown) => bar,
      setMarkers: () => {},
      createPriceLine: () => ({}),
      removePriceLine: () => {},
      applyCompareOptions: () => {},
      getCompareOptions: () => ({}),
      applyMovingAverageStudyOptions: () => {},
      getMovingAverageStudyOptions: () => ({}),
      applyScriptedStudyOptions: () => {},
      getScriptedStudyOptions: () => ({}),
    };

    const result = createSecondarySeriesApiDeps((nextDeps) => nextDeps, deps);

    expect(result).toBe(deps);
  });

  it("attaches study sources with primary and secondary scale routing", () => {
    const calls: string[] = [];

    attachStudySeries(
      {
        paneId: "primary",
        kind: "line",
        api: { id: "api-1" },
        meta: { id: "series-1", label: "Series 1" },
      },
      {
        primaryPriceScale: { id: "primary-scale" },
        getOrCreateSecondaryPriceScale: (paneId) => ({ id: `${paneId}-scale` }),
        createSourceState: ({ priceScaleId }) => {
          calls.push(`create:${priceScaleId}`);
          return { priceScaleId };
        },
        registerSource: (source) => {
          calls.push(`register:${source.priceScaleId}`);
        },
      },
    );

    attachStudySeries(
      {
        paneId: "pane-2",
        kind: "line",
        api: { id: "api-2" },
        meta: { id: "series-2", label: "Series 2" },
      },
      {
        primaryPriceScale: { id: "primary-scale" },
        getOrCreateSecondaryPriceScale: (paneId) => ({ id: `${paneId}-scale` }),
        createSourceState: ({ priceScaleId }) => {
          calls.push(`create:${priceScaleId}`);
          return { priceScaleId };
        },
        registerSource: (source) => {
          calls.push(`register:${source.priceScaleId}`);
        },
      },
    );

    expect(calls).toEqual([
      "create:primary-right",
      "register:primary-right",
      "create:pane-2-right",
      "register:pane-2-right",
    ]);
  });

  it("adds a secondary study by composing meta, api factory, and attach wiring", () => {
    const calls: string[] = [];

    const api = addSecondarySeries(
      {
        paneId: "pane-2",
        kind: "line",
        studyKind: "compare",
        createApi: () => {
          calls.push("create-api");
          return { id: "compare-api" };
        },
      },
      {
        createMeta: (kind) => {
          calls.push(`meta:${kind}`);
          return { id: "series-1", label: "Series 1" };
        },
        createApiDeps: (build) =>
          build({
            assertSeriesActive: () => {},
            getSource: () => ({ options: {}, priceLines: new Map<string, unknown>() }),
            applySeriesFormatterOptions: () => {},
            render: () => {},
            setSecondaryData: () => {},
            updateSecondary: () => {},
            setSecondaryHistogramLikeData: () => {},
            updateSecondaryHistogramLike: () => {},
            normalizeLineData: (data: readonly unknown[]) => data,
            normalizeLineBar: (bar: unknown) => bar,
            setMarkers: () => {},
            createPriceLine: () => ({}),
            removePriceLine: () => {},
            applyCompareOptions: () => {},
            getCompareOptions: () => ({}),
            applyMovingAverageStudyOptions: () => {},
            getMovingAverageStudyOptions: () => ({}),
            applyScriptedStudyOptions: () => {},
            getScriptedStudyOptions: () => ({}),
          }),
        attachStudySeries: ({ paneId, kind, api, meta, studyKind }) => {
          calls.push(`attach:${paneId}:${kind}:${meta.id}:${studyKind}:${(api as { id: string }).id}`);
        },
      },
    );

    expect(api).toEqual({ id: "compare-api" });
    expect(calls).toEqual([
      "meta:line",
      "create-api",
      "attach:pane-2:line:series-1:compare:compare-api",
    ]);
  });
});
