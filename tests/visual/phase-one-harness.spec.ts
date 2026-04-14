import { expect, test, type Page } from "@playwright/test";

function featureTab(page: Page, name: string) {
  return page.locator(".top-tabs").getByRole("button", { name, exact: true });
}

function arrayBuffersEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
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

test("workbench supports keyboard zoom after the chart takes focus", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-demo-tab="workbench"] .chart-frame');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  await canvas.click();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");

  await expect(frame).toHaveScreenshot("phase-one-harness-keyboard-zoomed.png");
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

test("workbench surfaces renko builder controls when the main chart switches to renko", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Renko", exact: true }).click();
  const workbench = page.locator('[data-demo-tab="workbench"]');
  const modeStrip = workbench.locator(".mode-strip");
  await expect(modeStrip).toBeVisible();
  await expect(modeStrip.getByRole("button", { name: "Renko Auto" })).toHaveClass(/active/);
  await expect(workbench).toContainText("Auto box");

  await modeStrip.getByRole("button", { name: "Box 2" }).click();
  await expect(modeStrip.getByRole("button", { name: "Box 2" })).toHaveClass(/active/);
  await expect(workbench).toContainText("Fixed 2");
});

test("workbench point-figure opens with a readable auto box size", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const frame = workbench.locator(".chart-frame");
  await page.getByRole("button", { name: "P&F", exact: true }).click();

  await expect(workbench).toContainText("P&F Auto");
  await expect(frame).toHaveScreenshot("phase-one-harness-point-figure-readable.png");
});

test("workbench heikin switch changes both the chart image and the main-series label", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const frame = workbench.locator(".chart-frame");
  const readout = workbench.locator(".readout-bar").first();

  const candlesBuffer = await frame.screenshot();
  await page.getByRole("button", { name: "Heikin", exact: true }).click();

  await expect(workbench).toContainText("Heikin Ashi");
  await expect(readout).toContainText("Heikin Ashi 1");

  const heikinBuffer = await frame.screenshot();
  expect(arrayBuffersEqual(candlesBuffer, heikinBuffer)).toBe(false);
});

test("workbench can switch from heikin back to candles", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const readout = workbench.locator(".readout-bar").first();

  await page.getByRole("button", { name: "Heikin", exact: true }).click();
  await expect(readout).toContainText("Heikin Ashi 1");

  await page.getByRole("button", { name: "Candles", exact: true }).click();
  await expect(readout).toContainText("Candlestick 1");
  await expect(readout).not.toContainText("Heikin Ashi 1");
});

test("workbench exposes a drawing inspector driven by selected drawing schema", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  const inspector = workbench.locator(".inspector-card");
  const inspectorKind = inspector.locator(".sidebar-head span");
  await expect(inspectorKind).toHaveText("None");

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  let selectedKind = "None";
  for (let x = 40; x <= box.width - 40 && selectedKind === "None"; x += 18) {
    for (let y = 40; y <= box.height - 40 && selectedKind === "None"; y += 18) {
      await page.mouse.click(box.x + x, box.y + y);
      selectedKind = (await inspectorKind.textContent())?.trim() ?? "None";
    }
  }

  expect(selectedKind).not.toBe("None");
  await expect(inspector).toContainText("Appearance");
  await expect(inspector).toContainText("Geometry");
  await expect(inspector).toContainText("Magnet");

  const lineWidthInput = inspector.locator('input[type="number"][min="1"]').first();
  await lineWidthInput.fill("0");
  await lineWidthInput.dispatchEvent("change");
  await expect(inspector).toContainText("Must be at least 1.");

  if (selectedKind !== "trend-line") {
    for (let x = 40; x <= box.width - 40 && selectedKind !== "trend-line"; x += 18) {
      for (let y = 40; y <= box.height - 40 && selectedKind !== "trend-line"; y += 18) {
        await page.mouse.click(box.x + x, box.y + y);
        selectedKind = (await inspectorKind.textContent())?.trim() ?? "None";
      }
    }
  }

  expect(selectedKind).toBe("trend-line");
  const timeInputs = inspector.locator('input[type="number"][step="60000"]');
  const startTimeValue = await timeInputs.nth(0).inputValue();
  await timeInputs.nth(1).fill(startTimeValue);
  await timeInputs.nth(1).dispatchEvent("change");
  await expect(inspector).toContainText("Start time must be before end time.");
});

test("workbench toolbar can create horizontal-line and trend-line drawings", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  const inspector = workbench.locator(".inspector-card");
  const inspectorKind = inspector.locator(".sidebar-head span");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  await page.getByRole("button", { name: "Horizontal line", exact: true }).click();
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.38);
  await expect(inspectorKind).toHaveText("horizontal-line");
  await expect(workbench).toContainText("tool created horizontal-line");

  await page.getByRole("button", { name: "Trend line", exact: true }).click();
  await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.42);
  await expect(workbench).toContainText("tool armed trend-line");
  await page.mouse.click(box.x + box.width * 0.78, box.y + box.height * 0.22);
  await expect(inspectorKind).toHaveText("trend-line");
  await expect(workbench).toContainText("tool created trend-line");
});

test("workbench drawing tools show a preview and let escape cancel an unfinished trend-line", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  const chartFrame = workbench.locator(".chart-frame");
  const trendTool = page.getByRole("button", { name: "Trend line", exact: true });
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  await trendTool.click();
  await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.42);
  await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.42);
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.24);

  await expect(chartFrame.locator(".drawing-tool-preview")).toBeVisible();
  await expect(workbench).toContainText("tool armed trend-line");
  await expect(workbench).toContainText("Click a second bar to finish the trend line. Press Escape to cancel.");

  await page.keyboard.press("Escape");

  await expect(chartFrame.locator(".drawing-tool-preview")).toHaveCount(0);
  await expect(trendTool).not.toHaveClass(/active/);
  await expect(workbench).toContainText("Click a horizontal line or trend line on the chart to inspect its properties.");
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

test("features renders the annotations tab as a deterministic grouped example baseline", async ({
  page,
}) => {
  await page.goto("/");
  await featureTab(page, "Annotations").click();
  const card = page.locator('[data-demo-tab="feature"]');
  await expect(card).toContainText("price-line");
  await expect(card).toHaveScreenshot("demo-features-annotations.png");
});

test("features renders the series tab as a deterministic grouped example baseline", async ({
  page,
}) => {
  await page.goto("/");
  await featureTab(page, "Series").click();
  const card = page.locator('[data-demo-tab="feature"]');
  await expect(card).toContainText("candlestick, bar, line, area, baseline, histogram, and volume");
  await expect(card).toHaveScreenshot("demo-features-series.png");
});

test("tab switching keeps chart mount deterministic without stale content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("chartx2 phase-one chart harness")).toBeVisible();

  await featureTab(page, "Panes").click();
  await expect(page.getByLabel("chartx2 feature demo chart")).toBeVisible();
  await expect(page.locator('[data-demo-tab="feature"]')).toBeVisible();
  await expect(page.locator('[data-demo-tab="workbench"]')).toHaveCount(0);

  await featureTab(page, "Series").click();
  await expect(page.getByText("render candlestick")).toBeVisible();

  await featureTab(page, "Workbench").click();
  await expect(page.getByLabel("chartx2 phase-one chart harness")).toBeVisible();
  await expect(page.locator('[data-demo-tab="feature"]')).toHaveCount(0);
});
