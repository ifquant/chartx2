# Script Library Sort V0

Date: 2026-04-25

## Goal

Add local sort controls to the Script Library so saved custom scripts can be
reordered for management without changing runtime or persistence behavior.

## Scope

- add local sort modes for newest-first, label A-Z, and in-use-first
- apply sorting after local filtering
- keep save/add/edit/delete/runtime semantics unchanged
- add focused visual coverage for row reordering

## Not In Scope

- persisted sort preferences
- server-side ordering
- bulk actions

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "local sort reorders saved scripts without changing runtime state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
