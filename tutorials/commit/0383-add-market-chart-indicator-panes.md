# 0383 add market chart indicator panes

## Background

`alpha2_tech` needs the main K-line chart and attached technical indicators to share one chart layout
instead of rendering indicators as a separate host-side DOM/SVG stack. The attached panes need to
belong to chartx2 so pane spacing, canvas geometry, and future crosshair behavior stay under the
chart engine boundary.

## Changes

- Added public market chart surface indicator pane models and readout normalization.
- Let `PhaseOneMarketChartSurface` create volume, histogram, and line series inside chartx2 panes.
- Exposed configurable pane gap through chart options so dense trading layouts can keep attached
  panes visually connected.
- Changed the surface MA line to use overlay series rather than a second primary series.

## Verification

- `pnpm --filter @chartx2/library test:unit -- phase-one-market-chart-surface chart-default-options`
- `pnpm release:local`

## Not Included

- Indicator formulas are still supplied by the host rather than calculated inside chartx2.
- Crosshair-linked per-pane readouts are not implemented yet.
