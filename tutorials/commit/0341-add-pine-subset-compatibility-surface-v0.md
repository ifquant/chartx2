# 0341 add pine subset compatibility surface v0

## Why

The script system still lacked an explicit compatibility surface for the future
Pine-oriented path. We already had a bounded local subset runtime, but the UI
did not say whether a saved script was targeting the native chartx subset or a
Pine-compatible subset candidate.

## What changed

- added authoring-surface metadata to custom script definitions and drafts
- added compatibility analysis helpers that classify scripts as `native`,
  `candidate`, or `incompatible` for the selected surface
- surfaced `Pine subset v0` compatibility labels and notes in the editor and in
  saved custom-script rows
- kept execution unchanged: this is metadata/editor surface only, not a new
  Pine runtime
- updated the alignment plan to mark the Pine-compatible subset surface item complete

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: pine subset metadata surfaces in the editor and saved rows" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not implement Pine runtime evaluation or import/export
- compatibility labels still describe the supported local subset, not full Pine parity
