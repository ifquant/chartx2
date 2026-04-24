# Script System Next-Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** turn the remaining Layer 3 script-system work into an executable sequence that closes the Script Library management gaps first, then prepares scripted indicators to become first-class chart-state studies.

**Architecture:** keep the next two slices workbench-owned and UI/runtime-local so the current Script Library becomes safe to manage without widening engine contracts prematurely. After those management gaps are closed, add an internal scripted-study bridge that can round-trip through chart state without pretending Pine compatibility or overlay parity already exist.

**Tech Stack:** SvelteKit, TypeScript, `PhaseOneChartApi`, local workbench demo runtime, Playwright visual tests, Vitest unit tests

---

## File Structure

- [ ] `src/lib/demo/components/MarketWorkbenchPanel.svelte`
  - Continue owning Script Library row actions, edit-state guards, and workbench-local management affordances.
- [ ] `src/lib/demo/chartx-demo.ts`
  - Continue owning demo/workbench scripted-indicator runtime behavior, chart attach/detach, and layout/chart-state bridging.
- [ ] `src/routes/+page.svelte`
  - Stay a thin callback forwarder for new workbench actions.
- [ ] `src/lib/chartx/public/workbench-layout.ts`
  - Likely home for any new workbench-visible scripted study descriptor schema if a new layout-side bridge is needed.
- [ ] `src/lib/chartx/internal/views/chart-api-types.ts`
  - Reference point for chart-state study shapes before any first-class scripted-study bridge is introduced.
- [ ] `tests/visual/phase-one-harness.spec.ts`
  - Primary verification surface for Script Library and workbench behavior.
- [ ] `tests/unit/workbench-layout.test.ts`
  - Unit verification surface for any new scripted-study persistence schema.
- [ ] `docs/tradingview-alignment-plan.md`
  - Keep Layer 3 progress and deferred boundaries accurate.
- [ ] `tutorials/commit/`
  - Record each non-trivial slice with one checked-in tutorial.

## Execution Order

1. Script Library Delete Confirm V0
2. Script Library Dirty Draft Fence V0
3. Scripted Study Descriptor Bridge V0
4. Scripted Study Chart-State Restore V0
5. Scripted Study Promotion Review Pass

Tasks 1 and 2 close the remaining workbench-owned management gaps under the existing boundary. Tasks 3 and 4 are the first deliberate move toward the unchecked alignment item `Persist scripted indicators as first-class chart-state studies`. Task 5 is a review-and-stabilize pass before any Pine-compatible work is considered.

### Task 1: Script Library Delete Confirm V0

**Files:**
- Modify: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify: `tests/visual/phase-one-harness.spec.ts`
- Modify: `docs/tradingview-alignment-plan.md`
- Create: `docs/superpowers/plans/2026-04-25-script-library-delete-confirm-v0.md`
- Create: `tutorials/commit/0308-add-script-library-delete-confirm-v0.md`

- [ ] **Step 1: Write the failing visual test**

Add a focused Script Library case near the existing saved-row management tests:

```ts
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
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "delete requires an explicit confirm step" --reporter=line
```

Expected: FAIL because the current delete button removes immediately and does not render confirm/cancel controls.

- [ ] **Step 3: Implement the minimal row-level confirm state**

Add local row state in `MarketWorkbenchPanel.svelte` and gate delete through it:

```ts
let pendingCustomScriptDeleteId: string | null = null;

function requestCustomScriptDelete(scriptId: string): void {
  pendingCustomScriptDeleteId = scriptId;
}

function cancelCustomScriptDelete(scriptId: string): void {
  if (pendingCustomScriptDeleteId === scriptId) {
    pendingCustomScriptDeleteId = null;
  }
}

function confirmCustomScriptDelete(scriptId: string): void {
  const deleted = onDeleteCustomScript(scriptId);
  if (deleted) {
    pendingCustomScriptDeleteId = null;
    if (editingCustomScriptId === scriptId) {
      resetCustomScriptDraft();
    }
  }
}
```

Render either `Delete` or `Confirm delete / Cancel` for the matching row:

```svelte
{#if pendingCustomScriptDeleteId === script.id}
  <button data-custom-script-delete-confirm={script.id} on:click={() => confirmCustomScriptDelete(script.id)}>
    Confirm delete
  </button>
  <button data-custom-script-delete-cancel={script.id} on:click={() => cancelCustomScriptDelete(script.id)}>
    Cancel
  </button>
{:else}
  <button data-custom-script-delete={script.id} on:click={() => requestCustomScriptDelete(script.id)}>
    Delete
  </button>
{/if}
```

- [ ] **Step 4: Extend the test to cover cancel and confirm**

Add the rest of the assertions:

```ts
await workbench.locator('[data-custom-script-delete-cancel="custom-script-1"]').click();
await expect(workbench.locator('[data-custom-script-delete="custom-script-1"]')).toBeVisible();

await workbench.locator('[data-custom-script-delete="custom-script-1"]').click();
await workbench.locator('[data-custom-script-delete-confirm="custom-script-1"]').click();
await expect(workbench.locator('[data-custom-script="custom-script-1"]')).toHaveCount(0);
await expect(workbench).toContainText("deleted custom script Delete Confirm Spread");
```

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "delete requires an explicit confirm step" --reporter=line
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build
git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check
```

Commit:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add src/lib/demo/components/MarketWorkbenchPanel.svelte tests/visual/phase-one-harness.spec.ts docs/tradingview-alignment-plan.md docs/superpowers/plans/2026-04-25-script-library-delete-confirm-v0.md tutorials/commit/0308-add-script-library-delete-confirm-v0.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit
```

### Task 2: Script Library Dirty Draft Fence V0

**Files:**
- Modify: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify: `tests/visual/phase-one-harness.spec.ts`
- Modify: `docs/tradingview-alignment-plan.md`
- Create: `docs/superpowers/plans/2026-04-25-script-library-dirty-draft-fence-v0.md`
- Create: `tutorials/commit/0309-add-script-library-dirty-draft-fence-v0.md`

- [ ] **Step 1: Write the failing visual test**

Add a case that edits one saved script, mutates the form, then clicks `Edit` on a second script:

```ts
test("script library: switching edit targets fences unsaved draft changes", async ({ page }) => {
  await page.goto("/");
  const workbench = workbenchPanel(page);
  // save custom-script-1 and custom-script-2
  await workbench.locator('[data-custom-script-edit="custom-script-1"]').click();
  await workbench.locator('[data-custom-script-field="label"]').fill("Unsaved Label");
  await workbench.locator('[data-custom-script-edit="custom-script-2"]').click();
  await expect(workbench.locator('[data-custom-script-dirty-fence]')).toContainText("Unsaved script changes");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "switching edit targets fences unsaved draft changes" --reporter=line
```

Expected: FAIL because the current panel silently replaces the draft.

- [ ] **Step 3: Add a minimal dirty-draft fence**

Track whether the current editor diverges from its last loaded baseline:

```ts
let customScriptDraftBaseline: string | null = null;
let pendingCustomScriptLoadId: string | null = null;

function serializeCustomScriptDraftState(): string {
  return JSON.stringify({
    editingCustomScriptId,
    draft: customScriptDraft,
    defaultLength: customScriptDefaultLengthInput,
    expression: formatWorkbenchCustomScriptExpressionText(customScriptExpression),
  });
}
```

Block cross-row draft replacement until the user confirms discard, keeping the current draft intact on cancel.

- [ ] **Step 4: Add confirm/discard assertions**

Finish the test with:

```ts
await workbench.locator('[data-custom-script-dirty-discard]').click();
await expect(workbench.locator('[data-custom-script-field="label"]')).toHaveValue("Second Script");
```

Also add a cancel path to ensure the first unsaved draft remains loaded.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "switching edit targets fences unsaved draft changes" --reporter=line
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build
git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check
```

### Task 3: Scripted Study Descriptor Bridge V0

**Files:**
- Modify: `src/lib/chartx/public/workbench-layout.ts`
- Modify: `src/lib/demo/chartx-demo.ts`
- Modify: `tests/unit/workbench-layout.test.ts`
- Modify: `docs/tradingview-alignment-plan.md`
- Create: `docs/superpowers/plans/2026-04-25-scripted-study-descriptor-bridge-v0.md`
- Create: `tutorials/commit/0310-add-scripted-study-descriptor-bridge-v0.md`

- [ ] **Step 1: Write a failing unit test for a chart-state-side scripted descriptor**

Add a layout/unit test that expects a descriptor closer to chart-state studies:

```ts
it("serializes scripted study descriptors separately from raw chart panes", () => {
  const state = createWorkbenchLayoutState({
    activeSymbol: "AAPL",
    activeTimeframe: "1D",
    chartType: "candles",
    chartState: null,
    scriptedIndicators: [{
      id: "script-library:custom-script-1",
      label: "My Script",
      placement: "separate-pane",
      scriptId: "custom-script-1",
      inputValues: { length: 7 },
    }],
  });

  expect(state.scriptedIndicators?.[0]?.scriptId).toBe("custom-script-1");
});
```

- [ ] **Step 2: Run the focused unit test**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts
```

Expected: either missing shape coverage or insufficient normalization coverage for the richer descriptor path.

- [ ] **Step 3: Introduce a dedicated normalization/helper seam**

Keep the public boundary workbench-owned but make the bridge explicit:

```ts
export type WorkbenchLayoutScriptedStudyDescriptor = {
  id: string;
  label: string;
  placement: "separate-pane";
  scriptId: string;
  inputValues?: Record<string, number>;
};

export function normalizeWorkbenchLayoutScriptedStudies(
  input: readonly WorkbenchLayoutScriptedStudyDescriptor[] | undefined,
): readonly WorkbenchLayoutScriptedStudyDescriptor[] | undefined {
  // sanitize numeric inputs and preserve stable ordering
}
```

- [ ] **Step 4: Rewire demo capture/restore to use the explicit bridge**

Replace ad hoc mapping in `chartx-demo.ts` with the helper seam so later chart-state promotion does not start inside the shell.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts tests/unit/workbench-scripts.test.ts
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build
git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check
```

### Task 4: Scripted Study Chart-State Restore V0

**Files:**
- Modify: `src/lib/demo/chartx-demo.ts`
- Modify: `tests/visual/phase-one-harness.spec.ts`
- Modify: `docs/tradingview-alignment-plan.md`
- Create: `docs/superpowers/plans/2026-04-25-scripted-study-chart-state-restore-v0.md`
- Create: `tutorials/commit/0311-add-scripted-study-chart-state-restore-v0.md`

- [ ] **Step 1: Write a failing visual round-trip**

Add a case that saves a layout with a custom scripted indicator mounted, restores it, and expects the mounted scripted indicator to be rebuilt through the new descriptor bridge rather than only via generic workbench replay.

- [ ] **Step 2: Run the focused test**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "scripted studies round-trip through restore" --reporter=line
```

- [ ] **Step 3: Rebuild restore through the descriptor seam**

In `chartx-demo.ts`, route scripted restore through a single helper:

```ts
function restoreScriptedStudyDescriptors(
  descriptors: readonly WorkbenchLayoutScriptedStudyDescriptor[],
  failurePrefix: string,
): boolean {
  // resolve script definition
  // execute script with saved inputs
  // attach pane + series
  // republish activeIndicators/object tree
}
```

- [ ] **Step 4: Keep scope fenced**

Do not touch Pine parsing, overlay placement, or engine-native study ownership. This task is restore-path hardening only.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "scripted studies round-trip through restore" --reporter=line
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check
pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build
git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check
```

### Task 5: Scripted Study Promotion Review Pass

**Files:**
- Modify: `docs/tradingview-alignment-plan.md`
- Create: `docs/superpowers/plans/2026-04-25-scripted-study-promotion-review-pass.md`
- Create: `tutorials/commit/0312-add-scripted-study-promotion-review-pass.md`

- [ ] **Step 1: Audit the completed bridge tasks against the Layer 3 checklist**
- [ ] **Step 2: Record what is still not first-class**
- [ ] **Step 3: Explicitly defer Pine-compatible evaluation until chart-state ownership is stable**
- [ ] **Step 4: Run `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`**
- [ ] **Step 5: Commit the acceptance/update docs**

## Self-Review

- Spec coverage: this plan directly targets the two unchecked script-system lines that are actually adjacent and implementable now: `Richer text editor and broader script-library management beyond preset cloning` and the preparation path toward `Persist scripted indicators as first-class chart-state studies`. It still explicitly defers `Pine-compatible subset evaluation`.
- Placeholder scan: all tasks list exact files, commands, and expected behaviors. The later bridge tasks intentionally leave exact helper names scoped to the task instead of using generic placeholders like “handle persistence”.
- Type consistency: the plan keeps `scriptId`, `inputValues`, `editingCustomScriptId`, and `placement: "separate-pane"` aligned with the current codebase instead of inventing a new script-study public API up front.

## Immediate Execution Choice

This plan should be executed with **Subagent-Driven Development** in this session:

1. Fresh implementer subagent per task
2. Spec review after each task
3. Code quality review after spec compliance is green
4. Commit each task before moving to the next one
