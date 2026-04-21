# 0209 - Extract Trade Location Owner

This slice moves active trade-location session ownership out of `chart-harness`.

Before this change, the harness stored `activeTradeLocation` and assembled locate, clear, get, and refresh callbacks inline. That made trade-location behavior a special harness-owned state path even though the actual runtime logic already lived in shared command/runtime modules.

The new `chart-trade-location-owner.ts` owns the active session and exposes a narrow surface for public commands, source refresh triggers, state snapshots, and render readout.

## What Changed

- Added `createChartTradeLocationOwner`.
- Moved active trade-location state into the owner.
- Routed `locateTrade`, `clearTradeLocation`, and `getTradeLocationState` through the owner.
- Routed render coordinator and chart-state snapshot reads through the owner.
- Kept the existing source-owner refresh path intact, but pointed its active/session writes at the owner.

## Why This Shape

Trade location is runtime state, not chart harness policy. Keeping it behind an owner makes the source refresh path and public API path share the same session store, while leaving low-level range resolution and overlay option logic in the existing runtime/model modules.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-trade-location-owner chart-trade-location-runtime`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

