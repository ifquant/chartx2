# 0313 add engine scripted study state shape v0

## Why

The workbench can already persist scripted indicators through its own
descriptor bridge, but engine chart state still only knows how to describe
moving-average study state. That gap makes the promotion path ambiguous: the
next restore/execution slices would have to invent their chart-state shape and
source contract at the same time.

This commit defines that missing engine-owned shape first. It gives scripted
studies a typed snapshot/state contract without changing how the current
workbench script library restores or mounts them.

## What changed

- widened the internal source-state indicator contract with a dedicated
  scripted-study variant carrying `scriptId` and numeric `inputValues`
- extended `PhaseOneChartStateSnapshot["studies"]` with a
  `type: "scripted-study"` branch that mirrors the existing input-context
  fields used by moving-average studies
- taught the chart-state snapshot builders to serialize scripted-study sources
  into the new engine-owned study shape while leaving restore/mount code
  untouched
- added focused unit coverage proving the builder emits the new snapshot and
  the public chart-state type accepts it
- updated the alignment plan and recorded the promotion slice in a checked-in
  plan note

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-snapshot-builders.test.ts tests/unit/chart-api-types.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no scripted-study restore or mount plumbing yet
- no workbench layout/import/export behavior changes
- no Pine compatibility, overlay scripted studies, or runtime script execution
