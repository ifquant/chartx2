# 0332 add mobile footer controls sheet v0

## Why

The mobile bottom-panel work had already moved the heavy footer regions out of
the inline chart stack, but the dense footer controls still stayed permanently
visible on narrow screens. That left `time presets`, mode rows, and chart
actions consuming chart space even when the user was not interacting with them.

## What changed

- added a mobile-only `Controls` trigger in the bottom-tab strip
- moved `time presets`, `mode` rows, and chart action buttons into a dedicated
  mobile footer controls sheet
- hide the inline `time-strip`, `mode-strip`, and `action-strip` at mobile
  widths while keeping their desktop behavior unchanged
- close the controls sheet after action taps and when other mobile sheets take
  focus
- added focused Playwright coverage for opening the controls sheet and closing
  it after an action tap
- updated the alignment plan to mark mobile footer controls consolidation

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile footer controls open as a dedicated sheet|workbench mobile footer controls close after an action tap|workbench mobile logs tab auto-opens its bottom sheet|workbench mobile time-presets tab auto-opens its bottom sheet" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- the controls sheet still uses a simple open/close overlay without drag sizing
- time preset buttons remain read-only against the current demo model
