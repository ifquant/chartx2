# 0373 Extract Workbench Trade Intent Bridge Into The Library

Date: 2026-05-08

## Why

The official example app still owned a reusable trade-intent bridge helper even though the logic was not example-specific. That kept the example runtime carrying a small host-support seam that belongs in the library.

## What Changed

- moved `createWorkbenchTradeIntentBridge(...)` into the public `workbench-host` surface
- rewired the example route to import the helper from `@chartx2/library`
- deleted the old example-owned bridge module
- kept the focused unit test on the example side, but pointed it at the public library export

## Result

- the trade-intent bridge is now library-owned support code
- the example app no longer owns or imports a private bridge shim for trade location
- the library/example split is tighter without widening the change into larger workbench controllers

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 --filter @chartx2/example-tauri-svelte test:unit -- --runInBand tests/unit/workbench-trade-intent-bridge.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 --filter @chartx2/library check`
- `git diff --check`
