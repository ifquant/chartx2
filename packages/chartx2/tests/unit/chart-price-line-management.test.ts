import { describe, expect, it, vi } from "vitest";

import { createPriceLineManager } from "../../src/lib/internal/views/chart-price-line-management";

describe("chart price-line management use-cases", () => {
  it("owns ordinal allocation and api registration outside the harness", () => {
    const render = vi.fn();
    const manager = createPriceLineManager({
      defaultOptions: {
        price: 100,
        color: "#111",
        lineWidth: 2,
        title: "Fallback",
      },
      render,
    });
    const lines = new Map();

    const first = manager.createState({
      lineWidth: 0,
      title: "Pivot",
    });
    const second = manager.createState();
    const api = manager.createApi(lines, first);

    expect(first).toEqual({
      id: "price-line-1",
      price: 100,
      color: "#111",
      lineWidth: 1,
      title: "Pivot",
    });
    expect(second.id).toBe("price-line-2");
    expect(lines.get("price-line-1")).toMatchObject({
      title: "Pivot",
    });

    api.applyOptions({
      color: "#222",
      lineWidth: -3,
    });

    expect(lines.get("price-line-1")).toMatchObject({
      color: "#222",
      lineWidth: 1,
    });
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("owns active/remove bookkeeping through shared handle state", () => {
    const manager = createPriceLineManager({
      defaultOptions: {
        price: 100,
        color: "#111",
        lineWidth: 2,
        title: "Fallback",
      },
      render: vi.fn(),
    });
    const lines = new Map();
    const api = manager.createApi(lines, manager.createState());

    manager.assertActive(lines, api);
    manager.remove(lines, api);

    expect(() => manager.assertActive(lines, api)).toThrow("chartx phase-one price line has been removed");
    expect(() => manager.remove(lines, api)).toThrow("chartx phase-one price line has been removed");
  });
});
