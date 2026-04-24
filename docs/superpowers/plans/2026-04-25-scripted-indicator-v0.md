# Scripted Indicator V0

## Goal

Start Layer 3 with the smallest real script-system slice: one local scripted indicator that executes safely and shows up through the current workbench indicator flow.

## Scope

- [x] Add a narrow workbench-local `workbench-scripts` runtime with a typed V0 expression model.
- [x] Support deterministic source-field access, bounded SMA, and simple arithmetic.
- [x] Return structured execution failures instead of uncaught runtime errors.
- [x] Expose one canned scripted indicator through the workbench catalog.
- [x] Execute that script against the active bar payload in the demo and attach the output to the chart.
- [x] Reflect the scripted indicator in the active-indicator list and object tree.
- [x] Keep layout/host/workspace snapshots from persisting unlabeled scripted panes.
- [x] Add focused unit and visual coverage.

## Out Of Scope

- [ ] Editable user-authored scripts
- [ ] First-class script persistence in chart state snapshots
- [ ] Strategy scripts
- [ ] Pine-compatible parser or transpiler

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adds indicators|object tree reflects indicators|workspace tabs|layout import/export|command|adapter status"`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
