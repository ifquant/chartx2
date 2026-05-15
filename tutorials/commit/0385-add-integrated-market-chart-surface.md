# 0385 Add Integrated Market Chart Surface

## Why

Alpha2 needs a dense technical-analysis workstation where the market chart reads as one continuous component. Styling that from the host by reaching into chartx2 internals makes the host brittle, so chartx2 now owns the common terminal-style layout knobs.

## What Changed

- Added public layout types for `PhaseOneMarketChartSurface`.
- Added `chrome`, `density`, and `readoutPosition` props to the Svelte surface.
- Added a `readoutActions` snippet slot so hosts can place actions inside the readout row.
- Added `data-*` attributes for stable visual and browser tests.
- Kept the default card/bottom-readout behavior unchanged for existing consumers.

## Verification

- `pnpm --filter @chartx2/library check`
- `pnpm --filter @chartx2/library test:unit`

## Notes

- The new integrated mode is intentionally small: it standardizes component chrome and action placement without adding alpha2-specific business behavior to chartx2.
