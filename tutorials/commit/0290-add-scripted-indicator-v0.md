# 0290 add scripted indicator v0

## Why

Layer 3 needed a first real step into scripts, but jumping straight to Pine compatibility or first-class script studies would force unstable engine contracts too early. The safer step was to prove that a bounded scripted indicator can execute, render, and surface through the existing workbench indicator flow.

## What Changed

- Added `src/lib/chartx/public/workbench-scripts.ts` with a narrow V0 script model, a canned script library, and structured execution results.
- Added one catalog-visible scripted indicator, `Scripted SMA 20`.
- Wired the demo workbench to execute the script against active bars and attach the result as a separate-pane line study.
- Reflected the scripted indicator through the active-indicator list and object tree.
- Kept layout and workspace snapshot exports from persisting unlabeled scripted panes, so restore paths do not bring back raw line series without script identity.
- Added focused unit and visual coverage around the new runtime and user-facing workbench flow.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adds indicators|object tree reflects indicators|workspace tabs|layout import/export|command|adapter status"`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Scripted indicators are not yet persisted as first-class chart-state studies.
- There is still no end-user script editor, parser, or Pine subset.
