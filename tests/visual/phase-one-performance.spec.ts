import { expect, test } from "@playwright/test";

const PUBLIC_ENTRY = "/src/lib/chartx/public/index.ts";

test("phase-one chart keeps 2k and 5k bar flows within the local smoke budget", async ({
  page,
}) => {
  await page.goto("/");
  const metrics = await page.evaluate(async (publicEntry) => {
    const { createChartxPhaseOneChart } = await import(/* @vite-ignore */ publicEntry);

    function buildBars(count: number) {
      const startTime = Date.UTC(2025, 0, 2, 9, 30);
      let lastClose = 18_000;

      return Array.from({ length: count }, (_, index) => {
        const drift = Math.sin(index / 11) * 16 + Math.cos(index / 7) * 8;
        const open = lastClose + Math.sin(index / 5) * 6;
        const close = open + drift;
        const high = Math.max(open, close) + 10;
        const low = Math.min(open, close) - 10;
        lastClose = close;

        return {
          time: startTime + index * 60_000,
          open,
          high,
          low,
          close,
        };
      });
    }

    async function measureSeries(count: number) {
      document.body.innerHTML = `
        <div id="perf-fixture" style="width: 960px; padding: 16px; background: #fffdf7;">
          <canvas id="perf-canvas" aria-label="phase-one perf chart"></canvas>
        </div>
      `;

      const canvas = document.getElementById("perf-canvas");
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("Performance fixture did not create a canvas");
      }

      const chart = createChartxPhaseOneChart(canvas);
      const series = chart.addCandlestickSeries();
      const bars = buildBars(count);

      const renderStart = performance.now();
      series.setData(bars);
      const renderEnd = performance.now();

      const wheelStart = performance.now();
      canvas.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -180, bubbles: true, cancelable: true }),
      );
      const wheelEnd = performance.now();

      const rect = canvas.getBoundingClientRect();
      const pointerX = rect.left + rect.width * 0.52;
      const pointerY = rect.top + rect.height * 0.46;

      const crosshairStart = performance.now();
      canvas.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: pointerX,
          clientY: pointerY,
        }),
      );
      const crosshairEnd = performance.now();

      const panStart = performance.now();
      canvas.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: count,
          clientX: pointerX,
          clientY: pointerY,
        }),
      );
      canvas.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: count,
          clientX: pointerX - rect.width * 0.14,
          clientY: pointerY,
        }),
      );
      canvas.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          pointerId: count,
          clientX: pointerX - rect.width * 0.14,
          clientY: pointerY,
        }),
      );
      const panEnd = performance.now();

      chart.destroy();

      return {
        count,
        renderMs: renderEnd - renderStart,
        wheelMs: wheelEnd - wheelStart,
        crosshairMs: crosshairEnd - crosshairStart,
        panMs: panEnd - panStart,
      };
    }

    return {
      bars2k: await measureSeries(2_000),
      bars5k: await measureSeries(5_000),
    };
  }, PUBLIC_ENTRY);

  expect(metrics.bars2k.renderMs).toBeLessThan(120);
  expect(metrics.bars2k.wheelMs).toBeLessThan(80);
  expect(metrics.bars2k.crosshairMs).toBeLessThan(80);
  expect(metrics.bars2k.panMs).toBeLessThan(120);

  expect(metrics.bars5k.renderMs).toBeLessThan(260);
  expect(metrics.bars5k.wheelMs).toBeLessThan(160);
  expect(metrics.bars5k.crosshairMs).toBeLessThan(160);
  expect(metrics.bars5k.panMs).toBeLessThan(220);
});
