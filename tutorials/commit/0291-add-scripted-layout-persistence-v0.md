# 0291 add scripted layout persistence v0

## Why

`Scripted Indicator V0` proved that the workbench could execute and render a canned script, but local layout save/restore and import/export still dropped that state on the floor. The next adjacent slice was to persist scripted indicators through the workbench layout layer without promoting them into engine-native chart studies too early.

## What Changed

- Extended the workbench layout schema so the active layout and workspace tabs can carry scripted indicator descriptors as workbench-owned metadata.
- Wired the demo workbench to serialize active scripted indicators into layout state and reapply them on restore/import.
- Kept scripted panes stripped out of engine `chartState`, so restore still goes through the existing demo-local script replay path instead of pretending scripts are native studies.
- Added focused unit and visual coverage for layout metadata validation and script round-trip behavior.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "layout import/export|saves and restores the active layout locally" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Scripted indicators are still not persisted as first-class chart-state studies.
- There is still no editable script library or user-authored script surface.
- Multi-host scripted persistence remains deferred with the broader active-host-only layout model.
