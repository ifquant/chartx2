# 0308 add script library delete confirm v0

## Why

The Script Library already supports create, edit, duplicate, filter, sort, and
in-use fences, but deletion was still a one-click destructive action. That is a
poor fit for a management surface that can hold multiple saved custom scripts,
especially when one of those rows may also be the current editor target.

## What changed

- added a row-local pending delete state in the workbench panel so the first
  delete click swaps the row into `Confirm delete` and `Cancel`
- kept the delete flow inside the existing workbench-owned callback boundary and
  cleared pending state when the row disappears or becomes unavailable
- preserved the stale edit-target recovery path so confirming deletion still
  resets the editor back to create mode for the deleted script
- added focused Playwright coverage for both cancel and confirm, and updated the
  edited-row delete test to use the new confirmation step
- recorded the new management safeguard in the TradingView alignment notes and
  this execution-plan slice

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "delete requires an explicit confirm step" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no undo flow or recoverable trash state for deleted custom scripts
- no bulk script-library management actions
- no changes to scripted-indicator runtime contracts or chart-state persistence
