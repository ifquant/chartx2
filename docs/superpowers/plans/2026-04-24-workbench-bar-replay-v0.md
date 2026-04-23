# Workbench Bar Replay V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementation task should be a small, verifiable slice with review before merge.

## Goal

Land the first executable `Bar Replay V0` slice for the market workbench.

This slice does not try to finish TradingView-grade replay in one jump. It
makes replay real for the active market chart first, using the existing fixture
history and chart rebuild path, so later work can add stable indicator/drawing
replay semantics, multi-chart sync, and persistence on top of a working shell.

The target outcome is:

- the workbench can enter replay for the active market chart
- replay supports play, pause, step, and exit
- the visible chart data is truncated to a replay cursor while replay is active
- exiting replay restores the full current dataset
- replay policy stays in the demo/controller layer instead of leaking into
  `+page.svelte`
- browser tests prove the replay flow works in the current shell

Out of scope for this slice:

- multi-chart replay sync
- linked crosshair / symbol / interval replay groups
- replay persistence across reload
- strategy backtesting or order simulation
- stable promises about drawing/indicator replay semantics beyond the current
  rebuild path

## Architecture

This slice should preserve the existing workstation boundary:

- `src/lib/chartx/public/workbench.ts` stays a public shell contract
- `src/lib/demo/chartx-demo.ts` owns replay runtime policy
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` renders replay controls
  from snapshot/controller props
- `src/routes/+page.svelte` forwards replay callbacks only

Key design rule:

- **replay changes the displayed payload, not the engine API surface**

## Task 1: Replay Shell Contract Enablement

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Allow the shell to opt into additional bottom-panel tabs without changing the
  default workbench contract behavior.
- Keep replay disabled by default for existing workbench callers.
- Cover the replay-tab opt-in in focused unit tests.

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Replay Runtime And Controller

Files:

- Modify `src/lib/demo/chartx-demo.ts`

Implementation requirements:

- Add replay runtime state for the active workbench chart.
- Support at minimum:
  - enter replay
  - play
  - pause
  - step forward
  - exit replay
- Replay should operate on the currently loaded local fixture/history bars for
  the active symbol/timeframe.
- While replay is active, the displayed `bars`, `line`, and `volume` payloads
  should be truncated to the replay cursor.
- Exiting replay should restore the full current dataset.
- Reuse the existing rebuild/render path; do not introduce new engine replay
  APIs in this slice.
- Guard save/restore/reset layout while replay is active so saved-layout
  semantics do not silently capture replay-truncated chart state.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: Replay UI And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `src/routes/+page.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render a compact replay control surface in the workbench UI.
- Add stable selectors for replay coverage.
- Keep replay interactions routed through the existing controller boundary.
- Browser tests must cover:
  - entering replay
  - stepping forward
  - playing and pausing
  - exiting replay and returning to non-replay state
- Keep the existing layout tests green.

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "replay|layout"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0283-add-workbench-bar-replay-v0.md`

Documentation requirements:

- Record the current replay slice honestly under `Layer 2: Workstation Parity >
  Bar Replay V0`.
- Be explicit that this is active-chart-only local replay using the demo
  controller and existing rebuild path.
- Tutorial should explain:
  - why replay is scoped to the active chart first
  - why the implementation truncates displayed payload instead of adding new
    engine replay APIs
  - what remains for full replay parity

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "replay|layout"`
- `pnpm build`
- `git diff --check`
- `git status --short`
