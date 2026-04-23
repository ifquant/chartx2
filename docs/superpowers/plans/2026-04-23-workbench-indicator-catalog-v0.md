# Workbench Indicator Catalog V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first user-facing indicator catalog to the Workbench so users can add existing engine-backed overlay, compare, and moving-average studies through a typed catalog and palette.

**Architecture:** Add a public workstation-level catalog contract that describes available indicators without owning chart runtime. Extend the workbench controller with `addIndicatorFromCatalog(id)` that dispatches catalog entries to existing `PhaseOneChartApi` study methods. Wire Svelte as a shell that renders the catalog and forwards clicks. Do not start scripting, custom formula parsing, or new engine study APIs in this slice.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, Vitest, Playwright, existing `PhaseOneChartApi` study methods.

---

## Scope Check

This implements only the first executable slice of `Indicator Catalog V0` from `docs/tradingview-alignment-plan.md`.

Included:

- typed `WorkbenchIndicatorCatalogEntry` contract
- default workbench indicator catalog
- controller dispatcher for catalog entries
- user-facing indicator palette in Workbench
- focused unit and browser coverage for MA / compare / overlay catalog entries

Not included:

- Pine-like scripting
- user-defined formula runtime
- RSI / MACD / Bollinger / VWAP calculations
- indicator settings modal
- cloud indicator templates
- indicator-on-indicator routing
- object tree management

## Existing Boundaries To Reuse

Engine/public APIs already exist:

- `PhaseOneChartApi.addOverlaySeries(target?)`
- `PhaseOneChartApi.addCompareSeries(target?)`
- `PhaseOneChartApi.addMovingAverageStudy(target?)`
- `PhaseOneCompareSeriesApi.applyCompareOptions(options)`
- `PhaseOneMovingAverageStudyApi.applyStudyOptions(options)`

Current workbench behavior:

- `chartx-demo.ts` has action-driven chart mutations and can publish logs/snapshots.
- `MarketWorkbenchPanel.svelte` already renders right-sidebar mini-cards and forwards shell callbacks.
- Visual tests already cover workbench watchlist and saved-layout flows.

## File Structure

Create:

- `src/lib/chartx/public/workbench-indicators.ts`
  - catalog types
  - default catalog entries
  - lookup helper

- `tests/unit/workbench-indicators.test.ts`
  - pure catalog contract tests

Modify:

- `src/lib/chartx/public/index.ts`
  - export `workbench-indicators`

- `src/lib/demo/chartx-demo.ts`
  - expose catalog entries in `DemoSnapshot`
  - add controller `addIndicatorFromCatalog?(entryId: string): boolean`
  - dispatch catalog entries to existing chart APIs
  - log added indicators and publish snapshots

- `src/lib/demo/components/MarketWorkbenchPanel.svelte`
  - render indicator catalog palette
  - forward add-indicator callback

- `src/routes/+page.svelte`
  - forward indicator add callback to controller

- `tests/visual/phase-one-harness.spec.ts`
  - browser test for adding MA, compare, and overlay from the catalog

- `docs/tradingview-alignment-plan.md`
  - implementation note under `Indicator Catalog V0`

- `tutorials/commit/0280-add-workbench-indicator-catalog-v0.md`
  - tutorial for this slice

## Task 1: Public Indicator Catalog Contract

**Files:**

- Create: `src/lib/chartx/public/workbench-indicators.ts`
- Modify: `src/lib/chartx/public/index.ts`
- Create: `tests/unit/workbench-indicators.test.ts`

- [ ] **Step 1: Add catalog types**

Create a public module:

```ts
export type WorkbenchIndicatorCatalogEntryId =
  | "moving-average"
  | "compare"
  | "overlay-line";

export type WorkbenchIndicatorPlacement = "overlay" | "separate-pane";

export interface WorkbenchIndicatorCatalogEntry {
  id: WorkbenchIndicatorCatalogEntryId;
  label: string;
  shortLabel: string;
  description: string;
  family: "trend" | "comparison" | "overlay";
  placement: WorkbenchIndicatorPlacement;
  engineKind: "moving-average" | "compare" | "overlay";
  enabled: boolean;
  unavailableReason?: string;
}
```

Export:

```ts
export const WORKBENCH_INDICATOR_CATALOG: readonly WorkbenchIndicatorCatalogEntry[];
export function getWorkbenchIndicatorCatalogEntry(id: string): WorkbenchIndicatorCatalogEntry | null;
```

Required default entries:

- `moving-average`: label `Moving Average`, short label `MA`, family `trend`, placement `separate-pane`, engine kind `moving-average`, enabled.
- `compare`: label `Compare`, short label `Compare`, family `comparison`, placement `overlay`, engine kind `compare`, enabled.
- `overlay-line`: label `Overlay Line`, short label `Overlay`, family `overlay`, placement `overlay`, engine kind `overlay`, enabled.

- [ ] **Step 2: Export module**

Add to `src/lib/chartx/public/index.ts`:

```ts
export * from "./workbench-indicators";
```

- [ ] **Step 3: Add focused tests**

Create `tests/unit/workbench-indicators.test.ts` covering:

- catalog contains the three enabled entries in deterministic order
- lookup returns an entry by id
- lookup returns `null` for unknown ids
- each entry has label, short label, description, family, placement, engine kind, enabled flag

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-indicators.test.ts
git diff --check
```

Commit:

```bash
git add src/lib/chartx/public/index.ts src/lib/chartx/public/workbench-indicators.ts tests/unit/workbench-indicators.test.ts
git commit -m "feat(chartx2-workbench): add indicator catalog contract" \
  -m "Introduce the public Workbench indicator catalog boundary so the workstation can list engine-backed studies without starting a script runtime." \
  -m "Changes:
- add typed Workbench indicator catalog entries for moving average, compare, and overlay line
- add deterministic catalog lookup and export it from the public chartx entrypoint
- cover catalog order, lookup, and entry metadata with focused unit tests" \
  -m "Verification:
- pnpm test:unit -- tests/unit/workbench-indicators.test.ts (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no workbench controller dispatch yet
- no scripting, RSI, MACD, Bollinger, VWAP, or settings UI"
```

## Task 2: Controller Indicator Dispatcher

**Files:**

- Modify: `src/lib/demo/chartx-demo.ts`
- Modify: `tests/unit/workbench-indicators.test.ts`

- [ ] **Step 1: Extend demo snapshot/controller types**

In `DemoSnapshot`, add:

```ts
indicatorCatalog?: readonly WorkbenchIndicatorCatalogEntry[];
activeIndicators?: readonly {
  id: string;
  label: string;
  kind: WorkbenchIndicatorCatalogEntry["engineKind"];
  placement: WorkbenchIndicatorCatalogEntry["placement"];
}[];
```

In `DemoController`, add:

```ts
addIndicatorFromCatalog?(entryId: string): boolean;
```

- [ ] **Step 2: Add controller state and dispatch**

In `mountWorkbenchDemo`:

- import `WORKBENCH_INDICATOR_CATALOG`, `getWorkbenchIndicatorCatalogEntry`, and type `WorkbenchIndicatorCatalogEntry`
- add `activeIndicators` state
- include `indicatorCatalog: WORKBENCH_INDICATOR_CATALOG` and `activeIndicators` in `publishSnapshot()`
- implement `addIndicatorFromCatalog(entryId)`

Dispatch rules:

- Unknown entry: log `failed to add indicator ${entryId}: unknown catalog entry`, publish snapshot, return false.
- Disabled entry: log `failed to add indicator ${entry.label}: ${entry.unavailableReason ?? "disabled"}`, publish snapshot, return false.
- `moving-average`: create a separate pane, call `chart.addMovingAverageStudy({ pane })`, apply `{ length: 20 }`, push active indicator label `Moving Average`, log `added indicator Moving Average`, publish snapshot, return true.
- `compare`: call `chart.addCompareSeries()` on the primary pane, apply compare options with `requestedSymbol: activeSymbol`, `requestedResolution: activeTimeframe`, `inputContextMode: "chart-context"`, and `affectMainScale: false`, push active indicator label `Compare`, log `added indicator Compare`, publish snapshot, return true.
- `overlay-line`: call `chart.addOverlaySeries()` on the primary pane, apply a visible line style, set data from `activeBarsPayload.line`, push active indicator label `Overlay Line`, log `added indicator Overlay Line`, publish snapshot, return true.

Do not remove existing `toggle-study` behavior in this task.

- [ ] **Step 3: Add pure catalog-to-dispatch expectation tests**

Extend `tests/unit/workbench-indicators.test.ts` with assertions that every default catalog entry maps to an expected engine kind and placement. Controller browser behavior is covered in Task 3.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-indicators.test.ts
git diff --check
```

Commit:

```bash
git add src/lib/demo/chartx-demo.ts tests/unit/workbench-indicators.test.ts
git commit -m "feat(chartx2-workbench): dispatch indicator catalog entries" \
  -m "Route the first Workbench indicator catalog entries through existing PhaseOneChartApi study methods while keeping study creation policy inside the controller." \
  -m "Changes:
- expose the indicator catalog and active indicator list through DemoSnapshot
- add controller dispatch for moving average, compare, and overlay line entries
- log successful and rejected indicator additions through the existing workbench event log" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-indicators.test.ts (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no Svelte indicator palette yet
- no indicator settings modal or custom script runtime"
```

## Task 3: Svelte Palette And Browser Flow

**Files:**

- Modify: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Add panel props and palette**

In `MarketWorkbenchPanel.svelte`, add:

```ts
export let onAddIndicator: (entryId: string) => void;
```

Render a new right-sidebar mini-card titled `Indicators` using `snapshot.indicatorCatalog ?? []`.

For each entry render a button with:

- entry label
- short label or family as supporting text
- disabled state when `!entry.enabled`
- click handler `onAddIndicator(entry.id)`

Also render active indicators from `snapshot.activeIndicators ?? []` with label and placement.

- [ ] **Step 2: Wire route shell**

In `src/routes/+page.svelte`, add:

```ts
function addWorkbenchIndicator(entryId: string): void {
  const added = workbenchController?.addIndicatorFromCatalog?.(entryId);
  if (added) {
    workbenchActions = workbenchController?.actions() ?? [];
  }
}
```

Pass `onAddIndicator={addWorkbenchIndicator}` to `MarketWorkbenchPanel`.

- [ ] **Step 3: Add browser test**

Add a Playwright test:

```ts
test("workbench adds indicators from the catalog", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  const indicators = workbench.locator(".indicator-card");

  await expect(indicators).toContainText("Moving Average");
  await indicators.getByRole("button", { name: /Moving Average/ }).click();
  await expect(workbench).toContainText("added indicator Moving Average");
  await expect(indicators).toContainText("Moving Average");

  await indicators.getByRole("button", { name: /Compare/ }).click();
  await expect(workbench).toContainText("added indicator Compare");

  await indicators.getByRole("button", { name: /Overlay Line/ }).click();
  await expect(workbench).toContainText("added indicator Overlay Line");
});
```

Use selectors that match the final markup and avoid relying on visual screenshots.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm check
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "adds indicators"
git diff --check
```

Commit:

```bash
git add src/lib/demo/components/MarketWorkbenchPanel.svelte src/routes/+page.svelte tests/visual/phase-one-harness.spec.ts
git commit -m "feat(chartx2-workbench): wire indicator catalog palette" \
  -m "Expose the first Workbench indicator catalog in the right sidebar and forward palette selections to the controller-owned study dispatcher." \
  -m "Changes:
- render enabled catalog entries in a Workbench indicator palette
- forward add-indicator clicks from the Svelte shell to the controller
- add browser coverage for adding moving average, compare, and overlay line entries" \
  -m "Verification:
- pnpm check (PASS)
- pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g \"adds indicators\" (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no indicator settings modal
- no RSI, MACD, Bollinger, VWAP, or custom script runtime"
```

## Task 4: Docs, Tutorial, Final Verification

**Files:**

- Modify: `docs/tradingview-alignment-plan.md`
- Create: `tutorials/commit/0280-add-workbench-indicator-catalog-v0.md`

- [ ] **Step 1: Update roadmap**

Under `### 4. Indicator Catalog V0`, add an implementation note:

```md
Implementation note:

- The first indicator-catalog slice exposes existing engine-backed study paths
  through a typed Workbench catalog and palette.
- Initial entries are Moving Average, Compare, and Overlay Line. Broader
  indicators such as RSI, MACD, Bollinger, and VWAP remain future catalog
  entries, not page-local branches.
- The Svelte page remains a shell; indicator creation policy is owned by the
  Workbench controller and existing `PhaseOneChartApi` study methods.
```

- [ ] **Step 2: Add tutorial**

Create `tutorials/commit/0280-add-workbench-indicator-catalog-v0.md` explaining:

- why catalog contract comes before scripting
- how entries map to existing engine APIs
- why Svelte only forwards clicks
- what remains out of scope

- [ ] **Step 3: Final verification**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "adds indicators"
pnpm build
git diff --check
git status --short
```

- [ ] **Step 4: Commit docs**

Commit:

```bash
git add docs/tradingview-alignment-plan.md tutorials/commit/0280-add-workbench-indicator-catalog-v0.md
git commit -m "docs(chartx2-workbench): document indicator catalog v0" \
  -m "Record the first indicator catalog slice so the TradingView alignment roadmap and tutorial match the new Workbench study-entry boundary." \
  -m "Changes:
- add an Indicator Catalog V0 implementation note to the alignment plan
- add the beginner-facing tutorial for the catalog and controller dispatch slice" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts (PASS)
- pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g \"adds indicators\" (PASS)
- pnpm build (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no script runtime
- no RSI, MACD, Bollinger, VWAP, or indicator settings UI"
```

## Final Review And Merge

After Task 4, dispatch a final reviewer for `main..HEAD`.

Merge only if final reviewer returns `APPROVED` and this passes:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "adds indicators"
pnpm build
git diff --check main..HEAD
git status --short
```
