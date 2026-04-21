# 0229 Route Internal State Wiring To Owners

## Why This Commit Exists

`chart-harness` still had internal owner wiring that called public harness methods such as `applyOptions`, `applyMainSeriesState`, `addCandlestickSeries`, `locateTrade`, `timeScaleApi`, and `priceScaleApi`.

That made the public API surface double as an internal runtime dependency layer. It also blocked later cleanup, because deleting or moving the public passthrough methods would risk changing restore behavior.

This slice routes the internal state/restore dependencies directly to the stable owners that already own those commands.

## What Changed

- Routed state snapshot scale reads through `scaleOwner`.
- Routed trade-location range changes through `scaleOwner`.
- Routed restore option application through `shellOwner`.
- Routed restore trade commands through `tradeLocationOwner`.
- Routed restore main-series state through `mainSeriesStateOwner`.
- Routed restore series recreation through `seriesCommandOwner`.
- Routed state coordinator main-series snapshot reads through `mainSeriesStateOwner`.
- Documented the owner-direct internal wiring rule.

## Why This Is Safe

The public methods still exist and keep the external `PhaseOneChartApi` contract unchanged. This commit only changes how internal composition reaches the same underlying owners.

The restored chart behavior should be equivalent because each replaced public method was already a one-line forwarder to the owner now being called directly.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-state chart-state-restore chart-state-coordinator chart-state-restore-command-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Public harness passthrough methods are not removed yet.
- `createChartPublicApi` still wraps the harness-shaped public surface.
- Restore semantics and state schema are unchanged.
