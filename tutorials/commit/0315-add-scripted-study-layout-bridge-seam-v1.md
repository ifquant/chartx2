# 0315 add scripted study layout bridge seam v1

## Why

`0314` made engine chart-state restore understand `scripted-study`, but the
workbench layout bridge still carried its own top-level `scriptId` and
`inputValues` shape. That left two nearby contracts representing the same
script payload, with no explicit seam preventing them from drifting apart as
restore and layout persistence continued to evolve.

This commit tightens that seam without widening scope. The workbench still owns
descriptor metadata such as `id`, `label`, and `placement`, but the actual
script payload now reuses the engine `scripted-study.studyOptions` contract so
the migration boundary is explicit and load/import can normalize older layouts
into one canonical shape.

## What Changed

- changed the workbench scripted-study descriptor bridge to store engine-shaped
  `studyOptions` instead of ad hoc top-level `scriptId` and `inputValues`
- added layout normalization that upgrades legacy saved descriptors into the
  canonical `studyOptions` seam during provider load and raw import
- kept strict persisted-state validation so malformed scripted payloads still
  fail `isWorkbenchLayoutState()` instead of being silently accepted
- rewired the demo’s script-library `inUse` checks and descriptor replay path
  to read the canonical `studyOptions` payload
- extended focused workbench-layout tests to cover canonical normalization,
  legacy migration, and provider-load upgrade behavior
- updated the tradingview alignment plan and added this execution note

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- no Pine compatibility
- no overlay scripted-study migration
- no change to the public phase-one chart API
- no broader rewrite from descriptor replay into full engine-native script
  execution ownership
