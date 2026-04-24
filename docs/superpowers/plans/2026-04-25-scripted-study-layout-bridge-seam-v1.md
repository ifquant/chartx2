## Goal

Reduce drift between the workbench-owned scripted-study descriptor bridge and
the new engine-owned `chartState.studies[].type === "scripted-study"` restore
seam without widening into engine-native script execution work.

## Scope

- make the workbench layout descriptor reuse engine `scripted-study`
  `studyOptions` as its canonical payload
- keep layout/workspace save, restore, export, import, and custom-script
  library behavior intact
- normalize legacy saved descriptor payloads on load/import so older
  `scriptId`/`inputValues` layouts still restore
- add focused unit coverage for the bridge normalization path
- update the alignment plan and commit tutorial

## Non-Goals

- no Pine compatibility
- no overlay scripted-study support
- no `PhaseOneChartApi` redesign
- no engine-native script execution rewrite

## Implementation Notes

- keep workbench descriptors for label/id/placement metadata, but make the
  script payload itself come from the engine `studyOptions` contract
- use migration normalization at the layout boundary instead of keeping two
  silent top-level payload shapes alive inside the demo
- keep malformed persisted payloads rejected by `isWorkbenchLayoutState()` even
  while provider/import normalization accepts valid legacy layouts

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
