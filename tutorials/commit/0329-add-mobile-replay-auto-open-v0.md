# 0329 add mobile replay auto-open v0

## Why

After replay gained a mobile bottom-sheet surface, entering replay from the
toolbar still required a second manual step to open that sheet. On narrow
screens that was unnecessary friction, because the shell already knows replay
became the active bottom workflow.

## What changed

- track replay activation edges in `MarketWorkbenchPanel.svelte`
- when replay becomes active on a narrow viewport and the replay bottom tab is
  active, automatically open the existing mobile bottom sheet
- add a focused Playwright test that enters replay from the toolbar and asserts
  the replay sheet opens with active replay state visible
- update the alignment plan to mark replay auto-open behavior complete

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile replay panel opens as a bottom sheet and drives replay controls|workbench mobile replay toolbar entry auto-opens the replay bottom sheet|workbench mobile bottom sheet auto-closes when bottom-tab navigation changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- replay sheet still uses the existing snap-threshold motion model
- logs and time-presets still keep their current mobile treatment
