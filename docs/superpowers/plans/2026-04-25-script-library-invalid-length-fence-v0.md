# Script Library Invalid Length Fence V0

Date: 2026-04-25

## Goal

Make the local Script Library reject invalid custom-script length inputs before
save or add actions run.

## Scope

- keep the workbench-owned scripted runtime boundary unchanged
- keep layout persistence and script library schema unchanged
- make Script Library default-length and launch-length validation surface
  immediately in the workbench UI
- cover the invalid-input path with focused visual coverage

## Implementation Notes

- do not widen public save/add contracts to strings
- keep numeric parsing at the panel boundary
- prefer explicit reactive derived state over template helper calls for
  validation/error/disabled surfaces so Svelte updates stay deterministic

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "invalid length inputs are blocked before save or add" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
