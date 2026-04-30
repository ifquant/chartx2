# 0344 add strategy tester run metadata v3

## Why

The strategy tester shell could already render summary metrics, tabs, and local
filters, but it still had no explicit place for parameter-set or run-context
data. That made the host-facing contract thinner than the eventual `alpha2`
tester surface, which will need to show run metadata even before a real engine
owns editing or execution.

## What changed

- extended the public strategy tester contract with readonly run-metadata items
- mounted those items as compact parameter/run chips near the top of the panel
- kept the slice UI-only: there is still no editable parameter form and no
  backtest execution path in `chartx2`
- added focused Playwright coverage for fixture-backed run metadata
- updated the alignment plan to record the thicker tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester surfaces fixture-backed run metadata through the panel contract" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add editable parameter sets or run switching
- strategy execution and persistence still stay outside `chartx2`
