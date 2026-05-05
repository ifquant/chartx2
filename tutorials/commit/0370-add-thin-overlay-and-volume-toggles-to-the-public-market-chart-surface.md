# 0370: Add thin overlay and volume toggles to the public market chart surface

Date: 2026-05-05

## Why

The first public market chart surface could mount bars and volume, but host
apps still had no clean way to drive basic chart-state toggles such as moving
average visibility or hiding the volume pane without reaching into workbench
policy.

## What changed

- extended the public market-chart-surface model with an optional overlay line
- updated `PhaseOneMarketChartSurface` to mount the overlay line on the main
  pane and rebuild when overlay/volume presence changes
- documented that hosts can now drive thin overlay and volume toggles through
  the public surface without importing workbench behavior

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no indicator catalog or study runtime is attached to this public surface
- overlay configuration remains intentionally narrow and host-owned
