# 0223 - Extract State Restore Command Owner

This slice moves the chart-state restore command surface out of `chart-harness`.

Before this change, `stateCoordinator` still received inline harness closures for clearing selection and content, removing sources and drawings, rebuilding panes, restoring series and studies, applying scale state, locating trades, restoring drawings, and final render.

## What Changed

- Added `chart-state-restore-command-owner` for restore command callbacks.
- Rewired `chart-harness` so `stateCoordinator` consumes the restore command owner with a single spread.
- Removed the local restorable drawing snapshot alias from `chart-harness`.
- Added focused tests for restore command routing and pane target creation.
- Updated architecture notes with the new state restore command boundary.

## Why This Shape

The restore command side is separate from the snapshot input side. Extracting it keeps the coordinator's existing restore order intact while removing the large command callback block from the harness.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-state-restore-command-owner chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
