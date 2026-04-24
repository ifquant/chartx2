# 0301 add script library in-use fence v0

## Why

The demo runtime already rejected editing or deleting a saved custom script
while it was still active on a chart, but the Script Library row UI continued
to show those actions as if they were available. That created a shell/runtime
mismatch.

## What changed

- added `inUse` state to saved custom-script snapshot rows
- surfaced an inline “remove active uses first” message in active saved-script
  rows
- disabled `Edit` and `Delete` buttons while the script is active, while
  leaving `Duplicate` and `Add` behavior unchanged
- added focused visual coverage for the row-level in-use fence

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "active custom scripts surface in-use state and fence edit/delete" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- adding a dedicated active-indicator removal control to the workbench shell
- changing runtime-side save/delete rejection rules
