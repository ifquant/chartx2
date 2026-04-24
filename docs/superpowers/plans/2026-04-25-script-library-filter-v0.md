# Script Library Filter V0

Date: 2026-04-25

## Goal

Add a local filter/search surface for saved custom scripts so the Script Library
can scale past a short preset list without changing runtime or persistence
contracts.

## Scope

- add a local saved-script filter input and clear action
- filter by label, short label, description, and expression text
- update the library count and empty state for filtered results
- keep runtime launch/edit/delete behavior unchanged
- add focused visual coverage for filter behavior

## Not In Scope

- server-side search
- persistence of the filter query
- sort modes or bulk actions

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "local filter narrows saved scripts without touching runtime state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
