import { expect, test } from "@playwright/test";

const PUBLIC_ENTRY = "/src/lib/chartx/public/index.ts";
const API_DATA = [
  { time: 1, open: 120, high: 132, low: 118, close: 128 },
  { time: 2, open: 128, high: 136, low: 124, close: 133 },
  { time: 3, open: 133, high: 140, low: 129, close: 131 },
  { time: 4, open: 131, high: 138, low: 126, close: 136 },
] as const;
const LINE_API_DATA = [
  { time: 1, value: 126 },
  { time: 2, value: 130 },
  { time: 3, value: 128 },
  { time: 4, value: 135 },
  { time: 5, value: 133 },
] as const;
const BAR_API_DATA = [
  { time: 1, open: 120, high: 132, low: 118, close: 128 },
  { time: 2, open: 128, high: 136, low: 124, close: 130 },
  { time: 3, open: 130, high: 137, low: 126, close: 127 },
  { time: 4, open: 127, high: 139, low: 123, close: 135 },
] as const;
const HISTOGRAM_API_DATA = [
  { time: 1, value: 24 },
  { time: 2, value: 38 },
  { time: 3, value: 31 },
  { time: 4, value: 44 },
  { time: 5, value: 29 },
] as const;
const VOLUME_API_DATA = [
  { time: 1, value: 820_000, up: true },
  { time: 2, value: 1_140_000, up: false },
  { time: 3, value: 960_000, up: false, color: "#9b5de5" },
  { time: 4, value: 1_520_000, up: true },
  { time: 5, value: 1_180_000, up: false },
] as const;

type PaneSeriesSnapshot = {
  id: string;
  label: string;
  kind: string;
  sourceRole: string;
  priceScaleId: string;
  pointCount: number;
};

type PaneEventSnapshot = {
  type: string;
  pane: {
    paneIndex: number;
    seriesCount: number;
    seriesKinds: readonly string[];
    series: readonly PaneSeriesSnapshot[];
  };
};

type ReadoutSnapshot = {
  paneIndex: number | null;
  series: Array<{ label: string; color: string; value: number | null }>;
};

test("phase-one public api mounts a single candlestick chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-canvas" aria-label="phase-one api chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    (window as Window & { __chartxApiDestroy?: () => void }).__chartxApiDestroy =
      chart.destroy;
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-happy-path.png");

  const metrics = await page.locator("#api-canvas").evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("API fixture canvas is missing");
    }

    return {
      width: element.width,
      height: element.height,
    };
  });
  expect(metrics.width).toBeGreaterThan(0);
  expect(metrics.height).toBeGreaterThan(0);
});

test("phase-one public api applies an incremental update and rerenders", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-update-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-update-canvas" aria-label="phase-one api update chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-update-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API update fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    series.update({ time: 5, open: 136, high: 145, low: 134, close: 143 });
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-update-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-update.png");
});

test("phase-one public api mounts a single line chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-line-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-line-canvas" aria-label="phase-one api line chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-line-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API line fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addLineSeries();
    series.setData(data);
  }, { data: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-line-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-line-series.png");
});

test("phase-one public api mounts a single area chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-area-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-area-canvas" aria-label="phase-one api area chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-area-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API area fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addAreaSeries();
    series.setData(data);
    series.applyOptions({
      lineColor: "#2563eb",
      topColor: "rgba(37, 99, 235, 0.34)",
      bottomColor: "rgba(37, 99, 235, 0.02)",
    });
  }, { data: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-area-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-area-series.png");
});

test("phase-one public api mounts a single baseline chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-baseline-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-baseline-canvas" aria-label="phase-one api baseline chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-baseline-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API baseline fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addBaselineSeries();
    series.applyOptions({
      baseValue: 130,
      topLineColor: "#0f766e",
      topFillTopColor: "rgba(15, 118, 110, 0.24)",
      topFillBottomColor: "rgba(15, 118, 110, 0.02)",
      bottomLineColor: "#c7543e",
      bottomFillTopColor: "rgba(199, 84, 62, 0.03)",
      bottomFillBottomColor: "rgba(199, 84, 62, 0.22)",
    });
    series.setData(data);
  }, { data: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-baseline-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-baseline-series.png");
});

test("phase-one public api renders series-level price lines", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-price-line-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-price-line-canvas" aria-label="phase-one api price line chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-price-line-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API price line fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    series.createPriceLine({ price: 134, color: "#0c8f62", title: "Support" });
    series.createPriceLine({ price: 138, color: "#c7543e", title: "Resistance" });
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-price-line-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-price-lines.png");
});

test("phase-one public api renders series-level markers", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-marker-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-marker-canvas" aria-label="phase-one api marker chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-marker-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API marker fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    series.setMarkers([
      { time: 2, position: "belowBar", shape: "arrowUp", color: "#0c8f62", text: "Buy" },
      { time: 3, position: "aboveBar", shape: "arrowDown", color: "#c7543e", text: "Sell" },
      { time: 4, position: "inBar", shape: "circle", color: "#2563eb", text: "Info" },
    ]);
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-marker-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-markers.png");
});

test("phase-one public api mounts a single bar chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-bar-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-bar-canvas" aria-label="phase-one api bar chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-bar-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API bar fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addBarSeries();
    series.setData(data);
  }, { data: BAR_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-bar-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-bar-series.png");
});

test("phase-one public api mounts a single histogram chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-histogram-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-histogram-canvas" aria-label="phase-one api histogram chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-histogram-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API histogram fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addHistogramSeries();
    series.setData(data);
  }, { data: HISTOGRAM_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-histogram-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-histogram-series.png");
});

test("phase-one public api mounts a single volume chart and renders the first frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-volume-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-volume-canvas" aria-label="phase-one api volume chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-volume-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API volume fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addVolumeSeries();
    series.setData(data);
  }, { data: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-volume-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-volume-series.png");
});

test("phase-one public api mounts a candlestick chart with a dedicated volume pane", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-multipane-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-multipane-canvas" aria-label="phase-one api multi-pane chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-multipane-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API multi-pane fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addVolumeSeries();
    mainSeries.setData(bars);
    volumeSeries.setData(volume);
  }, { bars: API_DATA, volume: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-multipane-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-multi-pane.png");
});

test("phase-one public api supports pane lifecycle operations around a dedicated volume pane", async ({
  page,
}) => {
  await page.goto("/");
  const paneMetrics = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-pane-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-pane-canvas" aria-label="phase-one api pane lifecycle chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-pane-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API pane fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const volumePane = chart.addPane({ height: 118 });
    const sparePane = chart.addPane({ height: 92 });
    volumePane.setHeight(142);
    const mainSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);

    const beforeRemove = chart.panes().map((pane: {
      paneIndex(): number;
      getHeight(): number;
      isPrimary(): boolean;
      hasSeries(): boolean;
    }) => ({
      index: pane.paneIndex(),
      height: pane.getHeight(),
      primary: pane.isPrimary(),
      hasSeries: pane.hasSeries(),
    }));

    chart.removePane(sparePane);

    const afterRemove = chart.panes().map((pane: {
      paneIndex(): number;
      getHeight(): number;
      isPrimary(): boolean;
      hasSeries(): boolean;
    }) => ({
      index: pane.paneIndex(),
      height: pane.getHeight(),
      primary: pane.isPrimary(),
      hasSeries: pane.hasSeries(),
    }));

    return {
      beforeRemove,
      afterRemove,
    };
  }, { bars: API_DATA, volume: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(paneMetrics.beforeRemove).toHaveLength(3);
  expect(paneMetrics.afterRemove).toHaveLength(2);
  expect(paneMetrics.afterRemove[0]?.primary).toBe(true);
  expect(paneMetrics.afterRemove[1]?.hasSeries).toBe(true);
  expect(paneMetrics.afterRemove[1]?.height).toBeGreaterThanOrEqual(120);

  const fixture = page.locator("#api-pane-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-pane-lifecycle.png");
});

test("phase-one public api exposes pane options and resizable state", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-pane-options-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-pane-options-canvas" aria-label="phase-one api pane options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-pane-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API pane options fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const volumePane = chart.addPane({ height: 124, resizable: false });
    const mainSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);

    const before = {
      options: volumePane.getOptions(),
      resizable: volumePane.isResizable(),
      height: volumePane.getHeight(),
    };

    volumePane.applyOptions({ resizable: true, height: 148 });

    const after = {
      options: volumePane.getOptions(),
      resizable: volumePane.isResizable(),
      height: volumePane.getHeight(),
    };

    return { before, after };
  }, { bars: API_DATA, volume: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.before.resizable).toBe(false);
  expect(result.before.options.resizable).toBe(false);
  expect(result.after.resizable).toBe(true);
  expect(result.after.options.resizable).toBe(true);
  expect(result.after.options.height).toBe(148);
  expect(result.after.height).toBeGreaterThanOrEqual(140);

  const fixture = page.locator("#api-pane-options-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-pane-options.png");
});

test("phase-one public api lets pane handles observe resize events", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-pane-resize-events-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-pane-resize-events-canvas" aria-label="phase-one api pane resize events chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-pane-resize-events-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API pane resize events fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const volumePane = chart.addPane({ height: 122, resizable: true });
    const mainSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);

    const events: Array<{ paneIndex: number; height: number; isPrimary: boolean }> = [];
    const handler = (event: { paneIndex: number; height: number; isPrimary: boolean }) => {
      events.push(event);
    };

    volumePane.subscribeResize(handler);
    volumePane.setHeight(146);
    volumePane.applyOptions({ height: 158 });
    volumePane.unsubscribeResize(handler);
    volumePane.setHeight(170);

    return {
      events,
      height: volumePane.getHeight(),
    };
  }, { bars: API_DATA, volume: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.events).toHaveLength(2);
  expect(result.events[0]?.paneIndex).toBe(1);
  expect(result.events[0]?.isPrimary).toBe(false);
  expect(result.events[0]?.height).toBeGreaterThanOrEqual(140);
  expect(result.events[1]?.height).toBeGreaterThan(result.events[0]?.height ?? 0);
  expect(result.height).toBeGreaterThan(result.events[1]?.height ?? 0);

  const fixture = page.locator("#api-pane-resize-events-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-pane-resize-events.png");
});

test("phase-one public api exposes a chart-level pane event bus", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-pane-bus-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-pane-bus-canvas" aria-label="phase-one api pane event bus chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-pane-bus-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API pane event bus fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const events: Array<{
      type: string;
      pane: {
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; sourceRole: string; priceScaleId: string; pointCount: number }>;
      };
      panes: Array<{
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; sourceRole: string; priceScaleId: string; pointCount: number }>;
      }>;
    }> = [];
    const handler = (event: {
      type: string;
      pane: {
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; sourceRole: string; priceScaleId: string; pointCount: number }>;
      };
      panes: Array<{
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; sourceRole: string; priceScaleId: string; pointCount: number }>;
      }>;
    }) => {
      events.push(event);
    };

    chart.subscribePaneEvents(handler);
    const studyPane = chart.addPane({ height: 118, resizable: true });
    const mainSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addVolumeSeries({ pane: studyPane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);
    studyPane.applyOptions({ resizable: false });
    studyPane.setHeight(146);
    chart.removePane(chart.addPane({ height: 96, resizable: false }));
    chart.unsubscribePaneEvents(handler);
    studyPane.applyOptions({ height: 162 });

    return {
      events,
      finalHeight: studyPane.getHeight(),
    };
  }, { bars: API_DATA, volume: VOLUME_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.events.map((event) => event.type)).toEqual(["added", "options", "resized", "added", "removed"]);
  expect(result.events[0]?.pane.paneIndex).toBe(1);
  expect(result.events[0]?.pane.isPrimary).toBe(false);
  expect(result.events[0]?.pane.hasSeries).toBe(false);
  expect(result.events[0]?.pane.seriesCount).toBe(0);
  expect(result.events[0]?.pane.seriesKinds).toEqual([]);
  expect(result.events[0]?.pane.series).toEqual([]);
  expect(result.events[0]?.panes).toHaveLength(2);
  expect(result.events[1]?.pane.resizable).toBe(false);
  expect(result.events[1]?.panes[1]?.resizable).toBe(false);
  expect(result.events[2]?.pane.height).toBeGreaterThanOrEqual(140);
  expect(result.events[2]?.pane.seriesCount).toBe(1);
  expect(result.events[2]?.pane.seriesKinds).toEqual(["volume"]);
  expect(result.events[2]?.pane.series).toEqual([{
    id: "series-2",
    label: "Volume 2",
    kind: "volume",
    sourceRole: "study",
    priceScaleId: "pane-1-right",
    pointCount: 5,
  }]);
  expect(result.events[2]?.panes[1]?.height).toBe(result.events[2]?.pane.height);
  expect(result.events[2]?.panes[0]?.seriesKinds).toEqual(["candlestick"]);
  expect(result.events[2]?.panes[0]?.series).toEqual([{
    id: "series-1",
    label: "Candlestick 1",
    kind: "candlestick",
    sourceRole: "main-series",
    priceScaleId: "primary-right",
    pointCount: 4,
  }]);
  expect(result.events[1]?.panes[1]?.series[0]?.id).toBe(result.events[2]?.pane.series[0]?.id);
  expect(result.events[1]?.panes[1]?.series[0]?.label).toBe(result.events[2]?.pane.series[0]?.label);
  expect(result.events[4]?.pane.paneIndex).toBe(2);
  expect(result.events[4]?.panes).toHaveLength(2);
  expect(result.finalHeight).toBeGreaterThan(result.events[2]?.pane.height ?? 0);

  const fixture = page.locator("#api-pane-bus-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-pane-event-bus.png");
});

test("phase-one public api lets a line series target a managed secondary pane", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ bars, line, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-secondary-line-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-secondary-line-canvas" aria-label="phase-one api secondary line chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-secondary-line-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API secondary line fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const studyPane = chart.addPane({ height: 124 });
    const mainSeries = chart.addCandlestickSeries();
    const lineSeries = chart.addLineSeries({ pane: studyPane });
    mainSeries.setData(bars);
    lineSeries.setData(line);
  }, { bars: API_DATA, line: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-secondary-line-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-secondary-line-pane.png");
});

test("phase-one public api lets a candlestick series target a managed secondary pane", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ bars, line, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-secondary-candles-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-secondary-candles-canvas" aria-label="phase-one api secondary candlestick chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-secondary-candles-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API secondary candlestick fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const studyPane = chart.addPane({ height: 136 });
    const mainSeries = chart.addLineSeries({ pane: chart.panes()[0] });
    const candleSeries = chart.addCandlestickSeries({ pane: studyPane });
    mainSeries.setData(line);
    candleSeries.setData(bars);
  }, { bars: API_DATA, line: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-secondary-candles-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-secondary-candles-pane.png");
});

test("phase-one public api supports controlled multi-series composition in one managed secondary pane", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ bars, line, histogram, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-secondary-multi-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-secondary-multi-canvas" aria-label="phase-one api multi-series secondary pane chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-secondary-multi-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API secondary multi-series fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });
    const studyPane = chart.addPane({ height: 132 });
    const mainSeries = chart.addCandlestickSeries();
    const lineSeries = chart.addLineSeries({ pane: studyPane });
    const histogramSeries = chart.addHistogramSeries({ pane: studyPane });
    mainSeries.setData(bars);
    lineSeries.setData(line);
    histogramSeries.setData(histogram);
    lineSeries.applyOptions({ color: "#7c3aed", lineWidth: 3 });
    histogramSeries.applyOptions({ upColor: "#f59e0b", downColor: "#f59e0b" });
    studyPane.setHeight(148);

    let lastReadout: ReadoutSnapshot | null = null;
    canvas.addEventListener("chartx:readout", (event) => {
      const detail = (event as CustomEvent<{
        paneIndex: number | null;
        series: Array<{ label: string; color: string; value: number | null }>;
      }>).detail;
      lastReadout = {
        paneIndex: detail.paneIndex,
        series: detail.series.map((series) => ({
          label: series.label,
          color: series.color,
          value: series.value,
        })),
      };
    });

    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent("pointermove", {
      clientX: rect.left + rect.width * 0.58,
      clientY: rect.top + rect.height * 0.77,
      bubbles: true,
    }));

    return {
      panes: chart.panes().map((pane: { paneIndex(): number; getHeight(): number; hasSeries(): boolean }) => ({
        paneIndex: pane.paneIndex(),
        height: pane.getHeight(),
        hasSeries: pane.hasSeries(),
      })),
      paneEvents,
      readout: lastReadout,
    };
  }, {
    bars: API_DATA,
    line: LINE_API_DATA,
    histogram: HISTOGRAM_API_DATA,
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.panes).toHaveLength(2);
  expect(result.panes[1]?.hasSeries).toBe(true);
  expect(result.panes[1]?.height).toBeGreaterThanOrEqual(140);
  expect(result.paneEvents.map((event) => event.type)).toEqual(["added", "resized"]);
  expect(result.paneEvents[1]?.pane.seriesCount).toBe(2);
  expect(result.paneEvents[1]?.pane.seriesKinds).toEqual(["line", "histogram"]);
  expect(result.paneEvents[1]?.pane.series.map((series) => series.label)).toEqual(["Line 2", "Histogram 3"]);
  const readout = result.readout as ReadoutSnapshot | null;
  expect(readout?.paneIndex).toBe(1);
  expect(readout?.series.map((series) => series.label)).toEqual(["Line 2", "Histogram 3"]);
  expect(readout?.series.map((series) => series.color)).toEqual(["#7c3aed", "#f59e0b"]);

  const fixture = page.locator("#api-secondary-multi-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-secondary-multi-series-pane.png");
});

test("phase-one public api rejects invalid chart hosts", async ({ page }) => {
  await page.goto("/");
  const message = await page.evaluate(async (publicEntry) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    try {
      createChartxPhaseOneChart(document.createElement("div") as unknown as HTMLCanvasElement);
      return "no-error";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, PUBLIC_ENTRY);

  expect(message).toContain("HTMLCanvasElement");
});

test("phase-one public api supports resize, crosshair subscriptions, and series removal", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-control-fixture" style="width: 900px; padding: 20px; background: #fffdf7;">
        <canvas id="api-control-canvas" aria-label="phase-one api control chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-control-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API control fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const events: Array<{ active: boolean; time: number | null; hasPoint: boolean }> = [];
    const handler = (event: { active: boolean; time: number | null; point: { x: number; y: number } | null }) => {
      events.push({
        active: event.active,
        time: event.time,
        hasPoint: event.point !== null,
      });
    };

    chart.subscribeCrosshairMove(handler);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    chart.resize(640, 360);

    (window as Window & {
      __chartxControl?: {
        series: unknown;
        chart: {
          removeSeries(series: unknown): void;
          unsubscribeCrosshairMove(handler: unknown): void;
        };
        handler: typeof handler;
        events: typeof events;
      };
    }).__chartxControl = {
      series,
      chart,
      handler,
      events,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const canvas = page.getByLabel("phase-one api control chart");
  await expect(canvas).toBeVisible();

  const metrics = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("API control fixture canvas is missing");
    }

    return {
      width: element.width,
      height: element.height,
      cssWidth: parseFloat(getComputedStyle(element).width),
      cssHeight: parseFloat(getComputedStyle(element).height),
    };
  });
  expect(metrics.cssWidth).toBe(640);
  expect(metrics.cssHeight).toBe(360);
  expect(metrics.width).toBeGreaterThan(0);
  expect(metrics.height).toBeGreaterThan(0);

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("API control fixture canvas is missing");
  }

  await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.37);

  const activeEvent = await page.evaluate(() => {
    const state = (window as Window & {
      __chartxControl?: {
        events: Array<{ active: boolean; time: number | null; hasPoint: boolean }>;
      };
    }).__chartxControl;

    return state?.events.at(-1) ?? null;
  });
  expect(activeEvent).toEqual({
    active: true,
    time: expect.any(Number),
    hasPoint: true,
  });

  const removalResult = await page.evaluate(() => {
    const state = (window as Window & {
      __chartxControl?: {
        series: { update(bar: unknown): void };
        chart: {
          removeSeries(series: unknown): void;
          unsubscribeCrosshairMove(handler: unknown): void;
        };
        handler: unknown;
      };
    }).__chartxControl;

    if (!state) {
      throw new Error("API control state is missing");
    }

    state.chart.removeSeries(state.series);
    state.chart.unsubscribeCrosshairMove(state.handler);

    try {
      state.series.update({ time: 5, open: 1, high: 1, low: 1, close: 1 });
      return "no-error";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  });

  expect(removalResult).toContain("series has been removed");
});

test("phase-one public api supports applyOptions and scale handles", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-options-fixture" style="width: 820px; padding: 20px; background: #fffdf7;">
        <canvas id="api-options-canvas" aria-label="phase-one api options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API options fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);

    chart.applyOptions({
      layout: {
        backgroundColor: "#f3efe4",
        paneBackgroundColor: "#fff8e8",
        gridColor: "rgba(63, 111, 216, 0.14)",
      },
    });

    const timeScale = chart.timeScale();
    timeScale.applyOptions({
      barSpacing: 14,
      rightOffset: 1.25,
      tickMarkFormatter: (time: number) => `T-${time}`,
    });
    timeScale.setVisibleLogicalRange({ from: 1.5, to: 4.6 });

    const priceScale = chart.priceScale();
    priceScale.applyOptions({
      priceFormatter: (value: number) => `${value.toFixed(1)} pts`,
    });
    priceScale.setVisibleRange({
      minValue: 120,
      maxValue: 142,
    });

    (window as Window & {
      __chartxOptionsState?: {
        logicalRange: { from: number; to: number } | null;
        priceRange: { minValue: number; maxValue: number } | null;
      };
    }).__chartxOptionsState = {
      logicalRange: chart.timeScale().getVisibleLogicalRange(),
      priceRange: chart.priceScale().getVisibleRange(),
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-options-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-options.png");

  const state = await page.evaluate(() => {
    return (window as Window & {
      __chartxOptionsState?: {
        logicalRange: { from: number; to: number } | null;
        priceRange: { minValue: number; maxValue: number } | null;
      };
    }).__chartxOptionsState ?? null;
  });

  expect(state?.logicalRange).toEqual({
    from: expect.any(Number),
    to: expect.any(Number),
  });
  expect(state?.priceRange).toEqual({
    minValue: 120,
    maxValue: 142,
  });
  expect(state?.logicalRange?.from).toBeCloseTo(1.5, 1);
  expect(state?.logicalRange?.to).toBeCloseTo(4.6, 1);
});

test("phase-one public api supports click subscriptions and series-level options", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-series-options-fixture" style="width: 820px; padding: 20px; background: #fffdf7;">
        <canvas id="api-series-options-canvas" aria-label="phase-one api series options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-series-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API series options fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const events: Array<{ active: boolean; hasPoint: boolean; time: number | null }> = [];
    const clickHandler = (event: {
      active: boolean;
      point: { x: number; y: number } | null;
      time: number | null;
    }) => {
      events.push({
        active: event.active,
        hasPoint: event.point !== null,
        time: event.time,
      });
    };

    chart.subscribeClick(clickHandler);
    chart.applyOptions({
      layout: {
        backgroundColor: "#f7f4ea",
        paneBackgroundColor: "#fff6dd",
        gridColor: "rgba(199, 84, 62, 0.16)",
        frameColor: "rgba(199, 84, 62, 0.34)",
        axisTextColor: "rgba(70, 46, 26, 0.88)",
        axisLabelBackground: "rgba(255, 247, 221, 0.96)",
        axisLabelBorder: "rgba(199, 84, 62, 0.22)",
        axisActiveBackground: "#c7543e",
        axisActiveText: "#fffdf7",
      },
      crosshair: {
        lineColor: "rgba(199, 84, 62, 0.55)",
        pointColor: "#c7543e",
      },
    });

    const series = chart.addLineSeries();
    series.applyOptions({
      color: "#c7543e",
      lineWidth: 4,
    });
    series.setData([
      { time: 1, value: 126 },
      { time: 2, value: 130 },
      { time: 3, value: 128 },
      { time: 4, value: 135 },
      { time: 5, value: 133 },
    ]);

    (window as Window & {
      __chartxSeriesOptionsState?: {
        events: Array<{ active: boolean; hasPoint: boolean; time: number | null }>;
        chart: { unsubscribeClick(handler: unknown): void };
        clickHandler: typeof clickHandler;
      };
    }).__chartxSeriesOptionsState = {
      events,
      chart,
      clickHandler,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  const fixture = page.locator("#api-series-options-fixture");
  const canvas = page.getByLabel("phase-one api series options chart");
  await expect(fixture).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("API series options fixture canvas is missing");
  }

  await page.mouse.click(box.x + box.width * 0.54, box.y + box.height * 0.42);
  await expect(fixture).toHaveScreenshot("phase-one-api-series-options.png");

  const clickEvent = await page.evaluate(() => {
    const state = (window as Window & {
      __chartxSeriesOptionsState?: {
        events: Array<{ active: boolean; hasPoint: boolean; time: number | null }>;
      };
    }).__chartxSeriesOptionsState;

    return state?.events.at(-1) ?? null;
  });

  expect(clickEvent).toEqual({
    active: true,
    hasPoint: true,
    time: expect.any(Number),
  });

  const unsubscribeCount = await page.evaluate(() => {
    const state = (window as Window & {
      __chartxSeriesOptionsState?: {
        events: Array<{ active: boolean; hasPoint: boolean; time: number | null }>;
        chart: { unsubscribeClick(handler: unknown): void };
        clickHandler: unknown;
      };
    }).__chartxSeriesOptionsState;

    if (!state) {
      throw new Error("API series options state is missing");
    }

    const before = state.events.length;
    state.chart.unsubscribeClick(state.clickHandler);
    return before;
  });

  await page.mouse.click(box.x + box.width * 0.44, box.y + box.height * 0.36);
  const afterUnsubscribeCount = await page.evaluate(() => {
    const state = (window as Window & {
      __chartxSeriesOptionsState?: {
        events: Array<{ active: boolean; hasPoint: boolean; time: number | null }>;
      };
    }).__chartxSeriesOptionsState;

    return state?.events.length ?? 0;
  });

  expect(afterUnsubscribeCount).toBe(unsubscribeCount);
});
