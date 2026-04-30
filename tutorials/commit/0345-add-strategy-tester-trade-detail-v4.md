# 0345 add strategy tester trade detail v4

## Why

The strategy tester shell could already switch tabs, filter trades, and show
run metadata, but it still stopped at local row selection. That was too thin
for reuse in `alpha2`, because a real tester surface also needs a selected
trade inspector and a clear path for locating that trade back on the chart.

## What changed

- extended the public strategy tester contract with optional selected-trade
  detail payloads and locate-intent metadata
- rendered a selected trade detail card inside the reusable strategy tester
  panel, with readonly fields and a locate button
- wired that locate button into the existing `TradeLocationIntent ->
  workbench.locateTrade(...)` seam instead of inventing a new tester-only path
- added focused Playwright coverage proving the detail card updates with row
  selection and that the locate action reaches the workbench activity log
- updated the alignment plan to record the thicker tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester selected trade detail can drive the existing locate-trade shell" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add editable trade annotations or tester-side order replay
- locate state still flows through the existing workbench chart and activity log, not a dedicated strategy engine surface
