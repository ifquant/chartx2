# 0298 add ast builder v0

## Why

The script authoring line had already widened from a single SMA preset to the
runtime’s recursive AST subset, but the UI was still asking users to type those
expressions by hand. The next adjacent step was to make the AST itself the live
editor model without changing the workbench-owned save/run/persistence
contracts.

## What Changed

- Added a recursive Script Expression Builder component that edits the existing
  `input | sma(expr, length) | subtract(left, right)` subset directly.
- Replaced raw expression textarea entry in the Script Library form with the
  structured builder and a read-only canonical formula preview.
- Kept save compatibility by formatting the edited AST back into canonical
  `expressionText` before calling the existing controller contract.
- Updated the browser test helpers so custom script authoring now goes through
  builder interactions rather than raw text fill.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- The builder still targets only the existing three-node runtime subset.
- The save/run boundary is unchanged: scripts remain workbench-owned metadata.
- Advanced text import and typed numeric form state are still deferred.
