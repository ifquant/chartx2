# 0311 add scripted study chart-state restore v0

## Why

Task 3 added a normalized scripted-study descriptor seam in
`workbench-layout.ts`, but demo restore still rebuilt scripted studies through
ad hoc `DemoActiveIndicator[]` storage. This slice hardens the workbench-owned
bridge so local restore and layout import both reattach scripted studies
through one descriptor-based helper.

## What changed

- host and workspace snapshot records in
  `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts` now keep
  scripted studies as `WorkbenchLayoutScriptedStudyDescriptor[]`
- restore and import now flow through one helper that resolves the saved
  `scriptId`, rebuilds the runtime catalog entry, and replays the scripted
  study with persisted `inputValues`
- the focused Playwright case exercises save, reset, restore, export, reset,
  and import for a custom scripted study

## Boundary

- the change stays workbench-owned
- chart state still strips scripted panes before persistence
- this does not add engine-native scripted studies, Pine compatibility, or
  overlay promotion

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "scripted studies round-trip through restore" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
