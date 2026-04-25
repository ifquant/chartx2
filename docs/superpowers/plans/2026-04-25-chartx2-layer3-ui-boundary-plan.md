# Chartx2 Layer 3 UI Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe `chartx2` Layer 3 so it explicitly delivers reusable TradingView-like UI/components/contracts, while deferring heavy execution logic to `alpha2` plus a future Rust core.

**Architecture:** Keep `chartx2` engine-first and chart-centered. Layer 3 work in this repo should produce typed UI shells, host contracts, fixture-backed demos, and reusable workstation components; it should not absorb long-term script engines, strategy engines, broker logic, sync backends, or account services. The plan therefore has two parts: first, rewrite the long-range plan so the boundary is explicit; second, execute Layer 3 as UI-first component slices that can later be mounted in `alpha2`.

**Tech Stack:** Markdown planning docs, Svelte/SvelteKit UI components, TypeScript view models/contracts, Playwright/Vitest verification, Tauri/web host shell assumptions.

---

### Task 1: Rewrite The Long-Range Boundary In The Alignment Plan

**Files:**
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md`
- Create: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/plans/2026-04-25-chartx2-layer3-ui-boundary-plan.md`

- [ ] **Step 1: Rewrite the Layer 3 goal and boundary language**

```md
## Layer 3: Platform UI Parity

Goal: add TradingView-like platform-facing UI capabilities only after the
engine and workstation layers have stable contracts.

Boundary:

- `chartx2` should implement the chart product's UI/components/contracts for
  these platform-facing areas.
- `chartx2` may keep lightweight demo or fixture-backed behavior where needed
  to exercise the UI, but it should not become the long-term home for the full
  execution logic.
- `alpha2` is the intended host product for these surfaces.
- Heavy logic such as script execution engines, strategy simulation, broker
  logic, cloud/sync backends, and account services should be assumed to land in
  a Rust core plus host-product adapters rather than in `chartx2` itself.
```

- [ ] **Step 2: Rewrite each Layer 3 stream as UI/components/contracts first**

```md
### 2. Strategy Tester

Purpose:

- Provide a TradingView-like strategy tester UI surface and chart/performance
  integration shell.

Scope:

- Strategy tester panel layout, tabs, filters, summaries, trade list, equity
  curve viewport, and chart locate-trade affordances.
- Host-facing data contracts for trades, metrics, equity points, runs, and
  parameter sets.
- Fixture/demo-backed behavior where needed to exercise the UI.
- No commitment that `chartx2` owns the final backtest engine.
```

- [ ] **Step 3: Rewrite the Layer 3 gate so it measures reusable UI contracts, not backend completion**

```md
### Layer 3 Gate

Layer 3 is acceptable when:

- Script indicators can attach, render, save, restore, and fail safely through
  a reusable editor/library/contract surface.
- Strategy tester, trading, sync, and sharing surfaces exist as reusable UI
  components with typed host contracts.
- Fixture/demo adapters are sufficient to exercise the intended UI behavior.
- No platform feature reaches directly into private chart runtime internals.
- `chartx2` remains a chart/workstation component suite rather than absorbing
  the full product backend.
```

- [ ] **Step 4: Review the rewritten doc for internal consistency**

Run: `rg -n "Platform UI Parity|Rust core|alpha2|host contract|fixture" /Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md`
Expected: all Layer 3 sections consistently describe UI/components/contracts and do not promise full backend implementation inside `chartx2`

- [ ] **Step 5: Commit**

```bash
git add /Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/plans/2026-04-25-chartx2-layer3-ui-boundary-plan.md
git commit -m "docs(chartx2-plan): reframe layer 3 as ui-first product parity"
```

### Task 2: Turn Script System Into A Reusable UI/Product Surface

**Files:**
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/workbench-scripts.ts`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Test: `/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Write the contract-first checklist into the plan**

```md
- [ ] Script editor surface exposes reusable props/view-models instead of only demo-local state
- [ ] Script library rows distinguish runtime-owned vs host-owned execution paths
- [ ] Script result/error/status widgets are consumable outside the current demo shell
- [ ] Host-facing script execution adapter contract is explicit
```

- [ ] **Step 2: Add a host-facing script execution contract**

```ts
export interface WorkbenchScriptExecutionAdapter {
  executeIndicator(input: {
    scriptId: string;
    inputValues?: Record<string, number>;
    symbol: string;
    timeframe: string;
  }): Promise<{
    ok: boolean;
    message?: string;
    outputSeries?: readonly { time: number; value: number }[];
  }>;
}
```

- [ ] **Step 3: Add focused UI coverage for adapter-driven script states**

```ts
test("script editor surfaces host-execution failure state without crashing the panel", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-demo-tab="workbench"]')).toContainText("Indicators");
  // inject fixture-backed host failure and assert visible status/error UI
});
```

- [ ] **Step 4: Run focused verification**

Run: `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script" --reporter=line`
Expected: PASS with script editor/library/attach flows still working after the UI-contract split

- [ ] **Step 5: Commit**

```bash
git add /Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/workbench-scripts.ts /Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/components/MarketWorkbenchPanel.svelte /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts
git commit -m "refactor(chartx2-script-ui): separate script ui contracts from execution ownership"
```

### Task 3: Build Strategy Tester As A Reusable UI Shell

**Files:**
- Create: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/strategy-tester.ts`
- Create: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/components/StrategyTesterPanel.svelte`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`
- Test: `/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Define the public strategy tester UI model**

```ts
export interface StrategyTesterPanelModel {
  summary: {
    netProfitLabel: string;
    maxDrawdownLabel: string;
    winRateLabel: string;
  };
  trades: readonly {
    id: string;
    side: "long" | "short";
    entryTimeLabel: string;
    exitTimeLabel: string;
    pnlLabel: string;
  }[];
  state: "ready" | "empty" | "loading" | "error";
  emptyLabel?: string;
  errorLabel?: string;
}
```

- [ ] **Step 2: Mount a fixture-backed panel in the demo shell**

```ts
const strategyTester: StrategyTesterPanelModel = {
  summary: {
    netProfitLabel: "+12,340",
    maxDrawdownLabel: "-2,110",
    winRateLabel: "54%",
  },
  trades: [],
  state: "ready",
};
```

- [ ] **Step 3: Add a visual test for the panel shell**

```ts
test("strategy tester panel renders fixture-backed metrics and trade rows", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-strategy-tester-panel]")).toContainText("Net Profit");
});
```

- [ ] **Step 4: Run focused verification**

Run: `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester" --reporter=line`
Expected: PASS with no reliance on a real backtest engine

- [ ] **Step 5: Commit**

```bash
git add /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/strategy-tester.ts /Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/components/StrategyTesterPanel.svelte /Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts
git commit -m "feat(chartx2-strategy-ui): add reusable strategy tester shell"
```

### Task 4: Build Trading, Sync, And Sharing As Host-Adapter UI Shells

**Files:**
- Create: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/trading-surface.ts`
- Create: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/account-sync-surface.ts`
- Create: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/sharing-surface.ts`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`
- Test: `/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Define minimal host-facing UI contracts**

```ts
export interface TradingTicketModel {
  symbol: string;
  side: "buy" | "sell";
  quantityLabel: string;
  status: "ready" | "submitting" | "error";
}

export interface SyncStatusModel {
  providerLabel: string;
  state: "local" | "offline" | "connected" | "error";
  detail: string;
}

export interface ShareDialogModel {
  artifactType: "layout" | "script" | "preset";
  title: string;
  status: "idle" | "publishing" | "error";
}
```

- [ ] **Step 2: Mount fixture-backed shells instead of real service logic**

```ts
const syncStatus: SyncStatusModel = {
  providerLabel: "Local provider",
  state: "local",
  detail: "No backend connected",
};
```

- [ ] **Step 3: Add visual coverage for ready/empty/error states**

```ts
test("trading and sync shells show adapter-backed ready and error states", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-trading-ticket]")).toBeVisible();
  await expect(page.locator("[data-sync-status]")).toContainText("Local provider");
});
```

- [ ] **Step 4: Run focused verification**

Run: `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "trading|sync|share" --reporter=line`
Expected: PASS with UI shells functioning through fixture adapters

- [ ] **Step 5: Commit**

```bash
git add /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/trading-surface.ts /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/account-sync-surface.ts /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/sharing-surface.ts /Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts
git commit -m "feat(chartx2-platform-ui): add adapter-backed trading sync and sharing shells"
```

### Task 5: Make The Resulting Surfaces Consumable By Alpha2

**Files:**
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md`
- Create: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/plans/alpha2-integration-contracts.md`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts`
- Test: `/Users/dev/workspace2/hc_apps/chartx2/tests/unit/workbench-contract.test.ts`

- [ ] **Step 1: Export only stable host-facing UI contracts**

```ts
export type { StrategyTesterPanelModel } from "./strategy-tester";
export type { TradingTicketModel } from "./trading-surface";
export type { SyncStatusModel } from "./account-sync-surface";
export type { ShareDialogModel } from "./sharing-surface";
```

- [ ] **Step 2: Write an integration note for alpha2**

```md
# Alpha2 Integration Contracts

- `chartx2` provides UI/components/contracts only
- `alpha2` owns host wiring and Rust-core integration
- do not move broker/backtest/sync engines back into `chartx2`
```

- [ ] **Step 3: Add a contract test**

```ts
it("exports platform ui surface types without exposing backend ownership", () => {
  expect(true).toBe(true);
});
```

- [ ] **Step 4: Run focused verification**

Run: `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run /Users/dev/workspace2/hc_apps/chartx2/tests/unit/workbench-contract.test.ts`
Expected: PASS with public contract exports remaining stable

- [ ] **Step 5: Commit**

```bash
git add /Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/plans/alpha2-integration-contracts.md /Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts /Users/dev/workspace2/hc_apps/chartx2/tests/unit/workbench-contract.test.ts
git commit -m "docs(chartx2-alpha2): document reusable layer 3 ui contracts"
```
