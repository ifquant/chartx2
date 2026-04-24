# Script Library Dirty Draft Fence V0

Date: 2026-04-25

## Goal

Fence Script Library edit-target switches behind an explicit discard/cancel
choice when the current draft has unsaved changes, so the workbench panel no
longer silently replaces dirty authoring state.

## Scope

- track a local draft baseline for the current Script Library form state
- detect when the current draft diverges from that baseline
- intercept saved-script `Edit` actions that would replace a dirty draft
- surface a local discard/cancel choice in the panel
- keep save, reset, and delete-confirm paths from leaving stale pending-load
  state behind
- add focused Playwright coverage for cancel and discard behavior

## Not In Scope

- widening scripted-indicator runtime or public API contracts
- adding browser-level unload prompts or global navigation guards
- supporting multi-draft editing or background autosave
- changing custom-script persistence or chart-state restore semantics

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "switching edit targets fences unsaved draft changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
