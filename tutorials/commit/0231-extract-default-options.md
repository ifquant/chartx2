# 0231 Extract Default Options

## Why This Commit Exists

`chart-harness` still owned a large block of visual constants and mutable default option objects for layout, crosshair, drawings, series, studies, and price lines.

Those defaults are runtime policy, not adapter-shell lifecycle. Keeping them inline made the harness look like the source of visual and series defaults even though other owners already consume those objects.

This slice moves default ownership into a dedicated module while preserving per-chart mutable option instances.

## What Changed

- Added `chart-default-options.ts` for immutable colors, spacing, tolerance constants, and default option factories.
- Rewired `PhaseOneChartHarness` to initialize defaults through factory functions.
- Added a default option bundle helper for tests and future composition cleanup.
- Added focused tests proving mutable default objects are fresh per factory call.
- Updated the architecture note to record the default-option ownership boundary.

## Why This Is Safe

The harness still receives the same default values. The important behavior detail is that mutable option objects are created through functions, not exported as shared singleton objects.

That preserves the old per-chart-instance behavior where applying chart or series options mutates only that chart instance's option state.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-default-options chart-public-surface-owner chart-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- The exported `PhaseOne*` public types still live in `chart-harness`.
- Pane geometry constants are still passed from the harness composition root.
- No visual defaults or public option behavior are intentionally changed.
