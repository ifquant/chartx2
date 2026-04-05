import { expect, test, type Page } from "@playwright/test";

function featureTab(page: Page, name: string) {
  return page.locator(".top-tabs").getByRole("button", { name, exact: true });
}

test("workbench opens by default and renders the baseline chart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Workbench" })).toHaveClass(/active/);

  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness.png");
});

test("workbench keeps a deterministic smaller-layout baseline", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 1100 });
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness-narrow.png");
});

test("workbench keeps a deterministic high-dpi baseline", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      get: () => 2,
    });
  });

  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness-hidpi.png");

  const metrics = await canvas.evaluate((node) => {
    if (!(node instanceof HTMLCanvasElement)) {
      throw new Error("phase-one harness canvas is missing");
    }

    return {
      width: node.width,
      height: node.height,
      cssWidth: parseFloat(getComputedStyle(node).width),
      cssHeight: parseFloat(getComputedStyle(node).height),
    };
  });

  expect(Math.abs(metrics.width - metrics.cssWidth * 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.height - metrics.cssHeight * 2)).toBeLessThanOrEqual(1);
});

test("workbench renders a deterministic crosshair snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  const readout = page.locator('[data-demo-tab="workbench"] .readout-bar').first();
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.33);
  await expect(readout).not.toContainText("O --");
  await expect(readout).not.toContainText("H --");
  await expect(readout).not.toContainText("L --");
  await expect(readout).not.toContainText("C --");
  await expect(frame).toHaveScreenshot("phase-one-harness-crosshair.png");
});

test("workbench renders a deterministic zoomed viewport snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  await canvas.evaluate((node) => {
    node.dispatchEvent(new WheelEvent("wheel", { deltaY: -240, bubbles: true, cancelable: true }));
    node.dispatchEvent(new WheelEvent("wheel", { deltaY: -240, bubbles: true, cancelable: true }));
  });

  await expect(frame).toHaveScreenshot("phase-one-harness-zoomed.png");
});

test("workbench renders a deterministic dragged viewport snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  const startX = box.x + box.width * 0.62;
  const startY = box.y + box.height * 0.48;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - box.width * 0.18, startY, { steps: 8 });
  await page.mouse.up();

  await expect(frame).toHaveScreenshot("phase-one-harness-panned.png");
});

test("workbench renders a deterministic pane-resized snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  const dividerX = box.x + box.width * 0.52;
  const dividerY = box.y + box.height * 0.665;
  await page.mouse.move(dividerX, dividerY);
  await page.mouse.down();
  await page.mouse.move(dividerX, dividerY - box.height * 0.12, { steps: 8 });
  await page.mouse.up();

  await expect(frame).toHaveScreenshot("phase-one-harness-pane-resized.png");
});

test("workbench shows a visible error state when chart init fails", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    const patchedGetContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      options?: unknown,
    ) {
      if (contextId === "2d") {
        return null;
      }

      return original.call(this, contextId as never, options as never);
    } as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = patchedGetContext;
  });

  await page.goto("/");
  const errorState = page.locator('[data-demo-tab="workbench"] .error-state');
  await expect(errorState).toBeVisible();
  await expect(errorState).toContainText("chart init failure");
  await expect(errorState).toContainText("Canvas 2D context is unavailable");
});

test("features renders the panes tab as a deterministic grouped example baseline", async ({
  page,
}) => {
  await page.goto("/");
  await featureTab(page, "Panes").click();
  const card = page.locator('[data-demo-tab="feature"]');
  await expect(card).toBeVisible();
  await expect(featureTab(page, "Panes")).toHaveClass(/active/);
  await expect(card).toHaveScreenshot("demo-features-panes.png");
});

test("features renders the interactions tab as a deterministic grouped example baseline", async ({
  page,
}) => {
  await page.goto("/");
  await featureTab(page, "Interactions").click();
  const card = page.locator('[data-demo-tab="feature"]');
  await expect(card).toContainText("crosshair, click, pan, and zoom");
  await expect(card).toHaveScreenshot("demo-features-interactions.png");
});

test("features renders the series tab as a deterministic grouped example baseline", async ({
  page,
}) => {
  await page.goto("/");
  await featureTab(page, "Series").click();
  const card = page.locator('[data-demo-tab="feature"]');
  await expect(card).toContainText("candlestick, bar, line, histogram, and volume");
  await expect(card).toHaveScreenshot("demo-features-series.png");
});

test("tab switching keeps chart mount deterministic without stale content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("chartx2 phase-one chart harness")).toBeVisible();

  await featureTab(page, "Panes").click();
  await expect(page.getByLabel("chartx2 feature demo chart")).toBeVisible();
  await expect(page.getByText("Focused Example")).toBeVisible();
  await expect(page.locator('[data-demo-tab="workbench"]')).toHaveCount(0);

  await featureTab(page, "Series").click();
  await expect(page.getByText("render candlestick")).toBeVisible();

  await featureTab(page, "Workbench").click();
  await expect(page.getByLabel("chartx2 phase-one chart harness")).toBeVisible();
  await expect(page.locator('[data-demo-tab="feature"]')).toHaveCount(0);
});
