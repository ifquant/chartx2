# 0219 - Extract Source Mutation Owner

This slice pulls the repeated source mutation callback groups out of `chart-harness`.

Before this change, `sourceOwner` and the secondary-series API owner both received harness-local closures for viewport reset, render invalidation, canonical bar updates, histogram transforms, main-source rebuild, and study display resolution.

## What Changed

- Added `chart-source-mutation-owner` to group primary mutations, secondary mutations, and secondary API runtime mutation helpers.
- Rewired `chart-harness` so `sourceOwner` consumes `sourceMutationOwner.primaryMutations` and `sourceMutationOwner.secondaryMutations`.
- Rewired secondary-series API construction to reuse `sourceMutationOwner.secondarySeriesApiRuntime`.
- Added focused tests for primary rebuild/context callbacks and secondary display/histogram mutation helpers.
- Updated architecture notes with the new source mutation boundary.

## Why This Shape

The mutation rules are shared runtime policy. Keeping them in one owner reduces duplicate closure blocks and makes later `sourceOwner` integration narrower: harness supplies only "what to call" for context sync, display resolution, viewport reset, and render invalidation.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-mutation-owner chart-source-owner chart-secondary-series-api-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
