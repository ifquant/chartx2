import { expect, test } from "@playwright/test";

const PUBLIC_ENTRY = "/src/lib/chartx/public/index.ts";
const API_DATA = [
  { time: 1, open: 120, high: 132, low: 118, close: 128 },
  { time: 2, open: 128, high: 136, low: 124, close: 133 },
  { time: 3, open: 133, high: 140, low: 129, close: 131 },
  { time: 4, open: 131, high: 138, low: 126, close: 136 },
] as const;
const VOLUME_CANDLE_API_DATA = [
  { time: 1, open: 120, high: 132, low: 118, close: 128, volume: 820_000 },
  { time: 2, open: 128, high: 136, low: 124, close: 133, volume: 1_420_000 },
  { time: 3, open: 133, high: 140, low: 129, close: 131, volume: 960_000 },
  { time: 4, open: 131, high: 138, low: 126, close: 136, volume: 1_760_000 },
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
const RENKO_ALIGNMENT_BARS = [
  { time: 1, open: 100, high: 102, low: 99, close: 101 },
  { time: 2, open: 101, high: 103, low: 100, close: 102 },
  { time: 3, open: 102, high: 104, low: 101, close: 103 },
  { time: 4, open: 103, high: 104, low: 101, close: 102 },
  { time: 5, open: 102, high: 103, low: 100, close: 101 },
  { time: 6, open: 101, high: 102, low: 99, close: 100 },
  { time: 7, open: 100, high: 101, low: 98, close: 99 },
  { time: 8, open: 99, high: 101, low: 98, close: 100 },
  { time: 9, open: 100, high: 103, low: 99, close: 102 },
  { time: 10, open: 102, high: 105, low: 101, close: 104 },
  { time: 11, open: 104, high: 106, low: 103, close: 105 },
  { time: 12, open: 105, high: 107, low: 104, close: 106 },
] as const;
const RENKO_ALIGNMENT_VOLUME = [
  { time: 1, value: 600_000, up: true },
  { time: 2, value: 640_000, up: true },
  { time: 3, value: 680_000, up: true },
  { time: 4, value: 610_000, up: false },
  { time: 5, value: 590_000, up: false },
  { time: 6, value: 560_000, up: false },
  { time: 7, value: 530_000, up: false },
  { time: 8, value: 545_000, up: true },
  { time: 9, value: 625_000, up: true },
  { time: 10, value: 710_000, up: true },
  { time: 11, value: 760_000, up: true },
  { time: 12, value: 805_000, up: true },
] as const;

type PaneSeriesSnapshot = {
  id: string;
  label: string;
  kind: string;
  chartType: string | null;
  sourceRole: string;
  studyKind: string | null;
  inputContextMode: string | null;
  priceScaleId: string;
  inputCapability: string | null;
  builder: string | null;
  renderer: string | null;
  styleSchemaId: string | null;
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
  panes: readonly {
    paneIndex: number;
    seriesCount: number;
    seriesKinds: readonly string[];
    series: readonly PaneSeriesSnapshot[];
  }[];
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

test("phase-one public api can switch the active main chart type to line-markers", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-line-markers-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-line-markers-canvas" aria-label="phase-one api line markers chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-line-markers-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API line markers fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addLineSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("line-markers");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("line-markers");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "line",
    chartType: "line-markers",
    sourceRole: "main-series",
    inputCapability: "c",
    builder: "time-bars",
    renderer: "line-markers",
    styleSchemaId: "lineWithMarkersStyle",
    pointCount: 5,
  });

  const fixture = page.locator("#api-line-markers-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-line-markers-series.png");
});

test("phase-one public api can switch the active main chart type to stepline", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-stepline-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-stepline-canvas" aria-label="phase-one api stepline chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-stepline-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API stepline fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addLineSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("stepline");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: LINE_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("stepline");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "line",
    chartType: "stepline",
    sourceRole: "main-series",
    inputCapability: "c",
    builder: "time-bars",
    renderer: "stepline",
    styleSchemaId: "steplineStyle",
    pointCount: 5,
  });

  const fixture = page.locator("#api-stepline-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-stepline-series.png");
});

test("phase-one public api can switch the active main chart type to hollow-candles", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-hollow-candles-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-hollow-candles-canvas" aria-label="phase-one api hollow candles chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-hollow-candles-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API hollow candles fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("hollow-candles");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("hollow-candles");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "hollow-candles",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "hollow-candles",
    styleSchemaId: "hollowCandleStyle",
    pointCount: 4,
  });

  const fixture = page.locator("#api-hollow-candles-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-hollow-candles-series.png");
});

test("phase-one public api can switch the active main chart type to line-break", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-line-break-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-line-break-canvas" aria-label="phase-one api line break chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-line-break-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API line break fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("line-break");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, {
    data: [
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 108, low: 101, close: 106 },
      { time: 3, open: 106, high: 109, low: 105, close: 108 },
      { time: 4, open: 108, high: 111, low: 107, close: 110 },
      { time: 5, open: 110, high: 111, low: 102, close: 103 },
      { time: 6, open: 103, high: 104, low: 97, close: 98 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.chartType).toBe("line-break");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "line-break",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "line-break",
    renderer: "candles",
    styleSchemaId: "lineBreakStyle",
    pointCount: 6,
  });

  const fixture = page.locator("#api-line-break-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-line-break-series.png");
});

test("phase-one public api can switch the active main chart type to point-figure", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-point-figure-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-point-figure-canvas" aria-label="phase-one api point figure chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-point-figure-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API point figure fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("point-figure");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, {
    data: [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.chartType).toBe("point-figure");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "point-figure",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "point-figure",
    renderer: "point-figure",
    styleSchemaId: "pnfStyle",
    pointCount: 1,
  });

  const fixture = page.locator("#api-point-figure-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-point-figure-series.png");
});

test("phase-one point-figure main series can take a fixed box size through series options", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-point-figure-options-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-point-figure-options-canvas" aria-label="phase-one api point figure options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-point-figure-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API point figure options fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    mainSeries.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    const pointFigureSeries = chart.setChartType("point-figure");
    chart.addPane({ height: 98 });
    const autoPointCount = paneEvents[0]?.panes[0]?.series[0]?.pointCount ?? 0;
    pointFigureSeries.applyOptions({
      pointFigureBoxSizeMode: "fixed",
      pointFigureBoxSize: 8,
      pointFigureReversalBoxes: 3,
    });
    chart.addPane({ height: 82 });

    return {
      autoPointCount,
      fixedPointCount: paneEvents[1]?.panes[0]?.series[0]?.pointCount ?? 0,
    };
  }, {
    data: [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.autoPointCount).toBeGreaterThan(0);
  expect(result.fixedPointCount).toBeLessThanOrEqual(result.autoPointCount);
});

test("phase-one public api can switch the active main chart type to kagi", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-kagi-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-kagi-canvas" aria-label="phase-one api kagi chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-kagi-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API kagi fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addLineSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("kagi");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, {
    data: [
      { time: 1, value: 100 },
      { time: 2, value: 104 },
      { time: 3, value: 108 },
      { time: 4, value: 103 },
      { time: 5, value: 98 },
      { time: 6, value: 105 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.chartType).toBe("kagi");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "line",
    chartType: "kagi",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "kagi",
    renderer: "segment",
    styleSchemaId: "kagiStyle",
    pointCount: 3,
  });

  const fixture = page.locator("#api-kagi-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-kagi-series.png");
});

test("phase-one public api can switch the active main chart type to volume-candles", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-volume-candles-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-volume-candles-canvas" aria-label="phase-one api volume candles chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-volume-candles-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API volume candles fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addCandlestickSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("volume-candles");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: VOLUME_CANDLE_API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("volume-candles");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "volume-candles",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "volume-candles",
    styleSchemaId: "volumeCandleStyle",
    pointCount: 4,
  });

  const fixture = page.locator("#api-volume-candles-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-volume-candles-series.png");
});

test("phase-one public api can switch the active main chart type to hlc-bars", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-hlc-bars-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-hlc-bars-canvas" aria-label="phase-one api hlc bars chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-hlc-bars-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API hlc bars fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addBarSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("hlc-bars");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("hlc-bars");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "bar",
    chartType: "hlc-bars",
    sourceRole: "main-series",
    inputCapability: "ohlc",
    builder: "time-bars",
    renderer: "hlc-bars",
    styleSchemaId: "hlcBarStyle",
    pointCount: 4,
  });

  const fixture = page.locator("#api-hlc-bars-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-hlc-bars-series.png");
});

test("phase-one public api can switch the active main chart type to high-low", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-high-low-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-high-low-canvas" aria-label="phase-one api high low chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-high-low-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API high low fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const series = chart.addBarSeries();
    series.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("high-low");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("high-low");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "bar",
    chartType: "high-low",
    sourceRole: "main-series",
    inputCapability: "ohlc",
    builder: "time-bars",
    renderer: "high-low",
    styleSchemaId: "highLowStyle",
    pointCount: 4,
  });

  const fixture = page.locator("#api-high-low-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-high-low-series.png");
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

test("phase-one public api can switch the active main chart type without rebuilding the chart shell", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-chart-type-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-chart-type-canvas" aria-label="phase-one api chart type"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-chart-type-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const initialSeries = chart.addCandlestickSeries();
    initialSeries.setData(data);
    const chartTypeEvents: string[] = [];
    const paneEvents: PaneEventSnapshot[] = [];
    const handler = (type: string) => {
      chartTypeEvents.push(type);
    };
    const paneHandler = (event: PaneEventSnapshot) => {
      paneEvents.push(event);
    };
    chart.subscribeChartTypeChange(handler);
    chart.subscribePaneEvents(paneHandler);
    const chartTypeBefore = chart.getChartType();
    const nextSeries = chart.setChartType("line");
    chart.addPane({ height: 104 });

    let staleMessage = "";
    try {
      initialSeries.applyOptions({ upColor: "#000000" });
    } catch (error) {
      staleMessage = error instanceof Error ? error.message : String(error);
    }

    chart.unsubscribeChartTypeChange(handler);
    chart.unsubscribePaneEvents(paneHandler);

    return {
      chartTypeBefore,
      chartTypeAfter: chart.getChartType(),
      chartTypeEvents,
      staleMessage,
      nextSeriesAlive: typeof nextSeries.applyOptions === "function",
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartTypeBefore).toBe("candlestick");
  expect(result.chartTypeAfter).toBe("line");
  expect(result.chartTypeEvents).toEqual(["line"]);
  expect(result.nextSeriesAlive).toBe(true);
  expect(result.staleMessage).toContain("series has been removed");
  expect(result.paneEvents[0]?.type).toBe("added");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    id: "series-1",
    label: "Candlestick 1",
    kind: "line",
    chartType: "line",
    sourceRole: "main-series",
    inputCapability: "c",
    builder: "time-bars",
    renderer: "line",
    styleSchemaId: "lineStyle",
    pointCount: 4,
  });
});

test("phase-one public api can switch the active main chart type to heikin-ashi", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-heikin-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-heikin-canvas" aria-label="phase-one api heikin-ashi chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-heikin-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    mainSeries.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("heikin-ashi");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("heikin-ashi");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "heikin-ashi",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "heikin-ashi",
    renderer: "candles",
    styleSchemaId: "haStyle",
    pointCount: 4,
  });
});

test("phase-one public api can switch the active main chart type to renko", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-renko-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-renko-canvas" aria-label="phase-one api renko chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-renko-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    mainSeries.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    chart.setChartType("renko");
    chart.addPane({ height: 98 });

    return {
      chartType: chart.getChartType(),
      paneEvents,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.chartType).toBe("renko");
  expect(result.paneEvents[0]?.panes[0]?.series[0]).toMatchObject({
    kind: "candlestick",
    chartType: "renko",
    sourceRole: "main-series",
    inputCapability: "ohlcv",
    builder: "renko",
    renderer: "brick",
    styleSchemaId: "renkoStyle",
  });
  expect(result.paneEvents[0]?.panes[0]?.series[0]?.pointCount).toBeGreaterThan(0);
});

test("phase-one renko main series can take a fixed box size through series options", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ data, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-renko-options-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-renko-options-canvas" aria-label="phase-one api renko options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-renko-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    mainSeries.setData(data);
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    const renkoSeries = chart.setChartType("renko");
    chart.addPane({ height: 98 });
    const autoPointCount = paneEvents[0]?.panes[0]?.series[0]?.pointCount ?? 0;
    renkoSeries.applyOptions({
      renkoBoxSizeMode: "fixed",
      renkoBoxSize: 2,
    });
    chart.addPane({ height: 82 });

    return {
      autoPointCount,
      fixedPointCount: paneEvents[1]?.panes[0]?.series[0]?.pointCount ?? 0,
    };
  }, { data: API_DATA, publicEntry: PUBLIC_ENTRY });

  expect(result.autoPointCount).toBeGreaterThan(0);
  expect(result.fixedPointCount).toBeGreaterThan(result.autoPointCount);
});

test("phase-one public api keeps a compressed renko main series aligned with secondary panes", async ({
  page,
}) => {
  await page.goto("/");
  const result: {
    readout: ReadoutSnapshot | null;
    panes: Array<{ paneIndex: number; hasSeries: boolean }>;
  } = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-renko-alignment-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-renko-alignment-canvas" aria-label="phase-one api renko alignment chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-renko-alignment-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API renko alignment fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const volumePane = chart.addPane({ height: 108 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);
    chart.setChartType("renko");

    let readout: ReadoutSnapshot | null = null;
    canvas.addEventListener("chartx:readout", (event) => {
      const detail = (event as CustomEvent<{
        paneIndex: number | null;
        series: Array<{ label: string; color: string; value: number | null }>;
      }>).detail;
      readout = {
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
      clientX: rect.left + rect.width * 0.82,
      clientY: rect.top + rect.height * 0.24,
      bubbles: true,
    }));

    return {
      readout,
      panes: chart.panes().map((pane: { paneIndex(): number; hasSeries(): boolean }) => ({
        paneIndex: pane.paneIndex(),
        hasSeries: pane.hasSeries(),
      })),
    };
  }, {
    bars: RENKO_ALIGNMENT_BARS,
    volume: RENKO_ALIGNMENT_VOLUME,
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.readout?.paneIndex).toBe(0);
  expect(result.readout?.series[0]?.value).not.toBeNull();
  expect(result.panes).toEqual([
    { paneIndex: 0, hasSeries: true },
    { paneIndex: 1, hasSeries: true },
  ]);

  const fixture = page.locator("#api-renko-alignment-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-renko-secondary-alignment.png");
});

test("phase-one public api keeps a compressed point-figure main series aligned with secondary panes", async ({
  page,
}) => {
  await page.goto("/");
  const result: {
    readout: ReadoutSnapshot | null;
    panes: Array<{ paneIndex: number; hasSeries: boolean }>;
  } = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-point-figure-alignment-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-point-figure-alignment-canvas" aria-label="phase-one api point figure alignment chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-point-figure-alignment-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API point-figure alignment fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const volumePane = chart.addPane({ height: 108 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);
    chart.setChartType("point-figure");

    let readout: ReadoutSnapshot | null = null;
    canvas.addEventListener("chartx:readout", (event) => {
      const detail = (event as CustomEvent<{
        paneIndex: number | null;
        series: Array<{ label: string; color: string; value: number | null }>;
      }>).detail;
      readout = {
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
      clientX: rect.left + rect.width * 0.82,
      clientY: rect.top + rect.height * 0.24,
      bubbles: true,
    }));

    return {
      readout,
      panes: chart.panes().map((pane: { paneIndex(): number; hasSeries(): boolean }) => ({
        paneIndex: pane.paneIndex(),
        hasSeries: pane.hasSeries(),
      })),
    };
  }, {
    bars: RENKO_ALIGNMENT_BARS,
    volume: RENKO_ALIGNMENT_VOLUME,
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.readout?.paneIndex).toBe(0);
  expect(result.readout?.series[0]?.value).not.toBeNull();
  expect(result.panes).toEqual([
    { paneIndex: 0, hasSeries: true },
    { paneIndex: 1, hasSeries: true },
  ]);
});

test("phase-one public api keeps a compressed kagi main series aligned with secondary panes", async ({
  page,
}) => {
  await page.goto("/");
  const result: {
    readout: ReadoutSnapshot | null;
    panes: Array<{ paneIndex: number; hasSeries: boolean }>;
  } = await page.evaluate(async ({ bars, volume, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-kagi-alignment-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-kagi-alignment-canvas" aria-label="phase-one api kagi alignment chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-kagi-alignment-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API kagi alignment fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const volumePane = chart.addPane({ height: 108 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);
    chart.setChartType("kagi");

    let readout: ReadoutSnapshot | null = null;
    canvas.addEventListener("chartx:readout", (event) => {
      const detail = (event as CustomEvent<{
        paneIndex: number | null;
        series: Array<{ label: string; color: string; value: number | null }>;
      }>).detail;
      readout = {
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
      clientX: rect.left + rect.width * 0.82,
      clientY: rect.top + rect.height * 0.24,
      bubbles: true,
    }));

    return {
      readout,
      panes: chart.panes().map((pane: { paneIndex(): number; hasSeries(): boolean }) => ({
        paneIndex: pane.paneIndex(),
        hasSeries: pane.hasSeries(),
      })),
    };
  }, {
    bars: RENKO_ALIGNMENT_BARS,
    volume: RENKO_ALIGNMENT_VOLUME,
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.readout?.paneIndex).toBe(0);
  expect(result.readout?.series[0]?.value).not.toBeNull();
  expect(result.panes).toEqual([
    { paneIndex: 0, hasSeries: true },
    { paneIndex: 1, hasSeries: true },
  ]);
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
        series: Array<{ id: string; label: string; kind: string; chartType: string | null; sourceRole: string; studyKind: string | null; priceScaleId: string; inputCapability: string | null; builder: string | null; renderer: string | null; styleSchemaId: string | null; pointCount: number }>;
      };
      panes: Array<{
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; chartType: string | null; sourceRole: string; studyKind: string | null; priceScaleId: string; inputCapability: string | null; builder: string | null; renderer: string | null; styleSchemaId: string | null; pointCount: number }>;
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
        series: Array<{ id: string; label: string; kind: string; chartType: string | null; sourceRole: string; studyKind: string | null; priceScaleId: string; inputCapability: string | null; builder: string | null; renderer: string | null; styleSchemaId: string | null; pointCount: number }>;
      };
      panes: Array<{
        paneIndex: number;
        height: number;
        isPrimary: boolean;
        resizable: boolean;
        hasSeries: boolean;
        seriesCount: number;
        seriesKinds: string[];
        series: Array<{ id: string; label: string; kind: string; chartType: string | null; sourceRole: string; studyKind: string | null; priceScaleId: string; inputCapability: string | null; builder: string | null; renderer: string | null; styleSchemaId: string | null; pointCount: number }>;
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
    chartType: null,
    sourceRole: "study",
    studyKind: "series",
    inputContextMode: "chart-context",
    priceScaleId: "pane-1-right",
    inputCapability: null,
    builder: null,
    renderer: null,
    styleSchemaId: null,
    pointCount: 5,
  }]);
  expect(result.events[2]?.panes[1]?.height).toBe(result.events[2]?.pane.height);
  expect(result.events[2]?.panes[0]?.seriesKinds).toEqual(["candlestick"]);
  expect(result.events[2]?.panes[0]?.series).toEqual([{
    id: "series-1",
    label: "Candlestick 1",
    kind: "candlestick",
    chartType: "candlestick",
    sourceRole: "main-series",
    studyKind: null,
    inputContextMode: null,
    priceScaleId: "primary-right",
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "candles",
    styleSchemaId: "candleStyle",
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

test("phase-one public api supports overlay and compare studies in the primary pane", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ bars, line, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-overlay-compare-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-overlay-compare-canvas" aria-label="phase-one api overlay compare chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-overlay-compare-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API overlay compare fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const overlaySeries = chart.addOverlaySeries();
    const compareSeries = chart.addCompareSeries();
    mainSeries.setData(bars);
    overlaySeries.setData(line);
    compareSeries.setData(line.map((point, index) => ({
      time: point.time,
      value: point.value + 4 + index,
    })));
    overlaySeries.applyOptions({ color: "#7c3aed", lineWidth: 2 });
    compareSeries.applyOptions({ color: "#f59e0b", lineWidth: 2 });

    const events: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      events.push(event);
    });
    chart.addPane({ height: 112 });

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
      clientX: rect.left + rect.width * 0.54,
      clientY: rect.top + rect.height * 0.28,
      bubbles: true,
    }));

    return {
      events,
      readout: lastReadout,
    };
  }, {
    bars: API_DATA,
    line: LINE_API_DATA,
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.events).toHaveLength(1);
  expect(result.events[0]?.pane.paneIndex).toBe(1);
  expect(result.events[0]?.panes[0]?.series.map((series) => ({
    kind: series.kind,
    sourceRole: series.sourceRole,
    studyKind: series.studyKind,
    inputContextMode: series.inputContextMode,
    builder: series.builder,
    renderer: series.renderer,
  }))).toEqual([
    {
      kind: "candlestick",
      sourceRole: "main-series",
      studyKind: null,
      inputContextMode: null,
      builder: "time-bars",
      renderer: "candles",
    },
    {
      kind: "line",
      sourceRole: "study",
      studyKind: "overlay",
      inputContextMode: "chart-context",
      builder: null,
      renderer: null,
    },
    {
      kind: "line",
      sourceRole: "study",
      studyKind: "compare",
      inputContextMode: "chart-context",
      builder: null,
      renderer: null,
    },
  ]);
  const readout = result.readout as ReadoutSnapshot | null;
  expect(readout?.paneIndex).toBe(0);
  expect(readout?.series).toHaveLength(3);
  expect(readout?.series.map((series) => series.color)).toEqual(["#0c8f62", "#7c3aed", "#f59e0b"]);

  const fixture = page.locator("#api-overlay-compare-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-overlay-compare-primary.png");
});

test("phase-one public api supports a moving-average study on chart-context and requested-context data", async ({
  page,
}) => {
  await page.goto("/");
  const result: {
    chartContextReadout: ReadoutSnapshot | null;
    requestedContextReadout: ReadoutSnapshot | null;
    paneSeries: readonly PaneSeriesSnapshot[];
    studyOptions: {
      length: number;
      inputContextMode: string;
      requestedSymbol: string | null;
      requestedResolution: string | null;
      requestedSession: string | null;
      requestedTimezone: string | null;
      mergePolicy: string;
    };
  } = await page.evaluate(async ({ bars, requested, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-moving-average-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-moving-average-canvas" aria-label="phase-one api moving average study chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-moving-average-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API moving average fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    chart.resize(720, 448);
    const studyPane = chart.addPane({ height: 112 });
    const mainSeries = chart.addCandlestickSeries();
    const movingAverage = chart.addMovingAverageStudy({ pane: studyPane });
    mainSeries.setData(bars);
    movingAverage.applyOptions({ color: "#7c3aed", lineWidth: 2 });
    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });

    let chartContextReadout: ReadoutSnapshot | null = null;
    let requestedContextReadout: ReadoutSnapshot | null = null;
    let moveCount = 0;
    canvas.addEventListener("chartx:readout", (event) => {
      const detail = (event as CustomEvent<{
        paneIndex: number | null;
        series: Array<{ label: string; color: string; value: number | null }>;
      }>).detail;
      const snapshot = {
        paneIndex: detail.paneIndex,
        series: detail.series.map((series) => ({
          label: series.label,
          color: series.color,
          value: series.value,
        })),
      };
      moveCount += 1;
      if (moveCount === 1) {
        chartContextReadout = snapshot;
      } else {
        requestedContextReadout = snapshot;
      }
    });

    const rect = canvas.getBoundingClientRect();
    const layoutTop = 28;
    const paneGap = 10;
    const plotHeight = 448 - layoutTop - 34;
    const initialStudyPaneCenterY = rect.top + layoutTop + (plotHeight - paneGap - 112) + paneGap + 56;
    canvas.dispatchEvent(new PointerEvent("pointermove", {
      clientX: rect.left + rect.width * 0.98,
      clientY: initialStudyPaneCenterY,
      bubbles: true,
    }));

    movingAverage.setData(requested);
    movingAverage.applyStudyOptions({
      length: 2,
      inputContextMode: "requested-context",
      requestedSymbol: "NASDAQ:NDX",
      requestedResolution: "1H",
      mergePolicy: "carry-forward",
    });
    chart.addPane({ height: 84 });

    const resizedStudyPaneCenterY = rect.top + layoutTop + (plotHeight - paneGap * 2 - 112 - 84) + paneGap + 56;
    canvas.dispatchEvent(new PointerEvent("pointermove", {
      clientX: rect.left + rect.width * 0.98,
      clientY: resizedStudyPaneCenterY,
      bubbles: true,
    }));

    return {
      chartContextReadout,
      requestedContextReadout,
      paneSeries: paneEvents[paneEvents.length - 1]?.panes[1]?.series ?? [],
      studyOptions: movingAverage.getStudyOptions(),
    };
  }, {
    bars: [
      { time: 1, open: 120, high: 124, low: 118, close: 123 },
      { time: 2, open: 123, high: 126, low: 121, close: 124 },
      { time: 3, open: 124, high: 128, low: 122, close: 127 },
      { time: 4, open: 127, high: 129, low: 125, close: 128 },
      { time: 5, open: 128, high: 137, low: 127, close: 136 },
    ],
    requested: [
      { time: 2, value: 200 },
      { time: 4, value: 240 },
      { time: 5, value: 260 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.chartContextReadout?.paneIndex).toBe(1);
  expect(result.chartContextReadout?.series[0]?.value).toBe(130.33333333333334);
  expect(result.requestedContextReadout?.paneIndex).toBe(1);
  expect(result.requestedContextReadout?.series[0]?.value).toBe(250);
  expect(result.paneSeries[0]).toMatchObject({
    studyKind: "indicator",
    inputContextMode: "requested-context",
  });
  expect(result.studyOptions).toEqual({
    length: 2,
    inputContextMode: "requested-context",
    requestedSymbol: "NASDAQ:NDX",
    requestedResolution: "1H",
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  });
});

test("phase-one public api can exclude compare studies from primary autoscale", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async (publicEntry) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-compare-scale-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-compare-scale-canvas" aria-label="phase-one api compare scale chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-compare-scale-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API compare scale fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const compareSeries = chart.addCompareSeries();
    mainSeries.setData([
      { time: 1, open: 120, high: 124, low: 118, close: 123 },
      { time: 2, open: 123, high: 126, low: 121, close: 124 },
      { time: 3, open: 124, high: 128, low: 122, close: 127 },
      { time: 4, open: 127, high: 129, low: 125, close: 128 },
    ]);
    compareSeries.setData([
      { time: 1, value: 980 },
      { time: 2, value: 1010 },
      { time: 3, value: 1045 },
      { time: 4, value: 1090 },
    ]);
    compareSeries.applyOptions({ color: "#f59e0b", lineWidth: 2 });

    const before = chart.priceScale().getVisibleRange();
    chart.priceScale().applyOptions({ scaleSeriesOnly: true });
    const after = chart.priceScale().getVisibleRange();

    return { before, after };
  }, PUBLIC_ENTRY);

  expect(result.before?.maxValue ?? 0).toBeGreaterThan(500);
  expect(result.after?.maxValue ?? 0).toBeLessThan(150);
  expect(result.after?.minValue ?? 0).toBeGreaterThan(110);

  const fixture = page.locator("#api-compare-scale-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-compare-scale-series-only.png");
});

test("phase-one compare series can opt out of primary autoscale without a chart-level scale flag", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async (publicEntry) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-compare-series-options-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-compare-series-options-canvas" aria-label="phase-one api compare series options chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-compare-series-options-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API compare series options fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const compareSeries = chart.addCompareSeries();
    mainSeries.setData([
      { time: 1, open: 120, high: 124, low: 118, close: 123 },
      { time: 2, open: 123, high: 126, low: 121, close: 124 },
      { time: 3, open: 124, high: 128, low: 122, close: 127 },
      { time: 4, open: 127, high: 129, low: 125, close: 128 },
    ]);
    compareSeries.setData([
      { time: 1, value: 980 },
      { time: 2, value: 1010 },
      { time: 3, value: 1045 },
      { time: 4, value: 1090 },
    ]);
    compareSeries.applyOptions({ color: "#f59e0b", lineWidth: 2 });

    const before = chart.priceScale().getVisibleRange();
    compareSeries.applyCompareOptions({ affectMainScale: false });
    const after = chart.priceScale().getVisibleRange();
    const compareOptions = compareSeries.getCompareOptions();

    return { before, after, compareOptions };
  }, PUBLIC_ENTRY);

  expect(result.before?.maxValue ?? 0).toBeGreaterThan(500);
  expect(result.after?.maxValue ?? 0).toBeLessThan(150);
  expect(result.compareOptions).toEqual({
    affectMainScale: false,
    inputContextMode: "chart-context",
    requestedSymbol: null,
    requestedResolution: null,
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  });

  const fixture = page.locator("#api-compare-series-options-fixture");
  await expect(fixture).toBeVisible();
  await expect(fixture).toHaveScreenshot("phase-one-api-compare-series-options.png");
});

test("phase-one compare series can request another context and merge it back onto the current chart bars", async ({
  page,
}) => {
  await page.goto("/");
  const result: {
    compareOptions: {
      affectMainScale: boolean;
      inputContextMode: string;
      requestedSymbol: string | null;
      requestedResolution: string | null;
      requestedSession: string | null;
      requestedTimezone: string | null;
      mergePolicy: string;
    };
    panes: PaneEventSnapshot["panes"];
    readout: ReadoutSnapshot | null;
  } = await page.evaluate(async ({ bars, compare, publicEntry }) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    document.body.innerHTML = `
      <div id="api-compare-requested-context-fixture" style="width: 760px; padding: 20px; background: #fffdf7;">
        <canvas id="api-compare-requested-context-canvas" aria-label="phase-one api compare requested-context chart"></canvas>
      </div>
    `;

    const canvas = document.getElementById("api-compare-requested-context-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("API compare requested-context fixture did not create a canvas");
    }

    const chart = createChartxPhaseOneChart(canvas);
    const mainSeries = chart.addCandlestickSeries();
    const compareSeries = chart.addCompareSeries();
    mainSeries.setData(bars);
    compareSeries.setData(compare);
    compareSeries.applyCompareOptions({
      inputContextMode: "requested-context",
      requestedSymbol: "NASDAQ:NDX",
      requestedResolution: "1H",
      mergePolicy: "carry-forward",
    });

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

    const paneEvents: PaneEventSnapshot[] = [];
    chart.subscribePaneEvents((event: PaneEventSnapshot) => {
      paneEvents.push(event);
    });
    chart.addPane({ height: 96 });

    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent("pointermove", {
      clientX: rect.left + rect.width * 0.98,
      clientY: rect.top + rect.height * 0.24,
      bubbles: true,
    }));

    return {
      compareOptions: compareSeries.getCompareOptions(),
      panes: paneEvents[0]?.panes ?? [],
      readout: lastReadout,
    };
  }, {
    bars: API_DATA,
    compare: [
      { time: 2, value: 210 },
      { time: 4, value: 240 },
    ],
    publicEntry: PUBLIC_ENTRY,
  });

  expect(result.compareOptions).toEqual({
    affectMainScale: true,
    inputContextMode: "requested-context",
    requestedSymbol: "NASDAQ:NDX",
    requestedResolution: "1H",
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  });
  expect(result.panes[0]?.series[1]?.inputContextMode).toBe("requested-context");
  expect(result.readout?.series.map((series) => series.value)).toEqual([136, 240]);
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
