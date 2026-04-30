# 0342 add strategy tester interaction v1

## Why

The existing strategy tester slice already rendered a fixture-backed shell, but
its tabs were still decorative and its equity/trade surfaces did not interact.
That left the panel short of the kind of UI behavior an `alpha2` host would
actually want to reuse.

## What changed

- made strategy tester tabs clickable so they switch visible shell sections
- added local trade/equity selection state so clicking a trade row highlights
  the corresponding equity point and vice versa
- kept the slice UI-only: there is still no real backtest engine, run control,
  parameter editing, or locate-trade callback
- added focused Playwright coverage for tab switching and selection state
- updated the alignment plan to reflect the thicker strategy tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester panel tabs and trade selection drive shell state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add run control, parameter editing, or strategy execution
- trade selection is still local panel state and does not yet drive chart locate actions
