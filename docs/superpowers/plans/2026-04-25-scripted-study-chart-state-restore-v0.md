# Scripted Study Chart-State Restore V0

Date: 2026-04-25

## Goal

Harden scripted-study restore so workbench save, local restore, export, and
import all rebuild mounted scripted studies through one descriptor-based helper
path instead of open-coded `DemoActiveIndicator` replay.

## Scope

- keep scripted-study restore owned by `src/lib/demo/chartx-demo.ts`
- consume the normalized layout/workspace descriptor bridge from Task 3
- cover local restore and layout import with one focused Playwright case

## Non-Goals

- engine-native scripted studies
- new chart-state study types
- Pine compatibility
- scripted overlay promotion

## Implementation Notes

- persist host and workspace scripted studies as
  `WorkbenchLayoutScriptedStudyDescriptor[]`
- restore scripted studies through one helper that resolves the saved
  definition, rebuilds the runtime catalog entry, and reattaches the study with
  saved `inputValues`
- keep chart-state snapshots stripped of scripted panes; the descriptor bridge
  remains the workbench-owned restore seam

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "scripted studies round-trip through restore" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
