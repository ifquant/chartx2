# 0337 add mobile readout dedupe v0

## Why

On narrow screens the top chart meta row was still repeating `Pane / O / H / L /
C` even though the bottom readout bar already carried that same information.
That duplication spent header density without adding new context.

## What changed

- marked the duplicated top-row `Pane` and `O / H / L / C` fields with
  dedicated selectors
- hid those duplicated fields at narrow widths while keeping symbol, timeframe,
  exchange, and time context visible above the chart
- added focused Playwright coverage for the narrow-width deduped meta state
- updated the alignment plan to record the mobile density cleanup

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile chart meta hides duplicated pane and OHLC readout" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not yet compact the workspace tab strip on narrow screens
- the bottom readout bar itself is unchanged and still owns the actual pane and OHLC display
