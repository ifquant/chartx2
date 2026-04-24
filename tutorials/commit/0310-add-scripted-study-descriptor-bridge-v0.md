# 0310 add scripted study descriptor bridge v0

## Why

The workbench could already save and restore scripted indicators, but the
descriptor bridge still lived as demo-local object mapping in
`chartx-demo.ts`. That was enough for the current workbench-owned slice, but it
left the next promotion step starting from shell knowledge instead of an
explicit normalization contract at the workbench-layout boundary.

## What changed

- added a scripted-study descriptor normalization helper in
  `workbench-layout.ts` and routed `createWorkbenchLayoutState()` through it for
  both top-level and workspace-tab scripted descriptors
- kept the public/workbench boundary stable by treating the new bridge as an
  alias and normalization seam, not as engine-native scripted study state
- rewired the demo serialize/materialize paths to use the shared descriptor
  helper instead of open-coded ad hoc mapping
- added focused unit coverage for descriptor trimming, invalid numeric input
  cleanup, malformed descriptor rejection, and layout-state sanitization
- updated the TradingView alignment plan and recorded the execution-plan slice

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no engine-native scripted study ownership or chart-state schema changes
- no scripted overlay promotion or Pine-compatible authoring work
- no restore-path behavior changes beyond using the explicit descriptor bridge
