# 0338 add mobile workspace tabs compaction v0

## Why

Even after the toolbar and footer were compacted for narrow screens, workspace
tabs were still using the same two-line desktop chip treatment. That kept
forcing `label + symbol/timeframe` into a tight horizontal strip above the
chart.

## What changed

- added a narrow-width active workspace summary row above the tab strip
- hid the verbose `symbol · timeframe` sublabel inside each workspace chip on
  narrow screens while keeping the existing tab actions and data model
- kept workspace switching behavior unchanged, but added focused Playwright
  coverage to assert that the summary follows the active tab and that chip
  detail text is hidden on mobile
- updated the alignment plan to mark the mobile workspace-tab density pass

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile workspace tabs collapse into a compact strip with active summary" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not yet change the bottom trigger strip on narrow screens
- workspace tabs still use the same underlying tab ordering and close/create actions
