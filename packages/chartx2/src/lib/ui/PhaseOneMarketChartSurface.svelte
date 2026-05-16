<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import {
    createChartxPhaseOneChart,
    type PhaseOneCandlestickSeriesApi,
    type PhaseOneChartApi,
    type PhaseOneCrosshairMoveEvent,
    type PhaseOneHistogramSeriesApi,
    type PhaseOneLineSeriesApi,
    type PhaseOneVolumeSeriesApi,
  } from "../public/market";
  import {
    normalizePhaseOneMarketChartSurfaceLayout,
    resolvePhaseOneMarketChartActiveDataLength,
    resolvePhaseOneMarketChartDisplayMode,
    resolvePhaseOneMarketChartIndicatorPanes,
    resolvePhaseOneMarketChartReadoutMode,
    type PhaseOneMarketChartSurfaceChrome,
    type PhaseOneMarketChartSurfaceDensity,
    type PhaseOneMarketChartSurfaceModel,
    type PhaseOneMarketChartSurfaceReadoutPosition,
    type PhaseOneMarketChartSurfaceRightDockMode,
  } from "../public/market-chart-surface";

  const EMPTY_MODEL: PhaseOneMarketChartSurfaceModel = {
    symbol: "Symbol",
    timeframeLabel: "1D",
    bars: [],
    volume: [],
    emptyLabel: "No market bars available.",
    statusLabel: "Waiting for host chart data.",
  };

  const DEFAULT_OPTIONS = {
    layout: {
      backgroundColor: "#ffffff",
      paneBackgroundColor: "#ffffff",
      gridColor: "rgba(15, 23, 42, 0.08)",
      frameColor: "#c3cdd2",
      axisTextColor: "#33434b",
      axisLabelBackground: "#ffffff",
      axisLabelBorder: "#c3cdd2",
      axisActiveBackground: "#0f5964",
      axisActiveText: "#ffffff",
    },
    crosshair: {
      lineColor: "#0f5964",
      pointColor: "#0f5964",
    },
  } satisfies NonNullable<PhaseOneMarketChartSurfaceModel["chartOptions"]>;

  type Props = {
    model?: PhaseOneMarketChartSurfaceModel;
    chrome?: PhaseOneMarketChartSurfaceChrome;
    density?: PhaseOneMarketChartSurfaceDensity;
    readoutPosition?: PhaseOneMarketChartSurfaceReadoutPosition;
    rightDockMode?: PhaseOneMarketChartSurfaceRightDockMode;
    rightDockOpen?: boolean;
    rightDockWidth?: string;
    readoutActions?: Snippet;
    rightDock?: Snippet;
  };

  let {
    model = EMPTY_MODEL,
    chrome = "card",
    density = "default",
    readoutPosition = "bottom",
    rightDockMode = "none",
    rightDockOpen = false,
    rightDockWidth = "260px",
    readoutActions,
    rightDock,
  }: Props = $props();

  let canvasHost = $state<HTMLDivElement | undefined>(undefined);
  let canvas = $state<HTMLCanvasElement | undefined>(undefined);
  let chart: PhaseOneChartApi | null = null;
  let candleSeries: PhaseOneCandlestickSeriesApi | null = null;
  let overlaySeries: PhaseOneLineSeriesApi | null = null;
  let timesharePriceSeries: PhaseOneLineSeriesApi | null = null;
  let timeshareAverageSeries: PhaseOneLineSeriesApi | null = null;
  let timeshareBaselineSeries: PhaseOneLineSeriesApi | null = null;
  let volumeSeries: PhaseOneVolumeSeriesApi | null = null;
  let indicatorSeries = $state<Array<PhaseOneVolumeSeriesApi | PhaseOneHistogramSeriesApi | PhaseOneLineSeriesApi>>([]);
  let teardownCrosshair: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mounted = false;
  let lastDisplayMode: ReturnType<typeof resolvePhaseOneMarketChartDisplayMode> | null = null;
  let lastTimeshareBaselineMode: boolean | null = null;
  let lastVolumeMode: boolean | null = null;
  let lastIndicatorSignature: string | null = null;

  type ReadoutState = {
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
    price: string;
    averagePrice: string;
    volume: string;
  };

  function createEmptyReadout(): ReadoutState {
    return {
      time: "--",
      open: "--",
      high: "--",
      low: "--",
      close: "--",
      price: "--",
      averagePrice: "--",
      volume: "--",
    };
  }

  let readout = $state({
    ...createEmptyReadout(),
  });
  const layout = $derived(normalizePhaseOneMarketChartSurfaceLayout({ chrome, density, readoutPosition, rightDockMode }));
  const readoutMode = $derived(resolvePhaseOneMarketChartReadoutMode(model));
  const activeDataLength = $derived(resolvePhaseOneMarketChartActiveDataLength(model));

  function destroyChart(): void {
    teardownCrosshair?.();
    teardownCrosshair = null;
    chart?.destroy();
    chart = null;
    candleSeries = null;
    overlaySeries = null;
    timesharePriceSeries = null;
    timeshareAverageSeries = null;
    timeshareBaselineSeries = null;
    volumeSeries = null;
    indicatorSeries = [];
  }

  function resizeChart(): void {
    if (chart === null || canvasHost === undefined) {
      return;
    }
    const width = Math.max(0, Math.floor(canvasHost.clientWidth));
    const height = Math.max(0, Math.floor(canvasHost.clientHeight));
    if (width > 0 && height > 0) {
      chart.resize(width, height);
    }
  }

  function applyReadout(event: PhaseOneCrosshairMoveEvent): void {
    if (!event.active) {
      readout = createEmptyReadout();
      return;
    }
    readout = {
      time: event.formatted.time,
      open: event.formatted.open,
      high: event.formatted.high,
      low: event.formatted.low,
      close: event.formatted.close,
      price: event.formatted.price,
      averagePrice: "--",
      volume: "--",
    };
  }

  function applyChartData(): void {
    if (chart === null) {
      return;
    }

    if (resolvePhaseOneMarketChartDisplayMode(model) === "intraday-timeshare") {
      if (timesharePriceSeries === null) {
        return;
      }
      const points = model.intradayTimeshare?.points ?? [];
      const previousClose = model.intradayTimeshare?.previousClose;

      timesharePriceSeries.setData(points.map(({ time, price }) => ({ time, value: price })));
      timeshareAverageSeries?.setData(
        points.flatMap((point) =>
          point.averagePrice === undefined ? [] : [{ time: point.time, value: point.averagePrice }],
        ),
      );
      timeshareBaselineSeries?.setData(
        previousClose === undefined ? [] : points.map(({ time }) => ({ time, value: previousClose })),
      );
      volumeSeries?.setData(
        points.flatMap((point) =>
          point.volume === undefined ? [] : [{ time: point.time, value: point.volume, up: true }],
        ),
      );

      if (points.length > 0) {
        const lastLogical = points.length - 1;
        const visibleBars = Math.max(42, Math.min(240, points.length));
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(-0.5, lastLogical - visibleBars + 1 - 0.5),
          to: lastLogical + 6.5,
        });
      }
      return;
    }

    if (candleSeries === null) {
      return;
    }
    candleSeries.setData(model.bars);
    overlaySeries?.setData(model.overlayLine ?? []);
    volumeSeries?.setData(model.volume ?? []);
    const indicatorPanes = resolvePhaseOneMarketChartIndicatorPanes(model);
    let nextSeriesIndex = 0;
    for (const pane of indicatorPanes) {
      for (const series of pane.series) {
        indicatorSeries[nextSeriesIndex]?.setData(series.data as never);
        nextSeriesIndex += 1;
      }
    }

    if (model.bars.length > 0) {
      const lastLogical = model.bars.length - 1;
      const visibleBars = Math.max(42, Math.min(84, model.bars.length));
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(-0.5, lastLogical - visibleBars + 1 - 0.5),
        to: lastLogical + 6.5,
      });
    }
  }

  function rebuildChart(): void {
    if (!mounted || canvas === undefined) {
      return;
    }

    destroyChart();

    if (resolvePhaseOneMarketChartActiveDataLength(model) === 0) {
      return;
    }

    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions({
      ...DEFAULT_OPTIONS,
      ...model.chartOptions,
      layout: {
        ...DEFAULT_OPTIONS.layout,
        paneGap: 1,
        ...(model.chartOptions?.layout ?? {}),
      },
      crosshair: {
        ...DEFAULT_OPTIONS.crosshair,
        ...(model.chartOptions?.crosshair ?? {}),
      },
    });

    if (resolvePhaseOneMarketChartDisplayMode(model) === "intraday-timeshare") {
      const points = model.intradayTimeshare?.points ?? [];
      timesharePriceSeries = chart.addLineSeries();
      timesharePriceSeries.applyOptions({
        color: "#0f5964",
        lineWidth: 2,
      });

      if (points.some((point) => point.averagePrice !== undefined)) {
        timeshareAverageSeries = chart.addOverlaySeries();
        timeshareAverageSeries.applyOptions({
          color: "#d97706",
          lineWidth: 1,
        });
      }

      if (model.intradayTimeshare?.previousClose !== undefined) {
        timeshareBaselineSeries = chart.addOverlaySeries();
        timeshareBaselineSeries.applyOptions({
          color: "#94a3b8",
          lineWidth: 1,
        });
      }

      if (points.some((point) => point.volume !== undefined)) {
        const volumePane = chart.addPane({ height: 112 });
        volumeSeries = chart.addVolumeSeries({ pane: volumePane });
      }
    } else {
      candleSeries = chart.addCandlestickSeries();

      if ((model.overlayLine?.length ?? 0) > 0) {
        overlaySeries = chart.addOverlaySeries();
        overlaySeries.applyOptions({
          color: "#0f5964",
          lineWidth: 2,
        });
      }

      if ((model.volume?.length ?? 0) > 0) {
        const volumePane = chart.addPane({ height: 112 });
        volumeSeries = chart.addVolumeSeries({ pane: volumePane });
      }

      const nextIndicatorSeries: Array<PhaseOneVolumeSeriesApi | PhaseOneHistogramSeriesApi | PhaseOneLineSeriesApi> = [];
      for (const pane of resolvePhaseOneMarketChartIndicatorPanes(model)) {
        const chartPane = chart.addPane({ height: pane.height });
        for (const series of pane.series) {
          if (series.kind === "volume") {
            const nextSeries = chart.addVolumeSeries({ pane: chartPane });
            nextSeries.applyOptions({
              upColor: series.color ?? "#64748b",
              downColor: series.color ?? "#64748b",
            });
            nextIndicatorSeries.push(nextSeries);
            continue;
          }
          if (series.kind === "histogram") {
            const nextSeries = chart.addHistogramSeries({ pane: chartPane });
            nextSeries.applyOptions({
              upColor: series.color ?? "#dc2626",
              downColor: series.color ?? "#16a34a",
            });
            nextIndicatorSeries.push(nextSeries);
            continue;
          }
          const nextSeries = chart.addLineSeries({ pane: chartPane });
          nextSeries.applyOptions({
            color: series.color ?? "#2563eb",
            lineWidth: 1,
          });
          nextIndicatorSeries.push(nextSeries);
        }
      }
      indicatorSeries = nextIndicatorSeries;
    }
    const handleCrosshair = (event: PhaseOneCrosshairMoveEvent) => {
      applyReadout(event);
    };
    chart.subscribeCrosshairMove(handleCrosshair);
    teardownCrosshair = () => {
      chart?.unsubscribeCrosshairMove(handleCrosshair);
      teardownCrosshair = null;
    };

    applyChartData();
    resizeChart();
  }

  $effect(() => {
    const nextDisplayMode = resolvePhaseOneMarketChartDisplayMode(model);
    const timesharePoints = model.intradayTimeshare?.points ?? [];
    const nextVolumeMode =
      nextDisplayMode === "intraday-timeshare"
        ? timesharePoints.some((point) => point.volume !== undefined)
        : (model.volume?.length ?? 0) > 0;
    const nextCandlestickOverlayMode = nextDisplayMode === "candlestick" && (model.overlayLine?.length ?? 0) > 0;
    const nextTimeshareAverageMode =
      nextDisplayMode === "intraday-timeshare" && timesharePoints.some((point) => point.averagePrice !== undefined);
    const nextBaselineMode =
      nextDisplayMode === "intraday-timeshare" && model.intradayTimeshare?.previousClose !== undefined;
    const nextIndicatorSignature = resolvePhaseOneMarketChartIndicatorPanes(model)
      .map((pane) => `${pane.id}:${pane.height}:${pane.series.map((series) => `${series.kind}:${series.id}`).join(",")}`)
      .join("|");

    if (!mounted) {
      return;
    }

    if (
      chart === null ||
      lastDisplayMode !== nextDisplayMode ||
      lastVolumeMode !== nextVolumeMode ||
      nextCandlestickOverlayMode !== (overlaySeries !== null) ||
      nextTimeshareAverageMode !== (timeshareAverageSeries !== null) ||
      lastTimeshareBaselineMode !== nextBaselineMode ||
      lastIndicatorSignature !== nextIndicatorSignature
    ) {
      lastDisplayMode = nextDisplayMode;
      lastVolumeMode = nextVolumeMode;
      lastTimeshareBaselineMode = nextBaselineMode;
      lastIndicatorSignature = nextIndicatorSignature;
      rebuildChart();
      return;
    }

    applyChartData();
  });

  onMount(() => {
    mounted = true;
    const nextDisplayMode = resolvePhaseOneMarketChartDisplayMode(model);
    const timesharePoints = model.intradayTimeshare?.points ?? [];
    lastDisplayMode = nextDisplayMode;
    lastVolumeMode =
      nextDisplayMode === "intraday-timeshare"
        ? timesharePoints.some((point) => point.volume !== undefined)
        : (model.volume?.length ?? 0) > 0;
    lastTimeshareBaselineMode =
      nextDisplayMode === "intraday-timeshare" && model.intradayTimeshare?.previousClose !== undefined;
    lastIndicatorSignature = resolvePhaseOneMarketChartIndicatorPanes(model)
      .map((pane) => `${pane.id}:${pane.height}:${pane.series.map((series) => `${series.kind}:${series.id}`).join(",")}`)
      .join("|");
    rebuildChart();

    if (canvasHost !== undefined) {
      resizeObserver = new ResizeObserver(() => {
        resizeChart();
      });
      resizeObserver.observe(canvasHost);
    }

    return () => {
      mounted = false;
      resizeObserver?.disconnect();
      resizeObserver = null;
      destroyChart();
    };
  });
</script>

<section
  class="market-chart-surface"
  class:integrated={layout.chrome === "integrated"}
  class:compact={layout.density === "compact"}
  class:readout-top={layout.readoutPosition === "top"}
  data-phase-one-market-chart-surface
  data-phase-one-market-chart-surface-chrome={layout.chrome}
  data-phase-one-market-chart-surface-density={layout.density}
  data-phase-one-market-chart-surface-readout-position={layout.readoutPosition}
  data-phase-one-market-chart-surface-right-dock-mode={layout.rightDockMode}
>
  <div class="readout" aria-label="Chart readout" data-phase-one-market-chart-readout>
    <strong>{model.symbol}</strong>
    <span>{model.timeframeLabel}</span>
    <span>T {readout.time}</span>
    {#if readoutMode === "timeshare"}
      <span>现 {readout.price}</span>
      <span>均 {readout.averagePrice}</span>
      <span>量 {readout.volume}</span>
    {:else}
      <span>O {readout.open}</span>
      <span>H {readout.high}</span>
      <span>L {readout.low}</span>
      <span>C {readout.close}</span>
    {/if}
    <span class="status">{model.statusLabel ?? "Mounted through chartx2 public market surface."}</span>
    {#if readoutActions}
      <span class="readout-actions" data-phase-one-market-chart-readout-actions>
        {@render readoutActions()}
      </span>
    {/if}
  </div>

  <div
    class="surface-body"
    class:dock-inline-open={rightDock && rightDockOpen && layout.rightDockMode === "inline"}
    data-phase-one-market-chart-body
    style={`--chartx2-right-dock-width: ${rightDockWidth};`}
  >
    {#if activeDataLength === 0}
      <div class="empty-state">{model.emptyLabel ?? "No market bars available."}</div>
    {:else}
      <div class="canvas-host" bind:this={canvasHost}>
        <canvas bind:this={canvas} aria-label={`${model.symbol} ${model.timeframeLabel} market chart`}></canvas>
      </div>
    {/if}

    {#if rightDock && rightDockOpen && layout.rightDockMode !== "none"}
      <aside
        class="right-dock"
        class:inline={layout.rightDockMode === "inline"}
        aria-label="Chart right dock"
        data-phase-one-market-chart-right-dock
        style:width={rightDockWidth}
      >
        {@render rightDock()}
      </aside>
    {/if}
  </div>
</section>

<style>
  .market-chart-surface {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr) 26px;
    border: 1px solid #c3cdd2;
    border-radius: 10px;
    background: #ffffff;
    overflow: hidden;
  }

  .market-chart-surface > .readout {
    grid-row: 2;
  }

  .surface-body {
    position: relative;
    grid-row: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .surface-body.dock-inline-open {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, var(--chartx2-right-dock-width, 260px));
  }

  .surface-body.dock-inline-open .canvas-host,
  .surface-body.dock-inline-open .empty-state {
    grid-column: 1;
    grid-row: 1;
  }

  .market-chart-surface.readout-top {
    grid-template-rows: 26px minmax(0, 1fr);
  }

  .market-chart-surface.integrated {
    border: 0;
    border-radius: 0;
  }

  .market-chart-surface.compact {
    grid-template-rows: minmax(0, 1fr) 24px;
  }

  .market-chart-surface.integrated.compact.readout-top {
    grid-template-rows: 24px minmax(0, 1fr);
  }

  .canvas-host {
    min-width: 0;
    min-height: 0;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .market-chart-surface.readout-top .surface-body {
    grid-row: 2;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .empty-state {
    display: grid;
    place-items: center;
    padding: 16px;
    color: #607279;
    font-size: 12px;
    background:
      linear-gradient(#eef2f4 1px, transparent 1px),
      linear-gradient(90deg, #eef2f4 1px, transparent 1px),
      #fbfdfd;
    background-size: 42px 34px;
  }

  .readout {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 0 8px;
    border-top: 1px solid #d9e2e6;
    background: #f8faf9;
    color: #33434b;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
  }

  .market-chart-surface.readout-top .readout {
    grid-row: 1;
    border-top: 0;
    border-bottom: 1px solid #d9e2e6;
  }

  .market-chart-surface.compact .readout {
    gap: 8px;
    min-height: 0;
    padding: 0 0 0 8px;
    font-size: 11px;
  }

  .readout strong,
  .status {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status {
    margin-left: auto;
    color: #607279;
  }

  .readout-actions {
    flex: 0 0 auto;
    align-self: stretch;
    display: flex;
    align-items: stretch;
    margin-left: 4px;
  }

  :global([data-phase-one-market-chart-readout-actions] button) {
    min-width: 24px;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 0 5px;
    border: 0;
    border-left: 1px solid #d9e2e6;
    background: transparent;
    color: #607279;
    font: inherit;
    cursor: pointer;
  }

  :global([data-phase-one-market-chart-readout-actions] button:hover) {
    background: #e7f2f4;
    color: #0f5964;
  }

  .right-dock {
    position: absolute;
    z-index: 5;
    top: 0;
    right: 0;
    bottom: 0;
    min-width: 0;
    max-width: min(42%, 320px);
    border-left: 1px solid #9faeb5;
    background: #f8fafb;
    box-shadow: -1px 0 0 rgba(255, 255, 255, 0.62);
    overflow: hidden;
  }

  .right-dock.inline {
    position: relative;
    z-index: 1;
    top: auto;
    right: auto;
    bottom: auto;
    width: auto !important;
    max-width: none;
    height: 100%;
    box-shadow: none;
    grid-column: 2;
    grid-row: 1;
  }
</style>
