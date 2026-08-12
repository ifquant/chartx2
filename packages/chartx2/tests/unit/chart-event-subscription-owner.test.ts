import { describe, expect, it, vi } from "vitest";

import { createChartEventSubscriptionOwner } from "../../src/lib/internal/views/chart-event-subscription-owner";

describe("chart event subscription owner", () => {
  it("routes public subscribe and unsubscribe calls through one owner", () => {
    const calls: string[] = [];
    const owner = createChartEventSubscriptionOwner({
      subscribeCrosshairMove: () => calls.push("sub-crosshair"),
      unsubscribeCrosshairMove: () => calls.push("unsub-crosshair"),
      subscribeClick: () => calls.push("sub-click"),
      unsubscribeClick: () => calls.push("unsub-click"),
      subscribeDrawingSelectionChange: () => calls.push("sub-drawing"),
      unsubscribeDrawingSelectionChange: () => calls.push("unsub-drawing"),
      subscribePaneEvents: () => calls.push("sub-pane"),
      unsubscribePaneEvents: () => calls.push("unsub-pane"),
      subscribeChartTypeChange: () => calls.push("sub-chart-type"),
      unsubscribeChartTypeChange: () => calls.push("unsub-chart-type"),
      subscribeMarkerGeometry: () => calls.push("sub-marker-geometry"),
      unsubscribeMarkerGeometry: () => calls.push("unsub-marker-geometry"),
    });

    const handler = vi.fn();
    owner.subscribeCrosshairMove(handler as never);
    owner.unsubscribeCrosshairMove(handler as never);
    owner.subscribeClick(handler as never);
    owner.unsubscribeClick(handler as never);
    owner.subscribeDrawingSelectionChange(handler as never);
    owner.unsubscribeDrawingSelectionChange(handler as never);
    owner.subscribePaneEvents(handler as never);
    owner.unsubscribePaneEvents(handler as never);
    owner.subscribeChartTypeChange(handler as never);
    owner.unsubscribeChartTypeChange(handler as never);
    owner.subscribeMarkerGeometry(handler as never);
    owner.unsubscribeMarkerGeometry(handler as never);

    expect(calls).toEqual([
      "sub-crosshair",
      "unsub-crosshair",
      "sub-click",
      "unsub-click",
      "sub-drawing",
      "unsub-drawing",
      "sub-pane",
      "unsub-pane",
      "sub-chart-type",
      "unsub-chart-type",
      "sub-marker-geometry",
      "unsub-marker-geometry",
    ]);
  });
});
