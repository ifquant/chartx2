# Script Library Stale Edit Target Fence V0

Date: 2026-04-25

## Goal

Fence stale Script Library edit targets after delete so the workbench editor
cannot keep submitting an update against a custom-script id that no longer
exists in the saved library.

## Scope

- detect when the currently edited custom script disappears from the saved
  library
- clear `editingCustomScriptId` and reset the local draft back to create mode
  when that target is no longer present
- keep the behavior workbench-owned and local to the demo shell
- add focused visual coverage for delete-while-edit recovery

## Not In Scope

- persisted draft recovery
- undo/restore deleted scripts
- changing the custom-script definition schema
- changing runtime script execution or chart-state persistence

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "stale edit target clears after custom script delete" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
