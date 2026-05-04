# 0358 add workbench host summary surface registry

## Why

The summary cards for strategy, trading, and account sync already existed, but
the workbench footer still decided what to mount through hardcoded demo-shell
checks. That made the host integration seam less reusable than it needed to be.

## What changed

- added `hostSummarySurfaces` to the public `ChartWorkbenchModel`
- published the footer summary shell registry from the demo runtime instead of
  relying on panel-local conditionals
- rewired the workbench footer to render summary cards from the public registry
  while keeping the existing specialized cards and selectors unchanged

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester projects into a reusable summary shell outside the panel body|trading ticket projects into a reusable summary shell outside the panel body|account sync projects into a reusable summary shell outside the sidebar card" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run /Users/dev/workspace2/hc_apps/chartx2/tests/unit/workbench-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no generic summary-card renderer beyond the existing specialized cards
- no share-summary registration in the footer strip; that remains outside this
  host-summary registry
