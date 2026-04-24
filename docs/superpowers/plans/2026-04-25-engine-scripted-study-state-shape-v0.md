# Engine Scripted Study State Shape V0

Date: 2026-04-25

## Goal

Define the engine-owned scripted-study snapshot and source shape so chart state
can represent scripted studies as first-class study variants without adding
restore, mount, or execution plumbing yet.

## Scope

- widen the internal indicator/source model with a scripted-study variant
- extend chart-state snapshot types with a dedicated scripted-study study shape
- let chart-state snapshot builders serialize scripted-study sources into the
  new state payload
- add focused unit coverage for the new snapshot/state contract

## Non-Goals

- no scripted-study restore or mount plumbing
- no workbench script-library behavior changes
- no Pine compatibility, overlay scripted studies, or engine execution

## Implementation Notes

- keep `studyKind: "indicator"` and widen the engine-owned `indicator` payload
  instead of creating a new study-kind branch
- model scripted-study persistence around `scriptId`, normalized numeric
  `inputValues`, and the same input-context fields already used by moving
  average study snapshots
- preserve the current workbench-owned descriptor bridge as the active restore
  path until a later promotion task consumes the new chart-state variant

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-snapshot-builders.test.ts tests/unit/chart-api-types.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
