import { expect, test, type Page } from "@playwright/test";

function featureTab(page: Page, name: string) {
  return page.locator(".top-tabs").getByRole("button", { name, exact: true });
}

function workbenchPanel(page: Page) {
  return page.locator('[data-demo-tab="workbench"]');
}

function workbenchAction(page: Page, actionId: string) {
  return workbenchPanel(page).locator(`[data-demo-action="${actionId}"]`);
}

function workbenchCommandPalette(page: Page) {
  return workbenchPanel(page).locator("[data-command-palette]");
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

  const frame = workbenchPanel(page).locator(".chart-frame");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness.png");
});

test("layout: switching to split renders both slots and hosts", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const layout = workbench.locator("[data-workbench-layout]");

  await expect(layout).toBeVisible();
  await expect(layout).toHaveAttribute("data-workbench-layout-preset", "single");

  await workbenchAction(page, "layout-split").click();
  await expect(layout).toHaveAttribute("data-workbench-layout-preset", "main-plus-secondary");
  await expect(layout.locator("[data-chart-slot]")).toHaveCount(2);
  await expect(layout.locator("[data-chart-host]")).toHaveCount(2);

  await expect(layout.locator('[data-chart-host][data-chart-host-active="true"]')).toHaveCount(
    1,
  );
});

test("command palette: Cmd/Ctrl+K toggles the palette and runs layout commands", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const layout = workbench.locator("[data-workbench-layout]");
  const palette = workbenchCommandPalette(page);
  const shortcut = "Control+K";

  await expect(layout).toHaveAttribute("data-workbench-layout-preset", "single");

  await page.keyboard.press(shortcut);
  await expect(palette).toBeVisible();
  await expect(palette.locator('[data-command-entry="layout-split"]')).toHaveAttribute(
    "data-command-active",
    "false",
  );

  await page.keyboard.press(shortcut);
  await expect(palette).toHaveCount(0);

  await page.keyboard.press(shortcut);
  await palette.locator('[data-command-entry="layout-split"]').click();

  await expect(layout).toHaveAttribute("data-workbench-layout-preset", "main-plus-secondary");
  await expect(workbenchCommandPalette(page)).toHaveCount(0);
});

test("layout: watchlist routes symbol opens to the active host and follows host activation", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const layout = workbench.locator("[data-workbench-layout]");

  await workbenchAction(page, "layout-split").click();
  await expect(layout).toHaveAttribute("data-workbench-layout-preset", "main-plus-secondary");
  const hostCards = layout.locator("[data-chart-host]");
  await expect(hostCards).toHaveCount(2);
  await workbenchAction(page, "host-main").click();
  const liveChart = layout.locator(".live-chart");
  await expect(liveChart).toHaveAttribute("style", /grid-area:\s*1\s*\/\s*1;/);

  const watchRows = workbench.locator('[data-watchlist-symbol]');
  await expect(watchRows.nth(1)).toHaveAttribute("data-watchlist-symbol", /.+/);
  const watchRowCount = await watchRows.count();
  expect(watchRowCount).toBeGreaterThan(1);
  const firstSymbol = await watchRows.nth(0).getAttribute("data-watchlist-symbol");
  const secondSymbol = await watchRows.nth(1).getAttribute("data-watchlist-symbol");

  expect(firstSymbol).not.toBeNull();
  expect(secondSymbol).not.toBeNull();
  if (firstSymbol === null || secondSymbol === null) {
    throw new Error("watchlist symbols are missing");
  }

  const activeHostCard = () => layout.locator('[data-chart-host][data-chart-host-active="true"]').first();

  await expect(layout.locator('[data-chart-host][data-chart-host-active="true"]')).toHaveCount(1);
  const beforeHostId = await activeHostCard().getAttribute("data-chart-host");
  expect(beforeHostId).not.toBeNull();
  if (beforeHostId === null) {
    throw new Error("active chart host id is missing");
  }

  await watchRows.nth(0).click();
  await expect(layout.locator(`[data-chart-host="${beforeHostId}"]`)).toHaveAttribute(
    "data-chart-host-symbol",
    firstSymbol,
  );

  await workbenchAction(page, "host-secondary").click();
  await expect(layout.locator('[data-chart-host][data-chart-host-active="true"]')).toHaveCount(1);
  await expect(liveChart).toHaveAttribute("style", /grid-area:\s*1\s*\/\s*2;/);
  const afterHostId = await activeHostCard().getAttribute("data-chart-host");
  expect(afterHostId).not.toBeNull();
  if (afterHostId === null) {
    throw new Error("secondary chart host id is missing");
  }
  expect(afterHostId).not.toBe(beforeHostId);

  await watchRows.nth(1).click();
  await expect(layout.locator(`[data-chart-host="${afterHostId}"]`)).toHaveAttribute(
    "data-chart-host-symbol",
    secondSymbol,
  );
  await expect(layout.locator(`[data-chart-host="${beforeHostId}"]`)).toHaveAttribute(
    "data-chart-host-symbol",
    firstSymbol,
  );
});

test("screener: local movers filter rows open symbols through the active host", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const layout = workbench.locator("[data-workbench-layout]");
  const screener = workbench.locator('[data-workbench-panel="screener"]');

  await expect(screener).toBeVisible();
  await expect(screener.locator("[data-screener-mode]")).toHaveText("Local watchlist movers");
  await expect(screener.locator("[data-screener-result]")).toHaveCount(4);

  await screener.locator('[data-screener-filter="screener-price-floor"]').click();
  await expect(
    screener.locator('[data-screener-filter="screener-price-floor"]'),
  ).toHaveAttribute("data-screener-filter-active", "true");
  await expect(screener.locator("[data-screener-result]")).toHaveCount(3);
  await expect(screener.locator('[data-screener-symbol="VIX"]')).toHaveCount(0);

  const disabledFilter = screener.locator('[data-screener-filter="screener-upside-only"]');
  await expect(disabledFilter).toBeDisabled();
  await expect(disabledFilter).toHaveAttribute("data-screener-filter-active", "false");

  await workbenchAction(page, "layout-split").click();
  await workbenchAction(page, "host-secondary").click();
  await expect(layout.locator('[data-chart-host][data-chart-host-active="true"]')).toHaveCount(1);

  const activeHost = layout.locator('[data-chart-host][data-chart-host-active="true"]').first();
  const activeHostId = await activeHost.getAttribute("data-chart-host");
  expect(activeHostId).not.toBeNull();
  if (activeHostId === null) {
    throw new Error("active chart host id is missing");
  }

  const targetRow = screener.locator('[data-screener-symbol="DJI"]').first();
  await expect(targetRow).toBeVisible();
  await targetRow.click();

  await expect(layout.locator(`[data-chart-host="${activeHostId}"]`)).toHaveAttribute(
    "data-chart-host-symbol",
    "DJI",
  );
});

test("workbench keeps a deterministic narrow baseline", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 1100 });
  await page.goto("/");
  const frame = workbenchPanel(page).locator(".chart-frame");
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
  const frame = workbenchPanel(page).locator(".chart-frame");
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
  const frame = workbenchPanel(page).locator(".chart-frame");
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  const readout = workbenchPanel(page).locator(".readout-bar").first();
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
  const frame = workbenchPanel(page).locator(".chart-frame");
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
  const frame = workbenchPanel(page).locator(".chart-frame");
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  await canvas.click();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");

  await expect(frame).toHaveScreenshot("phase-one-harness-keyboard-zoomed.png");
});

test("workbench renders a deterministic dragged viewport snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = workbenchPanel(page).locator(".chart-frame");
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
  const frame = workbenchPanel(page).locator(".chart-frame");
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
  await expect(workbench.getByText(/\d+\s+cols/)).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness-point-figure-readable.png");
});

test("workbench point-figure auto scale slider adjusts the inferred box size", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await page.getByRole("button", { name: "P&F", exact: true }).click();

  const slider = workbench.getByLabel(/Scale/i);
  const boxSizeMetric = workbench
    .getByText("Box size", { exact: true })
    .locator("xpath=ancestor::article[1]")
    .locator("strong");
  const before = await boxSizeMetric.textContent();

  await slider.evaluate((input: HTMLInputElement) => {
    input.value = "1.6";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const after = await boxSizeMetric.textContent();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(before).not.toBe(after);
});

test("workbench point-figure can switch to ATR and percentage sizing modes", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await page.getByRole("button", { name: "P&F", exact: true }).click();

  await workbench.getByRole("button", { name: "ATR", exact: true }).click();
  await expect(workbench).toContainText("ATR length");
  await expect(workbench).toContainText(/ATR\s+\d+\s+pts/i);

  await workbench.getByRole("button", { name: "%", exact: true }).click();
  await expect(workbench).toContainText("Percent");
  await expect(workbench).toContainText(/%/i);

  await workbench.getByRole("button", { name: "Trad", exact: true }).click();
  await expect(workbench).toContainText(/Traditional\s+\d+/i);
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

test("workbench line-break opens with chart-context lower panes and line-count controls", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const frame = workbench.locator(".chart-frame");

  await page.getByRole("button", { name: "Line Break", exact: true }).click();

  await expect(workbench).toContainText(/3 lines/i);
  await expect(workbench.locator(".workbench-footer").getByRole("button", { name: "3-Line" })).toHaveClass(/active/);
  await expect(frame).toHaveScreenshot("phase-one-harness-line-break-readable.png");
});

test("workbench kagi opens with a readable dedicated kagi stroke", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const frame = workbench.locator(".chart-frame");

  await page.getByRole("button", { name: "Kagi", exact: true }).click();

  await expect(workbench).toContainText("Kagi");
  await expect(frame).toHaveScreenshot("phase-one-harness-kagi-readable.png");
});

test("workbench kagi can switch between auto, ATR, percentage, and fixed reversal controls", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await page.getByRole("button", { name: "Kagi", exact: true }).click();

  await expect(workbench).toContainText(/Reversal/i);
  await workbench.getByRole("button", { name: "ATR", exact: true }).click();
  await expect(workbench).toContainText("ATR length");

  await workbench.getByRole("button", { name: "%", exact: true }).click();
  await expect(workbench).toContainText("Percent");

  await workbench.getByRole("button", { name: "Fixed", exact: true }).click();
  await expect(workbench).toContainText(/Fixed/i);
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

  await page.getByRole("button", { name: "Horizontal line" }).click();
  await page.mouse.click(box.x + box.width * 0.34, box.y + box.height * 0.46);
  await expect(inspectorKind).toHaveText("horizontal-line");
  await expect(inspector).toContainText("Appearance");
  await expect(inspector).toContainText("Geometry");
  await expect(inspector).toContainText("Magnet");

  const lineWidthInput = inspector.locator('input[type="number"][min="1"]').first();
  await lineWidthInput.fill("0");
  await lineWidthInput.dispatchEvent("change");
  await expect(inspector).toContainText("Must be at least 1.");

  await page.getByRole("button", { name: "Trend line" }).click();
  await page.mouse.click(box.x + box.width * 0.58, box.y + box.height * 0.60);
  await page.mouse.click(box.x + box.width * 0.74, box.y + box.height * 0.38);
  await expect(inspectorKind).toHaveText("trend-line");
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
  await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.38);
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
  await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.38);
  await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.38);
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.24);

  await expect(chartFrame.locator(".drawing-tool-preview")).toBeVisible();
  await expect(workbench).toContainText("tool armed trend-line");
  await expect(workbench).toContainText("Click a second bar to finish the trend line. Press Escape to cancel.");

  await page.keyboard.press("Escape");

  await expect(chartFrame.locator(".drawing-tool-preview")).toHaveCount(0);
  await expect(trendTool).not.toHaveClass(/active/);
  await expect(workbench).toContainText("Click a horizontal line or trend line on the chart to inspect its properties.");
});

test("workbench opens a watchlist symbol through the host adapter", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const watchlist = workbench.locator(".watch-card").first();
  await expect(workbench).toContainText("NDX Workbench");

  await watchlist.getByRole("button", { name: /SPX/ }).click();

  await expect(workbench).toContainText("SPX Workbench");
  await expect(workbench).toContainText("opened symbol SPX from watchlist");
  await expect(watchlist.getByRole("button", { name: /SPX/ })).toHaveClass(/active/);
});

test("workbench adds indicators from the catalog", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");

  await expect(indicators).toContainText("Indicators");
  await expect(indicators).toContainText("Moving Average");
  await expect(indicators).toContainText("Compare");
  await expect(indicators).toContainText("Overlay Line");
  await expect(activeIndicatorList).toContainText("No active indicators.");

  await indicators.getByRole("button", { name: /Moving Average/ }).click();
  await expect(workbench).toContainText("added indicator Moving Average");
  await expect(activeIndicatorList).toContainText("Moving Average");
  await expect(activeIndicatorList).toContainText("separate-pane");

  await indicators.getByRole("button", { name: /Compare/ }).click();
  await expect(workbench).toContainText("added indicator Compare");
  await expect(activeIndicatorList).toContainText("Compare");
  await expect(activeIndicatorList).toContainText("overlay");

  await indicators.getByRole("button", { name: /Overlay Line/ }).click();
  await expect(workbench).toContainText("added indicator Overlay Line");
  await expect(activeIndicatorList).toContainText("Overlay Line");

  await workbench.getByRole("button", { name: "Line Break", exact: true }).click();

  await expect(activeIndicatorList).toContainText("No active indicators.");
  await expect(activeIndicatorList).not.toContainText("Moving Average");
  await expect(activeIndicatorList).not.toContainText("Compare");
  await expect(activeIndicatorList).not.toContainText("Overlay Line");
});

test("workbench replays the active dataset locally", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const replay = workbench.locator("[data-replay-panel]");
  const summary = replay.locator(".replay-summary");

  await expect(replay).toContainText("Replay");
  await expect(summary).toHaveAttribute("data-replay-active", "false");

  await workbench.getByRole("button", { name: "Replay", exact: true }).click();
  await expect(summary).toHaveAttribute("data-replay-active", "true");

  const enteredStep = Number((await summary.getAttribute("data-replay-current-step")) ?? "0");
  expect(enteredStep).toBeGreaterThan(0);

  await replay.locator('[data-replay-control="step"]').evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("replay step control is missing");
    }
    node.click();
  });
  await expect
    .poll(async () => Number((await summary.getAttribute("data-replay-current-step")) ?? "0"))
    .toBeGreaterThan(enteredStep);

  const steppedStep = Number((await summary.getAttribute("data-replay-current-step")) ?? "0");

  await replay.locator('[data-replay-control="play"]').evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("replay play control is missing");
    }
    node.click();
  });
  await expect(summary).toHaveAttribute("data-replay-playing", "true");
  await expect
    .poll(async () => Number((await summary.getAttribute("data-replay-current-step")) ?? "0"))
    .toBeGreaterThan(steppedStep);

  await replay.locator('[data-replay-control="pause"]').evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("replay pause control is missing");
    }
    node.click();
  });
  await expect(summary).toHaveAttribute("data-replay-playing", "false");

  await replay.locator('[data-replay-control="exit"]').evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("replay exit control is missing");
    }
    node.click();
  });
  await expect(summary).toHaveAttribute("data-replay-active", "false");
  await expect(replay.locator('[data-replay-control="enter"]')).toBeVisible();
});

test("workbench renders a read-only object tree", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const objectTreeCard = workbench.locator('[data-workbench-panel="object-tree"]');
  const tree = objectTreeCard.getByRole("tree", { name: "Workbench object tree" });
  const alerts = workbench.locator(".alert-card");
  await tree.scrollIntoViewIfNeeded();
  await expect(objectTreeCard).toBeVisible();
  await expect(tree).toBeVisible();

  await alerts.getByRole("button", { name: "Create price alert" }).click();

  await expect(tree.locator('[data-object-tree-kind="chart"]').filter({ hasText: "NDX" })).toHaveCount(1);
  await expect(tree.locator('[data-object-tree-kind="pane"]').filter({ hasText: "Main pane" })).toHaveCount(1);
  await expect(tree.locator('[data-object-tree-kind="main-series"]').filter({ hasText: "Main series" })).toHaveCount(1);
  await expect(tree.locator('[data-object-tree-kind="alert"]').filter({ hasText: /price cross/i })).toBeVisible();
});

test("workbench object tree reflects indicators and drawings", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const objectTreeCard = workbench.locator('[data-workbench-panel="object-tree"]');
  const tree = objectTreeCard.getByRole("tree", { name: "Workbench object tree" });
  const indicators = workbench.locator(".indicator-card");
  const inspectorKind = workbench.locator(".inspector-card .sidebar-head span");
  const inspector = workbench.locator(".inspector-card");
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await tree.scrollIntoViewIfNeeded();

  await expect(tree).toBeVisible();
  await expect(inspectorKind).toHaveText("None");
  await expect(tree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Moving Average" })).toHaveCount(0);

  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  await workbench.locator(".tool-rail").getByRole("button", { name: "Horizontal line", exact: true }).click();
  await expect(inspector).toContainText("Click the chart to place a horizontal line.");
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.38);
  await expect(inspectorKind).toHaveText("horizontal-line");

  await expect(tree.locator('[data-object-tree-kind="drawing"]').filter({ hasText: "Horizontal Line" }).first()).toBeVisible();

  await indicators.getByRole("button", { name: /Moving Average/ }).click();
  await expect(workbench).toContainText("added indicator Moving Average");
  await expect(tree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Moving Average" })).toHaveCount(1);
});

test("workbench creates a price alert", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const alerts = workbench.locator(".alert-card");
  const activity = workbench.locator(".action-card", { hasText: "Activity" });

  await expect(alerts).toContainText("Alerts");
  await expect(alerts).not.toContainText("NDX price cross");

  await alerts.getByRole("button", { name: "Create price alert" }).click();

  await expect(alerts).toContainText("NDX price cross");
  await expect(alerts).toContainText(/Price crosses above \d+\.\d{2}/);
  await expect(alerts).toContainText("armed");
  await expect(activity).toContainText(/created alert NDX price crosses \d+\.\d{2}/);

  await page.reload();
  await expect(alerts).toContainText("NDX price cross");
  await expect(alerts).toContainText(/Price crosses above \d+\.\d{2}/);
  await expect(alerts).toContainText("armed");
});

test("workbench saves and restores the active layout locally", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const watchlist = workbench.locator(".watch-card").first();

  await watchlist.getByRole("button", { name: /SPX/ }).click();
  await expect(workbench).toContainText("SPX Workbench");

  await workbench.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(workbench).toContainText("saved layout SPX");

  await workbench.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(workbench).toContainText("NDX Workbench");

  await workbench.getByRole("button", { name: "Restore layout", exact: true }).click();
  await expect(workbench).toContainText("SPX Workbench");
  await expect(workbench).toContainText("restored layout SPX");
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
  await expect(
    page.getByText("Compare the current candlestick, bar, line, area, baseline, histogram, and volume paths."),
  ).toBeVisible();

  await featureTab(page, "Workbench").click();
  await expect(page.getByLabel("chartx2 phase-one chart harness")).toBeVisible();
  await expect(page.locator('[data-demo-tab="feature"]')).toHaveCount(0);
});
