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
    minValue: expect.any(Number),
    maxValue: expect.any(Number),
  });
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
