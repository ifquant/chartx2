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
    type PhaseOneVolumeData,
    type PhaseOneVolumeSeriesApi,
  } from "../public/market";
  import { formatVolumeAxisLabel } from "../internal/views/chart-axis-format";
  import {
    normalizePhaseOneMarketChartSurfaceLayout,
    resolvePhaseOneMarketChartActiveDataLength,
    resolvePhaseOneMarketChartDisplayMode,
    resolvePhaseOneMarketChartIndicatorPanes,
    resolvePhaseOneMarketChartOverlayLines,
    resolvePhaseOneMarketChartReadoutMode,
    resolvePhaseOneMarketChartSurfaceMarkers,
    resolvePhaseOneMarketChartVirtualRange,
    type PhaseOneMarketChartSurfaceChrome,
    type PhaseOneMarketChartSurfaceDensity,
    type PhaseOneMarketChartSurfaceModel,
    type PhaseOneMarketChartSurfaceReadoutDisplay,
    type PhaseOneMarketChartSurfaceReadoutPosition,
    type PhaseOneMarketChartSurfaceRightDockMode,
    type PhaseOneMarketChartSurfaceVirtualRange,
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
    readoutDisplay?: PhaseOneMarketChartSurfaceReadoutDisplay;
    rightDockMode?: PhaseOneMarketChartSurfaceRightDockMode;
    rightDockOpen?: boolean;
    rightDockWidth?: string;
    onVirtualRangeChange?: (range: PhaseOneMarketChartSurfaceVirtualRange) => void;
    readoutActions?: Snippet;
    rightDock?: Snippet;
  };

  let {
    model = EMPTY_MODEL,
    chrome = "card",
    density = "default",
    readoutPosition = "bottom",
    readoutDisplay = "inline",
    rightDockMode = "none",
    rightDockOpen = false,
    rightDockWidth = "260px",
    onVirtualRangeChange,
    readoutActions,
    rightDock,
  }: Props = $props();

  let canvasHost = $state<HTMLDivElement | undefined>(undefined);
  let canvas = $state<HTMLCanvasElement | undefined>(undefined);
  let chart: PhaseOneChartApi | null = null;
  let candleSeries: PhaseOneCandlestickSeriesApi | null = null;
  let overlaySeries = $state<PhaseOneLineSeriesApi[]>([]);
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
  let lastOverlaySignature: string | null = null;
  let lastIndicatorSignature: string | null = null;
  let lastAutoRangeModelKey: string | null = null;
  let lastVirtualRangeSignature: string | null = null;
  let virtualRangeMonitorFrame: number | null = null;
  let virtualRangeMonitorRemaining = 0;

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
  type MarkerTooltipState = {
    label: string;
    detail: string;
    color?: string;
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
  let readoutTooltip = $state({
    visible: false,
    x: 0,
    y: 0,
  });
  let markerTooltip = $state<MarkerTooltipState | null>(null);
  const layout = $derived(normalizePhaseOneMarketChartSurfaceLayout({ chrome, density, readoutPosition, rightDockMode }));
  const readoutMode = $derived(resolvePhaseOneMarketChartReadoutMode(model));
  const activeDataLength = $derived(resolvePhaseOneMarketChartActiveDataLength(model));

  function destroyChart(): void {
    teardownCrosshair?.();
    teardownCrosshair = null;
    chart?.destroy();
    chart = null;
    candleSeries = null;
    overlaySeries = [];
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

  function applyModelPriceFormatter(): void {
    chart?.priceScale().applyOptions({
      priceFormatter: model.priceFormatter ?? null,
    });
  }

  function applyModelPriceRange(): void {
    chart?.priceScale().setVisibleRange(model.visiblePriceRange ?? null);
  }

  function applyModelTimeFormatter(): void {
    chart?.timeScale().applyOptions({
      tickMarkFormatter: model.timeFormatter ?? null,
    });
  }

  function applyModelPriceScale(): void {
    applyModelPriceFormatter();
    applyModelPriceRange();
  }

  function resolveModelRangeKey(): string {
    return [
      resolvePhaseOneMarketChartDisplayMode(model),
      model.symbol,
      model.timeframeLabel,
    ].join("|");
  }

  function shouldAutoFitData(): boolean {
    const modelRangeKey = resolveModelRangeKey();
    if (model.virtualRange?.preserveVisibleRangeOnDataUpdate !== true) {
      lastAutoRangeModelKey = modelRangeKey;
      return true;
    }
    if (lastAutoRangeModelKey !== modelRangeKey) {
      lastAutoRangeModelKey = modelRangeKey;
      return true;
    }
    return chart?.timeScale().getVisibleLogicalRange() === null;
  }

  function resolveOverlaySignature(): string {
    if (resolvePhaseOneMarketChartDisplayMode(model) !== "candlestick") {
      return "";
    }
    return resolvePhaseOneMarketChartOverlayLines(model)
      .map((line) => `${line.id}:${line.color ?? ""}:${line.lineWidth ?? ""}`)
      .join("|");
  }

  function setVisibleLogicalRange(range: { from: number; to: number }): void {
    chart?.timeScale().setVisibleLogicalRange(range);
    scheduleVirtualRangeReport();
  }

  function reportVirtualRangeIfChanged(): void {
    if (chart === null || onVirtualRangeChange === undefined) {
      return;
    }
    const virtualRange = resolvePhaseOneMarketChartVirtualRange(
      chart.timeScale().getVisibleLogicalRange(),
      activeDataLength,
      model.virtualRange,
    );
    if (virtualRange === null) {
      return;
    }
    const signature = [
      virtualRange.from.toFixed(3),
      virtualRange.to.toFixed(3),
      virtualRange.dataLength,
      virtualRange.nearStart ? "start" : "",
      virtualRange.nearEnd ? "end" : "",
    ].join("|");
    if (signature === lastVirtualRangeSignature) {
      return;
    }
    lastVirtualRangeSignature = signature;
    onVirtualRangeChange(virtualRange);
  }

  function scheduleVirtualRangeReport(): void {
    if (typeof requestAnimationFrame !== "function") {
      reportVirtualRangeIfChanged();
      return;
    }
    requestAnimationFrame(() => {
      reportVirtualRangeIfChanged();
    });
  }

  function startVirtualRangeMonitor(frameCount = 16): void {
    virtualRangeMonitorRemaining = Math.max(virtualRangeMonitorRemaining, frameCount);
    if (virtualRangeMonitorFrame !== null || typeof requestAnimationFrame !== "function") {
      return;
    }
    const tick = () => {
      virtualRangeMonitorFrame = null;
      reportVirtualRangeIfChanged();
      virtualRangeMonitorRemaining -= 1;
      if (virtualRangeMonitorRemaining > 0) {
        virtualRangeMonitorFrame = requestAnimationFrame(tick);
      }
    };
    virtualRangeMonitorFrame = requestAnimationFrame(tick);
  }

  function panLogicalRange(deltaBars: number): void {
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (range === undefined || range === null || !Number.isFinite(deltaBars) || deltaBars === 0) {
      return;
    }
    setVisibleLogicalRange({
      from: range.from + deltaBars,
      to: range.to + deltaBars,
    });
  }

  function zoomLogicalRange(direction: "in" | "out"): void {
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (range === undefined || range === null) {
      return;
    }
    const width = Math.max(6, range.to - range.from);
    const nextWidth = direction === "in" ? Math.max(6, width / 1.18) : width * 1.18;
    const center = (range.from + range.to) / 2;
    setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  }

  function handleCanvasHostPointerDown(): void {
    canvasHost?.focus({ preventScroll: true });
    startVirtualRangeMonitor();
  }

  function handleCanvasHostWheel(event: WheelEvent): void {
    if (model.virtualRange?.enabled !== true) {
      return;
    }
    event.preventDefault();
    // The chart canvas owns its normal wheel zoom. Virtual-range mode replaces
    // that behavior, so capture the event before it reaches the canvas instead
    // of applying a second viewport transform during bubbling.
    event.stopPropagation();
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (range === undefined || range === null) {
      return;
    }
    const width = Math.max(1, range.to - range.from + 1);
    if (event.ctrlKey || event.metaKey || event.altKey) {
      zoomLogicalRange(event.deltaY <= 0 ? "in" : "out");
      startVirtualRangeMonitor(10);
      return;
    }
    const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const deltaBars = Math.sign(rawDelta) * Math.max(1, Math.round(width * 0.08));
    panLogicalRange(deltaBars);
    startVirtualRangeMonitor(10);
  }

  function handleCanvasHostKeydown(event: KeyboardEvent): void {
    if (model.virtualRange?.enabled !== true) {
      return;
    }
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (range === undefined || range === null) {
      return;
    }
    const width = Math.max(1, range.to - range.from + 1);
    const step = Math.max(1, Math.round(width * 0.12));
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      panLogicalRange(-step);
      startVirtualRangeMonitor();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      panLogicalRange(step);
      startVirtualRangeMonitor();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      zoomLogicalRange("in");
      startVirtualRangeMonitor();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      zoomLogicalRange("out");
      startVirtualRangeMonitor();
    }
  }

  function applyReadout(event: PhaseOneCrosshairMoveEvent): void {
    if (!event.active) {
      readout = createEmptyReadout();
      readoutTooltip = { visible: false, x: 0, y: 0 };
      markerTooltip = null;
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
      volume: resolveReadoutVolume(event),
    };
    readoutTooltip = event.point === null
      ? { visible: false, x: 0, y: 0 }
      : { visible: true, x: event.point.x, y: event.point.y };
    markerTooltip = resolveMarkerTooltip(event);
  }

  function resolveMarkerTooltip(event: PhaseOneCrosshairMoveEvent): MarkerTooltipState | null {
    if (event.time === null || event.point === null) {
      return null;
    }
    const matched = resolvePhaseOneMarketChartSurfaceMarkers(model).find((marker) =>
      marker.time === event.time && typeof marker.tooltip === "string" && marker.tooltip.trim() !== "",
    );
    if (matched === undefined) {
      return null;
    }
    return {
      label: matched.text?.trim() || "标记",
      detail: matched.tooltip?.trim() ?? "",
      color: matched.color,
    };
  }

  function resolveReadoutVolume(event: PhaseOneCrosshairMoveEvent): string {
    const seriesVolume = event.series.find((entry) => entry.kind === "volume");
    if (seriesVolume !== undefined) {
      return seriesVolume.formattedValue;
    }

    if (event.time === null) {
      return "--";
    }

    const modelVolume = findVolumeAtTime(model.volume ?? [], event.time);
    if (modelVolume !== null) {
      return formatVolumeAxisLabel(modelVolume);
    }

    const timeshareVolume = model.intradayTimeshare?.points.find((point) => point.time === event.time)?.volume;
    return timeshareVolume === undefined ? "--" : formatVolumeAxisLabel(timeshareVolume);
  }

  function findVolumeAtTime(volume: readonly PhaseOneVolumeData[], time: number): number | null {
    for (const item of volume) {
      if (item.time === time) {
        return item.value;
      }
    }
    return null;
  }

  function readoutTooltipStyle(): string {
    const left = Math.max(0, Math.round(readoutTooltip.x + 12));
    const top = Math.max(0, Math.round(readoutTooltip.y + 12));
    return `left: clamp(8px, ${left}px, calc(100% - 132px)); top: clamp(8px, ${top}px, calc(100% - 168px));`;
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
      timesharePriceSeries.setMarkers(resolvePhaseOneMarketChartSurfaceMarkers(model));
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
        if (shouldAutoFitData()) {
          setVisibleLogicalRange({
            from: Math.max(-0.5, lastLogical - visibleBars + 1 - 0.5),
            to: lastLogical + 6.5,
          });
        } else {
          scheduleVirtualRangeReport();
        }
      }
      return;
    }

    if (candleSeries === null) {
      return;
    }
    candleSeries.setData(model.bars);
    candleSeries.setMarkers(resolvePhaseOneMarketChartSurfaceMarkers(model));
    for (const [index, line] of resolvePhaseOneMarketChartOverlayLines(model).entries()) {
      overlaySeries[index]?.setData(line.data);
    }
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
      if (shouldAutoFitData()) {
        setVisibleLogicalRange({
          from: Math.max(-0.5, lastLogical - visibleBars + 1 - 0.5),
          to: lastLogical + 6.5,
        });
      } else {
        scheduleVirtualRangeReport();
      }
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
    applyModelPriceScale();
    applyModelTimeFormatter();

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

      const nextOverlaySeries: PhaseOneLineSeriesApi[] = [];
      for (const overlayLine of resolvePhaseOneMarketChartOverlayLines(model)) {
        const nextSeries = chart.addOverlaySeries();
        nextSeries.applyOptions({
          color: overlayLine.color ?? "#0f5964",
          lineWidth: overlayLine.lineWidth ?? 1,
        });
        nextOverlaySeries.push(nextSeries);
      }
      overlaySeries = nextOverlaySeries;

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
    const nextOverlaySignature = resolveOverlaySignature();
    const nextTimeshareAverageMode =
      nextDisplayMode === "intraday-timeshare" && timesharePoints.some((point) => point.averagePrice !== undefined);
    const nextBaselineMode =
      nextDisplayMode === "intraday-timeshare" && model.intradayTimeshare?.previousClose !== undefined;
    const nextIndicatorSignature = resolvePhaseOneMarketChartIndicatorPanes(model)
      .map((pane) => `${pane.id}:${pane.height}:${pane.series.map((series) => `${series.kind}:${series.id}:${series.color ?? ""}`).join(",")}`)
      .join("|");

    if (!mounted) {
      return;
    }

    if (
      chart === null ||
      lastDisplayMode !== nextDisplayMode ||
      lastVolumeMode !== nextVolumeMode ||
      lastOverlaySignature !== nextOverlaySignature ||
      nextTimeshareAverageMode !== (timeshareAverageSeries !== null) ||
      lastTimeshareBaselineMode !== nextBaselineMode ||
      lastIndicatorSignature !== nextIndicatorSignature
    ) {
      lastDisplayMode = nextDisplayMode;
      lastVolumeMode = nextVolumeMode;
      lastOverlaySignature = nextOverlaySignature;
      lastTimeshareBaselineMode = nextBaselineMode;
      lastIndicatorSignature = nextIndicatorSignature;
      rebuildChart();
      return;
    }

    applyModelPriceScale();
    applyModelTimeFormatter();
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
    lastOverlaySignature = resolveOverlaySignature();
    lastTimeshareBaselineMode =
      nextDisplayMode === "intraday-timeshare" && model.intradayTimeshare?.previousClose !== undefined;
    lastIndicatorSignature = resolvePhaseOneMarketChartIndicatorPanes(model)
      .map((pane) => `${pane.id}:${pane.height}:${pane.series.map((series) => `${series.kind}:${series.id}:${series.color ?? ""}`).join(",")}`)
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
      if (virtualRangeMonitorFrame !== null) {
        cancelAnimationFrame(virtualRangeMonitorFrame);
        virtualRangeMonitorFrame = null;
      }
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
    {#if readoutDisplay === "inline"}
      <span>T {readout.time}</span>
      {#if readoutMode === "timeshare"}
        <span>现 {readout.price}</span>
        <span>均 {readout.averagePrice}</span>
        <span>量 {readout.volume}</span>
      {:else}
        <span>开 {readout.open}</span>
        <span>高 {readout.high}</span>
        <span>低 {readout.low}</span>
        <span>收 {readout.close}</span>
        <span>量 {readout.volume}</span>
      {/if}
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
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        class="canvas-host"
        bind:this={canvasHost}
        tabindex="0"
        role="application"
        aria-label={`${model.symbol} ${model.timeframeLabel} chart viewport`}
        onpointerdown={handleCanvasHostPointerDown}
        onwheelcapture={handleCanvasHostWheel}
        onkeydown={handleCanvasHostKeydown}
      >
        <canvas bind:this={canvas} aria-label={`${model.symbol} ${model.timeframeLabel} market chart`}></canvas>
        {#if readoutDisplay === "tooltip" && readoutTooltip.visible}
          <div
            class="readout-tooltip"
            aria-label="Chart hover readout"
            data-phase-one-market-chart-readout-tooltip
            style={readoutTooltipStyle()}
          >
            <div><span>时间</span><strong>{readout.time}</strong></div>
            {#if readoutMode === "timeshare"}
              <div><span>现价</span><strong>{readout.price}</strong></div>
              <div><span>均价</span><strong>{readout.averagePrice}</strong></div>
              <div><span>成交量</span><strong>{readout.volume}</strong></div>
            {:else}
              <div><span>开</span><strong>{readout.open}</strong></div>
              <div><span>高</span><strong>{readout.high}</strong></div>
              <div><span>低</span><strong>{readout.low}</strong></div>
              <div><span>收</span><strong>{readout.close}</strong></div>
              <div><span>成交量</span><strong>{readout.volume}</strong></div>
            {/if}
            {#if markerTooltip}
              <div class="marker-tooltip-row">
                <span style={`color: ${markerTooltip.color ?? "#607279"}`}>{markerTooltip.label}</span>
                <strong>{markerTooltip.detail}</strong>
              </div>
            {/if}
          </div>
        {/if}
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

  .readout-tooltip {
    position: absolute;
    z-index: 12;
    width: max-content;
    min-width: 112px;
    max-width: 210px;
    display: grid;
    gap: 2px;
    padding: 6px 7px;
    border: 1px solid rgba(91, 107, 115, 0.42);
    background: rgba(248, 250, 249, 0.94);
    box-shadow: 0 2px 8px rgba(15, 28, 34, 0.16);
    color: #33434b;
    font-size: 11px;
    line-height: 1.25;
    pointer-events: none;
  }

  .readout-tooltip div {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: baseline;
    column-gap: 6px;
  }

  .readout-tooltip span {
    color: #607279;
  }

  .readout-tooltip strong {
    min-width: 0;
    overflow: hidden;
    color: #17252b;
    font-weight: 760;
    text-align: right;
    text-overflow: ellipsis;
  }

  .readout-tooltip .marker-tooltip-row {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 2px;
    border-top: 1px solid rgba(96, 114, 121, 0.18);
    padding-top: 4px;
  }

  .readout-tooltip .marker-tooltip-row strong {
    white-space: normal;
    text-align: left;
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
