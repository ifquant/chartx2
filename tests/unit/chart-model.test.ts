import { describe, expect, it } from "vitest";

import {
  ChartModel,
  createTimeBasedChartBarSequence,
  type SourceDescriptor,
} from "../../src/lib/chartx/internal/model";

type TestKind = "candlestick" | "line";
type TestApi = { handle: string };
type TestSource = SourceDescriptor<TestKind, TestApi> & {
  pointCount: number;
};

describe("chart model", () => {
  it("owns pane, source, context, and price-scale state as one chart runtime boundary", () => {
    const model = new ChartModel<TestKind, TestApi, TestSource, "candlestick" | "line">();
    const api = { handle: "main" };

    const pane = model.panes().addSecondaryPane({ height: 120, resizable: true });
    model.sources().register({
      id: "series-1",
      label: "Main",
      kind: "candlestick",
      role: "main-series",
      paneId: "primary",
      priceScaleId: "primary-right",
      visible: true,
      api,
      pointCount: 10,
    });
    model.context().bindMainSource(
      "series-1",
      "candlestick",
      createTimeBasedChartBarSequence([]),
    );

    const secondaryScale = model.getOrCreateSecondaryScale(pane.id);

    expect(model.panes().list().map((entry) => entry.id)).toEqual(["primary", pane.id]);
    expect(model.sources().getByApi(api)?.id).toBe("series-1");
    expect(model.context().snapshot().mainSourceId).toBe("series-1");
    expect(model.primaryScale()).toBeDefined();
    expect(model.getSecondaryScale(pane.id)).toBe(secondaryScale);
    expect(model.secondaryScales()).toHaveLength(1);

    model.removeSecondaryScale(pane.id);
    expect(model.getSecondaryScale(pane.id)).toBeUndefined();
  });

  it("routes main-source registration and binding through the chart owner", () => {
    const model = new ChartModel<TestKind, TestApi, TestSource, "candlestick" | "line">();
    const api = { handle: "main" };
    const source: TestSource = {
      id: "series-1",
      label: "Main",
      kind: "candlestick",
      role: "main-series",
      paneId: "primary",
      priceScaleId: "primary-right",
      visible: true,
      api,
      pointCount: 10,
    };

    model.registerSource(source);
    model.bindMainSource(
      source.id,
      "candlestick",
      createTimeBasedChartBarSequence([]),
    );

    expect(model.getSourceByApiOrThrow(api, "missing source")).toBe(source);
    expect(model.getSourceByIdAndRole(source.id, "main-series")).toBe(source);
    expect(model.mainSourceId()).toBe(source.id);
  });

  it("clears the main-source context when the chart owner removes the active source", () => {
    const model = new ChartModel<TestKind, TestApi, TestSource, "candlestick" | "line">();
    const api = { handle: "main" };

    model.registerSource({
      id: "series-1",
      label: "Main",
      kind: "candlestick",
      role: "main-series",
      paneId: "primary",
      priceScaleId: "primary-right",
      visible: true,
      api,
      pointCount: 10,
    });
    model.bindMainSource(
      "series-1",
      "candlestick",
      createTimeBasedChartBarSequence([]),
    );

    const removed = model.removeSourceByApi(api);

    expect(removed?.id).toBe("series-1");
    expect(model.mainSourceId()).toBeNull();
    expect(model.sources().getByApi(api)).toBeUndefined();
  });
});
