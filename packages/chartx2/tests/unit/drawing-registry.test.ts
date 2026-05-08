import { describe, expect, it } from "vitest";

import { DrawingRegistry, type DrawingDescriptor } from "../../src/lib/internal/model";

type TestKind = "horizontal-line";
type TestApi = { handle: string };
type TestDrawing = DrawingDescriptor<TestKind, TestApi> & {
  value: number;
};

describe("drawing registry", () => {
  it("registers drawings and lists them by pane", () => {
    const registry = new DrawingRegistry<TestKind, TestApi, TestDrawing>();
    const primary = { handle: "primary" };
    const secondary = { handle: "secondary" };

    registry.register({
      id: "drawing-1",
      kind: "horizontal-line",
      paneId: "primary",
      visible: true,
      api: primary,
      value: 123,
    });
    registry.register({
      id: "drawing-2",
      kind: "horizontal-line",
      paneId: "pane-1",
      visible: true,
      api: secondary,
      value: 456,
    });

    expect(registry.list().map((drawing) => drawing.id)).toEqual(["drawing-1", "drawing-2"]);
    expect(registry.listByPane("primary").map((drawing) => drawing.value)).toEqual([123]);
    expect(registry.listByPane("pane-1").map((drawing) => drawing.value)).toEqual([456]);
    expect(registry.getByApi(secondary)?.paneId).toBe("pane-1");
  });

  it("supports visibility updates, pane moves, and removal by api handle", () => {
    const registry = new DrawingRegistry<TestKind, TestApi, TestDrawing>();
    const api = { handle: "drawing" };

    registry.register({
      id: "drawing-1",
      kind: "horizontal-line",
      paneId: "pane-1",
      visible: true,
      api,
      value: 321,
    });

    registry.move("drawing-1", "pane-2");
    registry.setVisible("drawing-1", false);

    const moved = registry.getByApi(api);
    expect(registry.hasApi(api)).toBe(true);
    expect(moved?.paneId).toBe("pane-2");
    expect(moved?.visible).toBe(false);

    const removed = registry.removeByApi(api);
    expect(removed?.id).toBe("drawing-1");
    expect(registry.hasApi(api)).toBe(false);
    expect(registry.list()).toEqual([]);
  });
});
