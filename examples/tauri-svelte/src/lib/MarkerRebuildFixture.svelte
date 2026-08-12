<script lang="ts">
  import PhaseOneMarketChartSurface from "../../../../packages/chartx2/src/lib/ui/PhaseOneMarketChartSurface.svelte";
  import type { PhaseOneMarketChartSurfaceModel } from "../../../../packages/chartx2/src/lib/public/market-chart-surface";

  let model = $state<PhaseOneMarketChartSurfaceModel>({
    symbol: "rb2605",
    timeframeLabel: "1m",
    bars: [
      { time: 1, open: 100, high: 108, low: 96, close: 104 },
      { time: 2, open: 104, high: 112, low: 102, close: 110 },
    ],
    markers: [{ markerId: "old-visible", time: 2, position: "aboveBar", text: "Old" }],
  });
  let dataIdentity = $state({ key: "generation-a" });

  function rebuildWithoutDrawableMarker(): void {
    dataIdentity = { key: "generation-b" };
    model = {
      symbol: "rb2605",
      timeframeLabel: "1m",
      displayMode: "intraday-timeshare",
      bars: [],
      intradayTimeshare: { points: [{ time: 10, price: 110 }] },
      markers: [{ markerId: "old-visible", time: 2, position: "aboveBar", text: "Old" }],
    };
  }
</script>

<button type="button" data-marker-rebuild onclick={rebuildWithoutDrawableMarker}>Rebuild</button>
<div style="width: 680px; height: 380px;">
  <PhaseOneMarketChartSurface
    {model}
    {dataIdentity}
    onMountLifecycleReceipt={(receipt) => (window as any).__markerRebuildReceipts.push(receipt)}
    onMarkerActivate={(event) => (window as any).__markerRebuildActivations.push(event)}
  />
</div>
