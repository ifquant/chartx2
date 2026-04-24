# Workbench Multi-Document Tabs V0

## Goal

Finish the last open Layer 2 workstation task by turning workspace tabs into real local chart documents instead of static focus toggles.

## Scope

- [x] Expand the public workbench tab contract from fixed semantic ids to document ids plus `viewId`.
- [x] Let the demo runtime own a local workspace document collection with create, close, and activate flows.
- [x] Make tab switches reopen per-document symbol/timeframe/chart snapshots instead of only changing sidebar focus.
- [x] Persist the workspace document collection through the existing `WorkbenchLayoutState` contract.
- [x] Render richer workspace tabs in the shell and cover switch/create/close plus import/export round-trip in tests.

## Out Of Scope

- [ ] Cloud workspace sync
- [ ] Free-form tab renaming
- [ ] Cross-window or multi-runtime workspace sharing

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workspace tabs|adapter status|layout import/export|command|screener|workbench replays|layout"`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
