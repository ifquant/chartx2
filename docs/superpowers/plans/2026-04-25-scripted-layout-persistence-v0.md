# Scripted Layout Persistence V0

## Goal

Keep scripted indicators workbench-owned, but make them survive local layout save/restore and import/export instead of disappearing whenever the shell round-trips through layout state.

## Scope

- [x] Extend the workbench layout schema with scripted indicator descriptors for the active layout and workspace tabs.
- [x] Keep those descriptors separate from engine `chartState`.
- [x] Persist active scripted indicators through local save/export.
- [x] Reapply scripted indicators through local restore/import and workspace snapshots.
- [x] Add focused unit and Playwright coverage for the new layout metadata path.

## Out Of Scope

- [ ] Chart-state-native scripted studies
- [ ] User-authored script editing
- [ ] Pine-compatible parsing or execution
- [ ] Multi-host scripted persistence beyond the current active-host-only layout model

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "layout import/export|saves and restores the active layout locally" --reporter=line`
- [ ] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [ ] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
