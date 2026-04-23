# Workbench Saved Layout V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local saved-layout v0 so the workbench can save, restore, and reset the active symbol plus chart layout state.

**Architecture:** Add a public versioned workbench layout state module with a localStorage provider. Extend the demo controller with save/restore/reset methods that keep symbol loading behind `WorkbenchHostAdapter` and chart state behind `PhaseOneChartApi`. Wire Svelte as shell forwarding only; persistence policy lives in the public provider and controller.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, Vitest, Playwright, existing `PhaseOneChartApi` state snapshot API.

---

## Scope Check

This implements only `Saved Layout V0` from `docs/tradingview-alignment-plan.md`.

Included:

- versioned `WorkbenchLayoutStateV1`
- localStorage-backed `WorkbenchLayoutPersistenceProvider`
- controller save/restore/reset methods
- UI buttons for Save, Restore, Reset
- focused unit and browser coverage

Not included:

- cloud sync
- multiple named layouts
- import/export files
- multi-chart layout restore
- indicator catalog
- alerts persistence

## File Structure

Create:

- `src/lib/chartx/public/workbench-layout.ts`
  - versioned state types
  - validation/normalization helpers
  - localStorage provider factory

- `tests/unit/workbench-layout.test.ts`
  - pure tests for layout state and localStorage provider

Modify:

- `src/lib/chartx/public/index.ts`
  - export `workbench-layout`

- `src/lib/demo/chartx-demo.ts`
  - add controller `saveLayout`, `restoreLayout`, `resetLayout`
  - save active symbol/timeframe/chart type/chart state
  - restore through host adapter and apply chart state

- `src/lib/demo/components/MarketWorkbenchPanel.svelte`
  - add Save / Restore / Reset buttons
  - forward callbacks from parent

- `src/routes/+page.svelte`
  - create localStorage provider in browser
  - forward save/restore/reset calls to controller

- `tests/visual/phase-one-harness.spec.ts`
  - browser test for save SPX, switch back, restore SPX

- `docs/tradingview-alignment-plan.md`
  - implementation note under Saved Layout V0

- `tutorials/commit/0279-add-workbench-saved-layout-v0.md`
  - tutorial for this slice

## Task 1: Public Layout State And Local Provider

**Files:**

- Create: `src/lib/chartx/public/workbench-layout.ts`
- Modify: `src/lib/chartx/public/index.ts`
- Create: `tests/unit/workbench-layout.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/workbench-layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createLocalStorageWorkbenchLayoutProvider,
  createWorkbenchLayoutState,
  isWorkbenchLayoutState,
} from "../../src/lib/chartx/public/workbench-layout";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("workbench layout state", () => {
  it("creates a versioned layout state for the active chart", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
    });

    expect(state).toEqual({
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    });
    expect(isWorkbenchLayoutState(state)).toBe(true);
  });

  it("rejects invalid layout payloads", () => {
    expect(isWorkbenchLayoutState(null)).toBe(false);
    expect(isWorkbenchLayoutState({ kind: "workbench-layout", version: 2 })).toBe(false);
    expect(isWorkbenchLayoutState({
      kind: "workbench-layout",
      version: 1,
      activeSymbol: "",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
      panels: {
        rightSidebar: "watchlist",
        bottomTab: "time-presets",
      },
    })).toBe(false);
  });

  it("saves, loads, and clears layout state from localStorage", async () => {
    const storage = createMemoryStorage();
    const provider = createLocalStorageWorkbenchLayoutProvider(storage, "chartx2:test-layout");
    const state = createWorkbenchLayoutState({
      activeSymbol: "NDX",
      activeTimeframe: "1D",
      chartType: "renko",
      chartState: null,
    });

    await provider.saveWorkbenchLayout(state);
    await expect(provider.loadWorkbenchLayout()).resolves.toEqual(state);

    await provider.clearWorkbenchLayout();
    await expect(provider.loadWorkbenchLayout()).resolves.toBeNull();
  });

  it("returns null for invalid persisted JSON", async () => {
    const storage = createMemoryStorage();
    storage.setItem("chartx2:test-layout", "{bad json");
    const provider = createLocalStorageWorkbenchLayoutProvider(storage, "chartx2:test-layout");

    await expect(provider.loadWorkbenchLayout()).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-layout.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add layout state module**

Create `src/lib/chartx/public/workbench-layout.ts`:

```ts
import type { PhaseOneChartStateSnapshot, PhaseOneMainChartType } from "./market";
import type { BottomPanelTabId } from "./workbench";

export type WorkbenchLayoutRightSidebarPanel = "watchlist" | "alerts" | "object-tree" | "screener";

export interface WorkbenchLayoutStateV1 {
  kind: "workbench-layout";
  version: 1;
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  panels: {
    rightSidebar: WorkbenchLayoutRightSidebarPanel;
    bottomTab: BottomPanelTabId;
  };
}

export type WorkbenchLayoutState = WorkbenchLayoutStateV1;

export interface WorkbenchLayoutStateInput {
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  rightSidebar?: WorkbenchLayoutRightSidebarPanel;
  bottomTab?: BottomPanelTabId;
}

export interface WorkbenchLayoutPersistenceProvider {
  loadWorkbenchLayout(): Promise<WorkbenchLayoutState | null>;
  saveWorkbenchLayout(state: WorkbenchLayoutState): Promise<void>;
  clearWorkbenchLayout(): Promise<void>;
}

export function createWorkbenchLayoutState(
  input: WorkbenchLayoutStateInput,
): WorkbenchLayoutStateV1 {
  return {
    kind: "workbench-layout",
    version: 1,
    activeSymbol: input.activeSymbol,
    activeTimeframe: input.activeTimeframe,
    chartType: input.chartType,
    chartState: input.chartState,
    panels: {
      rightSidebar: input.rightSidebar ?? "watchlist",
      bottomTab: input.bottomTab ?? "time-presets",
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isWorkbenchLayoutState(value: unknown): value is WorkbenchLayoutState {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind !== "workbench-layout" || value.version !== 1) {
    return false;
  }
  if (typeof value.activeSymbol !== "string" || value.activeSymbol.trim().length === 0) {
    return false;
  }
  if (typeof value.activeTimeframe !== "string" || value.activeTimeframe.trim().length === 0) {
    return false;
  }
  if (typeof value.chartType !== "string") {
    return false;
  }
  if (!(value.chartState === null || isRecord(value.chartState))) {
    return false;
  }
  if (!isRecord(value.panels)) {
    return false;
  }
  if (typeof value.panels.rightSidebar !== "string" || typeof value.panels.bottomTab !== "string") {
    return false;
  }
  return true;
}

export function createLocalStorageWorkbenchLayoutProvider(
  storage: Storage,
  key = "chartx2:workbench-layout:v1",
): WorkbenchLayoutPersistenceProvider {
  return {
    async loadWorkbenchLayout() {
      const raw = storage.getItem(key);
      if (raw === null) {
        return null;
      }
      try {
        const parsed: unknown = JSON.parse(raw);
        return isWorkbenchLayoutState(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    async saveWorkbenchLayout(state) {
      storage.setItem(key, JSON.stringify(state));
    },
    async clearWorkbenchLayout() {
      storage.removeItem(key);
    },
  };
}
```

- [ ] **Step 4: Export module**

Modify `src/lib/chartx/public/index.ts`:

```ts
export * from "./market";
export * from "./performance";
export * from "./workbench";
export * from "./workbench-host";
export * from "./workbench-layout";
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-layout.test.ts
git diff --check
```

Commit:

```bash
git add src/lib/chartx/public/index.ts src/lib/chartx/public/workbench-layout.ts tests/unit/workbench-layout.test.ts
git commit -m "feat(chartx2-workbench): add saved layout state contract" \
  -m "Introduce a versioned workbench layout state and localStorage provider so persistence has a typed public boundary before controller and UI wiring." \
  -m "Changes:
- add WorkbenchLayoutState v1 with active symbol, timeframe, chart type, chart state, and panel metadata
- add localStorage-backed persistence provider with invalid-payload rejection
- export the layout state contract from the public chartx entrypoint" \
  -m "Verification:
- pnpm test:unit -- tests/unit/workbench-layout.test.ts (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no workbench controller save/restore wiring yet
- no Svelte UI persistence buttons yet"
```

## Task 2: Controller Save, Restore, Reset

**Files:**

- Modify: `src/lib/demo/chartx-demo.ts`
- Modify: `tests/unit/workbench-layout.test.ts`

- [ ] **Step 1: Add pure helper tests**

Append to `tests/unit/workbench-layout.test.ts`:

```ts
import { describe as describeController, expect as expectController, it as itController } from "vitest";

import { createWorkbenchLayoutState } from "../../src/lib/chartx/public/workbench-layout";

describeController("workbench controller layout state shape", () => {
  itController("can represent a saved SPX candlestick layout", () => {
    const state = createWorkbenchLayoutState({
      activeSymbol: "SPX",
      activeTimeframe: "1D",
      chartType: "candlestick",
      chartState: null,
    });

    expectController(state.activeSymbol).toBe("SPX");
    expectController(state.chartType).toBe("candlestick");
  });
});
```

- [ ] **Step 2: Extend controller type**

In `src/lib/demo/chartx-demo.ts`, import:

```ts
import {
  createWorkbenchLayoutState,
  type WorkbenchLayoutState,
  type WorkbenchLayoutPersistenceProvider,
} from "$lib/chartx/public/workbench-layout";
```

Extend `DemoController`:

```ts
saveLayout?(): Promise<boolean>;
restoreLayout?(): Promise<boolean>;
resetLayout?(): Promise<boolean>;
```

Extend `WorkbenchDemoOptions`:

```ts
persistenceProvider?: WorkbenchLayoutPersistenceProvider;
```

- [ ] **Step 3: Add controller layout helpers**

Inside `mountWorkbenchDemo`, after state declarations, add:

```ts
  const persistenceProvider = options.persistenceProvider;

  const currentLayoutState = (): WorkbenchLayoutState => createWorkbenchLayoutState({
    activeSymbol,
    activeTimeframe,
    chartType: mainChartType,
    chartState: chart?.getChartState() ?? null,
  });

  const applyLayoutState = async (state: WorkbenchLayoutState): Promise<boolean> => {
    const opened = await openSymbolFromSource(state.activeSymbol, "host", state.activeTimeframe);
    if (!opened) {
      return false;
    }
    mainChartType = state.chartType;
    if (state.chartState !== null && chart !== null) {
      chart.applyChartState(state.chartState);
    } else {
      rebuild();
    }
    pushLog(log, `restored layout ${state.activeSymbol}`);
    publishSnapshot();
    return true;
  };
```

If `openSymbol` currently contains all logic inline, extract a shared local helper:

```ts
  const openSymbolFromSource = async (
    symbol: string,
    source: "watchlist" | "host",
    timeframe = activeTimeframe,
  ): Promise<boolean> => {
    // move existing openSymbol body here, preserving stale/destroy guards
  };
```

Then controller `openSymbol(symbol)` should call:

```ts
return openSymbolFromSource(symbol, "watchlist");
```

- [ ] **Step 4: Add controller methods**

Inside returned controller:

```ts
    async saveLayout() {
      if (persistenceProvider === undefined) {
        pushLog(log, "failed to save layout: persistence unavailable");
        publishSnapshot();
        return false;
      }
      await persistenceProvider.saveWorkbenchLayout(currentLayoutState());
      pushLog(log, `saved layout ${activeSymbol}`);
      publishSnapshot();
      return true;
    },
    async restoreLayout() {
      if (persistenceProvider === undefined) {
        pushLog(log, "failed to restore layout: persistence unavailable");
        publishSnapshot();
        return false;
      }
      const state = await persistenceProvider.loadWorkbenchLayout();
      if (state === null) {
        pushLog(log, "failed to restore layout: no saved layout");
        publishSnapshot();
        return false;
      }
      return applyLayoutState(state);
    },
    async resetLayout() {
      await persistenceProvider?.clearWorkbenchLayout();
      await openSymbolFromSource("NDX", "host", "1D");
      pushLog(log, "reset layout");
      publishSnapshot();
      return true;
    },
```

- [ ] **Step 5: Run check and commit**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-layout.test.ts
git diff --check
```

Commit:

```bash
git add src/lib/demo/chartx-demo.ts tests/unit/workbench-layout.test.ts
git commit -m "feat(chartx2-workbench): add controller layout persistence commands" \
  -m "Let the workbench controller save, restore, and reset a versioned layout state through an injected persistence provider while keeping symbol loading behind the host adapter." \
  -m "Changes:
- add persistenceProvider support to workbench demo options
- add controller saveLayout, restoreLayout, and resetLayout commands
- restore saved layouts through host-adapter symbol open and chart state application" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-layout.test.ts (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no Svelte buttons yet
- no named layout list or cloud persistence"
```

## Task 3: Svelte Shell Buttons And Browser Flow

**Files:**

- Modify: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Add visual test**

Append to `tests/visual/phase-one-harness.spec.ts`:

```ts
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
```

- [ ] **Step 2: Add panel props and buttons**

In `MarketWorkbenchPanel.svelte` add props:

```ts
export let onSaveLayout: () => void;
export let onRestoreLayout: () => void;
export let onResetLayout: () => void;
```

Add buttons in the top toolbar after layout button:

```svelte
<button on:click={onSaveLayout}>Save layout</button>
<button on:click={onRestoreLayout}>Restore layout</button>
<button on:click={onResetLayout}>Reset layout</button>
```

- [ ] **Step 3: Wire page shell**

In `src/routes/+page.svelte`, import provider:

```ts
import { createLocalStorageWorkbenchLayoutProvider } from "$lib/chartx/public/workbench-layout";
import type { WorkbenchLayoutPersistenceProvider } from "$lib/chartx/public/workbench-layout";
```

Add state:

```ts
let workbenchPersistenceProvider: WorkbenchLayoutPersistenceProvider | undefined;
```

Inside `onMount` before mounting:

```ts
workbenchPersistenceProvider = createLocalStorageWorkbenchLayoutProvider(window.localStorage);
```

Pass provider to `mountWorkbenchDemo`:

```ts
workbenchController = mountWorkbenchDemo(workbenchCanvas, (snapshot) => {
  workbenchSnapshot = snapshot;
  workbenchTradeIntentBridge.publishSnapshot();
}, {
  persistenceProvider: workbenchPersistenceProvider,
});
```

Add shell handlers:

```ts
async function saveWorkbenchLayout(): Promise<void> {
  await workbenchController?.saveLayout?.();
}

async function restoreWorkbenchLayout(): Promise<void> {
  const restored = await workbenchController?.restoreLayout?.();
  if (restored) {
    workbenchActions = workbenchController?.actions() ?? [];
  }
}

async function resetWorkbenchLayout(): Promise<void> {
  const reset = await workbenchController?.resetLayout?.();
  if (reset) {
    workbenchActions = workbenchController?.actions() ?? [];
  }
}
```

Pass props to `MarketWorkbenchPanel`.

- [ ] **Step 4: Run focused checks and commit**

Run:

```bash
pnpm check
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "saves and restores"
git diff --check
```

Commit:

```bash
git add src/lib/demo/components/MarketWorkbenchPanel.svelte src/routes/+page.svelte tests/visual/phase-one-harness.spec.ts
git commit -m "feat(chartx2-workbench): wire local saved layout controls" \
  -m "Expose save, restore, and reset controls through the workbench shell while keeping persistence behind the public localStorage provider and controller commands." \
  -m "Changes:
- add save, restore, and reset layout buttons to the workbench toolbar
- create the localStorage layout provider in the page shell and inject it into the controller
- add browser coverage for saving SPX, resetting to NDX, and restoring SPX" \
  -m "Verification:
- pnpm check (PASS)
- pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g \"saves and restores\" (PASS)
- git diff --check (PASS)" \
  -m "Not included:
- no named layouts
- no cloud persistence or import/export"
```

## Task 4: Docs, Tutorial, Final Verification

**Files:**

- Modify: `docs/tradingview-alignment-plan.md`
- Create: `tutorials/commit/0279-add-workbench-saved-layout-v0.md`

- [ ] **Step 1: Update roadmap**

Under `### 3. Saved Layout V0`, after Acceptance, add:

```md
Implementation note:

- The first saved-layout slice should persist the active symbol, timeframe,
  chart type, and chart state through a versioned localStorage provider before
  named layouts, import/export, or cloud sync.
```

- [ ] **Step 2: Add tutorial**

Create `tutorials/commit/0279-add-workbench-saved-layout-v0.md`:

```md
# 0279: 添加 Workbench Saved Layout V0

这次给 Workbench 增加了第一版本地布局保存能力。

上一轮已经让 watchlist symbol open 走 `WorkbenchHostAdapter`。如果继续做 TradingView-like workstation，下一步必须让用户能把当前 symbol 和 chart layout 保存下来，否则 workbench 仍然只是一次性 demo 状态。

## 1. 为什么要先做本地 provider

Saved layout 以后可能接云同步，但现在不应该让云端或账号系统进入 chart engine。

所以这次只做：

- versioned layout state
- localStorage provider
- controller save / restore / reset
- UI 按钮

这样后续换成私有后端 provider 时，不需要改 chart runtime。

## 2. 这次具体改了什么

- 新增 `src/lib/chartx/public/workbench-layout.ts`，定义 `WorkbenchLayoutStateV1` 和 localStorage provider。
- `mountWorkbenchDemo` 新增 persistence provider 注入。
- workbench controller 新增 `saveLayout`、`restoreLayout`、`resetLayout`。
- Workbench toolbar 新增 Save / Restore / Reset 按钮。
- Browser test 覆盖 SPX 保存、reset 回 NDX、restore 回 SPX。

## 3. 这次没有做什么

没有实现多 named layouts。

没有实现云同步。

没有实现导入导出文件。

没有实现多图 layout restore。

## 验证

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-layout.test.ts tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "saves and restores"`
- `pnpm build`

## 未包含

- cloud persistence
- named layout manager
- import/export
- multi-chart layout persistence
```

- [ ] **Step 3: Final verification**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-layout.test.ts tests/unit/workbench-contract.test.ts
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "saves and restores"
pnpm build
git status --short
```

- [ ] **Step 4: Commit docs**

Commit:

```bash
git add docs/tradingview-alignment-plan.md tutorials/commit/0279-add-workbench-saved-layout-v0.md
git commit -m "docs(chartx2-workbench): document saved layout v0" \
  -m "Record the saved-layout slice so the TradingView alignment roadmap and tutorial match the new local persistence boundary." \
  -m "Changes:
- add a Saved Layout V0 implementation note to the alignment plan
- add the beginner-facing tutorial for the local layout persistence slice" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-layout.test.ts tests/unit/workbench-contract.test.ts (PASS)
- pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g \"saves and restores\" (PASS)
- pnpm build (PASS)" \
  -m "Not included:
- no cloud persistence
- no named layout manager"
```

## Final Review And Merge

After Task 4, dispatch a final reviewer for `main..HEAD`.

Merge only if final reviewer returns `APPROVED` and this passes:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-layout.test.ts tests/unit/workbench-contract.test.ts
pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "saves and restores"
pnpm build
git status --short
```
