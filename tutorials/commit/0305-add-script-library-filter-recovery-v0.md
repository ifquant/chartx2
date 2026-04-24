# 0305 add script library filter recovery v0

## Why

After local filtering landed, the Script Library could end up in a no-match
state that required the user to go back to the top filter controls. That was a
small but unnecessary management friction point.

## What changed

- added an inline `Clear filter and show all` action to the no-match empty state
- the recovery action only resets the local filter query and leaves runtime
  state untouched
- added focused visual coverage for empty-state recovery

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "empty filter state can recover back to the full saved list" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no search suggestions or persisted filter history
- no broader empty-state redesign
