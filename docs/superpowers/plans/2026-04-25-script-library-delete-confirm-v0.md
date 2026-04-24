# Script Library Delete Confirm V0

Date: 2026-04-25

## Goal

Fence saved custom-script deletion behind an explicit row-level confirm step so
the Script Library no longer removes definitions on the first click.

## Scope

- add local row state for a pending saved-script delete action
- switch a saved custom-script row from `Delete` into `Confirm delete` and
  `Cancel`
- only delete after explicit confirmation
- clear the pending row state after confirm, cancel, or when the row disappears
- keep the editor reset behavior intact when the deleted row is the current edit
  target
- add focused Playwright coverage for cancel and confirm

## Not In Scope

- undo or trash-bin recovery for deleted custom scripts
- multi-row bulk actions
- changing the workbench runtime or public API contracts
- changing custom-script persistence or chart-state restore semantics

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "delete requires an explicit confirm step" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
