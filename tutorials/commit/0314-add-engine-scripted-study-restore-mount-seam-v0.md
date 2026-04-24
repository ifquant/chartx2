# 0314 add engine scripted study restore mount seam v0

## Why

`0313` widened engine chart state so `studies[]` could contain a
`scripted-study` branch, but restore still filtered that branch out. That left
the engine in an inconsistent state: `chart.getChartState()` could emit
scripted-study snapshots that `chart.applyChartState()` would silently drop.

This commit closes that gap. The goal is not full script execution parity yet.
The goal is to make the engine-owned snapshot contract internally consistent so
separate-pane scripted-study entries round-trip through the same restore path as
other studies.

## What Changed

- widened the internal study restore chain so `chart-content-restore`,
  `chart-study-restore`, `chart-state-restore-content`, and
  `chart-state-coordinator` now accept and replay `scripted-study` snapshots
- added the smallest internal scripted-study study API plumbing needed to mount
  a scripted-study source during restore and then reapply its `studyOptions`
- extended secondary study option handling so scripted-study sources can keep
  `scriptId`, numeric `inputValues`, and input-context metadata on the engine
  side
- wired harness restore commands into the new internal scripted-study mount seam
- added focused unit coverage for series-command, secondary-study api, restore
  content, restore command shell, and coordinator round-trip behavior
- updated the alignment plan to record that the engine restore regression is now
  closed

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-coordinator.test.ts tests/unit/chart-state-restore-content.test.ts tests/unit/chart-study-restore.test.ts tests/unit/chart-secondary-series-api.test.ts tests/unit/chart-secondary-series-api-owner.test.ts tests/unit/chart-series-command-owner.test.ts tests/unit/chart-secondary-series-factory.test.ts tests/unit/chart-source-owner.test.ts tests/unit/chart-state-shell-owner.test.ts tests/unit/chart-state-restore-shell-owner.test.ts tests/unit/chart-state-restore-command-owner.test.ts tests/unit/chart-state-content-runtime.test.ts`

## Not Included

- no Pine compatibility
- no overlay scripted-study restore
- no broader migration from workbench-owned script descriptors into full
  engine-native script execution
