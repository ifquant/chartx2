# 0386 Add Market Chart Right Dock

## Why

Terminal-style chart workspaces often need a narrow market panel docked inside the chart surface. If hosts place that panel as a sibling grid column, the result looks like separate cards instead of one chart component.

## What Changed

- Added `rightDockMode` to the market chart surface layout contract.
- Added `rightDock`, `rightDockOpen`, and `rightDockWidth` props to `PhaseOneMarketChartSurface`.
- Rendered the dock as an overlay inside the chart body so host panels can live in the chart surface without reaching into internal DOM.
- Added stable `data-phase-one-market-chart-right-dock` and body attributes for host/browser tests.

## Verification

- `pnpm --filter @chartx2/library check`
- `pnpm --filter @chartx2/library test:unit`

## Notes

- The dock owns only layout and chrome. Domain-specific panel content remains a host responsibility.
