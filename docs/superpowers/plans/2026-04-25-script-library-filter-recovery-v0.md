# Script Library Filter Recovery V0

Date: 2026-04-25

## Goal

Make the Script Library empty-filter state recoverable in place so users do not
need to scroll back to the top controls just to clear a no-match query.

## Scope

- add an inline recovery action when saved-script filtering returns zero rows
- keep the action local to the shell by only clearing the current filter text
- add focused visual coverage for empty-state recovery

## Not In Scope

- persisted filter history
- search suggestions
- broader empty-state redesign

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "empty filter state can recover back to the full saved list" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
