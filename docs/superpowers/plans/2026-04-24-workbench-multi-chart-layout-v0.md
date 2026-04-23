# Workbench Multi-Chart Layout V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementation task must be committed and pass two-stage review before the next task.

## Goal

Land the first executable `Multi-Chart Layout V0` slice for the market workbench.

This slice does **not** try to finish full TradingView-style multi-chart behavior in one jump. It makes layout and active-host routing real in the workstation shell first, so later work can add true multi-runtime ownership, symbol-link groups, and replay/sync on top of an explicit contract.

The target outcome is:

- public workbench layout/host data is rich enough for a visible split layout shell
- the demo workbench can expose more than one chart host in the model
- one host is explicitly active, and watchlist/layout flows target that active host
- the UI renders layout slots/host cards instead of treating `layout` as hidden metadata
- browser tests prove the split layout exists and active-host routing is visible

Out of scope for this slice:

- true simultaneous chart runtime instances per slot
- crosshair sync, interval sync, or symbol-link groups
- 2x2 runtime composition
- per-host drawing/indicator/alert runtimes
- multi-host saved-layout persistence format

## Architecture

This slice should preserve the engine-first boundary:

- `src/lib/chartx/public/workbench.ts` remains the public workstation contract
- `src/lib/demo/chartx-demo.ts` remains the demo composition/controller layer
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` remains a thin renderer of the public model
- `src/routes/+page.svelte` remains a shell and should not learn layout-routing policy

The key design rule is:

- **layout state belongs to the public workbench model, not to ad-hoc Svelte branches**

## Task 1: Public Layout Host Surface

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Extend the public chart-host contract so the UI can render meaningful multi-host cards without reaching into demo-local data.
- Keep `MultiChartLayoutModel`, `ChartHostModel`, and `ChartSlotModel` as the workstation shell contract.
- Add only the fields needed to render a split layout shell and active-host status, for example:
  - host symbol label
  - host timeframe label
  - host chart-type label
  - optional host summary/status label
- Preserve existing single-layout defaults.
- Preserve existing explicit multi-chart host input behavior.
- Add/adjust unit tests so the contract covers:
  - single-host defaults
  - explicit split/grid hosts
  - active-host routing metadata

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Multi-Host Projection And Active-Host Routing

Files:

- Modify `src/lib/demo/chartx-demo.ts`
- Modify `tests/unit/workbench-layout.test.ts` only if a layout-state helper or contract must change

Implementation requirements:

- Add demo-local host records for the first visible multi-chart layout slice.
- Support at least:
  - `single`
  - `main-plus-secondary`
- Publish more than one `chartHost` in split mode, with one explicit active host.
- Add layout actions in the demo controller for switching between single and split layout.
- Add an explicit active-host route in the demo controller.
- Watchlist symbol-open must target the active host record, not a hardcoded main host.
- Save/restore/reset flows must stay correct for this slice:
  - if persistence stays single-host-only, the split-layout demo must degrade honestly instead of pretending multi-host restore already exists
  - any limitation must be explicit in logs/docs, not hidden
- Keep object tree / inspector / drawing runtime scoped to the active/live host only in this slice.
- Do not start true multi-canvas runtime composition in this task.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: Split Layout UI And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render visible layout-slot / host chrome in the workbench main shell.
- Add stable selectors for the new surface, for example:
  - `data-workbench-layout`
  - `data-workbench-layout-preset`
  - `data-chart-slot`
  - `data-chart-host`
- In split mode, render both slots and visually distinguish the active host.
- Keep the existing primary live chart canvas path intact.
- Render the secondary host as a read-only host card/shell for this slice if it is not backed by a live runtime yet.
- Add layout-switch controls to the existing toolbar/footer action surface only if they are driven by the controller.
- Browser tests must cover:
  - switching from single to split layout
  - rendering both slots/hosts
  - opening a watchlist symbol updates the active host card
  - switching active host updates the routing target for a subsequent watchlist open

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "layout"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0282-add-workbench-multi-chart-layout-v0.md`

Documentation requirements:

- Add an implementation note under `Layer 2: Workstation Parity > Multi-Chart Layout V0`.
- Be explicit that this slice makes layout and active-host routing visible, but does not yet finish true multi-runtime chart-host composition, sync groups, or multi-host persistence.
- Tutorial should explain:
  - why this slice stops at visible split layout + active host routing
  - how the public layout contract differs from runtime ownership
  - what remains for true multi-chart parity

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "layout"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

After all tasks pass their two-stage reviews, run a final branch review over the full Multi-Chart Layout V0 branch. Merge back to `main` only after the final reviewer approves and final verification is green.
