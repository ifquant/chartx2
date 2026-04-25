# 0331 add mobile lightweight bottom panel auto-open v0

## Why

After `logs` and `time presets` gained mobile bottom-sheet surfaces, selecting
those tabs on a narrow screen still required a second tap on the sheet trigger.
That extra step made the lightweight panel flows feel slower than they needed
to be.

## What changed

- detect mobile-width bottom-tab selection inside `MarketWorkbenchPanel.svelte`
- automatically open the existing mobile sheet when the selected tab is
  `logs` or `time-presets`
- keep the change scoped to lightweight panels so trading, strategy, and replay
  preserve their current entry behavior
- add focused Playwright coverage for logs/time-presets tab auto-open
- update the alignment plan to mark lightweight panel auto-open complete

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile logs tab auto-opens its bottom sheet|workbench mobile time-presets tab auto-opens its bottom sheet|workbench mobile logs panel opens as a bottom sheet instead of relying on the sidebar|workbench mobile time presets open as a bottom sheet" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- heavy bottom flows still keep their current explicit trigger or replay-entry behavior
- this does not add new host callbacks for changing the active range preset
