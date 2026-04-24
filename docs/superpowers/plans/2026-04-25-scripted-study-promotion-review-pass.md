# Scripted Study Promotion Review Pass

Date: 2026-04-25

## Goal

Audit the scripted-study bridge work completed so far and record the exact
 boundaries that still block promotion into first-class engine-native
 chart-state studies.

## Reviewed Inputs

- `bbb29f6` `docs(chartx2-workbench): add script-system next-wave execution plan`
- `13715cb` `feat(chartx2-workbench): add script-library delete confirmation`
- `638cecb` `fix(chartx2-workbench): fence dirty script-library draft switches`
- `e4257dc` `refactor(chartx2-workbench): add scripted study descriptor normalization`
- `901e7a5` `refactor(chartx2-workbench): route scripted study restore through descriptors`

## Confirmed Progress

- Script Library management is now locally safe enough to support further
  script-system work without one-click destructive actions or silent dirty-draft
  replacement.
- Layout persistence now has an explicit normalized scripted-study descriptor
  seam, and restore/import replay uses that same descriptor bridge instead of
  demo-local ad hoc mappings.
- Scripted studies still round-trip through workbench-owned metadata rather
  than through engine-native chart-state `studies`.

## Still Not Promoted

- `chartState.studies` still does not contain a scripted study variant.
- `getChartState()` still strips scripted panes before persistence.
- `applyChartState()` still does not know how to mount scripted studies.
- Script execution is still workbench-owned and driven by demo/runtime helpers,
  not by a chart-engine study/source contract.
- The current bridge still depends on saved `scriptId` resolution against the
  workbench script library.

## Next Required Promotion Steps

- add an engine-owned scripted study snapshot shape before touching public
  layout/chart-state claims
- add an engine-side restore/mount seam for scripted studies that does not rely
  on demo-local `addLineSeries` composition
- decide whether scripted chart-state snapshots embed script definitions or
  resolve through a versioned external library reference
- preserve backward compatibility for existing workbench layouts that still use
  `scriptedIndicators` outside `chartState`

## Explicitly Deferred

- Pine-compatible parsing or execution
- overlay scripted-study promotion
- engine-native strategy/backtest integration
- replacing the workbench script library with a global/cloud script store

## Verification

- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
