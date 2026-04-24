# 0292 add scripted indicator inputs v1

## Why

`Scripted Indicator V0` and `Scripted Layout Persistence V0` proved that the
workbench could execute canned scripts and carry them through local layout
round-trips, but scripted entries were still effectively fixed presets. This
slice makes the existing local script path configurable by letting the catalog
describe numeric inputs and by carrying the chosen values through add, summary,
and persistence flows without pretending scripts are engine-native studies.

## What Changed

- Exposed scripted numeric input definitions through the workbench indicator
  catalog so scripted entries can declare bounded number inputs.
- Wired the demo workbench indicator panel to render those numeric inputs,
  initialize them from script defaults, and forward the selected values through
  `addIndicatorFromCatalog()`.
- Included scripted `inputValues` in active indicator summaries so parameterized
  script instances are visible after add/restore.
- Extended workbench-owned scripted layout descriptors so save/restore and
  import/export preserve scripted input values alongside the script identity.
- Added or updated targeted unit and Playwright coverage around script input
  resolution, indicator add flow, and layout round-trip behavior.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "layout import/export|adds indicators|object tree reflects indicators and drawings|saves and restores the active layout locally" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Scripted indicators are still not persisted as first-class chart-state
  studies.
- There is still no user-authored script editor, script library management, or
  Pine-compatible authoring path.
- This slice only covers numeric scripted inputs; richer input types remain
  deferred.
