# 0216 - Extract Event Subscription Owner

This slice moves public event subscription routing out of `chart-harness`.

Before this change, the harness public methods directly called the handler registry for crosshair, click, drawing-selection, pane, and chart-type subscriptions. The registry still owns handler storage and event emission, but the harness should not be the adapter that wires every public subscription method by hand.

## What Changed

- Added `createChartEventSubscriptionOwner`.
- Routed all public subscribe/unsubscribe methods through the owner.
- Added owner tests covering every public subscription pair.

## Why This Shape

This is part of collapsing `chart-harness` into a public API adapter shell. Event subscription storage remains in `chart-handler-registry`; the new owner only centralizes public subscription routing so the harness no longer touches registry methods directly in its API surface.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-event-subscription-owner chart-handler-registry chart-public-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

