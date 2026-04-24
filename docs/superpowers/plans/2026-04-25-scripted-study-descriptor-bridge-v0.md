# Scripted Study Descriptor Bridge V0

Date: 2026-04-25

## Goal

Add an explicit workbench-owned normalization seam for scripted study
descriptors so save, restore, export, and import stop depending on demo-local
open-coded mapping. This is a bridge toward later chart-state promotion, not
engine-native scripted studies yet.

## Scope

- add a public helper in `src/lib/chartx/public/workbench-layout.ts` that
  normalizes scripted study/scripted indicator descriptors
- route `createWorkbenchLayoutState()` through that helper for top-level and
  workspace-tab scripted descriptor payloads
- rewire `src/lib/demo/chartx-demo.ts` serialize/materialize paths to use the
  shared helper instead of raw object copies
- add focused Vitest coverage for descriptor trimming, invalid-input cleanup,
  invalid-descriptor rejection, and layout-state sanitization
- update alignment notes and record the slice in a checked-in tutorial

## Non-goals

- no engine-native scripted study ownership
- no `getChartState()` or `applyChartState()` contract changes
- no Pine compatibility, overlay promotion, or chart-state schema widening

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
