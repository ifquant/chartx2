# 0208 - Extract Primary Series Owner

This slice moves the primary main-series add/attach dependency bundle out of `chart-harness` and into a dedicated owner.

Before this change, `chart-harness` still assembled the primary series factory deps locally. That made the harness responsible for too many runtime policies at once: main-source creation, chart-type-to-source-kind mapping, formatter application, main-series style rebuilds, marker mutation, price-line creation, primary data forwarding, and render invalidation.

The new `chart-primary-series-owner.ts` keeps the existing lower-level factory/use-case modules intact, but centralizes the composition surface that the harness calls.

## What Changed

- Added `createChartPrimarySeriesOwner`.
- Routed primary `add*Series` public commands through `primarySeriesOwner.add(...)`.
- Routed chart-type switch and main-series state restore through `primarySeriesOwner.attach(...)`.
- Deleted the harness-local `attachPrimarySeries` and `createPrimarySeriesFactoryDeps` methods.
- Added unit coverage for preserved attach, fresh add, chart-type source-kind mapping, marker routing, data forwarding, and price-line routing.

## Why This Shape

This is an owner/composition extraction, not a rewrite of the primary series API factory.

The factory remains responsible for constructing the API object. The new owner is responsible for collecting the runtime dependencies needed by that factory from model, source owner, study context, price-line manager, and render invalidation. That keeps the next harness shrink steps focused on orchestration instead of repeatedly rebuilding the same closure bundle.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-primary-series-owner chart-primary-series-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

