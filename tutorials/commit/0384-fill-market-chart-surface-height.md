# 0384 fill market chart surface height

## Background

The alpha2 technical-analysis host mounts `PhaseOneMarketChartSurface` inside a fixed-height chart
frame. The chart surface previously sized itself from the canvas' aspect-height feedback loop, so
hosts could see a filled canvas followed by unused vertical space inside the chart frame.

## Changes

- Set the market chart surface root to `height: 100%` so resize observation follows the host frame.
- Removed the temporary DOM indicator readout stack from the surface.
- Kept indicator pane rendering inside the chart canvas as the only visible pane representation.

## Verification

- `pnpm --filter @chartx2/library test:unit -- phase-one-market-chart-surface chart-default-options`
- `pnpm release:local`
- `pnpm check`
- `git diff --check`

## Not Included

- Custom secondary pane legend labels are still deferred.
