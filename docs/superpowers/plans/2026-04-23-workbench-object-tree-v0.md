# Workbench Object Tree V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementation task must be committed and pass two-stage review before the next task.

## Goal

Add the first read-only Workbench object tree so complex chart content becomes visible outside the canvas.

Object Tree V0 is intentionally a projection surface only:

- public object-tree sidebar model
- demo object-tree projection from existing chart/workbench state
- sidebar card rendering with stable browser selectors
- tests for baseline nodes and dynamic study/drawing nodes

Do not implement select, hide/show, rename, remove, collapse, persistence, drag ordering, or multi-chart routing in this slice.

## Architecture

Object tree belongs to the workstation model, not to `chart-harness` and not to the route shell.

V0 should extend the existing public Workbench model:

- `RightSidebarModel.objectTree`
- `ObjectTreePanelModel`
- `WorkbenchObjectTreeNodeModel`

The demo controller builds object-tree nodes from data it already has:

- active symbol/timeframe/chart type
- pane snapshot
- `chart.getChartState()` snapshots
- active indicator list
- alert records projected through the current alert runtime

Keep object-tree nodes as labels and metadata only. Do not put full series data arrays, drawing options, or alert payloads into the sidebar model.

## Task 1: Public Object Tree Model

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Add `WorkbenchObjectTreeNodeKind`:
  - `"chart"`
  - `"pane"`
  - `"main-series"`
  - `"series"`
  - `"study"`
  - `"drawing"`
  - `"alert"`
  - `"trade-location"`
- Add `WorkbenchObjectTreeNodeModel`:
  - `id`
  - `kind`
  - `label`
  - optional `detailLabel`
  - optional `badgeLabel`
  - `depth`
  - optional `muted`
- Add `ObjectTreePanelModel`:
  - `title`
  - `summaryLabel`
  - `nodes`
  - `emptyLabel`
- Extend `RightSidebarModel` with `objectTree`.
- Extend `ChartWorkbenchModelInput` with optional `objectTree`.
- Add a deterministic default object tree when no input is supplied. It should include at least one chart/root node derived from `input.symbol` and `input.chartTypeLabel`.
- Keep existing watchlist/alerts/placeholders behavior compatible.

Tests:

- Existing workbench contract tests still pass.
- Add assertions that the default model includes an object tree with a chart/root node.
- Add assertions that an explicit object tree is preserved and does not affect watchlist/alerts projection.

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Object Tree Projection

Files:

- Modify `src/lib/demo/chartx-demo.ts`
- Add or modify `tests/unit/workbench-contract.test.ts` only if a pure projection helper is added to a public module

Implementation requirements:

- Build a read-only object tree in `mountWorkbenchDemo` and pass it into `createChartWorkbenchModel`.
- Include a chart/root node for the active symbol and chart type.
- Include pane nodes from `paneSnapshot` with pane index, height, and series count.
- Include main-series / series / study nodes using `chart?.getChartState()` and/or `paneSnapshot.series`.
- Include drawing nodes from `chart?.getChartState().drawings`.
- Include alert nodes from current `workbenchAlerts`.
- Include trade-location node when `chart?.getChartState().tradeLocation` exists.
- Keep labels deterministic and compact.
- Do not reach into internal owners or mutate chart state.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: Sidebar Object Tree UI And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render a new object tree card inside `.workbench-sidebar-scroll`, before the lower detail/control cards.
- Use stable selectors:
  - `data-workbench-panel="object-tree"`
  - `role="tree"`
  - `aria-label="Workbench object tree"`
  - `role="treeitem"`
  - `aria-level={node.depth + 1}`
  - `data-object-tree-node={node.id}`
  - `data-object-tree-kind={node.kind}`
- Render label, optional detail, and optional badge.
- Render `emptyLabel` if there are no nodes.
- Add minimal CSS that fits the existing sidebar visual language.
- Do not wire clicks or actions.

Browser tests:

- `workbench renders a read-only object tree`
  - assert the object tree card is visible
  - assert it contains root chart, pane, main-series, and alert nodes
- `workbench object tree reflects indicators and drawings`
  - add Moving Average from the indicator catalog
  - create a horizontal-line drawing
  - assert object tree contains a study node and drawing node

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "object tree"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0281-add-workbench-object-tree-v0.md`

Documentation requirements:

- Add an implementation note under `Layer 2: Workstation Parity > Object Tree And Inspector`.
- Tutorial should explain why V0 is read-only, how the public model differs from chart runtime state, how demo projection works, and what operations are deferred.

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "object tree"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

After all tasks pass their two-stage reviews, run a final branch review over the full Object Tree V0 branch. Merge back to `main` only after the final reviewer approves and final verification is green.
