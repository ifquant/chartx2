## Goal

Close the engine restore gap introduced when `scripted-study` became part of the
chart-state snapshot contract.

## Scope

- extend the internal restore chain so `scripted-study` snapshots are treated as
  restorable studies instead of being filtered out
- add the smallest internal scripted-study study API needed for restore/mount
- cover the restore path with focused unit tests
- update the alignment plan and commit tutorial

## Non-Goals

- no Pine compatibility
- no overlay scripted-study support
- no chart-layout/chart-state migration rewrite beyond the restore seam
- no new public chart API for user-authored scripts

## Implementation Notes

- keep the public chart API unchanged; use an internal restore-only scripted
  study mount path
- preserve the existing workbench-owned script library and descriptor bridge
  around layout persistence
- make `applyChartState()` round-trip engine-owned scripted-study snapshots
  through the same coordinator path used by overlay/compare/moving-average

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-coordinator.test.ts tests/unit/chart-state-restore-content.test.ts tests/unit/chart-study-restore.test.ts tests/unit/chart-secondary-series-api.test.ts tests/unit/chart-secondary-series-api-owner.test.ts tests/unit/chart-series-command-owner.test.ts tests/unit/chart-secondary-series-factory.test.ts tests/unit/chart-source-owner.test.ts tests/unit/chart-state-shell-owner.test.ts tests/unit/chart-state-restore-shell-owner.test.ts tests/unit/chart-state-restore-command-owner.test.ts tests/unit/chart-state-content-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
