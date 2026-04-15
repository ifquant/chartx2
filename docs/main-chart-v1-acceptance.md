# Main Chart V1 Acceptance

Date: 2026-04-15

This document closes the current technical-analysis main chart pass before starting the separate trade-performance chart line. It records what is accepted as V1, what was verified, and what remains intentionally outside this release boundary.

## Accepted Scope

### Unified Main Series

- The chart now treats the main display as one main series with a chart type, builder, renderer, and style/options surface.
- Main chart types covered in this pass include candles, Heikin Ashi, line break, Kagi, point & figure, volume candles, hollow candles, Renko, bar, HLC bars, high-low, line, line with markers, step line, area, baseline, columns, and HLC area.
- `Columns` and `HLC Area` are accepted as real main chart types rather than renderer-only placeholders.

### Non-Time Main Chart Semantics

- Renko, Kagi, Point & Figure, and Line Break use synthetic main bar sequences instead of stretching raw time bars across the chart.
- Secondary panes in the workbench now derive chart-context values from the current synthetic main sequence for non-time chart types.
- Requested-context compare / moving-average data can merge back onto the current chart bars through the model-layer `StudyMergeEngine`.
- Deterministic requested-context parity contracts exist for Renko, Kagi, Line Break, and Point & Figure coverage.

### Kagi / Point & Figure Usability

- Kagi has a dedicated renderer and a configurable option surface with `auto`, `fixed`, `atr`, and `percentage` reversal modes.
- Point & Figure has a readable default auto sizing path and configurable box-size modes, including `auto`, `fixed`, `atr`, `percentage`, and `traditional`.
- These are accepted as usable V1 implementations, not exact TradingView parity.

### Readout / Legend / Axis / Formatter Contract

- Readout events expose raw numeric values and formatted display strings.
- Pane legends and demo readout UI consume the same formatted per-series values.
- Chart-level `timeScale().applyOptions({ tickMarkFormatter })` flows through time axis labels, magnet time labels, and readout time.
- Chart-level `priceScale().applyOptions({ priceFormatter })` flows through price axis labels, price-line labels, magnet price labels, OHLC readout, price readout, and default non-volume series legend/readout values.
- Series-level `valueFormatter` can override per-series legend/readout values without replacing the chart-wide price formatter.

### Drawing Baseline

- Horizontal-line and trend-line drawing tools are usable from the workbench toolbar.
- Drawing selection, deletion, minimal drag behavior, snapping/magnet controls, and drawing inspector schema/validation exist.
- Default drawings anchor to the effective current chart-type rows instead of raw candle-only demo data.

### Snapshot / Template Baseline

- Chart snapshots can persist and restore the current main-series state, panes, secondary series, overlay/compare/moving-average studies, and drawing state at the current V1 level.
- This is accepted as runtime chart-state persistence, not a full workspace/template product.

## Verification

The following checks were run during the closing pass:

- `pnpm check` PASS
- `pnpm test:unit` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench opens by default|point-figure|drawing inspector|heikin|line-break|kagi" --update-snapshots` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "line-break|renko|kagi|point-figure|columns|hlc-area|heikin|baseline|bar|high-low|hlc-bars|line-markers|stepline|area" --update-snapshots` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "requested-context"` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "applyOptions and scale handles"` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench opens by default|heikin"` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "click subscriptions and series-level options"` PASS

## Known Limits

- Non-time chart builders are readable and deterministic, but they are not strict TradingView-compatible implementations.
- `StudyMergeEngine` supports the current `carry-forward`, `exact`, and placeholder `gaps` policy, but `gaps` still behaves like `exact`.
- There is no full source-context registry for fetching and caching requested standard/nonstandard contexts.
- Per-series `valueFormatter` affects legend/readout only; it does not yet drive pane price-axis ticks.
- Formatter functions are not persisted in chart snapshots or templates.
- Drawing support is intentionally minimal: no grouping, undo/redo, z-order management, full edit handles, or advanced drawing families.
- The broad TradingView style schema surface is still much narrower than the real product.
- Chart templates are still runtime snapshots, not user-facing workspace templates with versioned migration semantics.

## Release Boundary

This V1 is acceptable as the current technical-analysis chart baseline for:

- Demonstrating many main chart types in the workbench.
- Testing non-time main charts with synthetic lower panes.
- Testing requested-context study merge behavior.
- Using basic drawings, snapping, readout, legend, and formatter behavior.
- Saving/restoring the current chart-state slice.

This V1 is not intended to be the place to add trade-performance analytics directly. Trade-performance charts should start as a separate chart family that can share lower-level infrastructure where useful, but should not inherit the technical-analysis main-series object model by default.

## Next Product Line

The next major line should be `performance-chart`, separate from the technical-analysis `main-series` path.

Initial candidate chart families:

- Equity curve
- Drawdown curve and drawdown duration
- Trade distribution / histogram
- Win/loss streaks
- MAE / MFE scatter
- Holding-time distribution
- Calendar heatmap
- Segment selection that can link back to the technical-analysis chart context

The linking boundary should be explicit: selecting a poor-performance period in a performance chart should produce a time/trade range that can locate the corresponding market context in the technical-analysis chart. It should not require performance charts to become another main-series chart type.
