import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = "/Users/dev/workspace2/hc_apps/build/chartx2";

function newestLocalTarball() {
  const tarballs = readdirSync(releaseRoot)
    .filter((entry) => entry.startsWith("chartx2-library-") && entry.endsWith(".tgz"))
    .map((entry) => {
      const tarballPath = path.join(releaseRoot, entry);
      return { entry, path: tarballPath, mtimeMs: statSync(tarballPath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs || left.entry.localeCompare(right.entry));

  if (tarballs.length === 0) throw new Error(`No chartx2 library tarball found in ${releaseRoot}`);
  return tarballs[0].path;
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: "inherit", ...options });
}

const consumerRoot = mkdtempSync(path.join(tmpdir(), "chartx2-release-consumer-"));

try {
  run("node", [path.join(repoRoot, "scripts/pack-chartx2-local-release.mjs")], { cwd: repoRoot });
  const tarballPath = newestLocalTarball();

  writeFileSync(path.join(consumerRoot, "package.json"), JSON.stringify({
    name: "chartx2-local-release-consumer-smoke",
    private: true,
    type: "module",
    dependencies: {
      "@chartx2/library": `file:${tarballPath}`,
      "@playwright/test": "1.58.2",
      "@sveltejs/vite-plugin-svelte": "5.1.1",
      svelte: "5.55.1",
      typescript: "5.6.3",
      vite: "6.4.1",
    },
  }, null, 2) + "\n");

  // This directory is intentionally outside the workspace: every import below must
  // resolve through the packed tarball and this consumer's own dependencies.
  run("pnpm", ["install", "--ignore-scripts", "--reporter", "append-only"], { cwd: consumerRoot });
  run("pnpm", ["exec", "playwright", "install", "chromium"], { cwd: consumerRoot });

  writeFileSync(path.join(consumerRoot, "type-probe.ts"), `
import {
  ChartFrameShell,
  TradingLedgerPanel,
  TradingTicketPanel,
  type PhaseOneTimeFocusResult,
  type PhaseOneTimeScaleApi,
  type TradingLedgerPanelModel,
} from "@chartx2/library";
import { WorkbenchDrawingInspectorPanel } from "@chartx2/library/workbench-drawing-inspector";

function describeFocusResult(result: PhaseOneTimeFocusResult): string {
  switch (result.kind) {
    case "exact": return result.resolvedTime.toString();
    case "nearest": return result.distance.toString();
    case "outOfDomain": return result.reason;
    case "ambiguous": return result.resolvedTime.toString();
    case "noData": return result.requestedTime.toString();
    default: {
      const impossible: never = result;
      return impossible;
    }
  }
}

const timeScale = {
  getVisibleLogicalRange: () => null,
  setVisibleLogicalRange: (_range: { from: number; to: number }) => undefined,
  focusTime: (_request: { time: number; maxDistance: number }): PhaseOneTimeFocusResult => ({ kind: "noData", requestedTime: 0 }),
  applyOptions: () => undefined,
} satisfies PhaseOneTimeScaleApi;

void ChartFrameShell;
void TradingTicketPanel;
void TradingLedgerPanel;
void WorkbenchDrawingInspectorPanel;
void describeFocusResult(timeScale.focusTime({ time: 0, maxDistance: 0 }));
void timeScale;
const heterogeneousLedger: TradingLedgerPanelModel = {
  tabs: [{ id: "account", label: "Account" }],
  activeTabId: "account",
  columns: [{ id: "balance", label: "Balance" }],
  rows: [{
    id: "account-1",
    symbol: "--",
    direction: "--",
    quantity: "--",
    average: "--",
    statusLabel: "ready",
    cells: [{ valueLabel: "100000" }],
  }],
};
void heterogeneousLedger;
`);
  writeFileSync(path.join(consumerRoot, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      module: "ESNext", moduleResolution: "Bundler", noEmit: true, skipLibCheck: true,
      strict: true, target: "ES2022", types: ["svelte"],
    },
    include: ["type-probe.ts"],
  }, null, 2) + "\n");
  run("pnpm", ["exec", "tsc", "--noEmit"], { cwd: consumerRoot });

  writeFileSync(path.join(consumerRoot, "index.html"), '<div id="app"></div><canvas id="chart" width="640" height="360"></canvas><canvas id="empty" width="640" height="360"></canvas><script type="module" src="/runtime.js"></script>\n');
  writeFileSync(path.join(consumerRoot, "App.svelte"), `
<script>
  import { TradingLedgerPanel, TradingTicketPanel } from "@chartx2/library";

  const ticket = {
    title: "Packed ticket",
    symbol: "rb2605",
    side: "buy",
    orderType: "limit",
    quantity: { label: "Quantity", valueLabel: "2" },
    limitPrice: { label: "Limit price", valueLabel: "3718" },
    summaryLabel: "Legacy summary",
    submitLabel: "Submit legacy ticket",
    state: { status: "ready", submitEnabled: true },
  };
  const legacyLedger = {
    tabs: [{ id: "orders", label: "Orders" }],
    activeTabId: "orders",
    selectedRowId: "legacy-order-1",
    rows: [{
      id: "legacy-order-1",
      symbol: "rb2605",
      direction: "buy",
      quantity: "2",
      average: "3718",
      statusLabel: "Accepted",
    }],
  };
  const factViews = {
    orders: {
      labels: ["订单号", "状态", "方向", "数量", "成交", "价格"],
      rows: [["order-1", "Accepted", "buy", "2", "0", "3718"], ["order-2", "Working", "sell", "1", "0", "3720"]],
    },
    fills: {
      labels: ["成交号", "时间", "方向", "数量", "价格"],
      rows: [["fill-1", "09:31:00", "buy", "1", "3718"]],
    },
    positions: {
      labels: ["方向", "数量", "均价", "浮盈"],
      rows: [["long", "2", "3718", "+120"]],
    },
    account: {
      labels: ["账户", "时间", "权益", "可用", "保证金", "已实现净盈亏"],
      rows: [["sim-1", "09:31:00", "100120", "85120", "15000", "+120"]],
    },
  };

  let legacySubmitCount = $state(0);
  let activeFactTab = $state("orders");
  let selectedFactRowId = $state("order-1");
  let genericLedger = $derived({
    title: "Packed heterogeneous ledger",
    tabs: [
      { id: "orders", label: "Orders" },
      { id: "fills", label: "Fills" },
      { id: "positions", label: "Positions" },
      { id: "account", label: "Account" },
    ],
    activeTabId: activeFactTab,
    selectedRowId: selectedFactRowId,
    columns: factViews[activeFactTab].labels.map((label, index) => ({ id: "column-" + index, label })),
    rows: factViews[activeFactTab].rows.map((values, index) => ({
      id: activeFactTab + "-" + index,
      symbol: "--",
      direction: "--",
      quantity: "--",
      average: "--",
      statusLabel: "--",
      cells: values.map((value) => ({ valueLabel: value })),
    })),
  });

  function selectFactTab(tabId) {
    activeFactTab = tabId;
    selectedFactRowId = tabId + "-0";
  }
</script>

<section data-packed-ticket-legacy>
  <TradingTicketPanel model={ticket} onSubmit={() => { legacySubmitCount += 1; }} />
  <output data-packed-legacy-submit-count>{legacySubmitCount}</output>
</section>

<section data-packed-ticket-custom>
  {#snippet editor()}
    <label>Custom quantity <input data-packed-ticket-editor value="3" /></label>
  {/snippet}
  {#snippet ticketActions()}
    <button type="button" data-packed-ticket-action>Preview and submit</button>
  {/snippet}
  <TradingTicketPanel model={ticket} {editor} actions={ticketActions} />
</section>

<section data-packed-ticket-editor-only>
  {#snippet editorOnly()}
    <label>Editor only <input data-packed-ticket-editor-only value="4" /></label>
  {/snippet}
  <TradingTicketPanel model={ticket} editor={editorOnly} />
</section>

<section data-packed-ticket-actions-only>
  {#snippet actionsOnly()}
    <button type="button" data-packed-ticket-action-only>Preview only</button>
  {/snippet}
  <TradingTicketPanel model={ticket} actions={actionsOnly} />
</section>

<section data-packed-ledger-legacy>
  <TradingLedgerPanel model={legacyLedger} />
</section>

<section data-packed-ledger-generic>
  <TradingLedgerPanel model={genericLedger} onSelectTab={selectFactTab} onSelectRow={(rowId) => { selectedFactRowId = rowId; }} />
</section>
`);
  writeFileSync(path.join(consumerRoot, "runtime.js"), `
import { mount } from "svelte";
import { ChartFrameShell, TradingLedgerPanel, TradingTicketPanel, createChartxPhaseOneChart } from "@chartx2/library";
import { WorkbenchDrawingInspectorPanel } from "@chartx2/library/workbench-drawing-inspector";
import App from "./App.svelte";

if (!ChartFrameShell) throw new Error("root package lost an existing public export");
if (!TradingTicketPanel || !TradingLedgerPanel) throw new Error("root package lost a trading host seam");
if (!WorkbenchDrawingInspectorPanel) throw new Error("focused inspector public subpath is unavailable");
mount(App, { target: document.querySelector("#app") });
const chart = createChartxPhaseOneChart(document.querySelector("#chart"));
const series = chart.addCandlestickSeries();
series.setData([
  { time: 100, open: 10, high: 12, low: 9, close: 11 },
  { time: 200, open: 11, high: 13, low: 10, close: 12 },
  { time: 300, open: 12, high: 14, low: 11, close: 13 },
]);
const timeScale = chart.timeScale();
const beforeRejected = timeScale.getVisibleLogicalRange();
const beforeFirst = timeScale.focusTime({ time: 99, maxDistance: 1000 });
const afterRejected = timeScale.getVisibleLogicalRange();
const results = {
  exact: timeScale.focusTime({ time: 200, maxDistance: 0 }),
  nearest: timeScale.focusTime({ time: 205, maxDistance: 5 }),
  beforeFirst,
  maxDistance: timeScale.focusTime({ time: 206, maxDistance: 5 }),
  rejectedRangeStable: JSON.stringify(beforeRejected) === JSON.stringify(afterRejected),
};
chart.destroy();
const empty = createChartxPhaseOneChart(document.querySelector("#empty"));
results.noData = empty.timeScale().focusTime({ time: 100, maxDistance: 0 });
empty.destroy();
window.__chartx2PackedProbe = results;
`);
  writeFileSync(path.join(consumerRoot, "probe.mjs"), `
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  plugins: [svelte()],
  server: { host: "127.0.0.1" },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
  const results = await page.evaluate(() => window.__chartx2PackedProbe);
  if (results.exact.kind !== "exact" || results.nearest.kind !== "nearest") throw new Error("packed focus success cases failed");
  if (results.beforeFirst.kind !== "outOfDomain" || results.beforeFirst.reason !== "beforeFirst") throw new Error("packed before-first handling failed");
  if (results.maxDistance.kind !== "outOfDomain" || results.maxDistance.reason !== "maxDistanceExceeded") throw new Error("packed max-distance handling failed");
  if (results.noData.kind !== "noData" || !results.rejectedRangeStable) throw new Error("packed rejected focus changed viewport or no-data handling failed");

  // The consumer mounts each component from the packed package root.  These
  // assertions deliberately cover both default compatibility and the two new
  // host seams, rather than merely proving that their types can be imported.
  const legacyTicket = page.locator("[data-packed-ticket-legacy] [data-trading-ticket]");
  if (await legacyTicket.locator('[data-trading-ticket-field="quantity"]').count() !== 1) throw new Error("packed legacy ticket lost its default editor");
  if (await legacyTicket.locator("[data-trading-ticket-summary]").count() !== 1) throw new Error("packed legacy ticket lost its default summary");
  await legacyTicket.locator("[data-trading-ticket-submit]").click();
  if (await page.locator("[data-packed-legacy-submit-count]").textContent() !== "1") throw new Error("packed legacy ticket did not call onSubmit");

  const customTicket = page.locator("[data-packed-ticket-custom] [data-trading-ticket]");
  if (await customTicket.locator("[data-packed-ticket-editor]").count() !== 1) throw new Error("packed custom editor seam did not mount");
  if (await customTicket.locator("[data-packed-ticket-field]").count() !== 0) throw new Error("packed custom ticket duplicated default fields");
  if (await customTicket.locator("[data-trading-ticket-actions]").count() !== 1) throw new Error("packed custom actions seam did not mount");
  if (await customTicket.locator("[data-trading-ticket-summary], [data-trading-ticket-submit]").count() !== 0) throw new Error("packed custom ticket duplicated default actions");
  if (await customTicket.locator("[data-packed-ticket-editor], [data-packed-ticket-action]").count() !== 2) throw new Error("packed custom ticket content is incomplete");

  const editorOnlyTicket = page.locator("[data-packed-ticket-editor-only] [data-trading-ticket]");
  if (await editorOnlyTicket.locator("[data-packed-ticket-editor-only]").count() !== 1) throw new Error("packed editor-only ticket did not mount its editor");
  if (await editorOnlyTicket.locator("[data-trading-ticket-field]").count() !== 0) throw new Error("packed editor-only ticket duplicated default fields");
  if (await editorOnlyTicket.locator("[data-trading-ticket-summary], [data-trading-ticket-submit]").count() !== 2) throw new Error("packed editor-only ticket lost default actions");

  const actionsOnlyTicket = page.locator("[data-packed-ticket-actions-only] [data-trading-ticket]");
  if (await actionsOnlyTicket.locator('[data-trading-ticket-field="quantity"], [data-trading-ticket-field="limit-price"]').count() !== 2) throw new Error("packed actions-only ticket lost default fields");
  if (await actionsOnlyTicket.locator("[data-trading-ticket-actions], [data-packed-ticket-action-only]").count() !== 2) throw new Error("packed actions-only ticket did not mount its action replacement");
  if (await actionsOnlyTicket.locator("[data-trading-ticket-summary], [data-trading-ticket-submit]").count() !== 0) throw new Error("packed actions-only ticket duplicated default actions");

  const legacyLedger = page.locator("[data-packed-ledger-legacy] [data-trading-ledger]");
  const legacyHeaders = await legacyLedger.locator('[role="columnheader"]').allTextContents();
  if (JSON.stringify(legacyHeaders) !== JSON.stringify(["合约", "方向", "数量", "均价", "浮盈/状态"])) throw new Error("packed legacy ledger columns changed");

  const genericLedger = page.locator("[data-packed-ledger-generic] [data-trading-ledger]");
  if (await genericLedger.locator('[role="tablist"] [role="tab"]').count() !== 4) throw new Error("packed generic ledger tab semantics are missing");
  if (await genericLedger.locator('[role="tabpanel"]').count() !== 4) throw new Error("packed generic ledger tabpanel semantics are missing");
  const pageIds = await page.locator("[id]").evaluateAll((elements) => elements.map((element) => element.id));
  if (new Set(pageIds).size !== pageIds.length) throw new Error("packed ledger panels produced duplicate document IDs");
  const assertTabRelations = async (ledger, label) => {
    const relations = await ledger.locator('[role="tab"]').evaluateAll((tabs) => tabs.map((tab) => {
      const controlledId = tab.getAttribute("aria-controls");
      const panel = controlledId ? document.getElementById(controlledId) : null;
      return {
        tabId: tab.id,
        controlledId,
        panelId: panel?.id ?? null,
        panelLabel: panel?.getAttribute("aria-labelledby") ?? null,
      };
    }));
    if (relations.length === 0 || relations.some((relation) => relation.controlledId !== relation.panelId || relation.tabId !== relation.panelLabel)) throw new Error("packed " + label + " tab/panel IDs are not exact per-instance associations");
  };
  await assertTabRelations(legacyLedger, "legacy ledger");
  await assertTabRelations(genericLedger, "generic ledger");
  const activeGenericPanel = () => genericLedger.locator('[role="tabpanel"]:not([hidden])');
  const genericTabs = genericLedger.locator('[role="tab"]');
  const activeGenericTab = () => genericLedger.locator('[role="tab"][aria-selected="true"]');
  const assertHeaders = async (tabId, expected) => {
    await genericLedger.locator('[data-trading-ledger-tab="' + tabId + '"]').click();
    const headers = await activeGenericPanel().locator('[role="columnheader"]').allTextContents();
    if (JSON.stringify(headers) !== JSON.stringify(expected)) throw new Error("packed generic " + tabId + " columns did not render");
    const selected = genericLedger.locator('[data-trading-ledger-tab="' + tabId + '"]');
    if (await selected.getAttribute("aria-selected") !== "true") throw new Error("packed generic " + tabId + " tab did not become selected");
    if (await activeGenericPanel().getAttribute("aria-labelledby") !== await selected.getAttribute("id")) throw new Error("packed generic " + tabId + " active tab/panel association is stale");
  };
  await genericTabs.nth(0).focus();
  await page.keyboard.press("End");
  if (await activeGenericTab().getAttribute("data-trading-ledger-tab") !== "account" || !await genericTabs.nth(3).evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger tab End keyboard selection failed");
  await page.keyboard.press("Home");
  if (await activeGenericTab().getAttribute("data-trading-ledger-tab") !== "orders" || !await genericTabs.nth(0).evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger tab Home keyboard selection failed");
  await page.keyboard.press("ArrowRight");
  if (await activeGenericTab().getAttribute("data-trading-ledger-tab") !== "fills" || !await genericTabs.nth(1).evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger tab ArrowRight keyboard selection failed");
  await page.keyboard.press("ArrowLeft");
  if (await activeGenericTab().getAttribute("data-trading-ledger-tab") !== "orders" || !await genericTabs.nth(0).evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger tab ArrowLeft keyboard selection failed");
  await assertHeaders("orders", ["订单号", "状态", "方向", "数量", "成交", "价格"]);
  await assertHeaders("fills", ["成交号", "时间", "方向", "数量", "价格"]);
  await assertHeaders("positions", ["方向", "数量", "均价", "浮盈"]);
  await assertHeaders("account", ["账户", "时间", "权益", "可用", "保证金", "已实现净盈亏"]);
  await assertHeaders("orders", ["订单号", "状态", "方向", "数量", "成交", "价格"]);
  const firstOrder = genericLedger.locator('[data-trading-ledger-row="orders-0"]');
  const secondOrder = genericLedger.locator('[data-trading-ledger-row="orders-1"]');
  await secondOrder.click();
  if (await secondOrder.getAttribute("aria-selected") !== "true") throw new Error("packed generic ledger click row selection failed");
  await secondOrder.focus();
  await page.keyboard.press("Home");
  if (await firstOrder.getAttribute("aria-selected") !== "true" || !await firstOrder.evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger row Home keyboard selection failed");
  await page.keyboard.press("ArrowDown");
  if (await secondOrder.getAttribute("aria-selected") !== "true" || !await secondOrder.evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger row ArrowDown keyboard selection failed");
  await page.keyboard.press("ArrowUp");
  if (await firstOrder.getAttribute("aria-selected") !== "true" || !await firstOrder.evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger row ArrowUp keyboard selection failed");
  await page.keyboard.press("End");
  if (await secondOrder.getAttribute("aria-selected") !== "true" || !await secondOrder.evaluate((element) => element === document.activeElement)) throw new Error("packed generic ledger row End keyboard selection failed");
} finally {
  await browser?.close();
  await server.close();
}
`);
  run("node", ["probe.mjs"], { cwd: consumerRoot });
  console.log(`Verified chartx2 packed browser consumer: ${tarballPath}`);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
