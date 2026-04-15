# Readout / Legend / Axis Formatter Contract

This contract keeps chart display values deterministic across the canvas axis, pane legends, `chartx:readout`, crosshair events, click events, and demo UI.

## Raw and formatted values

- Event payloads keep raw numeric values for programmatic consumers.
- Event payloads also include formatted strings for UI consumers.
- `PhaseOneReadoutDetail.formatted` owns top-level `time`, `open`, `high`, `low`, `close`, and `price` display strings.
- `PhaseOneReadoutSeriesDetail.formattedValue` owns per-series legend/readout display strings.

## Formatter ownership

- `timeScale().applyOptions({ tickMarkFormatter })` controls time axis labels, magnet time labels, and readout time strings.
- `priceScale().applyOptions({ priceFormatter })` controls primary price axis labels, price-line labels, magnet price labels, OHLC readout strings, and non-volume series legend/readout values.
- `series.applyOptions({ valueFormatter })` overrides the chart-wide price formatter for that series' legend/readout value.
- Volume series ignore the primary price formatter and use compact volume formatting (`K`, `M`, `B`) for both volume axis and legend/readout values unless the volume series defines its own `valueFormatter`.

## Chart-context behavior

- The readout is always expressed on the current chart context and current logical bar sequence.
- Non-time main chart types still emit numeric OHLC/time values, but UI should prefer the formatted strings when rendering readout or legend text.
- Requested-context studies keep their raw merged values in `value`, and their display text in `formattedValue` after merging back onto the current chart bars.

## Current limitations

- The first per-series formatter policy only covers legend/readout values; it does not yet affect pane price-axis ticks for that series.
- The primary `priceFormatter` remains chart-wide for top-level OHLC/price readout values and axis labels.
- `gaps` merge behavior is still equivalent to `exact`; formatter output does not currently distinguish whitespace bars.
