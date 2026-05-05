<script lang="ts">
  import { onMount } from "svelte";
  import {
    createChartxPhaseOneChart,
    type PhaseOneCandlestickSeriesApi,
    type PhaseOneChartApi,
    type PhaseOneCrosshairMoveEvent,
    type PhaseOneVolumeSeriesApi,
  } from "../../chartx/public/market";
  import type { PhaseOneMarketChartSurfaceModel } from "../../chartx/public/market-chart-surface";

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
  };

  let { model = EMPTY_MODEL }: Props = $props();

  let canvasHost = $state<HTMLDivElement | undefined>(undefined);
  let canvas = $state<HTMLCanvasElement | undefined>(undefined);
  let chart: PhaseOneChartApi | null = null;
  let candleSeries: PhaseOneCandlestickSeriesApi | null = null;
  let volumeSeries: PhaseOneVolumeSeriesApi | null = null;
  let teardownCrosshair: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mounted = false;
  let lastVolumeMode: boolean | null = null;

  let readout = $state({
    time: "--",
    open: "--",
    high: "--",
    low: "--",
    close: "--",
  });

  function destroyChart(): void {
    teardownCrosshair?.();
    teardownCrosshair = null;
    chart?.destroy();
    chart = null;
    candleSeries = null;
    volumeSeries = null;
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
      readout = {
        time: "--",
        open: "--",
        high: "--",
        low: "--",
        close: "--",
      };
      return;
    }
    readout = {
      time: event.formatted.time,
      open: event.formatted.open,
      high: event.formatted.high,
      low: event.formatted.low,
      close: event.formatted.close,
    };
  }

  function applyChartData(): void {
    if (chart === null || candleSeries === null) {
      return;
    }

    candleSeries.setData(model.bars);
    volumeSeries?.setData(model.volume ?? []);

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

    if (model.bars.length === 0) {
      return;
    }

    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions({
      ...DEFAULT_OPTIONS,
      ...model.chartOptions,
      layout: {
        ...DEFAULT_OPTIONS.layout,
        ...(model.chartOptions?.layout ?? {}),
      },
      crosshair: {
        ...DEFAULT_OPTIONS.crosshair,
        ...(model.chartOptions?.crosshair ?? {}),
      },
    });
    candleSeries = chart.addCandlestickSeries();

    if ((model.volume?.length ?? 0) > 0) {
      const volumePane = chart.addPane({ height: 112 });
      volumeSeries = chart.addVolumeSeries({ pane: volumePane });
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
    const nextVolumeMode = (model.volume?.length ?? 0) > 0;

    if (!mounted) {
      return;
    }

    if (chart === null || lastVolumeMode !== nextVolumeMode) {
      lastVolumeMode = nextVolumeMode;
      rebuildChart();
      return;
    }

    applyChartData();
  });

  onMount(() => {
    mounted = true;
    lastVolumeMode = (model.volume?.length ?? 0) > 0;
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

<section class="market-chart-surface" data-phase-one-market-chart-surface>
  {#if model.bars.length === 0}
    <div class="empty-state">{model.emptyLabel ?? "No market bars available."}</div>
  {:else}
    <div class="canvas-host" bind:this={canvasHost}>
      <canvas bind:this={canvas} aria-label={`${model.symbol} ${model.timeframeLabel} market chart`}></canvas>
    </div>
  {/if}

  <div class="readout" aria-label="Chart readout">
    <strong>{model.symbol}</strong>
    <span>{model.timeframeLabel}</span>
    <span>T {readout.time}</span>
    <span>O {readout.open}</span>
    <span>H {readout.high}</span>
    <span>L {readout.low}</span>
    <span>C {readout.close}</span>
    <span class="status">{model.statusLabel ?? "Mounted through chartx2 public market surface."}</span>
  </div>
</section>

<style>
  .market-chart-surface {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) 26px;
    border: 1px solid #c3cdd2;
    border-radius: 10px;
    background: #ffffff;
    overflow: hidden;
  }

  .canvas-host {
    min-width: 0;
    min-height: 0;
    position: relative;
    overflow: hidden;
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
</style>
