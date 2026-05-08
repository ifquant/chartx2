import { describe, expect, it } from "vitest";

import {
  buildCrosshairMoveEvent,
  emitReadoutEvent,
  finishChartRender,
} from "../../src/lib/internal/views/chart-render-tail";

describe("chart render tail use-case", () => {
  it("prefers primary rows for time-axis rendering and publishes readout events", () => {
    const calls: string[] = [];

    const readout = finishChartRender({
      primaryRows: ["primary-row"],
      firstSecondaryRows: ["secondary-row"],
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      renderTimeAxis: (rows) => calls.push(`time-axis:${rows.join(",")}`),
      buildReadout: () => {
        calls.push("build-readout");
        return { active: true, paneIndex: 0 };
      },
      publishReadout: (readout) => calls.push(`publish-readout:${readout.paneIndex}`),
      publishCrosshairMove: (readout) => calls.push(`publish-crosshair:${readout.paneIndex}`),
    });

    expect(calls).toEqual([
      "time-axis:primary-row",
      "build-readout",
      "publish-readout:0",
      "publish-crosshair:0",
    ]);
    expect(readout).toEqual({ active: true, paneIndex: 0 });
  });

  it("falls back to the first secondary rows and still publishes when there is no primary data", () => {
    const calls: string[] = [];

    finishChartRender({
      primaryRows: [] as string[],
      firstSecondaryRows: ["secondary-row"],
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      renderTimeAxis: (rows) => calls.push(`time-axis:${rows.join(",")}`),
      buildReadout: () => {
        calls.push("build-readout");
        return { active: false, paneIndex: null };
      },
      publishReadout: () => calls.push("publish-readout"),
      publishCrosshairMove: () => calls.push("publish-crosshair"),
    });

    expect(calls).toEqual([
      "time-axis:secondary-row",
      "build-readout",
      "publish-readout",
      "publish-crosshair",
    ]);
  });

  it("skips time-axis rendering when there are no rows but still publishes readout events", () => {
    const calls: string[] = [];

    finishChartRender({
      primaryRows: [] as string[],
      firstSecondaryRows: undefined,
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      renderTimeAxis: () => calls.push("time-axis"),
      buildReadout: () => {
        calls.push("build-readout");
        return { active: false };
      },
      publishReadout: () => calls.push("publish-readout"),
      publishCrosshairMove: () => calls.push("publish-crosshair"),
    });

    expect(calls).toEqual([
      "build-readout",
      "publish-readout",
      "publish-crosshair",
    ]);
  });

  it("builds crosshair move events with an explicit point snapshot", () => {
    expect(buildCrosshairMoveEvent({ active: true }, { x: 12, y: 34 })).toEqual({
      active: true,
      point: { x: 12, y: 34 },
    });
    expect(buildCrosshairMoveEvent({ active: false }, null)).toEqual({
      active: false,
      point: null,
    });
  });

  it("dispatches readout custom events through the render tail helper", () => {
    const previousCustomEvent = globalThis.CustomEvent;
    class TestCustomEvent<T> extends Event {
      public readonly detail: T;

      public constructor(type: string, init: CustomEventInit<T>) {
        super(type);
        this.detail = init.detail as T;
      }
    }
    globalThis.CustomEvent = TestCustomEvent as unknown as typeof CustomEvent;

    try {
      const events: Event[] = [];
      emitReadoutEvent({
        dispatchEvent: (event) => {
          events.push(event);
          return true;
        },
      }, { active: true, paneIndex: 1 });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("chartx:readout");
      expect((events[0] as CustomEvent).detail).toEqual({ active: true, paneIndex: 1 });
    } finally {
      globalThis.CustomEvent = previousCustomEvent;
    }
  });
});
