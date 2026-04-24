# 0303 add script library filter v0

## Why

The Script Library management surface had grown to include import, in-use
guards, and saved-script rows, but it still assumed a tiny local list. Once the
library grows, the user needs a way to narrow rows without affecting runtime
state.

## What changed

- added a local filter input and clear action for saved custom scripts
- filter now matches label, short label, description, and expression text
- the saved-script count and empty state now reflect filtered results
- added focused visual coverage showing that filtering is purely local UI state

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "local filter narrows saved scripts without touching runtime state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no persisted search query
- no sort modes or bulk library actions
