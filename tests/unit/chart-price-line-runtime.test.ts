import { describe, expect, it, vi } from "vitest";

import {
  assertPriceLineActive,
  clonePriceLines,
  createPriceLineApi,
  createPriceLineState,
  removePriceLineFromMap,
} from "../../src/lib/chartx/internal/views/chart-price-line-runtime";

describe("chart price-line runtime use-cases", () => {
  it("builds price-line state from defaults and clamps line width", () => {
    expect(createPriceLineState(4, {
      lineWidth: 0,
      title: "Pivot",
    }, {
      defaultOptions: {
        price: 100,
        color: "#111",
        lineWidth: 2,
        title: "Fallback",
      },
    })).toEqual({
      id: "price-line-4",
      price: 100,
      color: "#111",
      lineWidth: 1,
      title: "Pivot",
    });
  });

  it("creates price-line apis that patch and remove shared state", () => {
    const lines = new Map();
    const ids = new WeakMap();
    const render = vi.fn();

    const api = createPriceLineApi(lines, createPriceLineState(2, {
      price: 128,
    }, {
      defaultOptions: {
        price: 100,
        color: "#111",
        lineWidth: 2,
        title: "Fallback",
      },
    }), {
      setLineId: (line, lineId) => {
        ids.set(line, lineId);
      },
      getLineId: (line) => ids.get(line),
      render,
    });

    api.applyOptions({
      lineWidth: -3,
      color: "#222",
    });
    expect(lines.get("price-line-2")).toMatchObject({
      price: 128,
      color: "#222",
      lineWidth: 1,
    });

    api.remove();
    expect(lines.has("price-line-2")).toBe(false);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("rejects inactive price-line handles", () => {
    const lines = new Map();
    const ids = new WeakMap();
    const render = vi.fn();
    const api = createPriceLineApi(lines, createPriceLineState(1, undefined, {
      defaultOptions: {
        price: 100,
        color: "#111",
        lineWidth: 2,
        title: "Fallback",
      },
    }), {
      setLineId: (line, lineId) => {
        ids.set(line, lineId);
      },
      getLineId: (line) => ids.get(line),
      render,
    });

    removePriceLineFromMap(lines, api, {
      getLineId: (line) => ids.get(line),
      render,
    });

    expect(() =>
      assertPriceLineActive(lines, api, {
        getLineId: (line) => ids.get(line),
      })
    ).toThrow("chartx phase-one price line has been removed");
  });

  it("clones price-line maps without sharing line objects", () => {
    const original = new Map([[
      "price-line-1",
      {
        id: "price-line-1",
        price: 12,
        color: "#111",
        lineWidth: 2,
        title: "Entry",
      },
    ]]);

    const cloned = clonePriceLines(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.get("price-line-1")).not.toBe(original.get("price-line-1"));

    cloned.get("price-line-1")!.price = 99;
    expect(original.get("price-line-1")!.price).toBe(12);
  });
});
