# Workbench Screener V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each task must be committed separately and reviewed before the next task.

## Goal

Land the first executable `Screener V0` slice for the market workbench.

This slice does not try to become a full market screener product. It makes a
small, deterministic screener real inside the existing workbench sidebar first,
so later work can add richer filters, remote data, saved screens, and broader
watchlist/query scope on top of a visible workstation contract.

The target outcome is:

- the public workbench shell exposes a thin screener panel model in the right
  sidebar
- the demo workbench derives screener rows from the existing local
  watchlist/fixture symbols
- the panel supports a narrow set of local filters
- screener rows open symbols through the same active-host symbol-open path used
  by the watchlist
- `+page.svelte` stays a thin forwarding shell
- browser coverage proves screener filtering and symbol-open routing in the
  current demo

Out of scope for this slice:

- remote screener feeds or server-backed scans
- a query DSL or user-authored scan expressions
- saved screener presets
- multi-watchlist management
- broad technical-indicator screening catalogs

## Architecture

This slice should preserve the workstation boundary:

- `src/lib/chartx/public/workbench.ts` remains the public shell contract
- `src/lib/demo/chartx-demo.ts` owns demo-local screener derivation and filter
  state
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` renders the screener
  projection from public model/controller props
- `src/routes/+page.svelte` forwards screener result clicks only

The key design rule is:

- **screener rows are sidebar projection state, not a new chart-runtime API**

## Task 1: Public Screener Sidebar Contract

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Add a thin `ScreenerPanelModel` to the public right-sidebar contract.
- Keep screener state adjacent to watchlist/alerts/object-tree instead of
  inventing a separate page-local branch.
- Model only the V0 surface needed by the shell:
  - panel title and summary label
  - mode label
  - filter chips/toggles
  - deterministic result rows
  - empty label
- Preserve existing workbench defaults for callers that do not provide screener
  input.
- Add or adjust unit tests so the contract proves screener data stays inside
  the public right-sidebar model.

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Screener Projection And Local Filters

Files:

- Modify `src/lib/demo/chartx-demo.ts`

Implementation requirements:

- Build screener rows from the existing watchlist/fixture symbol set instead of
  adding a new data source.
- Keep the derived rows deterministic so the demo and browser tests are stable.
- Support a narrow local filter set only:
  - falling-only
  - optional price floor
- Rank results by absolute percentage move.
- Publish the screener panel through `createChartWorkbenchModel(...)` alongside
  the rest of the right-sidebar projection.
- Keep result-open behavior routed through the existing symbol-open path rather
  than a screener-specific loader.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: Sidebar UI, Forwarding Shell, And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `src/routes/+page.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render the screener as a local workbench sidebar card.
- Add stable selectors for screener mode, filters, summary, and result rows.
- Keep filter toggles and result clicks routed through the existing controller
  boundary.
- Keep `+page.svelte` thin: it should only forward screener result clicks.
- Browser coverage must prove:
  - screener renders deterministic local rows
  - filter toggles change the visible result set
  - clicking a screener result opens the symbol through the active-host path

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "screener"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0284-add-workbench-screener-v0.md`

Documentation requirements:

- Add an implementation note under `Layer 2: Workstation Parity > Screener V0`.
- Be explicit that the current slice is a local workbench sidebar screener fed
  by existing watchlist/fixture symbols.
- Tutorial should explain:
  - why Screener V0 stays inside the existing workbench sidebar first
  - how the deterministic local filters/results are built
  - why result clicks reuse the existing watchlist/active-host symbol-open path
  - what remains for a fuller screener product

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "screener"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

After all tasks pass review, run a final branch review over the full Screener V0
branch. Merge back to `main` only after the final reviewer approves and final
verification is green.
