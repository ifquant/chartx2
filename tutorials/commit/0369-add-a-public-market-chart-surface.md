# 0369: Add a public market chart surface

Date: 2026-05-05

## Why

`alpha2` had already moved chart-adjacent chrome back into `chartx2`, but the
main chart body still stopped at a host-docked placeholder. That meant host
apps still needed to own the canvas lifecycle to mount a real chart runtime.

## What changed

- added `market-chart-surface.ts` with a typed public model for symbol,
  timeframe, bars, volume, and optional chart options
- added `PhaseOneMarketChartSurface.svelte` that mounts the public chart API,
  manages resize/canvas lifecycle, adds an optional volume pane, and exposes a
  readout footer
- exported the component and model through the public barrels
- updated the alignment plan to record that host apps now have a first public
  market chart surface instead of only shell-level components

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no workbench host adapter or layout/runtime integration is bundled into this
  surface
- data loading remains host-owned; this component only mounts and renders the
  provided market bars
