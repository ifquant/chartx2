import { describe, expect, it } from "vitest";

import { SourceRegistry, type SourceDescriptor } from "../../src/lib/internal/model";

type TestKind = "candlestick" | "line";
type TestApi = { handle: string };
type TestSource = SourceDescriptor<TestKind, TestApi> & {
  pointCount: number;
};

describe("source registry", () => {
  it("registers main and study sources and lists them by pane", () => {
    const registry = new SourceRegistry<TestKind, TestApi, TestSource>();
    const mainApi = { handle: "main" };
    const studyApi = { handle: "study" };

    registry.register({
      id: "series-1",
      label: "Candlestick 1",
      kind: "candlestick",
      role: "main-series",
      paneId: "primary",
      priceScaleId: "primary-right",
      visible: true,
      api: mainApi,
      pointCount: 32,
    });
    registry.register({
      id: "series-2",
      label: "Line 2",
      kind: "line",
      role: "study",
      paneId: "pane-1",
      priceScaleId: "pane-1-right",
      visible: true,
      api: studyApi,
      pointCount: 12,
    });

    expect(registry.list().map((source) => source.id)).toEqual(["series-1", "series-2"]);
    expect(registry.listByPane("primary").map((source) => source.label)).toEqual(["Candlestick 1"]);
    expect(registry.listByPane("pane-1").map((source) => source.label)).toEqual(["Line 2"]);
    expect(registry.listByRole("main-series").map((source) => source.id)).toEqual(["series-1"]);
    expect(registry.listByPaneAndRole("pane-1", "study").map((source) => source.id)).toEqual(["series-2"]);
    expect(registry.getByIdAndRole("series-1", "main-series")?.label).toBe("Candlestick 1");
    expect(registry.getByApi(studyApi)?.role).toBe("study");
  });

  it("supports pane moves, visibility changes, and removal by api handle", () => {
    const registry = new SourceRegistry<TestKind, TestApi, TestSource>();
    const api = { handle: "study" };

    registry.register({
      id: "series-2",
      label: "Line 2",
      kind: "line",
      role: "study",
      paneId: "pane-1",
      priceScaleId: "pane-1-right",
      visible: true,
      api,
      pointCount: 12,
    });

    registry.move("series-2", "pane-2", "pane-2-right");
    registry.setVisible("series-2", false);

    const moved = registry.getByApi(api);
    expect(moved?.paneId).toBe("pane-2");
    expect(moved?.priceScaleId).toBe("pane-2-right");
    expect(moved?.visible).toBe(false);
    expect(registry.getByApiOrThrow(api, "missing").id).toBe("series-2");

    const removed = registry.removeByApi(api);
    expect(removed?.id).toBe("series-2");
    expect(registry.getByApi(api)).toBeUndefined();
    expect(registry.list()).toEqual([]);
    expect(() => registry.getByApiOrThrow(api, "missing")).toThrow(/missing/);
  });
});
