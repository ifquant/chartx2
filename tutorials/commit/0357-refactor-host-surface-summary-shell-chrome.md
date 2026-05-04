# 0357 refactor host surface summary shell chrome

## Why

By this point `sharing`, `strategy tester`, `trading ticket`, and `account
sync` all had external summary shells, but each card carried its own duplicated
layout chrome. That made the host-embedding pattern drift even though the
interaction model was the same.

## What changed

- added a shared `HostSurfaceSummaryCard` base component for summary-shell
  chrome
- rewired share, strategy tester, trading ticket, and account sync summary
  cards onto the shared base while preserving their existing public selectors
- kept the specialized bodies intact so only the host-shell chrome was unified

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: published artifacts project into a reusable summary card shell|strategy tester projects into a reusable summary shell outside the panel body|trading ticket projects into a reusable summary shell outside the panel body|account sync projects into a reusable summary shell outside the sidebar card" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no consolidation of the underlying public summary models
- no new host container, gallery, or summary-shell registry
