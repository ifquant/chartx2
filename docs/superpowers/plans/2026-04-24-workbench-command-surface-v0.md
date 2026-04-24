# Workbench Command Surface V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementation task should be a small, verifiable slice with review before merge.

## Goal

Land the first executable `Command Surface V0` slice for the market workbench.

This slice does not try to ship a full TradingView-grade command system. It
makes a small, deterministic command palette real inside the existing
workbench shell first, so later work can add richer command search, workspace
actions, import/export flows, and broader keyboard coverage on top of a stable
controller-backed boundary.

The target outcome is:

- the public workbench shell exposes a thin command-palette model
- the demo controller publishes a deterministic command registry
- the workbench can open and close the palette with `Cmd/Ctrl+K`
- palette execution routes through the controller instead of page-local
  business logic
- the first command set covers existing workbench actions such as theme,
  layout, layout persistence, and replay entry/exit
- browser coverage proves keyboard open/close and at least one real command
  execution path

Out of scope for this slice:

- fuzzy command search or ranked query results
- free-text command parsing
- editable shortcut binding management
- workspace tabs
- import/export flows
- multi-step command workflows
- a global cross-app command bus

## Architecture

This slice should preserve the workstation boundary:

- `src/lib/chartx/public/workbench.ts` remains the public shell contract
- `src/lib/demo/chartx-demo.ts` owns the demo-local command registry and
  controller-backed execution path
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` renders the palette
  overlay from snapshot/controller props
- `src/routes/+page.svelte` owns only transient open state plus keyboard
  forwarding

Key design rule:

- **the palette is a shell projection over existing commands, not a new
  workstation policy owner**

## Task 1: Public Command Palette Contract

Files:

- Modify `src/lib/chartx/public/workbench.ts`
- Modify `tests/unit/workbench-contract.test.ts`

Implementation requirements:

- Add a thin `commandPalette` model to the public workbench contract.
- Keep the model small and V0-focused:
  - title
  - entries
  - entry label
  - optional shortcut label
  - enabled state
  - optional active state
- Preserve default behavior for callers that do not provide command palette
  input.
- Add focused unit tests proving the contract keeps command palette metadata on
  the workbench model.

Verification:

- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `git diff --check`

## Task 2: Demo Command Registry And Execution Routing

Files:

- Modify `src/lib/demo/chartx-demo.ts`

Implementation requirements:

- Build a deterministic command palette from existing workbench actions rather
  than inventing a second command system.
- Cover a narrow first command set only:
  - theme toggle
  - single/split layout switching
  - save/restore/reset layout
  - replay enter/exit
- Keep enabled/disabled state honest, especially around replay and layout
  persistence availability.
- Add a thin `executeCommand(commandId)` controller path that routes palette
  execution back into the existing controller methods and `runAction(...)`
  surface.
- Publish the palette through `createChartWorkbenchModel(...)`.

Verification:

- `pnpm check`
- `git diff --check`

## Task 3: Palette UI, Keyboard Toggle, And Browser Coverage

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `src/routes/+page.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Render a local command-palette overlay in the workbench UI.
- Add stable selectors for the trigger, overlay, backdrop, and command entries.
- Support `Cmd/Ctrl+K` to open and close the palette, and `Escape` to close it.
- Keep the page thin: `+page.svelte` should only own palette visibility and
  forward execution to the controller.
- Browser coverage must prove:
  - keyboard toggle opens the palette
  - keyboard toggle closes the palette
  - selecting a command changes visible workbench state

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "command|layout"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0285-add-workbench-command-surface-v0.md`

Documentation requirements:

- Add an implementation note under `Layer 2: Workstation Parity > Workstation UX And Command Surface`.
- Be explicit that this slice is a controller-backed command palette first, not
  a full workstation command bus.
- Tutorial should explain:
  - why the first slice is a deterministic palette instead of fuzzy search
  - why `+page.svelte` keeps only open state and keyboard forwarding
  - why command execution reuses existing controller actions and layout/replay
    methods
  - what remains for fuller TradingView-like command parity

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "command|screener|workbench replays|layout"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

After all tasks pass review, run a final branch review over the full Command
Surface V0 branch. Merge back to `main` only after the final reviewer approves
and final verification is green.
