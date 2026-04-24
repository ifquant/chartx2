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

function workbenchAction(page: Page, actionId: string) {
  return workbenchPanel(page).locator(`[data-demo-action="${actionId}"]`);
}

function workbenchCommandPalette(page: Page) {
  return workbenchPanel(page).locator("[data-command-palette]");
}

function scriptedIndicatorCard(page: Page, entryId: string) {
  return workbenchPanel(page).locator(`[data-script-add-entry="${entryId}"]`).locator("xpath=..");
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
      inputValues?: Record<string, number>;
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
    inputValues: {
      length: 2,
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
    scriptedIndicators?: { label: string; scriptId: string; inputValues?: Record<string, number> }[];
  };

  expect(exported.customScripts?.[0]).toMatchObject({
    id: "custom-script-1",
    label: "My Close Spread",
  });
  expect(exported.scriptedIndicators?.[0]).toMatchObject({
    label: "My Close Spread",
    scriptId: "custom-script-1",
    inputValues: {
      length: 4,
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
