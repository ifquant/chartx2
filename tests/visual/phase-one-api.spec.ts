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
