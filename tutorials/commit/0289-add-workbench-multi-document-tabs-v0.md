# 0289 add workbench multi-document tabs v0

## Why

The workstation already had a command palette, status surface, import/export, and focus tabs, but the tabs were still only semantic toggles. They did not own independent chart documents, so the shell could not honestly claim TradingView-like multi-document workspace behavior.

## What Changed

- Expanded the public workbench tab model to use document ids plus a stable `viewId`.
- Added local workspace documents in the demo runtime, each with its own symbol, timeframe, chart type, panel focus, and optional chart snapshot.
- Wired create, close, and activate flows through the shell without moving workstation policy into `+page.svelte`.
- Extended `WorkbenchLayoutState` so local save/restore/import/export can round-trip the full workspace tab set.
- Updated visual coverage to prove document switching, document duplication, close behavior, and import/export preservation.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workspace tabs|adapter status|layout import/export|command|screener|workbench replays|layout"`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Workspace documents are still local-only and single-runtime.
- This slice does not add cloud sync, rename UX, or free-form command routing.
