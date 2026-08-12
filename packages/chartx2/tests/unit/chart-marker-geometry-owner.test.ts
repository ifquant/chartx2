import { describe, expect, it, vi } from "vitest";

import { createChartMarkerGeometryOwner } from "../../src/lib/internal/views/chart-marker-geometry-owner";

const above = { markerId: "a", time: 1, paneId: "primary", x: 20, y: 30, position: "aboveBar" } as const;
const below = { markerId: "b", time: 1, paneId: "primary", x: 20, y: 60, position: "belowBar" } as const;

describe("chart marker geometry owner", () => {
  it("publishes only ordered complete semantic changes and clears once", () => {
    const emit = vi.fn();
    const owner = createChartMarkerGeometryOwner({ emit });

    owner.publish([]);
    expect(emit).not.toHaveBeenCalled();
    owner.publish([above, below]);
    owner.publish([{ ...above }, { ...below }]);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0]![0]).toMatchObject({ revision: 1, markers: [above, below] });

    owner.publish([below, above]);
    expect(emit.mock.calls[1]![0]).toMatchObject({ revision: 2, markers: [below, above] });
    owner.publish([]);
    owner.publish([]);
    expect(emit.mock.calls[2]![0]).toMatchObject({ revision: 3, markers: [] });
    expect(emit).toHaveBeenCalledTimes(3);
  });

  it("publishes coordinate changes but isolates the immutable snapshot from caller mutation", () => {
    const emit = vi.fn();
    const owner = createChartMarkerGeometryOwner({ emit });
    const mutable: Array<{ markerId: string; time: number; paneId: string; x: number; y: number; position: "aboveBar" }> = [{ ...above }];
    owner.publish(mutable);
    mutable[0]!.x = 999;
    owner.publish([{ ...above, x: 21 }]);

    expect(emit.mock.calls[0]![0].markers[0].x).toBe(20);
    expect(Object.isFrozen(emit.mock.calls[0]![0])).toBe(true);
    expect(Object.isFrozen(emit.mock.calls[0]![0].markers)).toBe(true);
    expect(emit.mock.calls[1]![0].revision).toBe(2);
  });
});
