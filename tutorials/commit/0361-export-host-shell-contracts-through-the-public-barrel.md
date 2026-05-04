# 0361 export host shell contracts through the public barrel

## Why

The host-facing sharing, strategy, trading, and sync contracts existed, but the
main public barrel still did not re-export them. That forced downstream modules
to know internal file paths instead of treating `chartx2` like a cleaner
library surface.

## What changed

- added `account-sync-surface`, `sharing-surface`, `strategy-tester`, and
  `trading-surface` to the public `chartx` barrel
- added a unit smoke test that imports those contracts through the barrel and
  instantiates typed sample models
- updated the alignment plan to record the cleaner host-facing import seam

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run /Users/dev/workspace2/hc_apps/chartx2/tests/unit/public-index-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no Svelte component barrel for the demo-side host shells
- no re-export of `workbench-scripts`; that wider script surface stays outside
  the main public barrel for now
