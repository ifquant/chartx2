# 0293 add user-authored script library v0

## Why

`Scripted Indicator Inputs V1` made canned scripts parameterizable, but the
workbench still had no way to author or keep its own saved script presets.
The next adjacent slice was to add a minimal user-authored script library that
stays workbench-owned, round-trips through layout state, and reuses the
existing scripted-indicator runtime instead of pretending scripts are already
engine-native studies.

## What Changed

- Added a custom-script definition path on top of the existing AST-based
  script runtime and taught the layout schema to persist saved custom script
  definitions beside mounted scripted indicators.
- Switched the indicator catalog from a static builtin-only list to a builder
  that appends saved custom script entries, so restore/import can rebuild the
  catalog before replaying mounted scripted indicators.
- Extended the Indicators card with a small script-library editor for creating,
  editing, and deleting structured SMA presets, while keeping add-to-chart on
  the existing scripted-indicator path.
- Added focused unit coverage for custom script definitions, dynamic catalog
  entries, and layout validation, plus a visual test that creates a custom
  script, mounts it, exports it, resets, and imports it back.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|layout import/export|adds indicators|object tree reflects indicators and drawings|saves and restores the active layout locally" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Scripts are still not first-class chart-state studies.
- Authoring is still a structured local SMA preset form, not a freeform script
  editor or parser.
- Pine compatibility, strategy execution, and richer script-library management
  remain deferred.
