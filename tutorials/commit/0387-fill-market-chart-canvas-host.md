# Fill Market Chart Canvas Host

## Context

`PhaseOneMarketChartSurface` can now host a right dock inside the chart body. When the dock is open in `alpha2_tech`, the surface body filled the tile, but the internal canvas host could shrink to the rendered canvas height and leave a visible strip below the chart.

## Change

- Keep the canvas host at `height: 100%` so it occupies the full chart body.
- Leave the right dock overlay anchored to the same body instead of relying on downstream CSS patches.

## Verification

- `pnpm --filter @chartx2/library check`
- `pnpm --filter @chartx2/library test:unit`
