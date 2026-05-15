# Add Inline Market Chart Right Dock

## Context

The first chart right-dock mode was an overlay. That was useful for quick integration, but in dense trading workspaces it can cover the latest candles and make the market panel feel like it is floating above the chart rather than participating in the chart layout.

## Change

- Add `inline` to `PhaseOneMarketChartSurfaceRightDockMode`.
- Let `PhaseOneMarketChartSurface` split the chart body into canvas and right-dock columns when `inline` is open.
- Keep `overlay` available for consumers that explicitly want a non-reserved dock.

## Verification

- `pnpm --filter @chartx2/library check`
- `pnpm --filter @chartx2/library test:unit`
