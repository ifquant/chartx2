import { describe, expect, it } from "vitest";

import { assertCanvasElement } from "../../src/lib/chartx/internal/views/chart-dom-guards";

describe("chart DOM guards", () => {
  it("accepts HTMLCanvasElement instances", () => {
    const previousCanvas = globalThis.HTMLCanvasElement;
    class TestCanvas {}
    globalThis.HTMLCanvasElement = TestCanvas as unknown as typeof HTMLCanvasElement;

    try {
      expect(() => assertCanvasElement(new TestCanvas())).not.toThrow();
    } finally {
      globalThis.HTMLCanvasElement = previousCanvas;
    }
  });

  it("rejects non-canvas values with the public chart error", () => {
    const previousCanvas = globalThis.HTMLCanvasElement;
    class TestCanvas {}
    globalThis.HTMLCanvasElement = TestCanvas as unknown as typeof HTMLCanvasElement;

    try {
      expect(() => assertCanvasElement({})).toThrow(
        "chartx phase-one chart requires an HTMLCanvasElement",
      );
    } finally {
      globalThis.HTMLCanvasElement = previousCanvas;
    }
  });
});
