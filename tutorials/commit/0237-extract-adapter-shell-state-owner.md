# 0237 Extract Adapter Shell State Owner

## Why This Commit Exists

`chart-harness` had already shed most runtime policy into source, pane, drawing, render, scale, interaction, and state owners, but it still kept one noisy cluster of mutable adapter-shell state inline.

That remaining cluster was not business logic, but it still made the harness harder to read and harder to shrink further: canvas attachment state, drawing ordinal allocation, viewport spacing and offset, axis formatter callbacks, and primary-scale override flags were all still threaded as raw fields.

## What Changed

- Added `chart-adapter-state-owner.ts` as a focused owner for remaining adapter-shell mutable state.
- Moved canvas ref, drawing ordinal allocation, bar spacing, right offset, axis formatter callbacks, primary-scale-only flag, and primary price-range override behind that owner.
- Rewired `chart-harness.ts` to read and write those values through the owner instead of directly mutating harness fields.
- Added `chart-adapter-state-owner.test.ts` to lock the new owner’s state and reset semantics.
- Updated the architecture note to record this as part of the final adapter-shell collapse.

## Why This Is Safe

This is a structural ownership change. It does not alter render math, pane resolution, readout semantics, public API contracts, or restore ordering.

The harness still remains the composition root, but one more mutable cluster now has a dedicated owner, which reduces fanout for later restore/public shell cleanup.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-adapter-state-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

## Not Included

- No public API surface was renamed or moved.
- `chart-harness.ts` is still the temporary composition root.
- Restore/public shell composition is not extracted yet; this only removes another mutable state cluster from the harness body.
