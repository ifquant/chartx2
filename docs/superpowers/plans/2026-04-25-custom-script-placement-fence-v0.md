# Custom Script Placement Fence V0

## Goal

Prevent the workbench custom-script editor from advertising overlay placement
before the runtime can render scripted overlays without leaking them into
engine chart state persistence.

## Scope

- [x] Reject `overlay` during custom-script draft validation.
- [x] Mark the Script Library overlay placement option as disabled in the UI.
- [x] Explain in the workbench form that custom scripts currently save as
  separate-pane studies only.
- [x] Add focused unit and Playwright coverage for the placement fence.

## Boundaries

- [x] Keep builtin scripted catalog entries unchanged.
- [x] Do not implement true scripted overlay rendering in this slice.
- [x] Do not change the workbench-owned script persistence model.

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] True overlay rendering for custom scripted indicators
- [ ] Chart-state-native scripted studies
- [ ] Structured AST builder UI
