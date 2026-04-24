# 0304 add script library sort v0

## Why

Filtering helped narrow saved scripts, but the Script Library still assumed a
single fixed row order. Once the list grows, users need a way to pivot between
recent additions, alphabetical browsing, and active/in-use entries.

## What changed

- added local sort modes for newest-first, label A-Z, and in-use-first
- sorting now composes with the local filter instead of replacing it
- added focused visual coverage showing row reorder without runtime-state
  changes

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "local sort reorders saved scripts without changing runtime state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no persisted sort mode
- no bulk selection or bulk library actions
