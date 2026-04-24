# Workbench Empty-State Surface V0

## Goal

Finish the remaining Layer 2 workstation gap around missing-data and empty-state behavior without changing chart runtime ownership.

## Scope

- [x] Extend the public workbench contract so watchlist and alerts panels carry explicit `emptyLabel` text.
- [x] Publish provider-aware empty-state copy from the demo runtime for watchlist, screener, and alerts.
- [x] Stop seeding fake demo alerts when no alerts persistence provider is attached.
- [x] Render watchlist and alerts empty states in the shell with stable selectors.
- [x] Cover the missing-provider alert empty-state path in unit and Playwright verification.

## Out Of Scope

- [ ] Full multi-document workspace tabs
- [ ] Cloud or remote alert persistence
- [ ] Rich per-panel retry and diagnostics workflows

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adapter status|workspace tabs|layout import/export|command|screener|workbench replays|layout"`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
