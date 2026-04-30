import { expect, test, type Page } from "@playwright/test";

type BuilderExpression =
  | { kind: "input"; field: "open" | "high" | "low" | "close" | "hl2" | "hlc3" }
  | { kind: "sma"; input: BuilderExpression }
  | { kind: "subtract"; left: BuilderExpression; right: BuilderExpression };

type BuilderField = BuilderExpression extends { kind: "input"; field: infer Field } ? Field : never;

function featureTab(page: Page, name: string) {
  return page.locator(".top-tabs").getByRole("button", { name, exact: true });
}

function workbenchPanel(page: Page) {
  return page.locator('[data-demo-tab="workbench"]');
}

async function injectHostScriptAdapterFailure(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __chartxScriptAdapterMode?: "host-fail" }).__chartxScriptAdapterMode =
      "host-fail";
  });
}

function workbenchAction(page: Page, actionId: string) {
  return workbenchPanel(page).locator(`[data-demo-action="${actionId}"]`);
}

function workbenchCommandPalette(page: Page) {
  return workbenchPanel(page).locator("[data-command-palette]");
}

function scriptedIndicatorCard(page: Page, entryId: string) {
  return workbenchPanel(page)
    .locator(`[data-script-add-entry="${entryId}"]`)
    .locator("xpath=ancestor::article[contains(@class, 'scripted-entry')][1]");
}

async function configureAndAddScriptIndicator(
  page: Page,
  entryId: string,
  inputId: string,
  value: string,
) {
  const input = workbenchPanel(page).locator(
    `[data-script-input-entry="${entryId}"][data-script-input-id="${inputId}"]`,
  );
  await input.fill(value);
  const addButton = workbenchPanel(page).locator(`[data-script-add-entry="${entryId}"]`);
  await addButton.scrollIntoViewIfNeeded();
  await addButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("scripted indicator add button is missing");
    }
    node.click();
  });
}

async function saveCustomScript(
  page: Page,
  input: {
    label: string;
    shortLabel: string;
    description: string;
    expressionText: string;
    placement: "overlay" | "separate-pane";
    defaultLength: string;
  },
) {
  const workbench = workbenchPanel(page);
  await workbench.locator('[data-custom-script-field="label"]').fill(input.label);
  await workbench.locator('[data-custom-script-field="short-label"]').fill(input.shortLabel);
  await workbench.locator('[data-custom-script-field="description"]').fill(input.description);
  await configureCustomScriptBuilder(page, parseBuilderExpression(input.expressionText));
  await workbench.locator('[data-custom-script-field="placement"]').selectOption(input.placement);
  await workbench.locator('[data-custom-script-field="default-length"]').fill(input.defaultLength);
  await workbench.locator("[data-custom-script-save]").click();
}

function splitBuilderArgs(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    current += char;
  }
  if (current.trim().length > 0) {
    parts.push(current.trim());
  }
  return parts;
}

function parseBuilderExpression(expressionText: string): BuilderExpression {
  const text = expressionText.trim();
  if (["open", "high", "low", "close", "hl2", "hlc3"].includes(text)) {
    return { kind: "input", field: text as BuilderField };
  }
  const firstParen = text.indexOf("(");
  if (firstParen === -1 || !text.endsWith(")")) {
    throw new Error(`Unsupported builder expression ${expressionText}`);
  }
  const name = text.slice(0, firstParen).trim();
  const args = splitBuilderArgs(text.slice(firstParen + 1, -1));
  if (name === "sma" && args.length === 2 && args[1] === "length") {
    return { kind: "sma", input: parseBuilderExpression(args[0]) };
  }
  if (name === "subtract" && args.length === 2) {
    return {
      kind: "subtract",
      left: parseBuilderExpression(args[0]),
      right: parseBuilderExpression(args[1]),
    };
  }
  throw new Error(`Unsupported builder expression ${expressionText}`);
}

async function configureCustomScriptBuilder(
  page: Page,
  expression: BuilderExpression,
  path = "",
): Promise<void> {
  const workbench = workbenchPanel(page);
  const pathKey = path.length === 0 ? "root" : path;
  const kindSelect = workbench.locator(`[data-custom-script-node-kind="${pathKey}"]`);
  await expect(kindSelect).toBeVisible();
  await kindSelect.selectOption(expression.kind);
  if (expression.kind === "input") {
    const fieldSelect = workbench.locator(`[data-custom-script-node-field="${pathKey}"]`);
    await expect(fieldSelect).toBeVisible();
    await fieldSelect.selectOption(expression.field);
    return;
  }
  if (expression.kind === "sma") {
    await configureCustomScriptBuilder(page, expression.input, path.length === 0 ? "input" : `${path}.input`);
    return;
  }
  await configureCustomScriptBuilder(page, expression.left, path.length === 0 ? "left" : `${path}.left`);
  await configureCustomScriptBuilder(page, expression.right, path.length === 0 ? "right" : `${path}.right`);
}

async function addCustomScriptFromLibrary(page: Page, scriptId: string, length: string) {
  const workbench = workbenchPanel(page);
  await workbench.locator(`[data-custom-script-launch-length="${scriptId}"]`).fill(length);
  await workbench.locator(`[data-custom-script-add="${scriptId}"]`).click();
}

async function clickWorkbenchButton(page: Page, selector: string, missingMessage: string) {
  const button = workbenchPanel(page).locator(selector);
  await button.scrollIntoViewIfNeeded();
  await button.evaluate((node, message) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error(String(message));
    }
    node.click();
  }, missingMessage);
}

async function readExportedLayoutRaw(page: Page): Promise<string> {
  await page.waitForFunction(() => {
    const field = document.querySelector("[data-layout-export-raw]");
    return field instanceof HTMLTextAreaElement && field.value.trim().length > 0;
  });
  return page.locator("[data-layout-export-raw]").inputValue();
}

async function readExportedLayoutRawAfterExport(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent("download");
  await workbenchPanel(page).locator("[data-layout-export-trigger]").click();
  await downloadPromise;
  return readExportedLayoutRaw(page);
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

test("share dialog: toolbar trigger opens a fixture-backed publish shell", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-share-dialog-trigger]");

  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();

  const dialog = workbench.locator("[data-share-dialog]");
  const dialogState = dialog.locator("[data-share-dialog-state]");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(dialog).toBeVisible();
  await expect(dialogState).toHaveAttribute("data-share-dialog-status", "ready");
  await expect(dialog).toContainText("Fixture-backed V0 shell");

  await dialog.locator('[data-share-dialog-visibility="public"]').click();
  await expect(dialog).toContainText("Ready to publish a public fixture link.");

  await dialog.locator("[data-share-dialog-publish]").click();

  await expect(dialogState).toHaveAttribute("data-share-dialog-status", "ready");
  await expect(dialog.locator("[data-share-dialog-link]")).toHaveAttribute(
    "href",
    /visibility=public$/,
  );
  await expect(dialog.locator("[data-share-dialog-link]")).toContainText(
    "fixtures.chartx.local/share/layout/",
  );
  await expect(workbench.locator('[data-workbench-status="success"]')).toContainText(
    "Share link ready",
  );
});

test("workspace tabs: switching documents changes active workspace and panel focus", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const palette = workbenchCommandPalette(page);
  const tradeTab = workbench.locator('[data-workspace-view="trade"]').first();
  const inspectTab = workbench.locator('[data-workspace-view="inspect"]').first();
  const scanTab = workbench.locator('[data-workspace-view="scan"]').first();

  await expect(tradeTab).toHaveAttribute("data-workspace-active", "true");
  await expect(tradeTab).toContainText("NDX · 1D");
  await expect(workbench.locator('[data-workbench-panel="watchlist"]')).toHaveAttribute(
    "data-workbench-panel-active",
    "true",
  );

  await page.keyboard.press("Control+K");
  await palette.locator('[data-command-entry="workspace-inspect"]').click();

  await expect(inspectTab).toHaveAttribute("data-workspace-active", "true");
  await expect(inspectTab).toContainText("NDX · 1D");
  await expect(workbench.locator('[data-workbench-panel="object-tree"]')).toHaveAttribute(
    "data-workbench-panel-active",
    "true",
  );
  await expect(workbench.locator('[data-bottom-tab="logs"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  await scanTab.locator(".workspace-tab-main").click();
  await expect(scanTab).toHaveAttribute("data-workspace-active", "true");
  await expect(scanTab).toContainText("SPX · 4H");
  await expect(workbench.locator('[data-workbench-panel="screener"]')).toHaveAttribute(
    "data-workbench-panel-active",
    "true",
  );
  await expect(workbench.locator('[data-bottom-tab="time-presets"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
});

test("strategy tester panel renders fixture-backed metrics through the bottom-panel shell", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = workbenchPanel(page);
  await workbench.locator('[data-bottom-tab="performance-link"]').click();

  await expect(workbench.locator('[data-bottom-tab="performance-link"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await expect(workbench.locator('[data-bottom-panel-kind="performance-link"]')).toBeVisible();
  await expect(workbench.locator("[data-strategy-tester-panel]")).toContainText("Strategy Tester");
  await expect(workbench.locator("[data-strategy-tester-panel]")).toContainText("Net Profit");
  await expect(workbench.locator('[data-strategy-tester-metric="net-profit"]')).toContainText("+12,340");
  await expect(workbench.locator('[data-strategy-tester-trade-row="trade-1"]')).toContainText("Apr 18 09:35");
});

test("strategy tester panel tabs and trade selection drive shell state", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  await workbench.locator('[data-bottom-tab="performance-link"]').click();

  const panel = workbench.locator("[data-strategy-tester-panel]");
  await expect(panel).toHaveAttribute("data-strategy-tester-active-tab", "overview");
  await expect(panel.locator('[data-strategy-tester-section="summary"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-section="equity"]')).toBeVisible();

  await panel.locator('[data-strategy-tester-tab="list"]').click();
  await expect(panel).toHaveAttribute("data-strategy-tester-active-tab", "list");
  await expect(panel.locator('[data-strategy-tester-section="trades"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-section="summary"]')).toHaveCount(0);

  await panel.locator('[data-strategy-tester-trade-row="trade-2"]').click();

  await panel.locator('[data-strategy-tester-tab="trades"]').click();
  await expect(panel).toHaveAttribute("data-strategy-tester-active-tab", "trades");
  await expect(panel.locator('[data-strategy-tester-equity-point="eq-3"]')).toHaveAttribute(
    "data-strategy-tester-equity-active",
    "true",
  );
});

test("strategy tester filters narrow the visible trades and equity shell locally", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  await workbench.locator('[data-bottom-tab="performance-link"]').click();

  const panel = workbench.locator("[data-strategy-tester-panel]");
  await panel.locator('[data-strategy-tester-tab="trades"]').click();

  await expect(panel.locator('[data-strategy-tester-trade-row="trade-1"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-2"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-3"]')).toBeVisible();

  await panel.locator('[data-strategy-tester-filter="winners"]').click();
  await expect(panel.locator('[data-strategy-tester-filter="winners"]')).toHaveAttribute(
    "data-strategy-tester-filter-active",
    "true",
  );
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-1"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-2"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-3"]')).toHaveCount(0);
  await expect(panel.locator('[data-strategy-tester-equity-point="eq-4"]')).toHaveCount(0);

  await panel.locator('[data-strategy-tester-filter="losers"]').click();
  await expect(panel.locator('[data-strategy-tester-filter="losers"]')).toHaveAttribute(
    "data-strategy-tester-filter-active",
    "true",
  );
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-3"]')).toBeVisible();
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-1"]')).toHaveCount(0);
  await expect(panel.locator('[data-strategy-tester-trade-row="trade-2"]')).toHaveCount(0);
});

test("strategy tester surfaces fixture-backed run metadata through the panel contract", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  await workbench.locator('[data-bottom-tab="performance-link"]').click();

  const panel = workbench.locator("[data-strategy-tester-panel]");
  await expect(panel.locator('[data-strategy-tester-run-metric="parameter-atr"]')).toContainText("ATR Length");
  await expect(panel.locator('[data-strategy-tester-run-metric="parameter-atr"]')).toContainText("14");
  await expect(panel.locator('[data-strategy-tester-run-metric="parameter-stop"]')).toContainText("Stop Multiplier");
  await expect(panel.locator('[data-strategy-tester-run-metric="parameter-risk"]')).toContainText("0.75%");
});

test("trading ticket panel renders fixture-backed trade shell through the bottom-panel seam", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = workbenchPanel(page);
  await workbench.locator('[data-bottom-tab="custom"]').click();

  await expect(workbench.locator('[data-bottom-tab="custom"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await expect(workbench.locator('[data-bottom-panel-kind="trading"]')).toBeVisible();
  await expect(workbench.locator("[data-trading-ticket]")).toContainText("Trading Ticket");
  await expect(workbench.locator("[data-trading-ticket]")).toContainText("Bracket Entry");
  await expect(workbench.locator('[data-trading-ticket-symbol]')).toContainText("NDX");
  await expect(workbench.locator('[data-trading-ticket-field="quantity"]')).toContainText("2 contracts");
  await expect(workbench.locator("[data-trading-ticket-submit]")).toContainText("Review order");
});

test("account sync sidebar card renders as a separate shell and refreshes through the fixture adapter", async ({
  page,
}) => {
  await page.goto("/");

  const workbench = workbenchPanel(page);
  const syncCard = workbench.locator('[data-workbench-panel="account-sync"]');

  await expect(syncCard).toBeVisible();
  await expect(syncCard.locator('[data-account-sync-status="ready"]')).toContainText(
    "Host sync reachable",
  );
  await expect(syncCard.locator('[data-account-sync-target="layouts"]')).toContainText("Layouts");
  await expect(syncCard.locator('[data-account-sync-target="alerts"]')).toContainText("Alerts");
  await expect(syncCard.locator('[data-account-sync-target="watchlist"]')).toContainText(
    "Watchlists",
  );

  await syncCard.locator("[data-account-sync-refresh]").click();
  await expect(syncCard.locator('[data-account-sync-status="loading"]')).toContainText(
    "Refreshing host sync status",
  );
  await expect(syncCard.locator('[data-account-sync-refresh]')).toBeDisabled();
  await expect(syncCard.locator('[data-account-sync-status="ready"]')).toContainText(
    "Host sync reachable",
  );
  await expect(workbench.locator('[data-workbench-status="success"]')).toContainText(
    "Host sync status refreshed",
  );
});

test("workspace tabs: create and close document tabs in the shell", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await expect(workbench.locator("[data-workspace-tabs] [data-workspace-tab]")).toHaveCount(4);
  await workbench.locator("[data-workspace-tab-create]").click();
  await expect(workbench.locator("[data-workspace-tabs] [data-workspace-tab]")).toHaveCount(5);

  const newestTab = workbench.locator("[data-workspace-tabs] [data-workspace-tab]").last();
  await expect(newestTab).toHaveAttribute("data-workspace-active", "true");
  await expect(newestTab).toContainText("Trade 2");

  await newestTab.locator("[data-workspace-tab-close]").click();
  await expect(workbench.locator("[data-workspace-tabs] [data-workspace-tab]")).toHaveCount(4);
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
  await expect(layout.locator("[data-chart-host]")).toHaveCount(2);
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
  await expect(layout.locator("[data-chart-host]")).toHaveCount(2);
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

test("layout import/export: export downloads a focused snapshot and import restores it", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");
  const objectTree = workbench.locator('[data-workbench-panel="object-tree"] [role="tree"]');

  const inspectWorkspaceButton = workbench
    .locator('[data-workspace-view="inspect"]')
    .first()
    .locator(".workspace-tab-main");
  await inspectWorkspaceButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("inspect workspace tab button is missing");
    }
    node.click();
  });
  await expect(workbench.locator('[data-workspace-view="inspect"]').first()).toHaveAttribute(
    "data-workspace-active",
    "true",
  );

  const baselineDownloadPromise = page.waitForEvent("download");
  await workbench.locator("[data-layout-export-trigger]").click();
  await baselineDownloadPromise;
  const baselineExportedRaw = await readExportedLayoutRaw(page);
  const baselineExported = JSON.parse(baselineExportedRaw) as {
    chartState: { panes: unknown[] } | null;
  };

  const scriptedSmaCard = scriptedIndicatorCard(page, "scripted-close-sma");
  await scriptedSmaCard.scrollIntoViewIfNeeded();
  await configureAndAddScriptIndicator(page, "scripted-close-sma", "length", "2");
  await expect(workbench).toContainText("added indicator Scripted SMA 20 (Length 2)");
  await expect(activeIndicatorList).toContainText("Scripted SMA 20");
  await expect(activeIndicatorList).toContainText("length 2");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await workbench.locator("[data-layout-export-trigger]").click();
  const download = await downloadPromise;
  const exportedRaw = await readExportedLayoutRaw(page);
  const exported = JSON.parse(exportedRaw) as {
    activeSymbol: string;
    scriptedIndicators?: {
      label: string;
      kind: string;
      placement: string;
      studyOptions?: {
        scriptId: string;
        inputValues?: Record<string, number>;
      };
    }[];
    panels: { rightSidebar: string };
    chartState: { panes: unknown[] } | null;
  };

  expect(download.suggestedFilename()).toBe("ndx-layout.json");
  expect(exported.activeSymbol).toBe("NDX");
  expect(exported.panels.rightSidebar).toBe("object-tree");
  expect(exported.chartState?.panes ?? []).toHaveLength(baselineExported.chartState?.panes.length ?? 0);
  expect(baselineExportedRaw).not.toContain("Scripted SMA 20");
  expect(exported.scriptedIndicators ?? []).toHaveLength(1);
  expect(exported.scriptedIndicators?.[0]).toMatchObject({
    label: "Scripted SMA 20",
    kind: "script",
    placement: "separate-pane",
    studyOptions: {
      scriptId: "close-sma-20-v0",
      inputValues: {
        length: 2,
      },
    },
  });
  await expect(workbench.locator('[data-workbench-status="success"]')).toContainText("Exported layout");

  await workbench.locator('[data-watchlist-symbol="SPX"]').click();
  await workbench.locator('[data-workspace-view="scan"]').first().locator(".workspace-tab-main").click();
  await expect(workbench.locator('[data-workbench-panel="screener"]')).toHaveAttribute(
    "data-workbench-panel-active",
    "true",
  );

  await page.evaluate(async (raw) => {
    const input = document.querySelector(
      'input[type="file"][accept*="json"]',
    ) as HTMLInputElement | null;
    if (input === null) {
      throw new Error("layout import input is missing");
    }
    const file = new File([raw], "restored-layout.json", {
      type: "application/json",
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, exportedRaw);

  await expect(workbench.locator('[data-workbench-status="success"]')).toContainText("Imported layout");
  await expect(workbench.locator('[data-workspace-view="inspect"]').first()).toHaveAttribute(
    "data-workspace-active",
    "true",
  );
  await expect(workbench.locator('[data-workbench-panel="object-tree"]')).toHaveAttribute(
    "data-workbench-panel-active",
    "true",
  );
  await expect(activeIndicatorList).toContainText("Scripted SMA 20");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(1);
});

test("script library: custom authored scripts round-trip through layout export and import", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");
  const objectTree = workbench.locator('[data-workbench-panel="object-tree"] [role="tree"]');

  await saveCustomScript(page, {
    label: "My Close Spread",
    shortLabel: "My Spread",
    description: "Close minus close SMA.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "9",
  });

  await expect(workbench).toContainText("saved custom script My Close Spread");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText(
    "subtract(close, sma(close, length))",
  );
  await expect(indicators.locator(".indicator-list")).not.toContainText("My Close Spread");

  await addCustomScriptFromLibrary(page, "custom-script-1", "4");
  await expect(workbench).toContainText("added indicator My Close Spread (Length 4)");
  await expect(activeIndicatorList).toContainText("My Close Spread");
  await expect(activeIndicatorList).toContainText("length 4");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "My Close Spread" })).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await workbench.locator("[data-layout-export-trigger]").click();
  await downloadPromise;
  const exportedRaw = await readExportedLayoutRaw(page);
  const exported = JSON.parse(exportedRaw) as {
    customScripts?: { id: string; label: string }[];
    scriptedIndicators?: {
      label: string;
      studyOptions?: { scriptId: string; inputValues?: Record<string, number> };
    }[];
  };

  expect(exported.customScripts?.[0]).toMatchObject({
    id: "custom-script-1",
    label: "My Close Spread",
  });
  expect(exported.scriptedIndicators?.[0]).toMatchObject({
    label: "My Close Spread",
    studyOptions: {
      scriptId: "custom-script-1",
      inputValues: {
        length: 4,
      },
    },
  });

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
  await expect(activeIndicatorList).not.toContainText("My Close Spread");

  await page.evaluate(async (raw) => {
    const input = document.querySelector(
      'input[type="file"][accept*="json"]',
    ) as HTMLInputElement | null;
    if (input === null) {
      throw new Error("layout import input is missing");
    }
    const file = new File([raw], "custom-script-layout.json", {
      type: "application/json",
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, exportedRaw);

  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText(
    "subtract(close, sma(close, length))",
  );
  await expect(activeIndicatorList).toContainText("My Close Spread");
  await expect(activeIndicatorList).toContainText("length 4");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "My Close Spread" })).toHaveCount(1);
});

test("script library: scripted studies round-trip through restore and import", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");
  const objectTree = workbench.locator('[data-workbench-panel="object-tree"] [role="tree"]');

  await saveCustomScript(page, {
    label: "Restore Bridge Spread",
    shortLabel: "RestoreBridge",
    description: "Descriptor-driven restore demo.",
    expressionText: "sma(close, length)",
    placement: "separate-pane",
    defaultLength: "9",
  });

  await addCustomScriptFromLibrary(page, "custom-script-1", "6");
  await expect(workbench).toContainText("added indicator Restore Bridge Spread (Length 6)");
  await expect(activeIndicatorList).toContainText("Restore Bridge Spread");
  await expect(activeIndicatorList).toContainText("length 6");

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(workbench).toContainText("saved layout NDX");

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
  await expect(activeIndicatorList).not.toContainText("Restore Bridge Spread");

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Restore layout", exact: true }).click();
  await expect(workbench).toContainText("restored layout NDX");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(activeIndicatorList).toContainText("Restore Bridge Spread");
  await expect(activeIndicatorList).toContainText("length 6");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Restore Bridge Spread" })).toHaveCount(1);

  const exportedRaw = await readExportedLayoutRawAfterExport(page);
  const exported = JSON.parse(exportedRaw) as {
    scriptedIndicators?: {
      label: string;
      studyOptions?: { scriptId: string; inputValues?: Record<string, number> };
    }[];
  };
  expect(exported.scriptedIndicators?.[0]).toMatchObject({
    label: "Restore Bridge Spread",
    studyOptions: {
      scriptId: "custom-script-1",
      inputValues: {
        length: 6,
      },
    },
  });

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(activeIndicatorList).not.toContainText("Restore Bridge Spread");

  await page.evaluate(async (raw) => {
    const input = document.querySelector(
      'input[type="file"][accept*="json"]',
    ) as HTMLInputElement | null;
    if (input === null) {
      throw new Error("layout import input is missing");
    }
    const file = new File([raw], "scripted-study-restore.json", {
      type: "application/json",
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, exportedRaw);

  await expect(workbench).toContainText("Imported layout");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(activeIndicatorList).toContainText("Restore Bridge Spread");
  await expect(activeIndicatorList).toContainText("length 6");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Restore Bridge Spread" })).toHaveCount(1);
});

test("script library: save builtin presets and duplicate custom scripts", async ({ page }) => {
  await page.goto("/");

  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");

  await clickWorkbenchButton(
    page,
    '[data-script-save-catalog-entry="scripted-close-sma"]',
    "save preset button is missing",
  );
  await expect(workbench).toContainText("saved custom script Scripted SMA 20 Preset");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText("Scripted SMA 20 Preset");

  await clickWorkbenchButton(
    page,
    '[data-custom-script-duplicate="custom-script-1"]',
    "duplicate custom script button is missing",
  );
  await expect(workbench).toContainText("saved custom script Scripted SMA 20 Preset Copy");
  await expect(workbench.locator('[data-custom-script="custom-script-2"]')).toContainText("Scripted SMA 20 Preset Copy");

  await addCustomScriptFromLibrary(page, "custom-script-2", "6");
  await expect(indicators.locator(".active-indicator-list")).toContainText("Scripted SMA 20 Preset Copy");
  await expect(indicators.locator(".active-indicator-list")).toContainText("length 6");
});

test("script library: overlay placement stays disabled for custom scripts", async ({ page }) => {
  await page.goto("/");

  await expect(
    workbenchPanel(page).locator('[data-custom-script-field="placement"] option[value="overlay"]'),
  ).toHaveAttribute("disabled", "");
  await expect(workbenchPanel(page)).toContainText(
    "Custom scripted indicators currently save as separate-pane studies only.",
  );
});

test("script library: invalid length inputs are blocked before save or add", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-custom-script-field="label"]').fill("My Close Spread");
  await workbench.locator('[data-custom-script-field="short-label"]').fill("Spread");
  await workbench.locator('[data-custom-script-field="description"]').fill("Close minus close SMA.");
  await configureCustomScriptBuilder(page, parseBuilderExpression("subtract(close, sma(close, length))"));
  await workbench.locator('[data-custom-script-field="default-length"]').fill("");
  await expect(workbench.locator("[data-custom-script-default-length-error]")).toContainText(
    "Default length must be an integer between 2 and 60.",
  );
  await expect(workbench.locator("[data-custom-script-save]")).toBeDisabled();

  await saveCustomScript(page, {
    label: "My Close Spread",
    shortLabel: "Spread",
    description: "Close minus close SMA.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "9",
  });

  await workbench.locator('[data-custom-script-launch-length="custom-script-1"]').fill("");
  await expect(workbench.locator('[data-custom-script-launch-error="custom-script-1"]')).toContainText(
    "Length is required.",
  );
  await expect(workbench.locator('[data-custom-script-add="custom-script-1"]')).toBeDisabled();
});

test("script library: imports expression text into the builder without clobbering on parse errors", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-custom-script-field="label"]').fill("My Imported Spread");
  await workbench.locator('[data-custom-script-field="short-label"]').fill("Imported");
  await workbench.locator('[data-custom-script-field="description"]').fill("Imported from expression text.");

  await workbench
    .locator("[data-custom-script-import-expression]")
    .fill("subtract(close, sma(hlc3, length))");
  await workbench.locator("[data-custom-script-import-apply]").click();

  await expect(workbench.locator("[data-custom-script-expression-preview]")).toContainText(
    "subtract(close, sma(hlc3, length))",
  );
  await expect(workbench.locator("[data-custom-script-preview]")).toContainText(
    "subtract(close, sma(hlc3, length))",
  );

  await workbench.locator("[data-custom-script-import-expression]").fill("close - open");
  await workbench.locator("[data-custom-script-import-apply]").click();
  await expect(workbench.locator("[data-custom-script-import-error]")).toContainText(
    "Expression must use the supported subset",
  );
  await expect(workbench.locator("[data-custom-script-expression-preview]")).toContainText(
    "subtract(close, sma(hlc3, length))",
  );

  await workbench.locator("[data-custom-script-field=\"default-length\"]").fill("8");
  await workbench.locator("[data-custom-script-save]").click();
  await expect(workbench).toContainText("saved custom script My Imported Spread");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText(
    "subtract(close, sma(hlc3, length))",
  );
});

test("script library: text editor mode can apply a supported expression and save it", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-custom-script-field="label"]').fill("My Text Script");
  await workbench.locator('[data-custom-script-field="short-label"]').fill("Text Script");
  await workbench.locator('[data-custom-script-field="description"]').fill("Saved from text mode.");
  const textMode = workbench.locator('[data-custom-script-editor-mode="text"]:visible').first();
  await textMode.scrollIntoViewIfNeeded();
  await textMode.dispatchEvent("click");
  await expect(textMode).toHaveAttribute("aria-pressed", "true");
  await workbench
    .locator("[data-custom-script-import-expression]:visible")
    .fill("subtract(hlc3, sma(close, length))");
  await workbench.locator("[data-custom-script-import-apply]").click();

  await expect(workbench.locator("[data-custom-script-expression-preview]")).toContainText(
    "subtract(hlc3, sma(close, length))",
  );

  await workbench.locator('[data-custom-script-field="default-length"]').fill("11");
  await workbench.locator("[data-custom-script-save]").click();

  await expect(workbench).toContainText("saved custom script My Text Script");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText(
    "subtract(hlc3, sma(close, length))",
  );
});

test("script library: pine subset metadata surfaces in the editor and saved rows", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-custom-script-field="label"]').fill("My Pine Candidate");
  await workbench.locator('[data-custom-script-field="short-label"]').fill("Pine Candidate");
  await workbench.locator('[data-custom-script-field="description"]').fill("Compatibility surface demo.");
  await workbench.locator('[data-custom-script-field="authoring-surface"]').selectOption("pine-subset-v0");

  await expect(workbench.locator("[data-custom-script-compatibility-label]")).toContainText(
    "Pine subset v0 · candidate",
  );
  await expect(workbench.locator("[data-custom-script-compatibility-note]")).toContainText(
    "Pine-oriented subset surface",
  );

  await workbench.locator("[data-custom-script-save]").click();

  await expect(workbench).toContainText("saved custom script My Pine Candidate");
  await expect(workbench.locator('[data-custom-script-compatibility="custom-script-1"]')).toContainText(
    "Pine subset v0 · candidate",
  );
});

test("script library: active custom scripts surface in-use state and fence edit/delete", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");

  await saveCustomScript(page, {
    label: "My Guarded Spread",
    shortLabel: "Guarded",
    description: "Edit/delete guard demo.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "7",
  });

  await addCustomScriptFromLibrary(page, "custom-script-1", "5");
  await expect(activeIndicatorList).toContainText("My Guarded Spread");
  await expect(workbench.locator('[data-custom-script-in-use="custom-script-1"]')).toContainText(
    "Remove active uses before editing or deleting.",
  );
  await expect(workbench.locator('[data-custom-script-edit="custom-script-1"]')).toBeDisabled();
  await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeDisabled();
  await expect(workbench.locator('[data-custom-script-duplicate="custom-script-1"]')).toBeEnabled();
  await activeIndicatorList
    .locator("[data-active-script-remove]")
    .first()
    .evaluate((node) => {
      if (!(node instanceof HTMLButtonElement)) {
        throw new Error("active script remove button is missing");
      }
      node.click();
    });
  await expect(activeIndicatorList).toContainText("No active indicators.");
  await expect(workbench.locator('[data-custom-script-in-use="custom-script-1"]')).toHaveCount(0);
  await expect(workbench.locator('[data-custom-script-edit="custom-script-1"]')).toBeEnabled();
  await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeEnabled();
});

test("script library: engine-native scripted studies still surface active and in-use fallback state", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");

  await saveCustomScript(page, {
    label: "Native Bridge Spread",
    shortLabel: "NativeBridge",
    description: "Engine chart-state scripted-study fallback demo.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "7",
  });

  const baselineRaw = await readExportedLayoutRawAfterExport(page);
  const baseline = JSON.parse(baselineRaw) as {
    chartState: {
      panes: { height: number | null; resizable: boolean }[];
      studies: unknown[];
    } | null;
    customScripts?: unknown[];
    scriptedIndicators?: unknown[];
  };

  if (baseline.chartState === null) {
    throw new Error("baseline exported chart state is missing");
  }

  const nativeOnlyLayout = {
    ...baseline,
    scriptedIndicators: [],
    chartState: {
      ...baseline.chartState,
      panes: [...baseline.chartState.panes, { height: 126, resizable: true }],
      studies: [
        ...baseline.chartState.studies,
        {
          type: "scripted-study",
          paneIndex: baseline.chartState.panes.length,
          seriesOptions: {},
          studyOptions: {
            scriptId: "custom-script-1",
            inputValues: { length: 5 },
            inputContextMode: "chart-context",
            requestedSymbol: null,
            requestedResolution: null,
            requestedSession: null,
            requestedTimezone: null,
            mergePolicy: "carry-forward",
          },
        },
      ],
    },
  };

  await page.evaluate(async (raw) => {
    const input = document.querySelector(
      'input[type="file"][accept*="json"]',
    ) as HTMLInputElement | null;
    if (input === null) {
      throw new Error("layout import input is missing");
    }
    const file = new File([raw], "engine-native-scripted-study-layout.json", {
      type: "application/json",
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, JSON.stringify(nativeOnlyLayout));

  await expect(workbench).toContainText("Imported layout");
  await expect(activeIndicatorList).toContainText("length 5");
  await expect(activeIndicatorList).toContainText("engine-restored");
  await expect(activeIndicatorList.locator("[data-active-script-remove]")).toHaveCount(0);
});

test("script library: delete requires an explicit confirm step", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "Delete Confirm Spread",
    shortLabel: "DeleteConfirm",
    description: "Delete confirmation demo.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "8",
  });

  await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete-cancel="custom-script-1"]')).toBeVisible();

  await workbench.locator('[data-custom-script-delete-cancel="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]')).toHaveCount(0);

  await workbench.locator('[data-custom-script-edit="custom-script-1"]').click();
  await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
  await workbench.locator('[data-custom-script-cancel]').click();
  await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]')).toHaveCount(0);

  await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
  await workbench.locator('[data-custom-script-filter]').fill("missing script");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
  await workbench.locator('[data-custom-script-filter-clear]').click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeVisible();
  await expect(workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]')).toHaveCount(0);

  await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
  await workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
  await expect(workbench).toContainText("deleted custom script Delete Confirm Spread");
});

test("script library: switching edit targets fences unsaved draft changes", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "First Script",
    shortLabel: "First",
    description: "First saved script.",
    expressionText: "sma(close, length)",
    placement: "separate-pane",
    defaultLength: "5",
  });
  await saveCustomScript(page, {
    label: "Second Script",
    shortLabel: "Second",
    description: "Second saved script.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "8",
  });

  await workbench.locator('[data-custom-script-edit="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("First Script");

  await workbench.locator('[data-custom-script-field="label"]').fill("Unsaved Label");
  await workbench.locator('[data-custom-script-edit="custom-script-2"]').click();
  await expect(workbench.locator("[data-custom-script-dirty-fence]")).toContainText(
    "Unsaved script changes",
  );
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("Unsaved Label");

  await workbench.locator("[data-custom-script-dirty-cancel]").click();
  await expect(workbench.locator("[data-custom-script-dirty-fence]")).toHaveCount(0);
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("Unsaved Label");
  await expect(workbench.locator("[data-custom-script-save]")).toContainText("Update script");

  await workbench.locator('[data-custom-script-edit="custom-script-2"]').click();
  await expect(workbench.locator("[data-custom-script-dirty-fence]")).toContainText(
    "Unsaved script changes",
  );
  await workbench.locator("[data-custom-script-dirty-discard]").click();
  await expect(workbench.locator("[data-custom-script-dirty-fence]")).toHaveCount(0);
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("Second Script");
});

test("script library: deleting the edited script clears the stale update target", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "My Editable Spread",
    shortLabel: "Editable",
    description: "Delete while editing demo.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "7",
  });

  await workbench.locator('[data-custom-script-edit="custom-script-1"]').click();
  await expect(workbench.locator("[data-custom-script-save]")).toContainText("Update script");
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("My Editable Spread");

  await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]')).toBeVisible();
  await workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]').click();
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
  await expect(workbench.locator("[data-custom-script-save]")).toContainText("Save script");
  await expect(workbench.locator("[data-custom-script-cancel]")).toHaveCount(0);
  await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("");

  await saveCustomScript(page, {
    label: "My Replacement Spread",
    shortLabel: "Replacement",
    description: "Fresh save after deletion.",
    expressionText: "sma(close, length)",
    placement: "separate-pane",
    defaultLength: "9",
  });

  await expect(workbench).toContainText("saved custom script My Replacement Spread");
  await expect(workbench).not.toContainText("updated custom script My Replacement Spread");
  await expect(workbench.locator('[data-custom-script="custom-script-2"]')).toContainText(
    "My Replacement Spread",
  );
});

test("script library: import field can resync to the current builder expression", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator("[data-custom-script-import-expression]").fill("close - open");
  await expect(workbench.locator("[data-custom-script-import-reset]")).toBeEnabled();

  await workbench.locator("[data-custom-script-import-reset]").click();
  await expect(workbench.locator("[data-custom-script-import-expression]")).toHaveValue(
    "sma(close, length)",
  );
  await expect(workbench.locator("[data-custom-script-import-reset]")).toBeDisabled();

  await workbench.locator('[data-custom-script-node-kind="root"]').selectOption("subtract");
  await expect(workbench.locator("[data-custom-script-expression-preview]")).toContainText(
    "subtract(close, sma(close, length))",
  );
  await expect(workbench.locator("[data-custom-script-import-reset]")).toBeEnabled();

  await workbench.locator("[data-custom-script-import-reset]").click();
  await expect(workbench.locator("[data-custom-script-import-expression]")).toHaveValue(
    "subtract(close, sma(close, length))",
  );
});

test("script library: local filter narrows saved scripts without touching runtime state", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "My Close Spread",
    shortLabel: "Spread",
    description: "Close minus close SMA.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "9",
  });
  await saveCustomScript(page, {
    label: "My HLC3 SMA",
    shortLabel: "HLC3",
    description: "HLC3 moving average.",
    expressionText: "sma(hlc3, length)",
    placement: "separate-pane",
    defaultLength: "10",
  });

  await expect(workbench.locator("[data-custom-script]")).toHaveCount(2);
  await expect(workbench.locator("[data-custom-script-filter-clear]")).toBeDisabled();

  await workbench.locator("[data-custom-script-filter]").fill("hlc3");
  await expect(workbench.locator("[data-custom-script-filter-clear]")).toBeEnabled();
  await expect(workbench.locator("[data-custom-script]")).toHaveCount(1);
  await expect(workbench.locator('[data-custom-script="custom-script-2"]')).toContainText(
    "My HLC3 SMA",
  );

  await workbench.locator("[data-custom-script-filter]").fill("no-match");
  await expect(workbench.locator("[data-custom-script]")).toHaveCount(0);
  await expect(workbench.locator("[data-custom-script-empty]")).toContainText(
    "No saved custom scripts match the current filter.",
  );

  await workbench.locator("[data-custom-script-filter-clear]").click();
  await expect(workbench.locator("[data-custom-script]")).toHaveCount(2);
  await expect(workbench.locator("[data-custom-script-filter-clear]")).toBeDisabled();
});

test("script library: local sort reorders saved scripts without changing runtime state", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "Alpha Spread",
    shortLabel: "Alpha",
    description: "Alpha expression.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "7",
  });
  await expect(workbench).toContainText("saved custom script Alpha Spread");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText("Alpha Spread");
  await saveCustomScript(page, {
    label: "Zulu Spread",
    shortLabel: "Zulu",
    description: "Zulu expression.",
    expressionText: "sma(hlc3, length)",
    placement: "separate-pane",
    defaultLength: "9",
  });
  await expect(workbench).toContainText("saved custom script Zulu Spread");
  await expect(workbench.locator('[data-custom-script="custom-script-2"]')).toContainText("Zulu Spread");

  const rows = workbench.locator("[data-custom-script]");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Zulu Spread");
  await expect(rows.nth(1)).toContainText("Alpha Spread");

  await workbench.locator("[data-custom-script-sort]").selectOption("label");
  await expect(rows.nth(0)).toContainText("Alpha Spread");
  await expect(rows.nth(1)).toContainText("Zulu Spread");

  await addCustomScriptFromLibrary(page, "custom-script-1", "5");
  await workbench.locator("[data-custom-script-sort]").selectOption("in-use");
  await expect(rows.nth(0)).toContainText("Alpha Spread");
  await expect(rows.nth(0).locator('[data-custom-script-in-use="custom-script-1"]')).toContainText(
    "In use on an active chart.",
  );
});

test("script library: empty filter state can recover back to the full saved list", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await saveCustomScript(page, {
    label: "Recovery Spread",
    shortLabel: "Recover",
    description: "Recovery filter demo.",
    expressionText: "subtract(close, sma(close, length))",
    placement: "separate-pane",
    defaultLength: "8",
  });

  await workbench.locator("[data-custom-script-filter]").fill("no-match");
  await expect(workbench.locator("[data-custom-script-empty]")).toContainText(
    "No saved custom scripts match the current filter.",
  );
  await workbench.locator("[data-custom-script-empty-clear]").click();
  await expect(workbench.locator("[data-custom-script-filter]")).toHaveValue("");
  await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toContainText(
    "Recovery Spread",
  );
});

test("adapter status: missing local storage providers surfaces degraded workstation actions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled for test");
      },
    });
  });

  await page.goto("/");
  const workbench = workbenchPanel(page);

  await expect(workbench.locator('[data-adapter-status="layout-persistence"]')).toHaveAttribute(
    "data-adapter-state",
    "missing",
  );
  await expect(workbench.locator('[data-adapter-status="alerts-persistence"]')).toHaveAttribute(
    "data-adapter-state",
    "missing",
  );
  await expect(workbench.locator('[data-adapter-status="market-data"]')).toHaveAttribute(
    "data-adapter-state",
    "local",
  );
  await expect(workbench.locator('[data-workbench-status="warning"]')).toContainText(
    "Local layout save/restore is unavailable",
  );
  await expect(workbench.locator('[data-workbench-panel="alerts"] .watch-empty')).toContainText(
    "Local alerts persistence unavailable.",
  );

  const toolbar = workbench.locator(".toolbar-strip");
  await expect(toolbar.getByRole("button", { name: "Save layout", exact: true })).toBeDisabled();
  await expect(toolbar.getByRole("button", { name: "Restore layout", exact: true })).toBeDisabled();
  await expect(toolbar.getByRole("button", { name: "Reset layout", exact: true })).toBeEnabled();
});

test("script library: host execution failure surfaces adapter-owned status without crashing the panel", async ({
  page,
}) => {
  await injectHostScriptAdapterFailure(page);
  await page.goto("/");

  const workbench = workbenchPanel(page);
  const scriptedSmaCard = scriptedIndicatorCard(page, "scripted-close-sma");

  await expect(workbench.locator("[data-script-execution-surface]")).toHaveAttribute(
    "data-script-execution-owner",
    "host-adapter",
  );
  await expect(scriptedSmaCard).toContainText("host adapter");

  await configureAndAddScriptIndicator(page, "scripted-close-sma", "length", "3");

  await expect(workbench.locator("[data-script-execution-surface]")).toHaveAttribute(
    "data-script-execution-state",
    "error",
  );
  await expect(workbench.locator("[data-script-execution-surface]")).toContainText(
    "Host adapter rejected close-sma-20-v0 for NDX 1D.",
  );
  await expect(workbench.locator('[data-workbench-status="error"]')).toContainText(
    "Scripted indicator failed: Host adapter rejected close-sma-20-v0 for NDX 1D.",
  );
  await expect(workbench.locator(".active-indicator-list")).toContainText("No active indicators.");
  await expect(workbench.locator("[data-custom-script-library]")).toBeVisible();
});

test("workbench keeps a deterministic narrow baseline", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 1100 });
  await page.goto("/");
  const frame = workbenchPanel(page).locator(".chart-frame");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness-narrow.png");
});

test("workbench mobile panels open as a sheet instead of forcing the sidebar inline", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-sidebar-trigger]");
  const sheet = workbench.locator("[data-mobile-sidebar-sheet]");

  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "false");
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "true");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "default");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("[data-workbench-panel='watchlist']")).toBeVisible();
  await expect(sheet.locator("[data-workbench-panel='account-sync']")).toBeVisible();

  await sheet.locator("[data-mobile-sidebar-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "expanded");

  await sheet.locator("[data-mobile-sidebar-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "full");

  await sheet.locator("[data-mobile-sidebar-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "default");

  await sheet.locator("[data-mobile-sidebar-close]").click();

  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "false");
});

test("workbench mobile trading panel opens as a bottom sheet instead of staying inline", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="custom"]').click();
  await expect(workbench.locator('[data-bottom-tab="custom"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const trigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const sheet = workbench.locator('[data-bottom-panel-kind="trading"]');

  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("[data-trading-ticket]")).toBeVisible();
  await expect(sheet).toContainText("Trading Ticket");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "expanded");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "full");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");

  await sheet.locator("[data-mobile-bottom-panel-close]").click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
});

test("workbench mobile strategy panel opens as a bottom sheet instead of staying inline", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="performance-link"]').click();
  await expect(workbench.locator('[data-bottom-tab="performance-link"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const trigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const sheet = workbench.locator('[data-bottom-panel-kind="performance-link"]');

  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("Performance");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("[data-strategy-tester-panel]")).toBeVisible();
  await expect(sheet).toContainText("Strategy Tester");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "expanded");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "full");

  await sheet.locator("[data-mobile-bottom-panel-size-toggle]").dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");

  await sheet.locator("[data-mobile-bottom-panel-close]").click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
});

test("workbench mobile replay panel opens as a bottom sheet and drives replay controls", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="replay"]').click();
  await expect(workbench.locator('[data-bottom-tab="replay"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const trigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const sheet = workbench.locator('[data-bottom-panel-kind="replay"]');

  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("Replay");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("[data-replay-panel]")).toBeVisible();
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-active", "false");

  await sheet.locator('[data-replay-control="enter"]').dispatchEvent("click");
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-active", "true");

  await sheet.locator('[data-replay-control="step"]').dispatchEvent("click");
  await expect
    .poll(async () => Number((await sheet.locator(".replay-summary").getAttribute("data-replay-current-step")) ?? "0"))
    .toBeGreaterThan(0);

  await sheet.locator('[data-replay-control="play"]').dispatchEvent("click");
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-playing", "true");

  await sheet.locator('[data-replay-control="pause"]').dispatchEvent("click");
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-playing", "false");

  await sheet.locator('[data-replay-control="exit"]').dispatchEvent("click");
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-active", "false");
});

test("workbench mobile replay toolbar entry auto-opens the replay bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const replayTab = workbench.locator('[data-bottom-tab="replay"]');
  const sheet = workbench.locator('[data-bottom-panel-kind="replay"]');

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Replay", exact: true }).click();

  await expect(replayTab).toHaveAttribute("data-bottom-tab-active", "true");
  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet.locator(".replay-summary")).toHaveAttribute("data-replay-active", "true");
});

test("workbench mobile toolbar opens as a dedicated sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();
  const trigger = workbench.locator("[data-mobile-toolbar-trigger]:visible").first();
  const sheet = workbench.locator("[data-mobile-toolbar-sheet]");

  await expect(trigger).toBeVisible();
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-mobile-toolbar-action="commands"]')).toBeVisible();
  await expect(sheet.locator('[data-mobile-toolbar-action="share"]')).toBeVisible();
});

test("workbench mobile toolbar closes after opening commands", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();
  const sheet = workbench.locator("[data-mobile-toolbar-sheet]");
  const palette = workbench.locator("[data-command-palette]");

  await workbench.locator("[data-mobile-toolbar-trigger]:visible").first().click();
  await expect(sheet).toBeVisible();

  await sheet.locator('[data-mobile-toolbar-action="commands"]').click();

  await expect(sheet).toBeHidden();
  await expect(palette).toBeVisible();
});

test("workbench mobile toolbar yields to the sidebar sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();
  const toolbar = workbench.locator("[data-mobile-toolbar-sheet]");
  const sidebar = workbench.locator("[data-mobile-sidebar-sheet]");

  await workbench.locator("[data-mobile-toolbar-trigger]:visible").first().click();
  await expect(toolbar).toBeVisible();

  await toolbar.locator("[data-mobile-toolbar-open-panels]").click();

  await expect(toolbar).toBeHidden();
  await expect(sidebar).toHaveAttribute("data-mobile-sidebar-open", "true");
});

test("workbench mobile chart meta hides duplicated pane and OHLC readout", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();

  await expect(workbench.locator("[data-chart-meta-ohlc]").first()).toBeHidden();
  await expect(workbench.locator("[data-chart-meta-pane]")).toBeHidden();
  await expect(workbench.locator(".chart-meta")).toContainText("NASDAQ");
});

test("workbench mobile workspace tabs collapse into a compact strip with active summary", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();
  const summary = workbench.locator("[data-mobile-workspace-summary]");
  const tradeTab = workbench.locator('[data-workspace-view="trade"]').first();
  const scanTab = workbench.locator('[data-workspace-view="scan"]').first();

  await expect(summary).toBeVisible();
  await expect(summary).toContainText("Trade");
  await expect(summary).toContainText("NDX · 1D");
  await expect(tradeTab.locator("[data-workspace-tab-detail]")).toBeHidden();

  await scanTab.locator(".workspace-tab-main").click();

  await expect(summary).toContainText("Scan");
  await expect(summary).toContainText("SPX · 4H");
  await expect(scanTab.locator("[data-workspace-tab-detail]")).toBeHidden();
});

test("workbench mobile bottom triggers use compact labels", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = page.locator('[data-demo-tab="workbench"]:visible').first();
  const panelTrigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const controlsTrigger = workbench.locator("[data-mobile-footer-controls-trigger]");

  await expect(panelTrigger).toContainText("Time presets");
  await expect(panelTrigger).not.toContainText("Open");
  await expect(controlsTrigger).toContainText("Controls");
  await expect(controlsTrigger).not.toContainText("Open");

  await controlsTrigger.click();
  await expect(controlsTrigger).toContainText("Controls");

  await workbench.locator("[data-mobile-footer-controls-close]").click();
  await expect(controlsTrigger).toContainText("Controls");
});

test("workbench mobile logs panel opens as a bottom sheet instead of relying on the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="logs"]').click();
  await expect(workbench.locator('[data-bottom-tab="logs"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const trigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const sheet = workbench.locator('[data-bottom-panel-kind="logs"]');

  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(trigger).toBeVisible();
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await sheet.locator("[data-mobile-bottom-panel-close]").click();
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await trigger.click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet.locator("[data-activity-log-panel]")).toBeVisible();
  await expect(sheet.locator("[data-activity-log-panel]")).toContainText("Activity");
});

test("workbench mobile time presets open as a bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="logs"]').click();
  await expect(workbench.locator('[data-bottom-tab="logs"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await workbench.locator('[data-bottom-panel-kind="logs"]').locator('[data-mobile-bottom-panel-close]').click();
  await expect(workbench.locator('[data-bottom-panel-kind="logs"]')).toHaveAttribute(
    "data-mobile-bottom-panel-open",
    "false",
  );

  await workbench.locator('[data-bottom-tab="time-presets"]').click();
  await expect(workbench.locator('[data-bottom-tab="time-presets"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const trigger = workbench.locator("[data-mobile-bottom-panel-trigger]");
  const sheet = workbench.locator('[data-bottom-panel-kind="time-presets"]');

  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("Time presets");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await sheet.locator("[data-mobile-bottom-panel-close]").click();
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await trigger.click();

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
  await expect(sheet.locator("[data-time-presets-panel]")).toBeVisible();
  await expect(sheet.locator('[data-time-preset="1D"]')).toHaveClass(/active/);
});

test("workbench mobile logs tab auto-opens its bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator('[data-bottom-panel-kind="logs"]');

  await workbench.locator('[data-bottom-tab="logs"]').click();

  await expect(workbench.locator('[data-bottom-tab="logs"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
});

test("workbench mobile time-presets tab auto-opens its bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator('[data-bottom-panel-kind="time-presets"]');

  await workbench.locator('[data-bottom-tab="logs"]').click();
  await expect(workbench.locator('[data-bottom-tab="logs"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  await workbench.locator('[data-bottom-tab="time-presets"]').click();

  await expect(workbench.locator('[data-bottom-tab="time-presets"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await expect.poll(async () => sheet.count()).toBe(1);
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");
});

test("workbench mobile footer controls open as a dedicated sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-footer-controls-trigger]");
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");

  await expect(trigger).toBeVisible();
  await expect(workbench.locator(".time-strip").first()).toBeHidden();
  await expect(sheet).toBeHidden();

  await trigger.click();

  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "1D", exact: true })).toBeVisible();
  await expect(sheet.locator('[data-mobile-footer-action]').first()).toBeVisible();
});

test("workbench mobile footer controls close after an action tap", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-footer-controls-trigger]");
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");

  await trigger.click();
  await expect(sheet).toBeVisible();

  await sheet.locator('[data-mobile-footer-action]').first().click();

  await expect(sheet).toBeHidden();
});

test("workbench mobile footer controls can be drag-dismissed from the handle", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");
  const handle = workbench.locator("[data-mobile-footer-controls-drag-handle]");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(sheet).toBeVisible();
  await expect(handle).toBeVisible();

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 100 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 180 });

  await expect(sheet).toBeHidden();
});

test("workbench mobile footer controls ignore short drag gestures below the dismiss threshold", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");
  const handle = workbench.locator("[data-mobile-footer-controls-drag-handle]");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(sheet).toBeVisible();
  await expect(handle).toBeVisible();

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 100 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 148 });

  await expect(sheet).toBeVisible();
});

test("workbench mobile footer controls support size toggle cycling", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");
  const sizeToggle = workbench.locator("[data-mobile-footer-controls-size-toggle]");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(sizeToggle).toBeVisible();
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "default");

  await sizeToggle.dispatchEvent("click");
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "expanded");

  await sizeToggle.dispatchEvent("click");
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "full");

  await sizeToggle.dispatchEvent("click");
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "default");
});

test("workbench mobile footer controls support upward drag-to-snap and live drag follow", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const sheet = workbench.locator("[data-mobile-footer-controls-sheet]");
  const handle = workbench.locator("[data-mobile-footer-controls-drag-handle]");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "default");
  await expect(handle).toBeVisible();

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointermove", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-dragging", "true");
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-drag-offset", "-100");

  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-dragging", "false");
  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "expanded");

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-footer-controls-size", "full");
});

test("workbench mobile footer controls yield to the sidebar sheet", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const footer = workbench.locator("[data-mobile-footer-controls-sheet]");
  const sidebar = workbench.locator("[data-mobile-sidebar-sheet]");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(footer).toBeVisible();

  await workbench.locator("[data-mobile-sidebar-trigger]").click();

  await expect(footer).toBeHidden();
  await expect(sidebar).toHaveAttribute("data-mobile-sidebar-open", "true");
});

test("workbench mobile footer controls yield to the bottom panel trigger", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const footer = workbench.locator("[data-mobile-footer-controls-sheet]");
  const bottom = workbench.locator('[data-bottom-panel-kind="time-presets"]');

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();
  await expect(footer).toBeVisible();

  await workbench.locator("[data-mobile-bottom-panel-trigger]").click();

  await expect(footer).toBeHidden();
  await expect(bottom).toHaveAttribute("data-mobile-bottom-panel-open", "true");
});

test("workbench mobile footer controls replace an open bottom panel", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const footer = workbench.locator("[data-mobile-footer-controls-sheet]");
  const bottom = workbench.locator('[data-bottom-panel-kind="time-presets"]');

  await workbench.locator('[data-bottom-tab="logs"]').click();
  await workbench.locator('[data-bottom-panel-kind="logs"]').locator('[data-mobile-bottom-panel-close]').click();
  await workbench.locator('[data-bottom-tab="time-presets"]').click();
  await expect(bottom).toHaveAttribute("data-mobile-bottom-panel-open", "true");

  await workbench.locator("[data-mobile-footer-controls-trigger]").click();

  await expect(bottom).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await expect(footer).toBeVisible();
});

test("workbench mobile sidebar sheet can be drag-dismissed from the handle", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-sidebar-trigger]");
  const sheet = workbench.locator("[data-mobile-sidebar-sheet]");

  await trigger.click();
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "true");

  const handle = sheet.locator("[data-mobile-sidebar-drag-handle]");
  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 100 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 180 });

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "false");
});

test("workbench mobile sidebar sheet ignores short drag gestures below the dismiss threshold", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-sidebar-trigger]");
  const sheet = workbench.locator("[data-mobile-sidebar-sheet]");

  await trigger.click();
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "true");

  const handle = sheet.locator("[data-mobile-sidebar-drag-handle]");
  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 100 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 148 });

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "true");
});

test("workbench mobile sidebar sheet supports upward drag-to-snap and live drag follow", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-sidebar-trigger]");
  const sheet = workbench.locator("[data-mobile-sidebar-sheet]");

  await trigger.click();
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "default");

  const handle = sheet.locator("[data-mobile-sidebar-drag-handle]");
  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointermove", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-dragging", "true");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-drag-offset", "-100");

  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-dragging", "false");
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "expanded");

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-size", "full");
});

test("workbench mobile bottom sheet can be drag-dismissed from the handle", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="custom"]').click();
  await expect(workbench.locator('[data-bottom-tab="custom"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await workbench.locator("[data-mobile-bottom-panel-trigger]").click();

  const sheet = workbench.locator('[data-bottom-panel-kind="trading"]');
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");

  const handle = sheet.locator("[data-mobile-bottom-panel-drag-handle]");
  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 100 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 180 });

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
});

test("workbench mobile bottom sheet supports upward drag-to-snap and live drag follow", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="custom"]').click();
  await expect(workbench.locator('[data-bottom-tab="custom"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await workbench.locator("[data-mobile-bottom-panel-trigger]").click();

  const sheet = workbench.locator('[data-bottom-panel-kind="trading"]');
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "default");

  const handle = sheet.locator("[data-mobile-bottom-panel-drag-handle]");
  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointermove", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-dragging", "true");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-drag-offset", "-100");

  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-dragging", "false");
  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "expanded");

  await handle.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientY: 220 });
  await handle.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientY: 120 });

  await expect(sheet).toHaveAttribute("data-mobile-bottom-panel-size", "full");
});

test("workbench mobile sidebar sheet auto-closes when workspace navigation changes", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);
  const trigger = workbench.locator("[data-mobile-sidebar-trigger]");
  const sheet = workbench.locator("[data-mobile-sidebar-sheet]");

  await trigger.click();
  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "true");

  await workbench.locator('[data-workspace-tab-trigger="workspace-2"]').dispatchEvent("click");

  await expect(sheet).toHaveAttribute("data-mobile-sidebar-open", "false");
  await expect(workbench.locator('[data-workspace-tab="workspace-2"]')).toHaveAttribute(
    "data-workspace-active",
    "true",
  );
});

test("workbench mobile bottom sheet auto-closes when bottom-tab navigation changes", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 1100 });
  await page.goto("/");
  const workbench = workbenchPanel(page);

  await workbench.locator('[data-bottom-tab="custom"]').click();
  await expect(workbench.locator('[data-bottom-tab="custom"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );
  await workbench.locator("[data-mobile-bottom-panel-trigger]").click();

  const tradingSheet = workbench.locator('[data-bottom-panel-kind="trading"]');
  await expect(tradingSheet).toHaveAttribute("data-mobile-bottom-panel-open", "true");

  await workbench.locator('[data-bottom-tab="performance-link"]').dispatchEvent("click");
  await expect(workbench.locator('[data-bottom-tab="performance-link"]')).toHaveAttribute(
    "data-bottom-tab-active",
    "true",
  );

  const strategySheet = workbench.locator('[data-bottom-panel-kind="performance-link"]');
  await expect(strategySheet).toHaveAttribute("data-mobile-bottom-panel-open", "false");
  await expect(workbench.locator("[data-mobile-bottom-panel-trigger]")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
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
  await expect(indicators).toContainText("Scripted SMA 20");
  await expect(indicators).toContainText("Scripted HLC3 SMA 10");
  await expect(activeIndicatorList).toContainText("No active indicators.");

  const movingAverageButton = indicators.getByRole("button", { name: /Moving Average/ });
  await movingAverageButton.scrollIntoViewIfNeeded();
  await movingAverageButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("moving average indicator button is missing");
    }
    node.click();
  });
  await expect(workbench).toContainText("added indicator Moving Average");
  await expect(activeIndicatorList).toContainText("Moving Average");
  await expect(activeIndicatorList).toContainText("separate-pane");

  const compareButton = indicators.getByRole("button", { name: /Compare/ });
  await compareButton.scrollIntoViewIfNeeded();
  await compareButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("compare indicator button is missing");
    }
    node.click();
  });
  await expect(workbench).toContainText("added indicator Compare");
  await expect(activeIndicatorList).toContainText("Compare");
  await expect(activeIndicatorList).toContainText("overlay");

  const overlayLineButton = indicators.getByRole("button", { name: /Overlay Line/ });
  await overlayLineButton.scrollIntoViewIfNeeded();
  await overlayLineButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("overlay line indicator button is missing");
    }
    node.click();
  });
  await expect(workbench).toContainText("added indicator Overlay Line");
  await expect(activeIndicatorList).toContainText("Overlay Line");

  const scriptedSmaCard = scriptedIndicatorCard(page, "scripted-close-sma");
  await scriptedSmaCard.scrollIntoViewIfNeeded();
  await configureAndAddScriptIndicator(page, "scripted-close-sma", "length", "2");
  await expect(workbench).toContainText("added indicator Scripted SMA 20 (Length 2)");
  await expect(activeIndicatorList).toContainText("Scripted SMA 20");
  await expect(activeIndicatorList).toContainText("separate-pane");
  await expect(activeIndicatorList).toContainText("length 2");

  await workbench.getByRole("button", { name: "Line Break", exact: true }).click();

  await expect(activeIndicatorList).toContainText("No active indicators.");
  await expect(activeIndicatorList).not.toContainText("Moving Average");
  await expect(activeIndicatorList).not.toContainText("Compare");
  await expect(activeIndicatorList).not.toContainText("Overlay Line");
  await expect(activeIndicatorList).not.toContainText("Scripted SMA 20");
});

test("workbench replays the active dataset locally", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const replay = workbench.locator("[data-replay-panel]");
  const summary = replay.locator(".replay-summary");

  await expect(replay).toContainText("Replay");
  await expect(summary).toHaveAttribute("data-replay-active", "false");

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Replay", exact: true }).click();
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

  const movingAverageButton = indicators.getByRole("button", { name: /Moving Average/ });
  await movingAverageButton.scrollIntoViewIfNeeded();
  await movingAverageButton.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error("moving average indicator button is missing");
    }
    node.click();
  });
  await expect(workbench).toContainText("added indicator Moving Average");
  await expect(tree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Moving Average" })).toHaveCount(1);

  const scriptedSmaCard = scriptedIndicatorCard(page, "scripted-close-sma");
  await scriptedSmaCard.scrollIntoViewIfNeeded();
  await configureAndAddScriptIndicator(page, "scripted-close-sma", "length", "2");
  await expect(workbench).toContainText("added indicator Scripted SMA 20 (Length 2)");
  await expect(tree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(1);
  await expect(tree.locator('[data-object-tree-kind="study"]').filter({ hasText: /^Scripted Study$/ })).toHaveCount(0);
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
  const indicators = workbench.locator(".indicator-card");
  const activeIndicatorList = indicators.locator(".active-indicator-list");
  const objectTree = workbench.locator('[data-workbench-panel="object-tree"] [role="tree"]');

  await workbench.locator('[data-workspace-view="inspect"]').first().locator(".workspace-tab-main").click();
  await expect(workbench.locator('[data-workspace-view="inspect"]').first()).toHaveAttribute(
    "data-workspace-active",
    "true",
  );

  await watchlist.getByRole("button", { name: /SPX/ }).click();
  await expect(workbench).toContainText("SPX Workbench");

  const scriptedSmaCard = scriptedIndicatorCard(page, "scripted-close-sma");
  await scriptedSmaCard.scrollIntoViewIfNeeded();
  await configureAndAddScriptIndicator(page, "scripted-close-sma", "length", "2");
  await expect(workbench).toContainText("added indicator Scripted SMA 20 (Length 2)");
  await expect(activeIndicatorList).toContainText("Scripted SMA 20");
  await expect(activeIndicatorList).toContainText("length 2");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(1);

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(workbench).toContainText("saved layout SPX");

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(workbench).toContainText("NDX Workbench");
  await expect(activeIndicatorList).not.toContainText("Scripted SMA 20");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(0);

  await workbench.locator(".toolbar-strip").getByRole("button", { name: "Restore layout", exact: true }).click();
  await expect(workbench).toContainText("SPX Workbench");
  await expect(workbench).toContainText("restored layout SPX");
  await expect(activeIndicatorList).toContainText("Scripted SMA 20");
  await expect(activeIndicatorList).toContainText("length 2");
  await expect(objectTree.locator('[data-object-tree-kind="study"]').filter({ hasText: "Scripted SMA 20" })).toHaveCount(1);
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
