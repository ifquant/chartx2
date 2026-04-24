# Workbench Workspace Transfer V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementation task should be a small, verifiable slice with review before merge.

## Goal

Land the next executable `Workstation UX And Command Surface` slice after the
command palette baseline.

This slice makes three adjacent workstation capabilities real without opening a
new architectural branch:

- focused workspace tabs
- local layout import/export
- thin status/error surface for workstation actions

The target outcome is:

- the public workbench contract exposes focused workspace tabs and active
  sidebar focus
- the demo controller owns workspace focus policy instead of the Svelte page
- layout export downloads a JSON snapshot using the existing
  `WorkbenchLayoutState` contract
- layout import validates and restores that same snapshot contract
- success and failure states are visible through a thin status notice surface
- browser coverage proves focus-tab routing plus export/import restore

Out of scope for this slice:

- fuzzy command search
- cloud workspace sync
- multi-document workspace tabs
- layout merge/conflict resolution
- remote import/export providers
- import/export for alerts, watchlists, or full workbench sessions

## Architecture

This slice should keep the workstation boundary tight:

- `src/lib/chartx/public/workbench.ts` carries the thin shell models
- `src/lib/chartx/public/workbench-layout.ts` remains the schema authority for
  imported/exported layout snapshots
- `src/lib/demo/chartx-demo.ts` owns workspace focus, status notices, and
  layout import/export behavior
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` renders tabs, buttons,
  and status only from public/controller props
- `src/routes/+page.svelte` handles browser file download/upload only

Key design rule:

- **file I/O lives in the page shell, but snapshot validation and restore
  policy stay in the controller**

## Task 1: Public Workspace And Transfer Shell Models

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Add thin public models for:
  - workspace tabs
  - active right-sidebar focus
  - layout import/export button state
  - status notice
- Preserve default compatibility for existing workbench callers.
- Keep the models focused on projection state, not controller methods.
- Add focused unit coverage proving the defaults and explicit inputs survive
  round-trip through `createChartWorkbenchModel(...)`.

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Workspace Focus And Layout Transfer Runtime

Files:

- Modify `src/lib/demo/chartx-demo.ts`

Implementation requirements:

- Add demo-owned workspace focus state and publish it through the new public
  workbench model.
- Reuse the existing `WorkbenchLayoutState.panels` contract instead of creating
  a second import/export schema.
- Add `setWorkspaceTab(...)`, `exportLayout()`, and `importLayout(raw)` to the
  demo controller.
- Keep replay as a guardrail:
  - save/restore/import/export should not run while replay is active
- Route import restore through the existing symbol-open and chart-state apply
  path instead of inventing a second restore flow.
- Publish thin success/warning/error notices through the public shell model.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: UI Shell, Browser File I/O, And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `src/routes/+page.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render workspace focus tabs, import/export buttons, and status notice in the
  workbench shell.
- Keep `+page.svelte` thin:
  - trigger hidden file input for import
  - create browser download for export
  - forward raw import/export actions to the controller
- Add stable selectors for:
  - workspace tabs
  - active focused sidebar panel
  - bottom-tab focus
  - import/export triggers
  - status notice
- Browser coverage must prove:
  - workspace tabs move focus
  - export downloads a layout snapshot
  - import restores exported symbol/focus state
  - command/layout/replay/screener coverage remains green

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workspace tabs|layout import/export|command|screener|workbench replays|layout"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0286-add-workbench-workspace-transfer-v0.md`

Documentation requirements:

- Update `Layer 2: Workstation Parity > Workstation UX And Command Surface`.
- Explain that workspace tabs are focus tabs first, not a full
  multi-document/workspace system.
- Explain that import/export reuses `WorkbenchLayoutState` rather than a second
  ad-hoc JSON schema.
- Explain why `+page.svelte` only owns browser file I/O while the controller
  validates and restores layout state.

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workspace tabs|layout import/export|command|screener|workbench replays|layout"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

Merge back to `main` only after the focused browser suite, unit contract suite,
and build are all green.
